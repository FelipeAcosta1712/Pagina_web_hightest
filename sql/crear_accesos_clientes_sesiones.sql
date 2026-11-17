-- ═══════════════════════════════════════════════════════════════════
-- HIGH TEST SAS
-- Sesiones persistentes de clientes, registro de accesos y
-- soporte para hash scrypt de contraseñas (estructura solamente)
--
-- Archivo : sql/crear_accesos_clientes_sesiones.sql
-- Características: idempotente, no destructivo, re-ejecutable
--
-- NOTAS:
--  - Este script NO toca datos existentes de clientes, usuarios,
--    procesos, informes, cotizaciones ni representantes.
--  - password_hash NO se llena aquí: el backend lo genera con
--    crypto.scrypt (N=16384, r=8, p=1, 32B, salt 16B) y lo migra
--    progresivamente en cada login exitoso.
--  - Historial JSONB limitado a 100 eventos por cliente. Si en el
--    futuro se requiere historial completo, migrar a una tabla
--    accesos_clientes independiente (fuera del alcance actual).
--  - Políticas RLS existentes: sin cambios.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA CLIENTES: columnas de accesos, sesión y hash
--    (una instrucción ADD COLUMN IF NOT EXISTS por columna)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultimo_acceso      timestamptz;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_ingresos     int DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_logins       int DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_visitas      int DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS total_fallidos     int DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS accesos_historial  jsonb DEFAULT '[]'::jsonb;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS session_token_hash text;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS session_expira_en  timestamptz;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS password_hash      text;

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA USUARIOS: solo sesión administrativa independiente
--    (NO registra accesos de usuarios internos; NO toca roles)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS session_token_hash text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS session_expira_en  timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 3. ÍNDICES para lookup por hash de sesión
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_session_hash
    ON clientes (session_token_hash);
CREATE INDEX IF NOT EXISTS idx_usuarios_session_hash
    ON usuarios (session_token_hash);

-- ─────────────────────────────────────────────────────────────
-- 4. RPC registrar_acceso_cliente
--
-- Semántica de eventos:
--   Login exitoso  -> total_ingresos + total_logins
--   Visita         -> total_ingresos + total_visitas
--   Login fallido  -> total_ingresos + total_fallidos
--   ultimo_acceso  -> solo si el evento es exitoso (login/visita)
--
-- Deduplicación de visitas: no registra si el último acceso
-- EXITOSO (login o visita) ocurrió hace menos de 30 minutos.
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION registrar_acceso_cliente(
    p_cliente_id bigint,
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

    -- Bloqueo de fila: evita inconsistencias por accesos simultáneos
    SELECT accesos_historial, ultimo_acceso
      INTO v_historial, v_ultimo_exitoso
      FROM clientes
     WHERE id = p_cliente_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RETURN;  -- cliente inexistente: no registra nada
    END IF;

    -- Tolerancia a historial nulo o con formato inesperado
    IF v_historial IS NULL OR jsonb_typeof(v_historial) <> 'array' THEN
        v_historial := '[]'::jsonb;
    END IF;

    -- Validación de combinaciones de eventos permitidas
    IF p_tipo NOT IN ('login', 'visita') THEN
        RETURN;                       -- tipo desconocido: no incrementa
    END IF;
    IF p_tipo = 'visita' AND NOT p_exitoso THEN
        RETURN;                       -- no existen visitas fallidas
    END IF;

    -- Deduplicación de visitas (30 min desde el último acceso exitoso)
    IF p_tipo = 'visita'
       AND v_ultimo_exitoso IS NOT NULL
       AND v_ultimo_exitoso > v_now - INTERVAL '30 minutes' THEN
        RETURN;                       -- visita duplicada: sin cambios
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

-- ─────────────────────────────────────────────────────────────
-- 5. SEGURIDAD SQL de la RPC (firma completa en REVOKE y GRANT)
--    Ejecutable exclusivamente por el backend (service_role)
-- ─────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION registrar_acceso_cliente(bigint, text, boolean, text)
    FROM PUBLIC;
REVOKE ALL ON FUNCTION registrar_acceso_cliente(bigint, text, boolean, text)
    FROM anon;
REVOKE ALL ON FUNCTION registrar_acceso_cliente(bigint, text, boolean, text)
    FROM authenticated;
GRANT EXECUTE ON FUNCTION registrar_acceso_cliente(bigint, text, boolean, text)
    TO service_role;
