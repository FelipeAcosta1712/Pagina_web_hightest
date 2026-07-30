-- =============================================
-- AGREGAR COLUMNA unidades_ensayables A detalle_procesos_ac
-- =============================================
-- Permite guardar las unidades ensayables por grupo de elemento.
-- El valor se almacena en TODAS las filas del mismo ensayo_id.
-- Al cargar, se toma de la primera fila del grupo.

ALTER TABLE detalle_procesos_ac
ADD COLUMN IF NOT EXISTS unidades_ensayables INTEGER DEFAULT 0;
