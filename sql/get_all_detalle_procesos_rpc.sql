-- ============================================================
-- RPC: get_all_detalle_procesos  (SOLO LECTURA)
-- Detalle de elementos agrupado por proceso, agregado en SQL.
--
-- Antes el backend bajaba detalle_procesos_ac (1127 filas, con
-- JOIN a ensayos) y marcaciones_ac (6602 filas) completas, y
-- agrupaba en JavaScript. Ahora todo el agrupado ocurre en el
-- servidor y solo se devuelven los grupos.
--
-- Misma salida que la versión JS:
--   conteos          { "<proceso_id>": total_items, ... }
--                    (mayor entre filas de detalle y elementos
--                     distintos de marcaciones; ver get_conteos_items)
--   detalleCompleto  { "<proceso_id>": [ { ensayo_id, ensayo_nombre,
--                     ensayo_categoria, cantidad, cantidad_entregada,
--                     marcas: [{count, brand}], observaciones } ] }
--
-- Reglas replicadas desde JS:
--   · ensayo_id = ensayo_id de la fila (o id de la fila si es 0/null)
--   · cantidad se SUMA por (proceso, ensayo)
--   · cantidad_entregada toma el MÁXIMO
--   · marcas: solo filas con marca no vacía, en orden de id,
--     count = cantidad de esa fila
--   · observaciones: primera no vacía en orden de id ('' si ninguna)
--   · elementos ordenados por primera aparición (id menor)
--
-- Retorna: JSONB
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_detalle_procesos()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    WITH det AS (
        SELECT
            d.id AS rid,
            d.proceso_id,
            CASE WHEN d.ensayo_id IS NULL OR d.ensayo_id = 0
                 THEN d.id
                 ELSE d.ensayo_id
            END AS eid,
            COALESCE(d.cantidad, 0) AS cantidad,
            COALESCE(d.cantidad_entregada, 0) AS cantidad_entregada,
            d.marca,
            d.observaciones,
            COALESCE(e.nombre, '') AS ensayo_nombre,
            COALESCE(e.categoria, '') AS ensayo_categoria
        FROM detalle_procesos_ac d
        LEFT JOIN ensayos_acreditados e ON e.id = d.ensayo_id
    ),
    agrupado AS (
        SELECT
            proceso_id,
            eid,
            ensayo_nombre,
            ensayo_categoria,
            SUM(cantidad) AS cantidad,
            MAX(cantidad_entregada) AS cantidad_entregada,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object('count', cantidad, 'brand', marca)
                    ORDER BY rid
                ) FILTER (WHERE marca IS NOT NULL AND marca <> ''),
                '[]'::JSONB
            ) AS marcas,
            COALESCE(
                (array_agg(observaciones ORDER BY rid)
                     FILTER (WHERE observaciones IS NOT NULL AND observaciones <> ''))[1],
                ''
            ) AS observaciones,
            MIN(rid) AS primer_rid
        FROM det
        GROUP BY proceso_id, eid, ensayo_nombre, ensayo_categoria
    ),
    por_proceso AS (
        SELECT
            proceso_id,
            jsonb_agg(
                jsonb_build_object(
                    'ensayo_id', eid,
                    'ensayo_nombre', ensayo_nombre,
                    'ensayo_categoria', ensayo_categoria,
                    'cantidad', COALESCE(cantidad, 0),
                    'cantidad_entregada', COALESCE(cantidad_entregada, 0),
                    'marcas', marcas,
                    'observaciones', observaciones
                )
                ORDER BY primer_rid
            ) AS elementos
        FROM agrupado
        GROUP BY proceso_id
    )
    SELECT jsonb_build_object(
        'conteos', (
            SELECT COALESCE(jsonb_object_agg(proceso_id::TEXT, total_items), '{}'::JSONB)
            FROM get_conteos_items()
        ),
        'detalleCompleto', (
            SELECT COALESCE(jsonb_object_agg(proceso_id::TEXT, elementos), '{}'::JSONB)
            FROM por_proceso
        )
    );
$$;
