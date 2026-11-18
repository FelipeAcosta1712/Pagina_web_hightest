-- ═══════════════════════════════════════════════════════════════════
-- HIGH TEST SAS - Evento password_reset para auditoría
--
-- Archivo : sql/crear_restablecimiento_password_clientes.sql
-- Basado en la versión VIGENTE de la RPC (firma uuid, ver
-- sql/corregir_rpc_registrar_acceso_cliente.sql).
--
-- Qué hace:
--   - Acepta el tipo 'password_reset' en registrar_acceso_cliente.
--   - password_reset SOLO agrega el evento al historial (máx 100).
--   - NO incrementa total_ingresos/logins/visitas.
--   - NO modifica ultimo_acceso.
--   - NO altera eventos históricos existentes.
--   - Conserva el acceso exclusivo de service_role.
--   - NO elimina funciones históricas (sin DROP).
--
-- Idempotente y no destructivo. Ejecutar en Supabase SQL Editor.
-- No toca contraseñas, sesiones ni datos de clientes.
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
    -- se alteran contadores.
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
        RETURN;  -- cliente inexistente: no registra nada
    END IF;

    IF v_historial IS NULL OR jsonb_typeof(v_historial) <> 'array' THEN
        v_historial := '[]'::jsonb;
    END IF;

    -- Tipos permitidos
    IF p_tipo NOT IN ('login', 'visita', 'password_reset') THEN
        RETURN;
    END IF;
    -- No existen visitas ni restablecimientos "fallidos"
    IF p_tipo = 'visita' AND NOT p_exitoso THEN
        RETURN;
    END IF;
    IF p_tipo = 'password_reset' AND NOT p_exitoso THEN
        RETURN;
    END IF;

    -- Deduplicación de visitas (30 min desde el último acceso exitoso)
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
        -- password_reset NO cuenta como ingreso
        total_ingresos = CASE WHEN p_tipo = 'password_reset'
            THEN total_ingresos
            ELSE COALESCE(total_ingresos, 0) + 1 END,
        total_logins   = COALESCE(total_logins, 0) +
            CASE WHEN p_tipo = 'login' AND p_exitoso THEN 1 ELSE 0 END,
        total_visitas  = COALESCE(total_visitas, 0) +
            CASE WHEN p_tipo = 'visita' THEN 1 ELSE 0 END,
        total_fallidos = COALESCE(total_fallidos, 0) +
            CASE WHEN p_tipo = 'login' AND NOT p_exitoso THEN 1 ELSE 0 END,
        -- password_reset NO actualiza ultimo_acceso
        ultimo_acceso  = CASE WHEN p_exitoso AND p_tipo <> 'password_reset'
            THEN v_now ELSE ultimo_acceso END,
        accesos_historial = (
            -- Conserva solo los últimos 100 eventos, en orden cronológico.
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

-- Permisos exclusivos para el backend (service_role), firma uuid
REVOKE ALL ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    FROM anon;
REVOKE ALL ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    FROM authenticated;
GRANT EXECUTE ON FUNCTION registrar_acceso_cliente(uuid, text, boolean, text)
    TO service_role;
