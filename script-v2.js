/* ============================================
   HIGH TEST SAS - JAVASCRIPT
   Laboratorio de Ensayos Eléctricos
   ============================================ */

// ===========================
// CONFIGURACIÓN Y CONSTANTES
// ===========================

const CONFIG = {
    scrollRevealClass: 'scroll-reveal',
    activeClass: 'active',
    menuToggleSelector: '.header__menu-toggle',
    menuSelector: '.header__menu',
    headerSelector: '.header',
    formSelector: '.contact__form',
    animationDuration: 0.6,
    scrollDistance: 100,
    themeStorageKey: 'hightest_theme',
};

// ===========================
// UTILIDADES
// ===========================

/**
 * Utilidad para debouncing (limita la frecuencia de ejecución)
 */
const debounce = (fn, delay = 300) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Utilidad para throttling (ejecuta máximo una vez en X tiempo)
 */
const throttle = (fn, delay = 100) => {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return fn(...args);
        }
    };
};

/**

        const AccreditationGallery = {
            init() {
                this.section = document.getElementById('acreditacion');
                if (!this.section) return;

                this.thumbs = this.section.querySelectorAll('.gallery__thumb');
                this.modal = document.getElementById('accreditationModal');
                if (!this.thumbs.length || !this.modal) return;

                this.titleEl = this.modal.querySelector('.modal__title');
                this.downloadEl = this.modal.querySelector('.modal__download');
                this.closeBtn = this.modal.querySelector('.modal__close');

                this.bindEvents();
            },

            bindEvents() {
                this.thumbs.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const title = btn.dataset.title || '';
                        const href = btn.dataset.href || '#';
                        const preview = btn.dataset.img || btn.querySelector('img')?.src || '';
                        this.openModal(title, href, preview);
                    });
                });

                if (this.closeBtn) {
                    this.closeBtn.addEventListener('click', () => this.closeModal());
                }

                // close on outside click
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeModal();
                });

                // ESC to close
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.modal.getAttribute('aria-hidden') === 'false') {
                        this.closeModal();
                    }
                });
            },

            openModal(title, href, previewSrc) {
                if (this.titleEl) this.titleEl.textContent = title;
                if (this.downloadEl) this.downloadEl.setAttribute('href', href);
                // preview image
                const imgEl = this.modal.querySelector('.modal__preview');
                if (imgEl) {
                    imgEl.src = previewSrc || '';
                    imgEl.alt = title || 'Vista previa del certificado';
                }
                this.modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                // focus the download link for accessibility
                if (this.downloadEl) this.downloadEl.focus();
            },

            closeModal() {
                this.modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        };

        // ===========================
        // MÓDULO: VALIDACIÓN DE FORMULARIO
 * Validar email
 */
const isValidEmail = (email) => {
    const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    return regex.test(email);
};

/**
 * Validar teléfono (formato internacional)
 */
const isValidPhone = (phone) => {
    const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phone.trim() === '' || regex.test(phone);
};

/**
 * Helper genérico para llamar al Netlify Function `conectar`.
 * Devuelve el JSON parseado o lanza un Error si falla.
 */
async function fetchFromDatabase(action, params = {}) {
    const body = Object.assign({ action }, params);
    const res = await fetch('/.netlify/functions/conectar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error('Network response was not ok: ' + res.status);
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON response from server');
    return data;
}

/**
 * Descarga un PDF desde Supabase Storage usando URL firmada con nombre personalizado.
 * Función compartida por Panel Admin y Portal Cliente.
 */
async function downloadPdfFile(archivoUrl, nombre) {
    if (!archivoUrl) {
        alert('URL del informe no disponible');
        return;
    }

    try {
        let filePath = archivoUrl;

        const publicMarker = '/storage/v1/object/public/Informes/';

        if (archivoUrl.includes(publicMarker)) {
            filePath = archivoUrl.split(publicMarker).pop();
        }

        try {
            filePath = decodeURIComponent(filePath);
        } catch (e) {}

       

        const result = await fetchFromDatabase('get_informe_download_url', {
            file_path: filePath,
            file_name: `${nombre || 'informe'}.pdf`
        });

        const downloadUrl = result?.signedUrl || '';

        if (downloadUrl) {
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${nombre || 'informe'}.pdf`;
            a.target = '_blank';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

    } catch (err) {
        console.error('Error descargando PDF:', err);
    }
}

/**
 * Obtener procesos acreditados desde la función `conectar`.
 * filters: { limit, offset, estado, fecha_inicio, fecha_fin, cliente }
 * Si filters está vacío, reutiliza la caché compartida.
 */
async function getProcesosAcreditados(filters = {}) {
    if (Object.keys(filters).length === 0 && typeof window.__getProcesosAcreditadosCached === 'function') {
        return await window.__getProcesosAcreditadosCached();
    }
    const payload = await fetchFromDatabase('get_procesos_acreditados', filters);
    if (!payload.ok) {
        throw new Error(payload.error || 'Error al obtener procesos_acreditados');
    }
    return payload.procesos || payload.data || [];
}

const PROCESOS_STORE = {
    loaded: false,
    all: [],
    filtered: {
        active: [],
        finalized: [],
    },
    pagination: {
        pageActive: 1,
        pageFinalized: 1,
        pageSize: 15,
    },
};

/**
 * Devuelve una etiqueta legible para el estado
 */
function formatStatusLabel(status) {
    if (!status) return '';
    const map = {
        'recepcion': 'Recepción',
        'lavado': 'Lavado',
        'en-proceso-de-ensayo': 'Proceso de ensayo',
        'entrega-cliente': 'Entrega cliente',
        'informe-de-ensayo': 'Informe',
        'finalizado': 'Finalizado'
    };
    const key = String(status).trim().toLowerCase();
    return map[key] || status;
}

/**
 * Determina si un proceso está activo basado en su estado.
 * Solo los procesos con estado 'finalizado' se consideran inactivos.
 * 'entrega-cliente' y demás estados se mantienen activos.
 */
function isProcesoActivo(row) {
    const estado = normalizeStatusKey(row.estado || row.status || '');
    return estado !== 'finalizado';
}

/**
 * Normaliza el formato del número de informe: elimina espacios alrededor de guiones.
 * Ej: "HT - R" → "HT-R", "HT - 2025 - 001" → "HT-2025-001"
 */
function normalizeInformeNumber(value) {
    if (!value) return '';
    return String(value).replace(/\s*-\s*/g, '-').trim();
}

function normalizeStatusKey(status) {
    if (!status) return '';
    const raw = String(status).trim().toLowerCase();
    const compact = raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_\s]+/g, '-');

    const aliases = {
        recepcion: 'recepcion',
        lavado: 'lavado',
        'proceso-de-ensayo': 'en-proceso-de-ensayo',
        'en-proceso-de-ensayo': 'en-proceso-de-ensayo',
        'entrega-cliente': 'entrega-cliente',
        informe: 'informe-de-ensayo',
        'informe-de-ensayo': 'informe-de-ensayo',
        finalizado: 'finalizado'
    };

    return aliases[compact] || compact;
}

/**
 * Renderiza filas en la tabla de certificados (Ensayos Acreditados)
 */
function renderProcesosAcreditadosRows(rows = []) {
    renderProcesosToTable('certificatesTableBody', rows);
}

/**
 * Renderiza un listado de procesos dentro del tbody indicado.
 */
function renderProcesosToTable(tbodyId, rows = []) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';

    const sortedRows = sortProcesosByNumeroDesc(rows);

    if (!Array.isArray(sortedRows) || sortedRows.length === 0) {
        const tr = document.createElement('tr');
        tr.className = 'empty-state';
        tr.innerHTML = `<td colspan="8" style="text-align:center; padding:1rem;">ℹ️ No hay procesos</td>`;
        tbody.appendChild(tr);
        return;
    }

    sortedRows.forEach(row => {
        const numero = row.numero_proceso || row.proceso_numero || row.numero || row.id || row.proceso || row.nro_proceso || '';
        const cliente = row.cliente || row.empresa || row.nombre_cliente || row.client || '';
        const informe = normalizeInformeNumber(row.n_informe || row.informe_numero || row.nro_informe || row.informe || '');
        const estado = row.estado || row.status || '';
        const estadoKey = normalizeStatusKey(estado) || (estado || '').toString().trim().toLowerCase();
        const fechaRecepcion = row.fecha_recepcion || row.fecha_recepcion_iso || row.recepcion || row.fecha_rec || '';
        const fechaEntrega = row.fecha_entrega_cliente || row.fecha_entrega || row.entrega_cliente || '';
        const fechaFinalizado = row.fecha_finalizado || row.fecha_finalizacion || row.finalizado || '';

        const tr = document.createElement('tr');
        const statusLabel = formatStatusLabel(estadoKey || estado);
        tr.innerHTML = `
            <td>${escapeHtml(numero)}</td>
            <td>${escapeHtml(cliente)}</td>
            <td>${escapeHtml(informe)}</td>
            <td>
                <span class="status-badge status--${escapeHtml(estadoKey || (estado||'').toString().replace(/\s+/g,'-'))}">${escapeHtml(String(statusLabel).toUpperCase())}</span>
                <button class="btn btn--small change-status-btn" data-id="${escapeHtml(numero)}" title="Cambiar estado">✏️</button>
            </td>
            <td>${escapeHtml(formatDateShort(fechaRecepcion))}</td>
            <td>${escapeHtml(formatDateShort(fechaEntrega))}</td>
            <td>${escapeHtml(formatDateShort(fechaFinalizado))}</td>
            <td>
                <button class="btn btn--small btn--outline edit-process-btn" data-id="${escapeHtml(numero)}" title="Editar proceso">✏️</button>
                <button class="btn btn--small btn--error delete-process-btn" data-id="${escapeHtml(numero)}" title="Eliminar proceso">🗑️</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function sortProcesosByNumeroDesc(rows = []) {
    if (!Array.isArray(rows)) return [];

    return [...rows].sort((left, right) => {
        const leftValue = getProcessSortValue(left);
        const rightValue = getProcessSortValue(right);

        if (leftValue.numeric !== null && rightValue.numeric !== null && leftValue.numeric !== rightValue.numeric) {
            return rightValue.numeric - leftValue.numeric;
        }

        return rightValue.text.localeCompare(leftValue.text, 'es', {
            numeric: true,
            sensitivity: 'base'
        });
    });
}

function getProcessSortValue(row) {
    const raw = row?.numero_proceso || row?.proceso_numero || row?.numero || row?.id || row?.proceso || row?.nro_proceso || '';
    const text = String(raw).trim();
    const match = text.match(/(\d+)\s*$/);

    return {
        text,
        numeric: match ? Number.parseInt(match[1], 10) : null,
    };
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateShort(value) {
    if (!value) return '';
    // Normalizar a YYYY-MM-DD
    // Si viene en formato YYYY-MM-DD ya, devolver tal cual
    const s = String(value).trim();
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    // intentar parsear fecha
    const d = new Date(s);
    if (!isFinite(d)) return s;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getProcessDateValues(row) {
    return [
        row?.fecha_recepcion,
        row?.fecha_recepcion_iso,
        row?.recepcion,
        row?.fecha_rec,
        row?.fecha_entrega_cliente,
        row?.fecha_entrega,
        row?.entrega_cliente,
        row?.fecha_finalizado,
        row?.fecha_finalizacion,
        row?.finalizado,
    ].filter(Boolean).map((value) => formatDateShort(value));
}

function getProcessSearchBlob(row) {
    const numero = row?.numero_proceso || row?.proceso_numero || row?.numero || row?.id || row?.proceso || row?.nro_proceso || '';
    const cliente = row?.cliente || row?.empresa || row?.nombre_cliente || row?.client || '';
    const informe = normalizeInformeNumber(row?.n_informe || row?.informe_numero || row?.nro_informe || row?.informe || '');
    const estado = row?.estado || row?.status || '';
    return `${numero} ${cliente} ${informe} ${formatStatusLabel(estado)}`.toLowerCase();
}

function getProcesoFiltersFromDom() {
    return {
        status: document.getElementById('adminFilterStatus')?.value || '',
        client: document.getElementById('adminFilterType')?.value?.trim().toLowerCase() || '',
        month: document.getElementById('adminFilterMonth')?.value || document.getElementById('statsMonthFilter')?.value || '',
        date: document.getElementById('adminFilterDate')?.value || '',
        search: document.getElementById('adminSearchCertificates')?.value?.trim().toLowerCase() || '',
    };
}

function getFinalizedProcesoFiltersFromDom() {
    return {
        status: document.getElementById('adminFilterFinalizedStatus')?.value || '',
        client: document.getElementById('adminFilterFinalizedType')?.value?.trim().toLowerCase() || '',
        month: document.getElementById('adminFilterFinalizedMonth')?.value || '',
        date: document.getElementById('adminFilterFinalizedDate')?.value || '',
        search: document.getElementById('adminSearchFinalizedCertificates')?.value?.trim().toLowerCase() || '',
    };
}

function populateClientFilterOptions() {
    const mainSelect = document.getElementById('adminFilterType');
    const finalizedSelect = document.getElementById('adminFilterFinalizedType');
    const selects = [mainSelect, finalizedSelect].filter(Boolean);
    if (!selects.length) return;

    const selectedValues = new Map(selects.map((el) => [el.id, (el.value || '').toLowerCase()]));
    const clients = Array.from(new Set(
        (PROCESOS_STORE.all || [])
            .map((row) => (row?.cliente || row?.empresa || row?.nombre_cliente || row?.client || '').toString().trim())
            .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    selects.forEach((select) => {
        const defaultLabel = select.id === 'adminFilterFinalizedType' ? 'Todos los clientes' : 'Todos los clientes';
        select.innerHTML = `<option value="">${defaultLabel}</option>`;
        clients.forEach((clientName) => {
            const option = document.createElement('option');
            option.value = clientName;
            option.textContent = clientName;
            select.appendChild(option);
        });

        const prevValue = selectedValues.get(select.id);
        if (prevValue) {
            const found = clients.find((clientName) => clientName.toLowerCase() === prevValue);
            select.value = found || '';
        }
    });
}

function matchesProcesoFilters(row, filters) {
    const estadoRaw = row?.estado || row?.status || '';
    const estadoKey = normalizeStatusKey(estadoRaw);
    const clienteRaw = (row?.cliente || row?.empresa || row?.nombre_cliente || row?.client || '').toString().toLowerCase();
    const searchBlob = getProcessSearchBlob(row);
    const allDates = getProcessDateValues(row);

    const matchesStatus = !filters.status || estadoKey === normalizeStatusKey(filters.status);
    const matchesClient = !filters.client || clienteRaw === filters.client;
    const matchesSearch = !filters.search || searchBlob.includes(filters.search);
    const matchesMonth = !filters.month || allDates.some((value) => value.startsWith(filters.month));
    const matchesDate = !filters.date || allDates.includes(filters.date);

    return matchesStatus && matchesClient && matchesSearch && matchesMonth && matchesDate;
}

function applyProcesoPagination(rows = [], pageNum) {
    const pageSize = Number(PROCESOS_STORE.pagination.pageSize);
    if (!pageSize || pageSize <= 0) return rows;

    const page = Math.max(1, Number(pageNum) || 1);
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
}

function renderTabla() {
    const activeRows = sortProcesosByNumeroDesc(PROCESOS_STORE.filtered.active || []);
    const finalizedRows = sortProcesosByNumeroDesc(PROCESOS_STORE.filtered.finalized || []);

    const activeVisible = applyProcesoPagination(activeRows, PROCESOS_STORE.pagination.pageActive);
    const finalizedVisible = applyProcesoPagination(finalizedRows, PROCESOS_STORE.pagination.pageFinalized);

    renderProcesosToTable('certificatesTableBody', activeVisible);
    renderProcesosToTable('finalizedCertificatesTableBody', finalizedVisible);

    renderPaginationControls('paginacionProcesosActivos', activeRows.length, 'active');
    renderPaginationControls('paginacionProcesosFinalizados', finalizedRows.length, 'finalized');

    const totalEl = document.getElementById('statTotalCerts');
    const completedEl = document.getElementById('statCompletedCerts');
    const pendingEl = document.getElementById('statPendingCerts');
    if (totalEl) totalEl.textContent = String(activeRows.length + finalizedRows.length);
    if (completedEl) completedEl.textContent = String(finalizedRows.length);
    if (pendingEl) pendingEl.textContent = String(activeRows.length);

    // Actualizar resúmenes mensuales ahora que las tablas están renderizadas
    try {
        if (window.AdminPanelManager && typeof window.AdminPanelManager.renderMonthlySummary === 'function') {
            window.AdminPanelManager.renderMonthlySummary();
        }
        if (window.AdminPanelManager && typeof window.AdminPanelManager.renderMonthlySummaryNoAcreditados === 'function') {
            window.AdminPanelManager.renderMonthlySummaryNoAcreditados();
        }
    } catch (err) {
        console.warn('Error actualizando resúmenes mensuales:', err);
    }
}

function renderPaginationControls(containerId, totalItems, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const pageSize = Number(PROCESOS_STORE.pagination.pageSize) || 15;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.max(1, Number(type === 'active' ? PROCESOS_STORE.pagination.pageActive : PROCESOS_STORE.pagination.pageFinalized) || 1);

    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const paginarFn = type === 'active' ? 'paginarProcesosActivos' : 'paginarProcesosFinalizados';
    let html = `<span style="font-size: 13px; color: #666;">Mostrando ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalItems)} de ${totalItems}</span>`;
    html += `<button type="button" class="btn btn-small" onclick="${paginarFn}(1)" ${currentPage === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">«</button>`;
    html += `<button type="button" class="btn btn-small" onclick="${paginarFn}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">‹</button>`;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    for (let i = startPage; i <= endPage; i++) {
        html += `<button type="button" class="btn btn-small" onclick="${paginarFn}(${i})" style="padding: 4px 10px; font-size: 13px; ${i === currentPage ? 'background: #022859; color: white;' : ''}">${i}</button>`;
    }
    html += `<button type="button" class="btn btn-small" onclick="${paginarFn}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">›</button>`;
    html += `<button type="button" class="btn btn-small" onclick="${paginarFn}(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">»</button>`;
    container.innerHTML = html;
}

function paginarProcesosActivos(pagina) {
    PROCESOS_STORE.pagination.pageActive = pagina;
    renderTabla();
}

function paginarProcesosFinalizados(pagina) {
    PROCESOS_STORE.pagination.pageFinalized = pagina;
    renderTabla();
}

function filtrarProcesos() {
    const mainFilters = getProcesoFiltersFromDom();
    const finalizedFilters = getFinalizedProcesoFiltersFromDom();

    const activeSource = PROCESOS_STORE.all.filter(
        (row) => isProcesoActivo(row)
    );
    const finalizedSource = PROCESOS_STORE.all.filter(
        (row) => !isProcesoActivo(row)
    );

    PROCESOS_STORE.filtered.active = activeSource.filter((row) => matchesProcesoFilters(row, mainFilters));
    PROCESOS_STORE.filtered.finalized = finalizedSource.filter((row) => matchesProcesoFilters(row, finalizedFilters));

    renderTabla();
}

async function cargarProcesos() {
    try {
        const rows = await getProcesosAcreditados({});
        PROCESOS_STORE.all = sortProcesosByNumeroDesc(rows);
        PROCESOS_STORE.loaded = true;
        PROCESOS_STORE.pagination.pageActive = 1;
        PROCESOS_STORE.pagination.pageFinalized = 1;
        populateClientFilterOptions();
        filtrarProcesos();
        if (typeof GestionInformesModule !== 'undefined') {
            GestionInformesModule.populateClienteFilter?.();
            GestionInformesModule.populateProcesosSelect?.();
        }
    } catch (err) {
        console.error('Error cargando procesos acreditados', err);
        Toast.show({ title: 'Error', message: err.message || 'No se pudieron cargar los procesos', variant: 'error' });
    }
}

async function loadAndRenderProcesos() {
    if (!PROCESOS_STORE.loaded) {
        await cargarProcesos();
        return;
    }
    filtrarProcesos();
}

// Debounce para filtros locales
const debouncedLoadProcesos = debounce(filtrarProcesos, 220);

// Inicializar listeners para filtros y buscar
document.addEventListener('DOMContentLoaded', () => {
    // cargar inicialmente
    cargarProcesos();

    // eventos de filtro
    const inputs = [
        document.getElementById('adminFilterStatus'),
        document.getElementById('adminFilterType'),
        document.getElementById('adminFilterMonth'),
        document.getElementById('adminFilterDate'),
        document.getElementById('adminSearchCertificates'),
        document.getElementById('adminFilterFinalizedStatus'),
        document.getElementById('adminFilterFinalizedType'),
        document.getElementById('adminFilterFinalizedMonth'),
        document.getElementById('adminFilterFinalizedDate'),
        document.getElementById('adminSearchFinalizedCertificates'),
        document.getElementById('statsMonthFilter')
    ];

    inputs.forEach(el => {
        if (!el) return;
        const ev = el.tagName.toLowerCase() === 'input' && el.type === 'text' ? 'input' : 'change';
        el.addEventListener(ev, debouncedLoadProcesos);
    });

    const resetMainFiltersBtn = document.getElementById('resetAcreditadosFiltersBtn');
    if (resetMainFiltersBtn) {
        resetMainFiltersBtn.addEventListener('click', () => {
            const status = document.getElementById('adminFilterStatus');
            const client = document.getElementById('adminFilterType');
            const month = document.getElementById('adminFilterMonth');
            const date = document.getElementById('adminFilterDate');
            const search = document.getElementById('adminSearchCertificates');
            if (status) status.value = '';
            if (client) client.value = '';
            if (month) month.value = '';
            if (date) date.value = '';
            if (search) search.value = '';
            filtrarProcesos();
        });
    }

    const resetFinalizedFiltersBtn = document.getElementById('resetFinalizedAcreditadosFiltersBtn');
    if (resetFinalizedFiltersBtn) {
        resetFinalizedFiltersBtn.addEventListener('click', () => {
            const status = document.getElementById('adminFilterFinalizedStatus');
            const client = document.getElementById('adminFilterFinalizedType');
            const month = document.getElementById('adminFilterFinalizedMonth');
            const date = document.getElementById('adminFilterFinalizedDate');
            const search = document.getElementById('adminSearchFinalizedCertificates');
            if (status) status.value = '';
            if (client) client.value = '';
            if (month) month.value = '';
            if (date) date.value = '';
            if (search) search.value = '';
            filtrarProcesos();
        });
    }

    // Búsqueda y filtros - NO ACREDITADOS (botones de reinicio)
    const resetNoAcreditadosFiltersBtn = document.getElementById('resetNoAcreditadosFiltersBtn');
    if (resetNoAcreditadosFiltersBtn) {
        resetNoAcreditadosFiltersBtn.addEventListener('click', () => {
            const status = document.getElementById('adminFilterStatusNoAcreditados');
            const client = document.getElementById('adminFilterTypeNoAcreditados');
            const month = document.getElementById('adminFilterMonthNoAcreditados');
            const date = document.getElementById('adminFilterDateNoAcreditados');
            const search = document.getElementById('adminSearchCertificatesNoAcreditados');
            if (status) status.value = '';
            if (client) client.value = '';
            if (month) month.value = '';
            if (date) date.value = '';
            if (search) search.value = '';
            if (window.AdminPanelManager) {
                window.AdminPanelManager.filterCertificatesNoAcreditados();
            }
        });
    }

    const resetFinalizedNoAcreditadosFiltersBtn = document.getElementById('resetFinalizedNoAcreditadosFiltersBtn');
    if (resetFinalizedNoAcreditadosFiltersBtn) {
        resetFinalizedNoAcreditadosFiltersBtn.addEventListener('click', () => {
            const status = document.getElementById('adminFilterFinalizedStatusNoAcreditados');
            const client = document.getElementById('adminFilterFinalizedTypeNoAcreditados');
            const month = document.getElementById('adminFilterFinalizedMonthNoAcreditados');
            const date = document.getElementById('adminFilterFinalizedDateNoAcreditados');
            const search = document.getElementById('adminSearchFinalizedCertificatesNoAcreditados');
            if (status) status.value = '';
            if (client) client.value = '';
            if (month) month.value = '';
            if (date) date.value = '';
            if (search) search.value = '';
            if (window.AdminPanelManager) {
                window.AdminPanelManager.filterFinalizedCertificatesNoAcreditados();
            }
        });
    }

    // delegación para botones de acciones (ver/editar) — soporta tablas principal y finalizados
    const bindTableActions = (tableId) => {
        const table = document.getElementById(tableId);
        if (!table) return;
        table.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-process-btn');
            const deleteBtn = e.target.closest('.delete-process-btn');
            const changeStatusBtn = e.target.closest('.change-status-btn');
            if (editBtn) {
                const id = editBtn.dataset.id;
                openEditProcessModal(id);
            }
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (!id) return;
                if (confirm(`Eliminar proceso ${id}? Esta acción no se puede deshacer.`)) {
                    (async () => {
                        try {
                            const res = await fetchFromDatabase('delete_proceso', { numero_proceso: id });
                            if (res.ok) {
                                Toast.show({ title: 'Eliminado', message: `Proceso ${id} eliminado`, variant: 'success' });
                                if (typeof window.__invalidarCacheProcesosAcreditados === 'function') {
                                    window.__invalidarCacheProcesosAcreditados();
                                }
                                cargarProcesos();
                                if (typeof RecepcionAnalyticsModule !== 'undefined') {
                                    RecepcionAnalyticsModule.init(true);
                                }
                            } else {
                                throw new Error(res.error || 'No se pudo eliminar');
                            }
                        } catch (err) {
                            console.error('Error eliminando proceso', err);
                            Toast.show({ title: 'Error', message: err.message || 'No se pudo eliminar', variant: 'error' });
                        }
                    })();
                }
            }
            if (changeStatusBtn) {
                const id = changeStatusBtn.dataset.id;
                if (!id) return;
                AdminPanelManager.editCertificateStatus(id);
            }
        });
    };

    bindTableActions('certificatesTable');
    bindTableActions('finalizedCertificatesTable');
    bindTableActions('noAcreditadosTable');
    bindTableActions('finalizedNoAcreditadosTable');

    // Abrir modal de edición buscando datos desde backend
    async function openEditProcessModal(numero) {
        try {
            const res = await fetchFromDatabase('get_proceso', { numero_proceso: numero });
            if (!res.ok) throw new Error(res.error || 'No se encontró proceso');
            const p = res.proceso;

            const title = document.getElementById('certificateProcessModalTitle');
            const editId = document.getElementById('processEditId');
            const tipo = document.getElementById('processTipo');
            const processNumber = document.getElementById('processNumber');
            const client = document.getElementById('processClientSelect');
            const status = document.getElementById('processStatusSelect');
            const receptionDate = document.getElementById('processReceptionDate');
            const deliveryDate = document.getElementById('processDeliveryDate');
            const finalizedDate = document.getElementById('processFinalizedDate');
            const nInforme = document.getElementById('processNInforme');
            const informeANombre = document.getElementById('processInformeANombreDe');
            const valor = document.getElementById('processValor');
            const obs = document.getElementById('processObservaciones');

            title.textContent = `Editar Proceso ${p.numero_proceso}`;
            editId.value = p.numero_proceso;
            processNumber.value = p.numero_proceso || '';
            if (client) client.value = p.cliente || p.cliente_id || '';
            if (tipo) tipo.value = p.tipo || 'acreditado';
            if (status) status.value = normalizeStatusKey(p.estado) || p.estado || 'recepcion';
            if (receptionDate) receptionDate.value = p.fecha_recepcion ? p.fecha_recepcion.split('T')[0] : '';
            if (deliveryDate) deliveryDate.value = p.fecha_entrega_cliente ? p.fecha_entrega_cliente.split('T')[0] : '';
            if (finalizedDate) finalizedDate.value = p.fecha_finalizado ? p.fecha_finalizado.split('T')[0] : '';
            if (nInforme) nInforme.value = normalizeInformeNumber(p.n_informe || '');
            if (informeANombre) informeANombre.value = p.informe_a_nombre_de || p.cliente || '';
            if (valor) valor.value = p.valor || '';
            if (obs) obs.value = p.observaciones || '';

            // Abrir modal
            const modal = document.getElementById('certificateProcessModal');
            if (modal) {
                modal.classList.add('modal--open');
                modal.setAttribute('aria-hidden', 'false');
            }
        } catch (err) {
            console.error('Error abriendo modal edición', err);
            Toast.show({ title: 'Error', message: err.message || 'No se pudo cargar proceso', variant: 'error' });
        }
    }

    // Escuchar cambios en localStorage desde otras pestañas (recepción → admin)
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin_panel_refresh' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data && data.timestamp) {
                    console.log('[Admin Panel] Recepción actualizada, recargando procesos...', data.numero);
                    cargarProcesos();
                    if (typeof DashboardModule !== 'undefined' && DashboardModule.loadStats) {
                        DashboardModule.loadStats();
                    }
                }
            } catch (err) { /* ignorar parse error */ }
        }
    });
    
});

/**
 * Notificaciones tipo Toast (sin dependencias)
 */
const Toast = {
    containerId: 'htToastContainer',

    ensureContainer() {
        let container = document.getElementById(this.containerId);
        if (container) return container;

        container = document.createElement('div');
        container.id = this.containerId;
        container.className = 'ht-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
        return container;
    },

    show({ title, message, variant = 'info', duration = 2800 } = {}) {
        const safeTitle = (title ?? '').toString().trim();
        const safeMessage = (message ?? '').toString().trim();
        if (!safeTitle && !safeMessage) return;

        const iconByVariant = {
            success: '✅',
            error: '⚠️',
            info: 'ℹ️'
        };

        const container = this.ensureContainer();
        const toast = document.createElement('div');
        toast.className = `ht-toast ht-toast--${variant}`;
        toast.setAttribute('role', 'status');

        const icon = document.createElement('div');
        icon.className = 'ht-toast__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = iconByVariant[variant] || iconByVariant.info;

        const content = document.createElement('div');
        content.className = 'ht-toast__content';

        if (safeTitle) {
            const titleEl = document.createElement('div');
            titleEl.className = 'ht-toast__title';
            titleEl.textContent = safeTitle;
            content.appendChild(titleEl);
        }

        if (safeMessage) {
            const messageEl = document.createElement('div');
            messageEl.className = 'ht-toast__message';
            messageEl.textContent = safeMessage;
            content.appendChild(messageEl);
        }

        toast.appendChild(icon);
        toast.appendChild(content);

        container.appendChild(toast);

        window.setTimeout(() => {
            toast.classList.add('ht-toast--out');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }, Math.max(900, Number(duration) || 0));
    }
};

// ===========================
// MÓDULO: MENU HAMBURGUESA
// ===========================

const MobileMenu = {
    /**
     * Inicializar el menú móvil
     */
    init() {
        this.toggle = document.querySelector(CONFIG.menuToggleSelector);
        this.menu = document.querySelector(CONFIG.menuSelector);
        
        if (!this.toggle || !this.menu) {
            console.error('❌ MobileMenu: elementos no encontrados', {
                toggle: CONFIG.menuToggleSelector,
                menu: CONFIG.menuSelector,
                toggleExists: !!document.querySelector(CONFIG.menuToggleSelector),
                menuExists: !!document.querySelector(CONFIG.menuSelector)
            });
            return;
        }
        
        this.setupListeners();
    },

    /**
     * Configurar event listeners
     */
    setupListeners() {
        // Click en botón hamburguesa
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleToggle();
        });
        
        // Cerrar al clic en un link
        const links = this.menu.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                this.close();
            });
        });

        // Cerrar al hacer click en el overlay
        this.menu.addEventListener('click', (e) => {
            if (e.target === this.menu) {
                this.close();
            }
        });
    },

    /**
     * Toggle del menú
     */
    handleToggle() {
        this.toggle.classList.toggle(CONFIG.activeClass);
        this.menu.classList.toggle(CONFIG.activeClass);

        const isOpen = this.menu.classList.contains(CONFIG.activeClass);
        this.toggle.setAttribute('aria-expanded', isOpen);
        this.menu.setAttribute('aria-hidden', !isOpen);
    },

    /**
     * Abrir menú
     */
    open() {
        if (!this.toggle.classList.contains(CONFIG.activeClass)) {
            this.handleToggle();
        }
    },

    /**
     * Cerrar menú
     */
    close() {
        if (this.toggle.classList.contains(CONFIG.activeClass)) {
            this.handleToggle();
        }
    }
};

// ===========================
// MÓDULO: SCROLL REVEAL
// ===========================

const ScrollReveal = {
    /**
     * Inicializar scroll reveal
     */
    init() {
        this.setupObserver();
        this.revealOnLoad();
    },

    /**
     * Observador de intersección
     */
    setupObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(CONFIG.activeClass);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observar todos los elementos con scroll-reveal
        const revealElements = document.querySelectorAll(`.${CONFIG.scrollRevealClass}`);
        revealElements.forEach(el => this.observer.observe(el));
    },

    /**
     * Revelar elementos visibles al cargar
     */
    revealOnLoad() {
        const revealElements = document.querySelectorAll(`.${CONFIG.scrollRevealClass}`);
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add(CONFIG.activeClass);
            }
        });
    }
};

// ===========================
// MÓDULO: HEADER STICKY
// ===========================

const StickyHeader = {
    /**
     * Inicializar header sticky
     */
    init() {
        this.header = document.querySelector(CONFIG.headerSelector);
        if (!this.header) return;

        window.addEventListener('scroll', throttle(() => this.handleScroll(), 50));
    },

    /**
     * Manejo del scroll
     */
    handleScroll() {
        const scrollTop = window.scrollY;
        const threshold = CONFIG.scrollDistance + 50; // Adjusted threshold for better visibility

        if (scrollTop > threshold) {
            this.header.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        } else {
            this.header.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
        }
    }
};

// ===========================
// MÓDULO: TEMA CLARO / OSCURO
// ===========================

const ThemeManager = {
    currentTheme: 'light',

    init() {
        const stored = localStorage.getItem(CONFIG.themeStorageKey);
        this.currentTheme = stored === 'dark' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme, false);
        this.setupListeners();
    },

    setupListeners() {
        const desktopBtn = document.getElementById('themeToggleBtn');
        const mobileBtn = document.getElementById('mobileThemeToggleBtn');

        const handler = () => {
            const next = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(next, true);
        };

        if (desktopBtn) desktopBtn.addEventListener('click', handler);
        if (mobileBtn) mobileBtn.addEventListener('click', handler);
    },

    applyTheme(theme, persist = true) {
        this.currentTheme = theme;
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');

        this.updateToggleLabels();

        if (persist) {
            localStorage.setItem(CONFIG.themeStorageKey, theme);
        }
    },

    updateToggleLabels() {
        const desktopBtn = document.getElementById('themeToggleBtn');
        const mobileBtn = document.getElementById('mobileThemeToggleBtn');
        const isDark = this.currentTheme === 'dark';

        if (desktopBtn) {
            desktopBtn.textContent = isDark ? '☀️' : '🌙';
            desktopBtn.title = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
        }

        if (mobileBtn) {
            mobileBtn.textContent = isDark ? '☀️ Tema claro' : '🌙 Tema oscuro';
        }
    }
};

// ===========================
// MÓDULO: VALIDACIÓN DE FORMULARIO
// ===========================

const FormValidator = {
    /**
     * Inicializar validación de formulario
     */
    init() {
        this.form = document.querySelector(CONFIG.formSelector);
        if (!this.form) return;

        this.inputs = this.form.querySelectorAll('input, select, textarea');
        this.setupValidation();
    },

    /**
     * Configurar validación en tiempo real
     */
    setupValidation() {
        this.inputs.forEach(input => {
            // Validación al cambiar
            input.addEventListener('change', () => this.validateField(input));
            
            // Validación al desenfocarse
            input.addEventListener('blur', () => this.validateField(input));
            
            // Limpiar error al escribir
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    input.classList.remove('error');
                    this.removeError(input);
                }
            });
        });

        // Submit del formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    /**
     * Validar campo individual
     */
    validateField(field) {
        const type = field.type;
        const value = field.value.trim();
        const required = field.required; // Simplified required check

        // Validar si es requerido
        if (required && !value) {
            this.showError(field, 'Este campo es requerido');
            return false;
        }

        // Validaciones específicas por tipo
        switch (type) {
            case 'email':
                if (value && !isValidEmail(value)) {
                    this.showError(field, 'Ingrese un email válido');
                    return false;
                }
                break;
            case 'tel':
                if (value && !isValidPhone(value)) {
                    this.showError(field, 'Ingrese un teléfono válido');
                    return false;
                }
                break;
            case 'text':
            case 'textarea':
                if (value && value.length < 3) {
                    this.showError(field, 'Mínimo 3 caracteres');
                    return false;
                }
                break;
        }

        this.removeError(field);
        return true;
    },

    /**
     * Mostrar error en campo
     */
    showError(field, message) {
        field.classList.add('error');
        
        // Eliminar error anterior si existe
        this.removeError(field);
        
        // Crear elemento de error
        const errorDiv = document.createElement('span');
        errorDiv.className = 'form__error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            display: block;
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
            animation: fadeIn 0.3s ease;
        `;
        
        field.parentNode.appendChild(errorDiv);
    },

    /**
     * Remover error en campo
     */
    removeError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.form__error');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Manejar submit del formulario
     */
    handleSubmit(e) {
        e.preventDefault();

        // Validar todos los campos
        let isValid = true;
        this.inputs.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            return;
        }

        // Si es válido, mostrar mensaje de éxito
        this.showSuccess();

        // Aquí se enviaría a servidor
        
        // Resetear formulario después de 2 segundos
        setTimeout(() => {
            this.form.reset();
            this.resetFields();
        }, 1500);
    },

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess() {
        const successDiv = document.createElement('div');
        successDiv.className = 'form__success';
        successDiv.setAttribute('role', 'alert');
        successDiv.innerHTML = `
            <p style="
                background: #10b981;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                animation: slideInDown 0.3s ease;
            ">
                ✓ Gracias por contactarnos. Nos comunicaremos pronto.
            </p>
        `;
        
        this.form.insertBefore(successDiv, this.form.firstChild);

        // Remover después de 3 segundos
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    },

    /**
     * Resetear estilos de campos
     */
    resetFields() {
        this.inputs.forEach(field => {
            field.classList.remove('error');
            const errorDiv = field.parentNode.querySelector('.form__error');
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }
};

// ===========================
// MÓDULO: SMOOTH SCROLL
// ===========================

const SmoothScroll = {
    /**
     * Inicializar smooth scroll para anclas
     */
    init() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => this.handleAnchorClick(e));
        });
    },

    /**
     * Manejar click en anclas
     */
    handleAnchorClick(e) {
        const href = e.currentTarget.getAttribute('href');
        
        // Saltar if es solo "#"
        if (href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        
        if (target) {
            e.preventDefault();
            
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Accessibility: focus en el elemento
            target.focus();
        }
    }
};

// ===========================
// MÓDULO: ANIMACIONES SCROLL
// ===========================

const ScrollAnimations = {
    /**
     * Inicializar animaciones por scroll
     */
    init() {
        // Agregar clase scroll-reveal a elementos que deben ser revelados
        this.addScrollRevealToCards();
        
        // Inicializar scroll reveal
        ScrollReveal.init();
    },

    /**
     * Agregar clase scroll-reveal a tarjetas
     */
    addScrollRevealToCards() {
        const selectors = [
            '.service-card',
            '.capacity__card',
            '.accreditation__card',
            '.equipment__card',
            '.sector__card',
            '.standard__item',
            '.intro__highlight',
            '.stat__item'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add(CONFIG.scrollRevealClass);
                // Delay escalonado
                el.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }
};

// ===========================
// MÓDULO: UTILIDADES DE NAVEGACIÓN
// ===========================

const Navigation = {
    /**
     * Inicializar navegación
     */
    init() {
        this.setupAnchorLinks();
        this.updateActiveLink();
        
        window.addEventListener('scroll', throttle(() => this.updateActiveLink(), 100));
    },

    /**
     * Configurar links de navegación
     */
    setupAnchorLinks() {
        const navLinks = document.querySelectorAll('.header__link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    
                    if (target) {
                        // Cerrar menú móvil
                        MobileMenu.close();
                        
                        // Scroll suave
                        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    },

    /**
     * Actualizar link activo según scroll
     */
    updateActiveLink() {
        const scrollY = window.scrollY;
        const navLinks = document.querySelectorAll('.header__link');
        
        navLinks.forEach(link => {
            link.classList.remove(CONFIG.activeClass);
            
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = document.querySelector(href);
                
                if (section) {
                    const sectionTop = section.offsetTop - 100;
                    const sectionHeight = section.offsetHeight;
                    
                    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                        link.classList.add(CONFIG.activeClass);
                    }
                }
            }
        });
    }
};

// ===========================
// MÓDULO: VERIFICADOR PÚBLICO DE INFORMES
// ===========================

const PublicReportVerifier = {
    // Datos de ejemplo de informes emitidos por HIGH TEST.
    // En producción, estos datos vendrían de una API/servidor.
    reports: [
        {
            number: 'HT-2025-001',
            client: 'Empresa 1 SAS',
            product: 'Guantes aislantes Clase 2',
            date: '2025-03-15',
            type: 'Informe de ensayo acreditado',
            status: 'Válido',
            lab: 'HIGH TEST SAS',
            note: 'Ejemplo de informe generado dentro del sistema interno de HIGH TEST.'
        },
        {
            number: 'HT-2025-002',
            client: 'Empresa 2 Ltda',
            product: 'Herramientas aislantes',
            date: '2025-03-10',
            type: 'Informe de verificación',
            status: 'Válido',
            lab: 'HIGH TEST SAS',
            note: 'Informe de verificación de lote de herramientas aislantes.'
        },
        {
            number: 'HT-2025-003',
            client: 'Empresa 3 S.A.',
            product: 'Ensayo funcional de equipos',
            date: '2025-03-08',
            type: 'Informe de ensayo',
            status: 'Válido',
            lab: 'HIGH TEST SAS',
            note: 'Ensayos funcionales de equipos de medición en banco.'
        },
        {
            number: 'HT-2025-004',
            client: 'Cliente Demo',
            product: 'Informe de ensayo adicional',
            date: '2025-03-05',
            type: 'Informe de ensayo',
            status: 'En revisión',
            lab: 'HIGH TEST SAS',
            note: 'Ejemplo de informe marcado como pendiente de cierre técnico.'
        }
    ],

    init() {
        const input = document.getElementById('numeroInforme');
        const btn = document.getElementById('verifyReportBtn');
        const result = document.getElementById('verifyReportResult');

        if (!input || !btn || !result) return;

        this.modal = document.getElementById('reportVerifyModal');
        this.modalBody = document.getElementById('reportVerifyBody');
        this.modalClose = document.getElementById('reportVerifyClose');
        this.modalCloseFooter = document.getElementById('reportVerifyCloseFooter');

        this.bindModalEvents();

        const handleVerify = async () => {
            const raw = input.value.trim();
            if (!raw) {
                this.showResult('Por favor ingrese un número de informe.', false);
                this.showModal(null, false, '');
                return;
            }

            const normalized = raw.toUpperCase().replace(/\s+/g, ' ').trim();
            this.showResult('Buscando informe...', true);

            try {
                const result = await fetchFromDatabase('search_informe_publico', { n_informe: normalized });

                if (result?.ok && result?.found) {
                    const inf = result.informe;
                    this.showResult(`✔ Informe ${inf.n_informe} válido.`, true);
                    this.showModal({
                        number: inf.n_informe,
                        client: inf.cliente,
                        informe_a_nombre: inf.informe_a_nombre_de || inf.cliente,
                        product: inf.producto,
                        date: inf.fecha_entrega_cliente || '—',
                        fecha_recepcion: inf.fecha_recepcion || '—',
                        type: inf.tipo_prueba || 'Ensayo acreditado',
                        status: inf.activo ? 'Válido' : 'Inactivo',
                        lab: 'HIGH TEST SAS',
                        numero_proceso: inf.numero_proceso,
                    }, true, normalized);
                } else {
                    this.showResult(`✖ No encontramos el informe ${normalized} en los registros de HIGH TEST.`, false);
                    this.showModal(null, false, normalized);
                }
            } catch (err) {
                console.error('Error verificando informe:', err);
                this.showResult(`✖ Error al buscar el informe. Intente nuevamente.`, false);
                this.showModal(null, false, normalized);
            }
        };

        // Exponer función global opcional para validación programática
        window.validarInforme = handleVerify;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleVerify();
        });

        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleVerify();
            }
        });
    },

    bindModalEvents() {
        if (!this.modal) return;

        const close = () => this.closeModal();

        if (this.modalClose) {
            this.modalClose.addEventListener('click', close);
        }
        if (this.modalCloseFooter) {
            this.modalCloseFooter.addEventListener('click', close);
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    },

    openModal() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    },

    showModal(record, ok, searchedNumber) {
        if (!this.modal || !this.modalBody) return;

        const now = new Date();
        const verifyDate = now.toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' });
        const verifyTime = now.toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' });

        if (!record && !searchedNumber) {
            this.modalBody.innerHTML = `
                <div style="text-align:center; padding:24px 0;">
                    <div style="width:72px; height:72px; margin:0 auto 16px; background:#fff3e0; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                        <span style="font-size:32px;">⚠️</span>
                    </div>
                    <h3 style="margin:0 0 8px; color:#e65100; font-size:18px;">No se pudo verificar</h3>
                    <p style="margin:0; color:#666; font-size:14px;">Ocurrió un error al consultar. Intente nuevamente.</p>
                </div>
            `;
            this.openModal();
            return;
        }

        if (record) {
            const isValid = record.status === 'Válido' || record.status === 'Activo';
            const statusColor = isValid ? '#16a34a' : record.status === 'Inactivo' ? '#dc2626' : '#d97706';
            const statusBg = isValid ? '#f0fdf4' : record.status === 'Inactivo' ? '#fef2f2' : '#fffbeb';
            const borderColor = isValid ? '#16a34a' : record.status === 'Inactivo' ? '#dc2626' : '#d97706';
            const statusText = isValid ? 'VÁLIDO' : (record.status || 'VÁLIDO');

            this.modalBody.innerHTML = `
                <div style="text-align:center; padding:20px 0 16px;">
                    <div style="width:72px; height:72px; margin:0 auto 14px; background:${statusBg}; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid ${borderColor}; box-shadow:0 0 0 6px ${statusBg};">
                        <span style="font-size:32px;">${isValid ? '🛡️' : '❌'}</span>
                    </div>
                    <h2 class="verify-modal__title" style="margin:0 0 6px; color:${statusColor}; font-size:20px; text-transform:uppercase; letter-spacing:1px;">Informe Verificado</h2>
                    <p class="verify-modal__subtitle" style="margin:0; font-size:13px;">El informe ha sido verificado exitosamente y es auténtico.</p>
                </div>

                <div style="text-align:center; margin-bottom:16px;">
                    <span class="verify-modal__badge" style="display:inline-block; padding:6px 20px; background:${statusBg}; color:${statusColor}; border:2px solid ${borderColor}; border-radius:20px; font-size:13px; font-weight:700; letter-spacing:0.5px;">
                        ✅ Estado del informe: ${statusText}
                    </span>
                    <div class="verify-modal__subtitle" style="margin-top:8px; font-size:11px;">
                        🕐 Verificado el ${verifyDate} a las ${verifyTime} a. m.
                    </div>
                </div>

                <div class="verify-modal__card" style="display:flex; align-items:center; gap:16px; padding:16px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:20px;">
                    <div style="width:48px; height:48px; background:#e0e7ff; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <span style="font-size:22px;">📄</span>
                    </div>
                    <div style="flex:1;">
                        <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px;">Informe de Ensayo</div>
                        <div style="font-size:20px; font-weight:800; color:#1e293b; font-family:monospace; letter-spacing:1px;">${record.number}</div>
                    </div>
                    <div style="text-align:right; border-left:1px solid #e2e8f0; padding-left:16px;">
                        <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px;">N° Proceso</div>
                        <div style="font-size:15px; font-weight:700; color:#022859;">${record.numero_proceso || '—'}</div>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <h4 class="verify-modal__section-title" style="margin:0 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #022859; padding-bottom:6px; color:#022859;">Información del Informe</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0;">
                        <div class="verify-modal__field" style="padding:10px 12px; border-bottom:1px solid #f0f0f0;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">👤 Cliente</div>
                            <div style="font-size:13px; font-weight:600; color:#1e293b;">${record.client || '—'}</div>
                        </div>
                        <div class="verify-modal__field" style="padding:10px 12px; border-bottom:1px solid #f0f0f0;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">📝 Informe a nombre de</div>
                            <div style="font-size:13px; font-weight:600; color:#1e293b;">${record.informe_a_nombre || record.client || '—'}</div>
                        </div>
                        <div class="verify-modal__field" style="padding:10px 12px; border-bottom:1px solid #f0f0f0;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">📅 Fecha de recepción</div>
                            <div style="font-size:13px; font-weight:600; color:#1e293b;">${record.fecha_recepcion || '—'}</div>
                        </div>
                        <div class="verify-modal__field" style="padding:10px 12px; border-bottom:1px solid #f0f0f0;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">📅 Fecha de entrega</div>
                            <div style="font-size:13px; font-weight:600; color:#1e293b;">${record.date || '—'}</div>
                        </div>
                        <div class="verify-modal__field" style="padding:10px 12px;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">🏢 Laboratorio emisor</div>
                            <div style="font-size:13px; font-weight:600; color:#1e293b;">${record.lab}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <h4 class="verify-modal__section-title" style="margin:0 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #022859; padding-bottom:6px; color:#022859;">Detalles de Verificación</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
                        <div class="verify-modal__detail-box" style="padding:10px; background:#f8fafc; border-radius:8px; text-align:center;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">Código</div>
                            <div style="font-size:11px; font-weight:700; color:#022859; font-family:monospace;">${record.number}</div>
                        </div>
                        <div class="verify-modal__detail-box" style="padding:10px; background:#f8fafc; border-radius:8px; text-align:center;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">Emisión</div>
                            <div style="font-size:11px; font-weight:600; color:#1e293b;">${record.date || '—'}</div>
                        </div>
                        <div class="verify-modal__detail-box" style="padding:10px; background:#f8fafc; border-radius:8px; text-align:center;">
                            <div class="verify-modal__label" style="font-size:10px; text-transform:uppercase;">Verificación</div>
                            <div style="font-size:11px; font-weight:600; color:#1e293b;">${verifyDate}</div>
                        </div>
                    </div>
                </div>

                <div class="verify-modal__footer-box" style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px;">
                    <span style="font-size:20px; flex-shrink:0;">🛡️</span>
                    <div>
                        <div style="font-size:12px; font-weight:700; color:#166534;">Autenticidad garantizada</div>
                        <div class="verify-modal__subtitle" style="font-size:11px; line-height:1.5; color:#166534;">Este informe ha sido emitido por HIGH TEST SAS y su autenticidad ha sido confirmada en nuestra base de datos.</div>
                    </div>
                </div>
            `;
        } else {
            this.modalBody.innerHTML = `
                <div style="text-align:center; padding:20px 0 16px;">
                    <div style="width:72px; height:72px; margin:0 auto 14px; background:#fef2f2; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid #dc2626; box-shadow:0 0 0 6px #fef2f2;">
                        <span style="font-size:32px;">🛡️</span>
                    </div>
                    <h2 class="verify-modal__title" style="margin:0 0 6px; color:#dc2626; font-size:20px; text-transform:uppercase; letter-spacing:1px;">Informe No Verificado</h2>
                    <p class="verify-modal__subtitle" style="margin:0; font-size:13px;">No se encontró el informe en los registros de HIGH TEST SAS.</p>
                </div>

                <div style="text-align:center; margin-bottom:16px;">
                    <span class="verify-modal__badge" style="display:inline-block; padding:6px 20px; background:#fef2f2; color:#dc2626; border:2px solid #dc2626; border-radius:20px; font-size:13px; font-weight:700; letter-spacing:0.5px;">
                        ❌ Estado del informe: NO ENCONTRADO
                    </span>
                </div>

                <div class="verify-modal__warn-box" style="padding:14px; background:#fff7ed; border:1px solid #fed7aa; border-radius:10px; margin-bottom:16px;">
                    <div style="font-size:11px; font-weight:600; color:#9a3412; margin-bottom:4px;">Número buscado:</div>
                    <div style="font-size:16px; font-weight:800; color:#c2410c; font-family:monospace; letter-spacing:1px;">${searchedNumber}</div>
                </div>

                <div style="margin-bottom:16px;">
                    <h4 class="verify-modal__section-title" style="margin:0 0 10px; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-bottom:2px solid #022859; padding-bottom:6px; color:#022859;">Posibles Causas</h4>
                    <div style="display:grid; gap:8px;">
                        <div class="verify-modal__field" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:#f8fafc; border-radius:8px;">
                            <span style="font-size:16px;">🔍</span>
                            <span class="verify-modal__text" style="font-size:13px; color:#475569;">El número no existe en el sistema</span>
                        </div>
                        <div class="verify-modal__field" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:#f8fafc; border-radius:8px;">
                            <span style="font-size:16px;">✏️</span>
                            <span class="verify-modal__text" style="font-size:13px; color:#475569;">Error de escritura en el número</span>
                        </div>
                        <div class="verify-modal__field" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:#f8fafc; border-radius:8px;">
                            <span style="font-size:16px;">📋</span>
                            <span class="verify-modal__text" style="font-size:13px; color:#475569;">El informe aún no ha sido cargado al sistema</span>
                        </div>
                    </div>
                </div>

                <div class="verify-modal__success-box" style="padding:14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; margin-bottom:14px;">
                    <div style="font-size:12px; font-weight:700; color:#166534; margin-bottom:6px;">✅ Formato correcto:</div>
                    <div style="font-size:12px; color:#166534; line-height:1.6;">
                        Ejemplo: <strong>HT-R26 0001</strong>, <strong>HT-R26 0015</strong>
                    </div>
                </div>

                <div class="verify-modal__footer-box" style="display:flex; align-items:flex-start; gap:10px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                    <span style="font-size:18px; flex-shrink:0;">📞</span>
                    <div class="verify-modal__subtitle" style="font-size:11px; line-height:1.5; color:#64748b;">
                        Si tiene dudas, contacte directamente a <strong>HIGH TEST SAS</strong> para recibir confirmación formal.
                    </div>
                </div>
            `;
        }

        this.openModal();
    },

    showResult(message, ok) {
        const result = document.getElementById('verifyReportResult');
        if (!result) return;

        result.textContent = message;
        result.classList.remove('hero__verify-result--ok', 'hero__verify-result--error');
        result.classList.add(ok ? 'hero__verify-result--ok' : 'hero__verify-result--error');
    }
};

// ===========================
// MÓDULO: BLOG (ARTÍCULOS)
// ===========================

const BlogManager = {
    init() {
        const posts = document.querySelectorAll('.blog__post');
        const modal = document.getElementById('blogPostModal');

        if (!posts.length || !modal) return;

        this.modal = modal;
        this.titleEl = document.getElementById('blogPostTitle');
        this.metaEl = document.getElementById('blogPostMeta');
        this.bodyEl = document.getElementById('blogPostBody');

        posts.forEach(post => {
            post.addEventListener('click', () => this.openFromPost(post));
        });

        const closeBtn = document.getElementById('blogPostClose');
        const closeFooterBtn = document.getElementById('blogPostCloseFooter');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => this.close());
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                this.close();
            }
        });
    },

    openFromPost(post) {
        const title = post.querySelector('.blog__title')?.textContent.trim() || '';
        const excerpt = post.querySelector('.blog__excerpt')?.textContent.trim() || '';
        const date = post.querySelector('.blog__date')?.textContent.trim() || '';
        const readTime = post.querySelector('.blog__read-time')?.textContent.trim() || '';

        if (this.titleEl) {
            this.titleEl.textContent = title;
        }

        if (this.metaEl) {
            this.metaEl.textContent = date && readTime ? `${date} · ${readTime}` : `${date}${readTime}`;
        }

        if (this.bodyEl) {
            this.bodyEl.innerHTML = `
                <p>${excerpt}</p>
                <p>
                    El desarrollo completo de este artículo estará disponible próximamente.
                    Para recibir más información técnica sobre este tema, puede contactar al equipo de HIGH TEST SAS
                    a través de los canales de contacto del sitio.
                </p>
            `;
        }

        this.open();
    },

    open() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// ===========================
// MÓDULO: CARRUSEL DEL HERO
// ===========================

const HeroCarousel = {
    images: ['image/banner8.png', 'image/banner2.png'],
    currentIndex: 0,
    intervalId: null,
    intervalMs: 7000,

    init() {
        const hero = document.querySelector('.hero');
        if (!hero || this.images.length <= 1) return;

        this.hero = hero;
        this.preloadImages();
        this.start();
    },

    preloadImages() {
        this.images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    },

    start() {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.next(), this.intervalMs);
    },

    next() {
        if (!this.hero) return;

        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        const src = this.images[this.currentIndex];

        // Fondo combinado: degradado + imagen
        this.hero.style.backgroundImage = `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%), url('${src}')`;
        this.hero.style.backgroundSize = 'cover';
        this.hero.style.backgroundPosition = 'center';
        this.hero.style.backgroundRepeat = 'no-repeat';
    }
};

// ===========================
// MÓDULO: INICIALIZACIÓN
// ===========================

const App = {
    /**
     * Inicializar la aplicación
     */
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    },

    /**
     * Configuración principal
     */
    setup() {
        // Inicializar módulos (cada llamada protegida para evitar que un fallo detenga toda la inicialización)
        try {
            MobileMenu.init();
            StickyHeader.init();
            ThemeManager.init();
            FormValidator.init();
            FormValidatorContact.init();
            SmoothScroll.init();
            ScrollAnimations.init();
            Navigation.init();
            CertificationsHub.init();
            AccreditationGallery.init();
            AuthManager.init();
            CertificatesManager.init();
            PublicCertificatesManager.init();
            CertificatesAuthManager.init();
            ClientAuth.init();
            BlogManager.init();
        } catch (err) {
            console.error('❌ Error inicializando módulos principales:', err);
        }

        // Inicializar el carrusel por separado (para garantizar ejecución aunque otros módulos fallen)
        try {
            HeroCarousel.init();
        } catch (err) {
            console.error('❌ Error inicializando HeroCarousel:', err);
        }

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('appReady'));
    }
};

// ===========================
// MÓDULO: CENTRO DE CERTIFICADOS
// ===========================

const CertificationsHub = {
    /**
     * Inicializar hub de certificados
     */
    init() {
        const filterBtns = document.querySelectorAll('.cert-hub__filter-btn');
        const cards = document.querySelectorAll('.cert-hub__card');

        if (filterBtns.length === 0 || cards.length === 0) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn, cards));
        });

        // Agregar scroll reveal a las tarjetas
        cards.forEach((card, index) => {
            card.classList.add(CONFIG.scrollRevealClass);
            card.style.animationDelay = `${index * 0.05}s`;
        });
    },

    /**
     * Manejar filtrado de tarjetas
     */
    handleFilter(btn, cards) {
        const filter = btn.getAttribute('data-filter');

        // Actualizar botones activos
        document.querySelectorAll('.cert-hub__filter-btn').forEach(b => {
            b.classList.remove(CONFIG.activeClass);
            b.setAttribute('aria-pressed', 'false');
        });

        btn.classList.add(CONFIG.activeClass);
        btn.setAttribute('aria-pressed', 'true');

        // Filtrar tarjetas
        cards.forEach(card => {
            const category = card.getAttribute('data-category');

            if (filter === 'all' || category === filter) {
                // Mostrar tarjeta
                setTimeout(() => {
                    card.style.display = 'flex';
                    card.classList.add(CONFIG.activeClass);
                }, 50);
            } else {
                // Ocultar tarjeta
                card.classList.remove(CONFIG.activeClass);
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
};

// ===========================
// MÓDULO: VALIDACIÓN DE FORMULARIO
// ===========================

const FormValidatorContact = {
    init() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Validación en tiempo real
        form.querySelectorAll('.form__input').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    },

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        
        if (!value && field.required) {
            this.showError(field, 'Este campo es obligatorio');
            return false;
        }

        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showError(field, 'Correo electrónico inválido');
                return false;
            }
        }

        if (type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
            if (!phoneRegex.test(value)) {
                this.showError(field, 'Teléfono inválido');
                return false;
            }
        }

        return true;
    },

    showError(field, message) {
        field.classList.add('form__input--error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form__error';
        errorDiv.textContent = message;
        
        const existing = field.parentElement.querySelector('.form__error');
        if (existing) existing.remove();
        
        field.parentElement.appendChild(errorDiv);
    },

    clearError(field) {
        field.classList.remove('form__input--error');
        const error = field.parentElement.querySelector('.form__error');
        if (error) error.remove();
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const fields = form.querySelectorAll('.form__input[required]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showFormFeedback('Por favor, corrija los errores en el formulario', 'error');
            return;
        }

        this.showFormFeedback('¡Solicitud enviada exitosamente!', 'success');
        setTimeout(() => {
            form.reset();
            this.showFormFeedback('', '');
        }, 2000);
    },

    showFormFeedback(message, type) {
        const feedbackDiv = document.getElementById('formFeedback');
        if (!feedbackDiv) return;

        if (!message) {
            feedbackDiv.style.display = 'none';
            feedbackDiv.className = '';
            return;
        }

        feedbackDiv.textContent = message;
        feedbackDiv.className = `form__feedback form__feedback--${type}`;
        feedbackDiv.style.display = 'block';
    }
};

// ===========================
// GESTOR DE AUTENTICACIÓN
// ===========================

const AuthManager = {
    currentUser: null,
    storageKey: 'hightest_user',
    _initialized: false,
    _loginInProgress: false,

    ensureAuthNotice() {
        const authModal = document.getElementById('authModal');
        if (!authModal) return null;

        let notice = authModal.querySelector('#authModalNotice');
        if (notice) return notice;

        const loginTab = document.getElementById('loginTab');
        const subtitle = authModal.querySelector('.auth-modal__subtitle');
        if (!loginTab) return null;

        notice = document.createElement('div');
        notice.id = 'authModalNotice';
        notice.className = 'auth-modal__notice auth-modal__notice--hidden';
        notice.setAttribute('role', 'status');
        notice.setAttribute('aria-live', 'polite');

        if (subtitle && subtitle.parentElement === loginTab) {
            subtitle.insertAdjacentElement('afterend', notice);
        } else {
            loginTab.insertAdjacentElement('afterbegin', notice);
        }

        return notice;
    },

    showAuthNotice({ message, variant = 'success', duration = 3000 } = {}) {
        const text = (message ?? '').toString().trim();
        if (!text) return;

        const notice = this.ensureAuthNotice();
        if (!notice) return;

        notice.textContent = text;
        notice.classList.remove('auth-modal__notice--hidden');
        notice.classList.toggle('auth-modal__notice--success', variant === 'success');
        notice.classList.toggle('auth-modal__notice--error', variant === 'error');
        notice.classList.toggle('auth-modal__notice--info', variant === 'info');

        window.clearTimeout(this._noticeTimeoutId);
        this._noticeTimeoutId = window.setTimeout(() => {
            notice.classList.add('auth-modal__notice--hidden');
            notice.textContent = '';
        }, Math.max(900, Number(duration) || 0));
    },

    /**
     * Inicializar el gestor de autenticación
     */
    init() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;
        this.loadUserFromStorage();
        this.setupEventListeners();
        this.updateUIBasedOnAuthStatus();
    },

    /**
     * Cargar datos del usuario desde localStorage
     */
    loadUserFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    /**
     * Guardar usuario en localStorage
     */
    saveUserToStorage() {
        if (this.currentUser) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
        }
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón de login HIGH TEST en header
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                // Si ya hay sesión HIGH TEST, ir directo al panel
                if (this.currentUser) {
                    window.location.href = 'admin-panel/admin-panel.html';
                    return;
                }
                // Si no hay sesión, abrir modal de login
                this.openAuthModal();
            });
        }

        // Botón de login HIGH TEST en menú móvil
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', () => {
                // Si ya hay sesión HIGH TEST, ir directo al panel
                if (this.currentUser) {
                    window.location.href = 'admin-panel/admin-panel.html';
                    MobileMenu.close();
                    return;
                }
                // Si no hay sesión, abrir modal de login
                this.openAuthModal();
                // Cerrar menú móvil después de hacer click
                MobileMenu.close();
            });
        }

        // Modal de autenticación
        const authModal = document.getElementById('authModal');
        const closeBtn = authModal?.querySelector('.auth-modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeAuthModal();
            });
        }

        // Tabs del modal (solo login ahora)
        const tabButtons = authModal?.querySelectorAll('.auth-modal__tab');
        tabButtons?.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Formularios
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Cerrar modal al hacer clic fuera
        authModal?.addEventListener('click', (e) => {
            if (e.target === authModal) {
                this.closeAuthModal();
            }
        });
    },

    /**
     * Abrir modal de autenticación
     */
    openAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Ir al tab de login
            this.switchTab('login');
        } else {
            console.error('🔐 AuthManager: Modal no encontrado en el DOM');
        }
    },

    /**
     * Cerrar modal de autenticación
     */
    closeAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Cambiar entre tabs de login/registro
     */
    switchTab(tabName) {
        const authModal = document.getElementById('authModal');
        if (!authModal) return;

        // Desactivar todos los tabs
        authModal.querySelectorAll('.auth-modal__tab-content').forEach(content => {
            content.classList.remove('active');
        });
        authModal.querySelectorAll('.auth-modal__tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activar el tab seleccionado
        const selectedContent = document.getElementById(`${tabName}Tab`);
        const selectedBtn = authModal.querySelector(`[data-tab="${tabName}"]`);
        if (selectedContent) selectedContent.classList.add('active');
        if (selectedBtn) selectedBtn.classList.add('active');
    },

    /**
     * Manejar login
     */
    async handleLogin(e) {
        e.preventDefault();

        if (this._loginInProgress) return;
        this._loginInProgress = true;

        let redirectScheduled = false;

        const form = e.target;
        const email = form.querySelector('input[name="email"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        // Validaciones básicas
        if (!email || !password) {
            alert('Por favor, completa todos los campos');
            this._loginInProgress = false;
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Correo electrónico inválido');
            this._loginInProgress = false;
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    email,
                    password
                })
            });

            const resultado = await response.json().catch(() => ({}));

            if (!response.ok) {
                alert('Acceso denegado: Verifique sus credenciales de HIGH TEST.');
                this._loginInProgress = false;
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            const remember = !!form.querySelector('input[name="remember"]')?.checked;
            const user = resultado?.user;
            const userName = user?.nombre || user?.name || email;
            const userRole = user?.rol || user?.rol || rol;

            // Login exitoso - Usuario HIGH TEST
            this.currentUser = {
                id: user?.id || Date.now(),
                name: userName,
                email: user?.email || email,
                company: 'HIGH TEST SAS',
                loginTime: new Date().toLocaleString(),
                userType: 'hightest',
                role: userRole,
                remember
            };

            this.saveUserToStorage();

            // Mostrar mensaje en el mismo modal y luego redirigir
            this.showAuthNotice({
                message: `Acceso concedido. Bienvenido, ${this.currentUser.name}. Redirigiendo al panel administrativo...`,
                variant: 'success',
                duration: 3000
            });

            redirectScheduled = true;
            window.setTimeout(() => {
                window.location.href = 'admin-panel/admin-panel.html';
            }, 3000);
        } catch (error) {
            console.error('Error en el sistema de acceso:', error);
            alert('Error en el sistema de acceso. Intente nuevamente.');
        } finally {
            if (!redirectScheduled) {
                this._loginInProgress = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        }
    },

    /**
     * Cerrar sesión (logout)
     */
    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem(this.storageKey);
            this.currentUser = null;
            this.updateUIBasedOnAuthStatus();
            this.closeAuthModal();
            // También ocultar vistas de cliente si existían
            CertificatesAuthManager.hideAllViews();
            alert('Has cerrado sesión correctamente');
        }
    },

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Mostrar vista de HIGH TEST
     */
    showHightestView() {
        // Ocultar todas las vistas
        this.hideAllViews();
        
        // Mostrar vista de HIGH TEST
        const hightestView = document.getElementById('misCertificados');
        if (hightestView) {
            hightestView.style.display = 'block';
            // Scroll a la vista
            setTimeout(() => {
                hightestView.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },

    /**
     * Ocultar todas las vistas de usuario
     */
    hideAllViews() {
        const hightestView = document.getElementById('misCertificados');
        const clientView = document.getElementById('clientPortal');
        
        if (hightestView) hightestView.style.display = 'none';
        if (clientView) clientView.style.display = 'none';
    },

    /**
     * Actualizar UI basado en estado de autenticación
     */
    updateUIBasedOnAuthStatus() {
        const loginBtn = document.getElementById('loginBtn');
        const myCertsSection = document.getElementById('misCertificados');

        if (this.currentUser) {
            // Usuario HIGH TEST autenticado
            if (loginBtn) {
                loginBtn.innerHTML = '🔐 INGRESO<br>HIGH TEST';
                loginBtn.style.backgroundColor = 'rgba(0, 58, 128, 0.9)';
                loginBtn.style.color = '#ffffff';
            }
            // En la página de inicio no mostramos la sección "Mis Certificados"
            if (myCertsSection) {
                myCertsSection.style.display = 'none';
            }
        } else {
            // Usuario no autenticado
            if (loginBtn) {
                loginBtn.innerHTML = '🔐 INGRESO<br>HIGH TEST';
                loginBtn.style.backgroundColor = '';
                loginBtn.style.color = '';
            }
            if (myCertsSection) {
                myCertsSection.style.display = 'none';
            }
            // También ocultar vista de cliente
            this.hideAllViews();
        }
    },

    /**
     * Actualizar información en la tarjeta de usuario
     */
    updateUserCardInfo() {
        if (!this.currentUser) return;

        const nameEl = document.getElementById('userName');
        const emailEl = document.getElementById('userEmail');
        const companyEl = document.getElementById('userCompany');
        const avatarEl = document.querySelector('.user-card__avatar');

        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (emailEl) emailEl.textContent = this.currentUser.email;
        if (companyEl) companyEl.textContent = this.currentUser.company;
        if (avatarEl) {
            const initials = this.currentUser.name.charAt(0).toUpperCase();
            avatarEl.textContent = initials;
        }
    }
};

// ===========================
// GESTOR DE DESCARGA DE CERTIFICADOS PÚBLICOS
// ===========================

const PublicCertificatesManager = {
    init() {
        this.setupDownloadButton();
    },

    /**
     * Configurar botón de descarga de certificado público
     */
    setupDownloadButton() {
        const downloadBtn = document.getElementById('downloadCertBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => this.handleDownload(e));
        }
    },

    /**
     * Manejar descarga de certificado
     */
    handleDownload(e) {
        e.preventDefault();
        
        // Simulación de descarga - en producción esto descargaría un PDF real
        alert('Descargando certificado de ensayo...\n\nEn una implementación real, aquí se descargaría el archivo PDF del certificado.');
        
        // Simular descarga creando un enlace temporal
        const link = document.createElement('a');
        link.href = '#'; // En producción: URL del PDF real
        link.download = 'certificado-ensayo-high-test.pdf';
        link.click();
    }
};

// ===========================
// GESTOR DE AUTENTICACIÓN DE CERTIFICADOS
// ===========================

const CertificatesAuthManager = {
    currentClient: null,
    storageKey: 'hightest_client',
    _initialized: false,

    /**
     * Inicializar el gestor de autenticación de certificados
     */
    init() {
        if (this._initialized) return;
        this._initialized = true;
        this.loadClientFromStorage();
        this.updateClientUI();
        this.setupModalControls();
    },

    /**
     * Cargar cliente desde localStorage
     */
    loadClientFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.currentClient = JSON.parse(stored);
        }
    },

    /**
     * Actualizar UI del cliente autenticado
     */
    updateClientUI() {
        const certificatesBtn = document.getElementById('certificatesBtn');

        if (this.currentClient) {
            // En la página de inicio no mostramos datos del cliente,
            // sólo mantenemos el botón genérico y redirigimos a
            // client-portal.html cuando ya está autenticado.
            if (certificatesBtn) {
                certificatesBtn.innerHTML = '📄 Portal Clientes<br><span class="header__cta-sub">Certificados</span>';
                certificatesBtn.style.backgroundColor = '';
                certificatesBtn.style.color = '';
            }
        } else {
            if (certificatesBtn) {
                certificatesBtn.innerHTML = '📄 Portal Clientes<br><span class="header__cta-sub">Certificados</span>';
                certificatesBtn.style.backgroundColor = '';
                certificatesBtn.style.color = '';
            }
        }
    },

    /**
     * Controladores y modal
     */
    setupModalControls() {
        const certificatesBtn = document.getElementById('certificatesBtn');
        const certificatesModal = document.getElementById('certificatesModal');
        const closeBtn = document.getElementById('certificatesModalClose');
        // Buscar el formulario de certificados por varios posibles ids (compatibilidad)
        const certificatesForm = document.getElementById('certificatesForm') || document.getElementById('clientLoginForm') || document.querySelector('#certificatesModal form') || document.querySelector('.certificates-form');

        if (!certificatesBtn || !certificatesModal) {
            console.error('❌ CertificatesAuthManager: elementos de modal no encontrados');
            return;
        }

        certificatesBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const storedClient = localStorage.getItem('hightest_client');
            if (storedClient) {
                window.location.href = 'portal-clientes/client-portal.html';
                return;
            }

            this.openCertificatesModal();

            // Al abrir el modal, enfocar el campo de email si existe (soporta id clientEmail)
            setTimeout(() => {
                const modal = document.getElementById('certificatesModal');
                if (!modal) return;
                const emailInput = modal.querySelector('input[name="email"]') || modal.querySelector('#clientEmail') || document.getElementById('clientEmail') || modal.querySelector('#certificatesEmail');
                if (emailInput) emailInput.focus();
            }, 120);
        });

        // Botón de certificados en menú móvil
        const mobileCertificatesBtn = document.getElementById('mobileCertificatesBtn');
        if (mobileCertificatesBtn) {
            mobileCertificatesBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const storedClient = localStorage.getItem('hightest_client');
                if (storedClient) {
                    window.location.href = 'portal-clientes/client-portal.html';
                    // Cerrar menú móvil después de redireccionar
                    MobileMenu.close();
                    return;
                }

                this.openCertificatesModal();
                // Cerrar menú móvil después de abrir modal
                MobileMenu.close();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCertificatesModal());
        }

        certificatesModal.addEventListener('click', (event) => {
            if (event.target === certificatesModal) {
                this.closeCertificatesModal();
            }
        });

        if (certificatesForm) {
            certificatesForm.addEventListener('submit', (e) => this.handleCertificatesAuth(e));
        } else {
            console.warn('⚠️ CertificatesAuthManager: no se encontró formulario de certificados para enlazar submit');
        }
    },

    /**
     * Abrir modal de certificados
     */
    openCertificatesModal() {
        const certificatesModal = document.getElementById('certificatesModal');

        if (certificatesModal) {
            certificatesModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            console.error('❌ No se encontró el elemento certificatesModal');
        }
    },

    /**
     * Cerrar modal de certificados
     */
    closeCertificatesModal() {
        const certificatesModal = document.getElementById('certificatesModal');
        if (certificatesModal) {
            certificatesModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Manejar autenticación de certificados
     */
    async handleCertificatesAuth(e) {
        e.preventDefault();
        const form = e.target;

        // Soporte para distintos atributos de campo: name="email" | id="clientEmail" | id="certificatesEmail"
        const emailEl = form.querySelector('input[name="email"]') || form.querySelector('#clientEmail') || document.getElementById('clientEmail') || form.querySelector('#certificatesEmail');
        const passwordEl = form.querySelector('input[name="password"]') || form.querySelector('#clientPassword') || document.getElementById('clientPassword') || form.querySelector('#certificatesPassword');

        const email = (emailEl && emailEl.value) ? emailEl.value.trim() : '';
        const password = (passwordEl && passwordEl.value) ? passwordEl.value : '';

        // Preparar feedback inline profesional
        const modal = document.getElementById('certificatesModal');
        let feedbackEl = modal && modal.querySelector('.certificates__feedback');
        if (!feedbackEl && modal) {
            feedbackEl = document.createElement('div');
            feedbackEl.className = 'certificates__feedback';
            const formParent = form.parentElement || modal;
            formParent.insertBefore(feedbackEl, form);
        }

        const setFeedback = (msg, isError = true) => {
            if (!feedbackEl) return;
            const icon = isError ? '⚠️' : '✓';
            const bgColor = isError 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.04) 100%)';
            const borderColor = isError ? '#fca5a5' : '#86efac';
            const textColor = isError ? '#7f1d1d' : '#166534';
            
            feedbackEl.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    background: ${bgColor};
                    border: 1.5px solid ${borderColor};
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: ${textColor};
                    animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                ">
                    <span style="font-size: 18px; flex-shrink: 0; display: inline-block;">${icon}</span>
                    <span>${msg}</span>
                </div>
            `;
        };

        // Inyectar animación CSS si no existe
        if (!document.getElementById('clientAuthAnimations')) {
            const style = document.createElement('style');
            style.id = 'clientAuthAnimations';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Validaciones básicas
        if (!email || !password) {
            setFeedback('Completa tu correo y tu contraseña para continuar.', true);
            return;
        }

        if (!this.isValidEmail(email)) {
            setFeedback('Escribe un correo válido, por favor.', true);
            return;
        }

        // Desactivar botón de submit y mostrar estado
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = 'Ingresando...';
        }

        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login_cliente', email, password })
            });

            const json = await resp.json().catch(() => ({}));

            if (!resp.ok || !json.ok) {
                setFeedback(json?.error || 'No pudimos validar tus datos. Revisa el correo y la contraseña e inténtalo de nuevo.', true);
                console.warn('CertificatesAuthManager login_cliente failed:', json);
                return;
            }

            // Login exitoso
            const user = json.user || {};
            this.currentClient = {
                id: user.id || Date.now(),
                name: user.name || user.nombre || user.nombre_empresa || email,
                email: user.email || email,
                company: user.company || user.nombre_empresa || null,
                loginTime: new Date().toLocaleString(),
                userType: 'client'
            };

            localStorage.setItem(this.storageKey, JSON.stringify(this.currentClient));

            setFeedback(`Todo listo, ${this.currentClient.name}. Estamos entrando a tu portal de cliente.`, false);

            // Cerrar modal y redirigir después de pequeña pausa
            setTimeout(() => {
                this.closeCertificatesModal();
                window.location.href = 'portal-clientes/client-portal.html';
            }, 900);
        } catch (err) {
            console.error('CertificatesAuthManager: error conectando al servidor', err);
            setFeedback('No pudimos conectar con el servidor. Intenta nuevamente en unos segundos.', true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || 'Ingresar';
            }
        }
    },

    /**
     * Mostrar vista de cliente
     */
    showClientView() {
        // Ocultar todas las vistas
        this.hideAllViews();
        
        // Mostrar vista de cliente
        const clientView = document.getElementById('clientPortal');
        if (clientView) {
            clientView.style.display = 'block';
            // Actualizar información del cliente
            this.updateClientInfo();
            // Scroll a la vista
            setTimeout(() => {
                clientView.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },

    /**
     * Ocultar todas las vistas
     */
    hideAllViews() {
        const hightestView = document.getElementById('misCertificados');
        const clientView = document.getElementById('clientPortal');
        
        if (hightestView) hightestView.style.display = 'none';
        if (clientView) clientView.style.display = 'none';
    },

    /**
     * Actualizar información del cliente en la vista
     */
    updateClientInfo() {
        if (!this.currentClient) return;

        const clientNameEl = document.getElementById('clientName');
        const clientCompanyEl = document.getElementById('clientCompany');
        const clientEmailEl = document.getElementById('clientEmail');

        if (clientNameEl) clientNameEl.textContent = this.currentClient.name;
        if (clientCompanyEl) clientCompanyEl.textContent = this.currentClient.company;
        if (clientEmailEl) clientEmailEl.textContent = this.currentClient.email;
    },

    /**
     * Logout del cliente
     */
    clientLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem(this.storageKey);
            this.currentClient = null;
            this.updateClientUI();
            this.hideAllViews();
            alert('Has cerrado sesión correctamente');
        }
    },

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

// ===========================
// GESTOR DE CERTIFICADOS
// ===========================

const CertificatesManager = {
    init() {
        this.setupSearchAndFilters();
        this.setupDownloadButtons();
    },

    /**
     * Configurar búsqueda y filtros
     */
    setupSearchAndFilters() {
        const searchInput = document.getElementById('searchCertificates');
        const filterStatus = document.getElementById('filterStatus');
        const filterType = document.getElementById('filterType');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => this.filterCertificates()));
        }
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterCertificates());
        }
        if (filterType) {
            filterType.addEventListener('change', () => this.filterCertificates());
        }
    },

    /**
     * Filtrar certificados según búsqueda y filtros
     */
    filterCertificates() {
        const grid = document.getElementById('certificatesGrid');
        if (!grid) return;

        const searchText = document.getElementById('searchCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const typeFilter = document.getElementById('filterType')?.value || '';

        const items = grid.querySelectorAll('.certificate-item');

        items.forEach(item => {
            const certId = item.dataset.certId;
            const status = item.dataset.status;
            const type = item.dataset.type;
            const title = item.querySelector('.certificate-item__title')?.textContent.toLowerCase() || '';
            const number = item.querySelector('dd')?.textContent.toLowerCase() || '';

            // Comparar búsqueda
            const matchesSearch = !searchText || 
                title.includes(searchText) || 
                certId.toLowerCase().includes(searchText) ||
                number.includes(searchText);

            // Comparar filtros
            const matchesStatus = !statusFilter || status === statusFilter;
            const matchesType = !typeFilter || type === typeFilter;

            // Mostrar u ocultar elemento
            if (matchesSearch && matchesStatus && matchesType) {
                item.style.display = 'grid';
                item.style.animation = 'fadeIn 0.3s ease';
            } else {
                item.style.display = 'none';
            }
        });
    },

    /**
     * Configurar botones de descarga
     */
    setupDownloadButtons() {
        const grid = document.getElementById('certificatesGrid');
        if (!grid) return;

        const downloadBtns = grid.querySelectorAll('.certificate-item__actions a.btn--primary');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const certItem = btn.closest('.certificate-item');
                const certId = certItem?.dataset.certId || 'Certificado';
                this.simulateDownload(certId);
            });
        });
    },

    /**
     * Simular descarga de PDF
     */
    simulateDownload(certId) {
        // Crear un elemento <a> temporal para simular la descarga
        const link = document.createElement('a');
        
        // Crear un contenido de ejemplo para el PDF (en producción, esto vendría del servidor)
        const pdfContent = `
            HIGH TEST SAS - REPORTE TÉCNICO
            =====================================
            Certificado: ${certId}
            Fecha de descarga: ${new Date().toLocaleDateString('es-ES')}
            
            Este es un archivo de ejemplo simulado.
            En producción, este será el PDF del reporte técnico.
            
            Detalles del ensayo:
            - Producto: [Descripción del producto]
            - Norma: [Norma aplicada]
            - Resultado: Conforme
            - Observaciones: Ninguna
            
            Generado por: Laboratorio HIGH TEST SAS
            Acreditado bajo: ISO/IEC 17025
        `;

        // Crear blob y URL
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        // Configurar y disparar descarga
        link.href = url;
        link.download = `${certId}_Reporte.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Feedback visual
        alert(`🎉 Iniciando descarga: ${certId}_Reporte.txt\n\nEn producción, se descargaría un PDF completo.`);
    }
};

// ===========================
// EJECUCIÓN
// ===========================

// Función de verificación
function verifyDOMElements() {
    const loginBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const certificatesBtn = document.getElementById('certificatesBtn');
    const certificatesModal = document.getElementById('certificatesModal');
    
    const allFound = loginBtn && authModal && loginForm && registerForm && certificatesBtn;

    if (!allFound) {
        console.error('❌ ELEMENTOS FALTANTES - Revisar HTML');
    }
}

// Fallback de botón de certificados
function bindCertificatesBtnFallback() {
    const certificatesBtn = document.getElementById('certificatesBtn');
    if (!certificatesBtn) {
        console.error('❌ bindCertificatesBtnFallback: botón no encontrado');
        return;
    }
    if (certificatesBtn.dataset.bound === 'true') return;

    certificatesBtn.dataset.bound = 'true';

    certificatesBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const storedClient = localStorage.getItem('hightest_client');
        if (storedClient) {
            window.location.href = 'portal-clientes/client-portal.html';
            return;
        }

        if (typeof CertificatesAuthManager !== 'undefined' && CertificatesAuthManager.openCertificatesModal) {
            CertificatesAuthManager.openCertificatesModal();
        } else {
            const certificatesModal = document.getElementById('certificatesModal');
            if (certificatesModal) {
                certificatesModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    });
}

// ===========================
// MÓDULO: AUTH CLIENTES (ClientAuth)
// ===========================

const ClientAuth = {
    formId: 'clientLoginForm',
    storageKey: 'hightest_client',

    init() {
        const form = document.getElementById(this.formId);
        if (!form) return;
        form.addEventListener('submit', (e) => this.handleLogin(e));
    },

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const emailEl = form.querySelector('input[name="email"]') || form.querySelector('#clientEmail') || document.getElementById('clientEmail');
        const passwordEl = form.querySelector('input[name="password"]') || form.querySelector('#clientPassword') || document.getElementById('clientPassword');

        const email = emailEl?.value?.trim() || '';
        const password = passwordEl?.value || '';

        // feedback inline profesional
        let feedback = form.querySelector('.client-login__feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'client-login__feedback';
            form.insertBefore(feedback, form.firstChild);
        }

        const setFeedback = (msg, isError = true) => {
            const icon = isError ? '⚠️' : '✓';
            const bgColor = isError 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.04) 100%)';
            const borderColor = isError ? '#fca5a5' : '#86efac';
            const textColor = isError ? '#7f1d1d' : '#166534';
            
            feedback.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: 12px;
                    background: ${bgColor};
                    border: 1.5px solid ${borderColor};
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.5;
                    color: ${textColor};
                    animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                ">
                    <span style="font-size: 18px; flex-shrink: 0; display: inline-block;">${icon}</span>
                    <span>${msg}</span>
                </div>
            `;
        };

        // Inyectar animación CSS si no existe
        if (!document.getElementById('clientAuthAnimations')) {
            const style = document.createElement('style');
            style.id = 'clientAuthAnimations';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        

        if (!email || !password) {
            setFeedback('Completa tu correo y tu contraseña para continuar.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFeedback('Escribe un correo válido, por favor.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.orig = submitBtn.textContent;
            submitBtn.textContent = 'Ingresando…';
        }

        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login_cliente', email, password })
            });

            const data = await resp.json().catch(() => ({}));

            if (!resp.ok || !data.ok) {
                setFeedback(data?.error || 'No pudimos validar tus datos. Revisa el correo y la contraseña e inténtalo de nuevo.');
                console.warn('ClientAuth failed', data);
                return;
            }

            const user = data.user || {};
            const client = {
                id: user.id || Date.now(),
                name: user.name || user.nombre || user.nombre_empresa || email,
                email: user.email || email,
                company: user.company || user.nombre_empresa || null,
                loginTime: new Date().toLocaleString()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(client));
            setFeedback(`Todo listo, ${client.name}. Estamos entrando a tu portal de cliente.`, false);

            setTimeout(() => {
                window.location.href = 'portal-clientes/client-portal.html';
            }, 800);
        } catch (err) {
            console.error('ClientAuth error:', err);
            setFeedback('No pudimos conectar con el servidor. Intenta nuevamente en unos segundos.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.orig || 'Ingresar';
            }
        }
    }
};

// ===========================
// GESTOR DEL PANEL ADMINISTRATIVO
// ===========================

const AdminPanelManager = {
    currentUser: null,
    certificates: [],
    clientsCatalog: [],
    processSequence: 5,
    currentViewTab: 'acreditados',
    currentCertificateTypeTab: 'acreditado',

    init() {
        this.loadUserFromStorage();
        if (!this.currentUser) {
            // Si no hay usuario, redirigir al home
            window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        // no cargar datos mock por defecto — usamos la fuente real `procesos_acreditados`
        this.setupEventListeners();
        this.setupClientsManagement();
        this.setupAdminTabs();
        this.applyAdminTabState('acreditados', false);
        window.CommercialQuotesModule?.init?.();
        this.updateStats();
        this.renderReportInsights();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupUI() {
        // Actualizar nombre de usuario desde tabla de usuarios
        const userNameEl = document.getElementById('adminUserName');
        if (userNameEl) {
            this.fetchAndDisplayUserName(userNameEl);
        }
    },

    async fetchAndDisplayUserName(userNameEl) {
        const currentUser = this.currentUser || {};
        const email = (currentUser.email || '').trim().toLowerCase();

        if (!email) {
            userNameEl.textContent = this.getAdminDisplayName();
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_user_nombre',
                    email: email
                })
            });

            const result = await response.json();
            
            if (result.ok && result.nombre) {
                userNameEl.textContent = result.nombre.trim();
            } else {
                userNameEl.textContent = this.getAdminDisplayName();
            }
        } catch (error) {
            console.error('Error fetching user name from table:', error);
            userNameEl.textContent = this.getAdminDisplayName();
        }
    },

    getAdminDisplayName() {
        const currentUser = this.currentUser || {};
        const storedName = (currentUser.name || '').trim();
        const storedEmail = (currentUser.email || '').trim().toLowerCase();

        if (storedName && storedName !== storedEmail) {
            return storedName;
        }

        if (storedEmail === 'admin@hightest.com') {
            return 'Administrador HIGH TEST';
        }

        if (storedEmail) {
            const localPart = storedEmail.split('@')[0] || '';
            const readableName = localPart
                .replace(/[._-]+/g, ' ')
                .trim()
                .replace(/\b\w/g, (character) => character.toUpperCase());

            return readableName || 'Administrador HIGH TEST';
        }

        return 'Administrador HIGH TEST';
    },

    loadMockData() {
        // Datos simulados de certificados
        this.certificates = [
            {
                id: 'R26 0001',
                client: 'Empresa 1 SAS',
                type: 'acreditado',
                status: 'recepcion',
                receptionDate: '2025-03-15',
                deliveryDate: '',
                finalizedDate: '',
                value: 2500000
            },
            {
                id: 'R26 0002',
                client: 'Empresa 2 Ltda',
                type: 'no-acreditado',
                status: 'lavado',
                receptionDate: '2025-03-10',
                deliveryDate: '',
                finalizedDate: '',
                value: 1800000
            },
            {
                id: 'R26 0003',
                client: 'Empresa 3 S.A.',
                type: 'acreditado',
                status: 'en-proceso-de-ensayo',
                receptionDate: '2025-03-08',
                deliveryDate: '',
                finalizedDate: '',
                value: 950000
            },
            {
                id: 'R26 0004',
                client: 'Cliente Demo',
                type: 'no-acreditado',
                status: 'finalizado',
                receptionDate: '2025-03-05',
                deliveryDate: '2025-03-12',
                finalizedDate: '2025-03-14',
                value: 1200000
            }
        ];
    },

    setupEventListeners() {
        // Logout (desktop)
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Logout desde menú móvil
        const mobileLogoutBtn = document.getElementById('adminLogoutMobileBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.logout();
                // Cerrar menú móvil si está abierto
                if (typeof MobileMenu !== 'undefined') {
                    MobileMenu.close();
                }
            });
        }

        // Búsqueda y filtros - ACREDITADOS
        const searchInput = document.getElementById('adminSearchCertificates');
        const statusFilter = document.getElementById('adminFilterStatus');
        const typeFilter = document.getElementById('adminFilterType');
        const monthFilter = document.getElementById('adminFilterMonth');
        const dateFilter = document.getElementById('adminFilterDate');
        const finalizedSearchInput = document.getElementById('adminSearchFinalizedCertificates');
        const finalizedStatusFilter = document.getElementById('adminFilterFinalizedStatus');
        const finalizedTypeFilter = document.getElementById('adminFilterFinalizedType');
        const finalizedMonthFilter = document.getElementById('adminFilterFinalizedMonth');
        const finalizedDateFilter = document.getElementById('adminFilterFinalizedDate');
        const statsMonthFilter = document.getElementById('statsMonthFilter');
        const clearStatsMonthFilter = document.getElementById('clearStatsMonthFilter');

        if (searchInput) {
            searchInput.addEventListener('input', debouncedLoadProcesos);
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', debouncedLoadProcesos);
        }
        if (typeFilter) {
            typeFilter.addEventListener('input', debouncedLoadProcesos);
        }
        if (monthFilter) {
            monthFilter.addEventListener('change', debouncedLoadProcesos);
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', debouncedLoadProcesos);
        }
        if (finalizedSearchInput) {
            finalizedSearchInput.addEventListener('input', debouncedLoadProcesos);
        }
        if (finalizedStatusFilter) {
            finalizedStatusFilter.addEventListener('change', debouncedLoadProcesos);
        }
        if (finalizedTypeFilter) {
            finalizedTypeFilter.addEventListener('input', debouncedLoadProcesos);
        }
        if (finalizedMonthFilter) {
            finalizedMonthFilter.addEventListener('change', debouncedLoadProcesos);
        }
        if (finalizedDateFilter) {
            finalizedDateFilter.addEventListener('change', debouncedLoadProcesos);
        }
        if (statsMonthFilter) {
            statsMonthFilter.addEventListener('change', () => {
                const month = statsMonthFilter.value || '';
                this.syncGlobalMonthFilters(month);
                filtrarProcesos();
                this.renderCertificatesNoAcreditados();
                this.updateStats();
                this.updateStatsNoAcreditados();
            });
        }
        if (clearStatsMonthFilter) {
            clearStatsMonthFilter.addEventListener('click', async () => {
                this.resetProcesoFilters();
                filtrarProcesos();
                this.renderCertificatesNoAcreditados();
                this.updateStats();
                this.updateStatsNoAcreditados();
            });
        }

        // Búsqueda y filtros - NO ACREDITADOS
        const searchInputNoAcreditados = document.getElementById('adminSearchCertificatesNoAcreditados');
        const statusFilterNoAcreditados = document.getElementById('adminFilterStatusNoAcreditados');
        const monthFilterNoAcreditados = document.getElementById('adminFilterMonthNoAcreditados');
        const dateFilterNoAcreditados = document.getElementById('adminFilterDateNoAcreditados');
        const finalizedSearchInputNoAcreditados = document.getElementById('adminSearchFinalizedCertificatesNoAcreditados');
        const finalizedStatusFilterNoAcreditados = document.getElementById('adminFilterFinalizedStatusNoAcreditados');
        const finalizedMonthFilterNoAcreditados = document.getElementById('adminFilterFinalizedMonthNoAcreditados');
        const finalizedDateFilterNoAcreditados = document.getElementById('adminFilterFinalizedDateNoAcreditados');
        const statsMonthFilterNoAcreditados = document.getElementById('statsMonthFilterNoAcreditados');
        const clearStatsMonthFilterNoAcreditados = document.getElementById('clearStatsMonthFilterNoAcreditados');

        if (searchInputNoAcreditados) {
            searchInputNoAcreditados.addEventListener('input', () => this.filterCertificatesNoAcreditados());
        }
        if (statusFilterNoAcreditados) {
            statusFilterNoAcreditados.addEventListener('change', () => this.filterCertificatesNoAcreditados());
        }
        if (monthFilterNoAcreditados) {
            monthFilterNoAcreditados.addEventListener('change', () => this.filterCertificatesNoAcreditados());
        }
        if (dateFilterNoAcreditados) {
            dateFilterNoAcreditados.addEventListener('change', () => this.filterCertificatesNoAcreditados());
        }
        if (finalizedSearchInputNoAcreditados) {
            finalizedSearchInputNoAcreditados.addEventListener('input', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (finalizedStatusFilterNoAcreditados) {
            finalizedStatusFilterNoAcreditados.addEventListener('change', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (finalizedMonthFilterNoAcreditados) {
            finalizedMonthFilterNoAcreditados.addEventListener('change', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (finalizedDateFilterNoAcreditados) {
            finalizedDateFilterNoAcreditados.addEventListener('change', () => this.filterFinalizedCertificatesNoAcreditados());
        }
        if (statsMonthFilterNoAcreditados) {
            statsMonthFilterNoAcreditados.addEventListener('change', () => this.updateStatsNoAcreditados());
        }
        if (clearStatsMonthFilterNoAcreditados) {
            clearStatsMonthFilterNoAcreditados.addEventListener('click', () => {
                if (statsMonthFilterNoAcreditados) {
                    statsMonthFilterNoAcreditados.value = '';
                }
                this.updateStatsNoAcreditados();
            });
        }

        // Nuevo certificado
        const addCertBtn = document.getElementById('addCertificateBtn');
        if (addCertBtn) {
            addCertBtn.addEventListener('click', () => this.addNewCertificate());
        }

        // Botón para agregar nuevo proceso no acreditado
        const addNoAcreditadoBtn = document.getElementById('addNoAcreditadoBtn');
        if (addNoAcreditadoBtn) {
            addNoAcreditadoBtn.addEventListener('click', () => {
                this.addNewCertificate();
                // Establecer tipo como no-acreditado después de abrir el modal
                setTimeout(() => {
                    const tipo = document.getElementById('processTipo');
                    if (tipo) tipo.value = 'no-acreditado';
                }, 100);
            });
        }

        const closeProcessModalBtn = document.getElementById('closeCertificateProcessModal');
        const cancelProcessModalBtn = document.getElementById('cancelCertificateProcessBtn');
        const saveProcessModalBtn = document.getElementById('saveCertificateProcessBtn');
        const processModal = document.getElementById('certificateProcessModal');
        const closeDuplicateProcessModalBtn = document.getElementById('closeDuplicateProcessModal');
        const duplicateProcessOkBtn = document.getElementById('duplicateProcessOkBtn');
        const duplicateProcessModal = document.getElementById('duplicateProcessModal');

        if (closeProcessModalBtn) {
            closeProcessModalBtn.addEventListener('click', () => this.closeCertificateProcessModal());
        }
        if (cancelProcessModalBtn) {
            cancelProcessModalBtn.addEventListener('click', () => this.closeCertificateProcessModal());
        }
        if (saveProcessModalBtn) {
            saveProcessModalBtn.addEventListener('click', () => this.saveCertificateProcessFromModal());
        }
        if (processModal) {
            processModal.addEventListener('click', (event) => {
                if (event.target === processModal) {
                    this.closeCertificateProcessModal();
                }
            });
        }
        if (closeDuplicateProcessModalBtn) {
            closeDuplicateProcessModalBtn.addEventListener('click', () => this.closeDuplicateProcessModal());
        }
        if (duplicateProcessOkBtn) {
            duplicateProcessOkBtn.addEventListener('click', () => this.closeDuplicateProcessModal());
        }
        if (duplicateProcessModal) {
            duplicateProcessModal.addEventListener('click', (event) => {
                if (event.target === duplicateProcessModal) {
                    this.closeDuplicateProcessModal();
                }
            });
        }

        const closeStatusModalBtn = document.getElementById('closeCertificateStatusModal');
        const cancelStatusModalBtn = document.getElementById('cancelCertificateStatusBtn');
        const saveStatusModalBtn = document.getElementById('saveCertificateStatusBtn');
        const statusModal = document.getElementById('certificateStatusModal');

        if (closeStatusModalBtn) {
            closeStatusModalBtn.addEventListener('click', () => this.closeCertificateStatusModal());
        }
        if (cancelStatusModalBtn) {
            cancelStatusModalBtn.addEventListener('click', () => this.closeCertificateStatusModal());
        }
        if (saveStatusModalBtn) {
            saveStatusModalBtn.addEventListener('click', () => this.saveCertificateStatusFromModal());
        }
        if (statusModal) {
            statusModal.addEventListener('click', (event) => {
                if (event.target === statusModal) {
                    this.closeCertificateStatusModal();
                }
            });
        }

        // renderCertificates() se omite para permitir que la carga desde `procesos_acreditados` controle la tabla
    },

    setupAdminTabs() {
        const tabButtons = document.querySelectorAll('[data-admin-tab]');
        tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                this.applyAdminTabState(button.dataset.adminTab || 'acreditados');
            });
        });
    },

    applyAdminTabState(tabName, shouldScroll = true) {
        this.currentViewTab = tabName;

        const tabButtons = document.querySelectorAll('[data-admin-tab]');
        tabButtons.forEach((button) => {
            const isActive = button.dataset.adminTab === tabName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Obtener referencias a todas las secciones
        const certificatesSection = document.getElementById('certificates');
        const certificatesNoAcreditadosSection = document.getElementById('certificates-no-acreditados');
        const clientsSection = document.getElementById('clients');
        const commercialSection = document.getElementById('gestion-comercial');
        const statsSection = document.querySelector('.admin-stats-wrapper');
        const quickLinkSection = document.querySelector('.admin-quick-link');
        const reportsAcreditadosSection = document.getElementById('reports-acreditados');
        const reportsNoAcreditadosSection = document.getElementById('reports-no-acreditados');
        const gestionInformesSection = document.getElementById('gestion-informes');

        // Ocultar todas las secciones por defecto (excepto las que ahora están dentro de views)
        certificatesSection?.classList.add('is-hidden');
        certificatesNoAcreditadosSection?.classList.add('is-hidden');
        commercialSection?.classList.add('is-hidden');
        reportsAcreditadosSection?.classList.add('is-hidden');
        reportsNoAcreditadosSection?.classList.add('is-hidden');
        quickLinkSection?.classList.add('is-hidden');

        if (commercialSection) {
            commercialSection.hidden = true;
        }

        // Mostrar solo lo necesario según la pestaña
        if (tabName === 'acreditados') {
            quickLinkSection?.classList.remove('is-hidden');
            reportsAcreditadosSection?.classList.remove('is-hidden');
            certificatesSection?.classList.remove('is-hidden');
            if (gestionInformesSection) gestionInformesSection.style.display = '';
            if (shouldScroll) {
                quickLinkSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            filtrarProcesos();
            GestionInformesModule.init();
            this.renderMonthlySummary();
        } else if (tabName === 'no-acreditados') {
            quickLinkSection?.classList.remove('is-hidden');
            reportsNoAcreditadosSection?.classList.remove('is-hidden');
            certificatesNoAcreditadosSection?.classList.remove('is-hidden');
            if (shouldScroll) {
                quickLinkSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            filtrarProcesos();
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
            this.renderMonthlySummaryNoAcreditados();
        } else if (tabName === 'clientes') {
            clientsSection?.classList.remove('is-hidden');
            if (shouldScroll) {
                clientsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else if (tabName === 'gestion-comercial') {
            commercialSection?.classList.remove('is-hidden');
            if (commercialSection) {
                commercialSection.hidden = false;
            }
            if (shouldScroll) {
                commercialSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            window.CommercialQuotesModule?.loadData?.().then(() => {
                window.CommercialQuotesModule?.render?.();
            });
        }
    },

    renderCertificates() {
        this.filterCertificates();
        this.filterFinalizedCertificates();
    },

    filterCertificates() {
        const searchTerm = document.getElementById('adminSearchCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterStatus')?.value || '';
        const clientFilter = document.getElementById('adminFilterType')?.value.toLowerCase() || '';
        const dateFilter = document.getElementById('adminFilterDate')?.value || '';
        const monthFilter = document.getElementById('adminFilterMonth')?.value || '';
        const tabType = this.currentCertificateTypeTab || '';

        const filtered = this.certificates.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm) ||
                this.getTypeText(cert.type).toLowerCase().includes(searchTerm);

            const matchesTabType = !tabType || cert.type === tabType;
            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesClient = !clientFilter || cert.client.toLowerCase().includes(clientFilter);
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesSearch && matchesTabType && matchesStatus && matchesClient && matchesDate && matchesMonth;
        });

        this.renderFilteredCertificates(filtered);
    },

    filterFinalizedCertificates() {
        const searchTerm = document.getElementById('adminSearchFinalizedCertificates')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterFinalizedStatus')?.value || '';
        const clientFilter = document.getElementById('adminFilterFinalizedType')?.value.toLowerCase() || '';
        const dateFilter = document.getElementById('adminFilterFinalizedDate')?.value || '';
        const monthFilter = document.getElementById('adminFilterFinalizedMonth')?.value || '';
        const tabType = this.currentCertificateTypeTab || '';

        const finalized = this.certificates.filter(cert => cert.status === 'finalizado');

        const filtered = finalized.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm) ||
                this.getTypeText(cert.type).toLowerCase().includes(searchTerm);

            const matchesTabType = !tabType || cert.type === tabType;
            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesClient = !clientFilter || cert.client.toLowerCase().includes(clientFilter);
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesSearch && matchesTabType && matchesStatus && matchesClient && matchesDate && matchesMonth;
        });

        this.renderFinalizedCertificates(filtered);
    },

    renderFilteredCertificates(filteredCerts) {
        const activeTbody = document.getElementById('certificatesTableBody');
        if (!activeTbody) return;

        activeTbody.innerHTML = '';

        const activeCerts = filteredCerts.filter(cert => cert.status !== 'finalizado');

        if (!activeCerts.length) {
            activeTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes activos</td></tr>';
        }

        activeCerts.forEach(cert => {
            activeTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    renderFinalizedCertificates(filteredCerts) {
        const finalizedTbody = document.getElementById('finalizedCertificatesTableBody');
        if (!finalizedTbody) return;

        finalizedTbody.innerHTML = '';

        if (!filteredCerts.length) {
            finalizedTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes finalizados</td></tr>';
            return;
        }

        filteredCerts.forEach(cert => {
            finalizedTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    buildCertificateRow(cert) {
        const row = document.createElement('tr');

        const statusKey = normalizeStatusKey(cert.status);
        const statusClass = `status--${statusKey || cert.status}`;
        const statusText = this.getStatusText(statusKey || cert.status);
        const typeText = this.getTypeText(cert.type);

        row.innerHTML = `
            <td>${cert.id}</td>
            <td>${cert.client}</td>
            <td>${typeText}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
                <button type="button" class="btn btn--small btn--outline change-status-btn" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem;" data-id="${cert.id}" title="Editar estado">✏️</button>
            </td>
            <td>${this.formatDate(cert.receptionDate)}</td>
            <td>${this.formatDate(cert.deliveryDate)}</td>
            <td>${this.formatDate(cert.finalizedDate)}</td>
            <td>
                <button type="button" class="btn btn--small btn--outline" style="padding: 0.25rem 0.5rem;" onclick="AdminPanelManager.editCertificate('${cert.id}')" title="Editar proceso">✏️</button>
                <button type="button" class="btn btn--small btn--error" style="padding: 0.25rem 0.5rem;" onclick="AdminPanelManager.deleteCertificate('${cert.id}')" title="Eliminar">🗑️</button>
            </td>
        `;

        return row;
    },

    getCertificateStatusOptions(currentStatus) {
        const statuses = [
            'recepcion',
            'lavado',
            'en-proceso-de-ensayo',
            'entrega-cliente',
            'informe-de-ensayo',
            'finalizado'
        ];

        return statuses.map((status) => {
            const selected = status === currentStatus ? 'selected' : '';
            return `<option value="${status}" ${selected}>${this.getStatusText(status)}</option>`;
        }).join('');
    },

    changeCertificateStatus(certId, newStatus) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        cert.status = newStatus;

        if (!cert.receptionDate) {
            cert.receptionDate = this.getTodayISO();
        }

        if (newStatus === 'entrega-cliente' && !cert.deliveryDate) {
            cert.deliveryDate = this.getTodayISO();
        }

        if (newStatus === 'finalizado' && !cert.finalizedDate) {
            cert.finalizedDate = this.getTodayISO();
        }

        // Renderizar correctamente según el tipo de certificado
        if (cert.type === 'acreditado') {
            this.renderCertificates();
            this.updateStats();
        } else if (cert.type === 'no-acreditado') {
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
        }
    },

    editCertificate(certId) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        this.populateCertificateClientOptions(cert.client);

        const title = document.getElementById('certificateProcessModalTitle');
        const editId = document.getElementById('processEditId');
        const tipo = document.getElementById('processTipo');
        const processNumber = document.getElementById('processNumber');
        const client = document.getElementById('processClientSelect');
        const nInforme = document.getElementById('processNInforme');
        const status = document.getElementById('processStatusSelect');
        const receptionDate = document.getElementById('processReceptionDate');
        const deliveryDate = document.getElementById('processDeliveryDate');
        const finalizedDate = document.getElementById('processFinalizedDate');

        if (!title || !editId || !processNumber || !client || !nInforme || !status || !receptionDate || !deliveryDate || !finalizedDate) return;

        title.textContent = `Editar Proceso ${cert.id}`;
        editId.value = cert.id;
        processNumber.value = cert.id;
        client.value = cert.client;
        if (tipo) tipo.value = cert.type || 'acreditado';
        nInforme.value = normalizeInformeNumber(cert.n_informe || '');
        status.value = cert.status;
        receptionDate.value = cert.receptionDate || '';
        deliveryDate.value = cert.deliveryDate || '';
        finalizedDate.value = cert.finalizedDate || '';

        this.openCertificateProcessModal();
    },

    async editCertificateStatus(certId) {
        const editId = document.getElementById('statusEditId');
        const processCode = document.getElementById('statusProcessCode');
        const status = document.getElementById('statusProcessSelect');
        if (!editId || !processCode || !status) return;

        try {
            const response = await fetchFromDatabase('get_proceso', { numero_proceso: certId });
            const cert = response?.ok ? response.proceso : null;
            editId.value = cert?.numero_proceso || certId;
            processCode.value = cert ? `${cert.numero_proceso || certId} - ${cert.cliente || ''}`.trim() : certId;
            status.value = normalizeStatusKey(cert?.estado) || 'recepcion';
            this.openCertificateStatusModal();
        } catch (err) {
            console.error('Error cargando proceso para editar estado', err);
            editId.value = certId;
            processCode.value = certId;
            status.value = 'recepcion';
            this.openCertificateStatusModal();
        }
    },

    deleteCertificate(certId) {
        const cert = this.certificates.find((item) => item.id === certId);
        if (!cert) return;

        if (!confirm(`¿Eliminar el informe ${cert.id} de ${cert.client}?`)) {
            return;
        }

        this.certificates = this.certificates.filter((item) => item.id !== certId);
        // Renderizar correctamente según el tipo de certificado eliminado
        if (cert.type === 'acreditado') {
            this.renderCertificates();
            this.updateStats();
        } else if (cert.type === 'no-acreditado') {
            this.renderCertificatesNoAcreditados();
            this.updateStatsNoAcreditados();
        }
    },

    updateStats() {
        const statsMonthFilter = document.getElementById('statsMonthFilter');
        const statsPeriodLabel = document.getElementById('statsPeriodLabel');
        const monthFilter = statsMonthFilter?.value || '';
        const tableBodyIds = ['certificatesTableBody', 'finalizedCertificatesTableBody'];
        const scopedRows = [];

        tableBodyIds.forEach((tbodyId) => {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;

            Array.from(tbody.querySelectorAll('tr')).forEach((row) => {
                if (row.classList.contains('empty-state') || !row.cells || row.cells.length < 7) return;

                if (monthFilter) {
                    const dateValues = [row.cells[4]?.textContent || '', row.cells[5]?.textContent || '', row.cells[6]?.textContent || '']
                        .map((value) => String(value).trim())
                        .filter((value) => value && value !== '-');
                    const matchesMonth = dateValues.some((value) => value.startsWith(monthFilter));
                    if (!matchesMonth) return;
                }

                scopedRows.push(row);
            });
        });

        const total = scopedRows.length;
        const completed = scopedRows.filter((row) => (row.cells[3]?.textContent || '').toLowerCase().includes('finalizado')).length;
        const pending = total - completed;

        const totalEl = document.getElementById('statTotalCerts');
        const completedEl = document.getElementById('statCompletedCerts');
        const pendingEl = document.getElementById('statPendingCerts');

        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;

        if (statsPeriodLabel) {
            statsPeriodLabel.textContent = monthFilter
                ? `Mostrando resumen de ${monthFilter}`
                : 'Mostrando totales generales';
        }

        this.renderReportInsights();
    },

    resetProcesoFilters() {
        const filterStatus = document.getElementById('adminFilterStatus');
        const filterType = document.getElementById('adminFilterType');
        const filterMonth = document.getElementById('adminFilterMonth');
        const filterDate = document.getElementById('adminFilterDate');
        const searchInput = document.getElementById('adminSearchCertificates');
        const finalizedFilterStatus = document.getElementById('adminFilterFinalizedStatus');
        const finalizedFilterType = document.getElementById('adminFilterFinalizedType');
        const finalizedFilterMonth = document.getElementById('adminFilterFinalizedMonth');
        const finalizedFilterDate = document.getElementById('adminFilterFinalizedDate');
        const searchFinalizedInput = document.getElementById('adminSearchFinalizedCertificates');
        const filterMonthNoAcreditados = document.getElementById('adminFilterMonthNoAcreditados');
        const finalizedFilterMonthNoAcreditados = document.getElementById('adminFilterFinalizedMonthNoAcreditados');
        const searchInputNoAcreditados = document.getElementById('adminSearchCertificatesNoAcreditados');
        const searchFinalizedInputNoAcreditados = document.getElementById('adminSearchFinalizedCertificatesNoAcreditados');
        const statsMonthFilter = document.getElementById('statsMonthFilter');
        const statsMonthFilterNoAcreditados = document.getElementById('statsMonthFilterNoAcreditados');

        if (filterStatus) filterStatus.value = '';
        if (filterType) filterType.value = '';
        if (filterMonth) filterMonth.value = '';
        if (filterDate) filterDate.value = '';
        if (searchInput) searchInput.value = '';
        if (finalizedFilterStatus) finalizedFilterStatus.value = '';
        if (finalizedFilterType) finalizedFilterType.value = '';
        if (finalizedFilterMonth) finalizedFilterMonth.value = '';
        if (finalizedFilterDate) finalizedFilterDate.value = '';
        if (searchFinalizedInput) searchFinalizedInput.value = '';
        if (filterMonthNoAcreditados) filterMonthNoAcreditados.value = '';
        if (finalizedFilterMonthNoAcreditados) finalizedFilterMonthNoAcreditados.value = '';
        if (searchInputNoAcreditados) searchInputNoAcreditados.value = '';
        if (searchFinalizedInputNoAcreditados) searchFinalizedInputNoAcreditados.value = '';
        if (statsMonthFilter) statsMonthFilter.value = '';
        if (statsMonthFilterNoAcreditados) statsMonthFilterNoAcreditados.value = '';
    },

    renderReportInsights() {
        this.renderMonthlySummary();
        this.renderMonthlySummaryNoAcreditados();
        this.renderKanbanBoard();
    },

    renderMonthlySummary() {
        this.renderMonthlySummaryByType('monthlySummaryListAcreditados');
    },

    renderMonthlySummaryNoAcreditados() {
        this.renderMonthlySummaryByType('monthlySummaryListNoAcreditados');
    },

    renderMonthlySummaryByType(containerId, emptyMessage = 'No hay datos suficientes para mostrar resumen por mes.') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const monthNames = {
            '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio',
            '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };
        const monthsMap = new Map();

        const isAcreditado = containerId === 'monthlySummaryListAcreditados';

        let allRows = [];
        if (isAcreditado) {
            allRows = [...(PROCESOS_STORE.filtered.active || []), ...(PROCESOS_STORE.filtered.finalized || [])];
        } else {
            allRows = (this.certificates || []).filter(c => c.type === 'no-acreditado');
        }

        allRows.forEach(row => {
            let dateBase = '';
            let estado = '';
            if (isAcreditado) {
                dateBase = row.fecha_recepcion || '';
                estado = (row.estado || '').toLowerCase();
            } else {
                dateBase = row.deliveryDate || row.receptionDate || '';
                estado = (row.status || '').toLowerCase();
            }
            if (!dateBase || !/^\d{4}-\d{2}/.test(dateBase)) return;

            const monthKey = dateBase.slice(0, 7);
            if (!monthsMap.has(monthKey)) {
                monthsMap.set(monthKey, { total: 0, completed: 0, pending: 0 });
            }

            const bucket = monthsMap.get(monthKey);
            bucket.total += 1;
            if (estado === 'finalizado') {
                bucket.completed += 1;
            } else {
                bucket.pending += 1;
            }
        });

        const entries = Array.from(monthsMap.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6);

        if (!entries.length) {
            container.innerHTML = `<div class="monthly-summary-item">${emptyMessage}</div>`;
            return;
        }

        const maxTotal = Math.max(...entries.map(([, data]) => data.total), 1);
        container.innerHTML = entries.map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-');
            const label = `${monthNames[month] || month} ${year}`;
            const percent = Math.max(8, Math.round((data.total / maxTotal) * 100));

            return `
                <div class="monthly-summary-item">
                    <div class="monthly-summary-item__top">
                        <div class="monthly-summary-item__month">${label}</div>
                        <div class="monthly-summary-item__count">${data.total}</div>
                    </div>
                    <div class="monthly-summary-item__bar">
                        <div class="monthly-summary-item__bar-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="monthly-summary-item__meta">
                        <span>Finalizados: ${data.completed}</span>
                        <span>Pendientes: ${data.pending}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderKanbanBoard() {
        const container = document.getElementById('kanbanBoard');
        if (!container) return;
        const tabType = this.currentCertificateTypeTab || '';

        const columns = [
            { key: 'recepcion', title: 'Recepción' },
            { key: 'lavado', title: 'Lavado' },
            { key: 'en-proceso-de-ensayo', title: 'En proceso' },
            { key: 'entrega-cliente', title: 'Entrega cliente' },
            { key: 'informe-de-ensayo', title: 'Informe' },
            { key: 'finalizado', title: 'Finalizado' }
        ];

        container.innerHTML = columns.map((column) => {
            const items = this.certificates.filter((cert) => cert.status === column.key && (!tabType || cert.type === tabType));
            return `
                <div class="kanban-column">
                    <div class="kanban-column__header">
                        <div class="kanban-column__title">${column.title}</div>
                        <div class="kanban-column__count">${items.length}</div>
                    </div>
                    <div class="kanban-cards">
                        ${items.length ? items.map((cert) => `
                            <div class="kanban-card">
                                <div class="kanban-card__id">${cert.id}</div>
                                <div class="kanban-card__client">${cert.client}</div>
                                <div class="kanban-card__meta">
                                    <span>${this.getTypeText(cert.type)}</span>
                                    <span>${this.formatDate(cert.receptionDate)}</span>
                                </div>
                            </div>
                        `).join('') : '<div class="kanban-card"><div class="kanban-card__client">Sin procesos</div></div>'}
                    </div>
                </div>
            `;
        }).join('');
    },

    getStatusText(status) {
        const statusMap = {
            'recepcion': 'Recepción',
            'lavado': 'Lavado',
            'en-proceso-de-ensayo': 'Proceso de ensayo',
            'entrega-cliente': 'Entrega cliente',
            'informe-de-ensayo': 'Informe',
            'finalizado': 'Finalizado'
        };
        const key = normalizeStatusKey(status);
        return statusMap[key] || status;
    },

    getTypeText(type) {
        const typeMap = {
            'acreditado': 'Acreditado',
			'no-acreditado': 'No acreditado'
        };
        return typeMap[type] || type;
    },

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toISOString().split('T')[0];
    },

    getTodayISO() {
        return new Date().toISOString().split('T')[0];
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    },

    viewCertificate(certId) {
        alert(`Viendo detalles del certificado ${certId}`);
    },

    downloadCertificate(certId) {
        alert(`Descargando certificado ${certId}...`);
    },

    addNewCertificate() {
        const title = document.getElementById('certificateProcessModalTitle');
        const editId = document.getElementById('processEditId');
        const tipo = document.getElementById('processTipo');
        const processNumber = document.getElementById('processNumber');
        const client = document.getElementById('processClientSelect');
        const nInforme = document.getElementById('processNInforme');
        const informeANombre = document.getElementById('processInformeANombreDe');
        const status = document.getElementById('processStatusSelect');
        const receptionDate = document.getElementById('processReceptionDate');
        const deliveryDate = document.getElementById('processDeliveryDate');
        const finalizedDate = document.getElementById('processFinalizedDate');

        if (!title || !editId || !processNumber || !client || !nInforme || !status || !receptionDate || !deliveryDate || !finalizedDate) return;

        this.populateCertificateClientOptions('');

        title.textContent = 'Nuevo Proceso';
        editId.value = '';
        if (tipo) tipo.value = 'acreditado';
        processNumber.value = '';
        client.value = '';
        nInforme.value = '';
        if (informeANombre) informeANombre.value = '';
        status.value = 'recepcion';
        receptionDate.value = this.getTodayISO();
        deliveryDate.value = '';
        finalizedDate.value = '';

        this.openCertificateProcessModal();
    },

    async saveCertificateProcessFromModal() {
        const editId = document.getElementById('processEditId');
        const processNumber = document.getElementById('processNumber');
        const client = document.getElementById('processClientSelect');
        const nInforme = document.getElementById('processNInforme');
        const informeANombre = document.getElementById('processInformeANombreDe');
        const status = document.getElementById('processStatusSelect');
        const receptionDate = document.getElementById('processReceptionDate');
        const deliveryDate = document.getElementById('processDeliveryDate');
        const finalizedDate = document.getElementById('processFinalizedDate');

        if (!processNumber || !client || !status || !receptionDate) return;

        const numero = editId?.value || processNumber.value;
        const isEdit = Boolean(editId && editId.value);

        const normalizedNumero = String(processNumber.value || '').trim();
        if (!normalizedNumero) return;

        const allProcesos = Array.isArray(PROCESOS_STORE.all) ? PROCESOS_STORE.all : [];
        const duplicateProcess = Array.isArray(allProcesos)
            ? allProcesos.find((row) => {
                const existingNumero = String(row.numero_proceso || row.proceso_numero || row.numero || row.id || row.proceso || row.nro_proceso || '').trim();
                if (!existingNumero) return false;
                if (isEdit && existingNumero === String(numero).trim()) return false;
                return existingNumero.toLowerCase() === normalizedNumero.toLowerCase();
            })
            : null;

        if (duplicateProcess) {
            this.openDuplicateProcessModal(normalizedNumero);
            return;
        }
        
        // Validar que el número de proceso no exista ya (para nuevos procesos)
        const insertData = {
            numero_proceso: processNumber.value,
            cliente: client.value,
            estado: status.value,
            fecha_recepcion: receptionDate.value || null,
            fecha_entrega_cliente: deliveryDate?.value || null,
            fecha_finalizado: finalizedDate?.value || null,
        };

        // Solo agregar campos opcionales si tienen valor
        const informeValue = (nInforme?.value || '').trim();
        if (informeValue) insertData.n_informe = informeValue;

        const informeANombreValue = (informeANombre?.value || '').trim();
        if (informeANombreValue) insertData.informe_a_nombre_de = informeANombreValue;

        try {
            let res;
            if (editId && editId.value) {
                res = await fetchFromDatabase('update_proceso', {
                    numero_proceso: numero,
                    numero_proceso_nuevo: processNumber.value,
                    cliente: client.value,
                    estado: status.value,
                    fecha_recepcion: receptionDate.value || null,
                    fecha_entrega_cliente: deliveryDate?.value || null,
                    fecha_finalizado: finalizedDate?.value || null,
                    ...(informeValue ? { n_informe: informeValue } : {}),
                    ...(informeANombreValue ? { informe_a_nombre_de: informeANombreValue } : {})
                });
                if (!res.ok) throw new Error(res.error || 'Error al actualizar proceso');
                Toast.show({ title: 'Actualizado', message: `Proceso ${numero} actualizado`, variant: 'success' });
            } else {
                res = await fetchFromDatabase('add_proceso', { insert: insertData });
                if (!res.ok) throw new Error(res.error || 'Error al crear proceso');
                Toast.show({ title: 'Creado', message: `Proceso ${insertData.numero_proceso} creado`, variant: 'success' });
            }

            this.closeCertificateProcessModal();
            if (res.proceso && typeof window.__actualizarProcesoEnCache === 'function') {
                window.__actualizarProcesoEnCache(res.proceso);
            }
            await cargarProcesos();
        } catch (err) {
            console.error('Error guardando proceso en servidor', err);
            Toast.show({ title: 'Error', message: err.message || 'No se pudo guardar', variant: 'error' });
        }
    },

    async saveCertificateStatusFromModal() {
        const editId = document.getElementById('statusEditId');
        const status = document.getElementById('statusProcessSelect');
        if (!editId || !status || !editId.value) return;

        try {
            const response = await fetchFromDatabase('update_proceso_status', {
                numero_proceso: editId.value,
                estado: status.value,
            });

            if (!response.ok) {
                throw new Error(response.error || 'No se pudo actualizar el estado');
            }

            Toast.show({
                title: 'Actualizado',
                message: 'Estado actualizado correctamente',
                variant: 'success'
            });

            this.closeCertificateStatusModal();
            if (response.proceso && typeof window.__actualizarProcesoEnCache === 'function') {
                window.__actualizarProcesoEnCache(response.proceso);
            }
            await cargarProcesos();
        } catch (err) {
            console.error('Error actualizando estado desde modal', err);
            Toast.show({
                title: 'Error',
                message: err.message || 'No se pudo actualizar el estado',
                variant: 'error'
            });
        }
    },

    openCertificateProcessModal() {
        const modal = document.getElementById('certificateProcessModal');
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeCertificateProcessModal() {
        const modal = document.getElementById('certificateProcessModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    openCertificateStatusModal() {
        const modal = document.getElementById('certificateStatusModal');
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeCertificateStatusModal() {
        const modal = document.getElementById('certificateStatusModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    openDuplicateProcessModal(processNumber) {
        const modal = document.getElementById('duplicateProcessModal');
        const message = document.getElementById('duplicateProcessModalMessage');
        if (!modal) return;
        if (message) {
            message.textContent = `El proceso ${processNumber} ya existe en la tabla. Usa otro número para continuar.`;
        }
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeDuplicateProcessModal() {
        const modal = document.getElementById('duplicateProcessModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    populateCertificateClientOptions(selectedValue) {
        const select = document.getElementById('processClientSelect');
        if (!select) return;

        const clients = this.clientsCatalog || [];
        const normalized = new Set();
        const uniqueClients = [];
        clients.forEach((item) => {
            const name = (item && item.nombre_empresa ? String(item.nombre_empresa).trim() : '');
            if (!name) return;
            const key = name.toUpperCase();
            if (normalized.has(key)) return;
            normalized.add(key);
            uniqueClients.push(name);
        });

        select.innerHTML = '<option value="">Seleccione un cliente</option>';
        uniqueClients.forEach((name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        if (selectedValue) {
            const hasOption = Array.from(select.options).some((option) => option.value === selectedValue);
            if (!hasOption) {
                const customOption = document.createElement('option');
                customOption.value = selectedValue;
                customOption.textContent = selectedValue;
                select.appendChild(customOption);
            }
            select.value = selectedValue;
        }
    },

    generateProcessId() {
        const lastId = this.certificates[0]?.id || 'R26 0000';
        const match = lastId.match(/R26 (\d{4})/);
        const lastNum = match ? parseInt(match[1], 10) : 0;
        const nextNum = String(lastNum + 1).padStart(4, '0');
        return `R26 ${nextNum}`;
    },

    // ===========================
    // GESTIÓN DE CLIENTES
    // ===========================

    setupClientsManagement() {
        const addClientBtn = document.getElementById('addClientBtn');
        const closeClientModalBtn = document.getElementById('closeClientModal');
        const cancelClientModalBtn = document.getElementById('cancelClientModalBtn');
        const saveClientModalBtn = document.getElementById('saveClientModalBtn');
        const clientModal = document.getElementById('clientModal');
        const clientModalTitle = document.getElementById('clientModalTitle');
        const clientEditId = document.getElementById('clientEditId');
        const clientForm = document.getElementById('clientForm');
        const searchInput = document.getElementById('clientSearchInput');

        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                if (clientModalTitle) clientModalTitle.textContent = 'Nuevo Cliente';
                if (clientEditId) clientEditId.value = '';
                if (clientForm) clientForm.reset();
                this.openClientModal();
            });
        }

        if (closeClientModalBtn) {
            closeClientModalBtn.addEventListener('click', () => this.closeClientModal());
        }

        if (cancelClientModalBtn) {
            cancelClientModalBtn.addEventListener('click', () => this.closeClientModal());
        }

        if (saveClientModalBtn) {
            saveClientModalBtn.addEventListener('click', async () => {
                await this.saveClient();
            });
        }

        if (clientModal) {
            clientModal.addEventListener('click', (event) => {
                if (event.target === clientModal) {
                    this.closeClientModal();
                }
            });
        }

        if (clientForm) {
            clientForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveClient();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterClientesTable(searchInput.value.toLowerCase());
            });
        }

        this.loadClientes();
    },

    async loadClientes() {
        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_clientes' })
            });

            const result = await response.json();
            
            if (result.ok && result.clientes) {
                this.clientsCatalog = result.clientes;
                this.populateCertificateClientOptions('');
                this.renderClientesTable(result.clientes);
            } else {
                console.error('❌ Error en respuesta:', result);
            }
        } catch (error) {
            console.error('❌ Error loading clientes:', error);
        }
    },

    renderClientesTable(clientes) {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        if (!Array.isArray(clientes) || clientes.length === 0) {
            tbody.innerHTML = '<tr class="empty-state"><td colspan="9" style="text-align: center; padding: 2rem;">ℹ️ No hay clientes registrados</td></tr>';
            return;
        }

        const escapeHtml = (s) => {
            if (s === null || s === undefined) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        tbody.innerHTML = clientes.map((cliente, idx) => {
            const createdRaw = cliente.created_at || cliente.createdAt || '';
            let fecha = '';
            try {
                if (createdRaw) {
                    if (typeof createdRaw === 'string' && createdRaw.includes('T')) {
                        fecha = createdRaw.split('T')[0];
                    } else {
                        fecha = new Date(createdRaw).toISOString().split('T')[0];
                    }
                }
            } catch (e) {
                fecha = '';
            }

            const nombreEsc = escapeHtml(cliente.nombre_empresa);
            const nitEsc = escapeHtml(
                cliente.nit ||
                cliente.nit_empresa ||
                cliente.numero_nit ||
                cliente.identificacion_tributaria ||
                ''
            );
            const emailEsc = escapeHtml(cliente.email);
            const pwd = cliente.password ? String(cliente.password) : '';
            const pwdEsc = escapeHtml(pwd);
            const idEsc = escapeHtml(cliente.id);
            const telEsc = escapeHtml(cliente.telefono || cliente.phone || '');
            const dirEsc = escapeHtml(cliente.direccion || cliente.address || '');
            const contactEsc = escapeHtml(cliente.contacto_principal || cliente.contacto || '');

            // Escapes para pasar en onclick (single-quoted)
            const escForOnclick = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

            return `
            <tr style="font-size: 12px;">
                <td style="padding: 5px 6px;"><strong style="font-size: 11px;">${nombreEsc}</strong></td>
                <td style="padding: 5px 6px; min-width: 110px;">${nitEsc || '-'}</td>
                <td style="padding: 5px 6px; word-break: break-word;">${emailEsc}</td>
                <td style="padding: 5px 6px;">
                    <div class="password-cell">
                        <span class="password-mask" data-password="${pwdEsc}" style="font-size: 11px;">${pwd ? '*'.repeat(Math.max(4, pwd.length)) : ''}</span>
                        <button type="button" class="password-toggle-small" onclick="AdminPanelManager.toggleTablePasswordVisibility(this)" title="Ver contraseña" style="font-size: 10px;">👁️</button>
                    </div>
                </td>
                <td style="padding: 5px 6px; white-space: nowrap;">${telEsc || '-'}</td>
                <td style="padding: 5px 6px; word-break: break-word;">${dirEsc || '-'}</td>
                <td style="padding: 5px 6px; word-break: break-word;">${contactEsc || '-'}</td>
                <td style="padding: 5px 6px; white-space: nowrap; font-size: 11px;">${fecha}</td>
                <td style="padding: 5px 6px;">
                    <div class="action-buttons" style="gap: 3px;">
                        <button class="btn btn--small btn--outline" onclick="AdminPanelManager.editCliente('${escForOnclick(idEsc)}', '${escForOnclick(cliente.nombre_empresa)}', '${escForOnclick(nitEsc)}', '${escForOnclick(cliente.email)}', '${escForOnclick(pwd)}', '${escForOnclick(cliente.telefono || '')}', '${escForOnclick(cliente.direccion || '')}', '${escForOnclick(cliente.contacto_principal || '')}')" style="padding: 3px 6px; font-size: 11px;">✏️</button>
                        <button class="btn btn--small btn--error" onclick="AdminPanelManager.deleteCliente('${escForOnclick(idEsc)}', '${escForOnclick(cliente.nombre_empresa)}')" style="padding: 3px 6px; font-size: 11px;">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
        }).join('');
    },

    filterClientesTable(searchTerm) {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.classList.contains('empty-state'));
        let visibleCount = 0;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let matches = false;

            // Buscar en todas las celdas (empresa, email, contraseña, fecha)
            cells.forEach(cell => {
                const text = cell.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    matches = true;
                }
            });

            if (searchTerm === '' || matches) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Mostrar/ocultar mensaje de no hay resultados
        let emptyRow = tbody.querySelector('.empty-state');
        if (visibleCount === 0 && searchTerm !== '') {
            if (!emptyRow) {
                emptyRow = document.createElement('tr');
                emptyRow.className = 'empty-state';
                emptyRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 2rem;">❌ No se encontraron clientes que coincidan con la búsqueda</td>';
                tbody.appendChild(emptyRow);
            } else {
                emptyRow.style.display = '';
                emptyRow.querySelector('td').textContent = '❌ No se encontraron clientes que coincidan con la búsqueda';
            }
        } else if (visibleCount === 0 && searchTerm === '') {
            if (emptyRow) {
                emptyRow.style.display = '';
                emptyRow.querySelector('td').textContent = 'ℹ️ No hay clientes registrados';
            }
        } else if (emptyRow) {
            emptyRow.style.display = 'none';
        }
    },

    async saveClient() {
        const editId = document.getElementById('clientEditId')?.value || '';
        let nombre = document.getElementById('clientNombre').value.trim().toUpperCase();
        const nit = document.getElementById('clientNit')?.value.trim();
        let email = document.getElementById('clientEmail').value.trim().toLowerCase();
        const password = document.getElementById('clientPassword').value;
        const telefono = document.getElementById('clientTelefono')?.value.trim() || '';
        const direccion = document.getElementById('clientDireccion')?.value.trim() || '';
        const contacto = document.getElementById('clientContacto')?.value.trim() || '';

        if (!nombre || !nit || !email || !password) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            const action = editId ? 'update_cliente' : 'add_cliente';
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editId || undefined,
                    nombre_empresa: nombre,
                    nit,
                    email: email,
                    password: password,
                    telefono,
                    direccion,
                    contacto_principal: contacto
                })
            });

            const result = await response.json();

            if (result.ok) {
                alert(editId ? '✅ Cliente actualizado exitosamente' : '✅ Cliente agregado exitosamente');
                document.getElementById('clientForm').reset();
                const clientEditIdField = document.getElementById('clientEditId');
                if (clientEditIdField) clientEditIdField.value = '';
                this.closeClientModal();
                await this.loadClientes();
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar el cliente');
        }
    },

    editCliente(id, nombre, nit, email, password, telefono, direccion, contacto) {
        const title = document.getElementById('clientModalTitle');
        const editId = document.getElementById('clientEditId');
        const nombreInput = document.getElementById('clientNombre');
        const nitInput = document.getElementById('clientNit');
        const emailInput = document.getElementById('clientEmail');
        const passwordInput = document.getElementById('clientPassword');
        const telInput = document.getElementById('clientTelefono');
        const dirInput = document.getElementById('clientDireccion');
        const contactInput = document.getElementById('clientContacto');

        if (!title || !editId || !nombreInput || !nitInput || !emailInput || !passwordInput) return;

        title.textContent = 'Editar Cliente';
        editId.value = id;
        nombreInput.value = String(nombre || '').toUpperCase();
        nitInput.value = String(nit || '');
        emailInput.value = String(email || '').toLowerCase();
        passwordInput.value = String(password || '');
        if (telInput) telInput.value = String(telefono || '');
        if (dirInput) dirInput.value = String(direccion || '');
        if (contactInput) contactInput.value = String(contacto || '');

        this.openClientModal();
    },

    openClientModal() {
        const modal = document.getElementById('clientModal');
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
    },

    closeClientModal() {
        const modal = document.getElementById('clientModal');
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
    },

    async updateCliente(id, nombre, nit, email, password, telefono, direccion, contacto) {
        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_cliente',
                    id: id,
                    nombre_empresa: nombre,
                    nit: nit,
                    email: email,
                    password: password,
                    telefono: telefono || '',
                    direccion: direccion || '',
                    contacto_principal: contacto || ''
                })
            });

            const result = await response.json();

            if (result.ok) {
                alert('✅ Cliente actualizado exitosamente');
                await this.loadClientes();
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Error al actualizar el cliente');
        }
    },

    deleteCliente(id, nombre) {
        if (!confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) {
            return;
        }

        this.executeDeleteCliente(id);
    },

    async executeDeleteCliente(id) {
        try {
            const response = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_cliente',
                    id: id
                })
            });

            const result = await response.json();

            if (result.ok) {
                alert('✅ Cliente eliminado exitosamente');
                await this.loadClientes();
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Error al eliminar el cliente');
        }
    },

    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        if (field.type === 'password') {
            field.type = 'text';
        } else {
            field.type = 'password';
        }
    },

    toggleTablePasswordVisibility(button) {
        const mask = button.previousElementSibling;
        if (!mask) return;

        const password = mask.dataset.password || '';
        const isVisible = mask.dataset.visible === 'true';

        if (isVisible) {
            // Cambiar a asteriscos (ocultar)
            mask.textContent = password ? '*'.repeat(Math.max(6, password.length)) : '';
            mask.dataset.visible = 'false';
            button.textContent = '👁️';
            button.title = 'Ver contraseña';
            return;
        }

        // Cambiar a visible
        mask.textContent = password;
        mask.dataset.visible = 'true';
        button.textContent = '🙈';
        button.title = 'Ocultar contraseña';
    },

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('hightest_user');
            window.location.href = 'index.html';
        }
    },

    // ========== MÉTODOS PARA VISTA NO ACREDITADOS ==========

    renderCertificatesNoAcreditados() {
        this.filterCertificatesNoAcreditados();
        this.filterFinalizedCertificatesNoAcreditados();
    },

    filterCertificatesNoAcreditados() {
        const searchTerm = document.getElementById('adminSearchCertificatesNoAcreditados')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterStatusNoAcreditados')?.value || '';
        const monthFilter = document.getElementById('adminFilterMonthNoAcreditados')?.value || '';
        const dateFilter = document.getElementById('adminFilterDateNoAcreditados')?.value || '';

        const filtered = this.certificates.filter(cert => {
            const matchesType = cert.type === 'no-acreditado';
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesType && matchesSearch && matchesStatus && matchesDate && matchesMonth;
        });

        this.renderFilteredCertificatesNoAcreditados(filtered);
    },

    filterFinalizedCertificatesNoAcreditados() {
        const searchTerm = document.getElementById('adminSearchFinalizedCertificatesNoAcreditados')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('adminFilterFinalizedStatusNoAcreditados')?.value || '';
        const monthFilter = document.getElementById('adminFilterFinalizedMonthNoAcreditados')?.value || '';
        const dateFilter = document.getElementById('adminFilterFinalizedDateNoAcreditados')?.value || '';

        const finalized = this.certificates.filter(cert => cert.type === 'no-acreditado' && cert.status === 'finalizado');

        const filtered = finalized.filter(cert => {
            const matchesSearch = !searchTerm ||
                cert.id.toLowerCase().includes(searchTerm) ||
                cert.client.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || cert.status === statusFilter;
            const matchesDate = !dateFilter ||
                cert.receptionDate === dateFilter ||
                cert.deliveryDate === dateFilter ||
                cert.finalizedDate === dateFilter;

            const matchesMonth = !monthFilter || (
                (cert.receptionDate && cert.receptionDate.startsWith(monthFilter)) ||
                (cert.deliveryDate && cert.deliveryDate.startsWith(monthFilter)) ||
                (cert.finalizedDate && cert.finalizedDate.startsWith(monthFilter))
            );

            return matchesSearch && matchesStatus && matchesDate && matchesMonth;
        });

        this.renderFinalizedCertificatesNoAcreditados(filtered);
    },

    renderFilteredCertificatesNoAcreditados(filteredCerts) {
        const activeTbody = document.getElementById('certificatesTableBodyNoAcreditados');
        if (!activeTbody) return;

        activeTbody.innerHTML = '';

        const activeCerts = filteredCerts.filter(cert => cert.status !== 'finalizado');

        if (!activeCerts.length) {
            activeTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes activos</td></tr>';
            return;
        }

        activeCerts.forEach(cert => {
            activeTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    renderFinalizedCertificatesNoAcreditados(filteredCerts) {
        const finalizedTbody = document.getElementById('finalizedCertificatesTableBodyNoAcreditados');
        if (!finalizedTbody) return;

        finalizedTbody.innerHTML = '';

        if (!filteredCerts.length) {
            finalizedTbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1rem;">No hay informes finalizados</td></tr>';
            return;
        }

        filteredCerts.forEach(cert => {
            finalizedTbody.appendChild(this.buildCertificateRow(cert));
        });
    },

    updateStatsNoAcreditados() {
        const statsMonthFilter = document.getElementById('statsMonthFilterNoAcreditados');
        const statsPeriodLabel = document.getElementById('statsPeriodLabelNoAcreditados');
        const monthFilter = statsMonthFilter?.value || '';
        const tableBodyIds = ['certificatesTableBodyNoAcreditados', 'finalizedCertificatesTableBodyNoAcreditados'];
        const scopedRows = [];

        tableBodyIds.forEach((tbodyId) => {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;

            Array.from(tbody.querySelectorAll('tr')).forEach((row) => {
                if (row.classList.contains('empty-state') || !row.cells || row.cells.length < 7) return;

                if (monthFilter) {
                    const dateValues = [row.cells[4]?.textContent || '', row.cells[5]?.textContent || '', row.cells[6]?.textContent || '']
                        .map((value) => String(value).trim())
                        .filter((value) => value && value !== '-');
                    const matchesMonth = dateValues.some((value) => value.startsWith(monthFilter));
                    if (!matchesMonth) return;
                }

                scopedRows.push(row);
            });
        });

        const total = scopedRows.length;
        const completed = scopedRows.filter((row) => (row.cells[3]?.textContent || '').toLowerCase().includes('finalizado')).length;
        const pending = total - completed;

        const totalEl = document.getElementById('statTotalCertsNoAcreditados');
        const completedEl = document.getElementById('statCompletedCertsNoAcreditados');
        const pendingEl = document.getElementById('statPendingCertsNoAcreditados');

        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;

        if (statsPeriodLabel) {
            statsPeriodLabel.textContent = monthFilter
                ? `Mostrando resumen de ${monthFilter}`
                : 'Mostrando totales generales';
        }
    },

    syncGlobalMonthFilters(month = '') {
        const monthFields = [
            'statsMonthFilter',
            'statsMonthFilterNoAcreditados',
            'adminFilterMonth',
            'adminFilterFinalizedMonth',
            'adminFilterMonthNoAcreditados',
            'adminFilterFinalizedMonthNoAcreditados'
        ];

        monthFields.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = month;
            }
        });
    }
};

// ===========================
// GESTOR DEL PORTAL DE CLIENTE
// ===========================

const ClientPortalManager = {
    currentClient: null,
    certificates: [],
    requests: [],
    reports: [],

    init() {
        this.loadClientFromStorage();
        if (!this.currentClient) {
            // Si no hay cliente, redirigir al home
			window.location.href = 'index.html';
            return;
        }

        this.setupUI();
        this.loadMockData();
        this.setupEventListeners();
        this.loadReportsFromAdmin();
    },

    loadClientFromStorage() {
        const stored = localStorage.getItem('hightest_client');
        if (stored) {
            this.currentClient = JSON.parse(stored);
        }
    },

    setupUI() {
        // Actualizar información del cliente
        const userNameEl = document.getElementById('clientUserName');
        const userCompanyEl = document.getElementById('clientUserCompany');
        const welcomeNameEl = document.getElementById('clientWelcomeName');
        const welcomeCompanyEl = document.getElementById('clientWelcomeCompany');
        const sidebarNameEl = document.getElementById('clientSidebarName');
        const sidebarCompanyEl = document.getElementById('clientSidebarCompany');
        const portalDateEl = document.getElementById('clientPortalDate');

        if (userNameEl) userNameEl.textContent = this.currentClient.name;
        if (userCompanyEl) userCompanyEl.textContent = this.currentClient.company;
        if (welcomeNameEl) welcomeNameEl.textContent = this.currentClient.name;
        if (welcomeCompanyEl) welcomeCompanyEl.textContent = this.currentClient.company;
        if (sidebarNameEl) sidebarNameEl.textContent = this.currentClient.name;
        if (sidebarCompanyEl) sidebarCompanyEl.textContent = this.currentClient.company;
        if (portalDateEl) {
            portalDateEl.textContent = new Intl.DateTimeFormat('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(new Date());
        }

        // Información de la empresa
        this.renderCompanyInfo();
    },

    loadMockData() {
        // Certificados del cliente
        this.certificates = [
            {
                id: 'HT-2025-001',
                title: 'Certificado de Ensayo Eléctrico',
                product: 'Guantes aislantes Clase 2',
                date: '2025-03-15',
                status: 'completado',
                type: 'certificado'
            },
            {
                id: 'HT-2025-002',
                title: 'Reporte Técnico Detallado',
                product: 'Herramientas aislantes',
                date: '2025-03-15',
                status: 'completado',
                type: 'reporte'
            }
        ];

        // Historial de ensayos
        this.certificates.push(
            {
                id: 'HT-2025-003',
                title: 'Ensayo dieléctrico',
                product: 'Guantes aislantes',
                date: '2025-02-10',
                status: 'completado',
                type: 'historial'
            },
            {
                id: 'HT-2025-004',
                title: 'Ensayo de fuga de corriente',
                product: 'Herramientas',
                date: '2025-01-05',
                status: 'completado',
                type: 'historial'
            }
        );

        // Solicitudes pendientes
        this.requests = [
            {
                id: 'REQ-2025-001',
				type: 'Ensayo en equipos de medición',
                status: 'en-proceso',
                date: '2025-03-01',
				description: 'Ensayo funcional de multímetro digital en banco de pruebas'
            }
        ];
    },

    setupEventListeners() {
        // Logout (desktop)
        const logoutBtn = document.getElementById('clientLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const sidebarLogoutBtn = document.getElementById('clientSidebarLogoutBtn');
        if (sidebarLogoutBtn) {
            sidebarLogoutBtn.addEventListener('click', () => this.logout());
        }

        // Logout desde menú móvil
        const mobileLogoutBtn = document.getElementById('clientLogoutMobileBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.logout();
                if (typeof MobileMenu !== 'undefined') {
                    MobileMenu.close();
                }
            });
        }

        const reportSearchInput = document.getElementById('clientReportSearchInput');
        const reportFilterBtn = document.getElementById('clientReportFilterBtn');
        if (reportSearchInput) {
            reportSearchInput.addEventListener('input', () => this.renderReports());
        }
        if (reportFilterBtn) {
            reportFilterBtn.addEventListener('click', () => this.renderReports());
        }

        this.renderCertificates();
        this.renderHistory();
        this.renderRequests();
        this.updateDashboardStats();
        this.renderReports();
    },

    async loadReportsFromAdmin() {
        try {
            const rows = await getProcesosAcreditados({});
            const companyKey = (this.currentClient?.company || '').toString().trim().toLowerCase();
            const nameKey = (this.currentClient?.name || '').toString().trim().toLowerCase();

            this.reports = (Array.isArray(rows) ? rows : [])
                .filter((row) => {
                    const clientValue = (row.cliente || row.empresa || row.client || '').toString().trim().toLowerCase();
                    if (!clientValue) return true;
                    if (!companyKey && !nameKey) return true;
                    return clientValue.includes(companyKey) || companyKey.includes(clientValue) || clientValue.includes(nameKey) || nameKey.includes(clientValue);
                })
                .map((row) => ({
                    id: row.n_informe || row.numero_proceso || row.id || '-',
                    date: row.fecha_finalizado || row.fecha_entrega_cliente || row.fecha_recepcion || row.created_at || '',
                    project: row.cliente || row.empresa || row.client || 'Proyecto',
                    type: row.tipo || row.categoria || 'Informe de ensayo',
                    raw: row
                }));

            this.renderReports();
        } catch (error) {
            console.warn('No se pudieron cargar los informes desde el panel admin:', error);
            this.reports = [];
            this.renderReports();
        }
    },

    updateDashboardStats() {
        const totalEl = document.getElementById('clientTotalCertificates');
        const activeEl = document.getElementById('clientActiveServices');
        const rateEl = document.getElementById('clientCompletionRate');

        const totalCertificates = this.certificates.filter((cert) => cert.type !== 'historial').length;
        const completedCertificates = this.certificates.filter((cert) => cert.status === 'completado').length;
        const activeServices = this.requests.filter((request) => request.status !== 'finalizado').length;
        const completionRate = totalCertificates > 0 ? Math.round((completedCertificates / totalCertificates) * 100) : 0;

        if (totalEl) totalEl.textContent = String(totalCertificates);
        if (activeEl) activeEl.textContent = String(activeServices);
        if (rateEl) rateEl.textContent = `${completionRate}%`;
    },

    getFilteredReports() {
        const searchTerm = (document.getElementById('clientReportSearchInput')?.value || '').trim().toLowerCase();

        return this.reports.filter((report) => {
            if (!searchTerm) return true;

            return [report.id, report.project, report.type]
                .join(' ')
                .toLowerCase()
                .includes(searchTerm);
        });
    },

    renderReports() {
        const tbody = document.getElementById('clientReportsTableBody');
        if (!tbody) return;

        const filteredReports = this.getFilteredReports();

        if (!filteredReports.length) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="5" style="text-align:center; padding: 1.5rem;">No hay informes disponibles</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredReports.map((report) => `
            <tr>
                <td><strong>${report.id}</strong></td>
                <td>${this.formatDate(report.date)}</td>
                <td>${report.project}</td>
                <td>${report.type}</td>
                <td>
                    <button type="button" class="btn btn--small btn--primary" onclick="ClientPortalManager.downloadReport('${report.id}')">PDF</button>
                </td>
            </tr>
        `).join('');
    },

    renderCertificates() {
        const container = document.getElementById('clientCertificates');
        if (!container) return;

        const certCards = this.certificates.filter(cert => cert.type !== 'historial');

        container.innerHTML = certCards.map(cert => `
            <div class="certificate-card">
                <div class="certificate-card__icon">${cert.type === 'certificado' ? '🎖️' : '📄'}</div>
                <div class="certificate-card__content">
                    <h3>${cert.title}</h3>
                    <p>${cert.product}</p>
                    <div class="certificate-card__meta">
                        <span class="meta__date">📅 ${this.formatDate(cert.date)}</span>
                        <span class="meta__status status--${cert.status}">${this.getStatusText(cert.status)}</span>
                    </div>
                </div>
                <div class="certificate-card__actions">
                    <button class="btn btn--primary btn--small" onclick="ClientPortalManager.downloadCertificate('${cert.id}')">
                        📥 Descargar
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderHistory() {
        const container = document.getElementById('clientHistory');
        if (!container) return;

        const historyItems = this.certificates.filter(cert => cert.type === 'historial');

        container.innerHTML = historyItems.map(cert => `
            <div class="history-item">
                <div class="history-item__date">${this.formatDate(cert.date)}</div>
                <div class="history-item__content">
                    <h4>${cert.title}</h4>
                    <p>${cert.product}</p>
                    <p>Estado: <span class="status--${cert.status}">${this.getStatusText(cert.status)}</span></p>
                </div>
            </div>
        `).join('');
    },

    renderRequests() {
        const container = document.getElementById('clientRequests');
        if (!container) return;

        container.innerHTML = this.requests.map(req => `
            <div class="request-card">
                <div class="request-card__header">
                    <h4>${req.type}</h4>
                    <span class="status-badge status--${req.status}">${this.getStatusText(req.status)}</span>
                </div>
                <p>${req.description}</p>
                <div class="request-card__meta">
                    <span>Solicitado: ${this.formatDate(req.date)}</span>
                </div>
            </div>
        `).join('');
    },

    renderCompanyInfo() {
        const container = document.getElementById('companyInfo');
        if (!container) return;

        container.innerHTML = `
            <div class="company-info__content">
                <div class="company-info__row">
                    <span class="company-info__label">Empresa:</span>
                    <span class="company-info__value">${this.currentClient.company}</span>
                </div>
                <div class="company-info__row">
                    <span class="company-info__label">Contacto:</span>
                    <span class="company-info__value">${this.currentClient.name}</span>
                </div>
                <div class="company-info__row">
                    <span class="company-info__label">Email:</span>
                    <span class="company-info__value">${this.currentClient.email}</span>
                </div>
                <div class="company-info__row">
                    <span class="company-info__label">Cliente desde:</span>
                    <span class="company-info__value">${this.formatDate(this.currentClient.loginTime.split(' ')[0])}</span>
                </div>
            </div>
        `;
    },

    // Las funciones de solicitud se han eliminado según requerimiento

    downloadCertificate(certId) {
        alert(`Descargando ${certId}...`);
    },

    downloadReport(reportId) {
        alert(`Descargando PDF del informe ${reportId}...`);
    },

    getStatusText(status) {
        const statusMap = {
            'completado': '✅ Completado',
            'en-proceso': '⏳ En Proceso',
            'pendiente': '📋 Pendiente'
        };
        return statusMap[status] || status;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    },

    logout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('hightest_client');
            window.location.href = 'index.html';
        }
    }
};

if (typeof window !== 'undefined') {
    window.AdminPanelManager = AdminPanelManager;
}

// ===========================
// MÓDULO COMERCIAL - COTIZACIONES
// ===========================

const CommercialQuotesModule = {
    storageKey: 'hightest_commercial_quotes',
    pageSize: 6,
    taxRate: 0.19,
    currentPage: 1,
    currentQuoteId: null,
    drawerMode: 'new',
    quotes: [],
    filteredQuotes: [],
    initialized: false,

    init() {
        const section = document.getElementById('gestion-comercial');
        if (!section || this.initialized) {
            return;
        }

        this.section = section;
        this.cacheElements();
        this.loadData();
        this.bindEvents();
        this.populateClientSelect();
        this.populateRecepcionSelect();
        this.render();
        this.initialized = true;
    },

    cacheElements() {
        this.searchInput = document.getElementById('commercialSearchInput');
        this.statusFilter = document.getElementById('commercialStatusFilter');
        this.clientFilter = document.getElementById('commercialClientFilter');
        this.monthFilter = document.getElementById('commercialMonthFilter');
        this.sortFilter = document.getElementById('commercialSortFilter');
        this.statsGrid = document.getElementById('commercialStatsGrid');
        this.resultsCount = document.getElementById('commercialResultsCount');
        this.tableBody = document.getElementById('commercialQuotesTableBody');
        this.mobileList = document.getElementById('commercialMobileList');
        this.pagination = document.getElementById('commercialPagination');
        this.drawer = document.getElementById('commercialDrawer');
        this.drawerBackdrop = document.getElementById('commercialDrawerBackdrop');
        this.drawerModeEl = document.getElementById('commercialDrawerMode');
        this.drawerTitleEl = document.getElementById('commercialDrawerTitle');
        this.drawerSubtitleEl = document.getElementById('commercialDrawerSubtitle');
        this.quoteIdEl = document.getElementById('commercialQuoteId');
        this.quoteDateEl = document.getElementById('commercialQuoteDate');
        this.clientSelectEl = document.getElementById('commercialClientSelect');
        this.quoteNameEl = document.getElementById('commercialQuoteName');
        this.quoteCompanyEl = document.getElementById('commercialQuoteCompany');
        this.quoteEmailEl = document.getElementById('commercialQuoteEmail');
        this.quotePhoneEl = document.getElementById('commercialQuotePhone');
        this.quoteResponsibleEl = document.getElementById('commercialQuoteResponsible');
        this.quoteStatusEl = document.getElementById('commercialQuoteStatus');
        this.itemsBodyEl = document.getElementById('commercialItemsTableBody');
        this.subtotalEl = document.getElementById('commercialSubtotal');
        this.taxEl = document.getElementById('commercialTax');
        this.totalEl = document.getElementById('commercialTotal');
        this.historyEl = document.getElementById('commercialHistoryList');
        this.previewNameEl = document.getElementById('commercialPreviewName');
        this.previewCompanyEl = document.getElementById('commercialPreviewCompany');
        this.previewEmailEl = document.getElementById('commercialPreviewEmail');
        this.previewPhoneEl = document.getElementById('commercialPreviewPhone');
        this.previewBadgeEl = document.getElementById('commercialClientPreviewBadge');
        this.recepcionSelectEl = document.getElementById('commercialRecepcionSelect');
    },

    bindEvents() {
        if (this.bound) {
            return;
        }

        this.bound = true;

        this.searchInput?.addEventListener('input', () => this.resetAndRender());
        this.statusFilter?.addEventListener('change', () => this.resetAndRender());
        this.clientFilter?.addEventListener('change', () => this.resetAndRender());
        this.monthFilter?.addEventListener('change', () => this.resetAndRender());
        this.sortFilter?.addEventListener('change', () => this.resetAndRender());

        document.getElementById('commercialNewQuoteBtn')?.addEventListener('click', () => this.openDrawerForNewQuote());
        document.getElementById('commercialCloseDrawerBtn')?.addEventListener('click', () => this.closeDrawer());
        this.drawerBackdrop?.addEventListener('click', () => this.closeDrawer());
        document.getElementById('commercialAddItemBtn')?.addEventListener('click', () => this.addItemRow());
        document.getElementById('commercialSaveDraftBtn')?.addEventListener('click', () => this.saveDraft());
        document.getElementById('commercialGeneratePdfBtn')?.addEventListener('click', () => this.downloadPdf());
        document.getElementById('commercialSendBtn')?.addEventListener('click', () => this.sendQuote());
        document.getElementById('commercialApproveBtn')?.addEventListener('click', () => this.approveQuote());
        document.getElementById('commercialRejectBtn')?.addEventListener('click', () => this.rejectQuote());

        this.clientSelectEl?.addEventListener('change', () => this.syncClientSelection());
        this.recepcionSelectEl?.addEventListener('change', () => this.vincularRecepcion());

        [
            this.quoteNameEl,
            this.quoteCompanyEl,
            this.quoteEmailEl,
            this.quotePhoneEl,
            this.quoteResponsibleEl,
            this.quoteDateEl,
            this.quoteStatusEl,
        ].forEach((element) => {
            element?.addEventListener('input', () => this.updatePreview());
            element?.addEventListener('change', () => this.updatePreview());
        });

        this.itemsBodyEl?.addEventListener('input', (event) => {
            const target = event.target;
            if (!target.closest('.commercial-items-row')) {
                return;
            }

            this.updateItemFromInput(target);
        });

        this.itemsBodyEl?.addEventListener('click', (event) => {
            const removeButton = event.target.closest('[data-remove-item]');
            if (!removeButton) {
                return;
            }

            const row = removeButton.closest('.commercial-items-row');
            if (!row) {
                return;
            }

            const itemIndex = Number.parseInt(row.dataset.itemIndex || '0', 10);
            this.removeItemRow(itemIndex);
        });

        this.tableBody?.addEventListener('click', (event) => this.handleAction(event));
        this.mobileList?.addEventListener('click', (event) => this.handleAction(event));
        this.pagination?.addEventListener('click', (event) => {
            const button = event.target.closest('[data-page]');
            if (!button) {
                return;
            }

            const nextPage = Number.parseInt(button.dataset.page || '1', 10);
            if (!Number.isNaN(nextPage)) {
                this.currentPage = nextPage;
                this.renderTableAndCards();
            }
        });
    },

    async loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.quotes = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error cargando caché local:', error);
        }

        await this._fetchFromSupabase();
    },

    async _fetchFromSupabase() {
        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_cotizaciones' })
            });
            const result = await resp.json();
            if (result.ok && Array.isArray(result.cotizaciones)) {
                this.quotes = result.cotizaciones.map(c => this._supabaseToQuote(c));
                localStorage.setItem(this.storageKey, JSON.stringify(this.quotes));
            }
        } catch (e) {
            console.warn('No se pudieron cargar cotizaciones del servidor:', e.message);
            if (!this.quotes || this.quotes.length === 0) {
                this.quotes = this.getSeedQuotes();
                localStorage.setItem(this.storageKey, JSON.stringify(this.quotes));
            }
        }
        this.render();
    },

    _supabaseToQuote(c) {
        return {
            id: c.cotizacion || `COT-${c.id}`,
            dbId: c.id,
            procesoId: c.proceso_id,
            date: (c.created_at || '').slice(0, 10),
            status: c.estado || 'borrador',
            responsible: '',
            contactName: '',
            company: c.cliente || '',
            email: '',
            phone: '',
            clientId: '',
            cliente: c.cliente || '',
            informeNombre: c.informe_nombre || '',
            items: Array.isArray(c.items) ? c.items : [],
            history: [],
            total: Number(c.total_valor) || 0,
        };
    },

    _quoteToSupabase(quote) {
        return {
            proceso_id: quote.procesoId || null,
            cotizacion: quote.id || '',
            cliente: quote.cliente || quote.company || '',
            informe_nombre: quote.informeNombre || '',
            items: quote.items || [],
            total_items: (quote.items || []).length,
            total_valor: quote.total || 0,
            estado: quote.status || 'borrador'
        };
    },

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.quotes));
        } catch (error) {
            console.error('No se pudo guardar el módulo comercial:', error);
        }
    },

    async _saveToSupabase(quote) {
        const payload = this._quoteToSupabase(quote);
        if (quote.dbId) {
            payload.id = quote.dbId;
        }
        try {
            const action = quote.dbId ? 'update_cotizacion' : 'add_cotizacion';
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });
            const result = await resp.json();
            if (result.ok && result.cotizacion) {
                quote.dbId = result.cotizacion.id;
                return true;
            }
        } catch (e) {
            console.warn('Error guardando cotización en servidor:', e.message);
        }
        return false;
    },

    getSeedQuotes() {
        const today = new Date();
        const day = (offset) => new Date(today.getTime() - offset * 86400000).toISOString().slice(0, 10);

        return [
            {
                id: 'COT-2026-001',
                date: day(1),
                status: 'pendiente',
                responsible: 'Laura Gómez',
                contactName: 'Andrés Ruiz',
                company: 'Industrias Atlas SAS',
                email: 'compras@atlas.com',
                phone: '+57 300 555 1122',
                clientId: 'atlas-sas',
                items: [
                    { description: 'Diagnóstico técnico de equipos', quantity: 1, price: 1450000 },
                    { description: 'Mantenimiento preventivo premium', quantity: 2, price: 620000 },
                ],
                history: [
                    { date: day(1), title: 'Cotización creada', detail: 'Generada desde el panel comercial.' },
                ],
            },
            {
                id: 'COT-2026-002',
                date: day(3),
                status: 'en-revision',
                responsible: 'Carlos Peña',
                contactName: 'Marta Salcedo',
                company: 'Energia Nova Ltda',
                email: 'marta.salcedo@novaltda.com',
                phone: '+57 310 888 4300',
                clientId: 'energia-nova-ltda',
                items: [
                    { description: 'Inspección de seguridad', quantity: 4, price: 380000 },
                    { description: 'Informe ejecutivo', quantity: 1, price: 780000 },
                ],
                history: [
                    { date: day(3), title: 'Cotización creada', detail: 'Lista para validación del cliente.' },
                    { date: day(2), title: 'Enviada a revisión', detail: 'Se notificó al equipo de compras.' },
                ],
            },
            {
                id: 'COT-2026-003',
                date: day(6),
                status: 'aprobada',
                responsible: 'Laura Gómez',
                contactName: 'Javier Álvarez',
                company: 'Grupo Orbita S.A.S.',
                email: 'javier@orbita.com',
                phone: '+57 320 202 1000',
                clientId: 'grupo-orbita-sas',
                items: [
                    { description: 'Capacitación especializada', quantity: 1, price: 2450000 },
                    { description: 'Soporte remoto', quantity: 6, price: 180000 },
                ],
                history: [
                    { date: day(6), title: 'Cotización creada', detail: 'Documento inicial preparado.' },
                    { date: day(4), title: 'Aprobada', detail: 'Cliente aprobó el alcance y presupuesto.' },
                ],
            },
            {
                id: 'COT-2026-004',
                date: day(8),
                status: 'rechazada',
                responsible: 'Sofía Torres',
                contactName: 'Daniel Ospina',
                company: 'Red Técnica Andina',
                email: 'daniel@reda.com',
                phone: '+57 311 654 9870',
                clientId: 'red-tecnica-andina',
                items: [
                    { description: 'Auditoría de proceso', quantity: 2, price: 1350000 },
                ],
                history: [
                    { date: day(8), title: 'Cotización creada', detail: 'Se compartió la propuesta inicial.' },
                    { date: day(7), title: 'Rechazada', detail: 'El cliente pidió ajustar condiciones comerciales.' },
                ],
            },
            {
                id: 'COT-2026-005',
                date: day(10),
                status: 'pendiente',
                responsible: 'Carlos Peña',
                contactName: 'Paola Duarte',
                company: 'Soluciones Delta S.A.',
                email: 'paola@delta.com',
                phone: '+57 315 700 7788',
                clientId: 'soluciones-delta-sa',
                items: [
                    { description: 'Verificación de documentación', quantity: 1, price: 690000 },
                    { description: 'Acompañamiento comercial', quantity: 3, price: 240000 },
                ],
                history: [
                    { date: day(10), title: 'Cotización creada', detail: 'En espera de revisión interna.' },
                ],
            },
            {
                id: 'COT-2026-006',
                date: day(14),
                status: 'en-revision',
                responsible: 'Laura Gómez',
                contactName: 'Camila Rojas',
                company: 'Norte Industrial Group',
                email: 'camilar@norteindustrial.com',
                phone: '+57 301 222 3344',
                clientId: 'norte-industrial-group',
                items: [
                    { description: 'Paquete de consultoría', quantity: 2, price: 1850000 },
                ],
                history: [
                    { date: day(14), title: 'Cotización creada', detail: 'Consolidada para aprobación interna.' },
                    { date: day(13), title: 'En revisión', detail: 'Pendiente de observaciones del cliente.' },
                ],
            },
        ];
    },

    getClientCatalog() {
        const catalog = Array.isArray(window.AdminPanelManager?.clientsCatalog) ? window.AdminPanelManager.clientsCatalog : [];
        const fromCatalog = catalog
            .map((client, index) => ({
                id: client.id || client.slug || client.email || `client-${index + 1}`,
                name: client.nombre_empresa || client.company || client.name || client.nombre || 'Cliente',
                company: client.nombre_empresa || client.company || client.name || client.nombre || 'Cliente',
                email: client.email || '',
                phone: client.phone || client.telefono || '',
            }))
            .filter((client) => client.company);

        if (fromCatalog.length) {
            return fromCatalog;
        }

        const uniqueCompanies = Array.from(new Map(this.quotes.map((quote) => [quote.company, quote])).keys());
        return uniqueCompanies.map((company) => ({
            id: company.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: company,
            company,
            email: '',
            phone: '',
        }));
    },

    populateClientSelect() {
        if (!this.clientSelectEl) {
            return;
        }

        const currentValue = this.clientSelectEl.value || this.currentQuote?.clientId || '';
        const clients = this.getClientCatalog();
        const filterClientSelect = this.clientFilter;

        this.clientSelectEl.innerHTML = '<option value="">Seleccionar cliente</option>';
        if (filterClientSelect) {
            const filterValue = filterClientSelect.value || '';
            filterClientSelect.innerHTML = '<option value="">Todos los clientes</option>';
            clients.forEach((client) => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.company;
                filterClientSelect.appendChild(option);
            });
            filterClientSelect.value = filterValue;
        }

        clients.forEach((client) => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.company;
            this.clientSelectEl.appendChild(option);
        });

        this.clientSelectEl.value = currentValue;
    },

    formatMoney(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(Number(value || 0));
    },

    normalizeStatus(status) {
        const raw = String(status || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const map = {
            borrador: 'borrador',
            pendiente: 'borrador',
            enviada: 'enviada',
            enrevision: 'enviada',
            'en-revision': 'enviada',
            revision: 'enviada',
            aprobada: 'aprobada',
            rechazada: 'rechazada',
            facturada: 'facturada',
        };

        return map[raw.replace(/[_\s]+/g, '-')] || map[raw.replace(/[-_\s]+/g, '')] || raw;
    },

    getStatusLabel(status) {
        const normalized = this.normalizeStatus(status);
        const labels = {
            borrador: 'Borrador',
            pendiente: 'Borrador',
            enviada: 'Enviada',
            'en-revision': 'Enviada',
            aprobada: 'Aprobada',
            rechazada: 'Rechazada',
            facturada: 'Facturada',
        };
        return labels[normalized] || 'Pendiente';
    },

    getStatusClass(status) {
        return `commercial-status-badge--${this.normalizeStatus(status)}`;
    },

    getClientById(clientId) {
        return this.getClientCatalog().find((client) => client.id === clientId) || null;
    },

    getNextQuoteId() {
        const maxSequence = this.quotes.reduce((max, quote) => {
            const match = String(quote.id || '').match(/(\d+)$/);
            const value = match ? Number.parseInt(match[1], 10) : 0;
            return Number.isNaN(value) ? max : Math.max(max, value);
        }, 0);

        return `COT-2026-${String(maxSequence + 1).padStart(3, '0')}`;
    },

    getActiveQuoteTemplate() {
        const today = new Date().toISOString().slice(0, 10);
        const defaultResponsible = window.AdminPanelManager?.getAdminDisplayName?.() || 'Asesor comercial';
        return {
            id: this.getNextQuoteId(),
            date: today,
            status: 'borrador',
            responsible: defaultResponsible,
            contactName: '',
            company: '',
            email: '',
            phone: '',
            clientId: '',
            items: [
                { description: '', quantity: 1, price: 0 },
            ],
            history: [
                { date: today, title: 'Borrador listo', detail: 'Se inició una nueva cotización.' },
            ],
        };
    },

    resetAndRender() {
        this.currentPage = 1;
        this.render();
    },

    getFilteredQuotes() {
        const searchTerm = (this.searchInput?.value || '').trim().toLowerCase();
        const statusFilter = this.normalizeStatus(this.statusFilter?.value || '');
        const clientFilter = this.clientFilter?.value || '';
        const monthFilter = this.monthFilter?.value || '';

        const filtered = this.quotes.filter((quote) => {
            const blob = [
                quote.id,
                quote.contactName,
                quote.company,
                quote.cliente,
                quote.informeNombre,
                quote.email,
                quote.phone,
                quote.responsible,
                quote.status,
            ].join(' ').toLowerCase();

            const matchesSearch = !searchTerm || blob.includes(searchTerm);
            const matchesStatus = !statusFilter || this.normalizeStatus(quote.status) === statusFilter;
            const matchesClient = !clientFilter || quote.clientId === clientFilter;
            const matchesMonth = !monthFilter || String(quote.date || '').startsWith(monthFilter);

            return matchesSearch && matchesStatus && matchesClient && matchesMonth;
        });

        const sortMode = this.sortFilter?.value || 'recent';
        return filtered.sort((left, right) => {
            if (sortMode === 'total-desc') {
                return this.getQuoteTotal(right) - this.getQuoteTotal(left);
            }
            if (sortMode === 'total-asc') {
                return this.getQuoteTotal(left) - this.getQuoteTotal(right);
            }
            if (sortMode === 'client-az') {
                return String(left.company).localeCompare(String(right.company), 'es', { sensitivity: 'base' });
            }

            const leftDate = String(left.date || '');
            const rightDate = String(right.date || '');
            return sortMode === 'oldest'
                ? leftDate.localeCompare(rightDate)
                : rightDate.localeCompare(leftDate);
        });
    },

    getQuoteTotals(quote) {
        const subtotal = (quote.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
        const tax = Math.round(subtotal * this.taxRate);
        return {
            subtotal,
            tax,
            total: subtotal + tax,
        };
    },

    getQuoteTotal(quote) {
        return this.getQuoteTotals(quote).total;
    },

    render() {
        this.populateClientSelect();
        this.filteredQuotes = this.getFilteredQuotes();
        this.renderStats();
        this.renderTableAndCards();
        this.renderPagination();
        this.updateResultsCount();
        this.renderCurrentQuote();
    },

    renderStats() {
        if (!this.statsGrid) {
            return;
        }

        const cotizacionesCreadas = this.quotes.length;
        const procesosSinCotizacion = this.getProcesosSinCotizacion();
        const totalPendientes = procesosSinCotizacion.length;
        const total = cotizacionesCreadas + totalPendientes;
        const hechas = cotizacionesCreadas;

        const cards = [
            { icon: '📋', label: 'Total Procesos', value: total },
            { icon: '⏳', label: 'Pendientes', value: totalPendientes },
            { icon: '✅', label: 'Cotizaciones Hechas', value: hechas },
        ];

        this.statsGrid.innerHTML = cards
            .map((card) => `
                <article class="commercial-stat-card">
                    <div class="commercial-stat-card__top">
                        <div class="commercial-stat-card__icon">${card.icon}</div>
                    </div>
                    <p class="commercial-stat-card__value">${escapeHtml(String(card.value))}</p>
                    <p class="commercial-stat-card__label">${escapeHtml(card.label)}</p>
                </article>
            `)
            .join('');
    },

    getProcesosSinCotizacion() {
        if (typeof PROCESOS_STORE === 'undefined' || !Array.isArray(PROCESOS_STORE.all)) {
            return [];
        }
        const numerosConCotizacion = new Set(
            (this.quotes || []).map(q => String(q.id || '').trim().toLowerCase())
        );
        return PROCESOS_STORE.all.filter(proceso => {
            const num = String(proceso.numero_proceso || '').trim().toLowerCase();
            if (!num) return false;
            return !numerosConCotizacion.has(num);
        });
    },

    renderTableAndCards() {
        const start = (this.currentPage - 1) * this.pageSize;
        const pagedQuotes = this.filteredQuotes.slice(start, start + this.pageSize);

        if (this.tableBody) {
            this.tableBody.innerHTML = pagedQuotes.length
                ? pagedQuotes.map((quote) => this.renderTableRow(quote)).join('')
                : `<tr><td colspan="7" class="commercial-empty-state">No hay cotizaciones que coincidan con los filtros.</td></tr>`;
        }

        if (this.mobileList) {
            this.mobileList.innerHTML = pagedQuotes.length
                ? pagedQuotes.map((quote) => this.renderMobileCard(quote)).join('')
                : `<div class="commercial-empty-state">No hay cotizaciones que coincidan con los filtros.</div>`;
        }
    },

    renderTableRow(quote) {
        const totals = this.getQuoteTotals(quote);
        return `
            <tr>
                <td><strong>${escapeHtml(quote.id)}</strong></td>
                <td>
                    <div>${escapeHtml(quote.cliente || quote.company || 'N/A')}</div>
                    <small>${escapeHtml(quote.informeNombre || quote.email || '')}</small>
                </td>
                <td>${escapeHtml(formatDateShort(quote.date))}</td>
                <td><span class="commercial-status-badge ${this.getStatusClass(quote.status)}">${escapeHtml(this.getStatusLabel(quote.status))}</span></td>
                <td><strong>${escapeHtml(this.formatMoney(totals.total))}</strong></td>
                <td>${escapeHtml(quote.responsible || '')}</td>
                <td>
                    <div class="commercial-action-buttons">
                        <button type="button" class="commercial-action-button" data-action="view" data-id="${escapeHtml(quote.id)}">Ver</button>
                        <button type="button" class="commercial-action-button" data-action="edit" data-id="${escapeHtml(quote.id)}">Editar</button>
                        <button type="button" class="commercial-action-button" data-action="pdf" data-id="${escapeHtml(quote.id)}">PDF</button>
                        <button type="button" class="commercial-action-button" data-action="send" data-id="${escapeHtml(quote.id)}">Enviar</button>
                        <button type="button" class="commercial-action-button" data-action="duplicate" data-id="${escapeHtml(quote.id)}">Duplicar</button>
                        <button type="button" class="commercial-action-button commercial-action-button--danger" data-action="delete" data-id="${escapeHtml(quote.id)}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    },

    renderMobileCard(quote) {
        const totals = this.getQuoteTotals(quote);
        return `
            <article class="commercial-mobile-card">
                <div class="commercial-mobile-card__top">
                    <div>
                        <div class="commercial-mobile-card__id">${escapeHtml(quote.id)}</div>
                        <div>${escapeHtml(quote.cliente || quote.company || 'N/A')}</div>
                    </div>
                    <span class="commercial-status-badge ${this.getStatusClass(quote.status)}">${escapeHtml(this.getStatusLabel(quote.status))}</span>
                </div>
                <div class="commercial-mobile-card__meta">
                    <div><strong>Fecha:</strong> ${escapeHtml(formatDateShort(quote.date))}</div>
                    <div><strong>Total:</strong> ${escapeHtml(this.formatMoney(totals.total))}</div>
                    <div><strong>Informe:</strong> ${escapeHtml(quote.informeNombre || '')}</div>
                </div>
                <div class="commercial-mobile-card__actions">
                    <button type="button" class="commercial-action-button" data-action="view" data-id="${escapeHtml(quote.id)}">Ver</button>
                    <button type="button" class="commercial-action-button" data-action="edit" data-id="${escapeHtml(quote.id)}">Editar</button>
                    <button type="button" class="commercial-action-button" data-action="pdf" data-id="${escapeHtml(quote.id)}">PDF</button>
                    <button type="button" class="commercial-action-button" data-action="send" data-id="${escapeHtml(quote.id)}">Enviar</button>
                    <button type="button" class="commercial-action-button" data-action="duplicate" data-id="${escapeHtml(quote.id)}">Duplicar</button>
                </div>
            </article>
        `;
    },

    renderPagination() {
        if (!this.pagination) {
            return;
        }

        const totalPages = Math.max(1, Math.ceil(this.filteredQuotes.length / this.pageSize));
        this.currentPage = Math.min(this.currentPage, totalPages);

        this.pagination.innerHTML = `
            <div class="commercial-pagination__info">Página ${this.currentPage} de ${totalPages}</div>
            <div class="commercial-pagination__controls">
                <button type="button" class="commercial-pagination__button" data-page="${Math.max(1, this.currentPage - 1)}" ${this.currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                <button type="button" class="commercial-pagination__button" data-page="${Math.min(totalPages, this.currentPage + 1)}" ${this.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
            </div>
        `;
    },

    updateResultsCount() {
        if (this.resultsCount) {
            this.resultsCount.textContent = `${this.filteredQuotes.length} cotizaciones`;
        }
    },

    handleAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) {
            return;
        }

        const quoteId = button.dataset.id || '';
        const action = button.dataset.action || '';

        if (action === 'view' || action === 'edit') {
            this.openDrawer(quoteId, action === 'view' ? 'view' : 'edit');
            return;
        }

        if (action === 'pdf') {
            this.downloadPdf(quoteId);
            return;
        }

        if (action === 'send') {
            this.updateQuoteStatus(quoteId, 'en-revision', 'Cotización enviada para revisión.');
            return;
        }

        if (action === 'duplicate') {
            this.duplicateQuote(quoteId);
            return;
        }

        if (action === 'delete') {
            this.deleteQuote(quoteId);
        }
    },

    openDrawerForNewQuote() {
        this.currentQuoteId = null;
        this.drawerMode = 'new';
        this.currentQuote = this.getActiveQuoteTemplate();
        if (this.recepcionSelectEl) this.recepcionSelectEl.value = '';
        this.showDrawer();
        this.populateDrawer();
    },

    openDrawer(quoteId, mode = 'edit') {
        const quote = this.quotes.find((item) => item.id === quoteId);
        if (!quote) {
            return;
        }

        this.currentQuoteId = quoteId;
        this.drawerMode = mode;
        this.currentQuote = JSON.parse(JSON.stringify(quote));
        this.showDrawer();
        this.populateDrawer();
    },

    showDrawer() {
        if (!this.drawer) {
            return;
        }

        this.drawer.hidden = false;
        requestAnimationFrame(() => {
            this.drawer.classList.add('is-open');
            this.drawer.setAttribute('aria-hidden', 'false');
        });
    },

    closeDrawer() {
        if (!this.drawer) {
            return;
        }

        this.drawer.classList.remove('is-open');
        this.drawer.setAttribute('aria-hidden', 'true');
        window.setTimeout(() => {
            if (!this.drawer?.classList.contains('is-open')) {
                this.drawer.hidden = true;
            }
        }, 260);
    },

    populateDrawer() {
        if (!this.currentQuote) {
            return;
        }

        const quote = this.currentQuote;
        if (this.drawerModeEl) {
            this.drawerModeEl.textContent = this.drawerMode === 'view' ? 'Vista detallada' : this.drawerMode === 'edit' ? 'Editar cotización' : 'Nueva cotización';
        }
        if (this.drawerTitleEl) {
            this.drawerTitleEl.textContent = quote.id;
        }
        if (this.drawerSubtitleEl) {
            this.drawerSubtitleEl.textContent = this.drawerMode === 'view'
                ? 'Consulta el historial, los productos y el estado comercial de esta cotización.'
                : 'Edita la cotización, ajusta importes y controla su estado comercial.';
        }

        if (this.quoteIdEl) this.quoteIdEl.value = quote.id || '';
        if (this.quoteDateEl) this.quoteDateEl.value = quote.date || '';
        if (this.quoteStatusEl) this.quoteStatusEl.value = this.normalizeStatus(quote.status);
        if (this.quoteNameEl) this.quoteNameEl.value = quote.contactName || '';
        if (this.quoteCompanyEl) this.quoteCompanyEl.value = quote.company || '';
        if (this.quoteEmailEl) this.quoteEmailEl.value = quote.email || '';
        if (this.quotePhoneEl) this.quotePhoneEl.value = quote.phone || '';
        if (this.quoteResponsibleEl) this.quoteResponsibleEl.value = quote.responsible || '';

        const selectedClient = this.getClientCatalog().find((client) => client.id === quote.clientId) || null;
        if (this.clientSelectEl) {
            this.clientSelectEl.value = quote.clientId || '';
        }

        this.renderItemRows();
        this.renderHistory(quote);
        this.updatePreview(selectedClient);
        this.recalculateTotals();
    },

    renderCurrentQuote() {
        if (!this.currentQuote) {
            return;
        }

        this.updatePreview();
        this.renderHistory(this.currentQuote);
        this.recalculateTotals();
    },

    syncClientSelection() {
        if (!this.currentQuote) {
            this.currentQuote = this.getActiveQuoteTemplate();
        }

        const selectedClient = this.getClientById(this.clientSelectEl?.value || '');
        if (!selectedClient) {
            this.updatePreview(null);
            return;
        }

        this.currentQuote.clientId = selectedClient.id;
        this.currentQuote.company = selectedClient.company;
        this.currentQuote.email = selectedClient.email || this.currentQuote.email;
        this.currentQuote.phone = selectedClient.phone || this.currentQuote.phone;
        if (this.quoteCompanyEl) this.quoteCompanyEl.value = selectedClient.company;
        if (this.quoteEmailEl && selectedClient.email) this.quoteEmailEl.value = selectedClient.email;
        if (this.quotePhoneEl && selectedClient.phone) this.quotePhoneEl.value = selectedClient.phone;
        this.updatePreview(selectedClient);
    },

    async populateRecepcionSelect() {
        if (!this.recepcionSelectEl) return;
        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_procesos_acreditados', limit: 500 })
            });
            const result = await resp.json();
            if (result.ok && Array.isArray(result.procesos)) {
                const opciones = result.procesos.map(p => {
                    const num = p.numero_proceso || '';
                    const cliente = p.cliente || '';
                    const estado = p.estado || '';
                    return `<option value="${p.id}" data-num="${num}" data-cliente="${cliente}" data-estado="${estado}">${num} — ${cliente}</option>`;
                }).join('');
                this.recepcionSelectEl.innerHTML = '<option value="">Sin vincular — Cotización manual</option>' + opciones;
            }
        } catch (e) {
            console.warn('No se pudieron cargar recepciones:', e.message);
        }
    },

    async vincularRecepcion() {
        const procesoId = this.recepcionSelectEl?.value;
        if (!procesoId) return;

        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generar_cotizacion', proceso_id: Number(procesoId) })
            });
            const result = await resp.json();

            if (result.ok && result.cotizacion) {
                const c = result.cotizacion;
                if (!this.currentQuote) {
                    this.currentQuote = this.getActiveQuoteTemplate();
                }
                this.currentQuote.procesoId = c.proceso_id;
                this.currentQuote.cliente = c.cliente || '';
                this.currentQuote.informeNombre = c.informe_nombre || '';
                this.currentQuote.company = c.cliente || '';
                this.currentQuote.items = Array.isArray(c.items) ? c.items.map(item => ({
                    description: item.nombre || item.description || '',
                    quantity: item.cantidad || item.quantity || 1,
                    price: item.precio_unitario || item.price || 0,
                })) : [];

                if (this.quoteCompanyEl) this.quoteCompanyEl.value = c.cliente || '';
                this.renderItemRows();
                this.recalculateTotals();
                this.updatePreview();
                this.showNotification?.('Recepción vinculada. Ajuste precios y cantidades.', 'success');
            }
        } catch (e) {
            console.error('Error vinculando recepción:', e);
        }
    },

    updatePreview(clientOverride = null) {
        const quote = this.currentQuote || this.getActiveQuoteTemplate();
        const selectedClient = clientOverride || this.getClientById(this.clientSelectEl?.value || '') || null;

        if (selectedClient) {
            if (this.previewNameEl) this.previewNameEl.textContent = selectedClient.name || quote.contactName || '-';
            if (this.previewCompanyEl) this.previewCompanyEl.textContent = selectedClient.company || quote.company || '-';
            if (this.previewEmailEl) this.previewEmailEl.textContent = selectedClient.email || quote.email || '-';
            if (this.previewPhoneEl) this.previewPhoneEl.textContent = selectedClient.phone || quote.phone || '-';
        } else {
            if (this.previewNameEl) this.previewNameEl.textContent = quote.contactName || '-';
            if (this.previewCompanyEl) this.previewCompanyEl.textContent = quote.company || '-';
            if (this.previewEmailEl) this.previewEmailEl.textContent = quote.email || '-';
            if (this.previewPhoneEl) this.previewPhoneEl.textContent = quote.phone || '-';
        }

        if (this.previewBadgeEl) {
            this.previewBadgeEl.textContent = this.getStatusLabel(quote.status);
        }
    },

    renderHistory(quote) {
        if (!this.historyEl) {
            return;
        }

        const history = Array.isArray(quote?.history) ? [...quote.history].reverse() : [];
        this.historyEl.innerHTML = history.length
            ? history.map((entry) => `
                <article class="commercial-history-item">
                    <strong>${escapeHtml(entry.title || 'Movimiento')}</strong>
                    <span>${escapeHtml(formatDateShort(entry.date || ''))}${entry.detail ? ` · ${escapeHtml(entry.detail)}` : ''}</span>
                </article>
            `).join('')
            : '<div class="commercial-empty-state">Sin historial disponible.</div>';
    },

    renderItemRows() {
        if (!this.itemsBodyEl || !this.currentQuote) {
            return;
        }

        const items = Array.isArray(this.currentQuote.items) ? this.currentQuote.items : [];
        this.itemsBodyEl.innerHTML = items.length
            ? items.map((item, index) => `
                <tr class="commercial-items-row" data-item-index="${index}">
                    <td><input type="text" class="control__input" data-item-field="description" value="${escapeHtml(item.description || '')}" placeholder="Descripción"></td>
                    <td><input type="number" min="1" step="1" class="control__input" data-item-field="quantity" value="${Number(item.quantity) || 1}"></td>
                    <td><input type="number" min="0" step="1000" class="control__input" data-item-field="price" value="${Number(item.price) || 0}"></td>
                    <td><span class="commercial-items-row__subtotal">${escapeHtml(this.formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0)))} </span></td>
                    <td><button type="button" class="commercial-items-row__remove" data-remove-item>Eliminar</button></td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" class="commercial-empty-state">Agrega al menos un producto o servicio.</td></tr>';
    },

    addItemRow() {
        if (!this.currentQuote) {
            this.currentQuote = this.getActiveQuoteTemplate();
        }

        this.currentQuote.items = Array.isArray(this.currentQuote.items) ? this.currentQuote.items : [];
        this.currentQuote.items.push({ description: '', quantity: 1, price: 0 });
        this.renderItemRows();
        this.recalculateTotals();
    },

    removeItemRow(itemIndex) {
        if (!this.currentQuote?.items) {
            return;
        }

        this.currentQuote.items.splice(itemIndex, 1);
        if (!this.currentQuote.items.length) {
            this.currentQuote.items.push({ description: '', quantity: 1, price: 0 });
        }
        this.renderItemRows();
        this.recalculateTotals();
    },

    updateItemFromInput(target) {
        if (!this.currentQuote?.items) {
            return;
        }

        const row = target.closest('.commercial-items-row');
        if (!row) {
            return;
        }

        const itemIndex = Number.parseInt(row.dataset.itemIndex || '0', 10);
        const field = target.dataset.itemField;
        const item = this.currentQuote.items[itemIndex];
        if (!item || !field) {
            return;
        }

        if (field === 'description') {
            item.description = target.value;
        } else if (field === 'quantity') {
            item.quantity = Math.max(1, Number(target.value) || 1);
        } else if (field === 'price') {
            item.price = Math.max(0, Number(target.value) || 0);
        }

        const subtotalCell = row.querySelector('.commercial-items-row__subtotal');
        if (subtotalCell) {
            subtotalCell.textContent = this.formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0));
        }

        this.recalculateTotals();
    },

    recalculateTotals() {
        if (!this.currentQuote) {
            return;
        }

        const totals = this.getQuoteTotals(this.currentQuote);
        if (this.subtotalEl) this.subtotalEl.value = this.formatMoney(totals.subtotal);
        if (this.taxEl) this.taxEl.value = this.formatMoney(totals.tax);
        if (this.totalEl) this.totalEl.value = this.formatMoney(totals.total);
    },

    syncQuoteFromForm() {
        if (!this.currentQuote) {
            this.currentQuote = this.getActiveQuoteTemplate();
        }

        this.currentQuote.id = this.quoteIdEl?.value || this.currentQuote.id;
        this.currentQuote.date = this.quoteDateEl?.value || this.currentQuote.date;
        this.currentQuote.clientId = this.clientSelectEl?.value || this.currentQuote.clientId || '';
        this.currentQuote.contactName = this.quoteNameEl?.value.trim() || this.currentQuote.contactName;
        this.currentQuote.company = this.quoteCompanyEl?.value.trim() || this.currentQuote.company;
        this.currentQuote.cliente = this.quoteCompanyEl?.value.trim() || this.currentQuote.cliente || this.currentQuote.company;
        this.currentQuote.email = this.quoteEmailEl?.value.trim() || this.currentQuote.email;
        this.currentQuote.phone = this.quotePhoneEl?.value.trim() || this.currentQuote.phone;
        this.currentQuote.responsible = this.quoteResponsibleEl?.value.trim() || this.currentQuote.responsible;
        this.currentQuote.status = this.normalizeStatus(this.quoteStatusEl?.value || this.currentQuote.status);
    },

    persistQuote() {
        this.syncQuoteFromForm();
        const quote = JSON.parse(JSON.stringify(this.currentQuote));
        const totals = this.getQuoteTotals(quote);
        quote.total = totals.total;
        quote.items = Array.isArray(quote.items) ? quote.items : [{ description: '', quantity: 1, price: 0 }];

        const targetIndex = this.quotes.findIndex((item) => item.id === this.currentQuoteId || item.id === quote.id);

        if (targetIndex >= 0) {
            this.quotes[targetIndex] = quote;
        } else {
            this.quotes.unshift(quote);
        }

        this.currentQuoteId = quote.id;
        this.currentQuote = JSON.parse(JSON.stringify(quote));
        this.saveData();
        this._saveToSupabase(quote);
        this.populateClientSelect();
        this.render();
    },

    addHistoryEntry(quote, title, detail) {
        const today = new Date().toISOString().slice(0, 10);
        quote.history = Array.isArray(quote.history) ? quote.history : [];
        quote.history.push({ date: today, title, detail });
    },

    saveDraft() {
        this.syncQuoteFromForm();
        this.currentQuote.status = 'borrador';
        this.addHistoryEntry(this.currentQuote, 'Borrador guardado', 'La cotización se guardó como borrador.');
        this.persistQuote();
        this.populateDrawer();
    },

    sendQuote() {
        this.syncQuoteFromForm();
        this.currentQuote.status = 'enviada';
        this.addHistoryEntry(this.currentQuote, 'Cotización enviada', 'Se marcó para revisión del cliente.');
        this.persistQuote();
        this.populateDrawer();
    },

    approveQuote() {
        this.syncQuoteFromForm();
        this.currentQuote.status = 'aprobada';
        this.addHistoryEntry(this.currentQuote, 'Cotización aprobada', 'El documento fue aprobado comercialmente.');
        this.persistQuote();
        this.populateDrawer();
    },

    rejectQuote() {
        this.syncQuoteFromForm();
        this.currentQuote.status = 'rechazada';
        this.addHistoryEntry(this.currentQuote, 'Cotización rechazada', 'El cliente o el equipo comercial marcó rechazo.');
        this.persistQuote();
        this.populateDrawer();
    },

    updateQuoteStatus(quoteId, status, detail) {
        const quote = this.quotes.find((item) => item.id === quoteId);
        if (!quote) {
            return;
        }

        quote.status = this.normalizeStatus(status);
        this.addHistoryEntry(quote, this.getStatusLabel(quote.status), detail);
        this.saveData();

        if (quote.dbId) {
            fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_cotizacion_estado', id: quote.dbId, estado: quote.status })
            }).catch(e => console.warn('Error actualizando estado en servidor:', e.message));
        }

        if (this.currentQuoteId === quoteId) {
            this.currentQuote = JSON.parse(JSON.stringify(quote));
            this.populateDrawer();
        }
        this.render();
    },

    duplicateQuote(quoteId) {
        const quote = this.quotes.find((item) => item.id === quoteId);
        if (!quote) {
            return;
        }

        if (quote.dbId) {
            fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'duplicate_cotizacion', id: quote.dbId })
            }).then(r => r.json()).then(result => {
                if (result.ok && result.cotizacion) {
                    this.quotes.unshift(this._supabaseToQuote(result.cotizacion));
                    this.saveData();
                    this.render();
                }
            }).catch(e => console.warn('Error duplicando en servidor:', e.message));
        } else {
            const cloned = JSON.parse(JSON.stringify(quote));
            const today = new Date().toISOString().slice(0, 10);
            cloned.id = this.getNextQuoteId();
            cloned.date = today;
            cloned.status = 'borrador';
            cloned.history = [{ date: today, title: 'Cotización duplicada', detail: `Copiada desde ${quote.id}.` }];
            this.quotes.unshift(cloned);
            this.saveData();
            this.render();
        }
    },

    deleteQuote(quoteId) {
        const quote = this.quotes.find((item) => item.id === quoteId);
        if (!quote) {
            return;
        }

        const confirmed = window.confirm(`¿Eliminar la cotización ${quoteId}?`);
        if (!confirmed) {
            return;
        }

        this.quotes = this.quotes.filter((item) => item.id !== quoteId);
        if (this.currentQuoteId === quoteId) {
            this.currentQuoteId = null;
            this.closeDrawer();
        }
        this.saveData();

        if (quote.dbId) {
            fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_cotizacion', id: quote.dbId })
            }).catch(e => console.warn('Error eliminando del servidor:', e.message));
        }

        this.render();
    },

    downloadPdf(quoteId = null) {
        this.syncQuoteFromForm();
        const quote = quoteId ? this.quotes.find((item) => item.id === quoteId) : this.currentQuote;
        if (!quote) {
            return;
        }

        const totals = this.getQuoteTotals(quote);
        const pdfApi = window.jspdf?.jsPDF;

        if (!pdfApi) {
            this.openPrintView(quote, totals);
            return;
        }

        const pdf = new pdfApi({ unit: 'pt', format: 'a4' });
        const marginX = 40;
        let cursorY = 48;

        pdf.setFillColor(0, 58, 128);
        pdf.rect(0, 0, 595, 90, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text('Gestión de Cotizaciones - HIGH TEST', marginX, 34);
        pdf.setFontSize(11);
        pdf.text(`Cotización ${quote.id}`, marginX, 55);
        pdf.text(`Fecha: ${formatDateShort(quote.date)}`, marginX, 72);

        pdf.setTextColor(20, 27, 41);
        cursorY = 120;
        pdf.setFontSize(14);
        pdf.text('Cliente', marginX, cursorY);
        pdf.setFontSize(11);
        cursorY += 18;
        pdf.text(`Cliente: ${quote.cliente || quote.company || ''}`, marginX, cursorY);
        cursorY += 16;
        pdf.text(`Informe a Nombre de: ${quote.informeNombre || ''}`, marginX, cursorY);
        cursorY += 16;
        pdf.text(`Contacto: ${quote.contactName || ''}`, marginX, cursorY);
        cursorY += 16;
        pdf.text(`Correo: ${quote.email || ''}`, marginX, cursorY);
        cursorY += 16;
        pdf.text(`Teléfono: ${quote.phone || ''}`, marginX, cursorY);

        cursorY += 28;
        pdf.setFontSize(14);
        pdf.text('Detalle de ítems', marginX, cursorY);
        cursorY += 16;
        pdf.setFontSize(10);
        pdf.text('Descripción', marginX, cursorY);
        pdf.text('Cant.', 320, cursorY, { align: 'right' });
        pdf.text('Precio', 420, cursorY, { align: 'right' });
        pdf.text('Subtotal', 520, cursorY, { align: 'right' });
        cursorY += 10;
        pdf.line(marginX, cursorY, 555, cursorY);
        cursorY += 16;

        (quote.items || []).forEach((item) => {
            const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.price) || 0);
            const description = String(item.description || '').slice(0, 60);
            pdf.text(description, marginX, cursorY);
            pdf.text(String(Number(item.quantity) || 0), 320, cursorY, { align: 'right' });
            pdf.text(this.formatMoney(item.price), 420, cursorY, { align: 'right' });
            pdf.text(this.formatMoney(itemSubtotal), 520, cursorY, { align: 'right' });
            cursorY += 16;
        });

        cursorY += 12;
        pdf.line(marginX, cursorY, 555, cursorY);
        cursorY += 20;
        pdf.setFontSize(11);
        pdf.text(`Subtotal: ${this.formatMoney(totals.subtotal)}`, 420, cursorY, { align: 'right' });
        cursorY += 16;
        pdf.text(`IVA (19%): ${this.formatMoney(totals.tax)}`, 420, cursorY, { align: 'right' });
        cursorY += 16;
        pdf.setFontSize(13);
        pdf.text(`Total: ${this.formatMoney(totals.total)}`, 420, cursorY, { align: 'right' });

        pdf.save(`${quote.id}.pdf`);
    },

    openPrintView(quote, totals) {
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        if (!printWindow) {
            return;
        }

        const rows = (quote.items || []).map((item) => `
            <tr>
                <td>${escapeHtml(item.description || '')}</td>
                <td>${escapeHtml(String(item.quantity || 0))}</td>
                <td>${escapeHtml(this.formatMoney(item.price || 0))}</td>
                <td>${escapeHtml(this.formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0)))}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>${escapeHtml(quote.id)}</title>
                <style>
                    body{font-family:Arial,sans-serif;padding:32px;color:#111827}
                    h1{margin:0 0 8px}
                    table{width:100%;border-collapse:collapse;margin-top:18px}
                    th,td{border:1px solid #d1d5db;padding:10px;text-align:left}
                    th{background:#eef4ff}
                </style>
            </head>
            <body>
                <h1>Gestión de Cotizaciones - HIGH TEST</h1>
                <p><strong>Cotización:</strong> ${escapeHtml(quote.id)}</p>
                <p><strong>Cliente:</strong> ${escapeHtml(quote.company || '')}</p>
                <p><strong>Fecha:</strong> ${escapeHtml(formatDateShort(quote.date))}</p>
                <table>
                    <thead>
                        <tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <p><strong>Subtotal:</strong> ${escapeHtml(this.formatMoney(totals.subtotal))}</p>
                <p><strong>IVA:</strong> ${escapeHtml(this.formatMoney(totals.tax))}</p>
                <p><strong>Total:</strong> ${escapeHtml(this.formatMoney(totals.total))}</p>
                <script>window.onload = function(){ window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },
};

if (typeof window !== 'undefined') {
    window.CommercialQuotesModule = CommercialQuotesModule;
}

// ===========================
// GESTOR DE LISTA DE CHEQUEO (ADMIN)
// ===========================

const ChecklistEnsayosManager = {
    currentUser: null,

    init() {
        this.loadUserFromStorage();
        if (!this.currentUser) {
            // Si no hay usuario HIGH TEST autenticado, redirigir al home
            window.location.href = 'index.html';
            return;
        }
        this.setupPdfButton();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupPdfButton() {
        const btn = document.getElementById('btnChecklistPdf');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const section = document.querySelector('.admin-section');
            if (!section) return;

            if (typeof html2pdf === 'undefined') {
                alert('No se pudo generar el PDF en este momento.');
                return;
            }

            const today = new Date().toISOString().slice(0, 10);
            const filename = `FR-7.2-Checklist-${today}.pdf`;

            const opt = {
                margin:       10,
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.95 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(section).save();
        });
    }
};

// ===========================
// GESTOR DEL INFORME DE ENSAYOS (FR-7.8)
// ===========================

const InformeEnsayosManager = {
    currentUser: null,

    init() {
        this.loadUserFromStorage();
        if (!this.currentUser) {
            // Si no hay usuario HIGH TEST autenticado, redirigir al home
            window.location.href = 'index.html';
            return;
        }
        this.setupPdfButton();
    },

    loadUserFromStorage() {
        const stored = localStorage.getItem('hightest_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
        }
    },

    setupPdfButton() {
        const btn = document.getElementById('btnInformePdf');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const section = document.querySelector('.admin-section');
            if (!section) return;

            if (typeof html2pdf === 'undefined') {
                alert('No se pudo generar el PDF en este momento.');
                return;
            }

            const today = new Date().toISOString().slice(0, 10);
            const filename = `FR-7.8-Informe-Ensayos-${today}.pdf`;

            const opt = {
                margin:       10,
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.95 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(section).save();
        });
    }
};

// ===========================
// LECTURA DEL PARÁMETRO "inf" EN LA URL
// ===========================

function applyInfParamFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const infParam = params.get('inf');

        if (!infParam) {
            return; // No hay parámetro "inf", no hacemos nada
        }

        const input = document.getElementById('numeroInforme');

        if (!input) {
            console.error('❌ No se encontró el input con id="numeroInforme" para aplicar el parámetro "inf".');
            return;
        }

        input.value = infParam;

        // Si existe la función global validarInforme, la usamos;
        // de lo contrario intentamos simular el click en el botón.
        if (typeof window.validarInforme === 'function') {
            window.validarInforme();
        } else {
            const btn = document.getElementById('verifyReportBtn');
            if (btn) {
                btn.click();
            } else {
                console.warn('⚠️ No se encontró el botón con id="verifyReportBtn" ni la función validarInforme() para ejecutar la validación.');
            }
        }
    } catch (error) {
        console.error('❌ Error al procesar el parámetro "inf" desde la URL:', error);
    }
}

// ===========================
// INICIALIZACIÓN SEGÚN PÁGINA
// ===========================

// También inicializar el módulo principal por si el evento ya se disparó
if (document.readyState === 'loading') {
    console.log('📄 Estado: Documento aún se está cargando...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded: Iniciando aplicación...');
        initializePage();
    });
} else {
    console.log('📄 Estado: Documento ya está cargado - Inicializando...');
    initializePage();
}

// Función centralizada de inicialización
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop();
    console.log('🔍 Inicializando página:', currentPage);

    // Detección robusta basada en el DOM para evitar problemas
    // cuando la ruta cambia (por ejemplo, en móvil o hosting).
    const hasAdminPanel = document.getElementById('adminUserName');
    const hasChecklist = document.getElementById('btnChecklistPdf');
    const hasInforme = document.getElementById('btnInformePdf');
    const hasClientPortal = document.getElementById('clientPortal');
    const hasHomeMarkers = document.getElementById('authModal') || document.getElementById('loginBtn');

    if (hasAdminPanel) {
        console.log('🏢 Inicializando panel administrativo (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        AdminPanelManager.init();
        AnalisisProcesosModule.init();
    } else if (hasChecklist) {
        console.log('📋 Inicializando lista de chequeo de ensayos en sitio (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        ChecklistEnsayosManager.init();
    } else if (hasInforme) {
        console.log('📄 Inicializando informe de ensayos (FR-7.8) (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        InformeEnsayosManager.init();
    } else if (hasClientPortal) {
        console.log('👤 Inicializando portal de cliente (por DOM)');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
        ClientPortalManager.init();
    } else if (hasHomeMarkers) {
        console.log('🏠 Inicializando página principal (por DOM)');
        verifyDOMElements();
        AuthManager.init();
        CertificatesAuthManager.init();
        CertificatesManager.init();
        PublicReportVerifier.init();
        App.init();
        // Aplicar automáticamente el parámetro "inf" de la URL si existe
        applyInfParamFromUrl();
    } else {
        // Fallback: al menos activar tema y menú para que
        // el header funcione aunque no se reconozca la vista.
        console.warn('⚠️ No se reconoció la página actual. Inicializando módulos básicos por defecto.');
        ThemeManager.init();
        MobileMenu.init();
        StickyHeader.init();
    }

    console.log('✅ Inicialización completada');
}

// ===========================
// UTILIDADES GLOBALES
// ===========================

/**
 * Función para hacer scroll hacia arriba
 */
window.scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

/**
 * Función para enfocar en un elemento
 */
window.focusElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// ===========================
// LOGGING Y DEBUGGING
// ===========================

// Log de eventos importantes
document.addEventListener('click', (e) => {
    if (e.target.closest('button, a')) {
        const element = e.target.closest('button, a');
        const label = element.textContent.trim().substring(0, 50);
        if (label && !label.includes('•')) {
            console.log('📌 Acción:', label);
        }
    }
});

// ===========================
// GESTIÓN DE INFORMES PDF
// ===========================

const GestionInformesModule = {
    _initialized: false,
    _currentProcesoId: null,
    _informes: [],

    async init() {
        if (this._initialized) {
            this.populateClienteFilter();
            this.populateProcesosSelect();
            this.updateInformesStats();
            return;
        }
        this._initialized = true;
        this.populateClienteFilter();
        this.populateProcesosSelect();
        this.bindEvents();
        this.updateInformesStats();
    },

    populateClienteFilter() {
        const select = document.getElementById('informesClienteFilter');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Todos</option>';
        const procesos = PROCESOS_STORE?.all || [];
        const clientes = [...new Set(procesos.map(p => p.cliente || p.empresa || '').filter(Boolean))].sort();
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    },

    populateProcesosSelect() {
        const select = document.getElementById('informesProcesoSelect');
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '<option value="">Todos</option>';

        const clienteFilter = document.getElementById('informesClienteFilter')?.value || '';
        const monthFilter = document.getElementById('informesMonthFilter')?.value || '';
        const dateFrom = document.getElementById('informesDateFrom')?.value || '';
        const dateTo = document.getElementById('informesDateTo')?.value || '';

        const procesos = PROCESOS_STORE?.all || [];
        let filtered = procesos;

        if (clienteFilter) {
            filtered = filtered.filter(p => (p.cliente || p.empresa || '') === clienteFilter);
        }
        if (monthFilter) {
            filtered = filtered.filter(p => {
                const fecha = (p.fecha_entrega_cliente || '').substring(0, 7);
                return fecha === monthFilter;
            });
        }
        if (dateFrom) {
            filtered = filtered.filter(p => (p.fecha_entrega_cliente || '').substring(0, 10) >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(p => (p.fecha_entrega_cliente || '').substring(0, 10) <= dateTo);
        }

        filtered.forEach(p => {
            const num = p.numero_proceso || p.proceso_numero || '';
            if (!num || !p.id) return;
            const cliente = p.cliente || p.empresa || '';
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${num} — ${cliente}`;
            select.appendChild(opt);
        });
        if (currentVal) select.value = currentVal;
    },

    bindEvents() {
        const select = document.getElementById('informesProcesoSelect');
        const clienteFilter = document.getElementById('informesClienteFilter');
        const monthFilter = document.getElementById('informesMonthFilter');
        const dateFrom = document.getElementById('informesDateFrom');
        const dateTo = document.getElementById('informesDateTo');
        const btnCargar = document.getElementById('btnCargarInforme');
        const fileInput = document.getElementById('informeFileInput');
        const btnImportar = document.getElementById('btnImportarInformes');
        const btnLimpiar = document.getElementById('btnLimpiarFiltrosInformes');
        const closeHistory = document.getElementById('closeInformeHistoryModal');
        const closeHistoryBtn = document.getElementById('closeInformeHistoryBtn');

        const refreshProcesos = () => {
            this.populateProcesosSelect();
            this.onProcesoChange();
        };
        if (clienteFilter) clienteFilter.addEventListener('change', refreshProcesos);
        if (monthFilter) monthFilter.addEventListener('change', refreshProcesos);
        if (dateFrom) dateFrom.addEventListener('change', refreshProcesos);
        if (dateTo) dateTo.addEventListener('change', refreshProcesos);
        if (select) {
            select.addEventListener('change', () => this.onProcesoChange());
        }
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.limpiarFiltros());
        }
        if (btnCargar) {
            btnCargar.addEventListener('click', () => fileInput?.click());
        }
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.onFileSelected(e));
        }
        if (btnImportar) {
            btnImportar.addEventListener('click', () => this.importarInformes());
        }
        // Bulk upload
        const btnBulk = document.getElementById('btnCargaMasiva');
        const bulkFileInput = document.getElementById('bulkFileInput');
        const btnSelectBulk = document.getElementById('btnSelectBulkFiles');
        const btnStartBulk = document.getElementById('btnStartBulkUpload');
        const closeBulk = document.getElementById('closeBulkUploadModal');
        const closeBulkBtn = document.getElementById('closeBulkUploadBtn');

        if (btnBulk) btnBulk.addEventListener('click', () => this.openBulkModal());
        if (btnSelectBulk) btnSelectBulk.addEventListener('click', () => bulkFileInput?.click());
        if (bulkFileInput) bulkFileInput.addEventListener('change', (e) => this.onBulkFilesSelected(e));
        if (btnStartBulk) btnStartBulk.addEventListener('click', () => this.startBulkUpload());
        if (closeBulk) closeBulk.addEventListener('click', () => this.closeModal('bulkUploadModal'));
        if (closeBulkBtn) closeBulkBtn.addEventListener('click', () => this.closeModal('bulkUploadModal'));

        if (closeHistory) closeHistory.addEventListener('click', () => this.closeModal('informeHistoryModal'));
        if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', () => this.closeModal('informeHistoryModal'));

        // Botón procesos sin informe
        const btnFaltantes = document.getElementById('btnVerFaltantes');
        const closeFaltantes = document.getElementById('closeFaltantesModal');
        const closeFaltantesBtn = document.getElementById('closeFaltantesBtn');
        if (btnFaltantes) btnFaltantes.addEventListener('click', () => this.showProcesosFaltantes());
        if (closeFaltantes) closeFaltantes.addEventListener('click', () => this.closeModal('faltantesModal'));
        if (closeFaltantesBtn) closeFaltantesBtn.addEventListener('click', () => this.closeModal('faltantesModal'));

        // Resumen por cliente
        const btnResumen = document.getElementById('btnResumenCliente');
        const closeResumen = document.getElementById('closeResumenClienteModal');
        const closeResumenBtn = document.getElementById('closeResumenClienteBtn');
        if (btnResumen) btnResumen.addEventListener('click', () => this.showResumenCliente());
        if (closeResumen) closeResumen.addEventListener('click', () => this.closeModal('resumenClienteModal'));
        if (closeResumenBtn) closeResumenBtn.addEventListener('click', () => this.closeModal('resumenClienteModal'));

        // Cerrar modales con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('informeHistoryModal');
                this.closeModal('faltantesModal');
                this.closeModal('resumenClienteModal');
            }
        });
    },

    async onProcesoChange() {
        const select = document.getElementById('informesProcesoSelect');
        const clienteLabel = document.getElementById('informesClienteLabel');
        const btnCargar = document.getElementById('btnCargarInforme');
        const container = document.getElementById('informesListContainer');
        const clienteFilter = document.getElementById('informesClienteFilter')?.value || '';
        this._currentProcesoId = select?.value || null;

        // Si hay cliente seleccionado pero proceso es "Todos" → mostrar todos los informes del cliente
        if (!this._currentProcesoId && clienteFilter) {
            if (clienteLabel) clienteLabel.value = clienteFilter;
            if (btnCargar) btnCargar.disabled = true;
            await this.loadInformesByCliente(clienteFilter);
            return;
        }

        if (!this._currentProcesoId) {
            if (clienteLabel) clienteLabel.value = '';
            if (btnCargar) btnCargar.disabled = true;
            if (container) container.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">Seleccione un proceso o cliente para ver informes</div>';
            return;
        }

        // Cargar cliente del proceso
        const procesos = PROCESOS_STORE?.all || [];
        const proc = procesos.find(p => String(p.id) === String(this._currentProcesoId));
        if (clienteLabel) clienteLabel.value = proc?.cliente || proc?.empresa || '';
        if (btnCargar) btnCargar.disabled = false;

        // Mostrar/ocultar campo nombre personalizado solo para CIMA SAS
        const cimaWrapper = document.getElementById('cimaNombreArchivoWrapper');
        const cimaInput = document.getElementById('cimaNombreArchivo');
        const esCimaSas = (proc?.cliente || '').toUpperCase().includes('CIMA');
        if (cimaWrapper) cimaWrapper.style.display = esCimaSas ? 'block' : 'none';
        if (cimaInput && !esCimaSas) cimaInput.value = '';

        await this.loadInformes();
    },

    async loadInformesByCliente(clienteNombre) {
        const container = document.getElementById('informesListContainer');
        if (container) container.innerHTML = '<div style="text-align:center; padding:16px; color:#666;">Cargando informes del cliente...</div>';

        try {
            const monthFilter = document.getElementById('informesMonthFilter')?.value || '';
            const dateFrom = document.getElementById('informesDateFrom')?.value || '';
            const dateTo = document.getElementById('informesDateTo')?.value || '';

            let procesos = PROCESOS_STORE?.all || [];
            procesos = procesos.filter(p => (p.cliente || p.empresa || '') === clienteNombre);

            if (monthFilter) {
                procesos = procesos.filter(p => (p.fecha_entrega_cliente || '').substring(0, 7) === monthFilter);
            }
            if (dateFrom) {
                procesos = procesos.filter(p => (p.fecha_entrega_cliente || '').substring(0, 10) >= dateFrom);
            }
            if (dateTo) {
                procesos = procesos.filter(p => (p.fecha_entrega_cliente || '').substring(0, 10) <= dateTo);
            }

            const ids = procesos.map(p => p.id).filter(Boolean);

            if (ids.length === 0) {
                if (container) container.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">No se encontraron procesos con esas fechas de entrega</div>';
                return;
            }

            let allInformes = [];
            for (const pid of ids) {
                const result = await fetchFromDatabase('get_informes_proceso', { proceso_id: pid });
                const informes = result?.informes || [];
                informes.forEach(inf => {
                    const proc = procesos.find(p => String(p.id) === String(inf.proceso_id));
                    inf._numeroProceso = proc?.numero_proceso || proc?.proceso_numero || '';
                    inf._cliente = proc?.cliente || proc?.empresa || '';
                });
                allInformes = allInformes.concat(informes);
            }

            this._informes = allInformes;
            this.renderInformesListByCliente(clienteNombre, procesos);
        } catch (err) {
            console.error('Error cargando informes del cliente:', err);
            if (container) container.innerHTML = '<div style="text-align:center; padding:16px; color:#c62828;">Error al cargar informes</div>';
        }
    },

    renderInformesListByCliente(clienteNombre, procesos) {
        const container = document.getElementById('informesListContainer');
        if (!container) return;

        if (!this._informes || this._informes.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:32px; color:#999;">
                    <div style="font-size:48px; margin-bottom:12px;">📄</div>
                    <p>No hay informes para <strong>${escapeHtml(clienteNombre)}</strong></p>
                    <p style="font-size:13px;">${procesos.length} proceso(s) encontrado(s) sin informes</p>
                </div>`;
            return;
        }

        // Agrupar por proceso
        const grouped = {};
        this._informes.forEach(inf => {
            const key = inf.proceso_id;
            if (!grouped[key]) grouped[key] = { numero: inf._numeroProceso, cliente: inf._cliente, informes: [] };
            grouped[key].informes.push(inf);
        });

        let html = `<div style="margin-bottom:12px; font-size:13px; color:#666;">
            <strong>${this._informes.length}</strong> informe(s) de <strong>${Object.keys(grouped).length}</strong> proceso(s) — <strong>${escapeHtml(clienteNombre)}</strong>
        </div>`;

        Object.values(grouped).forEach(g => {
            const proc = (PROCESOS_STORE?.all || []).find(p => String(p.id) === String(g.informes[0]?.proceso_id));
            const fechaEntrega = proc?.fecha_entrega_cliente || '';
            html += `
                <div style="border:1px solid #ddd; border-radius:6px; margin-bottom:8px; padding:10px 14px;">
                    <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(g.numero)} — ${escapeHtml(g.cliente)}</div>`;
            g.informes.forEach(inf => {
                const fechaCarga = inf.created_at ? new Date(inf.created_at).toLocaleDateString('es-CO') : '';
                html += `
                    <div style="display:flex; align-items:center; gap:6px; padding:4px 0; font-size:13px; ${inf.activo ? 'color:#28a745;' : 'color:#999;'}">
                        <span style="background:${inf.activo ? '#28a745' : '#999'}; color:#fff; padding:1px 5px; border-radius:3px; font-size:10px;">v${inf.version}</span>
                        <span style="flex:1;">${escapeHtml(inf.nombre_documento || '')}</span>
                        <span style="font-size:10px; color:#999;" title="Fecha de carga"><span style="font-size:9px; color:#aaa;">Carga:</span> ${fechaCarga}</span>
                        ${fechaEntrega ? `<span style="font-size:10px; font-weight:600; color:#022859;" title="Entrega a cliente"><span style="font-size:9px; color:#aaa;">Entrega:</span> ${fechaEntrega.substring(0, 10)}</span>` : ''}
                        <button class="btn btn--small" onclick="GestionInformesModule.downloadPdf('${escapeHtml(inf.archivo_pdf || '')}', '${escapeHtml(inf.nombre_documento || '')}')" style="font-size:11px; padding:2px 8px; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer;">📥</button>
                    </div>`;
            });
            html += '</div>';
        });

        container.innerHTML = html;
    },

    limpiarFiltros() {
        const clienteFilter = document.getElementById('informesClienteFilter');
        const monthFilter = document.getElementById('informesMonthFilter');
        const dateFrom = document.getElementById('informesDateFrom');
        const dateTo = document.getElementById('informesDateTo');
        const select = document.getElementById('informesProcesoSelect');
        const clienteLabel = document.getElementById('informesClienteLabel');
        const container = document.getElementById('informesListContainer');
        const btnCargar = document.getElementById('btnCargarInforme');
        const cimaWrapper = document.getElementById('cimaNombreArchivoWrapper');
        const cimaInput = document.getElementById('cimaNombreArchivo');

        if (clienteFilter) clienteFilter.value = '';
        if (monthFilter) monthFilter.value = '';
        if (dateFrom) dateFrom.value = '';
        if (dateTo) dateTo.value = '';
        this.populateProcesosSelect();
        if (select) select.value = '';
        if (clienteLabel) clienteLabel.value = '';
        if (btnCargar) btnCargar.disabled = true;
        if (cimaWrapper) cimaWrapper.style.display = 'none';
        if (cimaInput) cimaInput.value = '';
        this._currentProcesoId = null;
        this._informes = [];
        if (container) container.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">Seleccione un proceso o cliente para ver informes</div>';
    },

    _bulkFiles: [],

    openBulkModal() {
        this._bulkFiles = [];
        this.openModal('bulkUploadModal');
        document.getElementById('bulkStep1').style.display = '';
        document.getElementById('bulkStep2').style.display = 'none';
        document.getElementById('bulkStep3').style.display = 'none';
        document.getElementById('bulkStep4').style.display = 'none';
        document.getElementById('btnStartBulkUpload').style.display = 'none';
        document.getElementById('btnSelectBulkFiles').style.display = '';
    },

    onBulkFilesSelected(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        this._bulkFiles = [];
        const previewBody = document.getElementById('bulkPreviewBody');
        const step1 = document.getElementById('bulkStep1');
        const step2 = document.getElementById('bulkStep2');
        const btnStart = document.getElementById('btnStartBulkUpload');
        const btnSelect = document.getElementById('btnSelectBulkFiles');
        const summary = document.getElementById('bulkSummary');

        step1.style.display = 'none';
        step2.style.display = '';
        btnStart.style.display = '';
        btnSelect.style.display = 'none';

        const procesos = PROCESOS_STORE?.all || [];
        const procesoMap = {};
        procesos.forEach(p => {
            if (p.numero_proceso) procesoMap[p.numero_proceso.trim()] = p;
        });

        let html = '';
        let encontrados = 0;
        let noEncontrados = 0;

        files.forEach(file => {
            const name = file.name;
            const match = name.match(/R26\s*\d{4}/i);
            let numProceso = '';
            let proc = null;
            let estado = '';
            let estadoClass = '';

            if (match) {
                numProceso = match[0].toUpperCase().replace(/\s+/g, ' ').trim();
                proc = procesoMap[numProceso];
            }

            if (proc) {
                encontrados++;
                estado = '✅ Encontrado';
                estadoClass = 'color:#28a745;';
                this._bulkFiles.push({ file, name, numProceso, procesoId: proc.id, cliente: proc.cliente || proc.empresa || '' });
            } else {
                noEncontrados++;
                estado = match ? '❌ No existe' : '⚠️ Sin R26';
                estadoClass = 'color:#c62828;';
                this._bulkFiles.push({ file, name, numProceso: numProceso || '-', procesoId: null, cliente: '' });
            }

            html += `<tr>
                <td style="padding:6px 8px; border-bottom:1px solid #eee; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${name}">${name}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #eee;">${numProceso || '-'}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #eee;">${proc?.cliente || '-'}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #eee; text-align:center; ${estadoClass} font-weight:600; font-size:11px;">${estado}</td>
            </tr>`;
        });

        previewBody.innerHTML = html;
        summary.innerHTML = `<strong>${files.length}</strong> archivos | <span style="color:#28a745;"><strong>${encontrados}</strong> encontrados</span> | <span style="color:#c62828;"><strong>${noEncontrados}</strong> sin proceso</span>`;

        e.target.value = '';
    },

    async startBulkUpload() {
        const validFiles = this._bulkFiles.filter(f => f.procesoId);
        if (!validFiles.length) {
            alert('No hay archivos válidos para importar');
            return;
        }

        const step2 = document.getElementById('bulkStep2');
        const step3 = document.getElementById('bulkStep3');
        const btnStart = document.getElementById('btnStartBulkUpload');
        const btnSelect = document.getElementById('btnSelectBulkFiles');
        const progressBar = document.getElementById('bulkProgressBar');
        const progressText = document.getElementById('bulkProgressText');
        const progressDetail = document.getElementById('bulkProgressDetail');

        step2.style.display = 'none';
        step3.style.display = '';
        btnStart.style.display = 'none';
        btnSelect.style.display = 'none';

        const filesToSend = [];
        for (const item of validFiles) {
            const base64 = await this.readFileAsBase64(item.file);
            filesToSend.push({ name: item.name, base64 });
        }

        const omitDuplicates = document.getElementById('bulkOptOmitDuplicates')?.checked;
        const createVersion = document.getElementById('bulkOptCreateVersion')?.checked;
        const replaceActive = document.getElementById('bulkOptReplaceActive')?.checked;

        progressText.textContent = `Subiendo ${filesToSend.length} archivos...`;
        progressBar.style.width = '10%';
        progressDetail.innerHTML = '<div style="color:#666;">Enviando al servidor...</div>';

        try {
            progressBar.style.width = '50%';
            const result = await fetchFromDatabase('upload_informes_bulk', {
                files: filesToSend,
                omit_duplicates: omitDuplicates,
                create_version: createVersion,
                replace_active: replaceActive
            });

            progressBar.style.width = '100%';

            if (!result?.ok) throw new Error(result?.error || 'Error desconocido');

            const r = result.resumen;
            let detailHtml = '';
            (result.resultados || []).forEach(item => {
                const icon = item.estado === 'importado' ? '✅' : item.estado === 'versionado' ? '🔄' : item.estado === 'duplicado' ? '⚠️' : '❌';
                detailHtml += `<div style="padding:2px 0;">${icon} ${item.archivo} ${item.numero_proceso ? '→ ' + item.numero_proceso : ''} ${item.version ? 'v' + item.version : ''} <span style="color:#999;">${item.detalle || ''}</span></div>`;
            });
            progressDetail.innerHTML = detailHtml;

            progressText.innerHTML = `<span style="color:#28a745; font-weight:600;">✅ Importación completada</span>`;

            // Show step4 result
            const step4 = document.getElementById('bulkStep4');
            const resultContent = document.getElementById('bulkResultContent');
            step3.style.display = 'none';
            step4.style.display = '';
            resultContent.innerHTML = `
                <div style="padding:16px; border:1px solid #28a745; border-radius:8px; background:#e8f5e9;">
                    <h3 style="margin:0 0 8px 0; color:#28a745;">✅ Importación completada</h3>
                    <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:13px;">
                        <span>Total: <strong>${r.total}</strong></span>
                        <span style="color:#28a745;">Importados: <strong>${r.importados}</strong></span>
                        <span style="color:#0288d1;">Versionados: <strong>${r.versionados}</strong></span>
                        <span style="color:#ff9800;">Duplicados: <strong>${r.duplicados}</strong></span>
                        <span style="color:#c62828;">Errores: <strong>${r.errores}</strong></span>
                    </div>
                </div>`;

            this.populateClienteFilter();
            this.populateProcesosSelect();
            this.updateInformesStats();

        } catch (err) {
            console.error('Error en carga masiva:', err);
            progressBar.style.width = '0%';
            progressText.innerHTML = `<span style="color:#c62828;">❌ Error: ${err.message}</span>`;
            progressDetail.innerHTML = '';
        }
    },

    async loadInformes() {
        if (!this._currentProcesoId) return;
        const container = document.getElementById('informesListContainer');
        if (container) container.innerHTML = '<div style="text-align:center; padding:16px; color:#666;">Cargando informes...</div>';

        try {
            const result = await fetchFromDatabase('get_informes_proceso', { proceso_id: this._currentProcesoId });
            this._informes = result?.informes || [];
            this.renderInformesList();
        } catch (err) {
            console.error('Error cargando informes:', err);
            if (container) container.innerHTML = '<div style="text-align:center; padding:16px; color:#c62828;">Error al cargar informes</div>';
        }
    },

    renderInformesList() {
        const container = document.getElementById('informesListContainer');
        if (!container) return;

        if (!this._informes || this._informes.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:32px; color:#999;">
                    <div style="font-size:48px; margin-bottom:12px;">📄</div>
                    <p>No hay informes para este proceso</p>
                    <p style="font-size:13px;">Haga clic en "Cargar Informe" para subir el primer PDF</p>
                </div>`;
            return;
        }

        const activos = this._informes.filter(i => i.activo);
        const proc = (PROCESOS_STORE?.all || []).find(p => String(p.id) === String(this._currentProcesoId));
        const fechaEntrega = proc?.fecha_entrega_cliente || '';
        const esCimaSas = (proc?.cliente || '').toUpperCase().includes('CIMA');
        let html = '';

        // Informes activos destacados
        if (activos.length > 0) {
            activos.forEach((activo, idx) => {
                const label = esCimaSas && activos.length > 1 ? `ACTIVO ${idx + 1} — v${activo.version}` : `ACTIVO — v${activo.version}`;
                html += `
                    <div style="background:#e8f5e9; border:2px solid #28a745; border-radius:8px; padding:16px; margin-bottom:16px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                            <div>
                                <span style="background:#28a745; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">${label}</span>
                                <strong style="margin-left:8px;">${escapeHtml(activo.nombre_documento || 'Informe')}</strong>
                                <span style="font-size:10px; color:#999; margin-left:6px;" title="Fecha de carga"><span style="font-size:9px; color:#aaa;">Carga:</span> ${escapeHtml(activo.created_at ? new Date(activo.created_at).toLocaleDateString('es-CO') : '-')}</span>
                                ${fechaEntrega ? `<span style="font-size:10px; font-weight:600; color:#022859; margin-left:8px;" title="Entrega a cliente"><span style="font-size:9px; color:#aaa;">Entrega:</span> ${fechaEntrega.substring(0, 10)}</span>` : ''}
                            </div>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn--small" onclick="GestionInformesModule.downloadPdf('${escapeHtml(activo.archivo_pdf || '')}', '${escapeHtml(activo.nombre_documento || 'informe')}')" style="font-size:12px; padding:4px 12px; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:600;">📥 Descargar</button>
                                <button class="btn btn--small btn--secondary" onclick="GestionInformesModule.showHistory()">📜 Historial</button>
                            </div>
                        </div>
                    </div>`;
            });
        }

        // Botón para cargar nueva versión
        html += `
            <div style="margin-bottom:16px;">
                <button class="btn btn--primary" onclick="document.getElementById('informeFileInput').click()">
                    📄 Cargar Nuevo Informe
                </button>
            </div>`;

        container.innerHTML = html;
    },

    async updateInformesStats() {
        try {
            const result = await fetchFromDatabase('get_informes_stats', {});
            if (!result?.ok) return;
            const s = result.stats || {};

            const totalEl = document.getElementById('informeStatTotal');
            const vigentesEl = document.getElementById('informeStatVigentes');
            const faltantesEl = document.getElementById('informeStatFaltantes');
            const ultimoEl = document.getElementById('informeStatUltimo');

            if (totalEl) totalEl.querySelector('div:last-child').textContent = s.total || 0;
            if (vigentesEl) vigentesEl.querySelector('div:last-child').textContent = s.vigentes || 0;
            if (faltantesEl) faltantesEl.querySelector('div:last-child').textContent = s.procesos_sin_informe || 0;
            if (ultimoEl) {
                const fecha = s.ultimo_cargado;
                ultimoEl.querySelector('div:last-child').textContent = fecha
                    ? new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
            }
        } catch (err) {
            console.error('Error cargando stats informes:', err);
        }
    },

    async onFileSelected(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Solo se permiten archivos PDF');
            e.target.value = '';
            return;
        }
        if (!this._currentProcesoId) {
            alert('Seleccione un proceso primero');
            e.target.value = '';
            return;
        }

        await this.uploadPdf(file);
        e.target.value = '';
    },

    async uploadPdf(file) {
        const progressDiv = document.getElementById('informeUploadProgress');
        const progressBar = document.getElementById('informeProgressBar');
        const progressText = document.getElementById('informeProgressText');
        if (progressDiv) progressDiv.style.display = 'block';
        if (progressBar) progressBar.style.width = '30%';
        if (progressText) progressText.textContent = 'Leyendo archivo PDF...';

        try {
            // 1. Leer archivo como base64
            const fileBase64 = await this.readFileAsBase64(file);
            const fileExt = file.name.split('.').pop() || 'pdf';

            // Usar nombre personalizado si se ingresó (CIMA SAS), sino usar nombre del archivo
            const cimaInput = document.getElementById('cimaNombreArchivo');
            const customName = cimaInput?.value?.trim() || '';
            const nombreDocumento = customName || file.name.replace(/\.pdf$/i, '');

            if (progressBar) progressBar.style.width = '50%';
            if (progressText) progressText.textContent = 'Subiendo a Storage y registrando...';

            // 2. Enviar al backend (Storage upload + DB insert en un solo paso)
            const result = await fetchFromDatabase('upload_informe_file', {
                proceso_id: this._currentProcesoId,
                nombre_documento: nombreDocumento,
                file_base64: fileBase64,
                file_mime: file.type || 'application/pdf',
                file_ext: fileExt
            });

            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = '¡Informe cargado exitosamente!';

            // Limpiar campo personalizado después de subir
            if (cimaInput) cimaInput.value = '';

            setTimeout(() => {
                if (progressDiv) progressDiv.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
            }, 2000);

            await this.loadInformes();

        } catch (err) {
            console.error('Error subiendo informe:', err);
            if (progressText) progressText.textContent = `Error: ${err.message}`;
            if (progressBar) progressBar.style.width = '0%';
            setTimeout(() => {
                if (progressDiv) progressDiv.style.display = 'none';
            }, 4000);
        }
    },

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async downloadPdf(archivoUrl, nombre) {
        return downloadPdfFile(archivoUrl, nombre);
    },

    async showHistory() {
        if (!this._currentProcesoId) return;
        const body = document.getElementById('informeHistoryBody');
        if (!body) return;

        body.innerHTML = '<div style="text-align:center; padding:16px; color:#666;">Cargando historial...</div>';
        this.openModal('informeHistoryModal');

        try {
            const result = await fetchFromDatabase('get_informes_proceso', { proceso_id: this._currentProcesoId });
            const informes = result?.informes || [];

            if (informes.length === 0) {
                body.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">No hay versiones registradas</div>';
                return;
            }

            let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
            informes.forEach((inf) => {
                const isActivo = inf.activo;
                const fecha = inf.created_at ? new Date(inf.created_at).toLocaleString('es-CO') : '-';
                html += `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; border:1px solid ${isActivo ? '#28a745' : '#ddd'}; border-radius:6px; background:${isActivo ? '#e8f5e9' : '#fafafa'};">
                        <div>
                            <span style="background:${isActivo ? '#28a745' : '#999'}; color:#fff; padding:2px 6px; border-radius:3px; font-size:11px;">v${inf.version}</span>
                            <strong style="margin-left:8px; font-size:13px;">${escapeHtml(inf.nombre_documento || 'Informe')}</strong>
                            <div style="font-size:12px; color:#666; margin-top:4px;">${fecha}</div>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn--small" onclick="GestionInformesModule.downloadPdf('${escapeHtml(inf.archivo_pdf || '')}', '${escapeHtml(inf.nombre_documento || 'informe')}')" style="font-size:12px; padding:2px 8px; background:#28a745; color:#fff; border:none; border-radius:4px; cursor:pointer;">📥</button>
                            ${!isActivo ? `<button class="btn btn--small" onclick="GestionInformesModule.deleteInforme('${inf.id}')" style="font-size:12px; color:#c62828; border-color:#c62828;">🗑️</button>` : ''}
                        </div>
                    </div>`;
            });
            html += '</div>';
            body.innerHTML = html;
        } catch (err) {
            console.error('Error cargando historial:', err);
            body.innerHTML = '<div style="text-align:center; padding:16px; color:#c62828;">Error al cargar historial</div>';
        }
    },

    async deleteInforme(id) {
        if (!confirm('¿Está seguro de eliminar este informe?')) return;
        try {
            await fetchFromDatabase('delete_informe', { id });
            await this.loadInformes();
        } catch (err) {
            console.error('Error eliminando informe:', err);
            alert('Error al eliminar informe');
        }
    },

    async importarInformes() {
        const btn = document.getElementById('btnImportarInformes');
        const resultContainer = document.getElementById('importResultContainer');
        if (!btn) return;

        if (!confirm('Se leerán todos los PDFs del bucket "Informes" y se crearán registros faltantes en informes_ensayo_ac. ¿Continuar?')) return;

        btn.disabled = true;
        btn.textContent = '⏳ Importando...';
        if (resultContainer) {
            resultContainer.style.display = 'block';
            resultContainer.innerHTML = '<div style="padding:16px; text-align:center; color:#666;">Leyendo archivos del Storage...</div>';
        }

        try {
            const result = await fetchFromDatabase('import_informes_from_storage', {});

            if (!result?.ok) {
                throw new Error(result?.error || 'Error desconocido');
            }

            const r = result.resumen;
            let html = `
                <div style="padding:16px; border:1px solid #28a745; border-radius:8px; background:#e8f5e9;">
                    <h3 style="margin:0 0 12px 0; color:#28a745;">✅ Importación completada</h3>
                    <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:12px;">
                        <span><strong>${r.total_archivos}</strong> archivos encontrados</span>
                        <span style="color:#28a745;"><strong>${r.importados}</strong> importados</span>
                        <span style="color:#ff9800;"><strong>${r.duplicados}</strong> duplicados</span>
                        <span style="color:#f44336;"><strong>${r.errores}</strong> errores</span>
                        <span style="color:#999;"><strong>${r.sin_proceso}</strong> sin proceso</span>
                    </div>`;

            if (result.resultados && result.resultados.length > 0) {
                html += '<div style="max-height:300px; overflow-y:auto;">';
                result.resultados.forEach(item => {
                    const icon = item.estado === 'importado' ? '✅' :
                                 item.estado === 'duplicado' ? '⚠️' :
                                 item.estado === 'error' ? '❌' : 'ℹ️';
                    html += `<div style="padding:4px 0; border-bottom:1px solid #ddd; font-size:13px;">
                        ${icon} <span style="font-weight:600;">${item.archivo}</span>
                        <span style="color:#666; margin-left:8px;">${item.detalle || item.estado}${item.numero_proceso ? ' → ' + item.numero_proceso : ''}</span>
                    </div>`;
                });
                html += '</div>';
            }

            html += '</div>';
            if (resultContainer) resultContainer.innerHTML = html;

            // Recargar select de procesos
            this.populateClienteFilter();
            this.populateProcesosSelect();
            this.updateInformesStats();

        } catch (err) {
            console.error('Error importando informes:', err);
            if (resultContainer) {
                resultContainer.innerHTML = `<div style="padding:16px; border:1px solid #c62828; border-radius:8px; background:#ffebee; color:#c62828;">
                    <strong>Error:</strong> ${err.message}
                </div>`;
            }
        } finally {
            btn.disabled = false;
            btn.textContent = '🔄 Importar Informes Existentes';
        }
    },

    async showProcesosFaltantes(clienteFiltro = null) {
        const content = document.getElementById('faltantesContent');
        if (!content) return;
        content.innerHTML = '<div style="text-align:center; padding:24px; color:#666;">Cargando procesos sin informe...</div>';
        this.openModal('faltantesModal');

        try {
            const result = await fetchFromDatabase('get_procesos_sin_informe', {});
            let procesos = result?.procesos || [];

            // Si hay filtro de cliente, mostrar solo los de ese cliente
            if (clienteFiltro) {
                procesos = procesos.filter(p => {
                    const cliente = (p.cliente || p.empresa || '').toLowerCase();
                    return cliente === clienteFiltro.toLowerCase();
                });
            }

            if (procesos.length === 0) {
                content.innerHTML = `
                    <div style="text-align:center; padding:32px; color:#28a745;">
                        <div style="font-size:48px; margin-bottom:12px;">✅</div>
                        <p style="font-size:16px; font-weight:600;">${clienteFiltro ? 'Este cliente tiene todos los informes cargados' : 'Todos los procesos tienen informe'}</p>
                        <p style="font-size:13px; color:#666;">No hay procesos pendientes por informe</p>
                    </div>`;
                return;
            }

            let html = `
                <div style="margin-bottom:12px; padding:10px; background:#fff3e0; border-radius:6px; border-left:3px solid #ff9800;">
                    <span style="font-weight:600; color:#e65100;">${procesos.length}</span> proceso(s) sin informe cargado
                    ${clienteFiltro ? ` — <strong>${escapeHtml(clienteFiltro)}</strong>` : ''}
                </div>
                <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
                    <input type="text" id="faltantesSearch" placeholder="🔍 Buscar por número o cliente..." 
                        style="flex:1; min-width:200px; padding:6px 10px; border:1px solid #ddd; border-radius:4px; font-size:12px;"
                        oninput="GestionInformesModule.filterFaltantes()">
                </div>
                <div id="faltantesTableContainer">
                    ${this._renderFaltantesTable(procesos)}
                </div>`;

            content.innerHTML = html;
            this._faltantesData = procesos;

        } catch (err) {
            console.error('Error cargando procesos sin informe:', err);
            content.innerHTML = `<div style="padding:16px; border:1px solid #c62828; border-radius:8px; background:#ffebee; color:#c62828;">
                <strong>Error:</strong> ${err.message}
            </div>`;
        }
    },

    _renderFaltantesTable(procesos) {
        if (!procesos || procesos.length === 0) {
            return '<div style="text-align:center; padding:24px; color:#999;">No se encontraron resultados</div>';
        }

        let html = `
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:12px;">
                    <thead style="background:#f5f5f5; border-bottom:2px solid #022859;">
                        <tr>
                            <th style="padding:8px; text-align:left; border:1px solid #ddd;">N° Proceso</th>
                            <th style="padding:8px; text-align:left; border:1px solid #ddd;">Cliente</th>
                            <th style="padding:8px; text-align:left; border:1px solid #ddd;">Fecha Recepción</th>
                            <th style="padding:8px; text-align:left; border:1px solid #ddd;">Fecha Entrega</th>
                            <th style="padding:8px; text-align:center; border:1px solid #ddd;">Acción</th>
                        </tr>
                    </thead>
                    <tbody>`;

        procesos.forEach(p => {
            const num = p.numero_proceso || '-';
            const cliente = p.cliente || p.empresa || '-';
            const fechaRec = p.fecha_recepcion ? new Date(p.fecha_recepcion).toLocaleDateString('es-CO') : '-';
            const fechaEnt = p.fecha_entrega_cliente ? new Date(p.fecha_entrega_cliente).toLocaleDateString('es-CO') : '-';
            const dias = p.fecha_entrega_cliente ? Math.ceil((new Date() - new Date(p.fecha_entrega_cliente)) / (1000 * 60 * 60 * 24)) : 0;
            const alerta = dias > 0 ? `color:#c62828; font-weight:600;` : '';

            html += `
                <tr style="border-bottom:1px solid #ddd;">
                    <td style="padding:8px; border:1px solid #ddd; font-weight:600;">${escapeHtml(num)}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${escapeHtml(cliente)}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${fechaRec}</td>
                    <td style="padding:8px; border:1px solid #ddd; ${alerta}">${fechaEnt}${dias > 0 ? ' (' + dias + ' días)' : ''}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">
                        <button class="btn btn--small btn--primary" onclick="GestionInformesModule.irACargarInforme('${escapeHtml(p.id)}')" style="font-size:11px; padding:2px 8px;">
                            📄 Cargar
                        </button>
                    </td>
                </tr>`;
        });

        html += '</tbody></table></div>';
        return html;
    },

    filterFaltantes() {
        const search = (document.getElementById('faltantesSearch')?.value || '').toLowerCase();
        const data = this._faltantesData || [];
        const filtered = data.filter(p => {
            const num = (p.numero_proceso || '').toLowerCase();
            const cliente = (p.cliente || p.empresa || '').toLowerCase();
            return num.includes(search) || cliente.includes(search);
        });
        const container = document.getElementById('faltantesTableContainer');
        if (container) container.innerHTML = this._renderFaltantesTable(filtered);
    },

    irACargarInforme(procesoId) {
        this.closeModal('faltantesModal');
        const select = document.getElementById('informesProcesoSelect');
        if (select) {
            select.value = procesoId;
            this.onProcesoChange();
        }
    },

    async showResumenCliente() {
        const content = document.getElementById('resumenClienteContent');
        if (!content) return;
        content.innerHTML = '<div style="text-align:center; padding:24px; color:#666;">Cargando resumen por cliente...</div>';
        this.openModal('resumenClienteModal');

        try {
            const procesos = PROCESOS_STORE?.all || [];
            if (procesos.length === 0) {
                content.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">No hay procesos cargados</div>';
                return;
            }

            // Agrupar procesos por cliente
            const clienteMap = {};
            procesos.forEach(p => {
                const cliente = p.cliente || p.empresa || 'Sin cliente';
                if (!clienteMap[cliente]) {
                    clienteMap[cliente] = { total: 0, conInforme: 0, sinInforme: 0, procesos: [] };
                }
                clienteMap[cliente].total++;
                clienteMap[cliente].procesos.push(p);
            });

            // Verificar cuáles tienen informe
            const clienteNames = Object.keys(clienteMap).sort();
            for (const cliente of clienteNames) {
                const procs = clienteMap[cliente].procesos;
                const ids = procs.map(p => p.id).filter(Boolean);
                let conInforme = 0;
                for (const pid of ids) {
                    try {
                        const result = await fetchFromDatabase('get_informes_proceso', { proceso_id: pid });
                        const informes = result?.informes || [];
                        if (informes.length > 0) conInforme++;
                    } catch (e) { /* skip */ }
                }
                clienteMap[cliente].conInforme = conInforme;
                clienteMap[cliente].sinInforme = clienteMap[cliente].total - conInforme;
            }

            // Renderizar tabla
            let html = `
                <div style="margin-bottom:12px; padding:10px; background:#e3f2fd; border-radius:6px; border-left:3px solid #1976d2;">
                    <span style="font-weight:600; color:#0d47a1;">${clienteNames.length}</span> cliente(s) — 
                    <span style="font-weight:600; color:#28a745;">${procesos.filter(p => clienteMap[p.cliente || p.empresa || 'Sin cliente']?.sinInforme === 0).length}</span> con todos los informes completos
                </div>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:12px;">
                        <thead style="background:#f5f5f5; border-bottom:2px solid #022859;">
                            <tr>
                                <th style="padding:8px; text-align:left; border:1px solid #ddd;">Cliente</th>
                                <th style="padding:8px; text-align:center; border:1px solid #ddd;">Total Procesos</th>
                                <th style="padding:8px; text-align:center; border:1px solid #ddd; color:#28a745;">Con Informe</th>
                                <th style="padding:8px; text-align:center; border:1px solid #ddd; color:#c62828;">Sin Informe</th>
                                <th style="padding:8px; text-align:center; border:1px solid #ddd;">%</th>
                                <th style="padding:8px; text-align:center; border:1px solid #ddd;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>`;

            clienteNames.forEach(cliente => {
                const data = clienteMap[cliente];
                const pct = data.total > 0 ? Math.round((data.conInforme / data.total) * 100) : 0;
                const pctColor = pct === 100 ? '#28a745' : pct >= 50 ? '#ff9800' : '#c62828';
                const sinInformeStyle = data.sinInforme > 0 ? 'color:#c62828; font-weight:700;' : 'color:#28a745;';

                html += `
                    <tr style="border-bottom:1px solid #ddd; ${data.sinInforme > 0 ? 'background:#fff8f8;' : ''}">
                        <td style="padding:8px; border:1px solid #ddd; font-weight:600;">${escapeHtml(cliente)}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center; font-weight:700;">${data.total}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center; color:#28a745; font-weight:600;">${data.conInforme}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center; ${sinInformeStyle}">${data.sinInforme}</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center; color:${pctColor}; font-weight:700;">${pct}%</td>
                        <td style="padding:8px; border:1px solid #ddd; text-align:center;">
                            ${data.sinInforme > 0 ? `<button class="btn btn--small" onclick="GestionInformesModule.filtrarClienteDesdeResumen('${escapeHtml(cliente)}')" style="font-size:11px; padding:2px 8px; background:#1976d2; color:#fff; border:none; border-radius:4px; cursor:pointer;">Ver faltantes</button>` : '<span style="color:#28a745;">✅</span>'}
                        </td>
                    </tr>`;
            });

            html += '</tbody></table></div>';
            content.innerHTML = html;

        } catch (err) {
            console.error('Error generando resumen por cliente:', err);
            content.innerHTML = `<div style="padding:16px; border:1px solid #c62828; border-radius:8px; background:#ffebee; color:#c62828;">
                <strong>Error:</strong> ${err.message}
            </div>`;
        }
    },

    filtrarClienteDesdeResumen(clienteNombre) {
        this.closeModal('resumenClienteModal');
        this.showProcesosFaltantes(clienteNombre);
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal--open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal--open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }
};

window.GestionInformesModule = GestionInformesModule;

// ===============================
// ANÁLISIS DE PROCESOS (modal)
// ===============================
const AnalisisProcesosModule = {
    init() {
        const btn = document.getElementById('btnAnalisisProcesos');
        const btnNoAcreditados = document.getElementById('btnAnalisisProcesosNoAcreditados');
        const close = document.getElementById('closeAnalisisProcesos');
        const closeBtn = document.getElementById('closeAnalisisBtn');
        const search = document.getElementById('analisisSearch');
        const filterEstado = document.getElementById('analisisFilterEstado');
        const filterMes = document.getElementById('analisisFilterMes');
        const closeVP = document.getElementById('closeVistaPreviaProceso');
        const closeVPBtn = document.getElementById('closeVistaPreviaBtn');

        if (btn) btn.addEventListener('click', () => this.open());
        if (btnNoAcreditados) btnNoAcreditados.addEventListener('click', () => this.open());
        if (close) close.addEventListener('click', () => this.close());
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        if (search) search.addEventListener('input', () => this.render());
        if (filterEstado) filterEstado.addEventListener('change', () => this.render());
        if (filterMes) filterMes.addEventListener('change', () => this.render());
        if (closeVP) closeVP.addEventListener('click', () => this.closeVistaPrevia());
        if (closeVPBtn) closeVPBtn.addEventListener('click', () => this.closeVistaPrevia());
    },

    open() {
        const modal = document.getElementById('analisisProcesosModal');
        if (modal) {
            modal.classList.add('modal--open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
        this.render();
    },

    close() {
        const modal = document.getElementById('analisisProcesosModal');
        if (modal) {
            modal.classList.remove('modal--open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    },

    getFilteredProcesses() {
        const search = (document.getElementById('analisisSearch')?.value || '').toLowerCase();
        const filtroEstado = (document.getElementById('analisisFilterEstado')?.value || '').toLowerCase();
        const filtroMes = document.getElementById('analisisFilterMes')?.value || '';

        const allRows = [
            ...(PROCESOS_STORE.filtered.active || []),
            ...(PROCESOS_STORE.filtered.finalized || [])
        ];

        const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_]+/g, '-');
        const aliasMap = { 'proceso-de-ensayo': 'en-proceso-de-ensayo', 'informe': 'informe-de-ensayo' };
        const normFiltro = aliasMap[normalize(filtroEstado)] || normalize(filtroEstado);

        return allRows.filter(row => {
            const num = (row.numero_proceso || '').toLowerCase();
            const cliente = (row.cliente || row.empresa || '').toLowerCase();
            const estado = normalize(row.estado || row.status || '');
            const fecha = row.fecha_entrega_cliente || row.fecha_recepcion || '';

            if (search && !num.includes(search) && !cliente.includes(search)) return false;
            if (normFiltro && estado !== normFiltro) return false;
            if (filtroMes && !(fecha || '').startsWith(filtroMes)) return false;
            return true;
        });
    },

    render() {
        const rows = this.getFilteredProcesses();
        const tableContainer = document.getElementById('analisisTablaContainer');
        if (!tableContainer) return;

        const total = rows.length;
        const finalizados = rows.filter(r => (r.estado || '').toLowerCase() === 'finalizado').length;
        const pendientes = total - finalizados;

        if (rows.length === 0) {
            tableContainer.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">No hay procesos con los filtros seleccionados</div>';
            return;
        }

        const monthNames = { '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun','07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic' };
        const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_]+/g, '-');

        let html = `<table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead style="background:#f5f5f5; border-bottom:2px solid #022859;">
                <tr>
                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">N° Proceso</th>
                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Cliente</th>
                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Informe a Nombre de</th>
                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Recepción</th>
                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Entrega</th>
                    <th style="padding:8px; text-align:center; border:1px solid #ddd;">Estado</th>
                    <th style="padding:8px; text-align:center; border:1px solid #ddd;">Informe</th>
                    <th style="padding:8px; text-align:center; border:1px solid #ddd;">Acción</th>
                </tr>
            </thead><tbody>`;

        rows.forEach(row => {
            const num = row.numero_proceso || '-';
            const cliente = row.cliente || row.empresa || '-';
            const informeNombre = row.informe_a_nombre_de || row.informeNombre || '-';
            const fechaRec = row.fecha_recepcion ? row.fecha_recepcion.substring(0, 10) : '-';
            const fechaEnt = row.fecha_entrega_cliente ? row.fecha_entrega_cliente.substring(0, 10) : '-';
            const estado = normalize(row.estado || row.status || '');
            const nInforme = row.n_informe || '-';

            let estadoLabel = row.estado || row.status || '-';
            let estadoColor = '#ff9800';
            if (estado === 'finalizado') { estadoColor = '#28a745'; }
            else if (estado === 'entrega-cliente') { estadoColor = '#17a2b8'; }
            else if (estado === 'en-proceso-de-ensayo') { estadoColor = '#6f42c1'; }
            else if (estado === 'recepcion') { estadoColor = '#007bff'; }
            else if (estado === 'lavado') { estadoColor = '#fd7e14'; }
            else if (estado === 'informe-de-ensayo') { estadoColor = '#e83e8c'; }

            html += `<tr style="border-bottom:1px solid #ddd;">
                <td style="padding:6px 8px; border:1px solid #ddd; font-weight:600;">${escapeHtml(num)}</td>
                <td style="padding:6px 8px; border:1px solid #ddd;">${escapeHtml(cliente)}</td>
                <td style="padding:6px 8px; border:1px solid #ddd;">${escapeHtml(informeNombre)}</td>
                <td style="padding:6px 8px; border:1px solid #ddd;">${fechaRec}</td>
                <td style="padding:6px 8px; border:1px solid #ddd;">${fechaEnt}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center;">
                    <span style="background:${estadoColor}; color:#fff; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:600;">${escapeHtml(estadoLabel)}</span>
                </td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center;">${escapeHtml(nInforme)}</td>
                <td style="padding:6px 8px; border:1px solid #ddd; text-align:center;">
                    <button class="btn btn--small btn--primary" onclick="AnalisisProcesosModule.verVistaPrevia('${escapeHtml(num)}')" style="font-size:11px; padding:2px 8px;">👁️ Ver</button>
                </td>
            </tr>`;
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    },

    async verVistaPrevia(numProceso, mode) {
        const content = document.getElementById('vistaPreviaProcesoContent');
        const modal = document.getElementById('vistaPreviaProcesoModal');
        if (!content || !modal) return;

        content.innerHTML = '<div style="text-align:center; padding:24px; color:#666;">Cargando datos del proceso...</div>';
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');

        try {
            const result = await fetchFromDatabase('get_proceso', { numero_proceso: numProceso });
            if (!result?.ok || !result.proceso) {
                content.innerHTML = '<div style="text-align:center; padding:24px; color:#c62828;">No se encontraron datos para este proceso</div>';
                return;
            }

            const p = result.proceso;

            // Intentar traer NIT desde la tabla clientes
            let nitEmpresa = '-';
            try {
                const clienteNombre = p.cliente || '';
                if (clienteNombre) {
                    const cliResult = await fetchFromDatabase('get_cliente_by_nombre', { nombre: clienteNombre });
                    if (cliResult?.ok && cliResult.cliente) {
                        nitEmpresa = cliResult.cliente.nit || cliResult.cliente.nit_empresa || '-';
                    }
                }
            } catch (e) { /* continuar sin NIT */ }

            // Intentar traer borrador completo por numero_proceso (ligero, ~150KB en vez de ~6MB)
            let borradorData = null;
            try {
                const borrResult = await fetchFromDatabase('get_borrador_completo', { cotizacion: numProceso });
                if (borrResult?.ok && borrResult.data) {
                    borradorData = borrResult.data;
                }
            } catch (e) { /* no hay borrador, continuar sin él */ }

            // Intentar traer detalle desde BD (fuente más actualizada que el borrador)
            let detalleFromDB = null;
            try {
                const detResult = await fetchFromDatabase('get_detalle_proceso', { proceso_id: p.id });
                if (detResult?.ok && Array.isArray(detResult.detalle) && detResult.detalle.length > 0) {
                    detalleFromDB = detResult.detalle;
                }
            } catch (e) { /* continuar sin detalle de BD */ }

            // Preferir detalle de BD sobre borrador para cantidades y marcas
            let items = [];
            let itemsNoAc = [];
            if (detalleFromDB && detalleFromDB.length > 0) {
                // Convertir detalle de BD al formato que espera la vista previa
                // BD tiene: ensayo_nombre, cantidad, marca, observaciones
                // Complementar con borrador si existe para campos no guardados en BD
                const borradorItems = borradorData?.items || borradorData?.savedRowsData?.ensayos_acreditados || [];
                const borradorArr = Array.isArray(borradorItems) ? borradorItems : Object.values(borradorItems);
                const borradorMap = {};
                borradorArr.forEach(b => { borradorMap[b.name || b.elemento] = b; });

                items = detalleFromDB.map(d => {
                    const nombre = d.ensayo_nombre || d.ensayo_id || '-';
                    const b = borradorMap[nombre] || {};
                    return {
                        name: nombre,
                        quantity: d.cantidad || 0,
                        quantity2: d.cantidad_entregada ?? b.quantity2 ?? 0,
                        quantity3: b.quantity3 || 0,
                        quantity4: b.quantity4 || 0,
                        status: b.status || 0,
                        brandSummary: (d.marcas && d.marcas.length > 0) ? d.marcas : (b.brandSummary || '-'),
                        observaciones: d.observaciones || b.observaciones || ''
                    };
                });
            } else {
                // Fallback: usar borrador
                items = borradorData?.items || borradorData?.savedRowsData?.ensayos_acreditados || [];
                itemsNoAc = borradorData?.savedRowsData?.ensayos_no_acreditados || [];
            }
            const allItems = Array.isArray(items) ? items : Object.values(items);
            const allItemsNoAc = Array.isArray(itemsNoAc) ? itemsNoAc : Object.values(itemsNoAc);
            const totalItems = [...allItems, ...allItemsNoAc];

            const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_]+/g, '-');
            const estado = normalize(p.estado || p.status || '');
            let estadoLabel = p.estado || p.status || '-';
            let estadoColor = '#ff9800';
            if (estado === 'finalizado') estadoColor = '#28a745';
            else if (estado === 'entrega-cliente') estadoColor = '#17a2b8';
            else if (estado === 'en-proceso-de-ensayo') estadoColor = '#6f42c1';
            else if (estado === 'recepcion') estadoColor = '#007bff';
            else if (estado === 'lavado') estadoColor = '#fd7e14';
            else if (estado === 'informe-de-ensayo') estadoColor = '#e83e8c';

            const num = p.numero_proceso || '-';
            const cliente = p.cliente || p.empresa || '-';
            const informeNombre = p.informe_a_nombre_de || '-';
            const facturarNombre = p.facturar_a_nombre_de || '-';
            const nRemision = p.n_remision || '-';
            const fechaRec = p.fecha_recepcion ? p.fecha_recepcion.substring(0, 10) : '-';
            const fechaEnt = p.fecha_entrega_cliente ? p.fecha_entrega_cliente.substring(0, 10) : '-';
            const nInforme = p.n_informe || '-';
            const lavado = borradorData?.lavado || '-';
            const responsableLavado = borradorData?.responsableLavado || '-';
            const observaciones = borradorData?.observaciones || p.observaciones || '';
            const signatureData = borradorData?.signatureData || {};

            // Calcular totales de items
            const totalRecibidos = totalItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            const totalEntregados = totalItems.reduce((sum, item) => sum + (Number(item.quantity2) || 0), 0);
            const totalLavadosItems = totalItems.reduce((sum, item) => sum + (Number(item.status) || 0), 0);

            // Helper marcas
            const getBrandText = (brandSummary) => {
                if (!brandSummary) return '-';
                if (Array.isArray(brandSummary)) return brandSummary.map(b => `${b.count || 0} ${b.brand || ''}`).join(', ');
                return String(brandSummary || '-');
            };

            // Generar tabla de items
            let itemsHTML = '';
            if (totalItems.length > 0) {
                const isFull = mode === 'full';
                itemsHTML = `<table style="width:100%; border-collapse:collapse; font-size:12px; margin-top:8px;">
                    <thead style="background:#f5f5f5; border-bottom:2px solid #022859;">
                        <tr>
                            <th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Elemento</th>
                            <th style="padding:6px 8px; border:1px solid #ddd; text-align:center;">Recibidos</th>
                            <th style="padding:6px 8px; border:1px solid #ddd; text-align:center;">Entregados</th>
                            <th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Marcas</th>
                            ${isFull ? '<th style="padding:6px 8px; border:1px solid #ddd; text-align:center;">No Usado</th><th style="padding:6px 8px; border:1px solid #ddd; text-align:center;">Usado</th><th style="padding:6px 8px; border:1px solid #ddd; text-align:center;">Lavados</th><th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Observaciones</th>' : ''}
                        </tr>
                    </thead><tbody>`;
                totalItems.forEach(item => {
                    itemsHTML += `<tr style="border-bottom:1px solid #ddd;">
                        <td style="padding:5px 8px; border:1px solid #ddd;">${escapeHtml(item.name || item.elemento || '-')}</td>
                        <td style="padding:5px 8px; border:1px solid #ddd; text-align:center;">${item.quantity || 0}</td>
                        <td style="padding:5px 8px; border:1px solid #ddd; text-align:center;">${item.quantity2 || 0}</td>
                        <td style="padding:5px 8px; border:1px solid #ddd;">${escapeHtml(getBrandText(item.brandSummary))}</td>
                        ${isFull ? `<td style="padding:5px 8px; border:1px solid #ddd; text-align:center;">${item.quantity3 || '-'}</td><td style="padding:5px 8px; border:1px solid #ddd; text-align:center;">${item.quantity4 || '-'}</td><td style="padding:5px 8px; border:1px solid #ddd; text-align:center;">${item.status || 0}</td><td style="padding:5px 8px; border:1px solid #ddd; text-align:left;">${escapeHtml(item.observaciones || '-')}</td>` : ''}
                    </tr>`;
                });
                itemsHTML += '</tbody></table>';
            }

            // Firmas
            const sigRec = (signatureData.signatureCanvasRecepcion || signatureData.signatureCanvas || (signatureData.Recepcion && signatureData.Recepcion.data) || p.firma_cliente_recepcion) || null;
            const sigEnt = (signatureData.signatureCanvasEntrega || signatureData.signatureCanvas || (signatureData.Entrega && signatureData.Entrega.data) || p.firma_cliente_entrega) || null;

            const html = `
                <div style="border:1px solid #ddd; padding:20px; background:white; border-radius:8px;">
                    <h2 style="color:#022859; text-align:center; margin:0 0 20px 0;">FORMATO DE RECEPCIÓN Y ENTREGA DE ITEMS</h2>
                    ${mode === 'full' ? `
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                        <div>
                            <p><strong>N° de Recepción:</strong> ${escapeHtml(num)}</p>
                            <p><strong>Cliente:</strong> ${escapeHtml(cliente)}</p>
                            <p><strong>NIT / CC:</strong> ${escapeHtml(nitEmpresa)}</p>
                            <p><strong>Informe a Nombre de:</strong> ${escapeHtml(informeNombre)}</p>
                            <p><strong>Facturar a Nombre de:</strong> ${escapeHtml(facturarNombre)}</p>
                        </div>
                        <div>
                            <p><strong>N° de Remisión:</strong> ${escapeHtml(nRemision)}</p>
                            <p><strong>Fecha Recepción:</strong> ${fechaRec}</p>
                            <p><strong>Fecha Entrega:</strong> ${fechaEnt}</p>
                            <p><strong>N° Informe:</strong> ${escapeHtml(nInforme)}</p>
                            <p><strong>Estado:</strong> <span style="background:${estadoColor}; color:#fff; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:600;">${escapeHtml(estadoLabel)}</span></p>
                        </div>
                    </div>
                    ` : `
                    <div style="margin-bottom:20px;">
                        <p><strong>N° de Recepción:</strong> ${escapeHtml(num)}</p>
                        <p><strong>Cliente:</strong> ${escapeHtml(cliente)}</p>
                    </div>
                    `}

                    <h3 style="color:#022859;">📦 Elementos de Ensayo:</h3>
                    ${itemsHTML || '<p style="text-align:center; color:#666;">No hay elementos registrados.</p>'}

                    <div style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                        <div><strong>Total Recibidos:</strong> ${totalRecibidos}</div>
                        <div><strong>Total Entregados:</strong> ${totalEntregados}</div>
                    </div>

                    ${mode === 'full' ? `
                    <div style="margin-top:14px;">
                        <div><strong>🧽 LAVADO:</strong> ${escapeHtml(lavado)}</div>
                        <div style="margin-top:4px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                            <div><strong>Cantidad de Lavados:</strong> <span style="color:#022859; font-weight:bold;">${totalLavadosItems}</span></div>
                            <div><strong>Responsables del Lavado:</strong> ${escapeHtml(responsableLavado)}</div>
                        </div>
                    </div>

                    ${observaciones ? `<div style="margin-top:16px;"><strong>Observaciones:</strong><br>${escapeHtml(observaciones)}</div>` : ''}

                    <div style="margin-top:20px;">
                        <h4>Firmas: (Cliente)</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                            <div style="text-align:center;">
                                <h5>Firma Recepción</h5>
                                ${sigRec ? `<img src="${sigRec}" style="max-width:100%; max-height:150px; border:1px solid #ccc; border-radius:8px;">` : '<em>Sin firma</em>'}
                                <div><strong>Nombre:</strong> ${escapeHtml(borradorData?.clienteRecepcionNombre || '-')}</div>
                                <div><strong>Cédula:</strong> ${escapeHtml(borradorData?.clienteRecepcionCedula || '-')}</div>
                                <div><strong>Cargo:</strong> ${escapeHtml(borradorData?.clienteRecepcionCargo || '-')}</div>
                            </div>
                            <div style="text-align:center;">
                                <h5>Firma Entrega</h5>
                                ${sigEnt ? `<img src="${sigEnt}" style="max-width:100%; max-height:150px; border:1px solid #ccc; border-radius:8px;">` : '<em>Sin firma</em>'}
                                <div><strong>Nombre:</strong> ${escapeHtml(borradorData?.clienteEntregaNombre || '-')}</div>
                                <div><strong>Cédula:</strong> ${escapeHtml(borradorData?.clienteEntregaCedula || '-')}</div>
                                <div><strong>Cargo:</strong> ${escapeHtml(borradorData?.clienteEntregaCargo || '-')}</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:20px;">
                        <h4>🏢 Representante HIGH TEST</h4>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                            <div>
                                <div><strong>Nombre (Recepción):</strong> ${escapeHtml(borradorData?.highTestRecepcionNombre || '-')}</div>
                                <div><strong>Cargo:</strong> ${escapeHtml(borradorData?.highTestRecepcionCargo || '-')}</div>
                            </div>
                            <div>
                                <div><strong>Nombre (Entrega):</strong> ${escapeHtml(borradorData?.highTestEntregaNombre || '-')}</div>
                                <div><strong>Cargo:</strong> ${escapeHtml(borradorData?.highTestEntregaCargo || '-')}</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>`;

            content.innerHTML = html;

        } catch (err) {
            console.error('Error cargando vista previa:', err);
            content.innerHTML = `<div style="padding:16px; border:1px solid #c62828; border-radius:8px; background:#ffebee; color:#c62828;">
                <strong>Error:</strong> ${err.message}
            </div>`;
        }
    },

    closeVistaPrevia() {
        const modal = document.getElementById('vistaPreviaProcesoModal');
        if (modal) {
            modal.classList.remove('modal--open');
            modal.setAttribute('aria-hidden', 'true');
        }
    }
};

window.AnalisisProcesosModule = AnalisisProcesosModule;
