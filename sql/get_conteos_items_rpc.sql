-- ============================================================
-- RPC: get_conteos_items  (SOLO LECTURA)
-- Conteo total de items por proceso, agregado en SQL.
--
-- total_items = MAYOR entre:
--   · filas de detalle_procesos_ac (items reales del proceso)
--   · elementos distintos de marcaciones_ac (marcas únicas)
--
-- Es la misma lógica que el backend calculaba en JS recorriendo
-- ambas tablas completas (fetchAll), pero hecha en el servidor.
--
-- Retorna: TABLE (proceso_id BIGINT, total_items BIGINT)
-- Solo genera claves para procesos que tengan filas en alguna
-- de las dos tablas (igual que la versión JS).
-- ============================================================
CREATE OR REPLACE FUNCTION get_conteos_items()
RETURNS TABLE (
    proceso_id BIGINT,
    total_items BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        COALESCE(det.proceso_id, mar.proceso_id) AS proceso_id,
        GREATEST(COALESCE(det.cnt, 0), COALESCE(mar.cnt, 0)) AS total_items
    FROM (
        SELECT d.proceso_id, COUNT(*) AS cnt
        FROM detalle_procesos_ac d
        GROUP BY d.proceso_id
    ) det
    FULL OUTER JOIN (
        SELECT m.proceso_id, COUNT(DISTINCT btrim(m.elemento)) AS cnt
        FROM marcaciones_ac m
        WHERE m.elemento IS NOT NULL AND m.elemento <> ''
        GROUP BY m.proceso_id
    ) mar ON mar.proceso_id = det.proceso_id;
$$;
