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

const STATUS_LABELS = {
    recepcion: 'Recepción',
    lavado: 'Lavado',
    'en-proceso-de-ensayo': 'Proceso de ensayo',
    'entrega-cliente': 'Entrega cliente',
    'informe-de-ensayo': 'Informe',
    finalizado: 'Finalizado'
};

const normalizeStatusKey = (value) => {
    const text = normalizeText(value).toLowerCase();
    if (!text) return '';

    const direct = Object.keys(STATUS_LABELS).find((key) => key === text);
    if (direct) return direct;

    const compact = text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_\s]+/g, '-');

    const aliasMap = {
        recepcion: 'recepcion',
        lavado: 'lavado',
        'proceso-de-ensayo': 'en-proceso-de-ensayo',
        'en-proceso-de-ensayo': 'en-proceso-de-ensayo',
        'entrega-cliente': 'entrega-cliente',
        informe: 'informe-de-ensayo',
        'informe-de-ensayo': 'informe-de-ensayo',
        finalizado: 'finalizado'
    };

    return aliasMap[compact] || text;
};

const buildStatusCandidates = (value) => {
    const key = normalizeStatusKey(value);
    const label = STATUS_LABELS[key] || normalizeText(value);
    const candidates = [key, label, label.toUpperCase()];
    return [...new Set(candidates.filter(Boolean))];
};

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

            if (payload.action === 'get_cliente_profile') {
                const email = normalizeText(payload.email).toLowerCase();
                if (!email) {
                    return jsonResponse(400, { ok: false, error: 'Se requiere el correo del cliente' });
                }
                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .ilike('email', email)
                    .limit(1);
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'No se pudo consultar el perfil', detail: error.message });
                }
                const row = Array.isArray(data) ? data[0] : null;
                if (!row) {
                    return jsonResponse(404, { ok: false, error: 'Cliente no encontrado' });
                }
                const profile = {
                    id: row.id || row.client_id || null,
                    email: pickFirstValue(row, ['email', 'correo', 'correo_electronico']),
                    name: pickFirstValue(row, ['nombre', 'nombre_completo', 'contacto', 'representante']) || null,
                    company: pickFirstValue(row, ['nombre_empresa', 'empresa', 'razon_social', 'razón_social']) || null,
                    phone: pickFirstValue(row, ['telefono', 'teléfono', 'phone', 'celular', 'movil']) || null,
                    address: pickFirstValue(row, ['direccion', 'dirección', 'address']) || null,
                    nit: pickFirstValue(row, ['nit', 'NIT', 'documento', 'ruc']) || null,
                    contact: pickFirstValue(row, ['contacto', 'representante', 'nombre_completo']) || null
                };
                return jsonResponse(200, { ok: true, profile });
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

            if (payload.action === 'get_usuarios') {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('id, nombre, rol')
                    .order('nombre', { ascending: true });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener usuarios', detail: error.message });
                }

                return jsonResponse(200, { ok: true, usuarios: data || [] });
            }

            // Obtener lista de clientes
            if (payload.action === 'get_clientes') {
                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener clientes', detail: error.message });
                }

                return jsonResponse(200, { ok: true, clientes: data || [] });
            }

            // Obtener lista de ensayos acreditados
            if (payload.action === 'get_ensayos_acreditados') {
                const { data, error } = await supabase
                    .from('ensayos_acreditados')
                    .select('*')
                    .order('id', { ascending: true });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener ensayos acreditados', detail: error.message });
                }

                return jsonResponse(200, {
                    ok: true,
                    items: data || [],
                    ensayos_acreditados: data || []
                });
            }

            // Crear nuevo ensayo acreditado
            if (payload.action === 'add_ensayo_acreditado') {
                const item = payload.item || {};
                const nombre = normalizeText(item.nombre);
                const categoria = normalizeText(item.categoria);

                if (!nombre || !categoria) {
                    return jsonResponse(400, { ok: false, error: 'nombre y categoria son requeridos' });
                }

                const insertData = {
                    nombre,
                    categoria,
                    descripcion: normalizeText(item.descripcion),
                    disponible: item.disponible !== undefined ? Boolean(item.disponible) : true
                };

                const candidates = [
                    insertData,
                    { nombre, categoria, descripcion: normalizeText(item.descripcion) },
                    { nombre, categoria }
                ];

                let lastError = null;
                for (const candidate of candidates) {
                    const { data, error } = await supabase
                        .from('ensayos_acreditados')
                        .insert([candidate])
                        .select()
                        .limit(1);

                    if (!error) {
                        return jsonResponse(200, { ok: true, item: Array.isArray(data) ? data[0] : data });
                    }

                    lastError = error;
                }

                return jsonResponse(500, { ok: false, error: 'Error al crear ensayo acreditado', detail: lastError?.message });
            }

            // Obtener procesos acreditados con filtros básicos
            if (payload.action === 'get_procesos_acreditados') {
                const { estado, cliente, tipo, month, date, search, limit, offset, caso_activo: activo } = payload;

                let query = supabase
                    .from('procesos_acreditados')
                    .select('*');

                // filtro por activo (boolean)
                if (activo !== undefined && activo !== null && activo !== '') {
                    query = query.eq('caso_activo', Boolean(activo));
                }

                // filtros sencillos
                if (estado) {
                    // coincidencia parcial, case-insensitive
                    query = query.ilike('estado', `%${String(estado).trim()}%`);
                }

                if (cliente) {
                    query = query.ilike('cliente', `%${String(cliente).trim()}%`);
                } else if (tipo) {
                    query = query.ilike('tipo', `%${String(tipo).trim()}%`);
                }

                if (month) {
                    // esperar formato YYYY-MM y filtrar por rango real sobre la columna date
                    const m = String(month).trim();
                    if (/^\d{4}-\d{2}$/.test(m)) {
                        const [year, monthIndex] = m.split('-').map(Number);
                        const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
                        const endDate = new Date(Date.UTC(year, monthIndex, 1));
                        const startIso = startDate.toISOString().slice(0, 10);
                        const endIso = endDate.toISOString().slice(0, 10);

                        query = query.gte('fecha_recepcion', startIso).lt('fecha_recepcion', endIso);
                    }
                }

                if (date) {
                    const exactDate = String(date).trim();
                    if (/^\d{4}-\d{2}-\d{2}$/.test(exactDate)) {
                        query = query.eq('fecha_recepcion', exactDate);
                    }
                }

                if (search) {
                    const s = String(search).trim();
                    // Buscar en varias columnas comunes (usar numero_proceso)
                    const orCond = `numero_proceso.ilike.%${s}%,cliente.ilike.%${s}%,n_informe.ilike.%${s}%`;
                    query = query.or(orCond);
                }

                // paginación
                if (limit) {
                    const l = Number(limit) || 100;
                    query = query.limit(l);
                }

                if (offset) {
                    const o = Number(offset) || 0;
                    query = query.range(o, (o + (Number(limit) || 99)));
                }

                // ordenar por fecha_recepcion desc por defecto
                query = query.order('fecha_recepcion', { ascending: false });

                const { data, error } = await query;

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar procesos_acreditados', detail: error.message });
                }

                return jsonResponse(200, { ok: true, procesos: data || [] });
            }

            // Eliminar proceso por numero_proceso
            if (payload.action === 'delete_proceso') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || payload.id);
                if (!numero) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                const { error } = await supabase
                    .from('procesos_acreditados')
                    .delete()
                    .eq('numero_proceso', numero);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al eliminar proceso', detail: error.message });
                }

                return jsonResponse(200, { ok: true, message: 'Proceso eliminado' });
            }

            // Actualizar estado de un proceso
            if (payload.action === 'update_proceso_status') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || payload.id);
                const estado = normalizeText(payload.estado || payload.status || payload.new_status);
                const fechaEntrega = payload.fecha_entrega_cliente || payload.fecha_entrega || null;
                const fechaFinalizado = payload.fecha_finalizado || null;
                const payloadActivo = payload.caso_activo;
                if (!numero || !estado) return jsonResponse(400, { ok: false, error: 'numero_proceso y estado son requeridos' });

                let lastError = null;
                for (const estadoCandidate of buildStatusCandidates(estado)) {
                    const updateData = { estado: estadoCandidate };
                    if (fechaEntrega) updateData.fecha_entrega_cliente = fechaEntrega;
                    if (fechaFinalizado) updateData.fecha_finalizado = fechaFinalizado;
                    // Si el frontend envía activo explícitamente, usarlo; si no, deducir del estado
                    if (payloadActivo !== undefined) {
                        updateData.caso_activo = Boolean(payloadActivo);
                    } else if (estadoCandidate === 'finalizado') {
                        updateData.caso_activo = false;
                    }
                    const { data, error } = await supabase
                        .from('procesos_acreditados')
                        .update(updateData)
                        .eq('numero_proceso', numero)
                        .select()
                        .limit(1);

                    if (!error) {
                        return jsonResponse(200, { ok: true, proceso: Array.isArray(data) ? data[0] : data });
                    }

                    lastError = error;
                }

                return jsonResponse(500, { ok: false, error: 'Error al actualizar estado', detail: lastError?.message });
            }

            // Obtener un único proceso por numero_proceso
            if (payload.action === 'get_proceso') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || payload.id || payload.search);
                if (!numero) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                const { data, error } = await supabase
                    .from('procesos_acreditados')
                    .select('*')
                    .eq('numero_proceso', numero)
                    .limit(1);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar proceso', detail: error.message });
                }

                const proceso = Array.isArray(data) ? data[0] : data;
                if (!proceso) {
                    return jsonResponse(404, { ok: false, error: 'Proceso no encontrado' });
                }

                return jsonResponse(200, { ok: true, proceso });
            }

            // Actualizar cualquier campo de un proceso
            if (payload.action === 'update_proceso') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || payload.id);
                if (!numero) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                // Permitir actualizar solo campos autorizados
                const allowed = ['numero_proceso','cliente','cliente_id','tipo','estado','fecha_recepcion','fecha_entrega_cliente','fecha_finalizado','valor','caso_activo'];
                const updateData = {};
                for (const key of allowed) {
                    if (payload[key] !== undefined) updateData[key] = payload[key];
                }

                // Si el frontend envía el nuevo número por separado, usarlo como valor a actualizar
                if (payload.numero_proceso_nuevo !== undefined && payload.numero_proceso_nuevo !== null && String(payload.numero_proceso_nuevo).trim() !== '') {
                    updateData.numero_proceso = normalizeText(payload.numero_proceso_nuevo);
                }

                // n_informe no se actualiza en edición porque la columna solo admite DEFAULT
                if (updateData.n_informe !== undefined) {
                    delete updateData.n_informe;
                }

                if (Object.keys(updateData).length === 0) return jsonResponse(400, { ok: false, error: 'No hay campos válidos para actualizar' });

                // Si incluye estado, intentar normalizar y probar candidatos primero
                if (updateData.estado !== undefined) {
                    let lastError = null;
                    for (const estadoCandidate of buildStatusCandidates(updateData.estado)) {
                        const attemptData = { ...updateData, estado: estadoCandidate };
                        const { data, error } = await supabase
                            .from('procesos_acreditados')
                            .update(attemptData)
                            .eq('numero_proceso', numero)
                            .select()
                            .limit(1);

                        if (!error) {
                            return jsonResponse(200, { ok: true, proceso: Array.isArray(data) ? data[0] : data });
                        }

                        lastError = error;
                    }

                    return jsonResponse(500, { ok: false, error: 'Error al actualizar proceso', detail: lastError?.message });
                }

                // Intentar actualizar; si falla por columna inexistente, eliminar esa clave y reintentar
                let attemptUpdateData = { ...updateData };
                let lastError = null;
                while (Object.keys(attemptUpdateData).length > 0) {
                    const { data, error } = await supabase
                        .from('procesos_acreditados')
                        .update(attemptUpdateData)
                        .eq('numero_proceso', numero)
                        .select()
                        .limit(1);

                    if (!error) {
                        return jsonResponse(200, { ok: true, proceso: Array.isArray(data) ? data[0] : data });
                    }

                    lastError = error;

                    const msg = String(error.message || error || '').toLowerCase();
                    // detectar nombre de columna faltante en varios formatos
                    const missingCols = [];
                    const m1 = msg.match(/could not find the '([^']+)' column/);
                    if (m1) missingCols.push(m1[1]);
                    const m2 = msg.match(/column\s+\"?([^\"\s]+)\"?\s+does not exist/);
                    if (m2) missingCols.push(m2[1]);
                    const m3 = msg.match(/column\s+\"?([^\"\s]+)\"?\s+can only be updated to default/);
                    if (m3) missingCols.push(m3[1]);

                    if (missingCols.length === 0) break;

                    // eliminar columnas faltantes del payload y reintentar
                    missingCols.forEach(col => {
                        if (attemptUpdateData.hasOwnProperty(col)) delete attemptUpdateData[col];
                        // también intentar variantes con guiones/underscores
                        if (attemptUpdateData.hasOwnProperty(col.replace(/-/g, '_'))) delete attemptUpdateData[col.replace(/-/g, '_')];
                    });
                }

                return jsonResponse(500, { ok: false, error: 'Error al actualizar proceso', detail: lastError?.message });
            }

            // Agregar nuevo proceso
            if (payload.action === 'add_proceso') {
                const insert = payload.insert || {};
                if (!insert.numero_proceso) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                const baseInsert = { ...insert };
                if (baseInsert.caso_activo === undefined) baseInsert.caso_activo = true;

                // Función para intentar insertar, quitando columnas faltantes y reintentando
                async function attemptInsertWithRetry(data) {
                    let attemptData = { ...data };
                    let lastError = null;
                    while (Object.keys(attemptData).length > 0) {
                        const { data: result, error } = await supabase
                            .from('procesos_acreditados')
                            .insert([attemptData])
                            .select()
                            .limit(1);

                        if (!error) {
                            return { ok: true, proceso: Array.isArray(result) ? result[0] : result };
                        }

                        lastError = error;
                        const msg = String(error.message || error || '').toLowerCase();
                        const missingCols = [];
                        const m1 = msg.match(/could not find the '([^']+)' column/);
                        if (m1) missingCols.push(m1[1]);
                        const m2 = msg.match(/column\s+\"?([^\"\s]+)\"?\s+does not exist/);
                        if (m2) missingCols.push(m2[1]);

                        if (missingCols.length === 0) break;

                        missingCols.forEach(col => {
                            delete attemptData[col];
                            delete attemptData[col.replace(/-/g, '_')];
                        });
                    }
                    return { ok: false, error: lastError?.message || 'Error al crear proceso' };
                }

                // Si el estado viene con valor, intentar normalizar probando candidatos
                if (baseInsert.estado) {
                    for (const estadoCandidate of buildStatusCandidates(insert.estado)) {
                        const attemptInsert = { ...baseInsert, estado: estadoCandidate };
                        const result = await attemptInsertWithRetry(attemptInsert);
                        if (result.ok) return jsonResponse(200, result);
                    }
                    return jsonResponse(500, { ok: false, error: 'Error al crear proceso' });
                }

                const result = await attemptInsertWithRetry(baseInsert);
                return jsonResponse(result.ok ? 200 : 500, result);
            }

            // Agregar nuevo cliente
            if (payload.action === 'add_cliente') {
                const { nombre_empresa, nit, email, password } = payload;

                if (!nombre_empresa || !nit || !email || !password) {
                    return jsonResponse(400, { ok: false, error: 'Faltan campos requeridos' });
                }

                const baseInsert = {
                    nombre_empresa: nombre_empresa.trim(),
                    email: email.trim().toLowerCase(),
                    password
                };

                const insertCandidates = [
                    { ...baseInsert, nit: nit.trim() },
                    { ...baseInsert, nit_empresa: nit.trim() }
                ];

                let data = null;
                let error = null;
                for (const candidate of insertCandidates) {
                    const result = await supabase
                        .from('clientes')
                        .insert([candidate])
                        .select('*');

                    data = result.data;
                    error = result.error;

                    if (!error) {
                        break;
                    }

                    const msg = String(error.message || '').toLowerCase();
                    const missingNitColumn = msg.includes("'nit' column") || msg.includes('column "nit" does not exist');
                    if (!missingNitColumn && candidate.nit !== undefined) {
                        break;
                    }
                }

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
                const { id, nombre_empresa, nit, email, password } = payload;

                if (!id || !nombre_empresa || !nit || !email) {
                    return jsonResponse(400, { ok: false, error: 'Faltan campos requeridos' });
                }

                const baseUpdate = {
                    nombre_empresa: nombre_empresa.trim(),
                    email: email.trim().toLowerCase()
                };
                if (password && password.trim()) {
                    baseUpdate.password = password;
                }

                const updateCandidates = [
                    { ...baseUpdate, nit: nit.trim() },
                    { ...baseUpdate, nit_empresa: nit.trim() }
                ];

                let data = null;
                let error = null;
                for (const candidate of updateCandidates) {
                    const result = await supabase
                        .from('clientes')
                        .update(candidate)
                        .eq('id', id)
                        .select('*');

                    data = result.data;
                    error = result.error;

                    if (!error) {
                        break;
                    }

                    const msg = String(error.message || '').toLowerCase();
                    const missingNitColumn = msg.includes("'nit' column") || msg.includes('column "nit" does not exist');
                    if (!missingNitColumn && candidate.nit !== undefined) {
                        break;
                    }
                }

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

            // ============================================
            // BORRADORES (Casos en Progreso) - Sync Server
            // ============================================

            if (payload.action === 'get_borradores') {
                const { data, error } = await supabase
                    .from('borradores')
                    .select('datos')
                    .order('created_at', { ascending: false });
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener borradores', detail: error.message });
                }
                // Unir todos los borradores de todos los usuarios
                const allDrafts = [];
                if (Array.isArray(data)) {
                    data.forEach(row => {
                        if (Array.isArray(row.datos)) {
                            row.datos.forEach(d => {
                                if (!allDrafts.some(x => JSON.stringify(x) === JSON.stringify(d))) {
                                    allDrafts.push(d);
                                }
                            });
                        }
                    });
                }
                return jsonResponse(200, { ok: true, data: allDrafts });
            }

            if (payload.action === 'save_borradores') {
                const usuarioEmail = normalizeText(payload.usuario_email).toLowerCase() || 'shared';
                const drafts = payload.drafts;
                if (!Array.isArray(drafts)) {
                    return jsonResponse(400, { ok: false, error: 'drafts debe ser un array' });
                }
                const { data: existing } = await supabase
                    .from('borradores')
                    .select('id')
                    .eq('usuario_email', usuarioEmail)
                    .limit(1);

                const row = Array.isArray(existing) ? existing[0] : null;
                let result;
                if (row) {
                    result = await supabase
                        .from('borradores')
                        .update({ datos: drafts, updated_at: new Date().toISOString() })
                        .eq('id', row.id)
                        .select('id');
                } else {
                    result = await supabase
                        .from('borradores')
                        .insert({ usuario_email: usuarioEmail, datos: drafts })
                        .select('id');
                }
                if (result.error) {
                    return jsonResponse(500, { ok: false, error: 'Error al guardar borradores', detail: result.error.message });
                }
                return jsonResponse(200, { ok: true, message: 'Borradores guardados' });
            }

            if (payload.action === 'delete_borrador') {
                const cotizacion = normalizeText(payload.cotizacion);
                if (!cotizacion) {
                    return jsonResponse(400, { ok: false, error: 'Se requiere cotizacion' });
                }
                // Buscar en TODAS las filas de borradores
                const { data: allRows } = await supabase
                    .from('borradores')
                    .select('id, datos');
                if (!Array.isArray(allRows)) {
                    return jsonResponse(200, { ok: true, message: 'No hay borradores' });
                }
                for (const row of allRows) {
                    if (!Array.isArray(row.datos)) continue;
                    const filtered = row.datos.filter(d => String(d.cotizacion || d.quoteNumber || '') !== cotizacion);
                    if (filtered.length !== row.datos.length) {
                        await supabase
                            .from('borradores')
                            .update({ datos: filtered, updated_at: new Date().toISOString() })
                            .eq('id', row.id);
                    }
                }
                return jsonResponse(200, { ok: true, message: 'Borrador eliminado' });
            }

            // Guardar detalle del proceso (elementos recibidos en recepción)
            if (payload.action === 'add_detalle_proceso') {
                const detalle = payload.detalle || [];
                if (!Array.isArray(detalle) || detalle.length === 0) {
                    return jsonResponse(400, { ok: false, error: 'detalle debe ser un array no vacío' });
                }

                // Validar que cada registro tenga los campos requeridos
                for (const item of detalle) {
                    if (!item.proceso_id || !item.ensayo_id) {
                        return jsonResponse(400, { ok: false, error: 'proceso_id y ensayo_id son requeridos para cada item' });
                    }
                }

                const { data, error } = await supabase
                    .from('detalle_procesos_ac')
                    .insert(detalle)
                    .select();

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al guardar detalle del proceso', detail: error.message });
                }

                return jsonResponse(200, { ok: true, detalle: data || [] });
            }

            // Obtener detalle de un proceso
            if (payload.action === 'get_detalle_proceso') {
                const procesoId = payload.proceso_id;
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }

                const { data, error } = await supabase
                    .from('detalle_procesos_ac')
                    .select('*')
                    .eq('proceso_id', procesoId);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar detalle del proceso', detail: error.message });
                }

                return jsonResponse(200, { ok: true, detalle: data || [] });
            }

            // =============================================
            // COTIZACIONES - CRUD completo
            // =============================================

            // Listar cotizaciones con filtros opcionales
            if (payload.action === 'get_cotizaciones') {
                let query = supabase
                    .from('cotizaciones_ac')
                    .select('*');

                if (payload.estado) {
                    query = query.eq('estado', payload.estado);
                }
                if (payload.cliente) {
                    query = query.ilike('cliente', `%${payload.cliente}%`);
                }
                if (payload.cotizacion) {
                    query = query.ilike('cotizacion', `%${payload.cotizacion}%`);
                }

                query = query.order('created_at', { ascending: false });

                if (payload.limit) {
                    query = query.limit(payload.limit);
                }
                if (payload.offset) {
                    query = query.range(payload.offset, payload.offset + (payload.limit || 50) - 1);
                }

                const { data, error } = await query;

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar cotizaciones', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cotizaciones: data || [] });
            }

            // Obtener una cotización por ID
            if (payload.action === 'get_cotizacion') {
                if (!payload.id) {
                    return jsonResponse(400, { ok: false, error: 'id requerido' });
                }

                const { data, error } = await supabase
                    .from('cotizaciones_ac')
                    .select('*')
                    .eq('id', payload.id)
                    .single();

                if (error) {
                    return jsonResponse(404, { ok: false, error: 'Cotización no encontrada', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cotizacion: data });
            }

            // Crear cotización
            if (payload.action === 'add_cotizacion') {
                const procesoId = payload.proceso_id;
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }

                const cotizacionData = {
                    proceso_id: procesoId,
                    cotizacion: normalizeText(payload.cotizacion),
                    cliente: normalizeText(payload.cliente),
                    informe_nombre: normalizeText(payload.informe_nombre),
                    items: payload.items || [],
                    total_items: payload.total_items || 0,
                    total_valor: payload.total_valor || 0,
                    estado: payload.estado || 'borrador'
                };

                const { data, error } = await supabase
                    .from('cotizaciones_ac')
                    .insert(cotizacionData)
                    .select()
                    .single();

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al crear cotización', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cotizacion: data });
            }

            // Actualizar cotización
            if (payload.action === 'update_cotizacion') {
                if (!payload.id) {
                    return jsonResponse(400, { ok: false, error: 'id requerido' });
                }

                const updates = {};
                if (payload.estado !== undefined) updates.estado = payload.estado;
                if (payload.items !== undefined) updates.items = payload.items;
                if (payload.total_items !== undefined) updates.total_items = payload.total_items;
                if (payload.total_valor !== undefined) updates.total_valor = payload.total_valor;
                if (payload.cliente !== undefined) updates.cliente = normalizeText(payload.cliente);
                if (payload.informe_nombre !== undefined) updates.informe_nombre = normalizeText(payload.informe_nombre);

                const { data, error } = await supabase
                    .from('cotizaciones_ac')
                    .update(updates)
                    .eq('id', payload.id)
                    .select()
                    .single();

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al actualizar cotización', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cotizacion: data });
            }

            // Cambiar estado de cotización
            if (payload.action === 'update_cotizacion_estado') {
                if (!payload.id) {
                    return jsonResponse(400, { ok: false, error: 'id requerido' });
                }
                if (!payload.estado) {
                    return jsonResponse(400, { ok: false, error: 'estado requerido' });
                }

                const { data, error } = await supabase
                    .from('cotizaciones_ac')
                    .update({ estado: payload.estado })
                    .eq('id', payload.id)
                    .select()
                    .single();

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al cambiar estado', detail: error.message });
                }

                return jsonResponse(200, { ok: true, cotizacion: data });
            }

            // Eliminar cotización
            if (payload.action === 'delete_cotizacion') {
                if (!payload.id) {
                    return jsonResponse(400, { ok: false, error: 'id requerido' });
                }

                const { error } = await supabase
                    .from('cotizaciones_ac')
                    .delete()
                    .eq('id', payload.id);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al eliminar cotización', detail: error.message });
                }

                return jsonResponse(200, { ok: true });
            }

            // Generar cotización desde una recepción existente
            if (payload.action === 'generar_cotizacion') {
                const procesoId = payload.proceso_id;
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }

                // 1. Obtener el proceso
                const { data: proceso, error: errProceso } = await supabase
                    .from('procesos_acreditados')
                    .select('*')
                    .eq('id', procesoId)
                    .single();

                if (errProceso || !proceso) {
                    return jsonResponse(404, { ok: false, error: 'Recepción no encontrada' });
                }

                // 2. Obtener el detalle (items)
                const { data: detalle } = await supabase
                    .from('detalle_procesos_ac')
                    .select('*, ensayos_acreditados(nombre, categoria)')
                    .eq('proceso_id', procesoId);

                // 3. Construir items para la cotización
                const items = [];
                if (Array.isArray(detalle)) {
                    for (const d of detalle) {
                        items.push({
                            ensayo_id: d.ensayo_id,
                            nombre: d.ensayos_acreditados?.nombre || '',
                            categoria: d.ensayos_acreditados?.categoria || '',
                            cantidad: d.cantidad || 0,
                            marca: d.marca || '',
                            precio_unitario: 0,
                            subtotal: 0
                        });
                    }
                }

                // 4. Crear la cotización
                const cotizacionData = {
                    proceso_id: procesoId,
                    cotizacion: normalizeText(proceso.numero_proceso),
                    cliente: normalizeText(proceso.cliente),
                    informe_nombre: normalizeText(proceso.n_informe),
                    items: items,
                    total_items: items.length,
                    total_valor: 0,
                    estado: 'borrador'
                };

                const { data: nuevaCotizacion, error: errInsert } = await supabase
                    .from('cotizaciones_ac')
                    .insert(cotizacionData)
                    .select()
                    .single();

                if (errInsert) {
                    return jsonResponse(500, { ok: false, error: 'Error al crear cotización', detail: errInsert.message });
                }

                return jsonResponse(200, { ok: true, cotizacion: nuevaCotizacion });
            }

            // Duplicar cotización
            if (payload.action === 'duplicate_cotizacion') {
                if (!payload.id) {
                    return jsonResponse(400, { ok: false, error: 'id requerido' });
                }

                const { data: original, error: errFind } = await supabase
                    .from('cotizaciones_ac')
                    .select('*')
                    .eq('id', payload.id)
                    .single();

                if (errFind || !original) {
                    return jsonResponse(404, { ok: false, error: 'Cotización original no encontrada' });
                }

                const copia = {
                    proceso_id: original.proceso_id,
                    cotizacion: normalizeText(original.cotizacion),
                    cliente: original.cliente,
                    informe_nombre: original.informe_nombre,
                    items: original.items,
                    total_items: original.total_items,
                    total_valor: original.total_valor,
                    estado: 'borrador'
                };

                const { data: nueva, error: errDup } = await supabase
                    .from('cotizaciones_ac')
                    .insert(copia)
                    .select()
                    .single();

                if (errDup) {
                    return jsonResponse(500, { ok: false, error: 'Error al duplicar cotización', detail: errDup.message });
                }

                return jsonResponse(200, { ok: true, cotizacion: nueva });
            }

            return jsonResponse(400, { ok: false, error: 'Acción no soportada' });
        } catch (err) {
            return jsonResponse(500, { ok: false, error: err.message });
        }
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
};