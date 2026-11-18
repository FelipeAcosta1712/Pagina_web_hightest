-- ═══════════════════════════════════════════════════════════════════
-- HIGH TEST SAS
-- Sesiones múltiples (una por navegador/dispositivo)
--
-- Archivo : sql/crear_sesiones_multiples.sql
-- Características: idempotente, no destructivo, re-ejecutable,
--                  AUTO-ADAPTATIVO al tipo de PK de usuarios/clientes
--
-- PROBLEMA QUE RESUELVE:
--   Antes cada login sobrescribía usuarios.session_token_hash /
--   clientes.session_token_hash, invalidando la sesión del navegador
--   que había iniciado sesión primero (error 403 en el dashboard).
--
-- NOTAS:
--  - El tipo de la columna FK (usuario_id / cliente_id) se resuelve
--    dinámicamente con el tipo REAL de la PK referenciada (bigint,
--    integer, uuid, ...), evitando el error 42804 de tipos
--    incompatibles si la PK de clientes o usuarios es uuid.
--  - Si una tabla de sesiones existe pero su FK tiene un tipo
--    incorrecto (residuo de un intento fallido), se elimina y se
--    recrea con el tipo correcto. Es seguro: la migración posterior
--    reintroduce las sesiones activas desde usuarios/clientes.
--  - Migración: traslada las sesiones ACTIVAS de las columnas
--    session_token_hash a las tablas nuevas, para que los usuarios
--    ya logueados NO se desconecten.
--  - RLS habilitado SIN políticas: los roles anon/authenticated no
--    pueden leer ni escribir; el backend usa service_role, que
--    omite RLS.
--  - Las columnas session_token_hash / session_expira_en de las
--    tablas usuarios y clientes NO se eliminan (retirarlas se deja
--    para una limpieza futura cuando se confirme el corte).
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. TABLAS de sesiones con FK al tipo REAL de la PK referenciada
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
    tipo_usuarios text;
    tipo_clientes text;
    tipo_actual   text;
BEGIN
    -- Tipo real de la PK de cada tabla (information_schema)
    SELECT data_type INTO tipo_usuarios
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'usuarios'
       AND column_name  = 'id';

    SELECT data_type INTO tipo_clientes
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'clientes'
       AND column_name  = 'id';

    IF tipo_usuarios IS NULL OR tipo_clientes IS NULL THEN
        RAISE EXCEPTION 'No se encontró la PK (id) de usuarios o clientes en el esquema public';
    END IF;

    -- ── sesiones_usuarios ──────────────────────────────────────
    IF to_regclass('public.sesiones_usuarios') IS NOT NULL THEN
        -- Si la FK ya existente tiene otro tipo, recrear la tabla
        SELECT data_type INTO tipo_actual
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'sesiones_usuarios'
           AND column_name  = 'usuario_id';
        IF tipo_actual IS DISTINCT FROM tipo_usuarios THEN
            DROP TABLE sesiones_usuarios;
        END IF;
    END IF;

    IF to_regclass('public.sesiones_usuarios') IS NULL THEN
        EXECUTE format(
            'CREATE TABLE sesiones_usuarios (
                id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                usuario_id %s NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
                token_hash text   NOT NULL UNIQUE,
                creada_en  timestamptz NOT NULL DEFAULT now(),
                expira_en  timestamptz NOT NULL
            )', tipo_usuarios);
    END IF;

    -- ── sesiones_clientes ──────────────────────────────────────
    IF to_regclass('public.sesiones_clientes') IS NOT NULL THEN
        SELECT data_type INTO tipo_actual
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'sesiones_clientes'
           AND column_name  = 'cliente_id';
        IF tipo_actual IS DISTINCT FROM tipo_clientes THEN
            DROP TABLE sesiones_clientes;
        END IF;
    END IF;

    IF to_regclass('public.sesiones_clientes') IS NULL THEN
        EXECUTE format(
            'CREATE TABLE sesiones_clientes (
                id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                cliente_id %s NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
                token_hash text   NOT NULL UNIQUE,
                creada_en  timestamptz NOT NULL DEFAULT now(),
                expira_en  timestamptz NOT NULL
            )', tipo_clientes);
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. ÍNDICES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sesiones_usuarios_usuario
    ON sesiones_usuarios (usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuarios_expira
    ON sesiones_usuarios (expira_en);

CREATE INDEX IF NOT EXISTS idx_sesiones_clientes_cliente
    ON sesiones_clientes (cliente_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_clientes_expira
    ON sesiones_clientes (expira_en);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS: sin políticas (solo service_role del backend)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE sesiones_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_clientes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 4. MIGRACIÓN: sesiones activas existentes -> tablas nuevas
--    Idempotente: ON CONFLICT (token_hash) DO NOTHING evita
--    duplicados si el script se re-ejecuta.
-- ─────────────────────────────────────────────────────────────
INSERT INTO sesiones_usuarios (usuario_id, token_hash, creada_en, expira_en)
SELECT id,
       session_token_hash,
       COALESCE(ultimo_acceso, now()),
       session_expira_en
  FROM usuarios
 WHERE session_token_hash IS NOT NULL
   AND session_expira_en IS NOT NULL
   AND session_expira_en > now()
ON CONFLICT (token_hash) DO NOTHING;

INSERT INTO sesiones_clientes (cliente_id, token_hash, creada_en, expira_en)
SELECT id,
       session_token_hash,
       COALESCE(ultimo_acceso, now()),
       session_expira_en
  FROM clientes
 WHERE session_token_hash IS NOT NULL
   AND session_expira_en IS NOT NULL
   AND session_expira_en > now()
ON CONFLICT (token_hash) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 5. LIMPIEZA (opcional, re-ejecutable): borrar sesiones vencidas
-- ─────────────────────────────────────────────────────────────
DELETE FROM sesiones_usuarios WHERE expira_en <= now();
DELETE FROM sesiones_clientes WHERE expira_en <= now();
