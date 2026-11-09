-- ============================================================
-- RPC: get_completitud_resumen  (SOLO LECTURA)
-- Banderas ligeras de firmas/datos por numero_proceso, SIN
-- descargar los payloads de firmas base64 (~33 MB).
--
-- Antes el backend hacía:
--   · SELECT * de firma_cliente_recepcion/entrega en TODOS los
--     procesos (513 filas con base64) solo para mirar si eran
--     no-null/no-vacío, y
--   · bajaba el JSON completo de borradores (12.5 MB)
-- para calcular lo mismo en JS. Ambas lecturas ocurren ahora
-- en el servidor y solo se devuelven booleanos.
--
-- Lógica (idéntica a la versión JS):
--   firmaRecepcion/firmaEntrega       → firma del cliente (proceso
--     o borrador; OR entre fuentes)
--   datosClienteRecepcion/Entrega     → nombre, cédula y cargo del
--     firmante no vacíos (trim)
--   repHtRecepcion/repHtEntrega       → nombre y cargo del
--     representante HIGH TEST no vacíos (trim)
-- La clave es numero_proceso normalizada (sin espacios, MAYÚSCULAS),
-- igual que norm() en JS.
--
-- Retorna: JSONB  { "CLAVE": { firmaRecepcion: bool, ... }, ... }
-- ============================================================
CREATE OR REPLACE FUNCTION get_completitud_resumen()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    WITH base AS (
        -- Procesos: firmas registradas (los datos del formulario
        -- no existen en esta tabla, por eso vienen en FALSE)
        SELECT
            upper(regexp_replace(COALESCE(p.numero_proceso::TEXT, ''), '\s+', '', 'g')) AS clave,
            (COALESCE(p.firma_cliente_recepcion, '') <> '') AS firma_recepcion,
            (COALESCE(p.firma_cliente_entrega, '') <> '') AS firma_entrega,
            FALSE AS datos_recepcion,
            FALSE AS datos_entrega,
            FALSE AS rep_recepcion,
            FALSE AS rep_entrega
        FROM procesos_acreditados p
        WHERE COALESCE(p.numero_proceso::TEXT, '') <> ''

        UNION ALL

        -- Borradores (compartido): firmas del canvas + datos del
        -- formulario. !~ '^\s*$' equivale a String(v).trim() !== ''
        -- de JavaScript (true si hay algún carácter no-blanco).
        SELECT
            upper(regexp_replace(
                COALESCE(
                    NULLIF(d ->> 'cotizacion', ''),
                    NULLIF(d ->> 'quoteNumber', ''),
                    NULLIF(d ->> 'numero_proceso', ''),
                    ''
                ),
                '\s+', '', 'g'
            )) AS clave,
            (COALESCE(d -> 'signatureData' ->> 'signatureCanvasRecepcion', '') <> ''
             OR COALESCE(d -> 'signatureData' ->> 'signatureCanvas', '')) AS firma_recepcion,
            (COALESCE(d -> 'signatureData' ->> 'signatureCanvasEntrega', '') <> '') AS firma_entrega,
            (COALESCE(d ->> 'clienteRecepcionNombre', '') !~ '^\s*$'
             AND COALESCE(d ->> 'clienteRecepcionCedula', '') !~ '^\s*$'
             AND COALESCE(d ->> 'clienteRecepcionCargo', '') !~ '^\s*$') AS datos_recepcion,
            (COALESCE(d ->> 'clienteEntregaNombre', '') !~ '^\s*$'
             AND COALESCE(d ->> 'clienteEntregaCedula', '') !~ '^\s*$'
             AND COALESCE(d ->> 'clienteEntregaCargo', '') !~ '^\s*$') AS datos_entrega,
            (COALESCE(d ->> 'highTestRecepcionNombre', '') !~ '^\s*$'
             AND COALESCE(d ->> 'highTestRecepcionCargo', '') !~ '^\s*$') AS rep_recepcion,
            (COALESCE(d ->> 'highTestEntregaNombre', '') !~ '^\s*$'
             AND COALESCE(d ->> 'highTestEntregaCargo', '') !~ '^\s*$') AS rep_entrega
        FROM borradores b
        CROSS JOIN LATERAL jsonb_array_elements(b.datos) AS d
        WHERE b.usuario_email = 'shared'
          AND jsonb_typeof(b.datos) = 'array'
    ),
    agrupado AS (
        -- OR entre duplicados (mismo numero_proceso en varias filas)
        SELECT
            clave,
            bool_or(firma_recepcion) AS firma_recepcion,
            bool_or(firma_entrega) AS firma_entrega,
            bool_or(datos_recepcion) AS datos_cliente_recepcion,
            bool_or(datos_entrega) AS datos_cliente_entrega,
            bool_or(rep_recepcion) AS rep_ht_recepcion,
            bool_or(rep_entrega) AS rep_ht_entrega
        FROM base
        WHERE clave <> ''
        GROUP BY clave
    )
    SELECT COALESCE(
        jsonb_object_agg(
            clave,
            jsonb_build_object(
                'firmaRecepcion', firma_recepcion,
                'firmaEntrega', firma_entrega,
                'datosClienteRecepcion', datos_cliente_recepcion,
                'datosClienteEntrega', datos_cliente_entrega,
                'repHtRecepcion', rep_ht_recepcion,
                'repHtEntrega', rep_ht_entrega
            )
        ),
        '{}'::JSONB
    )
    FROM agrupado;
$$;
