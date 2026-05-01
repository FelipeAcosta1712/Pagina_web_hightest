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
        } catch (err) {
            return jsonResponse(500, { ok: false, error: err.message });
        }
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
};