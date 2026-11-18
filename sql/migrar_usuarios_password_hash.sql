-- ═══════════════════════════════════════════════════════════════════
-- HIGH TEST SAS - Contraseñas de usuarios internos con hash scrypt
--
-- Archivo : sql/migrar_usuarios_password_hash.sql
--
-- Qué hace:
--   - Agrega la columna password_hash a la tabla usuarios (scrypt,
--     generado por el backend con crypto.scryptSync, N=16384, r=8,
--     p=1, key 32B, salt 16B).
--   - NO toca datos existentes: las 7 contraseñas actuales permanecen
--     intactas y se migran en diferido al primer login exitoso de
--     cada usuario (el backend lo hace automáticamente).
--   - No elimina la columna password (se conserva hasta confirmar
--     que no existen dependencias).
--
-- Idempotente y no destructivo. Ejecutar en Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash text;

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND column_name IN ('password', 'password_hash')
ORDER BY ordinal_position;
