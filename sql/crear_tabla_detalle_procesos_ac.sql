-- =============================================
-- CREAR TABLA detalle_procesos_ac
-- =============================================
-- Flujo:
--   - Al generar PDF Recepción se insertan los items recibidos
--   - Cada fila representa un grupo de unidades por marca
--   - proceso_id → FK a procesos_acreditados
--   - ensayo_id  → FK a ensayos_acreditados

CREATE TABLE IF NOT EXISTS detalle_procesos_ac (
    id BIGSERIAL PRIMARY KEY,
    proceso_id BIGINT NOT NULL,
    ensayo_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    marca VARCHAR(255) DEFAULT '',
    observaciones TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_proceso
        FOREIGN KEY (proceso_id)
        REFERENCES procesos_acreditados(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ensayo
        FOREIGN KEY (ensayo_id)
        REFERENCES ensayos_acreditados(id)
        ON DELETE CASCADE
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_detalle_proceso_id ON detalle_procesos_ac(proceso_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ensayo_id ON detalle_procesos_ac(ensayo_id);

-- Verificar: mostrar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'detalle_procesos_ac'
ORDER BY ordinal_position;
