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
            // console.log('ACTION RECIBIDA:', payload.action);

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
                    contact: pickFirstValue(row, ['contacto_principal', 'contacto', 'representante', 'nombre_completo']) || null,
                    created_at: row.created_at || row.fecha_registro || row.fecha_creacion || null
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

            // Obtener todos los usuarios con campos completos para el panel de administración
            if (payload.action === 'get_all_usuarios') {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('*')
                    .order('nombre', { ascending: true });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener usuarios', detail: error.message });
                }

                const usuarios = (data || []).map(u => ({
                    id: u.id,
                    nombre: u.nombre || '',
                    email: u.email || '',
                    rol: u.rol || 'usuario',
                    estado: u.estado || u.activo !== undefined ? (u.activo === false ? 'inactivo' : 'activo') : 'activo',
                    telefono: u.telefono || u.teléfono || u.phone || u.celular || '',
                    documento: u.documento || u.cedula || u.cc || u.identificacion || '',
                    area: u.area || u.departamento || u.department || '',
                    ultimo_acceso: u.ultimo_acceso || u.last_login || u.ultimo_inicio || '',
                    fecha_registro: u.fecha_registro || u.created_at || u.fecha_creacion || '',
                    avatar: u.avatar || u.foto || u.photo || u.imagen || ''
                }));

                return jsonResponse(200, { ok: true, usuarios });
            }

            // Actualizar estado de un usuario
            if (payload.action === 'update_usuario_status') {
                const userId = payload.id;
                const newStatus = normalizeText(payload.estado).toLowerCase();

                if (!userId || !newStatus) {
                    return jsonResponse(400, { ok: false, error: 'Se requiere id y estado' });
                }

                const { data, error } = await supabase
                    .from('usuarios')
                    .update({ estado: newStatus, activo: newStatus === 'activo' })
                    .eq('id', userId)
                    .select('id, nombre, estado');

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al actualizar usuario', detail: error.message });
                }

                return jsonResponse(200, { ok: true, usuario: data?.[0] || null });
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

            // Obtener cliente por nombre (para buscar NIT)
            if (payload.action === 'get_cliente_by_nombre') {
                const nombre = normalizeText(payload.nombre || '');
                if (!nombre) return jsonResponse(400, { ok: false, error: 'nombre requerido' });

                const { data, error } = await supabase
                    .from('clientes')
                    .select('*')
                    .ilike('nombre_empresa', `%${nombre}%`)
                    .limit(1);

                if (error) return jsonResponse(500, { ok: false, error: error.message });
                if (!data || data.length === 0) return jsonResponse(200, { ok: false, error: 'Cliente no encontrado' });

                return jsonResponse(200, { ok: true, cliente: data[0] });
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

                // Obtener conteo de elementos distintos por proceso_id
                const procesos = data || [];
                const ids = procesos.map(p => p.id).filter(Boolean);
                let conteosMap = {};
                if (ids.length > 0) {
                    const { data: marcData } = await supabase
                        .from('marcaciones_ac')
                        .select('proceso_id, elemento');
                    (marcData || []).forEach(m => {
                        const pid = String(m.proceso_id).trim();
                        if (!conteosMap[pid]) conteosMap[pid] = new Set();
                        if (m.elemento) conteosMap[pid].add(m.elemento.trim());
                    });
                }
                procesos.forEach(p => {
                    const set = conteosMap[String(p.id).trim()];
                    p.total_items = set ? set.size : 0;
                });

                return jsonResponse(200, { ok: true, procesos });
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

                console.log('[Backend get_proceso]', { numero_proceso: proceso.numero_proceso, informe_a_nombre_de: proceso.informe_a_nombre_de, cliente: proceso.cliente, full: proceso });
                return jsonResponse(200, { ok: true, proceso });
            }

            // Actualizar cualquier campo de un proceso
            if (payload.action === 'update_proceso') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || payload.id);
                if (!numero) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                // Permitir actualizar solo campos autorizados
                const allowed = ['numero_proceso','cliente','cliente_id','tipo','estado','fecha_recepcion','fecha_entrega_cliente','fecha_finalizado','valor','caso_activo','informe_a_nombre_de','facturar_a_nombre_de','fecha_ejecucion','n_remision','responsable_marcacion'];
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
                const { nombre_empresa, nit, email, password, telefono, direccion, contacto_principal } = payload;

                if (!nombre_empresa || !nit || !email || !password) {
                    return jsonResponse(400, { ok: false, error: 'Faltan campos requeridos' });
                }

                const baseInsert = {
                    nombre_empresa: nombre_empresa.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    telefono: telefono || '',
                    direccion: direccion || '',
                    contacto_principal: contacto_principal || ''
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
                const { id, nombre_empresa, nit, email, password, telefono, direccion, contacto_principal } = payload;

                if (!id || !nombre_empresa || !nit || !email) {
                    return jsonResponse(400, { ok: false, error: 'Faltan campos requeridos' });
                }

                const baseUpdate = {
                    nombre_empresa: nombre_empresa.trim(),
                    email: email.trim().toLowerCase(),
                    telefono: telefono || '',
                    direccion: direccion || '',
                    contacto_principal: contacto_principal || ''
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
                    .select('*, ensayos_acreditados(nombre, categoria)')
                    .eq('proceso_id', procesoId)
                    .order('id', { ascending: true });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar detalle del proceso', detail: error.message });
                }

                const detalle = Array.isArray(data) ? data.map(d => ({
                    ...d,
                    ensayo_nombre: d.ensayos_acreditados?.nombre || d.ensayo_nombre || '',
                    ensayo_categoria: d.ensayos_acreditados?.categoria || ''
                })) : [];

                return jsonResponse(200, { ok: true, detalle });
            }

            // Obtener conteo de items por todos los procesos (para modal PDFs)
            if (payload.action === 'get_all_detalle_procesos') {
                // Contar desde ambas tablas y usar el mayor
                const [resDetalle, resMarc] = await Promise.all([
                    supabase.from('detalle_procesos_ac').select('proceso_id, id'),
                    supabase.from('marcaciones_ac').select('proceso_id, elemento')
                ]);

                const conteos = {};

                // Contar desde detalle_procesos_ac
                (resDetalle.data || []).forEach(d => {
                    const pid = String(d.proceso_id).trim();
                    if (!conteos[pid]) conteos[pid] = 0;
                    conteos[pid]++;
                });

                // Contar elementos distintos desde marcaciones_ac
                const marcPorProceso = {};
                (resMarc.data || []).forEach(m => {
                    const pid = String(m.proceso_id).trim();
                    if (!marcPorProceso[pid]) marcPorProceso[pid] = new Set();
                    if (m.elemento) marcPorProceso[pid].add(m.elemento.trim());
                });

                // Usar el mayor de ambos conteos
                for (const pid in marcPorProceso) {
                    const marcCount = marcPorProceso[pid].size;
                    if (!conteos[pid] || marcCount > conteos[pid]) {
                        conteos[pid] = marcCount;
                    }
                }

                return jsonResponse(200, { ok: true, conteos });
            }

            // Actualizar marcación de un item del detalle
            if (payload.action === 'update_marcacion') {
                const { detalle_id, marcacion, observacion_tecnica } = payload;
                if (!detalle_id) return jsonResponse(400, { ok: false, error: 'detalle_id requerido' });

                const updateData = {};
                if (marcacion !== undefined) updateData.marcacion = marcacion;
                if (observacion_tecnica !== undefined) updateData.observacion_tecnica = observacion_tecnica;

                if (Object.keys(updateData).length === 0) {
                    return jsonResponse(400, { ok: false, error: 'No hay campos para actualizar' });
                }

                const { data, error } = await supabase
                    .from('detalle_procesos_ac')
                    .update(updateData)
                    .eq('id', detalle_id)
                    .select()
                    .limit(1);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al actualizar marcación', detail: error.message });
                }

                return jsonResponse(200, { ok: true, item: Array.isArray(data) ? data[0] : data });
            }

            // Actualizar marcación de múltiples items de una vez
            if (payload.action === 'update_marcacion_batch') {
                const { marcaciones } = payload;
                // console.log('UPDATE_MARCACION_BATCH marcaciones:', marcaciones, 'isArray:', Array.isArray(marcaciones), 'length:', marcaciones?.length);
                if (!Array.isArray(marcaciones) || marcaciones.length === 0) {
                    return jsonResponse(400, { ok: false, error: 'Array marcaciones requerido' });
                }

                const results = [];
                let hasError = false;
                let firstError = null;

                for (const item of marcaciones) {
                    const { detalle_id, marcacion, observacion_tecnica } = item;
                    if (!detalle_id) continue;

                    const updateData = {};
                    if (marcacion !== undefined) updateData.marcacion = marcacion;
                    if (observacion_tecnica !== undefined) updateData.observacion_tecnica = observacion_tecnica;

                    if (Object.keys(updateData).length === 0) continue;

                    const { data, error } = await supabase
                        .from('detalle_procesos_ac')
                        .update(updateData)
                        .eq('id', detalle_id)
                        .select()
                        .limit(1);

                    if (error) {
                        hasError = true;
                        if (!firstError) firstError = error;
                        console.error('Error actualizando marcación detalle_id:', detalle_id, error.message);
                    } else {
                        results.push(Array.isArray(data) ? data[0] : data);
                    }
                }

                if (hasError && results.length === 0) {
                    return jsonResponse(500, { ok: false, error: 'Error al actualizar marcaciones', detail: firstError?.message || 'Verificar columnas marcacion y observacion_tecnica' });
                }

                return jsonResponse(200, { ok: true, updated: results });
            }

            // =============================================
            // MARCACIONES - Insertar/actualizar consecutivos
            // =============================================
            if (payload.action === 'create_marcaciones_batch') {
                const { marcaciones } = payload;
                if (!Array.isArray(marcaciones)) {
                    return jsonResponse(400, { ok: false, error: 'Array marcaciones requerido' });
                }

                const procesoId = payload.proceso_id || (marcaciones.length > 0 ? marcaciones[0].proceso_id : null);
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }

                if (marcaciones.length === 0) {
                    return jsonResponse(200, { ok: true, updated: [], deleted: 0 });
                }

                // FASE 1: Eliminar marcaciones existentes para este proceso
                const { error: deleteError } = await supabase
                    .from('marcaciones_ac')
                    .delete()
                    .eq('proceso_id', procesoId);

                if (deleteError) {
                    console.error('[create_marcaciones_batch] Error eliminando marcaciones existentes:', deleteError.message);
                    return jsonResponse(500, {
                        ok: false,
                        error: 'Error al eliminar marcaciones existentes',
                        detail: deleteError.message
                    });
                }

                // FASE 2: Insertar todas las marcaciones nuevas
                const results = [];
                let hasError = false;
                let firstError = null;

                const BATCH_SIZE = 50;

                for (let i = 0; i < marcaciones.length; i += BATCH_SIZE) {
                    const batch = marcaciones.slice(i, i + BATCH_SIZE)
                        .map(item => ({
                            proceso_id: item.proceso_id,
                            detalle_id: item.detalle_id || null,
                            ensayo_id: item.ensayo_id || null,
                            consecutivo: item.consecutivo,
                            elemento: item.elemento || '',
                            descripcion: item.descripcion || '',
                            estado: item.estado || 'Pendiente',
                            observacion: item.observacion || '',
                            nci: item.nci || ''
                        }));

                    if (batch.length === 0) continue;

                    let insertBatch = batch;
                    let inserted = false;

                    for (let attempt = 0; attempt < 3; attempt++) {
                        const { data, error } = await supabase
                            .from('marcaciones_ac')
                            .insert(insertBatch)
                            .select();

                        if (!error) {
                            results.push(...(Array.isArray(data) ? data : [data]));
                            inserted = true;
                            break;
                        }

                        console.error('Error insertando marcaciones_ac (attempt ' + (attempt + 1) + '):', error.message);

                        const msg = String(error.message || '').toLowerCase();
                        const missingCols = [];
                        const m1 = msg.match(/could not find the '([^']+)' column/);
                        if (m1) missingCols.push(m1[1]);
                        const m2 = msg.match(/column\s+"?([^"\s]+)"?\s+does not exist/);
                        if (m2) missingCols.push(m2[1]);

                        if (missingCols.length === 0) {
                            hasError = true;
                            if (!firstError) firstError = error;
                            break;
                        }

                        insertBatch = insertBatch.map(item => {
                            const clean = { ...item };
                            missingCols.forEach(col => { delete clean[col]; });
                            return clean;
                        });
                    }

                    if (!inserted && insertBatch.length > 0 && !hasError) {
                        hasError = true;
                        if (!firstError) firstError = { message: 'Columnas faltantes en marcaciones_ac' };
                    }
                }

                if (hasError && results.length === 0) {
                    return jsonResponse(500, {
                        ok: false,
                        error: 'Error al crear marcaciones',
                        detail: firstError?.message || 'Verificar tabla marcaciones_ac'
                    });
                }

                return jsonResponse(200, { ok: true, updated: results });
            }

            // =============================================
            // MARCACIONES - Consultar por proceso
            // =============================================
            // =============================================
            // MARCACIONES - Actualizar una marcación en marcaciones_ac
            // =============================================
            if (payload.action === 'update_marcacion_ac') {
                const { marcacion_id, nci, observacion, estado } = payload;
                if (!marcacion_id) return jsonResponse(400, { ok: false, error: 'marcacion_id requerido' });

                const updateData = { fecha_modificacion: new Date().toISOString() };
                if (nci !== undefined) updateData.nci = nci;
                if (observacion !== undefined) updateData.observacion = observacion;
                if (estado !== undefined) updateData.estado = estado;

                const { data, error } = await supabase
                    .from('marcaciones_ac')
                    .update(updateData)
                    .eq('id', marcacion_id)
                    .select()
                    .limit(1);

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al actualizar marcación', detail: error.message });
                }
                return jsonResponse(200, { ok: true, item: Array.isArray(data) ? data[0] : data });
            }

            if (payload.action === 'get_marcaciones_by_proceso') {
                const procesoId = payload.proceso_id;
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }

                const { data, error } = await supabase
                    .from('marcaciones_ac')
                    .select('*')
                    .eq('proceso_id', procesoId)
                    .order('consecutivo', { ascending: true });

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar marcaciones', detail: error.message });
                }

                return jsonResponse(200, { ok: true, marcaciones: data || [] });
            }

            // =============================================
            // MARCACIONES - Resumen por todos los procesos
            // =============================================
            if (payload.action === 'get_marcaciones_resumen') {
                const { data, error } = await supabase
                    .from('marcaciones_ac')
                    .select('proceso_id, estado');

                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar resumen de marcaciones', detail: error.message });
                }

                // Resumen por proceso_id (puede ser numérico o string como "R26 0046")
                const resumen = {};
                (data || []).forEach(m => {
                    const pid = String(m.proceso_id || '').trim();
                    if (!pid) return;
                    if (!resumen[pid]) {
                        resumen[pid] = { total: 0, marcados: 0, pendientes: 0, otros: 0 };
                    }
                    resumen[pid].total++;
                    const est = String(m.estado || '').toLowerCase();
                    if (est === 'marcado') resumen[pid].marcados++;
                    else if (est === 'pendiente') resumen[pid].pendientes++;
                    else resumen[pid].otros++;
                });

                return jsonResponse(200, { ok: true, resumen });
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

            // ── GESTIÓN DE INFORMES (informes_ensayo_ac + Storage) ──

            // Obtener informes de un proceso
            if (payload.action === 'get_informes_proceso') {
                const procesoId = normalizeText(payload.proceso_id);
                if (!procesoId) return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });

                const { data, error } = await supabase
                    .from('informes_ensayo_ac')
                    .select('*')
                    .eq('proceso_id', procesoId)
                    .order('version', { ascending: false });

                if (error) return jsonResponse(500, { ok: false, error: error.message });
                return jsonResponse(200, { ok: true, informes: data || [] });
            }

            // Buscar informe público por número (para verificación pública)
            // Busca directamente en procesos_acreditados por n_informe
            if (payload.action === 'search_informe_publico') {
                const nInforme = normalizeText(payload.n_informe);
                if (!nInforme) return jsonResponse(400, { ok: false, error: 'n_informe requerido' });

                // 1. Buscar en procesos_acreditados por n_informe (exacto)
                let { data: proceso } = await supabase
                    .from('procesos_acreditados')
                    .select('*')
                    .ilike('n_informe', nInforme)
                    .maybeSingle();

                // 2. Si no encontró, buscar sin espacios ni guiones
                if (!proceso) {
                    const stripped = nInforme.replace(/[\s\-]/g, '');
                    const { data: todos } = await supabase
                        .from('procesos_acreditados')
                        .select('*');
                    if (todos) {
                        proceso = todos.find(p => {
                            const pNorm = (p.n_informe || '').toUpperCase().replace(/[\s\-]/g, '');
                            return pNorm === stripped;
                        }) || null;
                    }
                }

                if (!proceso) return jsonResponse(200, { ok: false, found: false, message: 'Informe no encontrado' });

                // Buscar informe activo asociado al proceso (si existe)
                const { data: informeActivo } = await supabase
                    .from('informes_ensayo_ac')
                    .select('*')
                    .eq('proceso_id', proceso.id)
                    .eq('activo', true)
                    .order('version', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                return jsonResponse(200, {
                    ok: true,
                    found: true,
                    informe: {
                        n_informe: proceso.n_informe,
                        fecha_recepcion: informeActivo?.fecha_recepcion || proceso.fecha_recepcion || '—',
                        fecha_entrega_cliente: informeActivo?.fecha_entrega_cliente || proceso.fecha_entrega_cliente || '—',
                        version: informeActivo?.version || 1,
                        activo: informeActivo?.activo ?? true,
                        nombre_documento: informeActivo?.nombre_documento || proceso.n_informe || '—',
                        cliente: proceso.cliente || proceso.empresa || '—',
                        informe_a_nombre_de: proceso.informe_a_nombre_de || proceso.cliente || proceso.empresa || '—',
                        numero_proceso: proceso.numero_proceso || '—',
                        producto: proceso.producto || '—',
                        tipo_prueba: proceso.tipo_prueba || '—',
                        norma_referencia: proceso.norma_referencia || '—',
                        estado: proceso.estado || '—',
                    }
                });
            }

            // Obtener informe activo de un proceso
            if (payload.action === 'get_informe_activo') {
                const procesoId = normalizeText(payload.proceso_id);
                if (!procesoId) return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });

                const { data, error } = await supabase
                    .from('informes_ensayo_ac')
                    .select('*')
                    .eq('proceso_id', procesoId)
                    .eq('activo', true)
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') return jsonResponse(500, { ok: false, error: error.message });
                return jsonResponse(200, { ok: true, informe: data || null });
            }

            // Subir informe PDF (con versionado automático)
            if (payload.action === 'upload_informe') {
                const procesoId = normalizeText(payload.proceso_id);
                const nombreDocumento = normalizeText(payload.nombre_documento);
                const archivoPdf = normalizeText(payload.archivo_pdf);
                if (!procesoId || !archivoPdf) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id y archivo_pdf requeridos' });
                }

                // Obtener última versión del proceso
                const { data: existing } = await supabase
                    .from('informes_ensayo_ac')
                    .select('version')
                    .eq('proceso_id', procesoId)
                    .order('version', { ascending: false })
                    .limit(1);

                const nextVersion = (existing && existing.length > 0) ? (existing[0].version || 0) + 1 : 1;

                // Desactivar versiones anteriores
                await supabase
                    .from('informes_ensayo_ac')
                    .update({ activo: false })
                    .eq('proceso_id', procesoId)
                    .eq('activo', true);

                // Insertar nueva versión
                const insertData = {
                    proceso_id: procesoId,
                    nombre_documento: nombreDocumento || `Informe ${procesoId}`,
                    archivo_pdf: archivoPdf,
                    version: nextVersion,
                    activo: true
                };

                const { data: nuevoInforme, error: errInsert } = await supabase
                    .from('informes_ensayo_ac')
                    .insert(insertData)
                    .select()
                    .single();

                if (errInsert) return jsonResponse(500, { ok: false, error: errInsert.message });
                return jsonResponse(200, { ok: true, informe: nuevoInforme });
            }

            // Subir archivo PDF a Storage + crear registro en informes_ensayo_ac
            if (payload.action === 'upload_informe_file') {
                const procesoId = normalizeText(payload.proceso_id);
                const nombreDocumento = normalizeText(payload.nombre_documento);
                const fileBase64 = payload.file_base64;
                const fileMime = payload.file_mime || 'application/pdf';
                const fileExt = payload.file_ext || 'pdf';
                if (!procesoId || !fileBase64) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id y file_base64 requeridos' });
                }

                // Decodificar base64
                const buffer = Buffer.from(fileBase64, 'base64');
                const filePath = `${procesoId}/${Date.now()}_informe.${fileExt}`;

                // Subir a Supabase Storage
                const { error: uploadError } = await supabase
                    .storage
                    .from('Informes')
                    .upload(filePath, buffer, { contentType: fileMime, upsert: false });

                if (uploadError) {
                    return jsonResponse(500, { ok: false, error: 'Error subiendo archivo: ' + uploadError.message });
                }

                // Obtener URL pública
                const { data: urlData } = supabase
                    .storage
                    .from('Informes')
                    .getPublicUrl(filePath);

                const publicUrl = urlData?.publicUrl || '';

                // Obtener última versión
                const { data: existing } = await supabase
                    .from('informes_ensayo_ac')
                    .select('version')
                    .eq('proceso_id', procesoId)
                    .order('version', { ascending: false })
                    .limit(1);

                const nextVersion = (existing && existing.length > 0) ? (existing[0].version || 0) + 1 : 1;

                // Desactivar versiones anteriores
                await supabase
                    .from('informes_ensayo_ac')
                    .update({ activo: false })
                    .eq('proceso_id', procesoId)
                    .eq('activo', true);

                // Insertar registro
                const insertData = {
                    proceso_id: procesoId,
                    nombre_documento: nombreDocumento || `Informe ${procesoId}`,
                    archivo_pdf: publicUrl || filePath,
                    version: nextVersion,
                    activo: true
                };

                const { data: nuevoInforme, error: errInsert } = await supabase
                    .from('informes_ensayo_ac')
                    .insert(insertData)
                    .select()
                    .single();

                if (errInsert) return jsonResponse(500, { ok: false, error: errInsert.message });
                return jsonResponse(200, { ok: true, informe: nuevoInforme });
            }

            // Eliminar informe
            if (payload.action === 'delete_informe') {
                const id = payload.id;
                if (!id) return jsonResponse(400, { ok: false, error: 'id requerido' });

                const { error } = await supabase
                    .from('informes_ensayo_ac')
                    .delete()
                    .eq('id', id);

                if (error) return jsonResponse(500, { ok: false, error: error.message });
                return jsonResponse(200, { ok: true });
            }

            // Obtener URL firmada para descargar PDF desde Storage
            if (payload.action === 'get_informe_download_url') {
                const filePath = normalizeText(payload.file_path);
                if (!filePath) return jsonResponse(400, { ok: false, error: 'file_path requerido' });

                const fileName = payload.file_name
                    ? normalizeText(payload.file_name)
                    : true;

                const { data, error } = await supabase
                    .storage
                    .from('Informes')
                    .createSignedUrl(filePath, 3600, {
                        download: fileName
                    });

                let signedUrl = data?.signedUrl || '';
                if (signedUrl) {
                    try { signedUrl = decodeURI(signedUrl); } catch (e) {}
                }

                console.log('[DOWNLOAD] file_name recibido:', fileName);
                console.log('[DOWNLOAD] signedUrl (corregida):', signedUrl);

                if (error) return jsonResponse(500, { ok: false, error: error.message });
                return jsonResponse(200, { ok: true, signedUrl });
            }

            // Obtener URL pública para previsualizar PDF
            if (payload.action === 'get_informe_public_url') {
                const filePath = normalizeText(payload.file_path);
                if (!filePath) return jsonResponse(400, { ok: false, error: 'file_path requerido' });

                const { data } = supabase
                    .storage
                    .from('Informes')
                    .getPublicUrl(filePath);

                return jsonResponse(200, { ok: true, publicUrl: data?.publicUrl || '' });
            }

            // Listar archivos en Storage (carpeta de un proceso)
            if (payload.action === 'list_informe_files') {
                const folderPath = normalizeText(payload.folder_path) || '';
                const { data, error } = await supabase
                    .storage
                    .from('Informes')
                    .list(folderPath, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });

                if (error) return jsonResponse(500, { ok: false, error: error.message });
                return jsonResponse(200, { ok: true, files: data || [] });
            }

            // ── STATS DE INFORMES ──
            if (payload.action === 'get_informes_stats') {
                // Traer todos los procesos acreditados
                const { data: todosProcesos, error: errorProcesos } = await supabase
                    .from('procesos_acreditados')
                    .select('id');

                if (errorProcesos) return jsonResponse(500, { ok: false, error: errorProcesos.message });

                const procesos = todosProcesos || [];

                // Traer informes para saber qué procesos tienen registro en la tabla de informes
                const { data: informesRows, error: errorInformes } = await supabase
                    .from('informes_ensayo_ac')
                    .select('id, version, activo, created_at, proceso_id');

                if (errorInformes) return jsonResponse(500, { ok: false, error: errorInformes.message });

                const rows = informesRows || [];

                // Procesos que tienen al menos un registro en informes_ensayo_ac
                const procesosConInforme = new Set(rows.map(r => r.proceso_id).filter(Boolean));

                // TOTAL = todos los procesos acreditados
                const total = procesos.length;

                // VIGENTES = procesos que tienen al menos un informe subido
                const vigentes = procesos.filter(p => procesosConInforme.has(p.id)).length;

                // SIN INFORME = los que no tienen ningún registro en informes_ensayo_ac
                const sinInforme = total - vigentes;

                // Último informe cargado
                let ultimoCargado = null;
                rows.forEach(r => {
                    if (r.created_at && (!ultimoCargado || r.created_at > ultimoCargado)) {
                        ultimoCargado = r.created_at;
                    }
                });

                // Versionados
                const versionados = rows.filter(r => (r.version || 1) > 1).length;

                return jsonResponse(200, {
                    ok: true,
                    stats: {
                        total,
                        vigentes,
                        versionados,
                        ultimo_cargado: ultimoCargado,
                        procesos_sin_informe: sinInforme,
                        total_procesos: total
                    }
                });
            }

            // ── PROCESOS SIN INFORME ──
            if (payload.action === 'get_procesos_sin_informe') {
                try {
                    // Traer todos los procesos acreditados
                    const { data: todosProcesos, error: errorProcesos } = await supabase
                        .from('procesos_acreditados')
                        .select('*');

                    if (errorProcesos) return jsonResponse(500, { ok: false, error: errorProcesos.message });

                    const procesos = todosProcesos || [];

                    // Traer procesos que tienen al menos un informe
                    const { data: informesRows, error: errorInformes } = await supabase
                        .from('informes_ensayo_ac')
                        .select('proceso_id');

                    if (errorInformes) return jsonResponse(500, { ok: false, error: errorInformes.message });

                    const procesosConInforme = new Set((informesRows || []).map(r => r.proceso_id).filter(Boolean));

                    // Filtrar solo los que NO tienen informe
                    const sinInforme = procesos.filter(p => !procesosConInforme.has(p.id));

                    return jsonResponse(200, { ok: true, procesos: sinInforme });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── INFORMES POR CLIENTE (para portal cliente) ──
            if (payload.action === 'get_informes_cliente') {
                try {
                    const cliente = normalizeText(payload.cliente);
                    if (!cliente) return jsonResponse(400, { ok: false, error: 'cliente requerido' });

                // 1. Traer procesos del cliente (solo los que tengan n_informe lleno, no guiones ni vacíos)
                const { data: todosProcesos, error: errProc } = await supabase
                    .from('procesos_acreditados')
                    .select('*')
                    .ilike('cliente', `%${cliente}%`);

                if (errProc) return jsonResponse(500, { ok: false, error: 'Error procesos: ' + errProc.message });

                // Filtrar solo los que tengan n_informe real (no null, vacío ni guión)
                const procesosRows = (todosProcesos || []).filter(p => {
                    const ni = (p.n_informe || '').trim();
                    return ni && ni !== '-' && ni !== '—';
                });
                    if (procesosRows.length === 0) return jsonResponse(200, { ok: true, informes: [] });

                    const procesoIds = procesosRows.map(p => p.id);

                    // 2. Traer informes de esos procesos
                    const { data: informes, error: errInf } = await supabase
                        .from('informes_ensayo_ac')
                        .select('*')
                        .in('proceso_id', procesoIds)
                        .order('created_at', { ascending: false });

                    if (errInf) return jsonResponse(500, { ok: false, error: 'Error informes: ' + errInf.message });

                    // 3. Cruzar datos
                    const procMap = {};
                    procesosRows.forEach(p => { procMap[p.id] = p; });

                    const result = (informes || []).map(inf => {
                        const proc = procMap[inf.proceso_id] || {};
                        return {
                            id: inf.id,
                            proceso_id: inf.proceso_id,
                            numero_proceso: proc.numero_proceso || '',
                            cliente: proc.cliente || cliente,
                            informe_a_nombre_de: proc.informe_a_nombre_de || proc.cliente || cliente,
                            n_informe: proc.n_informe || '',
                            nombre_documento: inf.nombre_documento || '',
                            archivo_pdf: inf.archivo_pdf || '',
                            version: inf.version || 1,
                            activo: inf.activo || false,
                            created_at: inf.created_at || '',
                            fecha_entrega: proc.fecha_entrega_cliente || '',
                            estado: proc.estado || '',
                            tipo: proc.tipo || 'Ensayo'
                        };
                    });

                    return jsonResponse(200, { ok: true, informes: result });
                } catch (innerErr) {
                    return jsonResponse(500, { ok: false, error: 'Error interno get_informes_cliente: ' + innerErr.message });
                }
            }

            // ── IMPORTAR INFORMES EXISTENTES DESDE STORAGE ──
            if (payload.action === 'import_informes_from_storage') {
                const SUPABASE_URL = process.env.SUPABASE_URL;
                const supabaseStorageUrl = `${SUPABASE_URL}/storage/v1/object/public/Informes`;

                // 1. Listar todos los archivos del bucket (raíz)
                const { data: files, error: listError } = await supabase
                    .storage
                    .from('Informes')
                    .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } });

                if (listError) return jsonResponse(500, { ok: false, error: 'Error listando archivos: ' + listError.message });

                const pdfFiles = (files || []).filter(f => f.name && f.name.toLowerCase().endsWith('.pdf'));

                // 2. Obtener todos los procesos para buscar por numero_proceso
                const { data: procesos } = await supabase
                    .from('procesos_acreditados')
                    .select('id, numero_proceso');

                const procesoMap = {};
                (procesos || []).forEach(p => {
                    if (p.numero_proceso) procesoMap[p.numero_proceso.trim()] = p.id;
                });

                // 3. Obtener informes existentes para evitar duplicados
                const { data: existentes } = await supabase
                    .from('informes_ensayo_ac')
                    .select('proceso_id, nombre_documento');

                const existentesSet = new Set();
                (existentes || []).forEach(e => {
                    existentesSet.add(`${e.proceso_id}|||${(e.nombre_documento || '').trim()}`);
                });

                // 4. Procesar cada archivo
                let importados = 0;
                let duplicados = 0;
                let errores = 0;
                let sinProceso = 0;
                const resultados = [];

                for (const file of pdfFiles) {
                    const fileName = file.name;
                    const fileNameNoExt = fileName.replace(/\.pdf$/i, '');

                    // Extraer número de proceso: "HT-R26 0001 ..." → "R26 0001"
                    const match = fileName.match(/R26\s*\d{4}/i);
                    if (!match) {
                        sinProceso++;
                        resultados.push({ archivo: fileName, estado: 'sin_proceso', detalle: 'No se detectó R26 XXXX en el nombre' });
                        continue;
                    }

                    const numProceso = match[0].toUpperCase().replace(/\s+/g, ' ').trim();
                    const procesoId = procesoMap[numProceso];

                    if (!procesoId) {
                        sinProceso++;
                        resultados.push({ archivo: fileName, estado: 'proceso_no_encontrado', detalle: `No se encontró proceso ${numProceso} en DB` });
                        continue;
                    }

                    // Verificar duplicado
                    const key = `${procesoId}|||${fileNameNoExt.trim()}`;
                    if (existentesSet.has(key)) {
                        duplicados++;
                        resultados.push({ archivo: fileName, estado: 'duplicado', detalle: `Proceso ${numProceso} ya tiene este documento` });
                        continue;
                    }

                    // Construir URL pública
                    const fileUrl = `${supabaseStorageUrl}/${encodeURIComponent(fileName)}`;

                    // Desactivar informe activo anterior del mismo proceso y documento
                    await supabase
                        .from('informes_ensayo_ac')
                        .update({ activo: false })
                        .eq('proceso_id', procesoId)
                        .eq('nombre_documento', fileNameNoExt.trim())
                        .eq('activo', true);

                    // Insertar registro
                    const { error: insertError } = await supabase
                        .from('informes_ensayo_ac')
                        .insert({
                            proceso_id: procesoId,
                            nombre_documento: fileNameNoExt.trim(),
                            archivo_pdf: fileUrl,
                            version: 1,
                            activo: true
                        });

                    if (insertError) {
                        errores++;
                        resultados.push({ archivo: fileName, estado: 'error', detalle: insertError.message });
                    } else {
                        importados++;
                        existentesSet.add(key);
                        resultados.push({ archivo: fileName, estado: 'importado', proceso_id: procesoId, numero_proceso: numProceso });
                    }
                }

                return jsonResponse(200, {
                    ok: true,
                    resumen: {
                        total_archivos: pdfFiles.length,
                        importados,
                        duplicados,
                        errores,
                        sin_proceso: sinProceso
                    },
                    resultados
                });
            }

            // ── CARGA MASIVA DE INFORMES ──
            if (payload.action === 'upload_informes_bulk') {
                const files = payload.files || [];
                const omitDuplicates = payload.omit_duplicates !== false;
                const createVersion = payload.create_version !== false;
                const replaceActive = payload.replace_active === true;
                const SUPABASE_URL = process.env.SUPABASE_URL;
                const supabaseStorageUrl = `${SUPABASE_URL}/storage/v1/object/public/Informes`;

                if (!files.length) return jsonResponse(400, { ok: false, error: 'No se enviaron archivos' });

                // Obtener todos los procesos
                const { data: procesos } = await supabase
                    .from('procesos_acreditados')
                    .select('id, numero_proceso');

                const procesoMap = {};
                (procesos || []).forEach(p => {
                    if (p.numero_proceso) procesoMap[p.numero_proceso.trim()] = p.id;
                });

                // Obtener informes existentes
                const { data: existentes } = await supabase
                    .from('informes_ensayo_ac')
                    .select('proceso_id, nombre_documento, version, activo');

                const existentesMap = {};
                (existentes || []).forEach(e => {
                    const key = `${e.proceso_id}|||${(e.nombre_documento || '').trim()}`;
                    if (!existentesMap[key]) existentesMap[key] = [];
                    existentesMap[key].push(e);
                });

                let importados = 0;
                let versionados = 0;
                let duplicados = 0;
                let errores = 0;
                const resultados = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileName = file.name || `archivo_${i}.pdf`;
                    const fileBase64 = file.base64;
                    const fileNameNoExt = fileName.replace(/\.pdf$/i, '');

                    // Detectar R26
                    const match = fileName.match(/R26\s*\d{4}/i);
                    if (!match) {
                        errores++;
                        resultados.push({ archivo: fileName, estado: 'error', detalle: 'No se detectó R26 XXXX' });
                        continue;
                    }

                    const numProceso = match[0].toUpperCase().replace(/\s+/g, ' ').trim();
                    const procesoId = procesoMap[numProceso];

                    if (!procesoId) {
                        errores++;
                        resultados.push({ archivo: fileName, estado: 'error', detalle: `Proceso ${numProceso} no encontrado` });
                        continue;
                    }

                    // Verificar si ya existe informe activo para este proceso
                    const key = `${procesoId}|||${fileNameNoExt.trim()}`;
                    const existentesParaProceso = existentesMap[key] || [];
                    const existeActivo = existentesParaProceso.some(e => e.activo === true);

                    if (existeActivo && omitDuplicates && !createVersion && !replaceActive) {
                        duplicados++;
                        resultados.push({ archivo: fileName, estado: 'duplicado', detalle: `Ya existe informe activo para ${numProceso}` });
                        continue;
                    }

                    // Subir archivo a Storage
                    const filePath = `${procesoId}/${Date.now()}_${i}_bulk.pdf`;
                    let publicUrl = '';

                    try {
                        const buffer = Buffer.from(fileBase64, 'base64');
                        const { error: uploadError } = await supabase
                            .storage
                            .from('Informes')
                            .upload(filePath, buffer, { contentType: 'application/pdf', upsert: false });

                        if (uploadError) throw new Error(uploadError.message);

                        const { data: urlData } = supabase.storage.from('Informes').getPublicUrl(filePath);
                        publicUrl = urlData?.publicUrl || '';
                    } catch (uploadErr) {
                        errores++;
                        resultados.push({ archivo: fileName, estado: 'error', detalle: 'Error Storage: ' + uploadErr.message });
                        continue;
                    }

                    // Determinar versión
                    let nextVersion = 1;
                    let shouldDeactivate = false;

                    if (existeActivo && (createVersion || replaceActive)) {
                        const maxVersion = Math.max(...existentesParaProceso.map(e => e.version || 1));
                        nextVersion = maxVersion + 1;
                        shouldDeactivate = true;
                    } else if (existeActivo) {
                        nextVersion = (existentesParaProceso[0]?.version || 0) + 1;
                        shouldDeactivate = true;
                    }

                    // Desactivar versiones anteriores si aplica
                    if (shouldDeactivate) {
                        await supabase
                            .from('informes_ensayo_ac')
                            .update({ activo: false })
                            .eq('proceso_id', procesoId)
                            .eq('activo', true);
                    }

                    // Insertar registro
                    const { error: insertError } = await supabase
                        .from('informes_ensayo_ac')
                        .insert({
                            proceso_id: procesoId,
                            nombre_documento: fileNameNoExt.trim(),
                            archivo_pdf: publicUrl || `${supabaseStorageUrl}/${encodeURIComponent(filePath)}`,
                            version: nextVersion,
                            activo: true
                        });

                    if (insertError) {
                        errores++;
                        resultados.push({ archivo: fileName, estado: 'error', detalle: insertError.message });
                    } else {
                        if (existeActivo) {
                            versionados++;
                            resultados.push({ archivo: fileName, estado: 'versionado', proceso_id: procesoId, numero_proceso: numProceso, version: nextVersion });
                        } else {
                            importados++;
                            resultados.push({ archivo: fileName, estado: 'importado', proceso_id: procesoId, numero_proceso: numProceso, version: nextVersion });
                        }
                        // Agregar al mapa para futuros duplicados
                        const newKey = `${procesoId}|||${fileNameNoExt.trim()}`;
                        if (!existentesMap[newKey]) existentesMap[newKey] = [];
                        existentesMap[newKey].push({ proceso_id: procesoId, nombre_documento: fileNameNoExt.trim(), version: nextVersion, activo: true });
                    }
                }

                return jsonResponse(200, {
                    ok: true,
                    resumen: {
                        total: files.length,
                        importados,
                        versionados,
                        duplicados,
                        errores
                    },
                    resultados
                });
            }

            // ── BACKFILL: Llenar informe_a_nombre_de con cliente donde esté vacío ──
            if (payload.action === 'backfill_informe_a_nombre_de') {
                const { data: procesos, error: fetchErr } = await supabase
                    .from('procesos_acreditados')
                    .select('id, cliente, informe_a_nombre_de');

                if (fetchErr) return jsonResponse(500, { ok: false, error: fetchErr.message });

                const vacios = (procesos || []).filter(p => {
                    const v = (p.informe_a_nombre_de || '').trim();
                    return !v || v === '-' || v === '—';
                });

                let actualizados = 0;
                let errores = 0;
                for (const p of vacios) {
                    const cliente = (p.cliente || '').trim();
                    if (!cliente) { errores++; continue; }
                    const { error: updErr } = await supabase
                        .from('procesos_acreditados')
                        .update({ informe_a_nombre_de: cliente })
                        .eq('id', p.id);
                    if (updErr) { errores++; } else { actualizados++; }
                }

                return jsonResponse(200, {
                    ok: true,
                    total_registros: (procesos || []).length,
                    vacios_encontrados: vacios.length,
                    actualizados,
                    errores
                });
            }

            return jsonResponse(400, { ok: false, error: 'Acción no soportada' });
        } catch (err) {
            return jsonResponse(500, { ok: false, error: err.message });
        }
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
};