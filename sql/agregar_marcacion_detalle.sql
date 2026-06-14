-- =============================================
-- AGREGAR COLUMNAS DE MARCACIÓN A detalle_procesos_ac
-- =============================================
-- Flujo:
--   - El técnico visualiza los items en "Ver Marcación"
--   - Marca cada elemento: Pendiente / Marcado / Revisado / No Conforme
--   - Puede agregar observación técnica por item

-- 1. Agregar columna marcacion con default 'Pendiente'
ALTER TABLE detalle_procesos_ac
ADD COLUMN IF NOT EXISTS marcacion VARCHAR(50) DEFAULT 'Pendiente';

-- 2. Agregar columna observacion_tecnica
ALTER TABLE detalle_procesos_ac
ADD COLUMN IF NOT EXISTS observacion_tecnica TEXT DEFAULT '';

-- 3. Verificar resultado
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'detalle_procesos_ac'
ORDER BY ordinal_position;
