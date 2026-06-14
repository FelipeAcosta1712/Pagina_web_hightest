-- =============================================
-- AGREGAR COLUMNA 'caso_activo' A TABLA procesos_acreditados
-- =============================================
-- Flujo:
--   - PDF Recepción  → caso_activo = true  (caso activo para cargar)
--   - PDF Completo   → caso_activo = false (pasa a tabla Finalizados)
--   - Solo FINALIZADO → caso_activo = false (pasa a tabla Finalizados)

-- 1. Agregar columna caso_activo con default true
ALTER TABLE procesos_acreditados
ADD COLUMN IF NOT EXISTS caso_activo BOOLEAN DEFAULT true;

-- 2. Marcar como INACTIVOS solo los finalizados
UPDATE procesos_acreditados
SET caso_activo = false
WHERE estado ILIKE '%finalizado%';

-- 3. Verificar resultado
SELECT numero_proceso, cliente, estado, caso_activo
FROM procesos_acreditados
ORDER BY fecha_recepcion DESC
LIMIT 20;
