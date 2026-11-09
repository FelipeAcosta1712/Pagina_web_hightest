-- ============================================================
-- RPC: get_dashboard_source  (SOLO LECTURA)
-- Fuentes de datos del dashboard en UNA sola consulta ligera.
--
-- Antes get_dashboard_stats hacía 7 fetchAll (clientes, procesos
-- AC COMPLETOS con ~33 MB de firmas, cotizaciones, informes,
-- ensayos, detalle y marcaciones) + 3 fetchAllDetalle con JOINs,
-- todo en el backend de Netlify, y agrupaba en JS. Casi todo el
-- tiempo se iba en descargar firmas base64 que el dashboard ni
-- siquiera usa.
--
-- Ahora el servidor devuelve:
--   clientes           → todos los campos (menos password)
--   procesos           → solo los campos que usa el dashboard
--                        (SIN firmas)
--   cotizaciones       → id, cliente, estado, total_valor,
--                        created_at, cotizacion
--   informes           → id, proceso_id, created_at, activo
--   ensayos            → id, nombre, categoria
--   detalle            → proceso_id, cantidad, ensayo_nombre,
--                        ensayo_categoria, cliente (con JOINs ya
--                        resueltos: 1127 filas ligeras)
--   marcacionesResumen → { total, marcados, pendientes } (agregado;
--                        antes se bajaban 6602 filas para contar 3
--                        números)
--
-- Los filtros del dashboard (mes, cliente, estado, fechas) siguen
-- aplicándose en el backend sobre estas fuentes, igual que antes.
--
-- Retorna: JSONB
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_source()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT jsonb_build_object(
        'clientes', (
            SELECT COALESCE(jsonb_agg(to_jsonb(c) - 'password' ORDER BY c.id), '[]'::JSONB)
            FROM clientes c
        ),
        'procesos', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', p.id,
                'numero_proceso', p.numero_proceso,
                'cliente', p.cliente,
                'estado', p.estado,
                'fecha_recepcion', p.fecha_recepcion,
                'fecha_entrega_cliente', p.fecha_entrega_cliente,
                'created_at', p.created_at,
                'n_informe', p.n_informe,
                'informe_a_nombre_de', p.informe_a_nombre_de,
                'n_remision', p.n_remision
            ) ORDER BY p.id), '[]'::JSONB)
            FROM procesos_acreditados p
        ),
        'cotizaciones', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', c.id,
                'cliente', c.cliente,
                'estado', c.estado,
                'total_valor', c.total_valor,
                'created_at', c.created_at,
                'cotizacion', c.cotizacion
            ) ORDER BY c.id), '[]'::JSONB)
            FROM cotizaciones_ac c
        ),
        'informes', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', i.id,
                'proceso_id', i.proceso_id,
                'created_at', i.created_at,
                'activo', i.activo
            ) ORDER BY i.id), '[]'::JSONB)
            FROM informes_ensayo_ac i
        ),
        'ensayos', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', e.id,
                'nombre', e.nombre,
                'categoria', e.categoria
            ) ORDER BY e.id), '[]'::JSONB)
            FROM ensayos_acreditados e
        ),
        'detalle', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'proceso_id', d.proceso_id,
                'cantidad', COALESCE(d.cantidad, 0),
                'ensayo_nombre', COALESCE(en.nombre, ''),
                'ensayo_categoria', COALESCE(en.categoria, ''),
                'cliente', COALESCE(pr.cliente, '')
            ) ORDER BY d.id), '[]'::JSONB)
            FROM detalle_procesos_ac d
            LEFT JOIN ensayos_acreditados en ON en.id = d.ensayo_id
            LEFT JOIN procesos_acreditados pr ON pr.id = d.proceso_id
        ),
        'marcacionesResumen', (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'marcados', COUNT(*) FILTER (WHERE LOWER(COALESCE(m.estado, '')) = 'marcado'),
                'pendientes', COUNT(*) FILTER (WHERE LOWER(COALESCE(m.estado, '')) = 'pendiente')
            )
            FROM marcaciones_ac m
        )
    );
$$;
