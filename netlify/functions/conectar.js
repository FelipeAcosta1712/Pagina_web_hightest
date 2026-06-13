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
                const { estado, cliente, tipo, month, date, search, limit, offset } = payload;

                let query = supabase
                    .from('procesos_acreditados')
                    .select('*');

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
                if (!numero || !estado) return jsonResponse(400, { ok: false, error: 'numero_proceso y estado son requeridos' });

                let lastError = null;
                for (const estadoCandidate of buildStatusCandidates(estado)) {
                    const updateData = { estado: estadoCandidate };
                    if (fechaEntrega) updateData.fecha_entrega_cliente = fechaEntrega;
                    if (fechaFinalizado) updateData.fecha_finalizado = fechaFinalizado;
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
                const allowed = ['numero_proceso','cliente','cliente_id','tipo','estado','fecha_recepcion','fecha_entrega_cliente','fecha_finalizado','valor'];
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

                // Algunas bases no tienen esta columna; no la usamos para bloquear números
                const baseInsert = { ...insert };
                delete baseInsert.observaciones;

                // Si el estado viene con valor, intentar normalizar probando candidatos
                if (baseInsert.estado) {
                    let lastError = null;
                    for (const estadoCandidate of buildStatusCandidates(insert.estado)) {
                        const attemptInsert = { ...baseInsert, estado: estadoCandidate };
                        const { data, error } = await supabase
                            .from('procesos_acreditados')
                            .insert([attemptInsert])
                            .select()
                            .limit(1);

                        if (!error) {
                            return jsonResponse(200, { ok: true, proceso: Array.isArray(data) ? data[0] : data });
                        }
                        lastError = error;
                    }

                    // Si todos los candidatos fallaron, retornar el último error
                    return jsonResponse(500, { ok: false, error: 'Error al crear proceso', detail: lastError?.message });
                }

                // Si no hay estado o está vacío, insertar directamente
                const { data, error } = await supabase
                    .from('procesos_acreditados')
                    .insert([baseInsert])
                    .select()
                    .limit(1);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al crear proceso', detail: error.message });
                }

                return jsonResponse(200, { ok: true, proceso: Array.isArray(data) ? data[0] : data });
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

            return jsonResponse(400, { ok: false, error: 'Acción no soportada' });
        } catch (err) {
            return jsonResponse(500, { ok: false, error: err.message });
        }
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
};