-- ============================================================
-- RPC: save_borrador_individual
-- Guarda un solo borrador dentro del array JSONB de la fila
-- compartida (usuario_email = 'shared').
-- Compara timestamps normalizados (epoch ms) para evitar
-- que una versión antigua sobrescriba una más nueva.
-- Operación atómica: lectura + comparación + escritura
-- se ejecutan dentro de una sola transacción PostgreSQL.
-- ============================================================
CREATE OR REPLACE FUNCTION save_borrador_individual(
    p_cotizacion text,
    p_borrador jsonb
) RETURNS jsonb AS $$
DECLARE
    v_row_id uuid;
    v_array jsonb;
    v_idx integer := -1;
    v_i integer;
    v_elem jsonb;
    v_existing_ts_text text;
    v_received_ts_text text;
    v_existing_epoch bigint;
    v_received_epoch bigint;
    v_row_exists boolean;
BEGIN
    -- 1. Buscar la fila shared (con FOR UPDATE para bloquear lecturas concurrentes)
    SELECT id, datos INTO v_row_id, v_array
    FROM borradores
    WHERE usuario_email = 'shared'
    LIMIT 1
    FOR UPDATE;

    v_row_exists := (v_row_id IS NOT NULL);

    -- Si no existe fila, crear con este borrador
    IF NOT v_row_exists THEN
        INSERT INTO borradores (usuario_email, datos, updated_at)
        VALUES ('shared', jsonb_build_array(p_borrador), now());
        RETURN jsonb_build_object('ok', true, 'saved', true, 'reason', 'created');
    END IF;

    -- Asegurar que datos es array
    IF v_array IS NULL OR jsonb_typeof(v_array) != 'array' THEN
        v_array := '[]'::jsonb;
    END IF;

    -- 2. Buscar el índice del borrador por cotizacion
    FOR v_i IN 0 .. jsonb_array_length(v_array) - 1 LOOP
        v_elem := v_array->v_i;
        IF v_elem->>'cotizacion' = p_cotizacion THEN
            v_idx := v_i;
            EXIT;
        END IF;
    END LOOP;

    -- 3. Si existe, comparar timestamps normalizados a epoch
    IF v_idx >= 0 THEN
        v_existing_ts_text := trim(v_array->v_idx->>'timestamp');
        v_received_ts_text := trim(p_borrador->>'timestamp');

        -- Validar que ambos timestamps sean parseables
        IF v_existing_ts_text IS NULL OR v_existing_ts_text = '' THEN
            -- Timestamp existente inválido: tratar como si no tuviera versión
            -- Permitir la actualización
            v_existing_epoch := 0;
        ELSE
            v_existing_epoch := EXTRACT(EPOCH FROM v_existing_ts_text::timestamptz) * 1000;
        END IF;

        IF v_received_ts_text IS NULL OR v_received_ts_text = '' THEN
            -- Timestamp recibido inválido: rechazar actualización
            RETURN jsonb_build_object(
                'ok', true,
                'saved', false,
                'reason', 'invalid_timestamp',
                'detail', 'El borrador enviado no tiene un timestamp válido'
            );
        END IF;

        v_received_epoch := EXTRACT(EPOCH FROM v_received_ts_text::timestamptz) * 1000;

        -- Si el servidor tiene timestamp estrictamente mayor, NO sobrescribir
        IF v_existing_epoch > v_received_epoch THEN
            RETURN jsonb_build_object(
                'ok', true,
                'saved', false,
                'reason', 'server_newer',
                'server_timestamp', v_existing_ts_text
            );
        END IF;

        -- Reemplazar solo ese elemento (received >= existing)
        v_array := jsonb_set(v_array, ARRAY[v_idx::text], p_borrador);
    ELSE
        -- Nuevo: agregar al array
        v_array := v_array || p_borrador;
    END IF;

    -- 4. Actualizar la fila (el FOR UPDATE ya bloquea concurrentes)
    UPDATE borradores
    SET datos = v_array, updated_at = now()
    WHERE id = v_row_id;

    RETURN jsonb_build_object('ok', true, 'saved', true, 'reason',
        CASE WHEN v_idx >= 0 THEN 'updated' ELSE 'created' END);
END;
$$ LANGUAGE plpgsql;
