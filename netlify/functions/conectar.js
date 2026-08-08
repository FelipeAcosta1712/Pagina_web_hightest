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

                // Obtener conteo de items por proceso desde detalle_procesos_ac y marcaciones_ac
                const procesos = data || [];
                const ids = procesos.map(p => p.id).filter(Boolean);
                let conteosDetalle = {};
                let conteosMarc = {};
                if (ids.length > 0) {
                    const [resDetalle, resMarc] = await Promise.all([
                        supabase.from('detalle_procesos_ac').select('proceso_id, id'),
                        supabase.from('marcaciones_ac').select('proceso_id, elemento')
                    ]);
                    // Contar filas desde detalle_procesos_ac (items reales)
                    (resDetalle.data || []).forEach(d => {
                        const pid = String(d.proceso_id).trim();
                        if (!conteosDetalle[pid]) conteosDetalle[pid] = 0;
                        conteosDetalle[pid]++;
                    });
                    // Contar elementos distintos desde marcaciones_ac
                    (resMarc.data || []).forEach(m => {
                        const pid = String(m.proceso_id).trim();
                        if (!conteosMarc[pid]) conteosMarc[pid] = new Set();
                        if (m.elemento) conteosMarc[pid].add(m.elemento.trim());
                    });
                }
                procesos.forEach(p => {
                    const pid = String(p.id).trim();
                    const desdeDetalle = conteosDetalle[pid] || 0;
                    const desdeMarc = conteosMarc[pid] ? conteosMarc[pid].size : 0;
                    p.total_items = Math.max(desdeDetalle, desdeMarc);
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

                // También eliminar de borradores si existe
                try {
                    const { data: allDrafts } = await supabase
                        .from('borradores')
                        .select('id, datos');
                    if (Array.isArray(allDrafts)) {
                        for (const row of allDrafts) {
                            const drafts = Array.isArray(row.datos) ? row.datos : [];
                            const filtered = drafts.filter(d => {
                                const key = d.cotizacion || d.quoteNumber || d.numero_proceso || '';
                                return key !== numero;
                            });
                            if (filtered.length !== drafts.length) {
                                await supabase
                                    .from('borradores')
                                    .update({ datos: filtered, updated_at: new Date().toISOString() })
                                    .eq('id', row.id);
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Error eliminando borrador asociado:', e);
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
                    if (payload.firma_cliente_entrega) updateData.firma_cliente_entrega = payload.firma_cliente_entrega;
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
                const allowed = ['numero_proceso','cliente','cliente_id','tipo','estado','fecha_recepcion','fecha_entrega_cliente','fecha_finalizado','valor','caso_activo','informe_a_nombre_de','facturar_a_nombre_de','fecha_ejecucion','n_remision','responsable_marcacion','firma_cliente_recepcion','firma_cliente_entrega'];
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
                // Incluir firmas si se envían en el payload
                if (payload.firma_cliente_recepcion) baseInsert.firma_cliente_recepcion = payload.firma_cliente_recepcion;
                if (payload.firma_cliente_entrega) baseInsert.firma_cliente_entrega = payload.firma_cliente_entrega;

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

            // Consulta ligera: obtener solo el timestamp del último borrador actualizado
            // Usado por autoSyncDrafts() para detectar cambios sin descargar datos completos
            if (payload.action === 'get_borradores_timestamp') {
                const { data, error } = await supabase
                    .from('borradores')
                    .select('updated_at')
                    .order('updated_at', { ascending: false })
                    .limit(1);
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener timestamp', detail: error.message });
                }
                const lastUpdated = (data && data[0] && data[0].updated_at) ? data[0].updated_at : null;
                return jsonResponse(200, { ok: true, last_updated: lastUpdated });
            }

            // ============================================================
            // BORRADORES — RESUMEN LIGERO (sin campos pesados)
            // ============================================================

            if (payload.action === 'get_borradores_resumen') {
                const { data, error } = await supabase.rpc('get_borradores_resumen');
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener resumen de borradores', detail: error.message });
                }
                return jsonResponse(200, { ok: true, data: data || [] });
            }

            // ============================================================
            // BORRADOR COMPLETO — por cotizacion
            // ============================================================

            if (payload.action === 'get_borrador_completo') {
                const cotizacion = payload.cotizacion;
                if (!cotizacion) {
                    return jsonResponse(400, { ok: false, error: 'cotizacion requerido' });
                }
                const { data, error } = await supabase.rpc('get_borrador_completo', { p_cotizacion: cotizacion });
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error al obtener borrador', detail: error.message });
                }
                // data es el objeto JSONB directamente (no un array)
                return jsonResponse(200, { ok: true, data: data });
            }

            if (payload.action === 'save_borradores') {
                const usuarioEmail = 'shared';
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

                // Guardar firmas del borrador activo en columnas dedicadas
                try {
                    if (Array.isArray(drafts) && drafts.length > 0) {
                        const currentDraft = drafts.find(d => d.status !== 'entrega') || drafts[drafts.length - 1];
                        const firmaRec = currentDraft?.signatureData?.signatureCanvasRecepcion || null;
                        const firmaEnt = currentDraft?.signatureData?.signatureCanvasEntrega || null;
                        const firmaUpdate = {};
                        if (firmaRec) firmaUpdate.firma_cliente_recepcion = firmaRec;
                        if (firmaEnt) firmaUpdate.firma_cliente_entrega = firmaEnt;
                        if (Object.keys(firmaUpdate).length > 0 && row) {
                            await supabase.from('borradores').update(firmaUpdate).eq('id', row.id);
                        }
                    }
                } catch (e) { /* no bloquear por error de firma */ }

                return jsonResponse(200, { ok: true, message: 'Borradores guardados' });
            }

            // Guardar firmas de un borrador específico en columnas dedicadas
            if (payload.action === 'save_firma_borrador') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || '');
                if (!numero) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                const firmaRec = payload.firma_cliente_recepcion || null;
                const firmaEnt = payload.firma_cliente_entrega || null;

                const { data: rows } = await supabase
                    .from('borradores')
                    .select('id, datos')
                    .eq('usuario_email', 'shared')
                    .limit(1);

                const row = Array.isArray(rows) ? rows[0] : null;
                if (!row) return jsonResponse(404, { ok: false, error: 'No hay borradores' });

                // Actualizar columnas dedicadas
                const firmaUpdate = {};
                if (firmaRec) firmaUpdate.firma_cliente_recepcion = firmaRec;
                if (firmaEnt) firmaUpdate.firma_cliente_entrega = firmaEnt;
                if (Object.keys(firmaUpdate).length > 0) {
                    await supabase.from('borradores').update(firmaUpdate).eq('id', row.id);
                }

                // Actualizar también signatureData dentro del JSON datos
                if (Array.isArray(row.datos)) {
                    const drafts = [...row.datos];
                    const idx = drafts.findIndex(d => d.cotizacion === numero || d.quoteNumber === numero);
                    if (idx !== -1) {
                        if (!drafts[idx].signatureData) drafts[idx].signatureData = {};
                        if (firmaRec) drafts[idx].signatureData.signatureCanvasRecepcion = firmaRec;
                        if (firmaEnt) drafts[idx].signatureData.signatureCanvasEntrega = firmaEnt;
                        await supabase.from('borradores').update({ datos: drafts, updated_at: new Date().toISOString() }).eq('id', row.id);
                    }
                }

                return jsonResponse(200, { ok: true });
            }

            // Obtener firmas de un borrador específico desde columnas dedicadas
            if (payload.action === 'get_firma_borrador') {
                const numero = normalizeText(payload.numero_proceso || payload.numero || '');
                if (!numero) return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });

                const { data: rows } = await supabase
                    .from('borradores')
                    .select('datos, firma_cliente_recepcion, firma_cliente_entrega')
                    .eq('usuario_email', 'shared')
                    .limit(1);

                const row = Array.isArray(rows) ? rows[0] : null;
                if (!row) return jsonResponse(200, { ok: true, firmaRecepcion: null, firmaEntrega: null });

                const drafts = Array.isArray(row.datos) ? row.datos : [];
                const draft = drafts.find(d => (d.cotizacion || d.quoteNumber || '') === numero);

                // Prioridad: columnas dedicadas > signatureData del JSON
                const firmaRecepcion = row.firma_cliente_recepcion
                    || draft?.signatureData?.signatureCanvasRecepcion
                    || null;
                const firmaEntrega = row.firma_cliente_entrega
                    || draft?.signatureData?.signatureCanvasEntrega
                    || null;

                return jsonResponse(200, { ok: true, firmaRecepcion, firmaEntrega });
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

                // Agrupar por ensayo_id (una fila por ensayo, no por marca)
                const ensayoMap = {};
                (data || []).forEach(d => {
                    const eid = d.ensayo_id || d.id;
                    if (!ensayoMap[eid]) {
                        ensayoMap[eid] = {
                            ensayo_id: eid,
                            ensayo_nombre: d.ensayos_acreditados?.nombre || d.ensayo_nombre || '',
                            ensayo_categoria: d.ensayos_acreditados?.categoria || d.ensayo_categoria || '',
                            cantidad: 0,
                            cantidad_entregada: 0,
                            marcas: [],
                            observaciones: ''
                        };
                    }
                    const entry = ensayoMap[eid];
                    entry.cantidad += d.cantidad || 0;
                    entry.cantidad_entregada = Math.max(entry.cantidad_entregada || 0, d.cantidad_entregada || 0);
                    if (d.marca) entry.marcas.push({ count: d.cantidad || 0, brand: d.marca });
                    if (d.observaciones && !entry.observaciones) entry.observaciones = d.observaciones;
                });

                const detalle = Object.values(ensayoMap);
                return jsonResponse(200, { ok: true, detalle });
            }

            // Eliminar detalle de proceso (para reemplazar con datos actualizados)
            if (payload.action === 'delete_detalle_proceso') {
                const procesoId = payload.proceso_id;
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }
                const { error } = await supabase
                    .from('detalle_procesos_ac')
                    .delete()
                    .eq('proceso_id', procesoId);
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error eliminando detalle', detail: error.message });
                }
                return jsonResponse(200, { ok: true });
            }

            // Guardar unidades ensayables por grupo de elemento
            if (payload.action === 'update_unidades_ensayables') {
                const { proceso_id, ensayo_id, unidades } = payload;
                if (!proceso_id || !ensayo_id) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id y ensayo_id requeridos' });
                }
                const numUnidades = parseInt(unidades, 10) || 0;
                const { error } = await supabase
                    .from('detalle_procesos_ac')
                    .update({ unidades_ensayables: numUnidades })
                    .eq('proceso_id', proceso_id)
                    .eq('ensayo_id', ensayo_id);
                if (error) {
                    return jsonResponse(500, { ok: false, error: 'Error guardando ensayables', detail: error.message });
                }
                return jsonResponse(200, { ok: true });
            }

            // ── sync_detalle_proceso: UPSERT atómico via stored procedure ──
            // Delega toda la lógica a sync_detalle_proceso() en PostgreSQL:
            //   FASE 1: FOR UPDATE (bloqueo de filas)
            //   FASE 2: Consolidar duplicados existentes
            //   FASE 3: DELETE huérfanos
            //   FASE 4: INSERT ON CONFLICT DO UPDATE (upsert)
            //   FASE 5: Retornar estado final
            if (payload.action === 'sync_detalle_proceso') {
                const procesoId = payload.proceso_id;
                const newDetalle = payload.detalle || [];
                if (!procesoId) {
                    return jsonResponse(400, { ok: false, error: 'proceso_id requerido' });
                }
                if (!Array.isArray(newDetalle)) {
                    return jsonResponse(400, { ok: false, error: 'detalle debe ser un array' });
                }

                const { data, error } = await supabase.rpc('sync_detalle_proceso', {
                    p_proceso_id: procesoId,
                    p_detalle: newDetalle
                });

                if (error) {
                    console.error('[sync_detalle_proceso] RPC error:', error.message);
                    return jsonResponse(500, { ok: false, error: 'Error en sync', detail: error.message });
                }

                return jsonResponse(200, { ok: true, detalle: data || [], ops: { source: 'rpc' } });
            }

            // ── migrar_cantidad_entregada: Migración temporal ──
            // Actualiza cantidad_entregada en detalle_procesos_ac solo si actualmente es 0.
            if (payload.action === 'migrar_cantidad_entregada') {
                const { numero_proceso, ensayo_id, cantidad_entregada } = payload;

                if (!numero_proceso) {
                    return jsonResponse(400, { ok: false, error: 'numero_proceso requerido' });
                }
                if (!ensayo_id) {
                    return jsonResponse(400, { ok: false, error: 'ensayo_id requerido' });
                }
                const cantEnt = parseInt(cantidad_entregada) || 0;
                if (cantEnt < 0) {
                    return jsonResponse(400, { ok: false, error: 'cantidad_entregada debe ser >= 0' });
                }

                // Buscar proceso por numero_proceso
                const { data: procesoData, error: procErr } = await supabase
                    .from('procesos_acreditados')
                    .select('id')
                    .eq('numero_proceso', numero_proceso)
                    .limit(1);

                if (procErr) {
                    return jsonResponse(500, { ok: false, error: 'Error buscando proceso', detail: procErr.message });
                }
                const proceso = Array.isArray(procesoData) ? procesoData[0] : procesoData;
                if (!proceso) {
                    return jsonResponse(200, { ok: true, updated: false, reason: 'proceso_no_encontrado' });
                }

                // Actualizar solo si cantidad_entregada es 0 (no sobrescribir valores existentes)
                const { data: updateData, error: updateErr } = await supabase
                    .from('detalle_procesos_ac')
                    .update({ cantidad_entregada: cantEnt })
                    .eq('proceso_id', proceso.id)
                    .eq('ensayo_id', ensayo_id)
                    .eq('cantidad_entregada', 0)
                    .select('id');

                if (updateErr) {
                    return jsonResponse(500, { ok: false, error: 'Error actualizando', detail: updateErr.message });
                }

                const updatedCount = Array.isArray(updateData) ? updateData.length : 0;
                return jsonResponse(200, {
                    ok: true,
                    updated: updatedCount > 0,
                    updatedCount,
                    proceso_id: proceso.id,
                    ensayo_id,
                    cantidad_entregada: cantEnt
                });
            }

            // Obtener conteo de items por todos los procesos (para modal PDFs)
            if (payload.action === 'get_all_detalle_procesos') {
                // Contar desde ambas tablas y usar el mayor
                const [resDetalle, resMarc] = await Promise.all([
                    supabase.from('detalle_procesos_ac').select('proceso_id, id, ensayo_id, cantidad, cantidad_entregada, marca, observaciones, ensayos_acreditados(nombre, categoria)'),
                    supabase.from('marcaciones_ac').select('proceso_id, elemento')
                ]);

                const conteos = {};
                const detalleCompleto = {};

                // Agrupar por proceso_id → ensayo_id (una fila por ensayo, sumando cantidades de marcas)
                (resDetalle.data || []).forEach(d => {
                    const pid = String(d.proceso_id).trim();
                    const eid = d.ensayo_id || d.id;
                    if (!conteos[pid]) conteos[pid] = 0;
                    conteos[pid]++;

                    if (!detalleCompleto[pid]) detalleCompleto[pid] = {};
                    if (!detalleCompleto[pid][eid]) {
                        detalleCompleto[pid][eid] = {
                            ensayo_id: eid,
                            ensayo_nombre: d.ensayos_acreditados?.nombre || '',
                            ensayo_categoria: d.ensayos_acreditados?.categoria || '',
                            cantidad: 0,
                            cantidad_entregada: 0,
                            marcas: [],
                            observaciones: ''
                        };
                    }
                    const entry = detalleCompleto[pid][eid];
                    entry.cantidad += d.cantidad || 0;
                    entry.cantidad_entregada = Math.max(entry.cantidad_entregada || 0, d.cantidad_entregada || 0);
                    if (d.marca) entry.marcas.push({ count: d.cantidad || 0, brand: d.marca });
                    if (d.observaciones && !entry.observaciones) entry.observaciones = d.observaciones;
                });

                // Convertir a arrays para enviar al cliente
                const detalleArrays = {};
                for (const pid in detalleCompleto) {
                    detalleArrays[pid] = Object.values(detalleCompleto[pid]);
                }

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

                return jsonResponse(200, { ok: true, conteos, detalleCompleto: detalleArrays });
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
            // MARCACIONES - Sync inteligente (preserva estado por identidad de elemento)
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
                    const { error: delErr } = await supabase
                        .from('marcaciones_ac')
                        .delete()
                        .eq('proceso_id', procesoId);
                    if (delErr) {
                        console.error('[create_marcaciones_batch] Error deleting all:', delErr.message);
                        return jsonResponse(500, { ok: false, error: 'Error eliminando marcaciones', detail: delErr.message });
                    }
                    return jsonResponse(200, { ok: true, updated: [], inserted: [], deleted: 'all' });
                }

                // FASE 1: Fetch existentes
                const { data: existingRows, error: fetchError } = await supabase
                    .from('marcaciones_ac')
                    .select('*')
                    .eq('proceso_id', procesoId)
                    .order('consecutivo', { ascending: true });

                if (fetchError) {
                    console.error('[create_marcaciones_batch] Error fetching existentes:', fetchError.message);
                    return jsonResponse(500, { ok: false, error: 'Error consultando marcaciones existentes', detail: fetchError.message });
                }

                const existing = existingRows || [];

                // FASE 2: Build cola de existentes por identidad (elemento + descripcion)
                const existingByElement = {};
                existing.forEach(row => {
                    const key = ((row.elemento || '').trim() + '||' + (row.descripcion || '').trim()).toLowerCase();
                    if (!existingByElement[key]) existingByElement[key] = [];
                    existingByElement[key].push(row);
                });

                const toUpdate = [];
                const toInsert = [];
                const matchedExistingIds = new Set();

                for (const item of marcaciones) {
                    const elemKey = ((item.elemento || '').trim() + '||' + (item.descripcion || '').trim()).toLowerCase();
                    const queue = existingByElement[elemKey];
                    const match = queue && queue.length > 0 ? queue.shift() : null;

                    if (match) {
                        matchedExistingIds.add(match.id);
                        toUpdate.push({
                            id: match.id,
                            consecutivo: item.consecutivo,
                            estado: item.estado !== undefined ? item.estado : (match.estado || 'Pendiente'),
                            observacion: item.observacion !== undefined ? item.observacion : (match.observacion || ''),
                            nci: item.nci !== undefined ? item.nci : (match.nci || ''),
                            calibre_mm2: item.calibre_mm2 ?? match.calibre_mm2 ?? null,
                            longitud_m: item.longitud_m ?? match.longitud_m ?? null,
                            rm_maxima: item.rm_maxima ?? match.rm_maxima ?? null,
                            rm_medida: item.rm_medida ?? match.rm_medida ?? null
                        });
                    } else {
                        toInsert.push({
                            proceso_id: procesoId,
                            detalle_id: item.detalle_id || null,
                            ensayo_id: item.ensayo_id || null,
                            consecutivo: item.consecutivo,
                            elemento: item.elemento || '',
                            descripcion: item.descripcion || '',
                            estado: item.estado || 'Pendiente',
                            observacion: item.observacion || '',
                            nci: item.nci || '',
                            calibre_mm2: item.calibre_mm2 ?? null,
                            longitud_m: item.longitud_m ?? null,
                            rm_maxima: item.rm_maxima ?? null,
                            rm_medida: item.rm_medida ?? null
                        });
                    }
                }

                // FASE 3: Eliminar sobrantes
                const toDelete = existing.filter(r => !matchedExistingIds.has(r.id));
                let deletedCount = 0;
                if (toDelete.length > 0) {
                    const delIds = toDelete.map(r => r.id);
                    const { error: delErr } = await supabase
                        .from('marcaciones_ac')
                        .delete()
                        .in('id', delIds);
                    if (delErr) {
                        console.error('[create_marcaciones_batch] Error deleting orphans:', delErr.message);
                    } else {
                        deletedCount = delIds.length;
                    }
                }

                // FASE 4: Actualizar existentes
                const updateResults = [];
                for (const u of toUpdate) {
                    const { error: updErr } = await supabase
                        .from('marcaciones_ac')
                        .update({ consecutivo: u.consecutivo, estado: u.estado, observacion: u.observacion, nci: u.nci, calibre_mm2: u.calibre_mm2, longitud_m: u.longitud_m, rm_maxima: u.rm_maxima, rm_medida: u.rm_medida })
                        .eq('id', u.id);
                    if (updErr) {
                        console.error('[create_marcaciones_batch] Error updating id=' + u.id + ':', updErr.message);
                    } else {
                        updateResults.push(u.id);
                    }
                }

                // FASE 5: Insertar nuevos
                const insertResults = [];
                const BATCH_SIZE = 50;
                for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
                    let batch = toInsert.slice(i, i + BATCH_SIZE);

                    for (let attempt = 0; attempt < 3; attempt++) {
                        const { data, error } = await supabase
                            .from('marcaciones_ac')
                            .insert(batch)
                            .select();

                        if (!error) {
                            insertResults.push(...(Array.isArray(data) ? data : [data]));
                            break;
                        }

                        console.error('[create_marcaciones_batch] Error insert (attempt ' + (attempt + 1) + '):', error.message);
                        const msg = String(error.message || '').toLowerCase();
                        const missingCols = [];
                        const m1 = msg.match(/could not find the '([^']+)' column/);
                        if (m1) missingCols.push(m1[1]);
                        const m2 = msg.match(/column\s+"?([^"\s]+)"?\s+does not exist/);
                        if (m2) missingCols.push(m2[1]);

                        if (missingCols.length === 0) break;

                        batch = batch.map(item => {
                            const clean = { ...item };
                            missingCols.forEach(col => { delete clean[col]; });
                            return clean;
                        });
                    }
                }

                return jsonResponse(200, { ok: true, updated: updateResults, inserted: insertResults, deleted: deletedCount });
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
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_marcaciones_resumen_rpc');

                if (rpcError) {
                    return jsonResponse(500, { ok: false, error: 'Error al consultar resumen de marcaciones', detail: rpcError.message });
                }

                const resumen = {};
                (rpcData || []).forEach(row => {
                    const pid = String(row.proceso_id || '').trim();
                    if (!pid) return;
                    resumen[pid] = {
                        total: Number(row.total) || 0,
                        marcados: Number(row.marcados) || 0,
                        pendientes: Number(row.pendientes) || 0,
                        otros: Number(row.otros) || 0
                    };
                });

                try {
                    const [procesosRes, detalleRes] = await Promise.all([
                        supabase.from('procesos_acreditados').select('id, numero_proceso'),
                        supabase.from('detalle_procesos_ac').select('id, proceso_id')
                    ]);
                    const procesos = procesosRes.data || [];
                    const detalles = detalleRes.data || [];

                    const idToNum = {};
                    procesos.forEach(p => {
                        const pid = String(p.id || '').trim();
                        const num = (p.numero_proceso || '').trim();
                        if (pid && num) idToNum[pid] = num;
                    });

                    const detalleToNum = {};
                    detalles.forEach(d => {
                        const did = String(d.id || '').trim();
                        const parentPid = String(d.proceso_id || '').trim();
                        if (did && idToNum[parentPid]) detalleToNum[did] = idToNum[parentPid];
                    });

                    const numToId = {};
                    procesos.forEach(p => {
                        const num = (p.numero_proceso || '').trim();
                        const pid = String(p.id || '').trim();
                        if (num && pid) numToId[num] = pid;
                    });

                    const resumenPids = Object.keys(resumen);
                    resumenPids.forEach(pid => {
                        let num = idToNum[pid];
                        if (!num) num = detalleToNum[pid];
                        if (!num) return;
                        if (!resumen[num]) resumen[num] = resumen[pid];
                        const realId = numToId[num];
                        if (realId && !resumen[realId]) resumen[realId] = resumen[pid];
                    });

                    procesos.forEach(p => {
                        const num = (p.numero_proceso || '').trim();
                        const pid = String(p.id || '').trim();
                        if (num && resumen[num] && pid && !resumen[pid]) {
                            resumen[pid] = resumen[num];
                        }
                    });
                } catch (e) {
                    console.error('[get_marcaciones_resumen] Error enriching:', e.message);
                }

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

                    // 2. Traer informes activos de esos procesos (solo la version actual)
                    const { data: informes, error: errInf } = await supabase
                        .from('informes_ensayo_ac')
                        .select('*')
                        .in('proceso_id', procesoIds)
                        .eq('activo', true)
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

            // =============================================
            // DASHBOARD - Estadísticas generales
            // =============================================
            if (payload.action === 'get_dashboard_stats') {
                try {
                    const dashFechaDesde = payload.fecha_desde || '';
                    const dashFechaHasta = payload.fecha_hasta || '';
                    const dashCliente = payload.cliente || '';
                    const dashEstado = payload.estado || '';
                    const dashMes = payload.mes || '';

                    const [clientesRes, procesosRes, cotizacionesRes, informesRes, ensayosRes, detalleElementosRes, marcacionesRes] = await Promise.all([
                        supabase.from('clientes').select('id, created_at').range(0, 9999),
                        supabase.from('procesos_acreditados').select('*').range(0, 9999),
                        supabase.from('cotizaciones_ac').select('id, cliente, estado, total_valor, created_at, cotizacion').range(0, 9999),
                        supabase.from('informes_ensayo_ac').select('id, proceso_id, created_at, activo').range(0, 9999),
                        supabase.from('ensayos_acreditados').select('id, nombre, categoria').range(0, 9999),
                        supabase.from('detalle_procesos_ac').select('proceso_id, cantidad').range(0, 9999),
                        supabase.from('marcaciones_ac').select('id, proceso_id, estado').range(0, 9999)
                    ]);

                    const clientes = clientesRes.data || [];
                    let procesos = procesosRes.data || [];
                    const cotizaciones = cotizacionesRes.data || [];
                    const informes = informesRes.data || [];
                    const ensayos = ensayosRes.data || [];
                    const detalleElementosAll = detalleElementosRes.data || [];
                    const marcaciones = marcacionesRes.data || [];

                    // ── Aplicar filtros del dashboard ──
                    if (dashFechaDesde) {
                        procesos = procesos.filter(p => {
                            const f = (p.fecha_recepcion || '').substring(0, 10);
                            return f >= dashFechaDesde;
                        });
                    }
                    if (dashFechaHasta) {
                        procesos = procesos.filter(p => {
                            const f = (p.fecha_recepcion || '').substring(0, 10);
                            return f <= dashFechaHasta;
                        });
                    }
                    if (dashMes) {
                        procesos = procesos.filter(p => {
                            const f = (p.fecha_recepcion || '').substring(0, 7);
                            return f === dashMes;
                        });
                    }
                    if (dashCliente) {
                        procesos = procesos.filter(p => (p.cliente || '').trim().toLowerCase() === dashCliente.toLowerCase());
                    }
                    if (dashEstado) {
                        procesos = procesos.filter(p => normalizeStatusKey(p.estado || '') === normalizeStatusKey(dashEstado));
                    }

                    // Set de IDs de procesos filtrados (para filtrar Top 10, Categorías, etc.)
                    const filteredProcesoIds = new Set(procesos.map(p => p.id));
                    const hasActiveFilters = dashFechaDesde || dashFechaHasta || dashMes || dashCliente || dashEstado;

                    // Último cliente creado
                    let ultimoCliente = null;
                    try {
                        const { data: latestClient } = await supabase
                            .from('clientes')
                            .select('*')
                            .order('created_at', { ascending: false })
                            .limit(1);
                        if (latestClient && latestClient.length > 0) {
                            const c = latestClient[0];
                            const nombre = pickFirstValue(c, ['nombre', 'nombre_completo', 'contacto', 'representante', 'nombre_empresa', 'empresa', 'razon_social']) || c.email || 'Sin nombre';
                            ultimoCliente = {
                                nombre,
                                fecha: c.created_at || null
                            };
                        }
                        // Calcular frecuencia promedio entre clientes
                        if (clientes.length >= 2) {
                            const fechas = clientes
                                .map(c => c.created_at ? new Date(c.created_at).getTime() : 0)
                                .filter(t => t > 0)
                                .sort((a, b) => b - a);
                            if (fechas.length >= 2) {
                                let totalDias = 0;
                                for (let i = 0; i < fechas.length - 1; i++) {
                                    totalDias += (fechas[i] - fechas[i + 1]) / (1000 * 60 * 60 * 24);
                                }
                                const promedioDias = totalDias / (fechas.length - 1);
                                ultimoCliente = ultimoCliente || {};
                                ultimoCliente.frecuenciaDias = Math.round(promedioDias * 10) / 10;
                                ultimoCliente.totalClientes = clientes.length;
                            }
                        }
                    } catch (_) {}

                    // ── KPIs principales ──
                    const totalProcesos = procesos.length;
                    const totalClientes = clientes.length;
                    const totalCotizaciones = cotizaciones.length;
                    const totalInformes = informes.length;
                    const totalEnsayos = ensayos.length;

                    // Unidades Recibidas (SUM detalle_procesos_ac.cantidad)
                    let unidadesRecibidas = 0;
                    try {
                        const { data: detalleAll } = await supabase.from('detalle_procesos_ac').select('cantidad').range(0, 9999);
                        if (Array.isArray(detalleAll)) {
                            unidadesRecibidas = detalleAll.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);
                        }
                    } catch (_) {}

                    // Informes Generados (procesos con n_informe válido)
                    const informesGenerados = procesos.filter(p => {
                        const n = (p.n_informe || '').trim();
                        return n && n !== '-' && n !== '—';
                    }).length;

                    // Clientes Atendidos (COUNT DISTINCT cliente)
                    const clientesSet = new Set();
                    procesos.forEach(p => {
                        const c = (p.cliente || '').trim();
                        if (c && c !== '-' && c !== '—') clientesSet.add(c);
                    });
                    const clientesAtendidos = clientesSet.size;

                    // Procesos Finalizados
                    const procesosFinalizados = procesos.filter(p => (p.estado || '').trim().toLowerCase() === 'finalizado').length;
                    const procesosActivos = totalProcesos - procesosFinalizados;

                    // ── Recepciones por Mes ──
                    const recepcionesPorMes = {};
                    procesos.forEach(p => {
                        const fechaStr = (p.fecha_recepcion || '').substring(0, 10);
                        if (fechaStr && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
                            const key = fechaStr.substring(0, 7);
                            recepcionesPorMes[key] = (recepcionesPorMes[key] || 0) + 1;
                        }
                    });

                    // ── Procesos por Estado ──
                    const procesosPorEstado = {};
                    procesos.forEach(p => {
                        const estado = (p.estado || 'Sin estado').trim();
                        procesosPorEstado[estado] = (procesosPorEstado[estado] || 0) + 1;
                    });

                    // ── Cotizaciones por estado ──
                    const cotizacionesPorEstado = {};
                    cotizaciones.forEach(c => {
                        const estado = (c.estado || 'borrador').trim();
                        cotizacionesPorEstado[estado] = (cotizacionesPorEstado[estado] || 0) + 1;
                    });
                    const valorTotalCotizado = cotizaciones.reduce((sum, c) => sum + (parseFloat(c.total_valor) || 0), 0);

                    // ── Top 10 elementos más recibidos (desde detalle_procesos_ac) ──
                    let detalleElementos;
                    if (hasActiveFilters) {
                        const { data: filteredDetalle } = await supabase
                            .from('detalle_procesos_ac')
                            .select('cantidad, proceso_id, ensayos_acreditados(nombre)')
                            .in('proceso_id', [...filteredProcesoIds])
                            .range(0, 9999);
                        detalleElementos = filteredDetalle || [];
                    } else {
                        const { data: allDetalle } = await supabase
                            .from('detalle_procesos_ac')
                            .select('cantidad, proceso_id, ensayos_acreditados(nombre)')
                            .range(0, 9999);
                        detalleElementos = allDetalle || [];
                    }
                    const elementosPorCantidad = {};
                    const elementoRecepciones = {};
                    detalleElementos.forEach(d => {
                        const nombre = (d.ensayos_acreditados?.nombre || '').trim();
                        if (!nombre || nombre === '-') return;
                        const cant = parseInt(d.cantidad) || 0;
                        elementosPorCantidad[nombre] = (elementosPorCantidad[nombre] || 0) + cant;
                        if (!elementoRecepciones[nombre]) elementoRecepciones[nombre] = new Set();
                        elementoRecepciones[nombre].add(d.proceso_id);
                    });
                    const topEnsayos = Object.entries(elementosPorCantidad)
                        .map(([nombre, count]) => ({ nombre, count, recepciones: elementoRecepciones[nombre]?.size || 0 }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10);

                    // ── Elementos por Categoría ──
                    let detalleConEnsayo;
                    if (hasActiveFilters) {
                        const { data: filteredCat } = await supabase
                            .from('detalle_procesos_ac')
                            .select('cantidad, ensayos_acreditados(categoria)')
                            .in('proceso_id', [...filteredProcesoIds])
                            .range(0, 9999);
                        detalleConEnsayo = filteredCat || [];
                    } else {
                        const { data: allCat } = await supabase
                            .from('detalle_procesos_ac')
                            .select('cantidad, ensayos_acreditados(categoria)')
                            .range(0, 9999);
                        detalleConEnsayo = allCat || [];
                    }
                    const categoriaUnidades = {};
                    (detalleConEnsayo || []).forEach(d => {
                        const cat = d.ensayos_acreditados?.categoria || 'Otros';
                        const cant = parseInt(d.cantidad) || 0;
                        categoriaUnidades[cat] = (categoriaUnidades[cat] || 0) + cant;
                    });
                    const totalUnidadesCat = Object.values(categoriaUnidades).reduce((a, b) => a + b, 0) || 1;
                    const elementosPorCategoria = Object.entries(categoriaUnidades)
                        .map(([nombre, unidades]) => ({ nombre, unidades, porcentaje: Math.round((unidades / totalUnidadesCat) * 100) }))
                        .sort((a, b) => b.unidades - a.unidades);

                    // ── Top 5 Clientes por Unidades Recibidas ──
                    let detalleConProceso;
                    if (hasActiveFilters) {
                        const { data: filteredCP } = await supabase
                            .from('detalle_procesos_ac')
                            .select('cantidad, proceso_id, procesos_acreditados(cliente)')
                            .in('proceso_id', [...filteredProcesoIds])
                            .range(0, 9999);
                        detalleConProceso = filteredCP || [];
                    } else {
                        const { data: allCP } = await supabase
                            .from('detalle_procesos_ac')
                            .select('cantidad, proceso_id, procesos_acreditados(cliente)')
                            .range(0, 9999);
                        detalleConProceso = allCP || [];
                    }
                    const clienteUnidades = {};
                    (detalleConProceso || []).forEach(d => {
                        const cliente = (d.procesos_acreditados?.cliente || '').trim();
                        if (!cliente || cliente === '-' || cliente === '—') return;
                        clienteUnidades[cliente] = (clienteUnidades[cliente] || 0) + (parseInt(d.cantidad) || 0);
                    });
                    const totalUnidadesClientes = Object.values(clienteUnidades).reduce((a, b) => a + b, 0) || 1;
                    const allClientesUnidades = Object.entries(clienteUnidades)
                        .map(([nombre, unidades]) => ({ nombre, unidades, porcentaje: Math.round((unidades / totalUnidadesClientes) * 100) }))
                        .sort((a, b) => b.unidades - a.unidades);
                    const topClientesUnidades = allClientesUnidades.slice(0, 6);

                    // ── Top clientes por procesos (para la gráfica de barras) ──
                    const clienteProcesoCount = {};
                    procesos.forEach(p => {
                        const cliente = (p.cliente || '').trim();
                        if (!cliente || cliente === '-' || cliente === '—') return;
                        clienteProcesoCount[cliente] = (clienteProcesoCount[cliente] || 0) + 1;
                    });
                    const topClientes = Object.entries(clienteProcesoCount)
                        .map(([nombre, count]) => ({ nombre, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10);

                    // ── Top 5 Clientes por Procesos (con porcentaje) ──
                    const totalProcesosConCliente = Object.values(clienteProcesoCount).reduce((a, b) => a + b, 0) || 1;
                    const allClientesProcesos = Object.entries(clienteProcesoCount)
                        .map(([nombre, count]) => ({ nombre, count, porcentaje: Math.round((count / totalProcesosConCliente) * 100) }))
                        .sort((a, b) => b.count - a.count);
                    const top5ClientesProcesos = allClientesProcesos.slice(0, 6);

                    // ── Actividad reciente (últimos 6 procesos) ──
                    const actividadReciente = [...procesos]
                        .sort((a, b) => {
                            const tsA = new Date(a.fecha_recepcion || a.created_at || 0).getTime();
                            const tsB = new Date(b.fecha_recepcion || b.created_at || 0).getTime();
                            if (tsB !== tsA) return tsB - tsA;
                            const tsCreateA = new Date(a.created_at || 0).getTime();
                            const tsCreateB = new Date(b.created_at || 0).getTime();
                            if (tsCreateB !== tsCreateA) return tsCreateB - tsCreateA;
                            return (b.id || 0) - (a.id || 0);
                        })
                        .slice(0, 6)
                        .map(p => {
                            const numero = p.numero_proceso || p.n_remision || p.numero || p.id || '';
                            const nInf = (p.n_informe || '').trim();
                            const informeReal = (nInf && nInf !== '-' && nInf !== '—') ? nInf : '';
                            return {
                                numero_proceso: numero,
                                cliente: p.cliente || '',
                                informe: informeReal,
                                informe_a_nombre_de: p.informe_a_nombre_de || '',
                                estado: p.estado || '',
                                fecha: p.fecha_recepcion || ''
                            };
                        });

                    // ── Últimas recepciones (para la tabla) ──
                    const ultimasRecepciones = [...procesos]
                        .sort((a, b) => {
                            const tsA = new Date(a.fecha_recepcion || a.created_at || 0).getTime();
                            const tsB = new Date(b.fecha_recepcion || b.created_at || 0).getTime();
                            if (tsB !== tsA) return tsB - tsA;
                            const tsCreateA = new Date(a.created_at || 0).getTime();
                            const tsCreateB = new Date(b.created_at || 0).getTime();
                            if (tsCreateB !== tsCreateA) return tsCreateB - tsCreateA;
                            return (b.id || 0) - (a.id || 0);
                        })
                        .slice(0, 7)
                        .map(p => {
                            const num = (p.numero_proceso || p.n_remision || p.numero || '').trim();
                            const nInf = (p.n_informe || '').trim();
                            let estado = (p.estado || '').trim();
                            // Mapear estados a etiquetas legibles
                            const estadoMap = {
                                'recepcion': 'Recepción',
                                'lavado': 'Lavado',
                                'en-proceso-de-ensayo': 'Ensayo',
                                'entrega-cliente': 'Entrega',
                                'informe-de-ensayo': 'Informe',
                                'finalizado': 'Finalizado'
                            };
                            estado = estadoMap[estado.toLowerCase()] || estado;
                            // Contar elementos de este proceso
                            const elemCount = detalleElementosAll.filter(d => d.proceso_id === p.id).reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0);
                            return {
                                numero_proceso: num,
                                cliente: p.cliente || '',
                                fecha: p.fecha_recepcion || '',
                                estado,
                                elementos: elemCount
                            };
                        });

                    // ── Indicadores del Laboratorio ──
                    const elementoMasRecibido = topEnsayos.length > 0 ? { nombre: topEnsayos[0].nombre, unidades: topEnsayos[0].count } : null;
                    const clienteMasUnidades = topClientesUnidades.length > 0 ? { nombre: topClientesUnidades[0].nombre, unidades: topClientesUnidades[0].unidades } : null;
                    const recepcionMasReciente = ultimasRecepciones.length > 0 ? ultimasRecepciones[0].numero_proceso : null;
                    const promedioUnidadesPorRecepcion = totalProcesos > 0 ? Math.round((unidadesRecibidas / totalProcesos) * 10) / 10 : 0;

                    // Cliente con más recepciones (procesos)
                    const clienteMasRecepciones = topClientes.length > 0 ? { nombre: topClientes[0].nombre, recepciones: topClientes[0].count } : null;

                    // Tiempo promedio de entrega (recepción → entrega al cliente)
                    let tiempoPromedioEntrega = 0;
                    const procesosConEntrega = procesos.filter(p => p.fecha_recepcion && p.fecha_entrega_cliente);
                    if (procesosConEntrega.length > 0) {
                        const totalDiasEntrega = procesosConEntrega.reduce((sum, p) => {
                            const inicio = new Date(p.fecha_recepcion);
                            const fin = new Date(p.fecha_entrega_cliente);
                            const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
                            return sum + (dias > 0 ? dias : 0);
                        }, 0);
                        tiempoPromedioEntrega = Math.round((totalDiasEntrega / procesosConEntrega.length) * 10) / 10;
                    }

                    // ── Flujo de procesos ──
                    const flujoProcesos = {
                        recibidos: procesos.filter(p => normalizeStatusKey(p.estado) === 'recepcion').length || totalProcesos,
                        informe: procesos.filter(p => { const e = normalizeStatusKey(p.estado); return e === 'informe-de-ensayo'; }).length,
                        ensayo: procesos.filter(p => { const e = normalizeStatusKey(p.estado); return e === 'en-proceso-de-ensayo'; }).length,
                        entrega: procesos.filter(p => { const e = normalizeStatusKey(p.estado); return e === 'entrega-cliente'; }).length,
                        finalizado: procesosFinalizados
                    };

                    // ── Marcaciones resumen ──
                    const marcacionesResumen = { total: marcaciones.length, marcados: 0, pendientes: 0 };
                    marcaciones.forEach(m => {
                        const est = (m.estado || '').toLowerCase();
                        if (est === 'marcado') marcacionesResumen.marcados++;
                        else if (est === 'pendiente') marcacionesResumen.pendientes++;
                    });

                    const informesActivos = informes.filter(i => i.activo).length;
                    const informesVigentes = new Set(informes.map(i => i.proceso_id)).size;

                    // ── Listas para filtros del dashboard (usando TODOS los procesos, sin filtro) ──
                    const allClientesForFilter = [...new Set((procesosRes.data || []).map(p => (p.cliente || '').trim()).filter(c => c && c !== '-' && c !== '—'))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                    const allEstadosForFilter = [...new Set((procesosRes.data || []).map(p => (p.estado || '').trim()))].filter(Boolean).sort();
                    const allMesesMap = {};
                    (procesosRes.data || []).forEach(p => {
                        const f = (p.fecha_recepcion || '').substring(0, 7);
                        if (f && /^\d{4}-\d{2}$/.test(f) && !allMesesMap[f]) {
                            allMesesMap[f] = true;
                        }
                    });
                    const allMesesForFilter = Object.keys(allMesesMap).sort().reverse().map(m => {
                        const [y, mo] = m.split('-');
                        const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                        return { value: m, label: `${monthNames[parseInt(mo)-1]} ${y}` };
                    });

                    return jsonResponse(200, {
                        ok: true,
                        stats: {
                            totalClientes,
                            totalProcesos,
                            totalCotizaciones,
                            totalInformes,
                            totalEnsayos,
                            ingresosMes: procesos.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0),
                            unidadesRecibidas,
                            informesGenerados,
                            clientesAtendidos,
                            procesosFinalizados,
                            procesosActivos,
                            recepcionesPorMes,
                            valorTotalCotizado,
                            procesosPorEstado,
                            cotizacionesPorEstado,
                            topClientes,
                            topClientesUnidades,
                            allClientesUnidades,
                            top5ClientesProcesos,
                            allClientesProcesos,
                            topEnsayos,
                            allElementos: Object.entries(elementosPorCantidad)
                                .map(([nombre, count]) => ({ nombre, count, recepciones: elementoRecepciones[nombre]?.size || 0 }))
                                .sort((a, b) => b.count - a.count),
                            elementosPorCategoria,
                            actividadReciente,
                            ultimasRecepciones,
                            elementoMasRecibido,
                            clienteMasUnidades,
                            clienteMasRecepciones,
                            recepcionMasReciente,
                            promedioUnidadesPorRecepcion,
                            tiempoPromedioEntrega,
                            flujoProcesos,
                            marcacionesResumen,
                            informesActivos,
                            informesVigentes,
                            ultimoCliente,
                            allClientesForFilter,
                            allEstadosForFilter,
                            allMesesForFilter
                        }
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: 'Error obteniendo stats: ' + err.message });
                }
            }

            // ── REPARACIÓN: Reconstruir detalle_procesos_ac desde borradores ──
            if (payload.action === 'repair_detalle_procesos') {
                const log = [];
                const stats = { procesosReconstruidos: 0, procesosOmitidos: 0, registrosInsertados: 0, elementosSinCoincidencia: [] };

                try {
                    // 1. Obtener todos los procesos
                    const { data: procesos, error: errProcesos } = await supabase
                        .from('procesos_acreditados')
                        .select('id, numero_proceso, cliente');
                    if (errProcesos) return jsonResponse(500, { ok: false, error: 'Error leyendo procesos: ' + errProcesos.message });

                    // 2. Obtener procesos que YA tienen detalle
                    const { data: conDetalle } = await supabase
                        .from('detalle_procesos_ac')
                        .select('proceso_id');
                    const idsConDetalle = new Set((conDetalle || []).map(d => d.proceso_id));

                    // 3. Filtrar solo procesos sin detalle
                    const sinDetalle = (procesos || []).filter(p => !idsConDetalle.has(p.id));
                    log.push(`Procesos totales: ${(procesos || []).length}`);
                    log.push(`Ya tienen detalle: ${idsConDetalle.size}`);
                    log.push(`Sin detalle (candidatos): ${sinDetalle.length}`);

                    if (sinDetalle.length === 0) {
                        return jsonResponse(200, { ok: true, message: 'No hay procesos sin detalle', stats, log });
                    }

                    // 4. Obtener todos los borradores
                    const { data: borrRows } = await supabase
                        .from('borradores')
                        .select('datos');
                    const allDrafts = [];
                    if (Array.isArray(borrRows)) {
                        borrRows.forEach(row => {
                            if (Array.isArray(row.datos)) {
                                row.datos.forEach(d => {
                                    if (!allDrafts.some(x => JSON.stringify(x) === JSON.stringify(d))) {
                                        allDrafts.push(d);
                                    }
                                });
                            }
                        });
                    }
                    log.push(`Borradores disponibles: ${allDrafts.length}`);

                    // 5. Obtener catálogo de ensayos (nombre → id)
                    const { data: ensayos } = await supabase
                        .from('ensayos_acreditados')
                        .select('id, nombre');
                    const ensayoMap = {};
                    (ensayos || []).forEach(e => {
                        const key = (e.nombre || '').trim().toLowerCase();
                        if (key) ensayoMap[key] = e.id;
                    });
                    log.push(`Ensayos en catálogo: ${(ensayos || []).length}`);

                    // 6. Para cada proceso sin detalle, buscar borrador y reconstruir
                    for (const proceso of sinDetalle) {
                        const numProceso = (proceso.numero_proceso || '').trim();

                        // Buscar borrador por cotizacion/numero_proceso
                        const borrador = allDrafts.find(d => {
                            const cot = String(d.cotizacion || d.quoteNumber || '').trim();
                            return cot === numProceso;
                        });

                        if (!borrador) {
                            log.push(`⚠ ${numProceso}: sin borrador encontrado`);
                            stats.procesosOmitidos++;
                            continue;
                        }

                        const items = Array.isArray(borrador.items) ? borrador.items : [];
                        if (items.length === 0) {
                            log.push(`⚠ ${numProceso}: borrador sin items`);
                            stats.procesosOmitidos++;
                            continue;
                        }

                        const detalleInsert = [];

                        for (const item of items) {
                            const nombre = (item.name || '').trim();
                            const ensayoId = ensayoMap[nombre.toLowerCase()];

                            if (!ensayoId) {
                                log.push(`⚠ ${numProceso}: elemento "${nombre}" sin coincidencia en ensayos_acreditados`);
                                stats.elementosSinCoincidencia.push({ proceso: numProceso, elemento: nombre });
                                continue;
                            }

                            // Si tiene brandSummary, crear un registro por marca
                            const brandSummary = Array.isArray(item.brandSummary) ? item.brandSummary : [];
                            if (brandSummary.length > 0) {
                                for (const bs of brandSummary) {
                                    const cantidad = parseInt(bs.count) || 0;
                                    if (cantidad > 0) {
                                        detalleInsert.push({
                                            proceso_id: proceso.id,
                                            ensayo_id: ensayoId,
                                            cantidad,
                                            marca: bs.brand || '',
                                            observaciones: item.observaciones || '',
                                            marcacion: 'Pendiente'
                                        });
                                    }
                                }
                            } else {
                                // Sin brandSummary: crear un registro con la cantidad total
                                const cantidad = parseInt(item.quantity) || 0;
                                if (cantidad > 0) {
                                    detalleInsert.push({
                                        proceso_id: proceso.id,
                                        ensayo_id: ensayoId,
                                        cantidad,
                                        marca: '',
                                        observaciones: item.observaciones || '',
                                        marcacion: 'Pendiente'
                                    });
                                }
                            }
                        }

                        if (detalleInsert.length === 0) {
                            log.push(`⚠ ${numProceso}: 0 registros válidos para insertar`);
                            stats.procesosOmitidos++;
                            continue;
                        }

                        // Insertar detalle (idempotente: verificar una vez más)
                        const { data: yaExiste } = await supabase
                            .from('detalle_procesos_ac')
                            .select('id')
                            .eq('proceso_id', proceso.id)
                            .limit(1);

                        if (Array.isArray(yaExiste) && yaExiste.length > 0) {
                            log.push(`⏭ ${numProceso}: detalle creado concurrentemente, omitiendo`);
                            stats.procesosOmitidos++;
                            continue;
                        }

                        const { error: errInsert } = await supabase
                            .from('detalle_procesos_ac')
                            .insert(detalleInsert);

                        if (errInsert) {
                            log.push(`✗ ${numProceso}: error insertando (${errInsert.message})`);
                            stats.procesosOmitidos++;
                            continue;
                        }

                        log.push(`✓ ${numProceso}: ${detalleInsert.length} registros insertados`);
                        stats.procesosReconstruidos++;
                        stats.registrosInsertados += detalleInsert.length;
                    }

                    return jsonResponse(200, { ok: true, stats, log });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: 'Error en reparación: ' + err.message, stats, log });
                }
            }

            // ── Configuración de la empresa (desde clientes) ──
            if (payload.action === 'get_empresa_config') {
                try {
                    const { data, error } = await supabase
                        .from('clientes')
                        .select('*')
                        .ilike('nombre_empresa', '%high test%')
                        .limit(1)
                        .single();

                    if (error || !data) {
                        // Si no encuentra, devolver valores vacíos
                        return jsonResponse(200, { ok: true, config: {
                            nombre: 'HIGH TEST SAS',
                            nit: '',
                            direccion: '',
                            ciudad: 'Bogotá D.C.',
                            telefono: '',
                            email: '',
                            web: 'www.hightestsas.com',
                            representante_legal: '',
                            soporte_email: ''
                        }});
                    }

                    const config = {
                        nombre: data.nombre_empresa || '',
                        nit: data.nit || data.nit_empresa || '',
                        direccion: data.direccion || '',
                        ciudad: 'Bogotá D.C.',
                        telefono: data.telefono || '',
                        email: data.email || '',
                        web: 'www.hightestsas.com',
                        representante_legal: data.representante_legal || data.contacto_principal || '',
                        soporte_email: data.soporte_email || data.email || ''
                    };

                    return jsonResponse(200, { ok: true, config });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            if (payload.action === 'update_empresa_config') {
                try {
                    const { config } = payload;
                    if (!config) {
                        return jsonResponse(400, { ok: false, error: 'Datos de configuración requeridos' });
                    }

                    // Buscar el cliente High Test
                    const { data: existing } = await supabase
                        .from('clientes')
                        .select('id')
                        .ilike('nombre_empresa', '%high test%')
                        .limit(1)
                        .single();

                    if (existing) {
                        // Actualizar
                        const updateData = {
                            nombre_empresa: config.nombre,
                            nit: config.nit,
                            direccion: config.direccion,
                            telefono: config.telefono,
                            email: config.email,
                            contacto_principal: config.representante_legal
                        };
                        const { error } = await supabase
                            .from('clientes')
                            .update(updateData)
                            .eq('id', existing.id);

                        if (error) {
                            return jsonResponse(500, { ok: false, error: error.message });
                        }
                    }

                    return jsonResponse(200, { ok: true, message: 'Configuración guardada exitosamente' });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Configuración del Sistema (parámetros) ──
            if (payload.action === 'get_system_config') {
                try {
                    const { data, error } = await supabase
                        .from('system_config')
                        .select('*')
                        .limit(1)
                        .single();

                    if (error || !data) {
                        // Devolver valores por defecto
                        return jsonResponse(200, { ok: true, config: {
                            auto_guardado: true,
                            frecuencia_auto_guardado: 5,
                            generar_pdf_auto: true,
                            notificacionesCorreo: true
                        }});
                    }

                    return jsonResponse(200, { ok: true, config: data });
                } catch (err) {
                    return jsonResponse(200, { ok: true, config: {
                        auto_guardado: true,
                        frecuencia_auto_guardado: 5,
                        generar_pdf_auto: true,
                        notificacionesCorreo: true
                    }});
                }
            }

            if (payload.action === 'update_system_config') {
                try {
                    const { config } = payload;
                    if (!config) {
                        return jsonResponse(400, { ok: false, error: 'Configuración requerida' });
                    }

                    const { data: existing } = await supabase
                        .from('system_config')
                        .select('id')
                        .limit(1)
                        .single();

                    if (existing) {
                        const { error } = await supabase
                            .from('system_config')
                            .update(config)
                            .eq('id', existing.id);
                        if (error) return jsonResponse(500, { ok: false, error: error.message });
                    } else {
                        const { error } = await supabase
                            .from('system_config')
                            .insert(config);
                        if (error) return jsonResponse(500, { ok: false, error: error.message });
                    }

                    return jsonResponse(200, { ok: true, message: 'Configuración guardada' });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Estadísticas de Base de Datos ──
            if (payload.action === 'get_db_stats') {
                try {
                    // 1. Verificar conexión real con una consulta
                    let connected = false;
                    try {
                        const { error: pingError } = await supabase
                            .from('clientes')
                            .select('id')
                            .limit(1);
                        connected = !pingError;
                    } catch (e) {
                        connected = false;
                    }

                    if (!connected) {
                        return jsonResponse(200, {
                            ok: true,
                            stats: {
                                connected: false,
                                estado: 'Sin conexión',
                                proveedor: 'Supabase PostgreSQL',
                                tableCount: null,
                                dbSize: null,
                                totalRecords: null,
                                counts: {}
                            }
                        });
                    }

                    // 2. Contar tablas del usuario desde information_schema
                    let tableCount = null;
                    try {
                        const { data: tableData, error: tableError } = await supabase
                            .rpc('count_user_tables');
                        if (!tableError && tableData !== null && tableData !== undefined) {
                            tableCount = parseInt(tableData) || 0;
                        }
                    } catch (e) {
                        // RPC no existe, no hay fallback hardcodeado
                        tableCount = null;
                    }

                    // 3. Obtener tamaño de la BD
                    let dbSize = null;
                    try {
                        const { data: sizeData, error: sizeError } = await supabase
                            .rpc('get_db_size');
                        if (!sizeError && sizeData) {
                            dbSize = sizeData;
                        }
                    } catch (e) {
                        // RPC no existe, no hay fallback
                        dbSize = null;
                    }

                    // 4. Contar registros de todas las tablas funcionales conocidas
                    const functionalTables = [
                        'clientes', 'procesos', 'detalle_proceso',
                        'informes_ensayo_ac', 'marcaciones', 'ensayos',
                        'cotizaciones', 'empresa_config', 'system_config'
                    ];
                    let totalRecords = 0;
                    const counts = {};

                    for (const table of functionalTables) {
                        try {
                            const { count, error } = await supabase
                                .from(table)
                                .select('*', { count: 'exact', head: true });
                            if (!error) {
                                counts[table] = count || 0;
                                totalRecords += (count || 0);
                            }
                        } catch (e) {
                            // Tabla no existe o sin permisos, se omite
                        }
                    }

                    return jsonResponse(200, {
                        ok: true,
                        stats: {
                            connected: true,
                            estado: 'Conectado',
                            proveedor: 'Supabase PostgreSQL',
                            tableCount,
                            dbSize,
                            totalRecords,
                            counts
                        }
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Estadísticas de Storage ──
            if (payload.action === 'get_storage_stats') {
                try {
                    const { data: buckets, error: bucketsError } = await supabase
                        .storage
                        .listBuckets();

                    if (bucketsError) {
                        return jsonResponse(200, {
                            ok: true,
                            storage: {
                                usedMB: null,
                                totalMB: null,
                                percentage: null,
                                buckets: [],
                                lastBackup: null,
                                error: 'No se pudieron listar los buckets'
                            }
                        });
                    }

                    let totalSizeBytes = 0;
                    const bucketStats = [];

                    for (const bucket of (buckets || [])) {
                        try {
                            const { data: files } = await supabase
                                .storage
                                .from(bucket.name)
                                .list('', { limit: 1000 });

                            let bucketSize = 0;
                            if (files) {
                                for (const file of files) {
                                    bucketSize += file.metadata?.size || 0;
                                }
                            }
                            totalSizeBytes += bucketSize;
                            bucketStats.push({
                                name: bucket.name,
                                sizeMB: parseFloat((bucketSize / (1024 * 1024)).toFixed(2)),
                                files: files?.length || 0
                            });
                        } catch (e) {
                            bucketStats.push({ name: bucket.name, sizeMB: 0, files: 0, error: true });
                        }
                    }

                    const usedMB = parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(2));

                    // Buscar último respaldo (solo si el bucket existe)
                    let lastBackup = null;
                    let hasBackupBucket = false;
                    try {
                        const { data: backupFiles, error: backupErr } = await supabase
                            .storage
                            .from('backups')
                            .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
                        if (!backupErr && backupFiles && backupFiles.length > 0) {
                            lastBackup = backupFiles[0].created_at;
                            hasBackupBucket = true;
                        } else if (!backupErr) {
                            hasBackupBucket = true;
                        }
                    } catch (e) {
                        hasBackupBucket = false;
                    }

                    return jsonResponse(200, {
                        ok: true,
                        storage: {
                            usedMB,
                            totalMB: null,
                            percentage: null,
                            buckets: bucketStats,
                            lastBackup,
                            hasBackupBucket
                        }
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Crear Backup ──
            if (payload.action === 'create_backup') {
                try {
                    const backupData = {
                        fecha: new Date().toISOString(),
                        tablas: {}
                    };

                    const tablesToBackup = ['clientes', 'procesos', 'detalle_proceso', 'informes_ensayo_ac', 'marcaciones', 'ensayos'];

                    for (const table of tablesToBackup) {
                        try {
                            const { data, error } = await supabase
                                .from(table)
                                .select('*');
                            if (!error) {
                                backupData.tablas[table] = data;
                            }
                        } catch (e) {
                            backupData.tablas[table] = [];
                        }
                    }

                    // Guardar en storage
                    const fileName = `backup_${new Date().toISOString().slice(0, 10)}_${Date.now()}.json`;
                    const backupJson = JSON.stringify(backupData);

                    const { error: uploadError } = await supabase
                        .storage
                        .from('backups')
                        .upload(fileName, backupJson, {
                            contentType: 'application/json',
                            upsert: false
                        });

                    if (uploadError) {
                        // Si el bucket no existe, crearlo
                        try {
                            await supabase.storage.createBucket('backups', { public: false });
                            await supabase.storage
                                .from('backups')
                                .upload(fileName, backupJson, {
                                    contentType: 'application/json',
                                    upsert: false
                                });
                        } catch (e) {
                            return jsonResponse(500, { ok: false, error: 'No se pudo crear el backup: ' + e.message });
                        }
                    }

                    return jsonResponse(200, {
                        ok: true,
                        message: 'Backup creado exitosamente',
                        fileName,
                        size: (backupJson.length / 1024).toFixed(2) + ' KB',
                        tables: Object.keys(backupData.tablas).length
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Restaurar Backup ──
            if (payload.action === 'restore_backup') {
                try {
                    const { fileName } = payload;
                    if (!fileName) {
                        return jsonResponse(400, { ok: false, error: 'Nombre del archivo requerido' });
                    }

                    // Descargar backup
                    const { data: fileData, error: downloadError } = await supabase
                        .storage
                        .from('backups')
                        .download(fileName);

                    if (downloadError) {
                        return jsonResponse(500, { ok: false, error: 'Error descargando backup: ' + downloadError.message });
                    }

                    const backupText = await fileData.text();
                    const backupData = JSON.parse(backupText);

                    let restored = 0;
                    for (const [table, records] of Object.entries(backupData.tablas || {})) {
                        if (records && records.length > 0) {
                            try {
                                // Eliminar registros existentes
                                await supabase.from(table).delete().neq('id', records[0].id || '');
                                // Insertar registros del backup
                                const { error } = await supabase.from(table).insert(records);
                                if (!error) restored += records.length;
                            } catch (e) {
                                // Continuar con siguiente tabla
                            }
                        }
                    }

                    return jsonResponse(200, {
                        ok: true,
                        message: `Backup restaurado: ${restored} registros recuperados`,
                        restored
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Exportar Datos ──
            if (payload.action === 'export_data') {
                try {
                    const exportData = {
                        fecha: new Date().toISOString(),
                        sistema: 'HighTest Admin Panel',
                        datos: {}
                    };

                    const tablesToExport = ['clientes', 'procesos', 'detalle_proceso', 'informes_ensayo_ac', 'marcaciones', 'ensayos'];

                    for (const table of tablesToExport) {
                        try {
                            const { data, error } = await supabase
                                .from(table)
                                .select('*');
                            if (!error) {
                                exportData.datos[table] = data;
                            }
                        } catch (e) {
                            exportData.datos[table] = [];
                        }
                    }

                    const csvContent = JSON.stringify(exportData, null, 2);

                    return jsonResponse(200, {
                        ok: true,
                        data: exportData,
                        size: (csvContent.length / 1024).toFixed(2) + ' KB'
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Listar Backups ──
            if (payload.action === 'list_backups') {
                try {
                    const { data: files, error } = await supabase
                        .storage
                        .from('backups')
                        .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

                    if (error) {
                        return jsonResponse(200, { ok: true, backups: [] });
                    }

                    const backups = (files || []).map(f => ({
                        name: f.name,
                        size: f.metadata?.size || 0,
                        created: f.created_at
                    }));

                    return jsonResponse(200, { ok: true, backups });
                } catch (err) {
                    return jsonResponse(200, { ok: true, backups: [] });
                }
            }

            // ── Restaurar Backup ──
            if (payload.action === 'restore_backup') {
                try {
                    const { data: files, error: listErr } = await supabase
                        .storage
                        .from('backups')
                        .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

                    if (listErr || !files || files.length === 0) {
                        return jsonResponse(200, { ok: true, backups: [], message: 'No hay respaldos disponibles' });
                    }

                    const backups = files.map(f => ({
                        name: f.name,
                        size: f.metadata?.size || 0,
                        created: f.created_at
                    }));

                    return jsonResponse(200, { ok: true, backups });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Exportar Datos ──
            if (payload.action === 'export_data') {
                try {
                    const tables = ['clientes', 'procesos', 'detalle_proceso', 'informes_ensayo_ac', 'marcaciones', 'ensayos', 'cotizaciones'];
                    const exportObj = { exported_at: new Date().toISOString(), tables: {} };

                    for (const tbl of tables) {
                        const { data, error } = await supabase.from(tbl).select('*').limit(5000);
                        if (!error) exportObj.tables[tbl] = data || [];
                    }

                    return jsonResponse(200, { ok: true, data: exportObj });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            // ── Reportes Stats ──
            if (payload.action === 'get_reportes_stats') {
                try {
                    const { desde, hasta } = payload;

                    // Query base
                    let query = supabase.from('procesos_acreditados').select('*');
                    if (desde) query = query.gte('fecha_recepcion', desde);
                    if (hasta) query = query.lte('fecha_recepcion', hasta);

                    const { data: procesos, error } = await query;
                    if (error) throw error;

                    const total = (procesos || []).length;

                    const completados = (procesos || []).filter(p =>
                        p.estado && (p.estado.toLowerCase().includes('completado') || p.estado.toLowerCase().includes('entregado') || p.estado.toLowerCase().includes('finalizado'))
                    ).length;

                    const enProceso = total - completados;

                    // Ingresos estimados (si existe campo valor)
                    let ingresos = 0;
                    (procesos || []).forEach(p => {
                        if (p.valor) ingresos += Number(p.valor) || 0;
                    });

                    // Procesos por cliente
                    const porCliente = {};
                    (procesos || []).forEach(p => {
                        const cliente = p.cliente || 'Sin cliente';
                        porCliente[cliente] = (porCliente[cliente] || 0) + 1;
                    });

                    const topClientes = Object.entries(porCliente)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([cliente, count]) => ({ cliente, count }));

                    // Procesos por mes
                    const porMes = {};
                    (procesos || []).forEach(p => {
                        if (p.fecha_recepcion) {
                            const mes = p.fecha_recepcion.slice(0, 7);
                            porMes[mes] = (porMes[mes] || 0) + 1;
                        }
                    });

                    const timeline = Object.entries(porMes)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([mes, count]) => ({ mes, count }));

                    // Tiempos de entrega (días entre fecha_recepcion y fecha_entrega)
                    let tiemposEntrega = [];
                    (procesos || []).forEach(p => {
                        if (p.fecha_recepcion && p.fecha_entrega) {
                            const inicio = new Date(p.fecha_recepcion);
                            const fin = new Date(p.fecha_entrega);
                            const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
                            if (dias >= 0) tiemposEntrega.push(dias);
                        }
                    });

                    const promedioEntrega = tiemposEntrega.length > 0
                        ? (tiemposEntrega.reduce((a, b) => a + b, 0) / tiemposEntrega.length).toFixed(1)
                        : null;

                    // Ensayos realizados (contar ensayos asociados)
                    const ensayosRealizados = (procesos || []).reduce((sum, p) => sum + (p.num_ensayos || 0), 0);

                    return jsonResponse(200, {
                        ok: true,
                        stats: {
                            total,
                            completados,
                            enProceso,
                            ingresos,
                            topClientes,
                            timeline,
                            promedioEntrega,
                            ensayosRealizados
                        }
                    });
                } catch (err) {
                    return jsonResponse(500, { ok: false, error: err.message });
                }
            }

            return jsonResponse(400, { ok: false, error: 'Acción no soportada' });
        } catch (err) {
            return jsonResponse(500, { ok: false, error: err.message });
        }
    }

    return jsonResponse(404, { error: 'Ruta no encontrada' });
};