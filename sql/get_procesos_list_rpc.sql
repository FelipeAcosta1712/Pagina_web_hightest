-- ============================================================
-- RPC: get_procesos_list  (SOLO LECTURA)
-- Lista ligera de procesos_acreditados para el panel/admin.
--
-- Optimización clave:
--   · NO selecciona firma_cliente_recepcion ni firma_cliente_entrega
--     (base64 de ~33 MB en total: era la causa de los timeouts).
--   · total_items se calcula en SQL con get_conteos_items()
--     (antes el backend descargaba detalle_procesos_ac y
--      marcaciones_ac completos solo para contar filas).
--
-- Filtros (todos opcionales, misma semántica que la versión JS):
--   p_estado        → ILIKE parcial sobre estado
--   p_cliente       → ILIKE parcial sobre cliente
--   p_fecha_desde   → 'YYYY-MM-DD' inclusive (fecha_recepcion)
--   p_fecha_hasta   → 'YYYY-MM-DD' exclusivo (fecha_recepcion)
--   p_fecha_exacta  → 'YYYY-MM-DD' exacto (fecha_recepcion)
--   p_search        → ILIKE sobre numero_proceso, cliente o n_informe
--   p_activo        → igualdad exacta sobre caso_activo
--   p_limit/p_offset→ paginación (LIMIT NULL = sin límite)
--
-- Orden: fecha_recepcion DESC (como antes) con id DESC como
-- desempate estable (la versión JS no desempataba y podía
-- duplicar/saltar filas al paginar).
--
-- Retorna: SETOF JSONB (un objeto por proceso, sin firmas).
-- ============================================================
CREATE OR REPLACE FUNCTION get_procesos_list(
    p_estado TEXT DEFAULT NULL,
    p_cliente TEXT DEFAULT NULL,
    p_fecha_desde TEXT DEFAULT NULL,
    p_fecha_hasta TEXT DEFAULT NULL,
    p_fecha_exacta TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_activo BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT NULL,
    p_offset INTEGER DEFAULT NULL
)
RETURNS SETOF JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT jsonb_build_object(
        'id', p.id,
        'numero_proceso', p.numero_proceso,
        'cliente', p.cliente,
        'estado', p.estado,
        'fecha_recepcion', p.fecha_recepcion,
        'fecha_entrega_cliente', p.fecha_entrega_cliente,
        'fecha_finalizado', p.fecha_finalizado,
        'created_at', p.created_at,
        'caso_activo', p.caso_activo,
        'n_informe', p.n_informe,
        'informe_a_nombre_de', p.informe_a_nombre_de,
        'facturar_a_nombre_de', p.facturar_a_nombre_de,
        'fecha_ejecucion', p.fecha_ejecucion,
        'n_remision', p.n_remision,
        'responsable_marcacion', p.responsable_marcacion,
        'lpdp_cliente_recepcion', p.lpdp_cliente_recepcion,
        'lpdp_cliente_entrega', p.lpdp_cliente_entrega,
        'total_items', COALESCE(ci.total_items, 0)
    )
    FROM procesos_acreditados p
    LEFT JOIN get_conteos_items() ci ON ci.proceso_id = p.id
    WHERE (p_activo IS NULL OR (p.caso_activo IS NOT NULL AND p.caso_activo::TEXT = p_activo::TEXT))
      AND (p_estado IS NULL OR p.estado ILIKE '%' || p_estado || '%')
      AND (p_cliente IS NULL OR p.cliente ILIKE '%' || p_cliente || '%')
      AND (p_fecha_desde IS NULL OR substring(p.fecha_recepcion::TEXT, 1, 10) >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR substring(p.fecha_recepcion::TEXT, 1, 10) < p_fecha_hasta)
      AND (p_fecha_exacta IS NULL OR substring(p.fecha_recepcion::TEXT, 1, 10) = p_fecha_exacta)
      AND (p_search IS NULL OR
           p.numero_proceso::TEXT ILIKE '%' || p_search || '%' OR
           p.cliente::TEXT ILIKE '%' || p_search || '%' OR
           p.n_informe::TEXT ILIKE '%' || p_search || '%')
    ORDER BY p.fecha_recepcion DESC, p.id DESC
    LIMIT p_limit
    OFFSET COALESCE(p_offset, 0);
$$;
