-- ============================================================
-- Tabla: system_config
-- Almacena configuración del sistema (auto-guardado, frecuencia, etc.)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar valores por defecto
INSERT INTO system_config (config_key, config_value) VALUES
    ('auto_guardado', 'true'),
    ('frecuencia_guardado', '30'),
    ('pdf_automatico', 'true'),
    ('notificaciones', 'true')
ON CONFLICT (config_key) DO NOTHING;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- RLS (Row Level Security) - habilitar si es necesario
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Permitir lectura/escritura a usuarios autenticados (ajustar según necesidad)
CREATE POLICY "Allow all for authenticated" ON system_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Tabla: backups (opcional - para registrar metadatos de respaldos)
-- Los archivos JSON se almacenan en Supabase Storage bucket 'backups'
-- ============================================================

CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at DESC);

-- ============================================================
-- FUNCIÓN RPC: count_user_tables
-- Cuenta las tablas del esquema public (excluye tablas internas de Supabase)
-- Opcional: mejora la precisión del conteo de tablas
-- ============================================================

CREATE OR REPLACE FUNCTION count_user_tables()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
$$;

-- ============================================================
-- FUNCIÓN RPC: get_db_size
-- Obtiene el tamaño de la base de datos en formato legible
-- Opcional: muestra el tamaño real de la BD
-- Nota: Solo funciona si el usuario tiene permisos de superuser
-- ============================================================

CREATE OR REPLACE FUNCTION get_db_size()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT pg_size_pretty(
        pg_database_size(current_database())
    )::TEXT;
$$;
