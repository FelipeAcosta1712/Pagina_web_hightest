-- =============================================
-- CREAR TABLA cotizaciones_ac
-- =============================================
-- Fuente oficial de datos para cotizaciones.
-- Cada cotización está ligada a una recepción (procesos_acreditados).

CREATE TABLE IF NOT EXISTS cotizaciones_ac (
    id BIGSERIAL PRIMARY KEY,
    proceso_id BIGINT NOT NULL,
    cotizacion VARCHAR(50) NOT NULL,
    cliente VARCHAR(255) DEFAULT '',
    informe_nombre VARCHAR(255) DEFAULT '',
    items JSONB DEFAULT '[]'::jsonb,
    total_items INTEGER DEFAULT 0,
    total_valor NUMERIC(15, 2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'borrador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_cotizacion_proceso
        FOREIGN KEY (proceso_id)
        REFERENCES procesos_acreditados(id)
        ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cotizaciones_proceso_id ON cotizaciones_ac(proceso_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cotizacion ON cotizaciones_ac(cotizacion);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones_ac(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones_ac(cliente);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cotizaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_cotizaciones_updated_at ON cotizaciones_ac;
CREATE TRIGGER trigger_update_cotizaciones_updated_at
    BEFORE UPDATE ON cotizaciones_ac
    FOR EACH ROW
    EXECUTE FUNCTION update_cotizaciones_updated_at();

-- Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cotizaciones_ac'
ORDER BY ordinal_position;
