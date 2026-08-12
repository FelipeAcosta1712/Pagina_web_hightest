-- ============================================================
-- RPC: get_numeros_recepcion_ocupados
-- Devuelve SOLO los numero_proceso de procesos_acreditados.
-- Reduce ~1MB (select *) a ~2.5KB (solo strings).
-- Se usa para calcular números disponibles en el selector.
-- ============================================================
CREATE OR REPLACE FUNCTION get_numeros_recepcion_ocupados()
RETURNS TABLE (numero_proceso text) AS $$
    SELECT numero_proceso
    FROM   procesos_acreditados
    WHERE  numero_proceso IS NOT NULL
      AND  numero_proceso <> '';
$$ LANGUAGE sql STABLE;
