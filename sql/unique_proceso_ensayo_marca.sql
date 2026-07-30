-- =============================================
-- RESTRICCIÓN UNIQUE: proceso_id + ensayo_id + marca
-- =============================================
-- Previene duplicados a nivel de base de datos.
-- Ejecutar ANTES de deployear sync_detalle_proceso.

-- 1. Consolidar duplicados existentes
--    Conservar menor id, mejor observaciones (determinista por id ASC).
--    NO modificar cantidad (la define el frontend).
WITH duplicates AS (
    SELECT 
        MIN(id) AS keep_id,
        proceso_id,
        ensayo_id,
        COALESCE(marca, '') AS marca,
        (ARRAY_AGG(observaciones ORDER BY id)
            FILTER (WHERE observaciones IS NOT NULL AND observaciones != '')
        )[1] AS best_observaciones
    FROM detalle_procesos_ac
    GROUP BY proceso_id, ensayo_id, COALESCE(marca, '')
    HAVING COUNT(*) > 1
),
do_update AS (
    UPDATE detalle_procesos_ac d
    SET observaciones = dup.best_observaciones
    FROM duplicates dup
    WHERE d.id = dup.keep_id
    RETURNING d.id
)
DELETE FROM detalle_procesos_ac
WHERE id IN (
    SELECT d.id FROM detalle_procesos_ac d
    JOIN duplicates dup
      ON d.proceso_id = dup.proceso_id
     AND d.ensayo_id = dup.ensayo_id
     AND COALESCE(d.marca, '') = dup.marca
     AND d.id != dup.keep_id
);

-- 2. Normalizar marca: convertir NULL a '' y fijar DEFAULT
UPDATE detalle_procesos_ac SET marca = '' WHERE marca IS NULL;

ALTER TABLE detalle_procesos_ac
ALTER COLUMN marca SET DEFAULT '';

-- 3. NOT NULL constraint: impedir marca NULL
ALTER TABLE detalle_procesos_ac
ALTER COLUMN marca SET NOT NULL;

-- 4. UNIQUE constraint: impedir duplicados futuros (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_proceso_ensayo_marca'
    ) THEN
        ALTER TABLE detalle_procesos_ac
        ADD CONSTRAINT uq_proceso_ensayo_marca
        UNIQUE (proceso_id, ensayo_id, marca);
    END IF;
END $$;

-- 5. Verificar
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'detalle_procesos_ac'::regclass
  AND contype IN ('u', 'c');
