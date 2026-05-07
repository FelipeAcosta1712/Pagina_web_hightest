const { createClient } = require('@supabase/supabase-js');

const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const jsonResponse = (statusCode, payload) => ({
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(payload)
});

const normalizeText = (value) => String(value ?? '').trim();

const pickFirstValue = (row, keys) => {
    for (const key of keys) {
        if (row && row[key] != null && String(row[key]).trim() !== '') {
            return row[key];
        }
    }
    return '';
};

exports.handler = async (event) => {
    // 1. Manejo de seguridad CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: jsonHeaders, body: '' };
    }

    // 2. Inicialización de Supabase con Service Role Key
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
    );

    // 3. Procesamiento de la petición POST
    if (event.httpMethod === 'POST') {
        try {
            const payload = JSON.parse(event.body || '{}');

            // Login para usuarios internos (admin/técnicos)
            if (payload.action === 'login') {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('id, email, nombre, rol')
                    .eq('email', String(payload.email).trim())
                    .eq('password', String(payload.password))
                    .single();

                if (error || !data) {
                    return jsonResponse(401, { ok: false, error: 'Credenciales inválidas' });
                }

                return jsonResponse(200, { ok: true, user: data });
            }

            // Login para clientes (tabla `clientes`)
            if (payload.action === 'login_cliente') {
                const email = normalizeText(payload.email).toLowerCase();
                const password = normalizeText(payload.password);

                // Traer el cliente por email y comparar la clave en backend.
                // Esto tolera variaciones comunes de nombre de columnas en la tabla.
                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .ilike('email', email)
                    .limit(1);

                if (error) {
                    return jsonResponse(500, {
                        ok: false,
                        error: 'No se pudo consultar la tabla clientes',
                        detail: error.message
                    });
                }

                const clientRow = Array.isArray(data) ? data[0] : null;
                if (!clientRow) {
                    return jsonResponse(401, { ok: false, error: 'Credenciales de cliente inválidas' });
                }

                const storedPassword = pickFirstValue(clientRow, [
                    'password',
                    'password_cliente',
                    'contrasena',
                    'contraseña',
                    'clave',
                    'pin'
                ]);

                if (!storedPassword) {
                    return jsonResponse(500, {
                        ok: false,
                        error: 'La tabla clientes no expone una columna de contraseña compatible',
                        detail: 'Se esperó alguna de estas columnas: password, password_cliente, contrasena, clave o pin.'
                    });
                }

                const passwordMatches = normalizeText(storedPassword) === password;

                if (!passwordMatches) {
                    return jsonResponse(401, { ok: false, error: 'Credenciales de cliente inválidas' });
                }

                // Normalizar respuesta para el cliente
                const user = {
                    id: clientRow.id || clientRow.client_id || Date.now(),
                    email: pickFirstValue(clientRow, ['email', 'correo', 'correo_electronico']),
                    name: pickFirstValue(clientRow, ['nombre', 'nombre_completo', 'contacto', 'representante', 'nombre_empresa']) || email,
                    company: pickFirstValue(clientRow, ['nombre_empresa', 'empresa', 'razon_social', 'razón_social']) || null
                };

                return jsonResponse(200, { ok: true, user, tipo: 'cliente' });
            }

            // Obtener nombre del usuario desde tabla usuarios
            if (payload.action === 'get_user_nombre') {
                const email = normalizeText(payload.email).toLowerCase();
                
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('nombre')
                    .ilike('email', email)
                    .single();

                if (error || !data) {
                    return jsonResponse(404, { ok: false, error: 'Usuario no encontrado' });
                }

                return jsonResponse(200, { ok: true, nombre: data.nombre || '' });
            }

            // Obtener lista de clientes
            if (payload.action === 'get_clientes') {
                const { data, error } = await supabase
                    .from('clientes')
                    .select('id, nombre_empresa, email, password, created_at')
                    .order('created_at', { ascending: false });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener clientes', detail: error.message });
                }

                return jsonResponse(200, { ok: true, clientes: data || [] });
            }

            // Agregar nuevo cliente
            if (payload.action === 'add_cliente') {
                const { nombre_empresa, email, password } = payload;

                if (!nombre_empresa || !email || !password) {
                    return jsonResponse(400, { ok: false, error: 'Faltan campos requeridos' });
                }

                const { data, error } = await supabase
                    .from('clientes')
                    .insert([{ nombre_empresa: nombre_empresa.trim(), email: email.trim().toLowerCase(), password }])
                    .select('id, nombre_empresa, email');

                if (error) {
                    if (error.message.includes('duplicate')) {
                        return jsonResponse(409, { ok: false, error: 'El email ya existe' });
                    }
                    return jsonResponse(500, { ok: false, error: 'Error al crear cliente', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cliente: data[0] });
            }

            // Actualizar cliente
            if (payload.action === 'update_cliente') {
                const { id, nombre_empresa, email, password } = payload;

                if (!id || !nombre_empresa || !email) {
                    return jsonResponse(400, { ok: false, error: 'Faltan campos requeridos' });
                }

                const updateData = { nombre_empresa: nombre_empresa.trim(), email: email.trim().toLowerCase() };
                if (password && password.trim()) {
                    updateData.password = password;
                }

                const { data, error } = await supabase
                    .from('clientes')
                    .update(updateData)
                    .eq('id', id)
                    .select('id, nombre_empresa, email');

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al actualizar cliente', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cliente: data[0] });
            }

            // Eliminar cliente
            if (payload.action === 'delete_cliente') {
                const { id } = payload;

                if (!id) {
                    return jsonResponse(400, { ok: false, error: 'ID de cliente requerido' });
                }

                const { error } = await supabase
                    .from('clientes')
                    .delete()
                    .eq('id', id);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al eliminar cliente', detail: error.message });
                }

                return jsonResponse(200, { ok: true, message: 'Cliente eliminado exitosamente' });
            }

            return jsonResponse(400, { ok: false, error: 'Acción no soportada' });
        } catch (err) {
            return jsonResponse(500, { ok: false, error: err.message });
        }
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
};