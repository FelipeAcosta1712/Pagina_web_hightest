-- ═══════════════════════════════════════════════════════════════════
-- HIGH TEST SAS - CORRECCIÓN de la RPC registrar_acceso_cliente
--
-- Motivo: la inspección real mostró que clientes.id es de tipo UUID
-- (no bigint). Esta versión re-crea la RPC con p_cliente_id uuid,
-- deja sin efecto la versión anterior (bigint) y re-aplica los
-- permisos exclusivos para service_role.
--
-- Idempotente y no destructivo. Ejecutar en Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION registrar_acceso_cliente(
    p_cliente_id uuid,
    p_tipo       text,
    p_exitoso    boolean,
    p_motivo     text DEFAULT ''
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_historial      jsonb;
    v_ultimo_exitoso timestamptz;
    v_now            timestamptz := now();
    v_evento         jsonb;
BEGIN
    -- Validación de parámetros: sin ellos no se registran eventos ni
    -- se alteran contadores (evita inconsistencias).
    IF p_cliente_id IS NULL
       OR p_tipo IS NULL
       OR p_exitoso IS NULL THEN
        RETURN;
    END IF;

    SELECT accesos_historial, ultimo_acceso
      INTO v_historial, v_ultimo_exitoso
      FROM clientes
     WHERE id = p_cliente_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    IF v_historial IS NULL OR jsonb_typeof(v_historial) <> 'array' THEN
        v_historial := '[]'::jsonb;
    END IF;

    IF p_tipo NOT IN ('login', 'visita') THEN
        RETURN;
    END IF;
    IF p_tipo = 'visita' AND NOT p_exitoso THEN
        RETURN;
    END IF;

    IF p_tipo = 'visita'
       AND v_ultimo_exitoso IS NOT NULL
       AND v_ultimo_exitoso > v_now - INTERVAL '30 minutes' THEN
        RETURN;
    END IF;

    v_evento := jsonb_build_object(
        'fecha',   v_now,
        'tipo',    p_tipo,
        'exitoso', p_exitoso,
        'motivo',  COALESCE(p_motivo, '')
    );

    UPDATE clientes SET
        total_ingresos = COALESCE(total_ingresos, 0) + 1,
        total_logins   = COALESCE(total_logins, 0) +
            CASE WHEN p_tipo = 'login' AND p_exitoso   THEN 1 ELSE 0 END,
        total_visitas  = COALESCE(total_visitas, 0) +
            CASE WHEN p_tipo = 'visita'                THEN 1 ELSE 0 END,
        total_fallidos = COALESCE(total_fallidos, 0) +
            CASE WHEN p_tipo = 'login' AND NOT p_exitoso THEN 1 ELSE 0 END,
        ultimo_acceso  = CASE WHEN p_exitoso THEN v_now ELSE ultimo_acceso END,
        accesos_historial = (
            -- Conserva solo los últimos 100 eventos, en orden cronológico.
            -- jsonb_agg(...) WITH ORDINALITY: el orden es garantizado por la
            -- cláusula ORDER BY dentro de la agregación (sin ORDER BY externo).
            SELECT COALESCE(jsonb_agg(ult.e ORDER BY ult.ord ASC), '[]'::jsonb)
            FROM (
                SELECT e, ord
                FROM jsonb_array_elements(v_historial || v_evento)
                     WITH ORDINALITY AS t(e, ord)
                ORDER BY ord DESC
                LIMIT 100
            ) ult
        )
    WHERE id = p_cliente_id;
END;
$$;

-- Firma completa en REVOKE y GRANT (versión uuid)
REVOKE ALL ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    FROM anon;
REVOKE ALL ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    FROM authenticated;
GRANT EXECUTE ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    TO service_role;

-- Retira la versión con firma bigint (queda solo la uuid)
DROP FUNCTION IF EXISTS registrar_acceso_cliente(bigint, text, boolean, text);
