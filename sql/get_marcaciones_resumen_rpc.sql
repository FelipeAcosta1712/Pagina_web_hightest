-- =============================================
-- get_marcaciones_resumen_rpc: Resumen agrupado de marcaciones
-- =============================================
-- Soluciona el límite de 1000 filas de PostgREST.
-- Realiza el GROUP BY en PostgreSQL y retorna únicamente los grupos.
--
-- Retorna:
--   TABLE (proceso_id BIGINT, total BIGINT, marcados BIGINT, pendientes BIGINT, otros BIGINT)

CREATE OR REPLACE FUNCTION get_marcaciones_resumen_rpc()
RETURNS TABLE (
    proceso_id BIGINT,
    total BIGINT,
    marcados BIGINT,
    pendientes BIGINT,
    otros BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ma.proceso_id,
        COUNT(*)::BIGINT AS total,
        COUNT(*) FILTER (WHERE LOWER(ma.estado) IN ('marcado', 'revisado'))::BIGINT AS marcados,
        COUNT(*) FILTER (WHERE LOWER(ma.estado) = 'pendiente')::BIGINT AS pendientes,
        (COUNT(*) - COUNT(*) FILTER (WHERE LOWER(ma.estado) IN ('marcado', 'revisado', 'pendiente')))::BIGINT AS otros
    FROM marcaciones_ac ma
    GROUP BY ma.proceso_id;
END;
$$;
