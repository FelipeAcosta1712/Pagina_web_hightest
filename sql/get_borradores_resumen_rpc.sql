-- ============================================================
-- RPC 1: get_borradores_resumen
-- Devuelve UNA FILA POR BORRADOR con solo campos ligeros.
-- Reduce ~5MB → ~1-5KB (sin payloads de firmas/items/fotos).
-- ============================================================
CREATE OR REPLACE FUNCTION get_borradores_resumen()
RETURNS TABLE (
    cotizacion text,
    cliente text,
    fecha_recepcion text,
    fecha_entrega text,
    status text,
    borrador_timestamp text,
    created_at text
) AS $$
    SELECT
        d->>'cotizacion'                AS cotizacion,
        d->>'cliente'                   AS cliente,
        d->>'fechaRecepcion'            AS fecha_recepcion,
        d->>'fechaEntrega'              AS fecha_entrega,
        d->>'status'                    AS status,
        d->>'timestamp'                 AS borrador_timestamp,
        d->>'_createdAt'                AS created_at
    FROM   borradores,
           jsonb_array_elements(datos) AS d
    WHERE  usuario_email = 'shared'
      AND  jsonb_typeof(datos) = 'array';
$$ LANGUAGE sql STABLE;


-- ============================================================
-- RPC 2: get_borrador_completo
-- Devuelve UN SOLO BORRADOR completo por su cotizacion.
-- ============================================================
CREATE OR REPLACE FUNCTION get_borrador_completo(p_cotizacion text)
RETURNS jsonb AS $$
    SELECT d
    FROM   borradores,
           jsonb_array_elements(datos) AS d
    WHERE  usuario_email = 'shared'
      AND  jsonb_typeof(datos) = 'array'
      AND  d->>'cotizacion' = p_cotizacion
    LIMIT  1;
$$ LANGUAGE sql STABLE;
