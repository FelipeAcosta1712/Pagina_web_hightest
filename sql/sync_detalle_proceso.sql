-- =============================================
-- sync_detalle_proceso: UPSERT atómico con transacción
-- =============================================
-- Parámetros:
--   p_proceso_id  BIGINT   — ID del proceso
--   p_detalle     JSONB    — Array JSON con [{ensayo_id, cantidad, cantidad_entregada, marca, observaciones}]
--
-- Retorna:
--   Table (id, proceso_id, ensayo_id, cantidad, cantidad_entregada, marca, observaciones)
--
-- IMPORTANTE: RETURNS TABLE crea variables implícitas con los mismos nombres
-- que las columnas de la tabla. TODAS las referencias a columnas deben llevar
-- alias de tabla para evitar ambigüedad con esas variables.
--
-- REGLA SET: Las cláusulas SET NUNCA llevan alias de tabla.
--   Correcto: SET observaciones = dg.best_observaciones
--   Incorrecto: SET d.observaciones = dg.best_observaciones

CREATE OR REPLACE FUNCTION sync_detalle_proceso(
    p_proceso_id BIGINT,
    p_detalle JSONB
)
RETURNS TABLE (
    id BIGINT,
    proceso_id BIGINT,
    ensayo_id BIGINT,
    cantidad INTEGER,
    cantidad_entregada INTEGER,
    marca VARCHAR,
    observaciones TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- ═══════════════════════════════════════════════════════
    -- FASE 1: Bloquear filas existentes
    -- ═══════════════════════════════════════════════════════
    PERFORM 1 FROM detalle_procesos_ac t1
    WHERE t1.proceso_id = p_proceso_id
    FOR UPDATE;

    -- ═══════════════════════════════════════════════════════
    -- FASE 2: Consolidar duplicados existentes
    -- Conservar menor id, mejor observaciones y marca.
    -- NO tocar cantidad (la define FASE 4).
    -- ORDER BY id ASC garantiza selección determinista.
    -- ═══════════════════════════════════════════════════════
    WITH duplicate_groups AS (
        SELECT
            MIN(dg_src.id) AS keep_id,
            dg_src.ensayo_id,
            COALESCE(dg_src.marca, '') AS marca,
            (ARRAY_AGG(dg_src.observaciones ORDER BY dg_src.id)
                FILTER (WHERE dg_src.observaciones IS NOT NULL AND dg_src.observaciones != '')
            )[1] AS best_observaciones
        FROM detalle_procesos_ac dg_src
        WHERE dg_src.proceso_id = p_proceso_id
        GROUP BY dg_src.ensayo_id, COALESCE(dg_src.marca, '')
        HAVING COUNT(*) > 1
    ),
    do_consolidate_update AS (
        UPDATE detalle_procesos_ac d
        SET observaciones = dg.best_observaciones
        FROM duplicate_groups dg
        WHERE d.id = dg.keep_id
        RETURNING d.id
    )
    DELETE FROM detalle_procesos_ac d
    USING duplicate_groups dg
    WHERE d.proceso_id = p_proceso_id
      AND d.ensayo_id = dg.ensayo_id
      AND COALESCE(d.marca, '') = dg.marca
      AND d.id != dg.keep_id;

    -- ═══════════════════════════════════════════════════════
    -- FASE 3: Eliminar filas huérfanas
    -- ═══════════════════════════════════════════════════════
    WITH new_keys AS (
        SELECT DISTINCT
            (j->>'ensayo_id')::BIGINT AS j_ensayo_id,
            COALESCE(NULLIF(j->>'marca', ''), '') AS j_marca
        FROM jsonb_array_elements(p_detalle) AS j
    )
    DELETE FROM detalle_procesos_ac d
    WHERE d.proceso_id = p_proceso_id
      AND NOT EXISTS (
          SELECT 1 FROM new_keys nk
          WHERE nk.j_ensayo_id = d.ensayo_id
            AND nk.j_marca = COALESCE(d.marca, '')
      );

    -- ═══════════════════════════════════════════════════════
    -- FASE 4: UPSERT — la cantidad definitiva viene de aquí
    -- ═══════════════════════════════════════════════════════
    WITH normalized_input AS (
        SELECT
            (j->>'ensayo_id')::BIGINT AS j_ensayo_id,
            (j->>'cantidad')::INTEGER AS j_cantidad,
            COALESCE((j->>'cantidad_entregada')::INTEGER, 0) AS j_cantidad_entregada,
            COALESCE(NULLIF(j->>'marca', ''), '') AS j_marca,
            COALESCE(j->>'observaciones', '') AS j_observaciones
        FROM jsonb_array_elements(p_detalle) AS j
    ),
    consolidated_input AS (
        SELECT
            s.j_ensayo_id,
            MAX(s.j_cantidad) AS s_cantidad,
            MAX(s.j_cantidad_entregada) AS s_cantidad_entregada,
            s.j_marca,
            (ARRAY_AGG(s.j_observaciones ORDER BY s.j_ensayo_id)
                FILTER (WHERE s.j_observaciones <> '')
            )[1] AS s_observaciones
        FROM normalized_input s
        GROUP BY s.j_ensayo_id, s.j_marca
    )
    INSERT INTO detalle_procesos_ac
        (proceso_id, ensayo_id, cantidad, cantidad_entregada, marca, observaciones)
    SELECT
        p_proceso_id,
        ci.j_ensayo_id,
        ci.s_cantidad,
        ci.s_cantidad_entregada,
        ci.j_marca,
        ci.s_observaciones
    FROM consolidated_input ci
    ON CONFLICT ON CONSTRAINT uq_proceso_ensayo_marca
    DO UPDATE SET
        cantidad = EXCLUDED.cantidad,
        cantidad_entregada = EXCLUDED.cantidad_entregada,
        observaciones = EXCLUDED.observaciones;

    -- ═══════════════════════════════════════════════════════
    -- FASE 5: Retornar estado final
    -- ═══════════════════════════════════════════════════════
    RETURN QUERY
    SELECT d.id, d.proceso_id, d.ensayo_id, d.cantidad, d.cantidad_entregada, d.marca::VARCHAR, d.observaciones
    FROM detalle_procesos_ac d
    WHERE d.proceso_id = p_proceso_id
    ORDER BY d.id ASC;
END;
$$;
