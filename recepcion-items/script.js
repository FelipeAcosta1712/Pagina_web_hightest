// =======================================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// =======================================================

// Lista de artículos predefinidos - se carga desde JSON
let predefinedItems = [];
let predefinedItemsData = []; // Array completo con objetos del JSON
let predefinedItemsDataNoAcreditados = []; // Datos para Ensayos No Acreditados
let allItemsData = {}; // Almacena todos los datos del JSON (acreditados y no acreditados)
let currentEnsayoType = 'ensayos_acreditados'; // Tipo de ensayo actual
let isLoadingCase = false; // Flag para rastrear si estamos cargando un caso

// Referencias a inputs de búsqueda (pueden ser null hasta DOMContentLoaded)
let searchInput1 = document.getElementById('searchInput1');
let searchInput2 = document.getElementById('searchInput2');

// Datos de respaldo en caso de que no se pueda cargar el JSON
const FALLBACK_DATA = {
    ensayos_acreditados: [
        { id: 1, nombre: "Cubridor De Pin CL2", categoria: "Cubridores", descripcion: "Cubridor de pin clase 2 para protección en líneas energizadas", disponible: true },
        { id: 2, nombre: "Cubridor De Pin CL3", categoria: "Cubridores", descripcion: "Cubridor de pin clase 3 para protección en líneas energizadas", disponible: true },
        { id: 3, nombre: "Cubridor De Pin CL4", categoria: "Cubridores", descripcion: "Cubridor de pin clase 4 para protección en líneas energizadas", disponible: true },
        { id: 4, nombre: "Cubridor De Punta De Poste CL2", categoria: "Cubridores", descripcion: "Cubridor de punta de poste clase 2", disponible: true },
        { id: 5, nombre: "Cubridor De Punta De Poste CL4", categoria: "Cubridores", descripcion: "Cubridor de punta de poste clase 4", disponible: true },
        { id: 6, nombre: "Cubridor De Cadena Rigido CL2", categoria: "Rigidos", descripcion: "Cubridor de cadena rígido clase 2 para protección de aisladores", disponible: true },
        { id: 7, nombre: "Cubridor De Cadena Rigido CL3", categoria: "Rigidos", descripcion: "Cubridor de cadena rígido clase 3 para protección de aisladores", disponible: true },
        { id: 8, nombre: "Cubridor De Barra Rigido CL2", categoria: "Rigidos", descripcion: "Cubridor de barra rígido clase 2 para protección de barras energizadas", disponible: true },
        { id: 9, nombre: "Manguera De 90cm Con Conector CL2", categoria: "Mangueras", descripcion: "Manguera de 90cm con conector clase 2 para protección flexible", disponible: true },
        { id: 10, nombre: "Manguera De 120cm Con Conector CL3", categoria: "Mangueras", descripcion: "Manguera de 120cm con conector clase 3 para protección flexible", disponible: true },
        { id: 11, nombre: "Manguera De 150cm Con Conector CL4", categoria: "Mangueras", descripcion: "Manguera de 150cm con conector clase 4 para protección flexible", disponible: true },
        { id: 12, nombre: "Manguera Aislante De Brazo CL2", categoria: "Mangueras", descripcion: "Manguera aislante de brazo clase 2 para protección de operarios", disponible: true }
    ]
};


// Función para cargar automáticamente los ensayos alcance
function cargarEnsayosAcreditados() {
    console.log('Ejecutando cargarEnsayosAcreditados()');
    
    // Mostrar la tabla de ensayos alcance
    const menu1 = document.getElementById('menu1');
    if (menu1) {
        menu1.style.display = 'block';
        console.log('Tabla de Ensayos Alcance mostrada');
    }
    
    // Limpiar la tabla antes de cargar nueva información
    const itemsList = document.getElementById('itemsList');
    if (itemsList) {
        itemsList.innerHTML = '';
        console.log('Tabla limpiada');
    }
    
    // Cargar elementos para ensayos alcance
    console.log('Iniciando carga de elementos alcance...');
    loadPredefinedItemsFromJSON().then(() => {
        console.log('Datos cargados para ensayos alcance:', predefinedItemsData);
        console.log('Cantidad de elementos cargados:', predefinedItemsData.length);
        
        // Limpiar barra de búsqueda
        const searchInput1 = document.getElementById('searchInput1');
        if (searchInput1) searchInput1.value = '';
        
        // Activar filtro "Todos"
        document.querySelectorAll('#menu1 .filter-btn-1').forEach(btn => btn.classList.remove('active'));
        const todosBtn = document.querySelector('#menu1 #todos-btn-1');
        if (todosBtn) {
            todosBtn.classList.add('active');
            console.log('Filtro "Todos" activado');
        }
        
        // Carga la tabla con los ítems predefinidos con paginación
        console.log('Llamando a loadPredefinedItems...');
        loadPredefinedItems('', 'Todos', 1);

        // Inicializar filtros y event listeners
        setTimeout(() => {
            initializeFilters();
            initializeFilterEventListeners();
        }, 200);
        
        console.log('✅ Ensayos Alcance cargados correctamente - Los filtros navegan por esta tabla');
        
        // Actualizar totales después de cargar
        setTimeout(() => {
            updateTotals();
            updateSavedItemsPreview();
        }, 100);
        
    });
}

// =============================
// Persistencia Nº de Recepción
// =============================
function saveSelectedReceptionNumber() {
    try {
        const sel = document.getElementById('quoteNumber');
        if (!sel) return;
        const val = sel.value || '';
        localStorage.setItem('selected_reception_number', val);
    } catch (e) { console.warn('saveSelectedReceptionNumber error:', e); }
}

function restoreSelectedReceptionNumber() {
    try {
        const sel = document.getElementById('quoteNumber');
        if (!sel) return;
        const saved = localStorage.getItem('selected_reception_number');
        if (saved && Array.from(sel.options).some(o => o.value === saved)) {
            sel.value = saved;
        }
        // Si no hay guardado, dejar el placeholder
    } catch (e) { console.warn('restoreSelectedReceptionNumber error:', e); }
}

function getActiveHeldReceptionNumber() {
    try {
        const held = cleanupHeldReceptionNumbers();
        const saved = (localStorage.getItem('selected_reception_number') || '').trim();
        const now = Date.now();

        if (saved && held[saved] && held[saved].expiresAt && Number(held[saved].expiresAt) > now) {
            return saved;
        }

        return '';
    } catch (e) {
        console.warn('getActiveHeldReceptionNumber error:', e);
        return '';
    }
}

function restoreHeldReceptionSelection() {
    try {
        const sel = document.getElementById('quoteNumber');
        if (!sel) return;

        const saved = (localStorage.getItem('selected_reception_number') || '').trim();
        const activeHeld = getActiveHeldReceptionNumber();
        if (activeHeld) {
            if (!Array.from(sel.options).some((opt) => opt.value === activeHeld)) {
                const option = document.createElement('option');
                option.value = activeHeld;
                option.textContent = activeHeld;
                sel.appendChild(option);
            }

            sel.value = activeHeld;
            sel.disabled = true;
            saveSelectedReceptionNumber();
            return;
        }

        const selectedCodeStillUnavailable = saved && getUnavailableReceptionNumbers().has(normalizeReceptionNumber(saved));
        if (selectedCodeStillUnavailable) {
            showNotification(`⚠️ El número ${saved} ya fue bloqueado en otro navegador. Se asignó el siguiente disponible.`, 'warning');
        }

        sel.disabled = false;
        const nextCode = getNextReceptionNumber();
        if (nextCode) {
            if (!Array.from(sel.options).some((opt) => opt.value === nextCode)) {
                const option = document.createElement('option');
                option.value = nextCode;
                option.textContent = nextCode;
                sel.appendChild(option);
            }
            sel.value = nextCode;
            saveSelectedReceptionNumber();
        } else {
            restoreSelectedReceptionNumber();
        }
    } catch (e) {
        console.warn('restoreHeldReceptionSelection error:', e);
    }
}

// Exponer funciones globales por si se quieren llamar desde otros módulos
window.saveSelectedReceptionNumber = saveSelectedReceptionNumber;
window.restoreSelectedReceptionNumber = restoreSelectedReceptionNumber;

// Al cargar el DOM, asegurar listener y restauración
document.addEventListener('DOMContentLoaded', () => {
    try {
        const sel = document.getElementById('quoteNumber');
        if (sel) {
            sel.addEventListener('change', saveSelectedReceptionNumber);
            // Restaurar (por si populateQuoteNumbers ya corrió)
            restoreSelectedReceptionNumber();
        }
    } catch (e) { console.warn('DOMContentLoaded restore error:', e); }
});

// Maneja la selección de imágenes por fila de ítem. Guarda dataURLs en `itemImagesMap`.
function handleItemImagesChange(inputEl, key) {
    if (!inputEl) return;
    const files = Array.from(inputEl.files || []);
    // key puede ser un número (originalIndex) o cadena 'noacred_X'
    const mapKey = String(key);
    itemImagesMap[mapKey] = [];
    const previewId = mapKey.startsWith('noacred_') ? `imgPreview_${mapKey}` : `imgPreview_${mapKey}`;
    const previewEl = document.getElementById(previewId);
    if (previewEl) previewEl.innerHTML = '';
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target.result;
            // add and determine index immediately
            itemImagesMap[mapKey].push(src);
            const idx = itemImagesMap[mapKey].length - 1;
            if (previewEl) {
                const img = document.createElement('img');
                img.src = src;
                img.style.width = '60px'; img.style.height = '45px'; img.style.objectFit = 'cover'; img.style.border = '1px solid #ccc';
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => openImageViewer(itemImagesMap[mapKey], idx));
                previewEl.appendChild(img);
            }
        };
        reader.readAsDataURL(file);
    });
}
window.handleItemImagesChange = handleItemImagesChange;

/**
 * Carga y muestra la tabla de Ensayos No Acreditados
 */
function cargarEnsayosNoAcreditados() {
    console.log('Ejecutando cargarEnsayosNoAcreditados()');

    // Mostrar la tabla de Ensayos No Acreditados
    const menu2 = document.getElementById('menu2');
    if (menu2) {
        menu2.style.display = 'block';
        console.log('Tabla de Ensayos No Acreditados mostrada');
    }

    // Limpiar la tabla antes de cargar nueva información
    const itemsList2 = document.getElementById('itemsList2');
    if (itemsList2) {
        itemsList2.innerHTML = '';
        console.log('Tabla No Acreditados limpiada');
    }

    // Cargar elementos para ensayos no acreditados
    console.log('Iniciando carga de elementos no acreditados...');
    loadPredefinedItemsNoAcredFromJSON().then(() => {
        console.log('Datos cargados para ensayos no acreditados:', predefinedItemsDataNoAcreditados);
        console.log('Cantidad de elementos cargados (no acreditados):', predefinedItemsDataNoAcreditados.length);

        // Limpiar barra de búsqueda
        const searchInput2 = document.getElementById('searchInput2');
        if (searchInput2) searchInput2.value = '';

        // Activar filtro "Todos"
        document.querySelectorAll('#menu2 .filter-btn-2').forEach(btn => btn.classList.remove('active'));
        const todosBtn2 = document.querySelector('#menu2 #todos-btn-2');
        if (todosBtn2) {
            todosBtn2.classList.add('active');
            console.log('Filtro "Todos" activado (No Acreditados)');
        }

        // Carga la tabla con los ítems predefinidos con paginación
        console.log('Llamando a loadPredefinedItemsNoAcreditados...');
        loadPredefinedItemsNoAcreditados('', 'Todos', 1);

        console.log('✅ Ensayos No Acreditados cargados correctamente - Los filtros navegan por esta tabla');

        // Actualizar totales después de cargar
        setTimeout(() => {
            updateTotals();
            updateSavedItemsPreview();
        }, 100);
    });
}



// Variables para la firma digital
let signaturePads = {}; // Objeto para almacenar múltiples instancias de SignaturePad
let signatureData = {}; // Almacena las firmas como URLs de datos
let generatedPDF = null; // Almacena el PDF generado como una URL de datos (data URI)
// Mapa para almacenar imágenes por índice de ítem (data URLs)
const itemImagesMap = {};

let currentUnitEditor = {
    tableType: '',
    rowIndex: null
};

function getUnitRowKey(rowIndex) {
    return `row_${rowIndex}`;
}

function normalizeUnitSegment(value, fallback = 'SIN-MARCA') {
    const normalized = String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase();

    return normalized || fallback;
}

function getLegacyUnitCount(tableType, rowIndex, rowData = {}) {
    const baseValue = parseInt(
        rowData.cantRecibida ||
        rowData.quantity ||
        rowData.quantity1 ||
        rowData.cantidadRecibida ||
        rowData.total ||
        0
    , 10) || 0;

    if (baseValue > 0) return baseValue;

    const legacyInputId = tableType === 'ensayos_acreditados' ? `qty_${rowIndex}` : `qty2_${rowIndex}`;
    const legacyInput = document.getElementById(legacyInputId);
    if (legacyInput) {
        return parseInt(legacyInput.value || 0, 10) || 0;
    }

    return 0;
}

function buildUnitCode(tableType, rowIndex, brand, sequence) {
    const itemName = typeof getElementName === 'function' ? getElementName(tableType, rowIndex) : `Elemento ${Number(rowIndex) + 1}`;
    const itemSegment = normalizeUnitSegment(itemName, 'ITEM');
    const brandSegment = normalizeUnitSegment(brand, 'SIN-MARCA');
    return `${itemSegment}-${brandSegment}-${String(sequence).padStart(3, '0')}`;
}

function getRowUnits(tableType, rowIndex) {
    const rowKey = getUnitRowKey(rowIndex);
    const rowData = savedRowsData?.[tableType]?.[rowKey] || {};

    if (Array.isArray(rowData.units) && rowData.units.length > 0) {
        return rowData.units
            .map((unit, index) => ({
                sequence: Number(unit.sequence || index + 1) || (index + 1),
                brand: String(unit.brand || unit.marca || 'Sin marca').trim() || 'Sin marca',
                observations: String(unit.observations || unit.observaciones || '').trim(),
                code: String(unit.code || '').trim()
            }))
            .sort((a, b) => a.sequence - b.sequence);
    }

    const legacyCount = getLegacyUnitCount(tableType, rowIndex, rowData);
    if (legacyCount <= 0) {
        return [];
    }

    const fallbackBrand = String(rowData.brand || rowData.marca || 'Sin marca').trim() || 'Sin marca';
    const fallbackObservations = String(rowData.observations || rowData.observaciones || '').trim();

    return Array.from({ length: legacyCount }, (_, index) => {
        const sequence = index + 1;
        return {
            sequence,
            brand: fallbackBrand,
            observations: fallbackObservations,
            code: buildUnitCode(tableType, rowIndex, fallbackBrand, sequence)
        };
    });
}

function getRowPrimaryQuantity(tableType, rowIndex) {
    const rowKey = getUnitRowKey(rowIndex);
    const rowData = savedRowsData?.[tableType]?.[rowKey] || {};
    const receivedQuantity = parseInt(rowData.cantRecibida || rowData.quantity || rowData.total || 0, 10) || 0;
    if (receivedQuantity > 0) {
        return receivedQuantity;
    }

    return getRowUnits(tableType, rowIndex).length;
}

function getRowQuantitySnapshot(tableType, rowIndex) {
    const rowKey = getUnitRowKey(rowIndex);
    const rowData = savedRowsData?.[tableType]?.[rowKey] || {};
    const received = parseInt(rowData.cantRecibida || rowData.quantity || rowData.total || 0, 10) || 0;
    const delivered = parseInt(rowData.cantEntregada || rowData.quantity2 || 0, 10) || 0;
    const washed = parseInt(rowData.cantLavados || rowData.washed || 0, 10) || 0;

    return {
        received: received > 0 ? received : getRowUnits(tableType, rowIndex).length,
        delivered,
        washed,
        units: getRowUnits(tableType, rowIndex)
    };
}

function getUnitBrandGroups(units) {
    const groups = new Map();

    units.forEach((unit) => {
        const brand = String(unit.brand || unit.marca || 'Sin marca').trim() || 'Sin marca';
        groups.set(brand, (groups.get(brand) || 0) + 1);
    });

    return Array.from(groups.entries()).map(([brand, count]) => ({ brand, count }));
}

function renderBrandChips(units) {
    const groups = getUnitBrandGroups(units);

    if (groups.length === 0) {
        return '<span class="brand-chip brand-chip-empty">Sin unidades</span>';
    }

    return groups.map(({ brand, count }) => `
        <span class="brand-chip" title="${escapeHtml(brand)}">
            <span>${escapeHtml(brand)}</span>
            <span class="brand-chip-count">x${count}</span>
        </span>
    `).join('');
}

function updateVisibleItemRowSummary(tableType, rowIndex) {
    const tableSelector = tableType === 'ensayos_acreditados' ? '#itemsList' : '#itemsList2';
    const rowEl = document.querySelector(`${tableSelector} .items-grid[data-row-index="${rowIndex}"]`);
    if (!rowEl) return;

    const quantitySnapshot = getRowQuantitySnapshot(tableType, rowIndex);
    const units = quantitySnapshot.units;
    const receivedEl = rowEl.querySelector('.quantity-chip.received .quantity-chip-value');
    const deliveredEl = rowEl.querySelector('.quantity-chip.delivered .quantity-chip-value');
    const washedEl = rowEl.querySelector('.wash-chip .quantity-chip-value');
    const brandsEl = rowEl.querySelector('.brand-chip-list');

    if (receivedEl) {
        receivedEl.textContent = String(quantitySnapshot.received);
    }

    if (deliveredEl) {
        deliveredEl.textContent = String(quantitySnapshot.delivered);
    }

    if (washedEl) {
        washedEl.textContent = String(quantitySnapshot.washed);
    }

    if (brandsEl) {
        brandsEl.innerHTML = renderBrandChips(units);
    }

    const rowData = savedRowsData?.[tableType]?.[getUnitRowKey(rowIndex)] || {};
    rowEl.classList.toggle('row-saved', Boolean(rowData.saved));
}

function persistSavedRowsData() {
    try {
        localStorage.setItem('savedRowsData', JSON.stringify(savedRowsData));
    } catch (error) {
        console.warn('No se pudo persistir savedRowsData:', error);
    }
}

function getUnitEditorMetricValues() {
    return {
        cantRecibida: parseInt(document.getElementById('unitMetricRecibida')?.value || '0', 10) || 0,
        cantEntregada: parseInt(document.getElementById('unitMetricEntregada')?.value || '0', 10) || 0,
        cantNoUsado: parseInt(document.getElementById('unitMetricNoUsado')?.value || '0', 10) || 0,
        cantUsado: parseInt(document.getElementById('unitMetricUsado')?.value || '0', 10) || 0,
        cantLavados: parseInt(document.getElementById('unitMetricLavados')?.value || '0', 10) || 0
    };
}

function setUnitEditorMetricValues(rowData = {}) {
    const savedUnits = Array.isArray(rowData.units) ? rowData.units.length : 0;
    const metricMap = {
        unitMetricRecibida: rowData.cantRecibida || savedUnits,
        unitMetricEntregada: rowData.cantEntregada,
        unitMetricNoUsado: rowData.cantNoUsado,
        unitMetricUsado: rowData.cantUsado,
        unitMetricLavados: rowData.cantLavados
    };

    Object.entries(metricMap).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = String(parseInt(value || 0, 10) || 0);
        }
    });

    if (Array.isArray(rowData.distributionRows) && rowData.distributionRows.length > 0) {
        renderDistributionRows(rowData.distributionRows);
    } else {
        renderDistributionRowsFromUnits(Array.isArray(rowData.units) ? rowData.units : [], rowData.brandDistribution);
    }
}

function enforceUnitMetricBalance(changedInputId = '') {
    const receivedInput = document.getElementById('unitMetricRecibida');
    const noUsedInput = document.getElementById('unitMetricNoUsado');
    const usedInput = document.getElementById('unitMetricUsado');
    if (!receivedInput || !noUsedInput || !usedInput) return;

    let received = Math.max(0, parseInt(receivedInput.value || '0', 10) || 0);
    let noUsed = Math.max(0, parseInt(noUsedInput.value || '0', 10) || 0);
    let used = Math.max(0, parseInt(usedInput.value || '0', 10) || 0);

    if (changedInputId === 'unitMetricRecibida') {
        if (noUsed > received) {
            noUsed = received;
            used = 0;
        } else {
            used = Math.max(0, received - noUsed);
        }
    } else if (changedInputId === 'unitMetricNoUsado') {
        if (received <= 0) {
            received = noUsed + used;
        }
        noUsed = Math.min(noUsed, received);
        used = Math.max(0, received - noUsed);
    } else if (changedInputId === 'unitMetricUsado') {
        if (received <= 0) {
            received = noUsed + used;
        }
        used = Math.min(used, received);
        noUsed = Math.max(0, received - used);
    } else {
        if (received <= 0) {
            received = noUsed + used;
        }
        if (noUsed > received) {
            noUsed = received;
        }
        used = Math.max(0, received - noUsed);
    }

    receivedInput.value = String(received);
    noUsedInput.value = String(noUsed);
    usedInput.value = String(used);
}

function formatDistributionTextFromUnits(units = []) {
    const groups = getUnitBrandGroups(units);
    return groups.map(({ brand, count }) => `${count} ${brand}`).join(', ');
}

function buildUnitsFromDistribution(totalQuantity, distributionGroups, existingUnits = []) {
    const quantity = Math.max(0, parseInt(totalQuantity || 0, 10) || 0);
    if (quantity <= 0) return [];

    const groups = Array.isArray(distributionGroups) ? distributionGroups : [];
    const fallbackGroups = groups.length > 0 ? groups : [{ count: quantity, brand: 'Sin marca' }];
    const preservedObservations = new Map(
        existingUnits.map((unit) => [Number(unit.sequence || 0) || 0, String(unit.observations || unit.observaciones || '').trim()])
    );

    const units = [];
    let sequence = 1;

    fallbackGroups.forEach((group) => {
        for (let index = 0; index < group.count && sequence <= quantity; index++) {
            const brand = String(group.brand || 'Sin marca').trim() || 'Sin marca';
            units.push({
                sequence,
                brand,
                observations: preservedObservations.get(sequence) || '',
                code: buildUnitCode(currentUnitEditor.tableType, currentUnitEditor.rowIndex, brand, sequence)
            });
            sequence++;
        }
    });

    while (sequence <= quantity) {
        const brand = 'Sin marca';
        units.push({
            sequence,
            brand,
            observations: preservedObservations.get(sequence) || '',
            code: buildUnitCode(currentUnitEditor.tableType, currentUnitEditor.rowIndex, brand, sequence)
        });
        sequence++;
    }

    return units;
}

function getDistributionRows() {
    const list = document.getElementById('unitBrandDistributionList');
    if (!list) return [];

    return Array.from(list.querySelectorAll('.unit-distribution-row')).map((rowEl) => ({
        count: Math.max(0, parseInt(rowEl.querySelector('.unit-distribution-count')?.value || '0', 10) || 0),
        brand: String(rowEl.querySelector('.unit-distribution-brand')?.value || '').trim()
    })).filter((row) => row.count > 0 || row.brand !== '');
}

function getDistributionRowsTotal() {
    return getDistributionRows().reduce((sum, row) => sum + (row.count || 0), 0);
}

function buildDistributionRowHtml(row = {}) {
    const count = Math.max(0, parseInt(row.count || 0, 10) || 0);
    const brand = String(row.brand || '').trim();
    return `
        <div class="unit-distribution-row">
            <div>
                <input type="number" class="unit-distribution-count" min="0" value="${count}" placeholder="0">
            </div>
            <div>
                <input type="text" class="unit-distribution-brand" value="${escapeHtml(brand)}" placeholder="Marca">
            </div>
            <div class="unit-row-actions">
                <button type="button" class="unit-icon-btn" data-action="remove-distribution-row" title="Eliminar fila">🗑️</button>
            </div>
        </div>
    `;
}

function renderDistributionRows(rows = []) {
    const list = document.getElementById('unitBrandDistributionList');
    if (!list) return;

    const normalizedRows = rows.length > 0 ? rows : [{ count: 0, brand: '' }];
    list.innerHTML = normalizedRows.map((row) => buildDistributionRowHtml(row)).join('');
}

function renderDistributionRowsFromUnits(units = [], fallbackDistribution = '') {
    const groups = getUnitBrandGroups(units);
    const rows = groups.length > 0
        ? groups.map((group) => ({ count: group.count, brand: group.brand }))
        : (fallbackDistribution ? [{ count: Math.max(0, parseInt((fallbackDistribution.match(/^(\d+)/) || [0, 0])[1], 10) || 0), brand: fallbackDistribution.replace(/^\d+\s+/, '') }] : []);

    renderDistributionRows(rows);
}

function addDistributionRow(count = 0, brand = '') {
    const list = document.getElementById('unitBrandDistributionList');
    if (!list) return;

    const receivedQuantity = Math.max(0, parseInt(document.getElementById('unitMetricRecibida')?.value || '0', 10) || 0);
    const currentDistributionTotal = getDistributionRowsTotal();
    if (receivedQuantity > 0 && currentDistributionTotal >= receivedQuantity) {
        if (typeof showNotification === 'function') {
            showNotification('Ya se completó la cantidad recibida. No puedes agregar más filas de marca.', 'warning');
        }
        return;
    }

    if (list.querySelector('.unit-empty-state')) {
        list.innerHTML = '';
    }

    list.insertAdjacentHTML('beforeend', buildDistributionRowHtml({ count, brand }));
    syncUnitEditorUnitsFromInputs();
}

function syncUnitEditorUnitsFromInputs() {
    if (!currentUnitEditor.tableType && currentUnitEditor.rowIndex === null) return;

    const metrics = getUnitEditorMetricValues();
    const receivedQuantity = Math.max(0, metrics.cantRecibida);
    const currentUnits = getCurrentUnitEditorRows();
    const distributionRows = getDistributionRows();
    const units = buildUnitsFromDistribution(receivedQuantity, distributionRows, currentUnits);

    renderUnitEditorRows(units);
    refreshUnitEditorMeta();
    commitUnitEditorChanges();
}

function getCurrentUnitEditorRows() {
    const body = document.getElementById('unitManagerBody');
    if (!body) return [];

    return Array.from(body.querySelectorAll('.unit-unit-row')).map((rowEl) => ({
        sequence: Number(rowEl.dataset.sequence || 0) || 0,
        brand: String(rowEl.querySelector('.unit-brand-input')?.value || '').trim(),
        observations: String(rowEl.querySelector('.unit-observations-input')?.value || '').trim(),
        code: String(rowEl.querySelector('.unit-code')?.textContent || '').trim()
    })).filter((unit) => unit.sequence > 0);
}

function renderUnitEditorRows(units) {
    const body = document.getElementById('unitManagerBody');
    if (!body) return;

    if (!units.length) {
        body.innerHTML = '<div class="unit-empty-state">Aún no hay unidades registradas. Agrega la primera unidad para comenzar el control interno.</div>';
        return;
    }

    body.innerHTML = units.map((unit) => buildUnitRowHtml(unit)).join('');
}

function buildUnitRowHtml(unit) {
    const brand = String(unit.brand || 'Sin marca').trim() || 'Sin marca';
    const observations = String(unit.observations || '').trim();
    const code = String(unit.code || buildUnitCode(currentUnitEditor.tableType, currentUnitEditor.rowIndex, brand, unit.sequence));

    return `
        <div class="unit-unit-row" data-sequence="${unit.sequence}">
            <div class="unit-code">${escapeHtml(code)}</div>
            <div>
                <input type="text" class="unit-brand-input" value="${escapeHtml(brand)}" placeholder="Marca">
            </div>
            <div>
                <textarea class="unit-observations-input" placeholder="Observaciones individuales">${escapeHtml(observations)}</textarea>
            </div>
            <div class="unit-row-actions">
                <button type="button" class="unit-icon-btn" data-action="remove-unit" title="Eliminar unidad">🗑️</button>
            </div>
        </div>
    `;
}

function collectUnitEditorUnits() {
    const body = document.getElementById('unitManagerBody');
    if (!body) return [];

    return Array.from(body.querySelectorAll('.unit-unit-row')).map((rowEl) => {
        const sequence = Number(rowEl.dataset.sequence || 0) || 0;
        const brand = String(rowEl.querySelector('.unit-brand-input')?.value || '').trim() || 'Sin marca';
        const observations = String(rowEl.querySelector('.unit-observations-input')?.value || '').trim();
        const code = buildUnitCode(currentUnitEditor.tableType, currentUnitEditor.rowIndex, brand, sequence);

        return {
            sequence,
            brand,
            observations,
            code
        };
    }).filter((unit) => unit.sequence > 0);
}

function commitUnitEditorChanges() {
    if (!currentUnitEditor.tableType && currentUnitEditor.rowIndex === null) return;

    const tableType = currentUnitEditor.tableType;
    const rowIndex = currentUnitEditor.rowIndex;
    const rowKey = getUnitRowKey(rowIndex);
    const units = collectUnitEditorUnits();
    const metrics = getUnitEditorMetricValues();

    if (!savedRowsData[tableType]) {
        savedRowsData[tableType] = {};
    }

    const existing = savedRowsData[tableType][rowKey] || {};
    savedRowsData[tableType][rowKey] = {
        ...existing,
        units,
        ...metrics,
        distributionRows: getDistributionRows(),
        brandDistribution: formatDistributionTextFromUnits(units),
        saved: existing.saved ?? false,
        updatedAt: new Date().toISOString()
    };

    persistSavedRowsData();
    updateVisibleItemRowSummary(tableType, rowIndex);
    updateSavedItemsPreview();
    updateTotals();
}

function refreshUnitEditorMeta() {
    const tableType = currentUnitEditor.tableType;
    const rowIndex = currentUnitEditor.rowIndex;
    if (rowIndex === null || !tableType) return;

    const itemName = typeof getElementName === 'function' ? getElementName(tableType, rowIndex) : `Elemento ${Number(rowIndex) + 1}`;
    const units = collectUnitEditorUnits();
    const groups = getUnitBrandGroups(units);
    const metrics = getUnitEditorMetricValues();
    const totalQuantity = metrics.cantRecibida > 0 ? metrics.cantRecibida : units.length;

    const titleEl = document.getElementById('unitManagerTitle');
    const subtitleEl = document.getElementById('unitManagerSubtitle');
    const itemNameEl = document.getElementById('unitManagerItemName');
    const totalEl = document.getElementById('unitManagerTotal');
    const brandsEl = document.getElementById('unitManagerBrands');

    if (titleEl) titleEl.textContent = `Gestionar unidades · ${itemName}`;
    if (subtitleEl) subtitleEl.textContent = 'Detalle técnico interno con consecutivo, marca y observaciones por unidad';
    if (itemNameEl) itemNameEl.textContent = itemName;
    if (totalEl) totalEl.textContent = String(totalQuantity);
    if (brandsEl) brandsEl.textContent = String(groups.length);
}

function openUnitManager(tableType, rowIndex) {
    currentUnitEditor = {
        tableType,
        rowIndex: Number(rowIndex)
    };

    const modal = document.getElementById('unitManagerModal');
    const rowData = savedRowsData?.[tableType]?.[getUnitRowKey(rowIndex)] || {};
    const rowUnits = getRowUnits(tableType, rowIndex);
    const initialQuantity = Math.max(0, parseInt(rowData.cantRecibida || rowUnits.length || 0, 10) || 0);
    const initialUnits = buildUnitsFromDistribution(
        initialQuantity,
        Array.isArray(rowData.distributionRows) && rowData.distributionRows.length > 0
            ? rowData.distributionRows
            : (getUnitBrandGroups(rowUnits).map((group) => ({ count: group.count, brand: group.brand }))),
        rowUnits
    );

    renderUnitEditorRows(initialUnits);
    setUnitEditorMetricValues(rowData);
    refreshUnitEditorMeta();

    if (modal) {
        modal.hidden = false;
    }

    document.body.style.overflow = 'hidden';
}

function closeUnitManager() {
    const modal = document.getElementById('unitManagerModal');
    if (modal) {
        modal.hidden = true;
    }

    document.body.style.overflow = '';
    currentUnitEditor = {
        tableType: '',
        rowIndex: null
    };
}

function addUnitRow(sequence = null) {
    const body = document.getElementById('unitManagerBody');
    if (!body || currentUnitEditor.rowIndex === null || !currentUnitEditor.tableType) return;

    if (body.querySelector('.unit-empty-state')) {
        body.innerHTML = '';
    }

    const existingSequences = Array.from(body.querySelectorAll('.unit-unit-row')).map((row) => Number(row.dataset.sequence || 0) || 0);
    const nextSequence = sequence || (existingSequences.length ? Math.max(...existingSequences) + 1 : 1);
    const fallbackBrand = body.querySelector('.unit-brand-input')?.value?.trim() || 'Sin marca';
    const unit = {
        sequence: nextSequence,
        brand: fallbackBrand,
        observations: '',
        code: buildUnitCode(currentUnitEditor.tableType, currentUnitEditor.rowIndex, fallbackBrand, nextSequence)
    };

    body.insertAdjacentHTML('beforeend', buildUnitRowHtml(unit));
    commitUnitEditorChanges();
    refreshUnitEditorMeta();
}

function addUnitBatch() {
    const countInput = document.getElementById('unitBatchCount');
    const count = Math.max(1, parseInt(countInput?.value || '1', 10) || 1);

    for (let index = 0; index < count; index++) {
        addUnitRow();
    }
}

function removeDistributionRow(buttonEl) {
    const rowEl = buttonEl?.closest('.unit-distribution-row');
    if (!rowEl) return;

    rowEl.remove();
    const list = document.getElementById('unitBrandDistributionList');
    if (list && !list.querySelector('.unit-distribution-row')) {
        renderDistributionRows([]);
    }
    syncUnitEditorUnitsFromInputs();
}

function removeUnitRow(buttonEl) {
    const rowEl = buttonEl?.closest('.unit-unit-row');
    if (!rowEl) return;

    rowEl.remove();

    const body = document.getElementById('unitManagerBody');
    if (body && !body.querySelector('.unit-unit-row')) {
        body.innerHTML = '<div class="unit-empty-state">Aún no hay unidades registradas. Agrega la primera unidad para comenzar el control interno.</div>';
    }

    commitUnitEditorChanges();
    refreshUnitEditorMeta();
}

function saveUnitManager() {
    syncUnitEditorUnitsFromInputs();
    commitUnitEditorChanges();

    const tableType = currentUnitEditor.tableType;
    const rowIndex = currentUnitEditor.rowIndex;
    const rowKey = getUnitRowKey(rowIndex);
    if (tableType && rowIndex !== null && savedRowsData[tableType]?.[rowKey]) {
        savedRowsData[tableType][rowKey].saved = true;
        persistSavedRowsData();
        updateVisibleItemRowSummary(tableType, rowIndex);
        updateSavedItemsPreview();
        updateTotals();
    }

    closeUnitManager();
}

document.addEventListener('input', (event) => {
    if (!event.target.closest('#unitManagerModal')) return;

    if (event.target.id === 'unitMetricRecibida' || event.target.id === 'unitMetricNoUsado' || event.target.id === 'unitMetricUsado') {
        enforceUnitMetricBalance(event.target.id);
        syncUnitEditorUnitsFromInputs();
        return;
    }

    if (event.target.classList.contains('unit-distribution-count') || event.target.classList.contains('unit-distribution-brand')) {
        syncUnitEditorUnitsFromInputs();
        return;
    }

    if (event.target.classList.contains('unit-brand-input')) {
        const rowEl = event.target.closest('.unit-unit-row');
        if (rowEl) {
            const sequence = Number(rowEl.dataset.sequence || 0) || 0;
            const brand = String(rowEl.querySelector('.unit-brand-input')?.value || '').trim() || 'Sin marca';
            const codeEl = rowEl.querySelector('.unit-code');
            if (codeEl && sequence > 0) {
                codeEl.textContent = buildUnitCode(currentUnitEditor.tableType, currentUnitEditor.rowIndex, brand, sequence);
            }
        }

        // Si la marca se cambia manualmente en una unidad, sincronizamos la distribucion automaticamente.
        renderDistributionRowsFromUnits(collectUnitEditorUnits());
        commitUnitEditorChanges();
        refreshUnitEditorMeta();
        return;
    }

    if (event.target.classList.contains('unit-observations-input')) {
        commitUnitEditorChanges();
        refreshUnitEditorMeta();
    }
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('#unitManagerModal')) return;
    const removeDistributionBtn = event.target.closest('[data-action="remove-distribution-row"]');
    if (removeDistributionBtn) {
        event.preventDefault();
        removeDistributionRow(removeDistributionBtn);
        return;
    }

    const removeBtn = event.target.closest('[data-action="remove-unit"]');
    if (removeBtn) {
        event.preventDefault();
        removeUnitRow(removeBtn);
    }
});

document.addEventListener('keydown', (event) => {
    const modal = document.getElementById('unitManagerModal');
    if (event.key === 'Escape' && modal && !modal.hidden) {
        closeUnitManager();
    }
});

let isDrawing = false; // Bandera para el dibujo manual en el canvas
let canvas, ctx; // Referencia al elemento canvas y su contexto 2D

// Configuración de EmailJS (¡REEMPLAZA CON TUS CREDENCIALES REALES!)
const EMAIL_CONFIG = {
    serviceId: 'tu_service_id',
    templateId: 'tu_template_id',
    publicKey: 'tu_public_key'
};

// Inicializar EmailJS (¡DESCOMENTAR EN PRODUCCIÓN Y AÑADIR TUS CREDENCIALES!)
// emailjs.init(EMAIL_CONFIG.publicKey);

let empresas = []; // Array para almacenar los datos de las empresas cargados desde JSON

// =======================================================
// FUNCIONES DE INICIALIZACIÓN
// =======================================================

/**
 * Carga los elementos predefinidos desde la tabla `ensayos_acreditados` en Supabase
 */
async function loadPredefinedItemsFromJSON() {
    try {
        console.log('🔄 Loading predefined items for ensayos alcance');
        showLoadingStatus('Cargando elementos de ensayos alcance...', 'info');

        console.log('📁 Loading table: ensayos_acreditados');
        showLoadingStatus('Consultando tabla ensayos_acreditados...', 'info');

        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_ensayos_acreditados' })
        });

        console.log('📡 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const jsonData = await response.json();
            console.log('✅ Data loaded from DB:', jsonData);

            allItemsData.ensayos_acreditados = Array.isArray(jsonData?.items)
                ? jsonData.items
                : Array.isArray(jsonData?.ensayos_acreditados)
                    ? jsonData.ensayos_acreditados
                    : Array.isArray(jsonData)
                        ? jsonData
                        : [];

            console.log('📊 ensayos_acreditados disponibles:', allItemsData.ensayos_acreditados.length);
            showLoadingStatus('Tabla ensayos_acreditados cargada correctamente', 'success');
        
        // Seleccionar los datos de ensayos alcance
        predefinedItemsData = Array.isArray(allItemsData.ensayos_acreditados) ? allItemsData.ensayos_acreditados : [];
        currentEnsayoType = 'ensayos_acreditados';
        
        // Extrae solo los nombres para compatibilidad con el código existente
        predefinedItems = predefinedItemsData.map(item => (typeof item === 'string' ? item : (item.nombre || item.name || '')));
        
        console.log('✅ Elementos predefinidos cargados (ensayos_alcance):', predefinedItems);
        console.log('📋 Datos del tipo seleccionado:', predefinedItemsData);
        
        if (predefinedItemsData.length === 0) {
            console.warn('⚠️ No data found for ensayos alcance');
            showLoadingStatus('No se encontraron datos para ensayos alcance', 'warning');
        } else {
            console.log(`✅ Se cargaron ${predefinedItemsData.length} elementos correctamente`);
            showLoadingStatus(`✅ ${predefinedItemsData.length} elementos cargados para ensayos alcance`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar elementos predefinidos:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack
        });
        showLoadingStatus(`❌ Error consultando tabla: ${error.message}`, 'error');
        
        // Fallback a datos predefinidos en caso de error
        console.log('🔄 Intentando fallback con datos hardcodeados...');
        showLoadingStatus('Usando datos de respaldo...', 'warning');
        
        // Intentar cargar alternativa: predefined_items.json
        try {
            console.log('🔁 Intentando archivo alternativo: predefined_items.json');
            const altResp = await fetch('predefined_items.json?t=' + new Date().getTime());
            if (altResp.ok) {
                const altText = await altResp.text();
                const altJson = JSON.parse(altText);
                if (Array.isArray(altJson)) {
                    allItemsData.ensayos_acreditados = altJson;
                } else if (altJson.ensayos_acreditados) {
                    allItemsData.ensayos_acreditados = altJson.ensayos_acreditados;
                } else if (altJson.items) {
                    allItemsData.ensayos_acreditados = altJson.items;
                }
                predefinedItemsData = allItemsData.ensayos_acreditados || [];
                console.log('✅ Cargado desde predefined_items.json:', predefinedItemsData.length);
                showLoadingStatus(`✅ ${predefinedItemsData.length} elementos cargados desde predefined_items.json`, 'success');
            } else {
                throw new Error('predefined_items.json no disponible');
            }
        } catch (altErr) {
            console.log('⚠️ No se pudo cargar predefined_items.json o no contiene los datos esperados:', altErr.message);
            // Fallback a datos predefinidos en caso de error
            allItemsData = FALLBACK_DATA;
            predefinedItemsData = allItemsData.ensayos_acreditados || [];
            currentEnsayoType = 'ensayos_acreditados';
            predefinedItems = predefinedItemsData.map(item => item.nombre);
            console.log('✅ Datos de respaldo cargados:', predefinedItemsData.length);
            showLoadingStatus(`✅ ${predefinedItemsData.length} elementos de respaldo cargados`, 'warning');
        }
    }
}

/**
 * Carga los elementos predefinidos desde el archivo JSON de ensayos no acreditados
 */
async function loadPredefinedItemsNoAcredFromJSON() {
    try {
        console.log('🔄 Loading predefined items for ensayos no acreditados');
        showLoadingStatus('Cargando elementos de ensayos no acreditados...', 'info');

        const response = await fetch('ensayos_no_acreditados.json?t=' + new Date().getTime());
        console.log('📡 Response status (no acreditados):', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        const jsonText = await response.text();
        const jsonData = JSON.parse(jsonText);

        // Almacenar
        allItemsData.ensayos_no_acreditados = jsonData.ensayos_no_acreditados || [];
        predefinedItemsDataNoAcreditados = allItemsData.ensayos_no_acreditados || [];

        showLoadingStatus('Archivo ensayos_no_acreditados.json cargado correctamente', 'success');
        console.log(`✅ Se cargaron ${predefinedItemsDataNoAcreditados.length} elementos (no acreditados)`);
    } catch (error) {
        console.error('❌ Error al cargar ensayos no acreditados:', error);
        showLoadingStatus(`❌ Error (no acreditados): ${error.message}`, 'error');
        // Fallback vacío
        if (!allItemsData.ensayos_no_acreditados) allItemsData.ensayos_no_acreditados = [];
        if (!predefinedItemsDataNoAcreditados) predefinedItemsDataNoAcreditados = [];
    }
}

/**
 * Inicializa la aplicación una vez que el DOM está completamente cargado.
 * Configura el canvas de la firma, carga los artículos predefinidos,
 * establece la fecha actual, inicializa los números de cotización
 * e intenta cargar un borrador si existe.
 */
document.addEventListener('DOMContentLoaded', async function() {
    initializeSignatureCanvas(); // Inicializa el canvas básico para dibujo
    initializeMultipleSignaturePads(); // Inicializa múltiples SignaturePads

    // Auto-abrir modal de marcación si viene con ?open=marcacion
    if (new URLSearchParams(window.location.search).get('open') === 'marcacion') {
        setTimeout(() => verMarcacion(), 500);
    }
    
    // Agregar event listeners para actualizar totales
    document.addEventListener('input', function(e) {
        if (e.target.type === 'number' && (e.target.id.includes('qty') || e.target.id.includes('status'))) {
            updateTotals();
        }
    });
    
    // Establecer fecha y hora actuales en los campos de firma
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16);
    
    document.getElementById('fechaFirmaRecepcion')?.setAttribute('value', currentDateTime);
    document.getElementById('fechaFirmaEntrega')?.setAttribute('value', currentDateTime);
    document.getElementById('fechaFirmaHighTest')?.setAttribute('value', currentDateTime);
    
    // COMENTADO: Cargar automáticamente los ensayos alcance al inicio - ahora se carga solo cuando el usuario selecciona
    // console.log('🚀 Iniciando carga automática de ensayos alcance...');
    // cargarEnsayosAcreditados();
    
    // Cargar datos de empresas y elementos
    loadCompaniesAndElements();
    setCurrentDate();
    // Inicializar dropdown de números de recepción usando solo estado local/DB
    try {
        const localNumbers = getRestrictedReceptionNumbers();
        if (Array.isArray(localNumbers) && localNumbers.length) {
            setRestrictedReceptionNumbers(localNumbers);
        }
    } catch (err) {
        console.warn('No se pudieron cargar números restringidos locales:', err);
    }

    // Refrescar snapshot DB y luego inicializar opciones (evita proponer números en conflicto)
    try {
        await refreshDbUnavailableReceptionNumbers();
    } catch (e) {
        console.warn('refreshDbUnavailableReceptionNumbers failed', e);
    }

    try { initializeQuoteNumbers(); } catch (e) { console.warn('init quotes failed', e); }
    try { showProposedReceptionNumber(); } catch (e) {}
    
    // Agregar listener para reinicializar números de recepción cuando el usuario abre el dropdown
    const quoteNumberSelect = document.getElementById('quoteNumber');
    if (quoteNumberSelect) {
        quoteNumberSelect.addEventListener('focus', async function() {
            try {
                await refreshDbUnavailableReceptionNumbers();
            } catch (e) {
                console.warn('Error refrescando DB antes de reinicializar números:', e);
            }
            try {
                initializeQuoteNumbers();
            } catch (e) {
                console.warn('Error al reinicializar números:', e);
            }
            try { refreshNextReceptionNumberInfo(); } catch (error) { console.warn(error); }
        });
        // Enfocar el campo de número de recepción como primer paso
        setTimeout(() => {
            quoteNumberSelect.focus();
        }, 0);
    }

    const lock20Btn = document.getElementById('btnLockReception20Min');
    if (lock20Btn) {
        lock20Btn.addEventListener('click', async () => await lockReceptionNumberForMinutes(40));
    }

    const releaseReceptionBtn = document.getElementById('btnReleaseReceptionNumber');
    if (releaseReceptionBtn) {
        releaseReceptionBtn.addEventListener('click', async () => {
            const quoteEl = document.getElementById('quoteNumber');
            const selected = quoteEl?.value || getNextReceptionNumber();
            await freeReceptionNumber(selected);
        });
    }

    refreshLockRemainingInfo();
    setInterval(() => {
        refreshLockRemainingInfo();
    }, 1000);

    setInterval(() => {
        cleanupHeldReceptionNumbers();
        refreshNextReceptionNumberInfo();
    }, 60000);
    
    // Iniciar sincronización automática de números restringidos
    // Sincronización remota desactivada; no se usa en este flujo.

    // Preguntar al usuario si desea guardar el progreso a la carga de la página
    promptSaveProgressOnLoad();
});

/**
 * Determina si el formulario actual contiene datos relevantes para guardar.
 * Evita crear borradores vacíos.
 */
function hasFormDataToSave(formData) {
    if (!formData || typeof formData !== 'object') return false;

    const ignoredKeys = ['signatureData', 'timestamp', 'status', '_createdAt'];
    return Object.keys(formData).some(key => {
        if (ignoredKeys.includes(key)) return false;
        const value = formData[key];
        if (value === null || value === undefined || value === '') return false;
        if (value === '0' || value === 'false') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    });
}

function hasRequiredFieldsForSave(formData) {
    if (!formData || typeof formData !== 'object') return false;
    const cotizacion = (formData.cotizacion || '').trim();
    const fechaRecepcion = (formData.fechaRecepcion || '').trim();
    const cliente = (formData.cliente || '').trim();
    return !!(cotizacion && fechaRecepcion && cliente);
}

/**
 * Pide confirmación al usuario para guardar progreso como borrador al cargar la página.
 */
function promptSaveProgressOnLoad() {
    try {
        // Evitar prompt repetido durante la misma sesión de reload interno
        if (window._saveProgressPrompted) {
            return;
        }
        window._saveProgressPrompted = true;

        const formData = collectFormData();
        if (!hasFormDataToSave(formData) || !hasRequiredFieldsForSave(formData)) {
            return; // No cumple condiciones mínimas (N° de recepción + fecha de recepción + cliente)
        }

        const alreadySaved = (JSON.parse(localStorage.getItem('cmr_drafts') || '[]') || []).some(d => d.cotizacion && d.cotizacion === formData.cotizacion);
        let confirmationText = 'Hay datos en el formulario. ¿Deseas guardar el progreso actual como borrador?';
        if (alreadySaved) {
            confirmationText = 'Ya existe un borrador para este caso. ¿Deseas actualizarlo con los datos actuales?';
        }

        if (confirm(confirmationText)) {
            saveAsDraft();
        } else {
            showNotification('Se decidió no guardar el progreso en este momento.', 'info');
        }
    } catch (error) {
        console.warn('No se pudo ejecutar promptSaveProgressOnLoad:', error);
    }
}

/**
 * Función para mostrar el estado de carga en la interfaz
 */
function showLoadingStatus(message, type = 'info') {
    const statusDiv = document.getElementById('loadingStatus');
    const statusText = document.getElementById('statusText');
    
    if (statusDiv && statusText) {
        statusDiv.style.display = 'block';
        statusText.textContent = message;
        
        // Cambiar color según el tipo
        switch(type) {
            case 'success':
                statusDiv.style.backgroundColor = '#d4edda';
                statusDiv.style.borderColor = '#c3e6cb';
                statusDiv.style.color = '#155724';
                break;
            case 'error':
                statusDiv.style.backgroundColor = '#f8d7da';
                statusDiv.style.borderColor = '#f5c6cb';
                statusDiv.style.color = '#721c24';
                break;
            case 'warning':
                statusDiv.style.backgroundColor = '#fff3cd';
                statusDiv.style.borderColor = '#ffeaa7';
                statusDiv.style.color = '#856404';
                break;
            default:
                statusDiv.style.backgroundColor = '#d1ecf1';
                statusDiv.style.borderColor = '#bee5eb';
                statusDiv.style.color = '#0c5460';
        }
    }
    
    console.log(`📢 STATUS: ${message}`);
}

/**
 * Función de prueba para verificar la carga de elementos
 */
function testLoadItems() {
    console.log('🧪 INICIANDO PRUEBA DE CARGA DE ELEMENTOS...');
    showLoadingStatus('Iniciando prueba de carga...', 'info');
    
    // Mostrar estado actual
    console.log('Estado actual:');
    console.log('- allItemsData:', allItemsData);
    console.log('- predefinedItemsData:', predefinedItemsData);
    console.log('- currentEnsayoType:', currentEnsayoType);
    
    // Limpiar datos actuales para forzar recarga
    allItemsData = {};
    predefinedItemsData = [];
    
    // Forzar mostrar menu1
    const menu1 = document.getElementById('menu1');
    if (menu1) {
        menu1.style.display = 'block';
        console.log('✅ Menu1 mostrado');
    }
    
    // Seleccionar automáticamente la opción en el select
    const select = document.getElementById('opciones');
    if (select) {
        select.value = 'menu1';
        console.log('✅ Opción menu1 seleccionada automáticamente');
    }
    
    // Forzar carga de datos
    loadPredefinedItemsFromJSON('ensayos_acreditados').then(() => {
        console.log('✅ Datos cargados forzadamente');
        console.log('predefinedItemsData después de la carga:', predefinedItemsData);
        
        // Verificar que tenemos datos
        if (predefinedItemsData && predefinedItemsData.length > 0) {
            console.log('✅ Datos disponibles, cargando en tabla...');
            showLoadingStatus('Datos disponibles, cargando tabla...', 'info');
            
            // Forzar carga de elementos en la tabla
            loadPredefinedItems('', 'Todos');
            
            // Verificar estado después de un momento
            setTimeout(() => {
                const itemsList = document.getElementById('itemsList');
                if (itemsList) {
                    console.log('📋 Contenido de itemsList:', itemsList.innerHTML);
                    console.log('📋 Número de elementos hijos:', itemsList.children.length);
                    
                    if (itemsList.children.length > 0) {
                        showLoadingStatus(`✅ Prueba exitosa: ${itemsList.children.length} elementos mostrados en tabla`, 'success');
                    } else {
                        showLoadingStatus('⚠️ Tabla vacía después de la carga', 'warning');
                    }
                }
            }, 1000);
        } else {
            showLoadingStatus('❌ No se pudieron cargar datos', 'error');
        }
        
    }).catch(error => {
        console.error('❌ Error en la prueba:', error);
        showLoadingStatus(`❌ Error en la prueba: ${error.message}`, 'error');
    });
}

/**
 * Función de depuración para verificar el estado de los filtros
 */
function debugFilterStatus() {
    console.log('=== ESTADO DE FILTROS ===');
    
    // Verificar filtros de Tabla 1
    const activeBtn1 = document.querySelector('#menu1 .filter-btn-1.active');
    console.log('Filtro activo en TABLA 1:', activeBtn1 ? activeBtn1.textContent : 'Ninguno');
    
    // Verificar filtros de Tabla 2
    const activeBtn2 = document.querySelector('#menu2 .filter-btn-2.active');
    console.log('Filtro activo en TABLA 2:', activeBtn2 ? activeBtn2.textContent : 'Ninguno');
    
    // Verificar visibilidad de tablas
    const menu1 = document.getElementById('menu1');
    const menu2 = document.getElementById('menu2');
    const tabla1Visible = menu1 && menu1.style.display !== 'none';
    const tabla2Visible = menu2 && menu2.style.display !== 'none';
    
    console.log('TABLA 1 visible:', tabla1Visible);
    console.log('TABLA 2 visible:', tabla2Visible);
    
    // Mostrar información de elementos cargados
    const itemsList = document.getElementById('itemsList');
    const itemsList2 = document.getElementById('itemsList2');
    const elementos1 = itemsList ? itemsList.children.length : 0;
    const elementos2 = itemsList2 ? itemsList2.children.length : 0;
    
    console.log('Elementos en TABLA 1:', elementos1);
    console.log('Elementos en TABLA 2:', elementos2);
    
    console.log('=========================');
}

/**
 * Inicializa los filtros asegurando que "Todos" esté activo por defecto
 */
function initializeFilters() {
    // Asegurar que el botón "Todos" esté activo en menu1 (Tabla 1)
    const todosBtn1 = document.querySelector('#menu1 #todos-btn-1');
    if (todosBtn1) {
        document.querySelectorAll('#menu1 .filter-btn-1').forEach(btn => btn.classList.remove('active'));
        todosBtn1.classList.add('active');
        console.log('Filtro "Todos" activado para TABLA 1');
    }

    // Asegurar que el botón "Todos" esté activo en menu2 (Tabla 2)
    const todosBtn2 = document.querySelector('#menu2 #todos-btn-2');
    if (todosBtn2) {
        document.querySelectorAll('#menu2 .filter-btn-2').forEach(btn => btn.classList.remove('active'));
        todosBtn2.classList.add('active');
        console.log('Filtro "Todos" activado para TABLA 2');
    }
}

/**
 * Inicializa los event listeners para los filtros y búsquedas
 */
function initializeFilterEventListeners() {
    console.log('🔧 Inicializando event listeners de filtros...');
    
    const searchInput1 = document.getElementById('searchInput1');
    
    // Event Listener para el input de búsqueda del menu1
    if (searchInput1 && !searchInput1.hasAttribute('data-listener-added')) {
        searchInput1.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const activeFilterBtn = document.querySelector('#menu1 .filter-btn-1.active');
            const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            
            console.log('Búsqueda en menu1:', { searchTerm, filterValue });
            // Aplica filtros específicos para menu1 y reinicia la paginación
            loadPredefinedItems(searchTerm, filterValue, 1);
        });
        searchInput1.setAttribute('data-listener-added', 'true');
    }

    // Event Listener para los botones de filtro del menu1 (TABLA 1)
    const filterButtons1 = document.querySelector('#menu1 #filterButtons1');
    if (filterButtons1 && !filterButtons1.hasAttribute('data-listener-added')) {
        filterButtons1.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn-1')) {
                console.log('Filtro clicado en TABLA 1 (menu1):', e.target.dataset.filter);
                
                // GUARDAR los valores actuales de los inputs antes de cambiar de filtro
                saveCurrentTableData('ensayos_acreditados');
                
                // Remueve la clase 'active' de todos los botones de la TABLA 1
                document.querySelectorAll('#menu1 .filter-btn-1').forEach(btn => btn.classList.remove('active'));
                // Añade la clase 'active' al botón clicado
                e.target.classList.add('active');

                const filterValue = e.target.dataset.filter;
                const searchInput1 = document.getElementById('searchInput1');
                const searchTerm = searchInput1 ? searchInput1.value : '';
                
                // Aplica filtros específicos para TABLA 1 y reinicia la paginación
                loadPredefinedItems(searchTerm, filterValue, 1);
                console.log(`✅ Filtro "${filterValue}" aplicado a TABLA 1`);
            }
        });
        filterButtons1.setAttribute('data-listener-added', 'true');
    }

    // Añadir botón de filtro 'Con cantidades' en menu1 si no existe
    try {
        const existing = document.querySelector('#menu1 .filter-btn-1[data-filter="ConCantidad"]');
        if (!existing && filterButtons1) {
            const btn = document.createElement('button');
            btn.className = 'filter-btn-1 btn-con-cantidades';
            btn.dataset.filter = 'ConCantidad';
            btn.type = 'button';
            btn.textContent = 'Con cantidades';
            filterButtons1.appendChild(btn);
        }
    } catch (e) {}

    console.log('✅ Event listeners de filtros inicializados correctamente');
}

/**
 * Establece la fecha actual en los campos de entrada 'fechaRecepcion' y 'fechaEntrega'.
 */
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
}


// Función para actualizar el resumen general Contador de Elementos de recepcion / entrega
function actualizarResumen() {
    // Inicializamos los contadores
    let totalRecepcion = 0;
    let totalEntrega = 0;

    // Buscamos todos los elementos .item en el documento
    const todosLosItems = document.querySelectorAll(".item");

    // Recorremos cada ítem para sumar cantidades
    todosLosItems.forEach(item => {
    // Obtenemos el valor numérico ingresado en cantidad
    const cantidad = parseInt(item.querySelector(".cantidad").value) || 0;
    // Obtenemos el estado seleccionado (Recepcion o Entrega)
    const estado = item.querySelector(".estado").value;

    // Sumar según el estado
    if (estado === "Recepcion") totalRecepcion += cantidad;
    if (estado === "Entrega") totalEntrega += cantidad;
    });

    // Actualizamos los contadores en pantalla
    document.getElementById("totalRecepcion").textContent = totalRecepcion;
    document.getElementById("totalEntrega").textContent = totalEntrega;
}

// Escuchamos todos los cambios que ocurran sobre inputs/selects relevantes
document.addEventListener("input", function (e) {
    if (e.target.classList.contains("cantidad") || e.target.classList.contains("estado")) {
    actualizarResumen(); // Llamamos la función de resumen
    }
});

// Ejecutamos la suma al cargar la página
actualizarResumen();


/**
 * Inicializa el selector 'quoteNumber' con números de recepción en formato R YY-001.
 * YY representa los dos últimos dígitos del año actual.
 */
function initializeQuoteNumbers() {
    const select = document.getElementById('quoteNumber');
    if (!select) return; // Sale si el elemento no existe

    // Obtener números no disponibles y normalizarlos
    const unavailable = getUnavailableReceptionNumbers();
    const nextCode = getNextReceptionNumber();

    // DEBUG: Log detallado
    console.group('🔐 initializeQuoteNumbers DEBUG');
    console.log('Números no disponibles en localStorage:', Array.from(unavailable));

    // Obtener los dos últimos dígitos del año actual
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Ej: 2025 → "25"

    // Limpiar opciones existentes (mantener solo la primera si es placeholder)
    const firstOpt = select.options[0];
    select.innerHTML = '';
    if (firstOpt && firstOpt.value === '') {
        select.appendChild(firstOpt);
    }

    if (nextCode) {
        const option = document.createElement('option');
        option.value = nextCode;
        option.textContent = nextCode;
        select.appendChild(option);
        console.log('✅ Solo se muestra el siguiente número disponible:', nextCode);
    }

    restoreHeldReceptionSelection();

    console.groupEnd();
}

// ===============================
// Nº de Recepción único (local)
// ===============================
function getUsedReceptionNumbers() {
    // Estructura: { '2025': ['R 25-001', ...] }
    return JSON.parse(localStorage.getItem('cmr_receptions_used') || '{}');
}
function setUsedReceptionNumbers(map) {
    localStorage.setItem('cmr_receptions_used', JSON.stringify(map));
}
function getRestrictedReceptionNumbers() {
    // Estructura: ['R 25-001', 'R 25-002', ...] - números que no se pueden usar
    return JSON.parse(localStorage.getItem('cmr_receptions_restricted') || '[]');
}
function setRestrictedReceptionNumbers(arr) {
    localStorage.setItem('cmr_receptions_restricted', JSON.stringify(arr));
}

function getHeldReceptionNumbers() {
    return JSON.parse(localStorage.getItem('cmr_receptions_held') || '{}');
}

function setHeldReceptionNumbers(map) {
    localStorage.setItem('cmr_receptions_held', JSON.stringify(map));
}

function cleanupHeldReceptionNumbers() {
    const now = Date.now();
    const current = getHeldReceptionNumbers();
    let changed = false;

    Object.keys(current).forEach((code) => {
        const entry = current[code] || {};
        if (!entry.expiresAt || Number(entry.expiresAt) <= now) {
            delete current[code];
            changed = true;
        }
    });

    if (changed) {
        setHeldReceptionNumbers(current);
    }

    return current;
}

function formatLockRemainingTime(expiresAt) {
    const remainingMs = Number(expiresAt) - Date.now();
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
        return '--:--';
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function refreshLockRemainingInfo() {
    const label = document.getElementById('lockRemainingTime');
    if (!label) return;

    const select = document.getElementById('quoteNumber');
    const selectedCode = (select?.value || '').trim();
    const held = cleanupHeldReceptionNumbers();
    const entry = selectedCode ? held[selectedCode] : null;

    if (entry && entry.expiresAt) {
        label.textContent = formatLockRemainingTime(entry.expiresAt);
        label.style.color = '#dc3545';
        return;
    }

    label.textContent = '--:--';
    label.style.color = '#6c757d';
}

function getUnavailableReceptionNumbers() {
    const used = getUsedReceptionNumbers();
    const held = cleanupHeldReceptionNumbers();
    const restricted = getRestrictedReceptionNumbers();
    const unavailable = new Set();

    Object.values(used || {}).flat().forEach((code) => unavailable.add(normalizeReceptionNumber(code)));
    Object.keys(held || {}).forEach((code) => unavailable.add(normalizeReceptionNumber(code)));
    restricted.forEach((code) => unavailable.add(normalizeReceptionNumber(code)));

    // Agregar números que provienen de la base de datos (procesos_acreditados)
    try {
        if (Array.isArray(window.dbUnavailableReceptionNumbers)) {
            window.dbUnavailableReceptionNumbers.forEach(n => unavailable.add(normalizeReceptionNumber(n)));
        } else if (window.dbUnavailableReceptionNumbers instanceof Set) {
            window.dbUnavailableReceptionNumbers.forEach(n => unavailable.add(normalizeReceptionNumber(n)));
        }
    } catch (e) { /* ignore */ }

    return unavailable;
}

// Cache de procesos y números tomados desde la DB
window.dbProcessesCache = window.dbProcessesCache || [];
window.dbUnavailableReceptionNumbers = window.dbUnavailableReceptionNumbers || new Set();

/**
 * Refresca la cache de procesos acreditados y los números reservados en DB.
 * También limpia localStorage de números que ya no existen en la DB.
 * Devuelve un Set normalizado.
 */
async function refreshDbUnavailableReceptionNumbers() {
    try {
        const processes = await loadAcreditadosProcessesInUse();
        window.dbProcessesCache = Array.isArray(processes) ? processes : [];
        const s = new Set();
        window.dbProcessesCache.forEach(p => {
            const code = String(p.numero_proceso || p.numero || p.cotizacion || p.id || '').trim();
            if (code) s.add(normalizeReceptionNumber(code));
        });
        window.dbUnavailableReceptionNumbers = s;

        // Limpiar localStorage: remover números de used/held que ya no existen en la DB
        syncLocalStorageWithDB(s);

        return s;
    } catch (e) {
        console.warn('refreshDbUnavailableReceptionNumbers error', e);
        return window.dbUnavailableReceptionNumbers || new Set();
    }
}

/**
 * Sincroniza localStorage con la DB: elimina números de used y held
 * que ya no existen en procesos_acreditados.
 * Solo limpia si la DB devolvió al menos 1 proceso (evita limpiar con DB vacía/fallida).
 */
function syncLocalStorageWithDB(dbNumbers) {
    if (!dbNumbers || dbNumbers.size === 0) return;

    try {
        // Limpiar used: solo mantener números que existen en la DB
        const used = getUsedReceptionNumbers();
        let usedChanged = false;
        Object.keys(used).forEach((year) => {
            const original = used[year] || [];
            const filtered = original.filter((code) => dbNumbers.has(normalizeReceptionNumber(code)));
            if (filtered.length !== original.length) {
                used[year] = filtered;
                usedChanged = true;
            }
        });
        if (usedChanged) setUsedReceptionNumbers(used);

        // Limpiar held: solo mantener números que existen en la DB
        const held = getHeldReceptionNumbers();
        let heldChanged = false;
        Object.keys(held).forEach((code) => {
            if (!dbNumbers.has(normalizeReceptionNumber(code))) {
                delete held[code];
                heldChanged = true;
            }
        });
        if (heldChanged) setHeldReceptionNumbers(held);

        // Limpiar restricted: solo mantener números que existen en la DB
        const restricted = getRestrictedReceptionNumbers();
        const filteredRestricted = restricted.filter((code) => dbNumbers.has(normalizeReceptionNumber(code)));
        if (filteredRestricted.length !== restricted.length) {
            setRestrictedReceptionNumbers(filteredRestricted);
        }
    } catch (e) {
        console.warn('syncLocalStorageWithDB error', e);
    }
}

async function loadAcreditadosProcessesInUse() {
    try {
        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_procesos_acreditados' })
        });

        const result = await response.json();
        if (response.ok && result?.ok && Array.isArray(result.procesos)) {
            return result.procesos;
        }
    } catch (error) {
        console.warn('No se pudieron cargar procesos acreditados:', error?.message || error);
    }

    return [];
}

async function renderReceptionNumbersInUsePanel() {
    const container = document.getElementById('receptionNumbersInUseList');
    if (!container) return;

    container.innerHTML = '<div style="color:#666; font-size:12px;">Cargando procesos acreditados...</div>';

    const processes = await loadAcreditadosProcessesInUse();
    const activeProcesses = processes.filter((process) => {
        const status = String(process.estado || process.status || '').toLowerCase();
        return status !== 'finalizado';
    });

    if (!activeProcesses.length) {
        container.innerHTML = '<div style="color:#777; font-size:12px;">No hay procesos acreditados en uso.</div>';
        return;
    }

    container.innerHTML = activeProcesses.slice(0, 30).map((process) => {
        const code = String(process.numero_proceso || process.numero || process.id || '').trim();
        const client = String(process.cliente || process.nombre_cliente || process.empresa || '-').trim();
        const status = String(process.estado || process.status || '-').trim();
        return `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; border:1px solid #e3e8f2; border-radius:8px; background:#fff;">
                <div style="display:grid; gap:2px; min-width:0;">
                    <strong style="color:#022859;">${escapeHtml(code || 'Sin número')}</strong>
                    <span style="font-size:12px; color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:360px;">${escapeHtml(client)} · ${escapeHtml(status)}</span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-success release-accredited-process-btn" data-process-number="${escapeHtml(code)}" style="white-space:nowrap;">Liberar N°</button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.release-accredited-process-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const code = button.getAttribute('data-process-number') || '';
            if (!code) return;
            await freeReceptionNumber(code);
        });
    });
}

function refreshNextReceptionNumberInfo() {
    const nextValueEl = document.getElementById('nextReceptionNumberValue');
    if (nextValueEl) {
        nextValueEl.textContent = getNextReceptionNumber();
    }
}

function setTipoEnsayosAlert(message, type = 'info') {
    const alertBox = document.getElementById('tipoEnsayosAlert');
    if (!alertBox) return;

    if (!message) {
        alertBox.style.display = 'none';
        alertBox.textContent = '';
        alertBox.style.background = '';
        alertBox.style.color = '';
        alertBox.style.borderColor = '';
        return;
    }

    alertBox.textContent = message;
    alertBox.style.display = 'block';

    if (type === 'success') {
        alertBox.style.background = '#e8f5e9';
        alertBox.style.color = '#1b5e20';
        alertBox.style.borderColor = '#a5d6a7';
    } else if (type === 'warning') {
        alertBox.style.background = '#fff8e1';
        alertBox.style.color = '#8a6d1d';
        alertBox.style.borderColor = '#ffe082';
    } else if (type === 'error') {
        alertBox.style.background = '#fdecea';
        alertBox.style.color = '#b71c1c';
        alertBox.style.borderColor = '#f5c2c7';
    } else {
        alertBox.style.background = '#eef5ff';
        alertBox.style.color = '#0b4f9c';
        alertBox.style.borderColor = '#b6d4fe';
    }
}

async function freeReceptionNumber(code) {
    if (!code) return;

    const normalized = normalizeReceptionNumber(code);
    const used = getUsedReceptionNumbers();
    const held = getHeldReceptionNumbers();

    // Intentar liberarlo también en DB si existe y es una reserva temporal
    try {
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_proceso', numero_proceso: code })
        });
        const json = await resp.json();
        if (json && json.ok && json.proceso) {
            const proc = json.proceso;
            const client = String(proc.cliente || proc.nombre_cliente || '').toLowerCase();
            const obs = String(proc.observaciones || proc.observacion || proc.note || '').toLowerCase();
            const isTemp = client.includes('reserva_temp') || client.includes('reserva') || obs.includes('reserv') || obs.includes('temp');
            // Solo eliminar si fue creada como reserva temporal (marca específica)
            if (isTemp) {
                try {
                    const delResp = await fetch('/.netlify/functions/conectar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete_proceso', numero_proceso: code })
                    });
                    const delJson = await delResp.json();
                    if (!(delJson && delJson.ok)) {
                        console.warn('No se pudo eliminar reserva en DB', delJson);
                    }
                } catch (e) {
                    console.warn('Error borrando reserva en DB', e);
                }
            }
        }
    } catch (e) {
        console.warn('freeReceptionNumber DB check failed', e);
    }

    // Limpiar localmente
    Object.keys(used).forEach((year) => {
        used[year] = (used[year] || []).filter((item) => normalizeReceptionNumber(item) !== normalized);
    });

    Object.keys(held).forEach((itemCode) => {
        if (normalizeReceptionNumber(itemCode) === normalized) {
            delete held[itemCode];
        }
    });

    setUsedReceptionNumbers(used);
    setHeldReceptionNumbers(held);

    try {
        const savedSelected = (localStorage.getItem('selected_reception_number') || '').trim();
        if (savedSelected && normalizeReceptionNumber(savedSelected) === normalized) {
            localStorage.removeItem('selected_reception_number');
        }
    } catch (e) {
        console.warn('No se pudo limpiar el número seleccionado al liberar:', e);
    }

    try { await refreshDbUnavailableReceptionNumbers(); } catch (e) { console.warn(e); }
    try {
        const select = document.getElementById('quoteNumber');
        if (select) {
            select.disabled = false;
        }
    } catch (error) { console.warn(error); }
    try { initializeQuoteNumbers(); } catch (error) { console.warn(error); }
    refreshLockRemainingInfo();

    showNotification(`✅ N° liberado: ${code}`, 'success');
}

async function lockReceptionNumberForMinutes(minutes = 20) {
    const select = document.getElementById('quoteNumber');
    const requestedCode = (select?.value || '').trim();
    if (!select) return;

    try { await refreshDbUnavailableReceptionNumbers(); } catch (e) { console.warn(e); }

    const unavailable = getUnavailableReceptionNumbers();
    let code = requestedCode;

    if (!code || unavailable.has(normalizeReceptionNumber(code))) {
        code = getNextReceptionNumber();
        if (code && requestedCode && normalizeReceptionNumber(code) !== normalizeReceptionNumber(requestedCode)) {
            showNotification(`⚠️ El número ${requestedCode} ya estaba ocupado o reservado. Se bloqueará ${code} automáticamente.`, 'warning');
        }
    }

    if (!code) {
        showNotification('No hay números de recepción disponibles para bloquear.', 'error');
        return;
    }

    const expiresAt = Date.now() + (Number(minutes) * 60 * 1000);

    // Intentar crear una reserva temporal en la DB para que otros clientes la vean
    try {
        // Comprobar si ya existe un proceso con ese número
        const checkResp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_proceso', numero_proceso: code })
        });
        const checkJson = await checkResp.json();
        if (checkJson && checkJson.ok && checkJson.proceso) {
            // Ya existe un proceso real con ese número; intentar con el siguiente disponible
            await refreshDbUnavailableReceptionNumbers();
            code = getNextReceptionNumber();
            if (!code) {
                showNotification(`⚠️ No se pudo reservar ${requestedCode}: el número ya existe y no hay otro disponible`, 'warning');
                return;
            }

            if (select && select.value !== code) {
                if (!Array.from(select.options).some(opt => opt.value === code)) {
                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = code;
                    select.appendChild(option);
                }
                select.value = code;
                saveSelectedReceptionNumber();
            }

            showNotification(`⚠️ El número solicitado ya estaba ocupado. Se bloqueó ${code} en su lugar.`, 'warning');
        }

        // Insertar proceso de reserva temporal con el código final elegido
        const untilIso = new Date(expiresAt).toISOString();
        const insert = {
            numero_proceso: code,
            estado: 'recepcion',
            cliente: 'RESERVA_TEMP',
            observaciones: `reservado_temp_hasta:${untilIso}`
        };
        const addResp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_proceso', insert })
        });
        const addJson = await addResp.json();
        if (addJson && addJson.ok) {
            showNotification(`🔒 ${code} bloqueado por ${minutes} min (DB)`, 'info');
        } else {
            console.warn('No se pudo crear reserva en DB', addJson);
            showNotification(`🔒 ${code} bloqueado localmente (DB fallida)`, 'info');
        }
    } catch (e) {
        console.warn('Error creando reserva en DB', e);
        showNotification(`🔒 ${code} bloqueado localmente (error DB)`, 'info');
    }

    const held = cleanupHeldReceptionNumbers();
    held[code] = { expiresAt, minutes: Number(minutes) || 20 };
    setHeldReceptionNumbers(held);

    try { await refreshDbUnavailableReceptionNumbers(); } catch (e) { console.warn(e); }
    try {
        if (select) {
            if (!Array.from(select.options).some(opt => opt.value === code)) {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = code;
                select.appendChild(option);
            }
            select.value = code;
            select.disabled = true;
        }
    } catch (error) { console.warn(error); }
    try { refreshNextReceptionNumberInfo(); } catch (error) { console.warn(error); }
    refreshLockRemainingInfo();

    try { saveSelectedReceptionNumber(); } catch (error) { console.warn('No se pudo guardar el número bloqueado final:', error); }
}

/**
 * URL del servidor de sincronización (cambiar si usas otro servidor)
 * Localmente: http://localhost:3001
 * En producción: https://tu-servidor.com
 */
function startAutoSync() {
    return;
}

function stopAutoSync() {
    return;
}

document.addEventListener('visibilitychange', () => {
    return;
});

/**
 * Exportar números restringidos a archivo JSON
 */
function exportRestrictedNumbers() {
    const numbers = getRestrictedReceptionNumbers();
    const dataStr = JSON.stringify({
        restricted: numbers,
        exportDate: new Date().toISOString(),
        appName: 'Recepción de Elementos - High Test'
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `numeros-restringidos-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('📥 Números exportados correctamente', 'success');
}

/**
 * Importar números restringidos desde archivo JSON
 */
function importRestrictedNumbers() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!Array.isArray(data.restricted)) {
                showNotification('❌ Archivo inválido: no contiene campo "restricted"', 'error');
                return;
            }
            
            // Preguntar si desea reemplazar o fusionar
            const action = confirm(
                `Se encontraron ${data.restricted.length} números restringidos.\n\n` +
                '¿Deseas REEMPLAZAR los actuales? (OK = reemplazar, Cancelar = fusionar)'
            );
            
            let newNumbers = data.restricted;
            if (!action) {
                // Fusionar: mantener los actuales + agregar nuevos
                const current = getRestrictedReceptionNumbers();
                const normalize = (s) => normalizeReceptionNumber(s);
                const currentNorm = current.map(normalize);
                newNumbers = current.concat(
                    data.restricted.filter(n => !currentNorm.includes(normalize(n)))
                );
            }
            
            setRestrictedReceptionNumbers(newNumbers);
            
            showNotification(
                `✅ ${action ? 'Reemplazados' : 'Fusionados'} ${newNumbers.length} números restringidos`,
                'success'
            );
            
            // Reinicializar dropdown
            try { initializeQuoteNumbers(); } catch (e) {}
        } catch (error) {
            showNotification('❌ Error al leer archivo: ' + error.message, 'error');
        }
    };
    
    input.click();
}

/**
 * Normaliza un número de recepción para comparación.
 * Ej: "R 26-001", "R 26 - 001", "R26001" → "R260001"
 */
function normalizeReceptionNumber(s) {
    // Normaliza números de recepción al formato R + YYNNNN (sin espacios ni guiones)
    // Maneja variaciones como: "R 25-050", "R25050", "R 25 050", etc.
    let normalized = ('' + (s || ''))
        .toUpperCase()
        .trim()
        .replace(/\s+/g, '')    // Quitar espacios
        .replace(/-/g, '');     // Quitar guiones
    
    // Si no comienza con 'R', agregarlo
    if (!normalized.startsWith('R')) {
        normalized = 'R' + normalized;
    }
    
    // Extraer componentes: R + año (2 dígitos) + número
    const match = normalized.match(/^R(\d{2})(\d+)$/);
    if (match) {
        const year = match[1];
        const num = match[2];
        // Retornar formato estándar: R + año + 4 dígitos (padding con ceros)
        return `R${year}${num.padStart(4, '0')}`;
    }
    
    return normalized;
}

/**
 * Determina si un número de recepción está marcado como restringido
 * (pero no bloquea su visualización; solo evita edición).
 * @param {string} code
 * @returns {boolean}
 */
function isReceptionRestricted(code) {
    if (!code) return false;
    const norm = normalizeReceptionNumber(code);
    const restrictedNorm = getRestrictedReceptionNumbers().map(normalizeReceptionNumber);
    return restrictedNorm.includes(norm);
}

function getNextReceptionNumber() {
    const year = new Date().getFullYear();
    const yearSuffix = year.toString().slice(-2);
    const unavailable = getUnavailableReceptionNumbers();
    
    console.log('📋 getNextReceptionNumber() - Números no disponibles:', Array.from(unavailable));
    
    // Buscar el primer número libre real, sin depender del último usado.
    let nextSeq = 1;
    for (let i = 0; i < 1000; i++) {
        const candidate = `R${yearSuffix} ${String(nextSeq).padStart(4,'0')}`;
        const normalized = normalizeReceptionNumber(candidate);
        if (!unavailable.has(normalized)) {
            console.log('✅ Propuesta:', candidate, '(norm:', normalized + ')');
            return candidate;
        }
        nextSeq++;
    }
    return `R${yearSuffix} ${String(nextSeq).padStart(4,'0')}`;
}
function showProposedReceptionNumber() {
    const select = document.getElementById('quoteNumber');
    if (!select) return;
    const code = getNextReceptionNumber();
    if (select.options.length === 0) {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecciona número de Recepción';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);
    }

    const placeholder = select.options[0];
    if (placeholder && placeholder.value === '') {
        placeholder.textContent = 'Seleccione N° de Recepción';
    }

    Array.from(select.options).forEach((opt, index) => {
        if (index > 0) opt.remove();
    });

    if (code) {
        const suggestedOption = document.createElement('option');
        suggestedOption.value = code;
        suggestedOption.textContent = code;
        select.appendChild(suggestedOption);
    }

    restoreHeldReceptionSelection();

    refreshNextReceptionNumberInfo();
}
function commitReceptionNumber(code) {
    if (!code) return;
    const normalized = (s) => ('' + (s || '')).replace(/\s+/g, '').replace(/[-_]/g, '').toUpperCase();
    const m = code.match(/R (\d{2})-/) || code.match(/R(\d{2})/);
    const year = m ? `20${m[1]}` : new Date().getFullYear().toString();
    const used = getUsedReceptionNumbers();
    used[year] = used[year] || [];
    if (!used[year].includes(code)) used[year].push(code);
    setUsedReceptionNumbers(used);

    // Marcar la opción del selector como 'Usado' (no eliminar) y deshabilitarla
    try {
        const select = document.getElementById('quoteNumber');
        if (select) {
            const targetNorm = normalized(code);
            for (let i = 0; i < select.options.length; i++) {
                const opt = select.options[i];
                if (!opt) continue;
                const val = opt.value || opt.textContent || '';
                if (normalized(val) === targetNorm) {
                    // Añadir marca visual si no existe
                    if (!/(USADO|USADA)\b/i.test(opt.textContent)) {
                        opt.textContent = opt.textContent + ' (Usado)';
                    }
                    opt.disabled = true;
                }
            }
        }
    } catch (e) { console.warn('No se pudo actualizar selector de Nº de Recepción:', e); }

    try { refreshNextReceptionNumberInfo(); } catch (e) { console.warn(e); }
    // panel eliminado
}

// Reserva el número de recepción en el registro de usados SIN eliminar la opción del selector.
function reserveReceptionNumber(code) {
    if (!code) return;
    const m = code.match(/R (\d{2})-/) || code.match(/R(\d{2})/);
    const year = m ? `20${m[1]}` : new Date().getFullYear().toString();
    const used = getUsedReceptionNumbers();
    used[year] = used[year] || [];
    if (!used[year].includes(code)) used[year].push(code);
    setUsedReceptionNumbers(used);
}

/**
 * Inicializa múltiples SignaturePads para diferentes secciones
 */
function initializeMultipleSignaturePads() {
    const canvasIds = ['signatureCanvasRecepcion', 'signatureCanvasEntrega', 'signatureCanvasHighTest'];
    
    canvasIds.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            signaturePads[canvasId] = new SignaturePad(canvas, {
                backgroundColor: 'rgba(255, 255, 255, 0)',
                penColor: 'rgb(0, 0, 0)',
                velocityFilterWeight: 0.7,
                minWidth: 0.5,
                maxWidth: 2.5
            });

            // Redimensionar canvas si es necesario
            function resizeCanvas() {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext('2d').scale(ratio, ratio);
                signaturePads[canvasId].clear();
                
                if (signatureData[canvasId]) {
                    signaturePads[canvasId].fromDataURL(signatureData[canvasId]);
                }
            }

            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();
        }
    });
}

/**
 * Actualiza automáticamente el cargo según el nombre seleccionado para representantes de HIGH TEST
 */
let highTestUsuarios = [];

async function cargarUsuariosHighTest() {
    const selectores = [
        document.getElementById('highTestRecepcionNombre'),
        document.getElementById('highTestEntregaNombre')
    ].filter(Boolean);

    if (!selectores.length) return;

    try {
        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_usuarios' })
        });

        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'No se pudieron cargar los usuarios');

        highTestUsuarios = (Array.isArray(result.usuarios) ? result.usuarios : []).filter((usuario) => {
            const rol = String(usuario?.rol || '').trim().toLowerCase();
            return !rol.includes('administrador') && !rol.includes('admin');
        });

        selectores.forEach((select) => {
            const valorActual = select.value;
            select.innerHTML = '<option value="">Seleccionar representante...</option>';

            highTestUsuarios.forEach((usuario) => {
                const option = document.createElement('option');
                option.value = usuario.nombre || '';
                option.textContent = usuario.nombre || '';
                option.dataset.rol = usuario.rol || '';
                select.appendChild(option);
            });

            if (valorActual && highTestUsuarios.some((usuario) => usuario.nombre === valorActual)) {
                select.value = valorActual;
            }
        });

        actualizarCargoHighTest('Recepcion');
        actualizarCargoHighTest('Entrega');
    } catch (error) {
        console.error('Error cargando usuarios HIGH TEST:', error);
        selectores.forEach((select) => {
            select.innerHTML = '<option value="">Seleccionar representante...</option>';
        });
    }
}

function actualizarCargoHighTest(tipo) {
    const nombreSelectId = `highTest${tipo}Nombre`;
    const cargoInputId = `highTest${tipo}Cargo`;
    
    const nombreSelect = document.getElementById(nombreSelectId);
    const cargoInput = document.getElementById(cargoInputId);
    
    if (!nombreSelect || !cargoInput) {
        console.error(`No se encontraron los elementos: ${nombreSelectId} o ${cargoInputId}`);
        return;
    }
    
    const nombreSeleccionado = nombreSelect.value;

    const opcionSeleccionada = nombreSelect.selectedOptions && nombreSelect.selectedOptions[0];
    const cargoSeleccionado = opcionSeleccionada?.dataset?.rol || '';

    // Actualizar el campo de cargo
    if (nombreSeleccionado && cargoSeleccionado) {
        cargoInput.value = cargoSeleccionado;
        showNotification(`✅ Cargo actualizado: ${cargoSeleccionado}`, 'success');
    } else {
        cargoInput.value = '';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarUsuariosHighTest);
} else {
    cargarUsuariosHighTest();
}

/**
 * Limpia la firma de un canvas específico
 */
function clearSignature(type) {
    const canvasId = `signatureCanvas${type}`;
    if (signaturePads[canvasId]) {
        signaturePads[canvasId].clear();
        signatureData[canvasId] = null;
        
        // Mensajes específicos según el tipo de firma
        let mensaje = '';
        switch(type) {
            case 'Recepcion':
                mensaje = 'Firma de Recepción del Cliente limpiada';
                break;
            case 'Entrega':
                mensaje = 'Firma de Entrega del Cliente limpiada';
                break;
            case 'HighTest':
                mensaje = 'Firma de HIGH TEST SAS limpiada';
                break;
            default:
                mensaje = `Firma de ${type} limpiada`;
        }
        
        showNotification(`🗑️ ${mensaje}`, 'info');
    } else {
        showNotification(`❌ No se encontró el canvas de firma para ${type}`, 'error');
    }
}

/**
 * Guarda la firma de un canvas específico
 */
function saveSignature(type) {
    const canvasId = `signatureCanvas${type}`;
    if (signaturePads[canvasId] && !signaturePads[canvasId].isEmpty()) {
        signatureData[canvasId] = signaturePads[canvasId].toDataURL();
        
        // Mensajes específicos según el tipo de firma
        let mensaje = '';
        switch(type) {
            case 'Recepcion':
                mensaje = 'Firma de Recepción del Cliente guardada';
                break;
            case 'Entrega':
                mensaje = 'Firma de Entrega del Cliente guardada';
                break;
            case 'HighTest':
                mensaje = 'Firma de HIGH TEST SAS guardada';
                break;
            default:
                mensaje = `Firma de ${type} guardada`;
        }
        
        showNotification(`💾 ${mensaje}`, 'success');
    } else {
        // Mensajes específicos para errores
        let tipoFirma = '';
        switch(type) {
            case 'Recepcion':
                tipoFirma = 'Recepción del Cliente';
                break;
            case 'Entrega':
                tipoFirma = 'Entrega del Cliente';
                break;
            case 'HighTest':
                tipoFirma = 'HIGH TEST SAS';
                break;
            default:
                tipoFirma = type;
        }
        
        showNotification(`❌ No hay firma para guardar en ${tipoFirma}`, 'warning');
    }
}

/**
 * Inicializa la librería SignaturePad en el elemento canvas 'signatureCanvas'.
 * Configura las propiedades de dibujo y maneja el redimensionamiento del canvas
 * para asegurar la calidad en pantallas de alta resolución.
 */
function initializeSignaturePad() {
    canvas = document.getElementById('signatureCanvas'); // Obtiene el elemento canvas
    if (!canvas) return; // Sale si el elemento no existe

    signaturePads['signatureCanvas'] = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)', // Fondo transparente
        penColor: 'rgb(0, 0, 0)',                 // Color del trazo (negro)
        velocityFilterWeight: 0.7,
        minWidth: 0.5,
        maxWidth: 2.5,
        throttle: 16,
        minPointDistance: 3,
    });

    /**
     * Redimensiona el canvas de la firma para que coincida con su tamaño visible,
     * teniendo en cuenta la relación de píxeles del dispositivo para una mejor calidad.
     */
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1); // Calcula el ratio de píxeles
        canvas.width = canvas.offsetWidth * ratio;   // Ajusta el ancho interno del canvas
        canvas.height = canvas.offsetHeight * ratio; // Ajusta el alto interno del canvas
        canvas.getContext('2d').scale(ratio, ratio); // Escala el contexto para dibujar en alta resolución
        signaturePads['signatureCanvas'].clear(); // Limpia la firma después de redimensionar para evitar distorsiones
        // Si hay datos de firma guardados, los vuelve a dibujar después del redimensionamiento
        if (signatureData['signatureCanvas']) {
            const img = new Image();
            img.onload = function() {
                signaturePads['signatureCanvas'].fromDataURL(signatureData['signatureCanvas']);
            };
            img.src = signatureData['signatureCanvas'];
        }
    }

    window.addEventListener('resize', resizeCanvas); // Escucha el evento de redimensionamiento de la ventana
    resizeCanvas(); // Llama a la función de redimensionamiento al inicio
}

/**
 * Inicializa el canvas para el dibujo manual.
 * NOTA: La funcionalidad de esta función podría solaparse con SignaturePad.
 * Si SignaturePad se utiliza para todo el dibujo, esta podría ser redundante.
 */
function initializeSignatureCanvas() {
    canvas = document.getElementById('signatureCanvas');
    if (!canvas) return; // Sale si el elemento no existe

    ctx = canvas.getContext('2d');

    // Configura las propiedades del contexto de dibujo del canvas
    ctx.strokeStyle = '#000';    // Color del trazo
    ctx.lineWidth = 2;           // Ancho del trazo
    ctx.lineCap = 'round';       // Estilo de los extremos del trazo

    // Eventos del ratón para el dibujo
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Eventos táctiles para dispositivos móviles
    canvas.addEventListener('touchstart', handleTouch, { passive: false }); // 'passive: false' para permitir preventDefault
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

/**
 * Rellena la sección 'itemsList' con los artículos predefinidos,
 * creando campos de entrada para la cantidad y el estado de cada uno.
 */

document.addEventListener('DOMContentLoaded', () => {
    const searchInput1 = document.getElementById('searchInput1'); // Búsqueda para ensayos alcance
    const filterButtons = document.querySelector('.filter-buttons');
    const elementsTableBody = document.getElementById('elementsTableBody');

    let allElements = []; // Almacenará todos los elementos cargados del JSON
    let currentFilter = 'Todos'; // Filtro activo (por defecto 'Todos')
    let searchTerm = ''; // Término de búsqueda actual

    // Función para cargar los datos del JSON
    async function loadElements() {
        try {
            // Utilizamos el timestamp para evitar problemas de caché durante el desarrollo.
            const response = await fetch('list_elementos.json?t=' + new Date().getTime());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Asegurarnos de que allElements sea un array
            allElements = Array.isArray(data) ? data : (data.elementos || []);
            
            // Validar y limpiar los datos
            allElements = allElements.map(element => ({
                id: element.id || Date.now().toString(),
                nombre: element.nombre || '',
                tipo: element.tipo || 'Otros',
                caracteristicas: element.caracteristicas || '',
                observaciones: element.observaciones || '',
                cantidadDisponible: element.cantidadDisponible || 999
            }));

            console.log('Elementos cargados:', allElements); // Para debugging
            displayElements(allElements);
        } catch (error) {
            console.error('Error al cargar los elementos:', error);
            if (elementsTableBody) {
                elementsTableBody.innerHTML = '<div style="text-align: center; padding: 20px;">Error al cargar los datos. Por favor, recargue la página.</div>';
            }
        }
    }

    // Función para aplicar filtros y búsqueda a la tabla de ítems predefinidos
    function applyFiltersToItemsList() {
        const menu1 = document.getElementById('menu1');
        const menu2 = document.getElementById('menu2');
        
        if (menu1 && menu1.style.display === 'block') {
            const currentSearch = searchInput1 ? searchInput1.value.trim() : '';
            const activeFilterBtn = document.querySelector('#menu1 .filter-btn-1.active');
            const currentFilterType = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            loadPredefinedItems(currentSearch, currentFilterType);
        } else if (menu2 && menu2.style.display === 'block') {
            const currentSearch = searchInput2 ? searchInput2.value.trim() : '';
            const activeFilterBtn = document.querySelector('#menu2 .filter-btn-2.active');
            const currentFilterType = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            loadPredefinedItemsForMenu2(currentSearch, currentFilterType);
        }
    }

    // Event Listener para el input de búsqueda del menu1
    if (searchInput1) {
        searchInput1.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const activeFilterBtn = document.querySelector('#menu1 .filter-btn-1.active');
            const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            
            console.log('Búsqueda en menu1:', { searchTerm, filterValue });
            // Aplica filtros específicos para menu1 y reinicia la paginación
            loadPredefinedItems(searchTerm, filterValue, 1);
        });
    }

    // Event Listener para el input de búsqueda del menu2
    if (searchInput2) {
        searchInput2.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const activeFilterBtn = document.querySelector('#menu2 .filter-btn-2.active');
            const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            
            console.log('Búsqueda en menu2:', { searchTerm, filterValue });
            // Aplica filtros específicos para menu2 y reinicia la paginación
            loadPredefinedItemsNoAcreditados(searchTerm, filterValue, 1);
        });
    }

    // Event Listener para los botones de filtro del menu1 (TABLA 1)
    const filterButtons1 = document.querySelector('#menu1 #filterButtons1');
    if (filterButtons1) {
        filterButtons1.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn-1')) {
                console.log('Filtro clicado en TABLA 1 (menu1):', e.target.dataset.filter);
                // GUARDAR los valores actuales de los inputs antes de cambiar de filtro
                saveCurrentTableData('ensayos_acreditados');
                // Remueve la clase 'active' de todos los botones de la TABLA 1
                document.querySelectorAll('#menu1 .filter-btn-1').forEach(btn => btn.classList.remove('active'));
                // Añade la clase 'active' al botón clicado
                e.target.classList.add('active');

                const filterValue = e.target.dataset.filter;
                const searchInput1 = document.getElementById('searchInput1');
                const searchTerm = searchInput1 ? searchInput1.value : '';
                
                // Aplica filtros específicos para TABLA 1 y reinicia la paginación
                loadPredefinedItems(searchTerm, filterValue, 1);
                console.log(`✅ Filtro "${filterValue}" aplicado a TABLA 1`);
            }
        });
    }

    // Event Listener para los botones de filtro del menu2 (TABLA 2)
    const filterButtons2 = document.querySelector('#menu2 #filterButtons2');
    if (filterButtons2) {
        filterButtons2.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn-2')) {
                console.log('Filtro clicado en TABLA 2 (menu2):', e.target.dataset.filter);
                
                // GUARDAR los valores actuales de los inputs antes de cambiar de filtro
                saveCurrentTableData('ensayos_no_acreditados');
                
                // Remueve la clase 'active' de todos los botones de la TABLA 2
                document.querySelectorAll('#menu2 .filter-btn-2').forEach(btn => btn.classList.remove('active'));
                // Añade la clase 'active' al botón clicado
                e.target.classList.add('active');

                const filterValue = e.target.dataset.filter;
                const searchInput2 = document.getElementById('searchInput2');
                const searchTerm = searchInput2 ? searchInput2.value : '';
                
                // Aplica filtros específicos para TABLA 2 y reinicia la paginación
                loadPredefinedItemsNoAcreditados(searchTerm, filterValue, 1);
                console.log(`✅ Filtro "${filterValue}" aplicado a TABLA 2`);
            }
        });
    }

    // Cargar los elementos cuando la página esté lista
    loadElements();
});



// Variables globales para la paginación de las tablas principales
let currentPageItemsList = 1;
let currentPageItemsList2 = 1;
let filteredItemsGlobal = [];
let filteredItems2Global = [];

function loadPredefinedItems(searchTerm = '', filterType = 'Todos', page = 1) {
    console.log('🔄 INICIANDO loadPredefinedItems...');
    console.log('Parámetros recibidos:', { searchTerm, filterType, page });
    
    const itemsList = document.getElementById('itemsList');
    if (!itemsList) {
        console.error('❌ ERROR: itemsList element not found');
        return;
    }
    console.log('✅ itemsList element encontrado');

    console.log('Datos disponibles para cargar:');
    console.log('- predefinedItemsData:', predefinedItemsData);
    console.log('- currentEnsayoType:', currentEnsayoType);
    console.log('- Cantidad de elementos:', predefinedItemsData ? predefinedItemsData.length : 0);

    itemsList.innerHTML = ''; // Limpia los elementos existentes para evitar duplicados al recargar

    // Verificar que tenemos datos cargados
    if (!predefinedItemsData || predefinedItemsData.length === 0) {
        console.warn('⚠️ No hay datos de elementos predefinidos disponibles');
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'no-results';
        noDataDiv.style.cssText = 'text-align: center; padding: 20px; color: #666; border: 2px solid #ff6b6b; background-color: #ffe6e6;';
        noDataDiv.innerHTML = `
            <strong>⚠️ No hay elementos predefinidos disponibles</strong><br>
            <small>Tipo de ensayo: ${currentEnsayoType || 'No definido'}</small><br>
            <small>Verifica que el archivo predefined_items.json esté disponible</small>
        `;
        itemsList.appendChild(noDataDiv);
        return;
    }

    console.log('✅ Datos disponibles, procediendo a filtrar...');

    // Filtrar los ítems basándose en el término de búsqueda y el filtro
    let filteredItems = predefinedItemsData.filter((itemData, index) => {
        let matchesSearch = true;
        let matchesFilter = true;

        // Filtro por búsqueda
        if (searchTerm) {
            matchesSearch = itemData.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        }

        // Filtro por tipo usando las categorías del JSON o por elementos con cantidades
        if (filterType === 'ConCantidad') {
            // Verificar si hay datos guardados para este elemento
            const saveKey = `row_${index}`;
            const hasSaved = savedRowsData?.ensayos_acreditados && savedRowsData.ensayos_acreditados[saveKey] && (
                (parseInt(savedRowsData.ensayos_acreditados[saveKey].cantRecibida) || 0) > 0 ||
                (parseInt(savedRowsData.ensayos_acreditados[saveKey].cantEntregada) || 0) > 0
            );
            // Verificar inputs visibles
            const q1 = parseInt(document.getElementById(`qty_${index}`)?.value || 0) || 0;
            const q2 = parseInt(document.getElementById(`qty_2_${index}`)?.value || 0) || 0;
            matchesFilter = hasSaved || q1 > 0 || q2 > 0;
        } else if (filterType !== 'Todos') {
            matchesFilter = itemData.categoria === filterType;
        }

        return matchesSearch && matchesFilter;
    });

    // Guardar elementos filtrados globalmente para la paginación
    filteredItemsGlobal = filteredItems;
    currentPageItemsList = page;

    console.log('Filtered items for TABLA 1 (Ensayos Alcance):', filteredItems);

    // Calcular paginación
    const itemsPerPage = 10;
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = filteredItems.slice(startIndex, endIndex);

    // Mostrar los ítems de la página actual
    itemsToShow.forEach((itemData, displayIndex) => {
        const originalIndex = predefinedItemsData.findIndex(item => item.id === itemData.id);
        const globalIndex = startIndex + displayIndex + 1; // Número global del elemento
        const itemDiv = document.createElement('div');
        itemDiv.className = 'items-grid item-row';
        itemDiv.dataset.tableType = 'ensayos_acreditados';
        itemDiv.dataset.rowIndex = originalIndex;

        // Permitir imágenes sólo para Vehiculos y Liner
        const allowImages = itemData.categoria === 'Vehiculos' || itemData.categoria === 'Liner';
        const imageUploaderHtml = allowImages ? `
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-start; margin-top:10px;">
                <input type="file" id="img_input_${originalIndex}" accept="image/*" multiple onchange="handleItemImagesChange(this, ${originalIndex})" style="width:140px">
                <div id="imgPreview_${originalIndex}" style="display:flex; gap:6px; flex-wrap:wrap; max-width:220px;"></div>
            </div>
        ` : '';

        const quantitySnapshot = getRowQuantitySnapshot('ensayos_acreditados', originalIndex);
        const units = quantitySnapshot.units;

        itemDiv.innerHTML = `
            <div>${globalIndex}</div>
            <div class="item-name-cell">
                <span class="item-name-main">${escapeHtml(itemData.nombre)}</span>
                <span class="item-name-subtle">${escapeHtml(itemData.categoria || 'Sin categoría')}</span>
                ${imageUploaderHtml}
            </div>
            <div class="quantity-summary-stack">
                <span class="quantity-chip received">Recibida <span class="quantity-chip-value">${quantitySnapshot.received}</span></span>
                <span class="quantity-chip delivered">Entregada <span class="quantity-chip-value">${quantitySnapshot.delivered}</span></span>
            </div>
            <div class="brand-chip-list">${renderBrandChips(units)}</div>
            <div class="wash-chip quantity-chip secondary">Lavado <span class="quantity-chip-value">${quantitySnapshot.washed}</span></div>
            <div class="item-actions-cell">
                <button type="button" class="manage-units-btn" data-table-type="ensayos_acreditados" data-index="${originalIndex}">Gestionar unidades</button>
            </div>
        `;
        itemsList.appendChild(itemDiv);
    });

    // Si no hay resultados, mostrar mensaje
    if (filteredItems.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.style.cssText = 'text-align: center; padding: 20px; color: #666;';
        noResultsDiv.textContent = 'No se encontraron elementos que coincidan con los criterios de búsqueda.';
        itemsList.appendChild(noResultsDiv);
    }

    // Actualizar la paginación
    updatePaginationControls('itemsListPagination', totalPages, page, (newPage) => {
        loadPredefinedItems(searchTerm, filterType, newPage);
    });

    console.log(`TABLA 1: Loaded ${itemsToShow.length} of ${totalItems} items (página ${page}/${totalPages}, filtro: ${filterType}, búsqueda: "${searchTerm}")`);
    
    // Actualizar el total de lavados después de cargar los elementos
    setTimeout(() => {
        actualizarCantidadLavados();
        // Aplicar datos guardados a las filas cargadas
        applySavedDataToTable('ensayos_acreditados');
        // Inicializar previews para imágenes si existen en itemImagesMap
        try {
            Object.keys(itemImagesMap).forEach(k => {
                const preview = document.getElementById(`imgPreview_${k}`);
                if (preview) {
                    preview.innerHTML = '';
                    (itemImagesMap[k] || []).forEach((src,idx) => {
                        const img = document.createElement('img');
                        img.src = src;
                        img.style.width = '60px'; img.style.height = '45px'; img.style.objectFit = 'cover'; img.style.border = '1px solid #ccc';
                        img.style.cursor = 'pointer';
                        img.addEventListener('click', () => openImageViewer(itemImagesMap[k], idx));
                        preview.appendChild(img);
                    });
                }
            });
        } catch (e) {}
    }, 100);
}

/**
 * Renderiza los elementos de Ensayos No Acreditados con filtros y paginación
 */
function loadPredefinedItemsNoAcreditados(searchTerm = '', filterType = 'Todos', page = 1) {
    const itemsList2 = document.getElementById('itemsList2');
    if (!itemsList2) return;

    itemsList2.innerHTML = '';

    if (!predefinedItemsDataNoAcreditados || predefinedItemsDataNoAcreditados.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'no-results';
        noDataDiv.style.cssText = 'text-align: center; padding: 20px; color: #666;';
        noDataDiv.textContent = 'No hay elementos cargados para Ensayos No Acreditados.';
        itemsList2.appendChild(noDataDiv);
        return;
    }

    // Filtrar
    let filteredItems = predefinedItemsDataNoAcreditados.filter((item, index) => {
        let ok = true;
        if (searchTerm) ok = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        if (ok) {
            if (filterType === 'ConCantidad') {
                const saveKey = `row_${index}`;
                const hasSaved = savedRowsData?.ensayos_no_acreditados && savedRowsData.ensayos_no_acreditados[saveKey] && (
                    (parseInt(savedRowsData.ensayos_no_acreditados[saveKey].cantRecibida) || 0) > 0 ||
                    (parseInt(savedRowsData.ensayos_no_acreditados[saveKey].cantEntregada) || 0) > 0
                );
                const q1 = parseInt(document.getElementById(`qty2_${index}`)?.value || 0) || 0;
                const q2 = parseInt(document.getElementById(`qty2_2_${index}`)?.value || 0) || 0;
                ok = hasSaved || q1 > 0 || q2 > 0;
            } else if (filterType !== 'Todos') {
                ok = item.categoria === filterType;
            }
        }
        return ok;
    });

    const itemsPerPage = 10;
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToShow = filteredItems.slice(startIndex, endIndex);

    itemsToShow.forEach((itemData, displayIndex) => {
        const originalIndex = predefinedItemsDataNoAcreditados.findIndex(item => item.id === itemData.id);
        const globalIndex = startIndex + displayIndex + 1;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'items-grid item-row';
        itemDiv.dataset.tableType = 'ensayos_no_acreditados';
        itemDiv.dataset.rowIndex = originalIndex;

        // Permitir imágenes solo para Vehiculos/Liner en No Acreditados también
        const allowImages = itemData.categoria === 'Vehiculos' || itemData.categoria === 'Liner';
        const imageUploaderHtml = allowImages ? `
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-start; margin-top:10px;">
                <input type="file" id="img_input_noacred_${originalIndex}" accept="image/*" multiple onchange="handleItemImagesChange(this, 'noacred_${originalIndex}')" style="width:140px">
                <div id="imgPreview_noacred_${originalIndex}" style="display:flex; gap:6px; flex-wrap:wrap; max-width:220px;"></div>
            </div>
        ` : '';

        const quantitySnapshot = getRowQuantitySnapshot('ensayos_no_acreditados', originalIndex);
        const units = quantitySnapshot.units;

        itemDiv.innerHTML = `
            <div>${globalIndex}</div>
            <div class="item-name-cell">
                <span class="item-name-main">${escapeHtml(itemData.nombre)}</span>
                <span class="item-name-subtle">${escapeHtml(itemData.categoria || 'Sin categoría')}</span>
                ${imageUploaderHtml}
            </div>
            <div class="quantity-summary-stack">
                <span class="quantity-chip received">Recibida <span class="quantity-chip-value">${quantitySnapshot.received}</span></span>
                <span class="quantity-chip delivered">Entregada <span class="quantity-chip-value">${quantitySnapshot.delivered}</span></span>
            </div>
            <div class="brand-chip-list">${renderBrandChips(units)}</div>
            <div class="wash-chip quantity-chip secondary">Lavado <span class="quantity-chip-value">${quantitySnapshot.washed}</span></div>
            <div class="item-actions-cell">
                <button type="button" class="manage-units-btn secondary" data-table-type="ensayos_no_acreditados" data-index="${originalIndex}">Gestionar unidades</button>
            </div>
        `;
        itemsList2.appendChild(itemDiv);
    });

    // Paginación
    updatePaginationControls('itemsList2Pagination', totalPages, page, (newPage) => {
        loadPredefinedItemsNoAcreditados(searchTerm, filterType, newPage);
    });

    setTimeout(() => {
        actualizarCantidadLavados();
        applySavedDataToTable('ensayos_no_acreditados');
    }, 100);
}


/**
 * Carga los datos de empresas y elementos desde archivos JSON y
 * rellena los selectores desplegables correspondientes.
 */
async function loadCompaniesAndElements() {
    // Carga de empresas
    try {
        let clientesBackend = [];
        let backendLoaded = false;

        // Fuente principal: clientes creados en el Admin Panel (tabla clientes)
        try {
            const backendResponse = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_clientes' })
            });

            const backendJson = await backendResponse.json();
            if (backendResponse.ok && backendJson?.ok && Array.isArray(backendJson.clientes)) {
                clientesBackend = backendJson.clientes.map((c, idx) => ({
                    ID: String(c.id || `DB-${idx + 1}`),
                    EMPRESA: String(c.nombre_empresa || c.empresa || '').trim(),
                    CORREO: String(c.email || c.correo || '').trim(),
                    NIT: String(c.nit || c.nit_empresa || c.numero_nit || c.identificacion_tributaria || '').trim()
                })).filter((c) => c.EMPRESA);

                backendLoaded = true;
            }
        } catch (backendError) {
            console.warn('⚠️ No se pudo cargar clientes desde admin panel:', backendError?.message || backendError);
        }

        // Respaldo: empresas.json si el backend no responde
        if (backendLoaded) {
            empresas = clientesBackend;
        } else {
            const response = await fetch('empresas.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
            const text = await response.text();
            try {
                empresas = JSON.parse(text);
            } catch (parseErr) {
                console.error('Error parseando empresas.json:', parseErr);
                console.error('Respuesta recibida (primeros 300 chars):', text.substring(0, 300));
                showLoadingStatus('❌ Error cargando empresas.json (respuesta no es JSON)', 'error');
                empresas = [];
            }
        }

        const selectEmpresa = document.getElementById("empresaSelect");
        if (selectEmpresa) {
            // Combinar empresas (backend o archivo) con nuevos clientes guardados localmente
            const nuevos = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
            const combined = [];
            (Array.isArray(empresas) ? empresas : []).forEach(e => combined.push({ ID: e.ID, EMPRESA: e.EMPRESA || '', CORREO: e.CORREO || '', NIT: e.NIT || '' }));
            nuevos.forEach(nc => combined.push({ ID: nc.ID, EMPRESA: nc.EMPRESA || '', CORREO: nc.CORREO || '', NIT: nc.NIT || '' }));

            // Eliminar duplicados por nombre+NIT para evitar entradas repetidas
            const seen = new Set();
            const deduped = combined.filter((item) => {
                const key = `${String(item.EMPRESA || '').trim().toLowerCase()}|${String(item.NIT || '').trim().toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // Ordenar combinado por nombre de empresa
            deduped.sort((a, b) => (a.EMPRESA || '').toString().localeCompare((b.EMPRESA || '').toString(), undefined, { sensitivity: 'base' }));

            // Limpiar y agregar placeholder
            selectEmpresa.innerHTML = '<option value="">Seleccione una empresa</option>';
            deduped.forEach(item => {
                const option = document.createElement('option');
                option.value = item.ID;
                option.textContent = item.EMPRESA;
                option.setAttribute('data-nombre', item.EMPRESA);
                if (item.NIT) option.setAttribute('data-nit', item.NIT);
                if (item.CORREO) option.setAttribute('data-email', item.CORREO);
                selectEmpresa.appendChild(option);
            });

            // Guardar la lista combinada en la referencia del select para búsqueda dinámica
            selectEmpresa._combinedCompanies = deduped;

            // Crear dropdown personalizado con búsqueda integrada
            if (!document.getElementById('empresaDropdownWrapper')) {
                // Ocultar select original
                selectEmpresa.style.display = 'none';

                // Crear wrapper del dropdown personalizado
                const wrapper = document.createElement('div');
                wrapper.id = 'empresaDropdownWrapper';
                wrapper.style.position = 'relative';
                wrapper.style.width = '100%';

                // Campo de búsqueda/selección
                const inputBtn = document.createElement('input');
                inputBtn.id = 'empresaSearchInput';
                inputBtn.type = 'text';
                inputBtn.placeholder = 'Buscar o seleccionar empresa...';
                inputBtn.autocomplete = 'off';
                inputBtn.style.width = '100%';
                inputBtn.style.boxSizing = 'border-box';
                inputBtn.style.padding = '8px 10px';
                inputBtn.style.border = '1px solid #ccc';
                inputBtn.style.borderRadius = '4px';
                inputBtn.style.cursor = 'pointer';
                inputBtn.style.backgroundColor = '#fff';

                // Dropdown list
                const dropdownList = document.createElement('div');
                dropdownList.id = 'empresaDropdownList';
                dropdownList.style.position = 'absolute';
                dropdownList.style.top = '100%';
                dropdownList.style.left = '0';
                dropdownList.style.right = '0';
                dropdownList.style.backgroundColor = '#fff';
                dropdownList.style.border = '1px solid #ccc';
                dropdownList.style.borderTop = 'none';
                dropdownList.style.borderRadius = '0 0 4px 4px';
                dropdownList.style.maxHeight = '240px';
                dropdownList.style.overflowY = 'auto';
                dropdownList.style.display = 'none';
                dropdownList.style.zIndex = '1000';
                dropdownList.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

                wrapper.appendChild(inputBtn);
                wrapper.appendChild(dropdownList);
                selectEmpresa.parentNode.insertBefore(wrapper, selectEmpresa);

                // Función para renderizar opciones filtradas
                const renderOptions = (filter = '') => {
                    const q = (filter || '').trim().toLowerCase();
                    const filtered = q === '' ? deduped : deduped.filter(item => {
                        const name = (item.EMPRESA || '').toString().toLowerCase();
                        const nit = (item.NIT || '').toString().toLowerCase();
                        const email = (item.CORREO || '').toString().toLowerCase();
                        return name.includes(q) || nit.includes(q) || email.includes(q);
                    });

                    dropdownList.innerHTML = '';
                    filtered.forEach(item => {
                        const optDiv = document.createElement('div');
                        optDiv.style.padding = '10px';
                        optDiv.style.cursor = 'pointer';
                        optDiv.style.borderBottom = '1px solid #f0f0f0';
                        optDiv.style.fontSize = '14px';
                        optDiv.textContent = item.EMPRESA;
                        optDiv.setAttribute('data-id', item.ID);
                        optDiv.setAttribute('data-empresa', item.EMPRESA);
                        optDiv.setAttribute('data-nit', item.NIT || '');
                        optDiv.setAttribute('data-email', item.CORREO || '');

                        optDiv.addEventListener('mouseenter', () => {
                            optDiv.style.backgroundColor = '#f0f0f0';
                        });
                        optDiv.addEventListener('mouseleave', () => {
                            optDiv.style.backgroundColor = '#fff';
                        });

                        optDiv.addEventListener('click', () => {
                            // Seleccionar opción
                            inputBtn.value = item.EMPRESA;
                            selectEmpresa.value = item.ID;
                            selectEmpresa.dispatchEvent(new Event('change'));
                            dropdownList.style.display = 'none';
                        });

                        dropdownList.appendChild(optDiv);
                    });

                    if (filtered.length === 0) {
                        const noMatch = document.createElement('div');
                        noMatch.style.padding = '10px';
                        noMatch.style.color = '#999';
                        noMatch.textContent = 'No hay coincidencias';
                        dropdownList.appendChild(noMatch);
                    }
                };

                // Listeners
                inputBtn.addEventListener('focus', () => {
                    renderOptions(inputBtn.value);
                    dropdownList.style.display = 'block';
                });

                inputBtn.addEventListener('input', (e) => {
                    renderOptions(e.target.value);
                    dropdownList.style.display = 'block';
                });

                // Cerrar dropdown al hacer clic fuera
                document.addEventListener('click', (e) => {
                    if (!wrapper.contains(e.target)) {
                        dropdownList.style.display = 'none';
                    }
                });

                // Inicializar con la opción seleccionada si existe
                if (selectEmpresa.value) {
                    const sel = Array.from(selectEmpresa.options).find(o => o.value === selectEmpresa.value);
                    if (sel) inputBtn.value = sel.textContent;
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar el JSON de empresas:', error);
        showLoadingStatus('❌ No se pudo cargar empresas.json: ' + (error.message || error), 'error');
    }

    // Carga de elementos
    try {
        const response = await fetch('elementos.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        const text2 = await response.text();
        let data;
        try {
            data = JSON.parse(text2);
        } catch (pe) {
            console.error('Error parseando elementos.json:', pe);
            console.error('Respuesta recibida (primeros 300 chars):', text2.substring(0, 300));
            showLoadingStatus('❌ Error cargando elementos.json (respuesta no es JSON)', 'error');
            data = { elementos: [] };
        }
        const selectElementos = document.getElementById('elementos');
        if (selectElementos && data.elementos) {
            data.elementos.forEach(elemento => {
                const option = document.createElement('option');
                option.value = elemento;
                option.textContent = elemento;
                selectElementos.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar el JSON de elementos:', error);
        showLoadingStatus('❌ No se pudo cargar elementos.json: ' + (error.message || error), 'error');
    }
}

// =============================
// Cliente Nuevo (+)
// =============================
function openNuevoClienteModal() {
        const html = `
                <div id="nuevoClienteModal" style="position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:2000;">
                    <div style="background:#fff; padding:20px; border-radius:8px; width:420px; max-width:90vw;">
                        <h3 style="margin-top:0; color:#022859">Cliente Nuevo</h3>
                        <div style="display:grid; gap:10px;">
                            <div>
                                <label>Nombre</label>
                                <input id="nuevoClienteNombre" type="text" placeholder="Empresa S.A.S" style="width:100%" />
                            </div>
                            <div>
                                <label>NIT / CC</label>
                                <input id="nuevoClienteNIT" type="text" placeholder="NIT o Cédula (Ej: 900000000-1 o 1234567890)" style="width:100%" />
                            </div>
                            <div>
                                <label>Correo electrónico</label>
                                <input id="nuevoClienteEmail" type="email" placeholder="cliente@empresa.com" style="width:100%" />
                            </div>
                            <div>
                                <label>Teléfono</label>
                                <input id="nuevoClienteTelefono" type="text" placeholder="Ej: 300 123 4567" style="width:100%" />
                            </div>
                            <div>
                                <label>Dirección</label>
                                <input id="nuevoClienteDireccion" type="text" placeholder="Ej: Carrera 10 #5-20, Bogotá" style="width:100%" />
                            </div>
                            <div>
                                <label>Contacto Principal</label>
                                <input id="nuevoClienteContacto" type="text" placeholder="Nombre del contacto" style="width:100%" />
                            </div>
                        </div>
                        <div style="display:flex; gap:8px; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap;">
                                <button class="btn btn-light" onclick="closeNuevoClienteModal()">Cancelar</button>
                                <button class="btn btn-primary" onclick="guardarNuevoClienteLocal()">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        // Enfocar el campo nombre primero y forzar mayúsculas mientras escribe
        const nombreInput = document.getElementById('nuevoClienteNombre');
        if (nombreInput) {
            nombreInput.focus();
            nombreInput.addEventListener('input', (e) => {
                const val = e.target.value || '';
                const up = val.toUpperCase();
                if (e.target.value !== up) e.target.value = up;
            });
        }
        // Insertar botones dentro del modal (empaquetados en un recuadro)
        const downloadContainer = document.getElementById('downloadNuevoModalContainer');
        if (downloadContainer) {
            // Limpiar contenido previo
            downloadContainer.innerHTML = '';

            // Recuadro visual (dos grupos: izquierda y derecha)
            const box = document.createElement('div');
            box.style.display = 'flex';
            box.style.justifyContent = 'space-between';
            box.style.alignItems = 'center';
            box.style.gap = '12px';
            box.style.padding = '8px';
            box.style.border = '1px solid #e6eef8';
            box.style.background = '#f7fbff';
            box.style.borderRadius = '8px';
            box.style.width = '100%';
            box.style.boxSizing = 'border-box';
            box.style.flexWrap = 'wrap';

            const leftGroup = document.createElement('div');
            leftGroup.style.display = 'flex';
            leftGroup.style.gap = '8px';
            leftGroup.style.alignItems = 'center';

            const rightGroup = document.createElement('div');
            rightGroup.style.display = 'flex';
            rightGroup.style.gap = '8px';
            rightGroup.style.alignItems = 'center';

            // Botón Exportar
            const exportBtn = document.createElement('button');
            exportBtn.className = 'btn btn-outline-info btn-sm';
            exportBtn.style.padding = '6px 10px';
            exportBtn.style.whiteSpace = 'nowrap';
            exportBtn.textContent = '📥 Exportar';
            exportBtn.title = 'Exportar clientes a JSON';
            exportBtn.onclick = () => exportNuevosClientes();
            leftGroup.appendChild(exportBtn);

            // Botón Importar
            const importBtn = document.createElement('button');
            importBtn.className = 'btn btn-outline-info btn-sm';
            importBtn.style.padding = '6px 10px';
            importBtn.style.whiteSpace = 'nowrap';
            importBtn.textContent = '📤 Importar';
            importBtn.title = 'Importar clientes desde JSON';
            importBtn.onclick = () => importNuevosClientesConSync();
            leftGroup.appendChild(importBtn);

            // Botón Ver JSON
            const viewBtn = document.createElement('button');
            viewBtn.id = 'viewNuevosInNuevoModalBtn';
            viewBtn.className = 'btn btn-outline-secondary btn-sm';
            viewBtn.style.padding = '6px 10px';
            viewBtn.style.whiteSpace = 'nowrap';
            viewBtn.textContent = '👁️ Ver JSON';
            viewBtn.title = 'Ver JSON completo con opciones de sincronización';
            viewBtn.onclick = () => { try { generarJSONEmpresas(); } catch(e){ console.warn(e); } };
            leftGroup.appendChild(viewBtn);

            // Mostrar solo si hay nuevos clientes en localStorage
            const nuevosExist = (JSON.parse(localStorage.getItem('nuevos_clientes') || '[]').length > 0);
            // El botón Ver JSON siempre está visible, pero deshabilitado si no hay nuevos clientes

            // Botón Sincronizar (derecha)
            const syncBtnNuevo = document.createElement('button');
            syncBtnNuevo.className = 'btn btn-outline-success btn-sm';
            syncBtnNuevo.style.padding = '6px 10px';
            syncBtnNuevo.style.whiteSpace = 'nowrap';
            syncBtnNuevo.textContent = '🔄 Sincronizar';
            syncBtnNuevo.title = 'Sincronizar - recarga la página';
            syncBtnNuevo.onclick = () => {
                try {
                    // Cerrar modal y recargar la página para reflejar todos los cambios
                    document.getElementById('nuevoClienteModal')?.remove();
                } catch (e) { /* ignore */ }
                showNotification('🔄 Recargando la página para sincronizar...', 'info');
                setTimeout(() => { window.location.reload(); }, 120);
            };
            if (!nuevosExist) {
                syncBtnNuevo.style.opacity = '0.5';
                syncBtnNuevo.disabled = true;
            }
            rightGroup.appendChild(syncBtnNuevo);

            box.appendChild(leftGroup);
            box.appendChild(rightGroup);
            downloadContainer.appendChild(box);
        }
}

function closeNuevoClienteModal() {
        document.getElementById('nuevoClienteModal')?.remove();
}

async function guardarNuevoClienteLocal() {
    // Forzar mayúsculas en el nombre al guardar
    const nombreRaw = document.getElementById('nuevoClienteNombre')?.value?.trim() || '';
    const nombre = nombreRaw.toUpperCase();
    const nit = document.getElementById('nuevoClienteNIT')?.value?.trim();
    const email = document.getElementById('nuevoClienteEmail')?.value?.trim();
    const telefono = document.getElementById('nuevoClienteTelefono')?.value?.trim() || '';
    const direccion = document.getElementById('nuevoClienteDireccion')?.value?.trim() || '';
    const contacto = document.getElementById('nuevoClienteContacto')?.value?.trim() || '';
    // Validaciones básicas
    if (!email || !nombre || !nit) { showNotification('Complete Correo, Nombre y NIT / CC', 'warning'); return; }
    // Validar formato de email simple
    const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRe.test(email)) { showNotification('Correo inválido', 'warning'); return; }

    // La tabla clientes usa contraseña, así que generamos una temporal cuando el alta viene desde recepción.
    const passwordTemporal = `HT-${String(nit).replace(/\D/g, '').slice(-6) || 'CLIENTE'}-${Date.now().toString().slice(-4)}`;

    try {
        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_cliente',
                nombre_empresa: nombre,
                nit,
                email,
                password: passwordTemporal,
                telefono,
                direccion,
                contacto_principal: contacto
            })
        });

        const result = await response.json();

        if (response.ok && result?.ok && result?.cliente) {
            const clienteDb = result.cliente;
            const nuevo = {
                ID: String(clienteDb.id || clienteDb.ID || Date.now()),
                EMPRESA: String(clienteDb.nombre_empresa || nombre).toUpperCase(),
                NIT: String(clienteDb.nit || clienteDb.nit_empresa || nit || ''),
                CORREO: String(clienteDb.email || email || ''),
                TELEFONO: String(clienteDb.telefono || telefono || ''),
                DIRECCION: String(clienteDb.direccion || direccion || ''),
                CONTACTO: String(clienteDb.contacto_principal || contacto || '')
            };

            const selectEmpresa = document.getElementById('empresaSelect');
            if (selectEmpresa) {
                const option = document.createElement('option');
                option.value = nuevo.ID;
                option.textContent = nuevo.EMPRESA;
                option.setAttribute('data-nombre', nuevo.EMPRESA);
                if (nuevo.NIT) option.setAttribute('data-nit', nuevo.NIT);
                if (nuevo.CORREO) option.setAttribute('data-email', nuevo.CORREO);
                selectEmpresa.appendChild(option);

                try {
                    if (selectEmpresa._combinedCompanies && Array.isArray(selectEmpresa._combinedCompanies)) {
                        selectEmpresa._combinedCompanies.push(nuevo);
                        selectEmpresa._combinedCompanies.sort((a, b) => (a.EMPRESA || '').toString().localeCompare((b.EMPRESA || '').toString(), undefined, { sensitivity: 'base' }));
                    }
                } catch (e) { console.warn('No se pudo actualizar la lista combinada del select:', e); }

                const searchInput = document.getElementById('empresaSearchInput');
                if (searchInput) {
                    searchInput.value = nuevo.EMPRESA;
                }
                try { sortSelectOptions('empresaSelect'); } catch (e) { console.warn(e); }
                selectEmpresa.value = nuevo.ID;
                selectEmpresa.dispatchEvent(new Event('change'));
            }

            closeNuevoClienteModal();
            showNotification('✅ Cliente guardado en la base de datos de clientes', 'success');
            return;
        }

        throw new Error(result?.error || 'No fue posible crear el cliente en la base de datos');
    } catch (error) {
        console.error('Error creando cliente en backend:', error);

        // Respaldo local si el backend no está disponible
        const nuevos = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
        const nuevo = { ID: Date.now().toString(), EMPRESA: nombre, NIT: nit, CORREO: email };
        nuevos.push(nuevo);
        localStorage.setItem('nuevos_clientes', JSON.stringify(nuevos));

        const selectEmpresa = document.getElementById('empresaSelect');
        if (selectEmpresa) {
            const option = document.createElement('option');
            option.value = nuevo.ID;
            option.textContent = nuevo.EMPRESA;
            option.setAttribute('data-nombre', nuevo.EMPRESA);
            option.setAttribute('data-nit', nuevo.NIT);
            if (nuevo.CORREO) option.setAttribute('data-email', nuevo.CORREO);
            selectEmpresa.appendChild(option);
            try {
                if (selectEmpresa._combinedCompanies && Array.isArray(selectEmpresa._combinedCompanies)) {
                    selectEmpresa._combinedCompanies.push({ ID: nuevo.ID, EMPRESA: nuevo.EMPRESA, NIT: nuevo.NIT, CORREO: nuevo.CORREO });
                    selectEmpresa._combinedCompanies.sort((a, b) => (a.EMPRESA || '').toString().localeCompare((b.EMPRESA || '').toString(), undefined, { sensitivity: 'base' }));
                }
            } catch(e) { console.warn('No se pudo actualizar la lista combinada del select:', e); }
            const searchInput = document.getElementById('empresaSearchInput');
            if (searchInput) {
                searchInput.value = nuevo.EMPRESA;
            }
            try { sortSelectOptions('empresaSelect'); } catch(e){}
            selectEmpresa.value = nuevo.ID;
            selectEmpresa.dispatchEvent(new Event('change'));
        }

        closeNuevoClienteModal();
        showNotification('⚠️ Se guardó localmente porque no respondió la base de datos', 'warning');
        try { generarJSONEmpresas(); } catch (e) { console.warn('No se pudo generar JSON exportable:', e); }
    }
}

/**
 * Genera un JSON combinando `empresas` (si está cargado) y `nuevos_clientes`
 * y muestra un modal con la representación para copiar o descargar.
 */
function generarJSONEmpresas() {
    // Build merged JSON and open modal with extra controls: preserve names, delete nuevos
    const existing = Array.isArray(empresas) ? empresas.slice() : [];
    let preserveOriginal = false; // por defecto convertir a mayúsculas

    function buildMerged(preserve) {
        const nuevos = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
        // Determinar último ID numérico
        let maxId = 0;
        existing.forEach(e => { const n = parseInt(e.ID); if (!isNaN(n) && n > maxId) maxId = n; });

        // Normalizar nuevos clientes y asignar IDs secuenciales a partir de maxId
        const nuevosNormalized = nuevos.map((nc, idx) => {
            const assignedId = maxId + idx + 1;
            return {
                ID: assignedId,
                EMPRESA: nc.EMPRESA || '',
                CORREO: nc.CORREO || '',
                NIT: nc.NIT || ''
            };
        });

        const merged = existing.concat(nuevosNormalized);

        // Convertir a mayúsculas salvo que se pida preservar
        if (!preserve) merged.forEach(item => { item.EMPRESA = (item.EMPRESA || '').toString().toUpperCase(); });

        // Ordenar por nombre de empresa (EMPRESA)
        merged.sort((a, b) => {
            const A = (a.EMPRESA || '').toString().toLowerCase();
            const B = (b.EMPRESA || '').toString().toLowerCase();
            return A.localeCompare(B);
        });

        // Reasignar IDs secuenciales según el nuevo orden (1-based)
        merged.forEach((item, idx) => { item.ID = idx + 1; });

        return { merged, jsonText: JSON.stringify(merged, null, 4) };
    }

    // Guardar y exponer última generación para descarga posterior
    let last = buildMerged(preserveOriginal);
    window.lastGeneratedEmpresasJSON = last.jsonText;
    try { localStorage.setItem('last_generated_empresas_json', last.jsonText); } catch(e){/* ignore */}

    // Construir modal con lista de nuevos clientes con botón eliminar solo para usuarios autorizados
    const nuevosList = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
    const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
    const rol = session.rol || (session.user?.rol);
    const canDelete = (rol === 'administrador' || rol === 'director_tecnico');
    
    const nuevosHtml = (nuevosList.length === 0) ? '<em>No hay nuevos clientes guardados localmente.</em>' : (
        '<ul style="padding-left:16px; margin:8px 0;">' + nuevosList.map((nc, i) => {
            const delBtnHtml = canDelete ? `<button data-idx="${i}" class="btn btn-sm btn-danger delNuevoBtn" style="margin-left:8px;">Eliminar</button>` : '';
            return `<li style="margin-bottom:6px; display:flex; align-items:center; justify-content:space-between;"><span style="flex:1;">${escapeHtml(nc.EMPRESA||'')} ${nc.NIT?('- '+escapeHtml(nc.NIT)) : ''} ${nc.CORREO?('— '+escapeHtml(nc.CORREO)):''}</span>${delBtnHtml}</li>`;
        }).join('') + '</ul>'
    );

    const modalHtml = `
        <div id="exportEmpresasModal" style="position:fixed; inset:0; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; z-index:3000;">
            <div style="background:#fff; width:760px; max-width:96vw; max-height:86vh; overflow:auto; border-radius:8px; padding:16px; box-shadow:0 8px 30px rgba(0,0,0,.3);">
                <h3 style="margin-top:0; color:#022859;">JSON exportable de empresas</h3>
                <p style="margin:6px 0 12px; color:#666; font-size:13px;">Copia este JSON y reemplaza el archivo <strong>empresas.json</strong> en tu proyecto, o descárgalo directamente.</p>
                <div style="display:flex; gap:16px; align-items:flex-start;">
                    <textarea id="exportEmpresasTextarea" style="flex:1; height:380px; font-family:'Courier New', monospace; font-size:11px; padding:12px; box-sizing:border-box; border:1px solid #ddd; border-radius:6px; background:#f8f8f8; resize:none;">${escapeHtml(last.jsonText)}</textarea>
                    <div style="width:240px; flex-shrink:0;">
                        <h4 style="margin:0 0 10px 0; font-size:13px; font-weight:600; color:#022859;">Nuevos clientes (local)</h4>
                        <div id="nuevosListContainer" style="max-height:340px; overflow-y:auto; border:1px solid #ddd; border-radius:6px; padding:10px; background:#f8f8f8; font-size:12px;">${nuevosHtml}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px; justify-content:space-between; margin-top:14px; align-items:center;">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-outline-info btn-sm" id="exportFromJsonModalBtn" style="padding:8px 12px; white-space:nowrap; border-radius:6px;">📥 Exportar</button>
                        <button class="btn btn-outline-info btn-sm" id="importFromJsonModalBtn" style="padding:8px 12px; white-space:nowrap; border-radius:6px;">📤 Importar</button>
                        <button class="btn btn-outline-success btn-sm" id="syncFromJsonModalBtn" style="padding:8px 12px; white-space:nowrap; border-radius:6px;">🔄 Sincronizar</button>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-light" id="closeExportModalBtn" onclick="document.getElementById('exportEmpresasModal')?.remove();">Cerrar</button>
                        <span style="color:#6c757d; font-size:13px;">Opciones: exportar / importar / sincronizar</span>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const textarea = document.getElementById('exportEmpresasTextarea');
    const closeBtn = document.getElementById('closeExportModalBtn');
    const exportJsonBtn = document.getElementById('exportFromJsonModalBtn');
    const importJsonBtn = document.getElementById('importFromJsonModalBtn');
    const syncJsonBtn = document.getElementById('syncFromJsonModalBtn');

    function regenerate() {
        textarea.value = last.jsonText;
        window.lastGeneratedEmpresasJSON = last.jsonText;
        try { localStorage.setItem('last_generated_empresas_json', last.jsonText); } catch(e){}
    }

    // Listeners
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('exportEmpresasModal')?.remove();
    });

    // Listeners para botones de Exportar, Importar y Sincronizar en el modal del JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            exportNuevosClientes();
        });
    }

    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', () => {
            importNuevosClientes();
            // Regenerar después de importar
            setTimeout(() => {
                try {
                    const newNuevos = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
                    const canDeleteNow = (rol === 'administrador' || rol === 'director_tecnico');
                    const newListHtml = (newNuevos.length === 0) ? '<em>No hay nuevos clientes guardados localmente.</em>' : ('<ul style="padding-left:16px; margin:8px 0;">' + newNuevos.map((c, i) => {
                        const delBtnHtml = canDeleteNow ? `<button data-idx="${i}" class="btn btn-sm btn-danger delNuevoBtn" style="margin-left:8px;">Eliminar</button>` : '';
                        return `<li style="margin-bottom:6px; display:flex; align-items:center; justify-content:space-between;"><span style="flex:1;">${escapeHtml(c.EMPRESA||'')} ${c.NIT?('- '+escapeHtml(c.NIT)) : ''} ${c.CORREO?('— '+escapeHtml(c.CORREO)):''}</span>${delBtnHtml}</li>`;
                    }).join('') + '</ul>');
                    const container = document.getElementById('nuevosListContainer');
                    if (container) container.innerHTML = newListHtml;
                    last = buildMerged(false);
                    textarea.value = last.jsonText;
                } catch (e) { console.warn(e); }
            }, 300);
        });
    }

    if (syncJsonBtn) {
        syncJsonBtn.addEventListener('click', () => {
            showNotification('🔄 Sincronización actualizada', 'info');
            // Recargar la lista de nuevos clientes
            try {
                const newNuevos = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
                const canDeleteNow = (rol === 'administrador' || rol === 'director_tecnico');
                const newListHtml = (newNuevos.length === 0) ? '<em>No hay nuevos clientes guardados localmente.</em>' : ('<ul style="padding-left:16px; margin:8px 0;">' + newNuevos.map((c, i) => {
                    const delBtnHtml = canDeleteNow ? `<button data-idx="${i}" class="btn btn-sm btn-danger delNuevoBtn" style="margin-left:8px;">Eliminar</button>` : '';
                    return `<li style="margin-bottom:6px; display:flex; align-items:center; justify-content:space-between;"><span style="flex:1;">${escapeHtml(c.EMPRESA||'')} ${c.NIT?('- '+escapeHtml(c.NIT)) : ''} ${c.CORREO?('— '+escapeHtml(c.CORREO)):''}</span>${delBtnHtml}</li>`;
                }).join('') + '</ul>');
                const container = document.getElementById('nuevosListContainer');
                if (container) container.innerHTML = newListHtml;
                last = buildMerged(false);
                textarea.value = last.jsonText;
            } catch (e) { console.warn(e); }
        });
    }

    // Delegated listener para eliminar nuevos clientes desde la lista
    document.getElementById('nuevosListContainer')?.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.delNuevoBtn');
        if (!btn) return;
        
        // Verificar permisos
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const rol = session.rol || (session.user?.rol);
        const canDelete = (rol === 'administrador' || rol === 'director_tecnico');
        
        if (!canDelete) {
            showNotification('❌ No tienes permisos para eliminar clientes', 'error');
            return;
        }
        
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (isNaN(idx)) return;
        const nc = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
        const removed = nc.splice(idx, 1)[0];
        localStorage.setItem('nuevos_clientes', JSON.stringify(nc));
        showNotification('🗑️ Cliente eliminado localmente', 'info');

        // Si existe el select principal, eliminar la opción correspondiente
        try {
            const selectEmpresa = document.getElementById('empresaSelect');
            if (selectEmpresa && removed && removed.ID) {
                // Buscar opción por value (ID) y removerla
                const opt = Array.from(selectEmpresa.options).find(o => o.value == removed.ID || o.getAttribute('data-nombre') === removed.EMPRESA);
                if (opt) opt.remove();

                // Actualizar la lista combinada si existe
                try {
                    if (Array.isArray(selectEmpresa._combinedCompanies)) {
                        selectEmpresa._combinedCompanies = selectEmpresa._combinedCompanies.filter(c => String(c.ID) !== String(removed.ID));
                    }
                } catch (e) { console.warn('No pudo actualizarse _combinedCompanies:', e); }

                // Reordenar opciones y notificar cambio
                try { sortSelectOptions('empresaSelect'); } catch(e){}
                selectEmpresa.dispatchEvent(new Event('change'));

                // Actualizar dropdown personalizado si existe
                try {
                    const dropdownList = document.getElementById('empresaDropdownList');
                    if (dropdownList) {
                        Array.from(dropdownList.children).forEach(node => {
                            try {
                                const id = node.getAttribute && node.getAttribute('data-id');
                                const empresa = node.getAttribute && node.getAttribute('data-empresa');
                                if ((id && String(id) === String(removed.ID)) || (empresa && empresa === removed.EMPRESA)) {
                                    node.remove();
                                }
                            } catch(_) {}
                        });
                        // Si quedó vacío, mostrar mensaje
                        if (!dropdownList.children.length) {
                            const noMatch = document.createElement('div');
                            noMatch.style.padding = '10px';
                            noMatch.style.color = '#999';
                            noMatch.textContent = 'No hay coincidencias';
                            dropdownList.appendChild(noMatch);
                        }
                    }
                } catch (e) { console.warn('No se pudo actualizar empresaDropdownList:', e); }
            }
        } catch(e) { console.warn('Error actualizando select tras eliminar nuevo cliente:', e); }
        // Regenerar la lista y el textarea
        const canDeleteBtn = (rol === 'administrador' || rol === 'director_tecnico');
        const newListHtml = (nc.length === 0) ? '<em>No hay nuevos clientes guardados localmente.</em>' : ('<ul style="padding-left:16px; margin:8px 0;">' + nc.map((c, i) => {
            const delBtnHtml = canDeleteBtn ? `<button data-idx="${i}" class="btn btn-sm btn-danger delNuevoBtn" style="margin-left:8px;">Eliminar</button>` : '';
            return `<li style="margin-bottom:6px; display:flex; align-items:center; justify-content:space-between;"><span style="flex:1;">${escapeHtml(c.EMPRESA||'')} ${c.NIT?('- '+escapeHtml(c.NIT)) : ''} ${c.CORREO?('— '+escapeHtml(c.CORREO)):''}</span>${delBtnHtml}</li>`;
        }).join('') + '</ul>');
        const container = document.getElementById('nuevosListContainer');
        if (container) container.innerHTML = newListHtml;
        regenerate();
    });

    // Guardar el último JSON generado
    window.lastGeneratedEmpresasJSON = textarea.value;
    try { localStorage.setItem('last_generated_empresas_json', textarea.value); } catch(e){}
}

// Escapar el texto para que pueda ir dentro del textarea en HTML
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Descargar el último JSON generado (disponible tras generar JSON)
function downloadLastEmpresasJSON() {
    const text = window.lastGeneratedEmpresasJSON || localStorage.getItem('last_generated_empresas_json');
    if (!text) {
        showNotification('⚠️ No hay JSON generado para descargar. Genera el JSON primero.', 'warning');
        return;
    }
    try {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empresas.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showNotification('📥 Descarga iniciada: empresas.json', 'success');
    } catch (e) {
        console.error('Error descargando JSON:', e);
        showNotification('❌ Error al descargar el JSON', 'error');
    }
}

// Muestra un botón persistente en la UI para descargar el último JSON generado
function showPersistentDownloadButton() {
    // Si ya existe, no hacer nada
    if (document.getElementById('downloadLastEmpresasPersistentBtn')) return;
    const btn = document.createElement('div');
    btn.id = 'downloadLastEmpresasPersistentBtn';
    btn.style.position = 'fixed';
    btn.style.right = '18px';
    btn.style.bottom = '18px';
    btn.style.zIndex = 4000;
    btn.style.background = '#0b5ed7';
    btn.style.color = '#fff';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '6px';
    btn.style.boxShadow = '0 6px 18px rgba(11,94,215,0.18)';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '13px';
    btn.textContent = '⬇️ Descargar empresas.json';

    const closeX = document.createElement('span');
    closeX.textContent = '✕';
    closeX.style.marginLeft = '8px';
    closeX.style.opacity = '0.9';
    closeX.style.fontWeight = '700';
    closeX.style.cursor = 'pointer';
    closeX.style.marginLeft = '10px';
    closeX.onclick = (e) => { e.stopPropagation(); btn.remove(); };

    btn.appendChild(closeX);
    btn.onclick = () => downloadLastEmpresasJSON();
    document.body.appendChild(btn);
}

// Exponer la función globalmente por comodidad
window.downloadLastEmpresasJSON = downloadLastEmpresasJSON;

/**
 * Exportar clientes nuevos a archivo JSON
 */
function exportNuevosClientes() {
    try {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const rol = session.rol || (session.user?.rol);
        const canManage = (rol === 'administrador' || rol === 'director_tecnico' || rol === 'tecnico_ensayos');
        
        if (!canManage) {
            showNotification('❌ No tienes permisos para exportar clientes', 'error');
            return;
        }

        const clientes = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
        if (clientes.length === 0) {
            showNotification('⚠️ No hay clientes nuevos para exportar', 'warning');
            return;
        }

        const data = {
            clientes: clientes,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes-nuevos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        
        showNotification(`✅ ${clientes.length} cliente(s) exportado(s)`, 'success');
    } catch (e) {
        console.error('Error exportando clientes:', e);
        showNotification('❌ Error al exportar clientes', 'error');
    }
}

/**
 * Importar clientes nuevos desde archivo JSON (sin sincronización adicional)
 */
function importNuevosClientes() {
    try {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const rol = session.rol || (session.user?.rol);
        const canManage = (rol === 'administrador' || rol === 'director_tecnico' || rol === 'tecnico_ensayos');
        
        if (!canManage) {
            showNotification('❌ No tienes permisos para importar clientes', 'error');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!Array.isArray(data.clientes)) {
                        showNotification('❌ Archivo inválido: debe contener "clientes" array', 'error');
                        return;
                    }

                    const current = JSON.parse(localStorage.getItem('nuevos_clientes') || '[]');
                    const merged = [...current];
                    let addedCount = 0;

                    // Evitar duplicados
                    data.clientes.forEach(nc => {
                        const exists = merged.some(c => 
                            (c.EMPRESA?.toUpperCase() === nc.EMPRESA?.toUpperCase()) &&
                            (c.NIT === nc.NIT)
                        );
                        if (!exists) {
                            merged.push(nc);
                            addedCount++;
                        }
                    });

                    localStorage.setItem('nuevos_clientes', JSON.stringify(merged));
                    
                    // Recargar dropdown sincronizando con los nuevos clientes
                    const selectEmpresa = document.getElementById('empresaSelect');
                    if (selectEmpresa) {
                        // Limpiar y regenerar las opciones del select
                        selectEmpresa.innerHTML = '<option value="">Seleccione una empresa</option>';
                        merged.forEach(nc => {
                            const option = document.createElement('option');
                            option.value = nc.ID || nc.EMPRESA;
                            option.textContent = nc.EMPRESA || '';
                            if (nc.NIT) option.setAttribute('data-nit', nc.NIT);
                            if (nc.CORREO) option.setAttribute('data-email', nc.CORREO);
                            selectEmpresa.appendChild(option);
                        });
                        
                        // Actualizar referencia combinada para búsqueda
                        selectEmpresa._combinedCompanies = merged;
                    }
                    
                    // También llamar loadCompaniesAndElements para sincronizar con empresas.json
                    loadCompaniesAndElements();
                    
                    showNotification(`✅ ${addedCount} cliente(s) importado(s)`, 'success');
                } catch (err) {
                    console.error('Error importando clientes:', err);
                    showNotification('❌ Error al procesar el archivo JSON', 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    } catch (e) {
        console.error('Error iniciando importación:', e);
        showNotification('❌ Error al importar clientes', 'error');
    }
}

/**
 * Importar clientes nuevos desde archivo JSON con sincronización visual (para usar en modal)
 */
function importNuevosClientesConSync() {
    importNuevosClientes();
    // Después del import, mostrar el modal de sincronización
    setTimeout(() => {
        try {
            generarJSONEmpresas();
        } catch(e) {
            console.warn('Error al abrir modal de sincronización:', e);
        }
    }, 500);
}

/**
 * Ordena las opciones de un select por texto (manteniendo placeholder si existe).
 * @param {string} selectId
 */
function sortSelectOptions(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    // Guardar valor actual
    const current = sel.value;
    // Extraer opciones excepto las que no tienen value o que son placeholder (value === "")
    const placeholder = Array.from(sel.options).find(o => o.value === '');
    const opts = Array.from(sel.options).filter(o => o.value !== '');
    opts.sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), undefined, { sensitivity: 'base' }));
    // Reconstruir
    sel.innerHTML = '';
    if (placeholder) sel.appendChild(placeholder);
    opts.forEach(o => sel.appendChild(o));
    // Restaurar selección si existe
    try { sel.value = current; } catch (e) { /* ignore */ }
}

// =======================================================
// FUNCIONES DE FIRMA DIGITAL
// =======================================================

/**
 * Inicia el proceso de dibujo en el canvas (para dibujo manual, potencialmente redundante con SignaturePad).
 * @param {MouseEvent} e - El evento del ratón.
 */
function startDrawing(e) {
    if (signaturePad) { // Si SignaturePad está activo, deja que lo maneje
        isDrawing = false; // Previene el dibujo manual si SignaturePad tiene el control
        return;
    }
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

/**
 * Continúa dibujando en el canvas (para dibujo manual, potencialmente redundante con SignaturePad).
 * @param {MouseEvent} e - El evento del ratón.
 */
function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

/**
 * Detiene el proceso de dibujo y captura los datos de la firma del canvas.
 */
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        signatureData = canvas.toDataURL(); // Captura los datos de la firma cuando el dibujo se detiene
    }
    // Si se usa SignaturePad, sus propios escuchadores de eventos manejarán la captura de datos.
}

/**
 * Maneja los eventos táctiles para dibujar en dispositivos móviles,
 * convirtiéndolos en eventos de ratón equivalentes.
 * @param {TouchEvent} e - El evento táctil.
 */
function handleTouch(e) {
    e.preventDefault(); // Previene el desplazamiento y el zoom
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' :
        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    canvas.dispatchEvent(mouseEvent); // Dispara el evento del ratón correspondiente
}

/**
 * Limpia el canvas de la firma, eliminando cualquier trazo.
 * Función legacy mantenida para compatibilidad con versiones anteriores.
 * NOTA: Para múltiples firmas usar clearSignature(type)
 */
function clearAllSignatures() {
    // Limpia todas las firmas para compatibilidad
    Object.keys(signaturePads).forEach(canvasId => {
        if (signaturePads[canvasId]) {
            signaturePads[canvasId].clear();
            signatureData[canvasId] = null;
        }
    });
    
    // Fallback para canvas directo si existe
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    showNotification('🗑️ Todas las firmas han sido limpiadas', 'info');
}

// =======================================================
// FUNCIONES DE FORMULARIO Y MANEJO DE DATOS
// =======================================================

/**
 * Agrega un artículo personalizado tanto a la tabla como al JSON de ensayos alcance
 */
function addCustomItem() {
    const categoryOptions = getCurrentEnsayoCategories().map(category => (
        `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    )).join('');

    // Crear un formulario modal para obtener los datos del nuevo elemento
    const modalHTML = `
        <div id="customItemModal" style="
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.7); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            z-index: 1000;
        ">
            <div style="
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                width: 400px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0; color: #022859; text-align: center;">
                    📝 Agregar Artículo Personalizado
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                        🏷️ Nombre del elemento:
                    </label>
                    <input type="text" id="customItemName" placeholder="Ej: Cubridor Especial CL5" 
                           style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 5px;" required>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                        📂 Categoría:
                    </label>
                    <select id="customItemCategoria" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 5px;" required>
                        <option value="">-- Seleccionar categoría --</option>
                        ${categoryOptions || '<option value="Otros">Otros</option>'}
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="cancelCustomItem()" style="
                        padding: 10px 20px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">❌ Cancelar</button>
                    
                    <button onclick="saveCustomItem()" style="
                        padding: 10px 20px; 
                        background: #28a745; 
                        color: white; 
                        border: none; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">✅ Agregar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar el modal al documento
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Enfocar el primer campo
    document.getElementById('customItemName').focus();
    
    // Agregar eventos de teclado para el modal
    const modal = document.getElementById('customItemModal');
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            saveCustomItem();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelCustomItem();
        }
    });
}

function getCurrentEnsayoCategories() {
    const source = Array.isArray(predefinedItemsData) ? predefinedItemsData : [];
    const categories = source
        .map(item => (item && typeof item === 'object' ? String(item.categoria || '').trim() : ''))
        .filter(Boolean);

    const uniqueCategories = [...new Set(categories)];
    return uniqueCategories.length > 0 ? uniqueCategories : ['Cubridores', 'Rigidos', 'Mangueras', 'Otros'];
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Cancela la creación de artículo personalizado
 */
function cancelCustomItem() {
    const modal = document.getElementById('customItemModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Guarda el artículo personalizado en la tabla y en el JSON
 */
async function saveCustomItem() {
    const name = document.getElementById('customItemName').value.trim();
    const categoria = document.getElementById('customItemCategoria').value;
    
    // Validaciones
    if (!name) {
        alert('❌ Por favor, ingresa el nombre del elemento.');
        return;
    }
    
    if (!categoria) {
        alert('❌ Por favor, selecciona una categoría.');
        return;
    }
    
    try {
        const newItem = {
            nombre: name,
            categoria: categoria,
            disponible: true
        };

        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_ensayo_acreditado', item: newItem })
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            throw new Error(result?.error || 'No se pudo crear el elemento');
        }

        // Cerrar el modal
        cancelCustomItem();
        
        // Mostrar mensaje de éxito
        showLoadingStatus(`✅ Elemento "${name}" agregado correctamente`, 'success');
        
        // Recargar la tabla para mostrar el nuevo elemento desde Supabase
        const searchInput = document.getElementById('searchInput1');
        const activeFilterBtn = document.querySelector('#menu1 .filter-btn-1.active');
        const currentFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
        const searchTerm = searchInput ? searchInput.value : '';

        await loadPredefinedItemsFromJSON();
        loadPredefinedItems(searchTerm, currentFilter);
        
        console.log('✅ Elemento personalizado agregado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al agregar elemento personalizado:', error);
        alert('❌ Error al agregar el elemento. Por favor, inténtalo de nuevo.');
    }
}

/**
 * Actualiza el archivo JSON automáticamente con el nuevo elemento
 */
/**
 * Recopila todos los datos del formulario, incluyendo la información general
 * y el estado de cada artículo (predefinidos y personalizados).
 * @returns {object} Un objeto que contiene todos los datos del formulario recopilados.
 */
function collectFormData() {
    // Obtener el nombre del cliente desde el selector
    let clienteNombre = '';
    const selectEmpresa = document.getElementById('empresaSelect');
    if (selectEmpresa && selectEmpresa.selectedIndex > 0) {
        const selectedOption = selectEmpresa.options[selectEmpresa.selectedIndex];
        clienteNombre = selectedOption.getAttribute('data-nombre') || selectedOption.text;
    }
    
    // Intentar correos por defecto desde el selector de empresa (si existen)
    let clienteEmailFallback = '';
    if (selectEmpresa && selectEmpresa.selectedIndex > 0) {
        const opt = selectEmpresa.options[selectEmpresa.selectedIndex];
        clienteEmailFallback = opt.getAttribute('data-email') || '';
    }

    const formData = {
        cotizacion: document.getElementById('quoteNumber')?.value || '',
        fechaRecepcion: document.getElementById('fechaRecepcion')?.value || '',
        fechaEntrega: document.getElementById('fechaEntrega')?.value || '',
        cliente: clienteNombre,
        nitEmpresa: document.getElementById('nitEmpresa')?.value || '',
        facturar: document.getElementById('facturar')?.value || '',
        informeNombre: document.getElementById('informeNombre')?.value || '',
        facturarNombre: document.getElementById('facturarNombre')?.value || '',
        informe: document.getElementById('informe')?.value || '',
        observaciones: document.getElementById('observaciones')?.value || '',
        clienteEmail: document.getElementById('clienteEmail')?.value || clienteEmailFallback || '',
        empresaEmail: document.getElementById('empresaEmail')?.value || '',
        copiaEmail: document.getElementById('copiaEmail')?.value || '',
        // Nuevos campos de lavado
        lavado: document.querySelector('input[name="lavado"]:checked')?.value || '',
        elementosLavados: document.getElementById('elementosLavados')?.value || '0',
        tipoLavado: document.getElementById('tipoLavado')?.value || '',
        fechaLavado: document.getElementById('fechaLavado')?.value || '',
        responsableLavado: document.getElementById('responsableLavado')?.value || '',
        observacionesLavado: document.getElementById('observacionesLavado')?.value || '',
        // Campos de calidad
        inspeccionVisual: document.querySelector('input[name="inspeccionVisual"]:checked')?.value || '',
        pruebasFuncionales: document.querySelector('input[name="pruebasFuncionales"]:checked')?.value || '',
        inspectorCalidad: document.getElementById('inspectorCalidad')?.value || '',
        fechaInspeccion: document.getElementById('fechaInspeccion')?.value || '',
        observacionesCalidad: document.getElementById('observacionesCalidad')?.value || '',
    estadoCalidad: document.getElementById('estadoCalidad')?.value || '',
        // Campos de firmas
        clienteRecepcionNombre: document.getElementById('clienteRecepcionNombre')?.value || '',
        clienteRecepcionCedula: document.getElementById('clienteRecepcionCedula')?.value || '',
        clienteRecepcionCargo: document.getElementById('clienteRecepcionCargo')?.value || '',
        fechaFirmaRecepcion: document.getElementById('fechaFirmaRecepcion')?.value || '',
        clienteEntregaNombre: document.getElementById('clienteEntregaNombre')?.value || '',
        clienteEntregaCedula: document.getElementById('clienteEntregaCedula')?.value || '',
        clienteEntregaCargo: document.getElementById('clienteEntregaCargo')?.value || '',
        fechaFirmaEntrega: document.getElementById('fechaFirmaEntrega')?.value || '',
        // consentimiento datos personales (se necesita cargar cuando se recupera)
        consentRecepcion: document.getElementById('consentRecepcion')?.checked || false,
        consentEntrega: document.getElementById('consentEntrega')?.checked || false,
    // Representante High Test (estructura actual del DOM)
    highTestRecepcionNombre: document.getElementById('highTestRecepcionNombre')?.value || '',
    highTestRecepcionCargo: document.getElementById('highTestRecepcionCargo')?.value || '',
    highTestEntregaNombre: document.getElementById('highTestEntregaNombre')?.value || '',
    highTestEntregaCargo: document.getElementById('highTestEntregaCargo')?.value || '',
        items: []
    };

    // Debug: verificar los valores recopilados
    console.log('Datos del formulario recopilados:', {
        cotizacion: formData.cotizacion,
        cliente: formData.cliente,
        facturar: formData.facturar,
        fechaRecepcion: formData.fechaRecepcion,
        fechaEntrega: formData.fechaEntrega,
        lavado: formData.lavado,
        estadoCalidad: formData.estadoCalidad
    });

    // 1) Incluir siempre todos los elementos GUARDADOS de ambas tablas desde savedRowsData
    const savedIdxAcred = new Set();
    const savedIdxNoAcred = new Set();

    if (savedRowsData?.ensayos_acreditados) {
        Object.entries(savedRowsData.ensayos_acreditados).forEach(([idx, row]) => {
            if (!row) return;
            // Extraer el número de 'row_0', 'row_1', etc.
            const index = parseInt(idx.replace(/^row_/, ''));
            savedIdxAcred.add(index);
            const name = typeof getElementName === 'function' ? getElementName('ensayos_acreditados', index) : (predefinedItemsData?.[index]?.nombre || `Item ${index+1}`);
            const units = getRowUnits('ensayos_acreditados', index);
            const quantity = units.length || parseInt(row.cantRecibida) || 0;
            const brandSummary = getUnitBrandGroups(units);
            const obs = String(row.observaciones || units.map(unit => unit.observations).filter(Boolean).join(' | ')).trim();
            // Incluir si hay unidades, observaciones o datos heredados
            if (quantity > 0 || (obs && obs.trim() !== '')) {
                formData.items.push({
                    name,
                    // images guardadas en row (si vienen) o en el mapa temporal
                    images: (row.images && Array.isArray(row.images)) ? row.images : (itemImagesMap[index] || []),
                    quantity,
                    units,
                    brandSummary,
                    quantity2: parseInt(row.cantEntregada) || 0,
                    quantity3: parseInt(row.cantNoUsado) || 0,
                    quantity4: parseInt(row.cantUsado) || 0,
                    status: parseInt(row.cantLavados) || 0,
                    observaciones: obs,
                    type: 'Ensayos Alcance'
                });
            }
        });
    }

    if (savedRowsData?.ensayos_no_acreditados) {
        Object.entries(savedRowsData.ensayos_no_acreditados).forEach(([idx, row]) => {
            if (!row) return;
            // Extraer el número de 'row_0', 'row_1', etc.
            const index = parseInt(idx.replace(/^row_/, ''));
            savedIdxNoAcred.add(index);
            const name = typeof getElementName === 'function' ? getElementName('ensayos_no_acreditados', index) : (predefinedItemsDataNoAcreditados?.[index]?.nombre || `Item ${index+1}`);
            const units = getRowUnits('ensayos_no_acreditados', index);
            const quantity = units.length || parseInt(row.cantRecibida) || 0;
            const brandSummary = getUnitBrandGroups(units);
            const obs = String(row.observaciones || units.map(unit => unit.observations).filter(Boolean).join(' | ')).trim();
            if (quantity > 0 || (obs && obs.trim() !== '')) {
                formData.items.push({
                    name,
                    images: (row.images && Array.isArray(row.images)) ? row.images : [],
                    quantity,
                    units,
                    brandSummary,
                    quantity2: parseInt(row.cantEntregada) || 0,
                    quantity3: parseInt(row.cantNoUsado) || 0,
                    quantity4: parseInt(row.cantUsado) || 0,
                    status: parseInt(row.cantLavados) || 0,
                    observaciones: obs,
                    type: 'Ensayos No Acreditados'
                });
            }
        });
    }

    // 2) Añadir elementos visibles NO GUARDADOS de Menu 1
    const itemsList = document.getElementById('itemsList');
    if (itemsList) {
        predefinedItemsData.forEach((itemData, index) => {
            if (savedIdxAcred.has(index)) return; // evitar duplicados con guardados
            const quantityInput = document.getElementById(`qty_${index}`);
            const quantity2Input = document.getElementById(`qty_2_${index}`);
            const quantity3Input = document.getElementById(`qty_3_${index}`);
            const quantity4Input = document.getElementById(`qty_4_${index}`);
            const statusSelect = document.getElementById(`status_${index}`);
            const observacionesInput = document.getElementById(`observaciones_${index}`);

            const q1 = parseInt(quantityInput?.value || 0) || 0;
            const q2 = parseInt(quantity2Input?.value || 0) || 0;
            const q3 = parseInt(quantity3Input?.value || 0) || 0;
            const q4 = parseInt(quantity4Input?.value || 0) || 0;
            const lav = parseInt(statusSelect?.value || 0) || 0;
            const obs = observacionesInput?.value || '';

            if (quantityInput && (q1 > 0 || q2 > 0 || q3 > 0 || q4 > 0 || lav > 0 || (obs && obs.trim() !== ''))) {
                formData.items.push({
                    name: typeof getElementName === 'function' ? getElementName('ensayos_acreditados', index) : (itemData?.nombre || `Item ${index+1}`),
                    category: itemData.categoria,
                    images: itemImagesMap[index] || [],
                    quantity: q1,
                    quantity2: q2,
                    quantity3: q3,
                    quantity4: q4,
                    status: lav,
                    observaciones: obs,
                    type: 'Ensayos Alcance'
                });
            }
        });
    }

    // 3) Añadir elementos visibles NO GUARDADOS de Menu 2 (corregido id contenedor)
    const itemsList2 = document.getElementById('itemsList2');
    if (itemsList2) {
        const baseNoAcred = Array.isArray(predefinedItemsDataNoAcreditados) ? predefinedItemsDataNoAcreditados : [];
        baseNoAcred.forEach((itemData, index) => {
            if (savedIdxNoAcred.has(index)) return; // evitar duplicados
            const quantityInput = document.getElementById(`qty2_${index}`);
            const quantity2Input = document.getElementById(`qty2_2_${index}`);
            const quantity3Input = document.getElementById(`qty2_3_${index}`);
            const quantity4Input = document.getElementById(`qty2_4_${index}`);
            const statusSelect = document.getElementById(`status2_${index}`);
            const observacionesInput = document.getElementById(`observaciones2_${index}`);

            const q1 = parseInt(quantityInput?.value || 0) || 0;
            const q2 = parseInt(quantity2Input?.value || 0) || 0;
            const q3 = parseInt(quantity3Input?.value || 0) || 0;
            const q4 = parseInt(quantity4Input?.value || 0) || 0;
            const lav = parseInt(statusSelect?.value || 0) || 0;
            const obs = observacionesInput?.value || '';

            if (quantityInput && (q1 > 0 || q2 > 0 || q3 > 0 || q4 > 0 || lav > 0 || (obs && obs.trim() !== ''))) {
                formData.items.push({
                    name: typeof getElementName === 'function' ? getElementName('ensayos_no_acreditados', index) : (itemData?.nombre || `Item ${index+1}`),
                    category: itemData.categoria,
                    images: itemImagesMap[`noacred_${index}`] || [],
                    quantity: q1,
                    quantity2: q2,
                    quantity3: q3,
                    quantity4: q4,
                    status: lav,
                    observaciones: obs,
                    type: 'Ensayos No Acreditados'
                });
            }
        });
    }

    // 4) Artículos personalizados en ambos menús
    const customItems1 = document.querySelectorAll('#itemsList > .items-grid');
    customItems1.forEach(itemDiv => {
        const itemNameDiv = itemDiv.querySelector('div:first-child');
        const quantityInput = itemDiv.querySelector('input[type="number"]');
        const statusSelect = itemDiv.querySelector('select');
        const itemName = itemNameDiv ? itemNameDiv.textContent.trim() : '';
        if (itemName && !predefinedItems.includes(itemName) && quantityInput && statusSelect && parseInt(quantityInput.value) > 0) {
            formData.items.push({
                name: itemName,
                quantity: parseInt(quantityInput.value),
                status: statusSelect.value,
                type: 'Ensayos Alcance'
            });
        }
    });

    const customItems2 = document.querySelectorAll('#itemsList2 > .items-grid');
    customItems2.forEach(itemDiv => {
        const itemNameDiv = itemDiv.querySelector('div:first-child');
        const quantityInput = itemDiv.querySelector('input[type="number"]');
        const statusSelect = itemDiv.querySelector('select');
        const itemName = itemNameDiv ? itemNameDiv.textContent.trim() : '';
        if (itemName && !predefinedItems.includes(itemName) && quantityInput && statusSelect && parseInt(quantityInput.value) > 0) {
            formData.items.push({
                name: itemName,
                quantity: parseInt(quantityInput.value),
                status: statusSelect.value,
                type: 'Ensayos No Acreditados'
            });
        }
    });

    return formData;
}

/**
 * Actualiza los totales en tiempo real incluyendo elementos guardados
 */
function updateTotals() {
    let totalRecepcion = 0;
    let totalEntrega = 0;
    let totalNoUsados = 0;
    let totalUsados = 0;
    let totalLavados = 0;
    let totalConObservaciones = 0;

    // Sumar todos los elementos guardados de ensayos alcance
    if (savedRowsData.ensayos_acreditados) {
        Object.entries(savedRowsData.ensayos_acreditados).forEach(([rowKey, rowData]) => {
            if (rowData && rowData.saved) {
                const rowIndex = parseInt(String(rowKey).replace(/^row_/, ''), 10);
                const units = getRowUnits('ensayos_acreditados', rowIndex);
                totalRecepcion += units.length || parseInt(rowData.cantRecibida) || 0;
                totalEntrega += parseInt(rowData.cantEntregada) || 0;
                totalNoUsados += parseInt(rowData.cantNoUsado) || 0;
                totalUsados += parseInt(rowData.cantUsado) || 0;
                totalLavados += parseInt(rowData.cantLavados) || 0;
                if ((rowData.observaciones && rowData.observaciones.trim() !== '') || units.some(unit => String(unit.observations || '').trim() !== '')) {
                    totalConObservaciones++;
                }
            }
        });
    }

    // Sumar elementos visibles que NO estén guardados
    const menu1Inputs = document.querySelectorAll('#itemsList input[type="number"]');
    menu1Inputs.forEach(input => {
        if (input && !input.disabled) {
            const value = parseInt(input.value) || 0;
            const id = input.id;
            
            // Obtener el índice de la fila para verificar si está guardada
            let rowIndex = null;
            const match = id.match(/_(\d+)$/);
            if (match) {
                rowIndex = parseInt(match[1]);
            }
            
            // Solo sumar si no está guardado (savedRowsData usa claves "row_X")
            const savedKey = `row_${rowIndex}`;
            if (!savedRowsData.ensayos_acreditados[savedKey] || !savedRowsData.ensayos_acreditados[savedKey].saved) {
                if (id.includes('qty_') && !id.includes('_2_') && !id.includes('_3_') && !id.includes('_4_')) {
                    totalRecepcion += value;
                } else if (id.includes('qty_2_')) {
                    totalEntrega += value;
                } else if (id.includes('qty_3_')) {
                    totalNoUsados += value;
                } else if (id.includes('qty_4_')) {
                    totalUsados += value;
                } else if (id.includes('status_')) {
                    totalLavados += value;
                }
            }
        }
    });

    // Contar observaciones de elementos no guardados
    const observacionesInputs = document.querySelectorAll('input[id*="observaciones_"]');
    observacionesInputs.forEach(input => {
        if (input && input.value.trim() !== '' && !input.disabled) {
            const id = input.id;
            let rowIndex = null;
            
            const match = id.match(/observaciones_(\d+)/);
            if (match) {
                rowIndex = parseInt(match[1]);
                
                // Solo contar si no está guardado (usar clave row_X)
                const savedKeyObs = `row_${rowIndex}`;
                if (!savedRowsData.ensayos_acreditados[savedKeyObs] || !savedRowsData.ensayos_acreditados[savedKeyObs].saved) {
                    totalConObservaciones++;
                }
            }
        }
    });

    // Actualizar los displays
    document.getElementById('totalRecepcion').textContent = totalRecepcion;
    document.getElementById('totalEntrega').textContent = totalEntrega;
    
    // Verificar si existen otros elementos antes de actualizarlos
    const totalNoUsadosEl = document.getElementById('totalNoUsados');
    const totalUsadosEl = document.getElementById('totalUsados');
    const totalLavadosEl = document.getElementById('totalLavados');
    const totalConObservacionesEl = document.getElementById('totalConObservaciones');
    
    if (totalNoUsadosEl) totalNoUsadosEl.textContent = totalNoUsados;
    if (totalUsadosEl) totalUsadosEl.textContent = totalUsados;
    if (totalLavadosEl) totalLavadosEl.textContent = totalLavados;
    if (totalConObservacionesEl) totalConObservacionesEl.textContent = totalConObservaciones;

    // Actualizar estado general
    updateGeneralStatus();
}

/**
 * Actualiza el estado general del proceso
 */
function updateGeneralStatus() {
    const statusElement = document.getElementById('statusGeneral');
    const totalRecepcion = parseInt(document.getElementById('totalRecepcion').textContent);
    const totalEntrega = parseInt(document.getElementById('totalEntrega').textContent);
    
    if (totalRecepcion === 0) {
        statusElement.className = 'status-badge status-pending';
        statusElement.innerHTML = '<i class="fas fa-clock"></i> Pendiente';
    } else if (totalEntrega === 0) {
        statusElement.className = 'status-badge status-warning';
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> En Proceso';
    } else if (totalRecepcion === totalEntrega) {
        statusElement.className = 'status-badge status-complete';
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Completo';
    } else {
        statusElement.className = 'status-badge status-warning';
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Parcial';
    }
}

/**
 * Funciones adicionales para las nuevas características
 */
function validateForm() {
    // Campos requeridos reales del DOM
    const requiredFields = [
        'quoteNumber', // Nº de Recepción
        'fechaRecepcion',
        'empresaSelect',
        'facturar' // Nº de Remisión
    ];

    let isValid = true;
    const missingLabels = [];

    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        const value = el?.value?.trim();
        const empty = !value || value === '';
        if (empty) {
            isValid = false;
            // Nombre amigable
            const label = ({
                quoteNumber: 'Nº de Recepción',
                fechaRecepcion: 'Fecha de Recepción',
                empresaSelect: 'Nombre del Cliente',
                facturar: 'Nº de Remisión'
            }[id]) || id;
            missingLabels.push(label);
            if (el) el.style.border = '2px solid #ff6b6b';
        } else if (el) {
            el.style.border = '';
        }
    });

    if (isValid) {
        showNotification('✅ Formulario válido', 'success');
    } else {
        showNotification(`❌ Faltan campos obligatorios: ${missingLabels.join(', ')}`, 'error');
    }

    return isValid;
}

function resetForm() {
    if (!confirm('¿Estás seguro de que quieres reiniciar todo el formulario? Se perderán todos los datos.')) return;

    const quoteEl = document.getElementById('quoteNumber');
    const selectedCode = quoteEl?.value?.trim() || '';
    const held = cleanupHeldReceptionNumbers();
    const selectedHeldEntry = selectedCode ? held[selectedCode] : null;
    const selectedIsHeld = selectedHeldEntry && Number(selectedHeldEntry.expiresAt) > Date.now();

    // Resetear formulario
    document.getElementById('deliveryForm')?.reset();

    // Limpiar explícitamente campo de observaciones generales
    const observacionesField = document.getElementById('observaciones');
    if (observacionesField) observacionesField.value = '';

    // Limpiar listas de ítems visibles
    document.getElementById('itemsList') && (document.getElementById('itemsList').innerHTML = '');
    document.getElementById('itemsList2') && (document.getElementById('itemsList2').innerHTML = '');

    // Limpiar elementos guardados en memoria y UI
    if (typeof savedRowsData !== 'undefined') {
        savedRowsData.ensayos_acreditados = {};
        savedRowsData.ensayos_no_acreditados = {};
    }
    const savedContainer = document.getElementById('savedItemsContainer');
    if (savedContainer) savedContainer.innerHTML = '';
    const savedCount = document.getElementById('savedItemsCount');
    if (savedCount) savedCount.textContent = '0 elementos guardados';
    const savedPrev = document.getElementById('savedItemsPreview');
    if (savedPrev) savedPrev.style.display = 'none';

    // Limpiar vista previa
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');
    if (previewContent) previewContent.innerHTML = '';
    if (previewSection) previewSection.style.display = 'none';

    // Reiniciar totales y estado

    try {
        if (quoteEl) {
            // SIEMPRE liberar el campo
            quoteEl.disabled = false;
            // Limpiar opciones y poner el siguiente disponible directamente
            const nextCode = getNextReceptionNumber();
            quoteEl.innerHTML = '';
            // Agregar placeholder
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Seleccione N° de Recepción';
            placeholder.disabled = true;
            placeholder.selected = true;
            quoteEl.appendChild(placeholder);
            // Agregar siguiente número
            if (nextCode) {
                const opt = document.createElement('option');
                opt.value = nextCode;
                opt.textContent = nextCode;
                quoteEl.appendChild(opt);
                quoteEl.value = nextCode;
            }
            refreshNextReceptionNumberInfo();
        }
    } catch (e) {
        console.warn('Error al reiniciar números de recepción después del reset:', e);
    }

    // Reiniciar totales y estado
    const totalRecepcion = document.getElementById('totalRecepcion');
    const totalEntrega = document.getElementById('totalEntrega');
    if (totalRecepcion) totalRecepcion.textContent = '0';
    if (totalEntrega) totalEntrega.textContent = '0';
    updateGeneralStatus();

    // Limpiar firmas y PDF generado
    if (typeof signaturePads !== 'undefined') {
        Object.keys(signaturePads).forEach(k => signaturePads[k]?.clear?.());
    }
    if (typeof signatureData !== 'undefined') {
        Object.keys(signatureData).forEach(k => signatureData[k] = null);
    }
    if (typeof generatedPDF !== 'undefined') {
        generatedPDF = null;
    }

    // Desmarcar casillas de consentimiento de datos
    const consentRecepcion = document.getElementById('consentRecepcion');
    const consentEntrega = document.getElementById('consentEntrega');
    if (consentRecepcion) consentRecepcion.checked = false;
    if (consentEntrega) consentEntrega.checked = false;

    // Limpiar campos de cliente y representantes HIGH TEST
    const clienteFields = ['clienteRecepcionNombre','clienteRecepcionCedula','clienteRecepcionCargo','clienteEntregaNombre','clienteEntregaCedula','clienteEntregaCargo'];
    clienteFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const htFields = ['highTestRecepcionNombre','highTestRecepcionCargo','highTestEntregaNombre','highTestEntregaCargo'];
    htFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    // Limpiar empresa seleccionada y NIT
    const empresaSel = document.getElementById('empresaSelect'); if (empresaSel) empresaSel.selectedIndex = 0;
    const nitEl2 = document.getElementById('nitEmpresa'); if (nitEl2) nitEl2.value = '';

    // Ocultar o limpiar indicador de caso cargado
    const loadedEl = document.getElementById('loadedReceptionNumber'); if (loadedEl) loadedEl.textContent = '-';

    // Lavado: restablecer campos
    const lavadoNo = document.getElementById('lavadoNo');
    if (lavadoNo) lavadoNo.checked = true;
    const responsableLavado = document.getElementById('responsableLavado');
    if (responsableLavado) responsableLavado.value = '-';
    actualizarCantidadLavados();

    // Ocultar tabla de Elementos del Alcance
    const menu1 = document.getElementById('menu1');
    if (menu1) menu1.style.display = 'none';

    // Resetear selector de tipo de ensayos
    const tipoEnsayosSelect = document.getElementById('tipoEnsayos');
    if (tipoEnsayosSelect) tipoEnsayosSelect.value = '';

    // Reinicializar dropdown de números de recepción con restricciones aplicadas
    try {
        if (!selectedIsHeld) {
            initializeQuoteNumbers();
        }
    } catch (e) {
        console.warn('No se pudo reinicializar números de recepción:', e);
    }

    // Limpiar paginación
    const itemsListPagination = document.getElementById('itemsListPagination');
    if (itemsListPagination) itemsListPagination.innerHTML = '';

    showNotification('🔄 Formulario reiniciado', 'info');
}

function printDocument() {
    window.print();
}

function sendNotification() {
    const data = collectFormData();
    const email = data.clienteEmail || '';
    if (email) {
        showNotification(`📧 Notificación enviada a ${email}`, 'success');
    } else {
        showNotification('❌ No se ha especificado un email', 'error');
    }
}

function exportData() {
    const formData = collectFormData();
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `recepcion_${formData.cotizacion}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('📥 Datos exportados correctamente', 'success');
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // Colores según el tipo
    switch(type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'warning':
            notification.style.background = '#ffc107';
            notification.style.color = '#000';
            break;
        default:
            notification.style.background = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Carga los datos de un objeto de borrador guardado en los campos del formulario.
 * @param {object} data - Los datos del borrador a cargar.
 * @param {boolean} skipDates - Si true, no carga fechas (para importar JSON).
 * @param {boolean} isFromCompleted - Si true, bloquea el campo de recepción (casos terminados).
 */
function loadFormData(data, skipDates = false, isFromCompleted = false) {
    // Establecer flag para indicar que estamos cargando un caso
    isLoadingCase = true;
    
    // Rellena los campos generales
    const quoteEl = document.getElementById('quoteNumber');
    const fechaRecEl = document.getElementById('fechaRecepcion');
    const fechaEntEl = document.getElementById('fechaEntrega');
    const empresaSel = document.getElementById('empresaSelect');
    const nitEl = document.getElementById('nitEmpresa');
    const remisionEl = document.getElementById('facturar');
    const informeNombreEl = document.getElementById('informeNombre');
    const facturarNombreEl = document.getElementById('facturarNombre');
    const obsEl = document.getElementById('observaciones');
    const cliEmailEl = document.getElementById('clienteEmail');
    const empEmailEl = document.getElementById('empresaEmail');
    const ccEmailEl = document.getElementById('copiaEmail');

    if (quoteEl) {
        const cotizacion = data.cotizacion || '';
        // Agregar la opción si no existe en el select
        if (cotizacion && !Array.from(quoteEl.options).some(opt => opt.value === cotizacion)) {
            const option = document.createElement('option');
            option.value = cotizacion;
            option.textContent = cotizacion;
            quoteEl.appendChild(option);
        }
        quoteEl.value = cotizacion;
        // Bloquear si es de casos terminados, si está restringido, o si se está cargando un caso
        if (isFromCompleted || (cotizacion && isReceptionRestricted(cotizacion))) {
            quoteEl.disabled = true;
        } else if (cotizacion) {
            // Caso cargado desde borrador: mostrar y bloquear el número cargado
            quoteEl.disabled = true;
        } else {
            quoteEl.disabled = false;
            restoreHeldReceptionSelection();
        }
    }
    // Si skipDates = true (importar JSON), no cargar fechas
    if (!skipDates) {
        if (fechaRecEl) fechaRecEl.value = data.fechaRecepcion || '';
        if (fechaEntEl) fechaEntEl.value = data.fechaEntrega || '';
        // si es un caso ya entregado y no viene fecha de entrega, asignar hoy para que el usuario vea algo
        if (fechaEntEl && !fechaEntEl.value && data.status === 'entrega') {
            fechaEntEl.value = new Date().toISOString().split('T')[0];
        }
    }
    // siempre colocar las horas de firma si existen en los datos (no dependen de skipDates)
    const fechaFirmaRecEl = document.getElementById('fechaFirmaRecepcion');
    const fechaFirmaEntEl = document.getElementById('fechaFirmaEntrega');
    if (fechaFirmaRecEl) fechaFirmaRecEl.value = data.fechaFirmaRecepcion || '';
    if (fechaFirmaEntEl) fechaFirmaEntEl.value = data.fechaFirmaEntrega || '';
    
    // Restaurar estado de casillas de consentimiento, infiriendo también de la firma si corresponde
    const consentRecEl = document.getElementById('consentRecepcion');
    const consentEntEl = document.getElementById('consentEntrega');
    if (consentRecEl) {
        const hasRecSig = data.signatureData && (data.signatureData.signatureCanvasRecepcion || data.signatureData.signatureCanvas);
        consentRecEl.checked = !!data.consentRecepcion || !!hasRecSig;
    }
    if (consentEntEl) {
        const hasEntSig = data.signatureData && (data.signatureData.signatureCanvasEntrega || data.signatureData.signatureCanvas);
        consentEntEl.checked = !!data.consentEntrega || !!hasEntSig;
    }
    // aplicar bloqueo/activación apropiado
    if (consentRecEl) toggleConsentFields('Recepcion');
    if (consentEntEl) toggleConsentFields('Entrega');
    if (remisionEl) remisionEl.value = data.facturar || '';
    if (informeNombreEl) informeNombreEl.value = (data.informeNombre || data.informe || '').toUpperCase();
    if (facturarNombreEl) facturarNombreEl.value = (data.facturarNombre || '').toUpperCase();
    if (obsEl) obsEl.value = data.observaciones || '';
    if (cliEmailEl) cliEmailEl.value = data.clienteEmail || '';
    if (empEmailEl) empEmailEl.value = data.empresaEmail || '';
    if (ccEmailEl) ccEmailEl.value = data.copiaEmail || '';
    if (nitEl && data.nitEmpresa) nitEl.value = data.nitEmpresa;

    // Mostrar el Nº de Recepción cargado en la UI
    try {
        const loadedEl = document.getElementById('loadedReceptionNumber');
        if (loadedEl) loadedEl.textContent = data.cotizacion || '-';
    } catch (e) {}

    // Cargar campos de firmas/cliente si vienen en el borrador
    const clavesCliente = [
        'clienteRecepcionNombre','clienteRecepcionCedula','clienteRecepcionCargo',
        'clienteEntregaNombre','clienteEntregaCedula','clienteEntregaCargo'
    ];
    clavesCliente.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = data[id] || '';
    });

    // Cargar representantes HIGH TEST
    const htRecName = document.getElementById('highTestRecepcionNombre');
    const htRecCargo = document.getElementById('highTestRecepcionCargo');
    const htEntName = document.getElementById('highTestEntregaNombre');
    const htEntCargo = document.getElementById('highTestEntregaCargo');
    if (htRecName) htRecName.value = data.highTestRecepcionNombre || '';
    if (htRecCargo) htRecCargo.value = data.highTestRecepcionCargo || '';
    if (htEntName) htEntName.value = data.highTestEntregaNombre || '';
    if (htEntCargo) htEntCargo.value = data.highTestEntregaCargo || '';
    // Actualizar cargo solo si no vino en los datos (para preservar el valor original al importar)
    if (!data.highTestRecepcionCargo) { try { actualizarCargoHighTest('Recepcion'); } catch(e) {} }
    if (!data.highTestEntregaCargo) { try { actualizarCargoHighTest('Entrega'); } catch(e) {} }

    // Seleccionar empresa en el combo por nombre visible o data-nombre
    if (empresaSel && data.cliente) {
        let matchedIndex = -1;
        for (let i = 0; i < empresaSel.options.length; i++) {
            const opt = empresaSel.options[i];
            const optText = (opt.getAttribute('data-nombre') || opt.text || '').trim();
            if (optText && optText.toLowerCase() === data.cliente.trim().toLowerCase()) {
                matchedIndex = i;
                break;
            }
        }
        if (matchedIndex >= 0) {
            empresaSel.selectedIndex = matchedIndex;
            // Disparar cambio para que se actualicen campos dependientes (NIT, etc.)
            empresaSel.dispatchEvent(new Event('change'));
            
            // Actualizar también el campo de búsqueda personalizado si existe
            const empresaSearchInput = document.getElementById('empresaSearchInput');
            if (empresaSearchInput) {
                empresaSearchInput.value = data.cliente;
            }
        }
    }

    // Añadir botón de filtro 'Con cantidades' en menu2 si no existe
    try {
        const existing2 = document.querySelector('#menu2 .filter-btn-2[data-filter="ConCantidad"]');
        if (!existing2 && filterButtons2) {
            const btn2 = document.createElement('button');
            btn2.className = 'filter-btn-2 btn-con-cantidades';
            btn2.dataset.filter = 'ConCantidad';
            btn2.type = 'button';
            btn2.textContent = 'Con cantidades';
            filterButtons2.appendChild(btn2);
        }
    } catch (e) {}

    // Seleccionar "acreditados" en tipoEnsayos ANTES de cargar los items
    // y mostrar la sección de Ensayos Alcance si hay items
    if (data.items && data.items.length > 0) {
        const tipoEnsayosSelect = document.getElementById('tipoEnsayos');
        if (tipoEnsayosSelect) {
            tipoEnsayosSelect.value = 'acreditados';
            console.log('✅ Ensayos Alcance seleccionado');
            
            // Llamar a cargarEnsayosAcreditados() con delay para cargar datos desde JSON
            // Llamar a cargarEnsayosAcreditados() con delay y esperar que termine
            setTimeout(() => {
                // Esperar a que loadPredefinedItemsFromJSON() se complete
                loadPredefinedItemsFromJSON().then(() => {
                    console.log('✅ loadPredefinedItemsFromJSON() completado');
                    console.log('predefinedItemsData ahora tiene', predefinedItemsData.length, 'elementos');
                    
                    // Restaurar savedRowsData desde los items guardados AQUÍ después de cargar datos
                    if (data.items && Array.isArray(data.items)) {
                        // Limpiar savedRowsData antes de cargar nuevos datos
                        savedRowsData = {
                            ensayos_acreditados: {},
                            ensayos_no_acreditados: {}
                        };
                        
                        data.items.forEach((item, itemIdx) => {
                            if (item.type === 'Ensayos Alcance') {
                                // Buscar el índice del item en predefinedItemsData por nombre
                                const foundIdx = predefinedItemsData.findIndex(p => p.nombre === item.name);
                                if (foundIdx !== -1) {
                                    const rowId = `row_${foundIdx}`;
                                    const units = Array.isArray(item.units) ? item.units : [];
                                    savedRowsData.ensayos_acreditados[rowId] = {
                                        units,
                                        cantRecibida: item.quantity || units.length || 0,
                                        cantEntregada: item.quantity2 || 0,
                                        cantNoUsado: item.quantity3 || 0,
                                        cantUsado: item.quantity4 || 0,
                                        cantLavados: item.status || 0,
                                        observaciones: item.observaciones || '',
                                        images: item.images || [],
                                        saved: true
                                    };
                                    console.log(`✅ savedRowsData restaurado para ${item.name}`);
                                }
                            } else if (item.type === 'Ensayos No Acreditados') {
                                // Buscar el índice del item en predefinedItemsDataNoAcreditados por nombre
                                const foundIdx = (Array.isArray(predefinedItemsDataNoAcreditados) ? predefinedItemsDataNoAcreditados : [])
                                    .findIndex(p => p.nombre === item.name);
                                if (foundIdx !== -1) {
                                    const rowId = `row_${foundIdx}`;
                                    const units = Array.isArray(item.units) ? item.units : [];
                                    savedRowsData.ensayos_no_acreditados[rowId] = {
                                        units,
                                        cantRecibida: item.quantity || units.length || 0,
                                        cantEntregada: item.quantity2 || 0,
                                        cantNoUsado: item.quantity3 || 0,
                                        cantUsado: item.quantity4 || 0,
                                        cantLavados: item.status || 0,
                                        observaciones: item.observaciones || '',
                                        images: item.images || [],
                                        saved: true
                                    };
                                }
                            }
                        });
                    }
                    
                    // Mostrar la tabla de ensayos alcance con paginación
                    const menu1 = document.getElementById('menu1');
                    if (menu1) {
                        menu1.style.display = 'block';
                    }
                    
                    // Activar filtro "Todos" para mostrar todos los elementos
                    document.querySelectorAll('#menu1 .filter-btn-1').forEach(btn => btn.classList.remove('active'));
                    const todosBtn = document.querySelector('#menu1 #todos-btn-1');
                    if (todosBtn) {
                        todosBtn.classList.add('active');
                    }
                    
                    // Cargar la tabla con los datos
                    loadPredefinedItems('', 'Todos', 1);
                    
                    // Inicializar filtros después de mostrar la tabla
                    setTimeout(() => {
                        initializeFilters();
                        initializeFilterEventListeners();
                    }, 200);
                    
                    // Llenar los datos de los campos de cantidad
                    if (data.items) {
                        const elementsWithQuantities = [];
                        
                        data.items.forEach(item => {
                            // Procesar items de Ensayos Alcance
                            if (item.type === 'Ensayos Alcance') {
                                const index = predefinedItemsData.findIndex(predItem => predItem.nombre === item.name);
                                console.log(`Buscando "${item.name}" - index: ${index}`);
                                if (index !== -1) {
                                    // Es un artículo predefinido - rellenar todos los campos qty
                                    const qtyInput = document.getElementById(`qty_${index}`);
                                    const qty2Input = document.getElementById(`qty_2_${index}`);
                                    const qty3Input = document.getElementById(`qty_3_${index}`);
                                    const qty4Input = document.getElementById(`qty_4_${index}`);
                                    const statusSelect = document.getElementById(`status_${index}`);
                                    const obsInput = document.getElementById(`observaciones_${index}`);
                                    
                                    if (qtyInput) qtyInput.value = item.quantity || 0;
                                    if (qty2Input) qty2Input.value = item.quantity2 || 0;
                                    if (qty3Input) qty3Input.value = item.quantity3 || 0;
                                    if (qty4Input) qty4Input.value = item.quantity4 || 0;
                                    if (statusSelect) statusSelect.value = item.status || 0;
                                    if (obsInput) obsInput.value = item.observaciones || '';
                                    
                                    // Registrar que este elemento tiene cantidades para marcarlo como guardado
                                    if (item.quantity || item.quantity2 || item.quantity3 || item.quantity4) {
                                        elementsWithQuantities.push({type: 'ensayos_acreditados', index: index});
                                    }
                                    
                                    console.log(`✅ Cargado ${item.name} - qty: ${item.quantity}, qty2: ${item.quantity2}`);
                                }
                            } 
                            // Procesar items de Ensayos No Acreditados
                            else if (item.type === 'Ensayos No Acreditados') {
                                const baseNoAcred = Array.isArray(predefinedItemsDataNoAcreditados) ? predefinedItemsDataNoAcreditados : [];
                                const index = baseNoAcred.findIndex(predItem => predItem.nombre === item.name);
                                if (index !== -1) {
                                    // Es un artículo no acreditado predefinido
                                    const qtyInput = document.getElementById(`qty2_${index}`);
                                    const qty2Input = document.getElementById(`qty2_2_${index}`);
                                    const qty3Input = document.getElementById(`qty2_3_${index}`);
                                    const qty4Input = document.getElementById(`qty2_4_${index}`);
                                    const statusSelect = document.getElementById(`status2_${index}`);
                                    const obsInput = document.getElementById(`observaciones2_${index}`);
                                    
                                    if (qtyInput) qtyInput.value = item.quantity || 0;
                                    if (qty2Input) qty2Input.value = item.quantity2 || 0;
                                    if (qty3Input) qty3Input.value = item.quantity3 || 0;
                                    if (qty4Input) qty4Input.value = item.quantity4 || 0;
                                    if (statusSelect) statusSelect.value = item.status || 0;
                                    if (obsInput) obsInput.value = item.observaciones || '';
                                    
                                    // Registrar que este elemento tiene cantidades para marcarlo como guardado
                                    if (item.quantity || item.quantity2 || item.quantity3 || item.quantity4) {
                                        elementsWithQuantities.push({type: 'ensayos_no_acreditados', index: index});
                                    }
                                }
                            }
                        });
                        
                        // Marcar todos los elementos con cantidades como guardados
                        elementsWithQuantities.forEach(el => {
                            setTimeout(() => {
                                updateRowSaveStatus(el.type, el.index, true);
                                disableRowEditing(el.type, el.index);
                            }, 100);
                        });
                    }
                    
                    // Marcar los elementos guardados como salvos visualmente
                    setTimeout(() => {
                        if (savedRowsData.ensayos_acreditados) {
                            Object.keys(savedRowsData.ensayos_acreditados).forEach(rowIndex => {
                                if (savedRowsData.ensayos_acreditados[rowIndex] && savedRowsData.ensayos_acreditados[rowIndex].saved) {
                                    // Extraer el número de "row_0", "row_1", etc.
                                    const numericIndex = rowIndex.replace(/^row_/, '');
                                    updateRowSaveStatus('ensayos_acreditados', numericIndex, true);
                                    disableRowEditing('ensayos_acreditados', numericIndex);
                                }
                            });
                        }
                        if (savedRowsData.ensayos_no_acreditados) {
                            Object.keys(savedRowsData.ensayos_no_acreditados).forEach(rowIndex => {
                                if (savedRowsData.ensayos_no_acreditados[rowIndex] && savedRowsData.ensayos_no_acreditados[rowIndex].saved) {
                                    // Extraer el número de "row_0", "row_1", etc.
                                    const numericIndex = rowIndex.replace(/^row_/, '');
                                    updateRowSaveStatus('ensayos_no_acreditados', numericIndex, true);
                                    disableRowEditing('ensayos_no_acreditados', numericIndex);
                                }
                            });
                        }
                        console.log('✅ Elementos marcados como guardados');
                    }, 300);
                    
                    console.log('✅ Todos los datos de cantidad cargados en los campos');
                }).catch(err => {
                    console.error('❌ Error al cargar datos:', err);
                });
            }, 100);
        }
    }

    // Limpia los elementos dinámicos existentes antes de cargar
    const itemsList = document.getElementById('itemsList');
    if (itemsList) {
        itemsList.innerHTML = '';
    }
    loadPredefinedItems(); // Vuelve a cargar los artículos predefinidos primero

    // Carga las firmas múltiples si existen
    if (data.signatureData && typeof data.signatureData === 'object') {
        signatureData = data.signatureData; // Almacena las múltiples firmas
        Object.keys(data.signatureData).forEach(canvasId => {
            if (data.signatureData[canvasId] && signaturePads[canvasId]) {
                signaturePads[canvasId].fromDataURL(data.signatureData[canvasId]);
            }
        });
    } else if (data.signatureData) {
        // Compatibilidad con formato antiguo de una sola firma
        signatureData['signatureCanvas'] = data.signatureData;
        if (signaturePads['signatureCanvas']) {
            signaturePads['signatureCanvas'].fromDataURL(data.signatureData);
        }
    } else {
        clearAllSignatures(); // Limpia todas las firmas si no hay datos presentes
    }

    // Recalcular totales/indicadores y lavado (ejecutar siempre al final)
    setTimeout(() => {
        actualizarCantidadLavados();
        updateTotals();
        updateSavedItemsPreview();
        // Establecer flag a false después de completar la carga del caso
        isLoadingCase = false;
    }, 1500);
}

// =======================================================
// FUNCIONES DE PREVISUALIZACIÓN Y GENERACIÓN DE PDF
// =======================================================

/**
 * Muestra una vista previa del documento basada en los datos actuales del formulario.
 */
function previewDocument() {
    const formData = collectFormData();
    const previewSection = document.getElementById('previewSection');
    const previewContent = document.getElementById('previewContent');

    if (!previewSection || !previewContent) return; // Sale si los elementos no existen

    // Separar los elementos por tipo de ensayo
    let ensayosAcreditados = formData.items.filter(item => item.type === 'Ensayos Alcance');
    let ensayosNoAcreditados = formData.items.filter(item => item.type === 'Ensayos No Acreditados');

    // Evitar duplicados: normalizar por tipo+nombre (puede ocurrir si hay entradas repetidas)
    const dedupeByKey = (items) => {
        const seen = new Set();
        return items.filter(it => {
            const key = `${it.type}|${(it.name || '').trim()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const renderBrandSummaryChips = (brandSummary) => {
        const groups = Array.isArray(brandSummary) ? brandSummary : [];
        if (groups.length === 0) {
            return '<span style="display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; background:#eef4fb; color:#022859; border:1px solid rgba(2,40,89,0.12); font-size:11px; font-weight:700;">Sin marca</span>';
        }

        return groups.map(({ brand, count }) => `
            <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:#eef4fb; color:#022859; border:1px solid rgba(2,40,89,0.12); font-size:11px; font-weight:700; margin:2px 4px 2px 0; white-space:nowrap;">
                <span>${escapeHtml(brand || 'Sin marca')}</span>
                <span style="background:#022859; color:#fff; border-radius:999px; padding:1px 6px; font-size:10px;">x${count || 0}</span>
            </span>
        `).join('');
    };

    ensayosAcreditados = dedupeByKey(ensayosAcreditados);
    ensayosNoAcreditados = dedupeByKey(ensayosNoAcreditados);

    let itemsHTML = '';

    // Mostrar Ensayos Alcance si existen
    if (ensayosAcreditados.length > 0) {
        itemsHTML += `
            <h4 style="color: #022859; margin-top: 20px;">📋 Ensayos Alcance</h4>
            <div style="display: grid; text-align: center; grid-template-columns: 2fr 1.4fr 1fr 1fr 1fr 1fr 1fr 2fr; gap: 10px; background: #f8f9fa; padding: 10px; font-weight: bold; border-bottom: 2px solid #022859; align-items:center;">
                <div style="text-align:left">Elemento</div>
                <div>Cant. <br>Recibida</div>
                <div>Cant. <br>Entregada</div>
                <div>Marcas</div>
                <div>No Usado</div>
                <div>Usado</div>
                <div>Lavados</div>
                <div>Observaciones</div>
            </div>
        `;
        
        // Formateo: mostrar '-' cuando no haya dato o sea 0
        const fmt = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '-' : v);
        ensayosAcreditados.forEach(item => {
            itemsHTML += `
                <div style="display: grid; grid-template-columns: 2fr 1.4fr 1fr 1fr 1fr 1fr 1fr 2fr; gap: 10px; padding: 5px; border-bottom: 1px solid #eee; align-items:center;">
                    <span>${item.name}</span>
                    <span style="text-align: center;">${fmt(item.quantity)}</span>
                    <span style="text-align: center;">${fmt(item.quantity2)}</span>
                    <div style="display:flex; flex-wrap:wrap; justify-content:flex-start;">${renderBrandSummaryChips(item.brandSummary)}</div>
                    <span style="text-align: center;">${fmt(item.quantity3)}</span>
                    <span style="text-align: center;">${fmt(item.quantity4)}</span>
                    <span style="text-align: center;">${fmt(item.status)}</span>
                    <span>${item.observaciones || '-'}</span>
                </div>
            `;
        });
    }

    // Moveremos la sección de lavados al final; aquí solo calculamos
    const totalLavados = calcularTotalElementosLavados();
    const lavadoValor = formData.lavado || (document.querySelector('input[name="lavado"]:checked')?.value || '');

    // Mostrar Ensayos No Acreditados si existen
    if (ensayosNoAcreditados.length > 0) {
        itemsHTML += `
            <h4 style="color: #022859; margin-top: 20px;">🔧 Ensayos No Acreditados</h4>
            <div style="display: grid; text-align: center; grid-template-columns: 2fr 1.4fr 1fr 1fr 1fr 1fr 1fr 2fr; gap: 10px; background: #f8f9fa; padding: 10px; font-weight: bold; border-bottom: 2px solid #022859; align-items:center;">
                <div style="text-align:left">Elemento</div>
                <div>Cant. <br>Recibida</div>
                <div>Cant. <br>Entregada</div>
                <div>Marcas</div>
                <div>No Usado</div>
                <div>Usado</div>
                <div>Lavados</div>
                <div>Observaciones</div>
            </div>
        `;
        
        // Formateo: mostrar '-' cuando no haya dato o sea 0
        const fmt = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '-' : v);
        ensayosNoAcreditados.forEach(item => {
            itemsHTML += `
                <div style="display: grid; grid-template-columns: 2fr 1.4fr 1fr 1fr 1fr 1fr 1fr 2fr; gap: 10px; padding: 5px; border-bottom: 1px solid #eee; align-items:center;">
                    <span>${item.name}</span>
                    <span style="text-align: center;">${fmt(item.quantity)}</span>
                    <span style="text-align: center;">${fmt(item.quantity2)}</span>
                    <div style="display:flex; flex-wrap:wrap; justify-content:flex-start;">${renderBrandSummaryChips(item.brandSummary)}</div>
                    <span style="text-align: center;">${fmt(item.quantity3)}</span>
                    <span style="text-align: center;">${fmt(item.quantity4)}</span>
                    <span style="text-align: center;">${fmt(item.status)}</span>
                    <span>${item.observaciones || '-'}</span>
                </div>
            `;
        });
    }

    previewContent.innerHTML = `
        <div style="border: 1px solid #ddd; padding: 20px; background: white;">
            <h2 style="color: #022859; text-align: center;">FORMATO DE RECEPCIÓN Y ENTREGA DE ITEMS</h2>

            <!-- Información General completa -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <p><strong>Nº de Recepción:</strong> ${formData.cotizacion || '-'}</p>
                    <p><strong>Cliente:</strong> ${formData.cliente || '-'}</p>
                    <p><strong>NIT / CC:</strong> ${formData.nitEmpresa || '-'}</p>
                    <p><strong>Informe a Nombre de:</strong> ${formData.informeNombre || '-'}</p>
                    <p><strong>Facturar a Nombre de:</strong> ${formData.facturarNombre || '-'}</p>
                </div>
                <div>
                    <p><strong>Nº de Remisión:</strong> ${formData.facturar || '-'}</p>
                    <p><strong>Fecha Recepción:</strong> ${formData.fechaRecepcion || '-'}</p>
                    <p><strong>Fecha Entrega:</strong> ${formData.fechaEntrega || '-'}</p>
                </div>
            </div>

            <h3 style="color: #022859;">📦 Elementos de Ensayo:</h3>
            ${itemsHTML || '<p style="text-align: center; color: #666;">No hay elementos seleccionados.</p>'}

            <!-- Resumen de elementos -->
            <div style="margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div><strong>Total Elementos Recepción:</strong> <span id="pvTotalRecepcion">${document.getElementById('totalRecepcion')?.textContent || '0'}</span></div>
                <div><strong>Total Elementos Entrega:</strong> <span id="pvTotalEntrega">${document.getElementById('totalEntrega')?.textContent || '0'}</span></div>
            </div>

            <!-- Lavados reorganizados -->
            <div style="margin-top: 12px;">
                <div><strong>🧽 LAVADO:</strong> ${lavadoValor || '-'}</div>
                <div style="margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div><strong>Cantidad de Lavados:</strong> <span style="color: #022859; font-weight: bold;">${totalLavados}</span></div>
                </div>
            </div>

            <!-- Observaciones -->
            ${formData.observaciones ? `<div style="margin-top: 20px;"><strong>Observaciones Generales:</strong><br>${formData.observaciones}</div>` : ''}

            <!-- Firmas en una sola fila (Recepción y Entrega) con todos los campos -->
            <div style="margin-top: 25px;">
                <h4>Firmas: (Cliente)</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
                    <div>
                        <h5 style="margin: 6px 0;">👤 Cliente (Recepción)</h5>
                        ${signatureData['signatureCanvasRecepcion'] ? `<img src="${signatureData['signatureCanvasRecepcion']}" class="signature-preview" style="max-width: 250px; border: 1px solid #ccc; margin: 5px;">` : '<em>Sin firma</em>'}
                        <div><strong>Nombre:</strong> ${formData.clienteRecepcionNombre || '-'}</div>
                        <div><strong>Cédula:</strong> ${formData.clienteRecepcionCedula || '-'}</div>
                        <div><strong>Cargo:</strong> ${formData.clienteRecepcionCargo || '-'}</div>
                        
                    </div>
                    <div>
                        <h5 style="margin: 6px 0;">👤 Cliente (Entrega)</h5>
                        ${signatureData['signatureCanvasEntrega'] ? `<img src="${signatureData['signatureCanvasEntrega']}" class="signature-preview" style="max-width: 250px; border: 1px solid #ccc; margin: 5px;">` : '<em>Sin firma</em>'}
                        <div><strong>Nombre:</strong> ${formData.clienteEntregaNombre || '-'}</div>
                        <div><strong>Cédula:</strong> ${formData.clienteEntregaCedula || '-'}</div>
                        <div><strong>Cargo:</strong> ${formData.clienteEntregaCargo || '-'}</div>
                        
                    </div>
                </div>
            </div>

            <!-- Representante HIGH TEST y Correos de envío -->
        <div style="margin-top: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4>🏢 Representante HIGH TEST</h4>
                    <div><strong>Nombre (Recepción):</strong> ${formData.highTestRecepcionNombre || '-'}</div>
                    <div><strong>Cargo:</strong> ${formData.highTestRecepcionCargo || '-'}</div>
            <div><strong>Nombre (Entrega):</strong> ${formData.highTestEntregaNombre || '-'}</div>
            <div><strong>Cargo:</strong> ${formData.highTestEntregaCargo || '-'}</div>
                </div>
                
            </div>
        </div>
    `;

    previewSection.style.display = 'block'; // Hace visible la sección de previsualización
}

/**
 * Genera un documento PDF basado en los datos recopilados del formulario.
 * Requiere que la librería jsPDF esté cargada.
 */
var __pdfGenerating = false;
function generatePDF() {
    if (__pdfGenerating) { showNotification('Generación de PDF en curso, por favor espera...', 'info'); return; }
    __pdfGenerating = true;
    // 1) Validaciones previas
    const hasSignature = Object.values(signatureData).some(d => d);
    if (!hasSignature) {
        alert('Por favor, agregue al menos una firma (recepción o entrega) antes de generar el PDF.');
        __pdfGenerating = false; return;
    }
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('Error: jsPDF no está disponible. Verifique la inclusión del script.');
        __pdfGenerating = false; return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const formData = collectFormData();

    const margin = 15;
    let y = margin;

    // Utilidad: pie de página con número de página y fecha
    const addFooter = () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const now = new Date();
        // doc.text(`Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, margin, pageHeight - 8);
        const pageCount = doc.getNumberOfPages();
        doc.text(`Página ${pageCount}`, pageWidth - margin - 20, pageHeight - 8);
    };

    const addWatermark = () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        // Guardar estado actual
        const prevFont = doc.getFont();
        const prevFontSize = doc.getFontSize();
        const prevTextColor = [0, 0, 0];
        // Usar color muy claro y menor tamaño para más transparencia visual
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(40);
        // Dibujar primero para quedar de fondo respecto a contenido posterior
        doc.text('ENTREGADO HIGH TEST', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        // Restaurar estado
        doc.setFont(prevFont.fontName || 'helvetica', prevFont.fontStyle || 'normal');
        doc.setFontSize(prevFontSize);
        doc.setTextColor(...prevTextColor);
    };

    const maybeAddPage = (limit = 265) => {
        if (y > limit) {
            addFooter();
            doc.addPage();
            addWatermark();
            y = margin;
        }
    };

  // Título primero (arriba)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RECEPCIÓN Y ENTREGA', 105, y, { align: 'center' });
    doc.text('DE ITEMS', 105, y += 6 || 0, { align: 'center' });
    y = 6;

    // Logotipo y datos (abajo cerca de la línea)
    try { const logo = new Image(); logo.src = 'Logo.png'; doc.addImage(logo, 'PNG', margin, y + 4, 28, 22); } catch (_) {}
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('CÓDIGO: FR-7.4.1', 210 - margin, y + 16, { align: 'right' });
    doc.text('VERSIÓN: 01', 210 - margin, y + 19, { align: 'right' });
    doc.text('FECHA: 2025-07-07', 210 - margin, y + 22, { align: 'right' });
    y += 26; doc.setLineWidth(0.5); doc.line(margin, y, 210 - margin, y); y += 6;

    // Marca de agua en la primera página
    addWatermark();

    // Información General (dos columnas)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN GENERAL', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const col1X = margin;
    const col2X = 110;
    const lineGap = 6;
    doc.text(`Nº de Recepción: ${formData.cotizacion || '-'}`, col1X, y);
    doc.text(`Cliente: ${formData.cliente || '-'}`, col2X, y);
    y += lineGap;
    doc.text(`Fecha Recepción: ${formData.fechaRecepcion || '-'}`, col1X, y);
    doc.text(`NIT / CC: ${formData.nitEmpresa || '-'}`, col2X, y);
    y += lineGap;
    doc.text(`Fecha Entrega: ${formData.fechaEntrega || '-'}`, col1X, y);
    doc.text(`Nº de Remisión: ${formData.facturar || '-'}`, col2X, y);
    y += lineGap;
    doc.text(`Informe a Nombre de: ${formData.informeNombre || '-'}`, col1X, y);
    doc.text(`Facturar a Nombre de: ${formData.facturarNombre || '-'}`, col2X, y);
    y += 8;

    // Resumen de elementos y estado
    const totalRecep = formData.items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0);
    const totalEnt = formData.items.reduce((s, it) => s + (parseInt(it.quantity2) || 0), 0);
    let estado = 'Pendiente';
    if (totalRecep === 0) estado = 'Pendiente';
    else if (totalEnt === 0) estado = 'En Proceso';
    else if (totalRecep === totalEnt) estado = 'Completo';
    else estado = 'Parcial';

    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Recepción: ${totalRecep}`, margin + 25, y);
    doc.text(`Total Entrega: ${totalEnt}`, margin + 80, y);
    doc.text(`Estado: ${estado}`, margin + 140, y);
    y += 10;

    // Sección de tablas por tipo
    const acc = formData.items.filter(i => i.type === 'Ensayos Alcance');
    const noAcc = formData.items.filter(i => i.type === 'Ensayos No Acreditados');

    function drawTable(title, items) {
        if (!items || items.length === 0) return;
        maybeAddPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(title, margin, y);
        y += 6;
        // Encabezado (multilínea, centrado horizontal y vertical)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        // Definición de columnas: suma total 195
        const headerDefs = [
            { key: 'elemento', label: 'Elemento', w: 70, align: 'left' },
            { key: 'cant_recibida', label: 'Cant.\nRecibida', w: 18, align: 'center' },
            { key: 'cant_entregada', label: 'Cant.\nEntregada', w: 18, align: 'center' },
            { key: 'marcas', label: 'Marcas', w: 22, align: 'left' },
            { key: 'no_usado', label: 'No Usado', w: 15, align: 'center' },
            { key: 'usado', label: 'Usado', w: 15, align: 'center' },
            { key: 'lavados', label: 'Lavados', w: 12, align: 'center' },
            { key: 'observaciones', label: 'Observaciones', w: 25, align: 'center' }
        ];
        // Calcular líneas y altura del header
        let colX = margin;
        const lineHeight = 3;
        const headerLines = headerDefs.map(def => {
            const available = Math.max(def.w - 2, 6);
            const lines = doc.splitTextToSize(def.label, available);
            return Array.isArray(lines) ? lines : [def.label];
        });
        const lineHeights = headerLines.map(ls => ls.length);
    const headerHeight = Math.max(...lineHeights) * lineHeight + 4; // menos padding
        // Fondo del encabezado
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 195, headerHeight, 'F');
        // Dibujar cada columna
        const cols = headerDefs.map((def, i) => {
            const c = { x: colX, w: def.w, label: def.label, align: def.align };
            const lines = headerLines[i];
            // Centramos verticalmente dentro del headerHeight
            const contentH = lines.length * lineHeight;
            const startY = y + (headerHeight - contentH) / 2 + 1;
            lines.forEach((ln, idx) => {
                const tx = def.align === 'left' ? c.x + 2 : c.x + c.w / 2; // 'Elemento' a la izquierda
                const ty = startY + idx * lineHeight + 1;
                doc.text(ln, tx, ty, { align: def.align === 'left' ? 'left' : 'center' });
            });
            colX += def.w;
            return c;
        });
        y += headerHeight + 2;

        doc.setFontSize(9);
        items.forEach((it, idx) => {
            maybeAddPage(270);
            if (idx % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(margin, y - 3, 195, 7, 'F');
            }
            // Elemento (descripción)
            const maxDescWidth = cols[0].w - 4;
            const desc = it.name || '';
            const split = doc.splitTextToSize(desc, maxDescWidth);
            const line = Array.isArray(split) ? split[0] : desc;
            doc.text(line, cols[0].x + 2, y);

            // Formateo de cantidades: '-' cuando esté vacío o sea 0
            const fmt = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '-' : String(v));
            const centerText = (c, val) => doc.text(fmt(val), c.x + c.w / 2, y, { align: 'center' });
            // Recibida
            centerText(cols[1], it.quantity);
            // Entregada
            centerText(cols[2], it.quantity2);
            // Marcas (texto)
            const marcasText = (function(b){ if (!b) return '-'; if (Array.isArray(b)) return b.map(x => `${x.brand || ''} x${x.count || 0}`).join(', '); return String(b || '-'); })(it.brandSummary || it.marcas || it.brandDistribution);
            const marcasLines = doc.splitTextToSize(marcasText, cols[3].w - 4);
            doc.text(marcasLines, cols[3].x + 2, y);
            // No usado, Usado, Lavados
            centerText(cols[4], it.quantity3);
            centerText(cols[5], it.quantity4);
            centerText(cols[6], it.status);

            // Observaciones (una línea al final)
            const obsColIndex = headerDefs.findIndex(d=>d.key==='observaciones');
            const obsCol = cols[obsColIndex];
            const maxObsWidth = obsCol.w - 4;
            const obsText = (it.observaciones || '').toString();
            const obsSplit = doc.splitTextToSize(obsText, maxObsWidth);
            const obsLine = Array.isArray(obsSplit) ? obsSplit[0] : obsText;
            doc.text(obsLine || '-', obsCol.x + 2, y);
            y += 7;
        });
        y += 4;
    }

    // Títulos sin emojis para evitar caracteres extraños en el PDF
    drawTable('ENSAYOS ALCANCE', acc);
    drawTable('ENSAYOS NO ACREDITADOS', noAcc);


    // Lavado (al final)
    const totalLavados = calcularTotalElementosLavados();
    maybeAddPage(258);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Lavados', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lavadoValor = formData.lavado || (document.querySelector('input[name="lavado"]:checked')?.value || '-');
    doc.text(`Lavado: ${lavadoValor || '-'}`, margin, y);
    doc.text(`Cantidad de Lavados: ${totalLavados}`, margin + 70, y);
    y += 10;

    // Observaciones generales
    if (formData.observaciones) {
        maybeAddPage(250);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Observaciones Generales', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const obsLines = doc.splitTextToSize(formData.observaciones, 195);
        doc.text(obsLines, margin, y);
        y += obsLines.length * 5 + 2;
    }

    

    // Firmas
    maybeAddPage(220);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Representantes (CLIENTE)', margin, y);
    y += 8;

    const sigRec = signatureData?.['signatureCanvasRecepcion'];
    const sigEnt = signatureData?.['signatureCanvasEntrega'];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    // Etiquetas
    doc.text('Cliente (Recepción)', margin + 2, y + 6);
    doc.text('Cliente (Entrega)', margin + 102, y + 6);
    // Firmas sin recuadro
    if (sigRec) doc.addImage(sigRec, 'PNG', margin + 5, y + 10, 70, 25);
    if (sigEnt) doc.addImage(sigEnt, 'PNG', margin + 105, y + 10, 70, 25);
    // Línea para firma
    doc.line(margin + 5, y + 38, margin + 75, y + 38);
    doc.line(margin + 105, y + 38, margin + 175, y + 38);
    // Datos del cliente: misma fila (Nombre | Cédula) y otra fila (Cargo | Hora)
    doc.setFontSize(9);
    const recepX = margin + 2;
    const entreX = margin + 102;
    const baseY = y + 44;
    doc.text(`Nombre: ${formData.clienteRecepcionNombre || '-'}` + '   ' + `Cédula: ${formData.clienteRecepcionCedula || '-'}`, recepX, baseY);
    doc.text(`Cargo: ${formData.clienteRecepcionCargo || '-'}`, recepX, baseY + 5);
    doc.text(`Nombre: ${formData.clienteEntregaNombre || '-'}` + '   ' + `Cédula: ${formData.clienteEntregaCedula || '-'}`, entreX, baseY);
    doc.text(`Cargo: ${formData.clienteEntregaCargo || '-'}`, entreX, baseY + 5);
    y += 58;

    // Representantes HIGH TEST
    maybeAddPage(240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Representantes (HIGH TEST)', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Recepción: ${formData.highTestRecepcionNombre || '-'}  |  ${formData.highTestRecepcionCargo || '-'}`, margin, y);
    y += 5;
    doc.text(`Entrega: ${formData.highTestEntregaNombre || '-'}  |  ${formData.highTestEntregaCargo || '-'}`, margin, y);
    y += 8;

    // Correos de envío
    // maybeAddPage(250);
    // doc.setFont('helvetica', 'bold');
    // doc.setFontSize(12);
    // doc.text('Correos para envío', margin, y);
    // y += 6;
    // doc.setFont('helvetica', 'normal');
    // doc.setFontSize(10);
    // doc.text(`Email Cliente: ${formData.clienteEmail || '-'}`, margin, y);
    // y += 5;
    // doc.text(`Email Empresa: ${formData.empresaEmail || '-'}`, margin, y);
    // y += 5;
    // doc.text(`CC: ${formData.copiaEmail || '-'}`, margin, y);
    // y += 8;

    // Marca de fin del documento
    maybeAddPage(260);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Fin Del Documento', 105, y, { align: 'center' });
    y += 6;

    // Footer en la última página
    addFooter();

    // Guardar
    const now = new Date();
    const safeCot = formData.cotizacion || 'NRO';
    const safeCliente = formData.cliente || 'Cliente';
    const fechaEntrega = formData.fechaEntrega || now.toISOString().split('T')[0];
    const pdfName = `${safeCot}_${fechaEntrega}_${safeCliente}_Entrega.pdf`;
    // Confirmar (reservar) el Nº de Recepción usado
    const quoteEl = document.getElementById('quoteNumber');
    if (quoteEl && quoteEl.value) reserveReceptionNumber(quoteEl.value);
    generatedPDF = doc.output('datauristring');
    try {
        doc.save(pdfName);
        // Marcar borrador como entrega completada cuando exista cotización
        try { updateDraftStatus(formData.cotizacion, 'entrega'); } catch (e) {}
        showNotification('✅ PDF de entrega generado exitosamente', 'success');
        // Refrescar historial de reportes y cambiar a la pestaña
        try { refrescarHistorial(); showReportsTab('historial'); } catch(e){}
    } catch (e) {
        console.error('Error guardando PDF completo:', e);
        showNotification('Error al descargar el PDF. Inténtalo de nuevo.', 'error');
    } finally {
        __pdfGenerating = false;
    }
}

// =======================================================
// PDF SOLO RECEPCIÓN
// =======================================================
function generatePDFRecepcion() {
    if (__pdfGenerating) { showNotification('Generación de PDF en curso, por favor espera...', 'info'); return; }
    __pdfGenerating = true;
    // Debe existir firma de recepción
    const sigRec = signatureData?.['signatureCanvasRecepcion'];
    if (!sigRec) {
        alert('Para el PDF de Recepción, agregue la firma de recepción.');
        __pdfGenerating = false; return;
    }
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('Error: jsPDF no está disponible.');
        __pdfGenerating = false; return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const formData = collectFormData();
    formData.signatureData = signatureData;
    // incrustar JSON de formulario para permitir carga desde el PDF de recepción
    try {
        const json = JSON.stringify(formData);
        doc.setProperties({ FORMData: json });
        doc.setFontSize(0.1);
        doc.setTextColor(255,255,255);
        doc.text(`/*FORMDATA:${json}*/`, 3, 3);
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
    } catch (e) { console.warn('embed JSON in recepcion PDF failed', e); }
    // incrustar los datos completos en el PDF (texto invisible) para que pueda recuperarse al importar
    try {
        const json = JSON.stringify(formData);
        // metadata útil
        doc.setProperties({ FORMData: json });
        // texto oculto sobreimpreso
        doc.setFontSize(0.1);
        doc.setTextColor(255,255,255);
        doc.text(`/*FORMDATA:${json}*/`, 3, 3);
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
    } catch (e) { console.warn('Error embebiendo JSON en PDF completo', e); }
    const margin = 15;
    let y = margin;

    const addFooter = () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const now = new Date();
        // doc.text(`Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, margin, pageHeight - 8);
        const pageCount = doc.getNumberOfPages();
        doc.text(`Página ${pageCount}`, pageWidth - margin - 20, pageHeight - 8);
    };
    const addWatermark = () => {
        // Marca de agua más translúcida, detrás y con texto "Estado: RECEPCION"
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        // Guardar estado actual
        const prevFont = doc.getFont();
        const prevFontSize = doc.getFontSize();
        const prevTextColor = [0, 0, 0];
        // Usar color muy claro y menor tamaño para más transparencia visual
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(40);
        // Dibujar primero para quedar de fondo respecto a contenido posterior
        doc.text('RECEPCION HIGH TEST', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        // Restaurar estado
        doc.setFont(prevFont.fontName || 'helvetica', prevFont.fontStyle || 'normal');
        doc.setFontSize(prevFontSize);
        doc.setTextColor(...prevTextColor);
    };
    const maybeAddPage = (limit = 265) => { if (y > limit) { addFooter(); doc.addPage(); addWatermark(); y = margin; } };

    // Título primero (arriba)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RECEPCIÓN Y ENTREGA', 105, y, { align: 'center' });
    doc.text('DE ITEMS', 105, y += 6 || 0, { align: 'center' });
    y = 6;

    // Logotipo y datos (abajo cerca de la línea)
    try { const logo = new Image(); logo.src = 'Logo.png'; doc.addImage(logo, 'PNG', margin, y + 4, 28, 22); } catch (_) {}
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('CÓDIGO: FR-7.4.1', 210 - margin, y + 16, { align: 'right' });
    doc.text('VERSIÓN: 01', 210 - margin, y + 19, { align: 'right' });
    doc.text('FECHA: 2025-07-07', 210 - margin, y + 22, { align: 'right' });
    y += 26; doc.setLineWidth(0.5); doc.line(margin, y, 210 - margin, y); y += 6;

    
    // Marca de agua en la primera página
    addWatermark();

    // Información General
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('INFORMACIÓN GENERAL', margin, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    const col1X = margin, col2X = 110, lineGap = 6;
    doc.text(`Nº Recepción: ${formData.cotizacion || '-'}`, col1X, y);
    doc.text(`Cliente: ${formData.cliente || '-'}`, col2X, y); y += lineGap;
    doc.text(`Fecha Recepción: ${formData.fechaRecepcion || '-'}`, col1X, y);
    doc.text(`NIT / CC: ${formData.nitEmpresa || '-'}`, col2X, y); y += lineGap;
    doc.text(`Informe a Nombre de: ${formData.informeNombre || '-'}`, col1X, y);
    doc.text(`Facturar a Nombre de: ${formData.facturarNombre || '-'}`, col2X, y); y += 8;

    // Resumen (Recepción Parcial)
    const totalRecep = formData.items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0);
    const totalUsados = formData.items.reduce((s, it) => s + (parseInt(it.quantity4) || 0), 0);
    const totalNoUsados = formData.items.reduce((s, it) => s + (parseInt(it.quantity3) || 0), 0);
    const totalLavados = formData.items.reduce((s, it) => s + (parseInt(it.status) || 0), 0);
    doc.setFont('helvetica', 'bold'); doc.text('RESUMEN', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Recepción: ${totalRecep}`, margin + 25, y);
    doc.text(`Estado: Recepción`, margin + 90, y);
    y += 6;
   

    // Tablas: solo recepción (Elemento, Cant. Recibida, Observaciones)
    const acc = formData.items.filter(i => i.type === 'Ensayos Alcance');
    const noAcc = formData.items.filter(i => i.type === 'Ensayos No Acreditados');
    function drawTableRecep(title, items) {
        if (!items || items.length === 0) return;
        maybeAddPage();
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(title, margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        const headerDefs = [
            { key: 'elemento', label: 'Elemento', w: 78, align: 'left' },
            { key: 'cant_recibida', label: 'Cant.\nRecibida', w: 20, align: 'center' },
            { key: 'usados', label: 'Usados', w: 22, align: 'center' },
            { key: 'no_usados', label: 'No\nusados', w: 20, align: 'center' },
            { key: 'lavados', label: 'Lavados', w: 20, align: 'center' },
            { key: 'observaciones', label: 'Observaciones', w: 31, align: 'right' },
        ];
        const lineHeight = 3;
        const headerLines = headerDefs.map(def => {
            const available = Math.max(def.w - 2, 6);
            const lines = doc.splitTextToSize(def.label, available);
            return Array.isArray(lines) ? lines : [def.label];
        });
        const headerHeight = Math.max(...headerLines.map(ls => ls.length)) * lineHeight + 4;
        doc.setFillColor(240, 240, 240); doc.rect(margin, y, 195, headerHeight, 'F');
        let colX = margin;
        const cols = headerDefs.map((def, i) => {
            const c = { x: colX, w: def.w, align: def.align };
            const lines = headerLines[i];
            const contentH = lines.length * lineHeight;
            const startY = y + (headerHeight - contentH) / 2 + 1;
            lines.forEach((ln, idx) => {
                const tx = def.align === 'left' ? c.x + 2 : c.x + c.w / 2;
                const ty = startY + idx * lineHeight + 1;
                doc.text(ln, tx, ty, { align: def.align === 'left' ? 'left' : 'center' });
            });
            colX += def.w; return c;
        });
        y += headerHeight + 2;
        doc.setFontSize(9);
        items.forEach((it, idx) => {
            maybeAddPage(270);
            if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 3, 195, 7, 'F'); }
            const fmt = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '-' : String(v));
            const desc = (doc.splitTextToSize(it.name || '', cols[0].w - 4)[0]) || '';
            doc.text(desc, cols[0].x + 2, y);
            // Recibida
            doc.text(fmt(it.quantity), cols[1].x + cols[1].w / 2, y, { align: 'center' });
            // Usados (quantity4)
            doc.text(fmt(it.quantity4), cols[2].x + cols[2].w / 2, y, { align: 'center' });
            // No usados (quantity3)
            doc.text(fmt(it.quantity3), cols[3].x + cols[3].w / 2, y, { align: 'center' });
            // Lavados (status)
            doc.text(fmt(it.status), cols[4].x + cols[4].w / 2, y, { align: 'center' });
            // Observaciones
            const obs = (doc.splitTextToSize((it.observaciones || '').toString(), cols[5].w - 4)[0]) || '-';
            doc.text(obs, cols[5].x + 2, y);
            y += 7;
        });
        y += 4;
    }
    drawTableRecep('ENSAYOS ALCANCE', acc);
    drawTableRecep('ENSAYOS NO ACREDITADOS', noAcc);

    // Observaciones generales
    if (formData.observaciones) {
        maybeAddPage(250);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('OBSERVACIONES GENERALES', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const obsLines = doc.splitTextToSize(formData.observaciones, 195);
        doc.text(obsLines, margin, y);
        y += obsLines.length * 5 + 2;
    }

    // Bloque de LAVADO (si aplica)
    const hasLavadoData = (formData.lavado && formData.lavado !== '') || (parseInt(formData.elementosLavados) || 0) > 0 || formData.tipoLavado || formData.fechaLavado || formData.observacionesLavado;
    if (hasLavadoData) {
        maybeAddPage(250);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('LAVADO', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        // En una sola línea: Se realizó lavado + Elementos lavados
        doc.text(`Se realizó lavado: ${formData.lavado || '-'}    Elementos lavados: ${formData.elementosLavados || '-'}`, margin, y); y += 5;

        if (formData.observacionesLavado) {
            const obsLav = doc.splitTextToSize(`Observaciones: ${formData.observacionesLavado}`, 195);
            doc.text(obsLav, margin, y); y += obsLav.length * 5;
        } else {
            y += 2;
        }
        y += 2;
    }

    // Firma única de recepción
    maybeAddPage(220);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('FIRMA / DATOS CLIENTE (RECEPCIÓN)', margin, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Cliente (Recepción)', margin + 2, y + 6);
    if (sigRec) doc.addImage(sigRec, 'PNG', margin + 5, y + 10, 70, 25);
    doc.line(margin + 5, y + 38, margin + 75, y + 38);
    doc.setFontSize(9);
    const baseY = y + 44;
    const nombreText = `Nombre: ${formData.clienteRecepcionNombre || '-'}`;
    const cedulaText = `Cédula: ${formData.clienteRecepcionCedula || '-'}`;
    // Intentar poner Nombre y Cédula en la misma línea, si se excede, envolver nombre en varias líneas
    const maxWidth = 75; // ancho aproximado para la primera columna
    const nombreLines = doc.splitTextToSize(nombreText, maxWidth);
    if (nombreLines.length === 1) {
        // colocamos nombre y cédula en la misma línea
        doc.text(`${nombreLines[0]}   ${cedulaText}`, margin + 2, baseY);
    } else {
        // nombre ocupa varias líneas; mostramos nombre arriba y cédula en la primera línea derecha
        doc.text(nombreLines, margin + 2, baseY);
        doc.text(cedulaText, margin + 2, baseY + (nombreLines.length * 5));
    }
    // Cargo debajo del bloque de nombre/cedula
    const cargoY = baseY + Math.max(1, nombreLines.length) * 5 + 2;
    doc.text(`Cargo: ${formData.clienteRecepcionCargo || '-'}`, margin + 2, cargoY);
    y += 58;

    // Representante HIGH TEST (Recepción)
    maybeAddPage(240);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('REPRESENTANTE HIGH TEST (RECEPCIÓN)', margin, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Recepción: ${formData.highTestRecepcionNombre || '-'}  |  ${formData.highTestRecepcionCargo || '-'}`, margin, y); y += 8;

    // Correos
    // maybeAddPage(250);
    // doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('CORREOS DE ENVÍO', margin, y); y += 6;
    // doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    // doc.text(`Email Cliente: ${formData.clienteEmail || '-'}`, margin, y); y += 5;
    // doc.text(`Email Empresa: ${formData.empresaEmail || '-'}`, margin, y); y += 5;
    // doc.text(`CC: ${formData.copiaEmail || '-'}`, margin, y); y += 8;

    // Marca fin
    maybeAddPage(260);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.text('Fin Del Documento', 105, y, { align: 'center' }); y += 6;
    addFooter();

    // Guardar + reservar consecutivo + guardar borrador
    const now = new Date();
    const safeCliente = formData.cliente || 'Cliente';
    const safeCot = formData.cotizacion || 'NRO';
    const fechaRecepcion = formData.fechaRecepcion || now.toISOString().split('T')[0];
    const pdfName = `${safeCot}_${fechaRecepcion}_${safeCliente}_Recepcion.pdf`;
    const quoteEl = document.getElementById('quoteNumber');
    if (quoteEl && quoteEl.value) commitReceptionNumber(quoteEl.value);
    generatedPDF = doc.output('datauristring');
    try {
        doc.save(pdfName);
        try { saveAsDraft(); } catch (_) {}
        try { updateDraftStatus(formData.cotizacion, 'recepcion'); } catch (_) {}
        showNotification('PDF de Recepción generado', 'success');
        // Refrescar historial de reportes y cambiar a la pestaña
        try { refrescarHistorial(); showReportsTab('historial'); } catch(e){}
    } catch (e) {
        console.error('Error guardando PDF recepción:', e);
        showNotification('Error al descargar el PDF de Recepción.', 'error');
    } finally {
        __pdfGenerating = false;
    }
}

// (Eliminado duplicado de generatePDFRecepcion)

// ===============================
// Gestión de Casos en Progreso
// ===============================
function listOpenCases() {
    // Usamos los borradores existentes como "casos en progreso"
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    // Mantener índice original para poder cargar/actualizar correctamente
    const pending = drafts.map((d, i) => ({ d, originalIndex: i })).filter(obj => !(obj.d.status && obj.d.status === 'entrega'));
    // Mapear a opciones legibles mostrando estado y fecha de recepción
    return pending.map((obj, i) => ({
        idx: i + 1,
        originalIndex: obj.originalIndex,
        label: `${obj.d.cotizacion || '(sin recepción)'} | ${obj.d.cliente || '(sin cliente)'} | ${obj.d.fechaRecepcion || '-'} | ${obj.d.status || 'borrador'}`,
        data: obj.d
    }));
}
function refreshCasesSelect() {
    const sel = document.getElementById('openCasesSelect');
    if (!sel) return;
    sel.innerHTML = '';
    const cases = listOpenCases();
    if (cases.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No hay casos en progreso';
        sel.appendChild(opt);
        return;
    }
    cases.forEach((c, i) => {
        const opt = document.createElement('option');
        // Guardamos el índice original del borrador en el value
        opt.value = (c.originalIndex !== undefined ? c.originalIndex : i).toString();
        opt.textContent = c.label;
        sel.appendChild(opt);
    });
}
function continueSelectedCase() {
    const sel = document.getElementById('openCasesSelect');
    if (!sel || !sel.value) return;
    const idx = parseInt(sel.value, 10);
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    if (drafts[idx]) {
        // Resetear formulario primero (sin confirmación)
        document.getElementById('deliveryForm')?.reset();
        document.getElementById('itemsList') && (document.getElementById('itemsList').innerHTML = '');
        document.getElementById('itemsList2') && (document.getElementById('itemsList2').innerHTML = '');
        const previewSection = document.getElementById('previewSection');
        const previewContent = document.getElementById('previewContent');
        if (previewContent) previewContent.innerHTML = '';
        if (previewSection) previewSection.style.display = 'none';
        try {
            if (typeof savedRowsData !== 'undefined') {
                savedRowsData.ensayos_acreditados = {};
                savedRowsData.ensayos_no_acreditados = {};
            }
            const savedContainer = document.getElementById('savedItemsContainer');
            if (savedContainer) savedContainer.innerHTML = '';
        } catch (e) {}
        // Cargar el caso
        loadFormData(drafts[idx]);
        showNotification('Caso cargado: ' + (drafts[idx].cotizacion || ''), 'success');
    }
}

// Eliminar el borrador seleccionado en el selector (usa el índice real almacenado en value)
function deleteSelectedCase() {
    // Permisos: sólo administrador y director técnico pueden eliminar
    let allowed = false;
    if (typeof hasRole === 'function') {
        allowed = hasRole('administrador') || hasRole('director_tecnico');
    } else {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const rol = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
        allowed = (rol === 'administrador' || rol === 'director_tecnico');
    }
    if (!allowed) {
        try { showNotification('❌ No tiene permisos para eliminar borradores', 'error'); } catch(e){ alert('No tiene permisos para eliminar borradores'); }
        return;
    }

    const sel = document.getElementById('openCasesSelect');
    if (!sel || !sel.value) { showNotification('Seleccione un caso para eliminar', 'warning'); return; }
    const idx = parseInt(sel.value, 10);
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    if (!drafts || typeof drafts[idx] === 'undefined') { showNotification('Caso no encontrado', 'error'); refreshCasesSelect(); return; }
    const target = drafts[idx];
    if (!confirm(`¿Eliminar borrador ${target.cotizacion || '(sin recepción)'} - ${target.cliente || ''}? Esta acción no se puede deshacer.`)) return;
    drafts.splice(idx, 1);
    localStorage.setItem('cmr_drafts', JSON.stringify(drafts));
    showNotification('Borrador eliminado', 'success');
    // Sincronizar con servidor
    try { saveDraftsToServer(drafts); } catch(e) {}
    // Si el caso eliminado era el que estaba en vista, limpiar indicador
    try { const loadedEl = document.getElementById('loadedReceptionNumber'); if (loadedEl && loadedEl.textContent === (target.cotizacion || '')) loadedEl.textContent = '-'; } catch(e){}
    refreshCasesSelect();
}

// Eliminar todos los borradores (confirmación explícita)
// -----------------------------------------------------
function deleteAllCases() {
    // Permisos: sólo administrador y director técnico pueden eliminar todos
    let allowed = false;
    if (typeof hasRole === 'function') {
        allowed = hasRole('administrador') || hasRole('director_tecnico');
    } else {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const rol = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
        allowed = (rol === 'administrador' || rol === 'director_tecnico');
    }
    if (!allowed) {
        try { showNotification('❌ No tiene permisos para eliminar borradores', 'error'); } catch(e){ alert('No tiene permisos para eliminar borradores'); }
        return;
    }

    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    if (!drafts || drafts.length === 0) { showNotification('No hay borradores para eliminar', 'info'); return; }
    if (!confirm(`¿Eliminar ${drafts.length} borrador(es)? Esta acción es irreversible.`)) return;
    localStorage.removeItem('cmr_drafts');
    try { saveDraftsToServer([]); } catch(e) {}
    showNotification('Todos los borradores eliminados', 'success');
    try { const loadedEl = document.getElementById('loadedReceptionNumber'); if (loadedEl) loadedEl.textContent = '-'; } catch(e){}
    refreshCasesSelect();
}

// -----------------------------------------------------
// Cargar casos terminados (solo director/admin)
// -----------------------------------------------------
function loadCompletedCases() {
    // comprueba rol via hasRole o session
    let permitted = false;
    if (typeof hasRole === 'function') {
        permitted = hasRole('administrador') || hasRole('director_tecnico');
    } else {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const role = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
        permitted = (role === 'administrador' || role === 'director_tecnico');
    }
    if (!permitted) {
        try { showNotification('❌ No tiene permiso para ver casos terminados','error'); } catch(e){}
        return;
    }
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const finished = drafts.filter(d => d.status === 'entrega');
    showCompletedModal(finished);
}

function showCompletedModal(cases) {
    const modal = document.getElementById('completedCasesModal');
    if (!modal) return;
    const tbody = modal.querySelector('tbody');
    tbody.innerHTML = '';

    const sorted = cases.sort((a, b) => {
        const na = parseInt(String(a.cotizacion || a.quoteNumber || '0').replace(/\D/g, ''), 10) || 0;
        const nb = parseInt(String(b.cotizacion || b.quoteNumber || '0').replace(/\D/g, ''), 10) || 0;
        return nb - na;
    });

    window._completedCasesData = sorted;

    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:10px; color:#666;">No hay casos terminados</td></tr>';
    } else {
        renderCompletedCasesRows(sorted);
    }
    modal.style.display = 'flex';
}

function renderCompletedCasesRows(cases) {
    const modal = document.getElementById('completedCasesModal');
    if (!modal) return;
    const tbody = modal.querySelector('tbody');
    tbody.innerHTML = '';

    if (cases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:10px; color:#666;">No se encontraron resultados</td></tr>';
        return;
    }

    cases.forEach(c => {
        const num = c.cotizacion || c.quoteNumber || 'N/A';
        const cliente = c.cliente || c.clienteRecepcionNombre || 'N/A';
        const empresa = c.informeNombre || c.empresa || 'N/A';
        const fecha = c.fechaEntrega || c.fechaRecepcion || '-';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${num}</td>
            <td>${cliente}</td>
            <td>${empresa}</td>
            <td>Finalizado</td>
            <td>${fecha}</td>
            <td style="text-align:center;">${(c.items && c.items.some(it=>it.images && it.images.length)) ? `<button class='btn btn-mini' onclick='viewCaseImages(${JSON.stringify(c)})'>📷</button>` : '-'}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-small" onclick='loadFormData(${JSON.stringify(c)}, false, true)'>👁️ Ver</button>
                <button class="btn btn-small" onclick="deleteCaseByReception('${num}')" style="margin-left:4px;">🗑️ Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterCompletedCases() {
    const search = (document.getElementById('searchCompletedCases')?.value || '').toLowerCase();
    const data = window._completedCasesData || [];
    if (!search) {
        renderCompletedCasesRows(data);
        return;
    }
    const filtered = data.filter(c => {
        const num = (c.cotizacion || c.quoteNumber || '').toLowerCase();
        const cliente = (c.cliente || c.clienteRecepcionNombre || '').toLowerCase();
        const empresa = (c.informeNombre || c.empresa || '').toLowerCase();
        return num.includes(search) || cliente.includes(search) || empresa.includes(search);
    });
    renderCompletedCasesRows(filtered);
}

function closeCompletedModal() {
    const modal = document.getElementById('completedCasesModal');
    if (modal) modal.style.display = 'none';
}

// Genera PDF basándose en datos de un caso sin modificar el formulario actual
function generatePDFFromCase(caseData) {
    try {
        const current = collectFormData();
        loadFormData(caseData);
        // si el caso ya tiene firma de entrega, permitir imprimir completo
        generatePDF();
        // restaurar datos anteriores
        setTimeout(() => { loadFormData(current); }, 500);
    } catch (e) {
        console.error('Error imprimiendo caso:', e);
        try { showNotification('❌ No se pudo generar el PDF del caso', 'error'); } catch(e){}
    }
}

// mostrar/ocultar botón según rol al iniciar
// se añade a DOMContentLoaded más abajo identificando estado

// ===============================
// Export / Import / Sincronización de Casos en Progreso
// ===============================

// URL del servidor para sincronizar borradores (puede guardarse en localStorage)
const DRAFTS_SERVER_URL = localStorage.getItem('drafts_server_url') || 'http://localhost:3001';

function exportDrafts() {
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const data = { drafts, exportDate: new Date().toISOString(), appName: 'Recepción de Items - High Test' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `casos-en-progreso-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    try { showNotification('📥 Casos en progreso exportados correctamente', 'success'); } catch(e){}
}

function importDrafts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            let incoming = [];
            if (Array.isArray(data)) incoming = data;
            else if (Array.isArray(data.drafts)) incoming = data.drafts;
            else if (Array.isArray(data.casoscargando)) incoming = data.casoscargando; // fallback

            if (!Array.isArray(incoming)) {
                try { showNotification('❌ Archivo inválido: no contiene array de borradores', 'error'); } catch(e){}
                return;
            }

            const actionReplace = confirm(`Se encontraron ${incoming.length} borrador(es).\n\n¿Deseas REEMPLAZAR los borradores locales? (OK = reemplazar, Cancelar = fusionar)`);

            let drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
            if (actionReplace) {
                drafts = incoming;
            } else {
                // Fusionar evitando duplicados por cotización
                const existMap = {};
                drafts.forEach(d => { if (d && d.cotizacion) existMap[String(d.cotizacion)] = true; });
                incoming.forEach(d => {
                    if (d && d.cotizacion) {
                        if (!existMap[String(d.cotizacion)]) {
                            drafts.push(d);
                            existMap[String(d.cotizacion)] = true;
                        }
                    } else {
                        // Si no tiene cotización, evitar duplicados por JSON string
                        const key = JSON.stringify(d);
                        const already = drafts.some(x => JSON.stringify(x) === key);
                        if (!already) drafts.push(d);
                    }
                });
            }

            localStorage.setItem('cmr_drafts', JSON.stringify(drafts));

            // Intentar guardar en servidor también
            try { await saveDraftsToServer(drafts); } catch(e) { console.log('Guardado de borradores sólo local (saveDraftsToServer falló)', e); }

            try { showNotification(`✅ ${actionReplace ? 'Reemplazados' : 'Fusionados'} ${drafts.length} borrador(es)`, 'success'); } catch(e){}
            try { refreshCasesSelect(); } catch(e){}
        } catch (err) {
            try { showNotification('❌ Error al leer archivo: ' + (err.message || err), 'error'); } catch(e){}
        }
    };
    input.click();
}

// ----------------------
// Cargar formulario desde un PDF generado por el sistema
// ----------------------

// Helper: determina si el usuario es administrador o director técnico
function isAdminOrDirector() {
    if (typeof hasRole === 'function') {
        return hasRole('administrador') || hasRole('director_tecnico');
    }
    const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
    const rol = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
    return (rol === 'administrador' || rol === 'director_tecnico');
}

async function importFromPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
        alert('La librería pdf.js no está cargada.');
        return;
    }

    try {
        const array = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: array }).promise;

        let formJson = null;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const text = content.items.map(i => i.str).join('');

            const match = text.match(/\/\*FORMDATA:(\{[\s\S]*?\})\*\//);

            if (match) {
                formJson = match[1];
                break;
            }
        }

        if (!formJson) {
            alert('Este PDF no contiene datos recuperables del formulario.');
            return;
        }

        try {
            const data = JSON.parse(formJson);
            loadFormData(data, false);
        } catch (e) {
            console.error('FORMData inválido:', formJson);
            alert('El PDF contiene datos corruptos o incompletos.');
        }
    } catch (err) {
        console.error('Error leyendo PDF:', err);
        alert('No se pudo leer el PDF seleccionado.');
    }
}

// Inicializar input oculto para importar PDF
(function initPdfImport() {
    const existing = document.getElementById('pdfInput');
    if (!existing) {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'pdfInput';
        input.accept = 'application/pdf';
        input.style.display = 'none';
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            input.value = '';
            await importFromPDF(file);
        });
        document.body.appendChild(input);
    }
})();

async function recuperarCaso(numeroProceso) {
    if (!numeroProceso || !numeroProceso.trim()) {
        alert('Ingrese un número de proceso válido (ej: R26 0012)');
        return;
    }
    const num = numeroProceso.trim().toUpperCase();

    // 1. Buscar en drafts (localStorage)
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const caso = drafts.find(d =>
        (d.cotizacion || '').toUpperCase() === num ||
        (d.numero_proceso || '').toUpperCase() === num
    );

    if (caso) {
        console.log('Caso encontrado en drafts');
        loadFormData(caso, false);
        return;
    }

    // 2. Buscar en base de datos (procesos_acreditados)
    try {
        const res = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_proceso', numero_proceso: num })
        });
        const data = await res.json();

        if (!data.ok || !data.proceso) {
            alert('No se encontró el caso "' + num + '" en borradores ni en base de datos.');
            return;
        }

        const proceso = data.proceso;

        // 3. Buscar detalle del proceso
        let detalle = [];
        if (proceso.id) {
            const resDet = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_detalle_proceso', proceso_id: proceso.id })
            });
            const detData = await resDet.json();
            if (detData.ok) detalle = detData.detalle || [];
        }

        // 4. Reconstruir objeto de formulario
        const form = {
            cotizacion: proceso.numero_proceso || num,
            cliente: proceso.cliente || '',
            status: (proceso.estado || 'recepcion').toLowerCase(),
            fechaRecepcion: proceso.fecha_recepcion || '',
            fechaEntrega: proceso.fecha_entrega_cliente || '',
            informeNombre: proceso.informe_a_nombre_de || '',
            facturarNombre: proceso.facturar_a_nombre_de || '',
            items: (detalle || []).map(d => ({
                id: d.ensayo_id,
                quantity: d.cantidad,
                brand: d.marca,
                observations: d.observaciones
            }))
        };

        // 5. Cargar formulario
        loadFormData(form, false);

    } catch (error) {
        console.error('Error recuperando caso:', error);
        alert('Error al recuperar el caso. Ver consola para más detalles.');
    }
}

// Mostrar todas las fotos de un caso en modal
function viewCaseImages(caseData) {
    const container = document.getElementById('photosContainer');
    if (!container) return;
    container.innerHTML = '';
    if (caseData.items && Array.isArray(caseData.items)) {
        caseData.items.forEach((item, idx) => {
            if (item.images && item.images.length) {
                const titulo = document.createElement('div');
                titulo.textContent = item.name || `Ítem ${idx+1}`;
                titulo.style.fontWeight = 'bold';
                titulo.style.marginTop = '10px';
                container.appendChild(titulo);
                item.images.forEach((src, idx) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.style.maxWidth = '120px';
                    img.style.maxHeight = '90px';
                    img.style.margin = '4px';
                    img.style.border = '1px solid #ccc';
                    img.style.cursor = 'pointer';
                    img.addEventListener('click', () => openImageViewer(item.images, idx));
                    container.appendChild(img);
                });
            }
        });
    }
    const modal = document.getElementById('photosModal');
    if (modal) modal.style.display = 'flex';
}

function closePhotosModal() {
    const modal = document.getElementById('photosModal');
    if (modal) modal.style.display = 'none';
}

// Visor de imágenes independiente
let currentImageList = [];
let currentImageIndex = 0;
function openImageViewer(list, startIndex = 0) {
    currentImageList = list || [];
    currentImageIndex = startIndex;
    const imgEl = document.getElementById('imageViewerImg');
    if (imgEl && currentImageList.length) {
        imgEl.src = currentImageList[currentImageIndex];
    }
    const modal = document.getElementById('imageViewerModal');
    if (modal) modal.style.display = 'flex';
}
function closeImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    if (modal) modal.style.display = 'none';
}
function prevImage() {
    if (currentImageList.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length;
    document.getElementById('imageViewerImg').src = currentImageList[currentImageIndex];
}
function nextImage() {
    if (currentImageList.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % currentImageList.length;
    document.getElementById('imageViewerImg').src = currentImageList[currentImageIndex];
}

async function loadDraftsFromServer() {
    try {
        const userEmail = getCurrentUserEmail() || 'shared';
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_borradores', usuario_email: userEmail })
        });
        if (!resp.ok) throw new Error('Error al conectar con servidor');
        const result = await resp.json();
        if (result && result.ok && Array.isArray(result.data)) {
            localStorage.setItem('cmr_drafts', JSON.stringify(result.data));
            try { refreshCasesSelect(); } catch(e){}
            try { showNotification('🔄 Borradores cargados desde servidor', 'info'); } catch(e){}
            return result.data;
        }
    } catch (error) {
        console.warn('⚠️ No se pudo cargar borradores desde servidor:', error.message || error);
    }
    return JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
}

async function saveDraftsToServer(drafts) {
    try {
        const userEmail = getCurrentUserEmail() || 'shared';
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_borradores', usuario_email: userEmail, drafts })
        });
        if (!resp.ok) throw new Error('Error al guardar en servidor');
        const res = await resp.json();
        if (res && res.ok) {
            console.log('✅ Borradores guardados en servidor');
            return true;
        }
    } catch (err) {
        console.warn('⚠️ No se pudo guardar borradores en servidor:', err.message || err);
    }
    return false;
}

async function deleteBorradorFromServer(cotizacion) {
    try {
        const userEmail = getCurrentUserEmail() || 'shared';
        await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_borrador', usuario_email: userEmail, cotizacion })
        });
    } catch (err) {
        console.warn('⚠️ No se pudo eliminar borrador del servidor:', err.message || err);
    }
}

function getCurrentUserEmail() {
    try {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        if (session && session.user && session.user.email) return session.user.email;
        if (session && session.email) return session.email;
        if (session && session.user) return session.user;
        return null;
    } catch (e) { return null; }
}

// Auto-sync para borradores
let syncDraftsIntervalId = null;
let lastDraftsSyncHash = '';

async function autoSyncDrafts() {
    try {
        const userEmail = getCurrentUserEmail() || 'shared';
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_borradores', usuario_email: userEmail })
        });
        if (!resp.ok) return;
        const result = await resp.json();
        if (result && result.ok && Array.isArray(result.data)) {
            const serverHash = JSON.stringify(result.data.sort());
            const local = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
            const localHash = JSON.stringify(local.sort());
            if (serverHash !== localHash && serverHash !== lastDraftsSyncHash) {
                localStorage.setItem('cmr_drafts', JSON.stringify(result.data));
                lastDraftsSyncHash = serverHash;
                try { refreshCasesSelect(); } catch(e){}
                try { showNotification('🔄 Casos en progreso actualizados desde servidor', 'info'); } catch(e){}
            }
        }
    } catch (e) {
        console.log('📱 Polling drafts offline o sin conexión a servidor');
    }
}

function startAutoSyncDrafts() {
    if (syncDraftsIntervalId) return;
    // Intentar sincronizar inmediatamente
    autoSyncDrafts();
    syncDraftsIntervalId = setInterval(() => { autoSyncDrafts(); }, 5000);
    try { const btn = document.getElementById('btnSyncDrafts'); if (btn) btn.classList.add('active'); } catch(e){}
}

function stopAutoSyncDrafts() {
    if (syncDraftsIntervalId) { clearInterval(syncDraftsIntervalId); syncDraftsIntervalId = null; }
    try { const btn = document.getElementById('btnSyncDrafts'); if (btn) btn.classList.remove('active'); } catch(e){}
}

function toggleAutoSyncDrafts() {
    if (syncDraftsIntervalId) { stopAutoSyncDrafts(); try { showNotification('⏹️ Sincronización de borradores detenida', 'info'); } catch(e){} }
    else { startAutoSyncDrafts(); try { showNotification('🔄 Sincronización de borradores iniciada', 'info'); } catch(e){} }
}

async function syncDraftsNow() {
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    try {
        await saveDraftsToServer(drafts);
        await loadDraftsFromServer();
        try { showNotification('✅ Sincronización completa', 'success'); } catch(e){}
    } catch (e) {
        try { showNotification('❌ Error sincronizando: ' + (e.message || e), 'error'); } catch(e){}
    }
}
function newForm() {
    // Reinicia todo el formulario inmediatamente sin guardar borrador
    resetForm();
}

// Poblar el selector al cargar
// también habilitar botón "Casos Terminados" según rol
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar borradores desde servidor al iniciar (esperar antes de refrescar select)
    try { await loadDraftsFromServer(); } catch(e) { console.log('Error loading drafts from server', e); }
    setTimeout(refreshCasesSelect, 100);
    try {
        if ((typeof hasRole === 'function' && (hasRole('administrador') || hasRole('director_tecnico'))) ||
            (function(){
                const session = JSON.parse(localStorage.getItem('hightest_session')||'{}');
                const role = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
                return role==='administrador' || role==='director_tecnico';
            })()) {
            const btn = document.getElementById('btnLoadCompleted');
            if (btn) btn.style.display = 'inline-block';
        }
    } catch(e) {
        console.warn('Error controlando visibilidad de botón casos terminados:', e);
    }

    // mostrar siempre el icono de eliminación, pero deshabilitar según permisos
    try {
        const canDelete = canManageCases();
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.style.display = '';
            btn.disabled = !canDelete;
            if (!canDelete) {
                btn.title = 'No tiene permisos para eliminar casos';
            } else {
                btn.title = 'Eliminar caso';
            }
        });
    } catch(e) {
        console.warn('Error ajustando estado de botones de borrar:', e);
    }
});

// =======================================================
// FUNCIONES DE CORREO ELECTRÓNICO
// =======================================================

/**
 * Envía un correo electrónico con el PDF generado (simulado o a través de EmailJS en producción).
 * Solicita el correo electrónico del cliente si no se ha proporcionado.
 */
function sendEmailAdvanced() {
    const formData = collectFormData();

    if (!formData.clienteEmail) {
        alert('Por favor, ingrese el email del cliente.');
        return;
    }

    // Verifica si hay al menos una firma
    const hasSignature = Object.values(signatureData).some(data => data !== null && data !== undefined);
    if (!hasSignature) {
        alert('Por favor, agregue al menos una firma digital antes de enviar.');
        return;
    }

    // Genera el PDF si no ha sido generado todavía
    if (!generatedPDF) {
        generatePDF();
    }

    // Prepara los datos para el correo electrónico (para EmailJS o mailto)
    const emailData = {
        to_email: formData.clienteEmail,
        cc_email: formData.copiaEmail,
        cliente_name: formData.cliente,
        cotizacion: formData.cotizacion,
        fecha_entrega: formData.fechaEntrega,
        empresa_email: formData.empresaEmail,
        pdf_attachment: generatedPDF, // Esto se enviaría vía EmailJS, no con mailto
        items_count: formData.items.length,
        observaciones: formData.observaciones || 'Sin observaciones adicionales'
    };

    // Simula el envío del correo electrónico (para demostración)
    simulateEmailSend(emailData);
}

/**
 * Envía por email la versión de Recepción: genera el PDF de Recepción y abre el cliente de correo.
 * No adjunta automáticamente el PDF cuando se usa mailto.
 */
function sendEmailRecepcion() {
    const formData = collectFormData();

    if (!formData.clienteEmail) {
        alert('Por favor, ingrese el email del cliente.');
        return;
    }

    const sigRec = signatureData?.['signatureCanvasRecepcion'];
    if (!sigRec) {
        alert('Para enviar la Recepción, agregue la firma de recepción.');
        return;
    }

    // Forzamos generar el PDF de Recepción para asegurar que generatedPDF corresponda a esta variante
    generatePDFRecepcion();

    const subject = `Constancia de Recepción - Nº ${formData.cotizacion || ''}`.trim();
    const body = (
        `Estimado/a ${formData.cliente || ''},\n\n` +
        `Adjunto encontrará la constancia de recepción de ítems correspondiente al Nº ${formData.cotizacion || ''}.\n\n` +
        `Detalles de la recepción:\n` +
        `- Fecha de recepción: ${formData.fechaRecepcion || '-'}\n` +
        `- Cantidad de ítems registrados: ${formData.items?.length || 0}\n` +
        `- Observaciones: ${formData.observaciones || 'Sin observaciones adicionales'}\n\n` +
        `Por favor, conserve este documento como soporte de la recepción realizada.\n\n` +
        `Saludos cordiales,\n` +
        `Equipo HIGH TEST`
    );

    const emailData = {
        to_email: formData.clienteEmail,
        cc_email: formData.copiaEmail,
        cliente_name: formData.cliente,
        cotizacion: formData.cotizacion,
        fecha_recepcion: formData.fechaRecepcion,
        empresa_email: formData.empresaEmail,
        pdf_attachment: generatedPDF,
        items_count: formData.items.length,
        observaciones: formData.observaciones || 'Sin observaciones adicionales',
        // Overrides específicos para Recepción
        subject,
        body
    };

    simulateEmailSend(emailData);
}

/**
 * Simula el envío de un correo electrónico, ya sea abriendo el cliente de correo del usuario
 * o utilizando EmailJS (si está configurado).
 * @param {object} emailData - Los datos a incluir en el correo electrónico.
 */
function simulateEmailSend(emailData) {
    showNotification('Enviando email...', 'info'); // Muestra una notificación de carga

    // Simula un retardo en el envío
    setTimeout(() => {
        // En un entorno de producción real, usarías EmailJS de esta manera:
        /*
        emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, emailData)
            .then(function(response) {
                showNotification('Email enviado exitosamente', 'success');
            })
            .catch(function(error) {
                showNotification('Error al enviar email: ' + error.text, 'error');
            });
        */

        // Para fines de demostración, abre el cliente de correo del usuario
        // Permite overrides de asunto/cuerpo si vienen definidos (p.ej., Recepción)
        const subject = emailData.subject || `Constancia de Entrega - Cotización ${emailData.cotizacion}`;
        const body = emailData.body || (
            `Estimado/a ${emailData.cliente_name},\n\n` +
            `Adjunto encontrará la constancia de entrega de los artículos correspondientes a la cotización ${emailData.cotizacion}.\n\n` +
            `Detalles de la entrega:\n` +
            `- Fecha de entrega: ${emailData.fecha_entrega}\n` +
            `- Cantidad de artículos: ${emailData.items_count}\n` +
            `- Observaciones: ${emailData.observaciones}\n\n` +
            `Por favor, conserve este documento como constancia de la entrega realizada.\n\n` +
            `Saludos cordiales,\n` +
            `Equipo HIGH TEST`
        );

        // El uso de 'mailto:' NO adjuntará el PDF automáticamente. El usuario tendría que adjuntarlo manualmente.
        window.location.href = `mailto:${emailData.to_email}?cc=${emailData.cc_email || ''}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showNotification('Cliente de correo abierto. Adjunte el PDF generado manualmente.', 'info'); // Cambiado a 'info' porque el PDF no se adjunta automáticamente
    }, 2000); // Retardo de 2 segundos
}

/**
 * Función simple para enviar un correo electrónico que abre el cliente de correo predeterminado del usuario.
 * NO adjunta el PDF automáticamente.
 */
function sendEmail() {
    const formData = collectFormData();
    const subject = `Constancia de Entrega - ${formData.cotizacion}`;
    const body = `Estimado/a ${formData.cliente},\n\n` +
        `Adjunto encontrará la constancia de entrega de los artículos correspondientes a la cotización ${formData.cotizacion}.\n\n` +
        `Fecha de recepción: ${formData.fechaRecepcion}\n` +
        `Fecha de entrega: ${formData.fechaEntrega}\n\n` +
        `Saludos cordiales,\n` +
        `HIGH TEST`;

    // Abre el cliente de correo
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    alert('Se ha abierto su cliente de correo. Para enviar el PDF, genérelo primero y adjúntelo manualmente al correo.');
}

// Abre redacción en Gmail u Outlook (según preferencia del usuario) para Recepción, sin generar/descargar PDF
function openComposeRecepcion(forcedEmail) {
    const formData = collectFormData();
    if (forcedEmail) formData.clienteEmail = forcedEmail;
    if (!formData.clienteEmail) { alert('Por favor, ingrese el email del cliente.'); return; }
    const subject = `Constancia de Recepción - Nº ${formData.cotizacion || ''}`.trim();
    const body = (
        `Estimado/a ${formData.cliente || ''},\n\n` +
        `Le compartimos la constancia de recepción correspondiente al Nº ${formData.cotizacion || ''}.\n\n` +
        `Detalles:\n` +
        `- Fecha de recepción: ${formData.fechaRecepcion || '-'}\n` +
        `- Cliente: ${formData.cliente || '-'}\n\n` +

        `Para observar todos los datos, descargue el archivo adjunto\n\n` +
        `Por favor, conserve este documento como soporte de la recepción realizada.\n\n` +

        `Saludos,\n` +
        `HIGH TEST SAS`
    );
    openWebMail(formData.clienteEmail, formData.copiaEmail, subject, body);
}

// Abre redacción en Gmail u Outlook (según preferencia del usuario) para el envío general, sin generar/descargar PDF
function openComposeGeneral() {
    const formData = collectFormData();
    if (!formData.clienteEmail) {
        alert('Por favor, ingrese el email del cliente.');
        return;
    }
    const subject = `Información del Proceso - Nº ${formData.cotizacion || ''}`.trim();
    const body = (
        `Estimado/a ${formData.cliente || ''},\n\n` +
        `Le compartimos la información general del proceso Nº ${formData.cotizacion || ''}.\n\n` +
        `Fechas:\n` +
        `- Recepción: ${formData.fechaRecepcion || '-'}\n` +
        `- Entrega: ${formData.fechaEntrega || '-'}\n\n` +
        `Para observar todos los datos, descargue el archivo adjunto\n\n` +
        `Por favor, conserve este documento como soporte de la entrega realizada.\n\n` +

        `Saludos,\n` +
        `HIGH TEST`
    );
    openWebMail(formData.clienteEmail, formData.copiaEmail, subject, body);
}

// Utilidad: intenta abrir Gmail; si el usuario prefiere Outlook Web, lo abrimos con su esquema
function openWebMail(to, cc, subject, body) {
    // Preferencia simple basada en si el usuario está logueado en Gmail (heurística mínima) o fuerza Outlook si detecta dominion corporativo
    const preferOutlook = /@(outlook|hotmail|live|office|microsoft)\./i.test(to) || /@(outlook|hotmail|live|office|microsoft)\./i.test(cc || '');

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc || '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc || '')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Abrimos en una nueva pestaña; si el navegador bloquea, usamos mailto como fallback
    const targetUrl = preferOutlook ? outlookUrl : gmailUrl;
    const win = window.open(targetUrl, '_blank');
    if (!win) {
        try {
            const mailto = `mailto:${to}?cc=${encodeURIComponent(cc || '')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
            if (typeof showNotification === 'function') showNotification('Se abrió el cliente de correo (fallback). Si usas Gmail/Outlook Web, permite las ventanas emergentes.', 'info');
        } catch (e) {
            console.error('Error abriendo correo:', e);
            if (typeof showNotification === 'function') showNotification('No se pudo abrir el correo. Verifica bloqueadores de ventanas emergentes.', 'error');
            else alert('No se pudo abrir el correo. Verifica bloqueadores de ventanas emergentes.');
        }
    }
}

// Nuevo: Redacción para Entrega Total en Gmail/Outlook
function openComposeEntregaTotal(forcedEmail) {
    const formData = collectFormData();
    if (forcedEmail) formData.clienteEmail = forcedEmail;
    if (!formData.clienteEmail) { alert('Por favor, ingrese el email del cliente.'); return; }
    const subject = `Constancia de Entrega Total - Nº ${formData.cotizacion || ''}`.trim();
    const body = (
        `Estimado/a ${formData.cliente || ''},\n\n` +
        `Le compartimos la constancia de entrega total correspondiente al Nº ${formData.cotizacion || ''}.\n\n` +
        `Fechas:\n` +
        `- Recepción: ${formData.fechaRecepcion || '-'}\n` +
        `- Entrega: ${formData.fechaEntrega || '-'}\n\n` +
        
        `Para observar todos los datos, descargue el archivo adjunto\n\n` +
        `Por favor, conserve este documento como soporte de la entrega realizada.\n\n` +
        `Saludos,\n` +
        `LABORATORIO HIGH TEST SAS`
    );
    openWebMail(formData.clienteEmail, formData.copiaEmail, subject, body);
}

// Nuevo: Enviar por WhatsApp con resumen
function openWhatsApp(forcedNumber) {
    const d = collectFormData();
    // Intentar usar un teléfono si existe en el selector de empresa (data-phone) o pedirlo si falta
    let phone = forcedNumber || '';
    // Sanear: solo dígitos para wa.me
    if (phone) phone = ('' + phone).replace(/\D/g, '');
    try {
        const sel = document.getElementById('empresaSelect');
        if (!phone && sel && sel.selectedOptions && sel.selectedOptions[0]) {
            let fromData = sel.selectedOptions[0].getAttribute('data-phone') || '';
            phone = fromData.replace(/\D/g, '');
        }
    } catch {}

    if (!phone) {
        if (typeof showNotification === 'function') showNotification('Número de WhatsApp vacío o inválido.', 'warning');
        else alert('Número de WhatsApp vacío o inválido.');
        return;
    }

    const resumen = [
        `Hola, un placer saludarte. ${d.cliente || ''},`,
        `Compartimos el archivo del resumen del proceso Nº ${d.cotizacion || ''}.`,
        
        'Saludos,',
        'LABORATORIO HIGH TEST SAS'
    ].join('\n');

    const base = 'https://wa.me/';
    const url = `${base}${phone ? encodeURIComponent(phone) : ''}?text=${encodeURIComponent(resumen)}`;
    const w = window.open(url, '_blank');
    if (!w) {
        try { window.location.href = url; }
        catch (e) {
            console.error('Error abriendo WhatsApp:', e);
            if (typeof showNotification === 'function') showNotification('No se pudo abrir WhatsApp. Permite las ventanas emergentes.', 'error');
            else alert('No se pudo abrir WhatsApp. Permite las ventanas emergentes.');
        }
    }
}
/**
 * Valida discrepancias en cantidades de items
 * @returns {object} { hasDiscrepancies: boolean, discrepancies: array }
 */
function validarDiscrepanciasItems() {
    const discrepancies = [];
    
    if (savedRowsData?.ensayos_acreditados) {
        Object.entries(savedRowsData.ensayos_acreditados).forEach(([idx, row]) => {
            const recibida = parseInt(row.cantidadRecibida) || 0;
            const entregada = parseInt(row.cantidadEntregada) || 0;
            const noUsado = parseInt(row.cantidadNoUsado) || 0;
            const usado = parseInt(row.cantidadUsado) || 0;
            
            // Validar que cantidad entregada <= cantidad recibida
            if (entregada > recibida) {
                discrepancies.push(`⚠️ ${row.elemento}: Entregadas (${entregada}) > Recibidas (${recibida})`);
            }
            
            // Validar que usado + no usado + entregada = recibida
            const total = entregada + noUsado + usado;
            if (total !== recibida) {
                discrepancies.push(`⚠️ ${row.elemento}: Total (${total}) ≠ Recibidas (${recibida})`);
            }
        });
    }
    
    if (savedRowsData?.ensayos_no_acreditados) {
        Object.entries(savedRowsData.ensayos_no_acreditados).forEach(([idx, row]) => {
            const recibida = parseInt(row.cantidadRecibida) || 0;
            const entregada = parseInt(row.cantidadEntregada) || 0;
            
            if (entregada > recibida) {
                discrepancies.push(`⚠️ ${row.elemento}: Entregadas (${entregada}) > Recibidas (${recibida})`);
            }
        });
    }
    
    return {
        hasDiscrepancies: discrepancies.length > 0,
        discrepancies: discrepancies
    };
}

/**
 * Valida que todos los items sean entregados
 */
function validarItemsEntregados() {
            saveSelectedReceptionNumber();
    const noEntregados = [];
    
    if (savedRowsData?.ensayos_acreditados) {
        Object.entries(savedRowsData.ensayos_acreditados).forEach(([idx, row]) => {
            const recibida = parseInt(row.cantidadRecibida) || 0;
            const entregada = parseInt(row.cantidadEntregada) || 0;
            
            if (recibida > 0 && entregada === 0) {
                noEntregados.push(`❌ ${row.elemento}: ${recibida} unidades no entregadas`);
            }
        });
    }
    
    if (savedRowsData?.ensayos_no_acreditados) {
        Object.entries(savedRowsData.ensayos_no_acreditados).forEach(([idx, row]) => {
            const recibida = parseInt(row.cantidadRecibida) || 0;
            const entregada = parseInt(row.cantidadEntregada) || 0;
            
            if (recibida > 0 && entregada === 0) {
                noEntregados.push(`❌ ${row.elemento}: ${recibida} unidades no entregadas`);
            }
        });
    }
    
    return {
        allDelivered: noEntregados.length === 0,
        noEntregados: noEntregados
    };
}

/**
 * Valida que todos los campos obligatorios estén completos antes de generar PDF
 * @returns {object} { isValid: boolean, missingFields: string[] }
 */
function validatePDFRequirements(tipo = 'entrega') {
    const errors = [];
    
    // 1. Validar Información General (común para ambos)
    const quoteNumber = document.getElementById('quoteNumber')?.value?.trim();
    const fechaRecepcion = document.getElementById('fechaRecepcion')?.value?.trim();
    const empresaSelect = document.getElementById('empresaSelect')?.value?.trim();
    
    if (!quoteNumber) errors.push('❌ Nº de Recepción es obligatorio');
    if (!fechaRecepcion) errors.push('❌ Fecha de Recepción es obligatoria');
    if (!empresaSelect) errors.push('❌ Cliente es obligatorio');
    
    // 2. Validar que haya al menos un elemento seleccionado del alcance
    const formData = collectFormData();
    if (!formData.items || formData.items.length === 0) {
        errors.push('❌ Debe seleccionar al menos un elemento del alcance');
    }
    
    // 2.5. Validar discrepancias en cantidades
    const discrepancias = validarDiscrepanciasItems();
    if (discrepancias.hasDiscrepancies) {
        const mensaje = discrepancias.discrepancies.join('\n');
        const confirmar = confirm(`⚠️ Se detectaron discrepancias en cantidades:\n\n${mensaje}\n\n¿Desea continuar de todas formas?`);
        if (!confirmar) {
            return { isValid: false, missingFields: discrepancias.discrepancies };
        }
    }
    
    // 2.6. Validar que todos los items sean entregados si es PDF Completo
    if (tipo === 'completo') {
        const itemsEntrega = validarItemsEntregados();
        if (!itemsEntrega.allDelivered) {
            const mensaje = itemsEntrega.noEntregados.join('\n');
            const confirmar = confirm(`⚠️ Hay items sin entregar:\n\n${mensaje}\n\n¿Desea continuar de todas formas?`);
            if (!confirmar) {
                return { isValid: false, missingFields: itemsEntrega.noEntregados };
            }
        }
    }
    
    // 3. Validar Firmas - al menos una firma debe existir
    const hasSignature = Object.values(signatureData).some(d => d);
    if (!hasSignature) {
        errors.push('❌ Debe agregar al menos una firma (recepción o entrega)');
    }
    
    if (tipo === 'recepcion') {
        // Para PDF de Recepción: validar Recepción y HIGH TEST Recepción
        const clienteRecepcionNombre = document.getElementById('clienteRecepcionNombre')?.value?.trim();
        const clienteRecepcionCedula = document.getElementById('clienteRecepcionCedula')?.value?.trim();
        const clienteRecepcionCargo = document.getElementById('clienteRecepcionCargo')?.value?.trim();
        const consentRecepcion = document.getElementById('consentRecepcion')?.checked;
        
        if (!clienteRecepcionNombre || !clienteRecepcionCedula || !clienteRecepcionCargo) {
            errors.push('❌ Datos incompletos: Nombre, Cédula y Cargo del cliente (Recepción)');
        }
        
        if (!consentRecepcion) {
            errors.push('❌ Debe aceptar el consentimiento de protección de datos personales (Recepción)');
        }
        
        const highTestRecepcionNombre = document.getElementById('highTestRecepcionNombre')?.value?.trim();
        const highTestRecepcionCargo = document.getElementById('highTestRecepcionCargo')?.value?.trim();
        
        if (!highTestRecepcionNombre || !highTestRecepcionCargo) {
            errors.push('❌ Representante HIGH TEST (Recepción): Nombre y Cargo son obligatorios');
        }
    } else {
        // Para PDF de Entrega: validar Entrega, HIGH TEST Entrega y Fecha de Entrega
        const fechaEntrega = document.getElementById('fechaEntrega')?.value?.trim();
        if (!fechaEntrega) {
            errors.push('❌ Fecha de Entrega es obligatoria');
        }
        
        const clienteEntregaNombre = document.getElementById('clienteEntregaNombre')?.value?.trim();
        const clienteEntregaCedula = document.getElementById('clienteEntregaCedula')?.value?.trim();
        const clienteEntregaCargo = document.getElementById('clienteEntregaCargo')?.value?.trim();
        const consentEntrega = document.getElementById('consentEntrega')?.checked;
        
        if (!clienteEntregaNombre || !clienteEntregaCedula || !clienteEntregaCargo) {
            errors.push('❌ Datos incompletos: Nombre, Cédula y Cargo del cliente (Entrega)');
        }
        
        if (!consentEntrega) {
            errors.push('❌ Debe aceptar el consentimiento de protección de datos personales (Entrega)');
        }
        
        const highTestEntregaNombre = document.getElementById('highTestEntregaNombre')?.value?.trim();
        const highTestEntregaCargo = document.getElementById('highTestEntregaCargo')?.value?.trim();
        
        if (!highTestEntregaNombre || !highTestEntregaCargo) {
            errors.push('❌ Representante HIGH TEST (Entrega): Nombre y Cargo son obligatorios');
        }
    }
    
    return {
        isValid: errors.length === 0,
        missingFields: errors
    };
}

// Crea un proceso oficial en el panel de administración con estado RECEPCIÓN
async function crearProcesoEnPanelAdmin() {
    try {
        const numeroProceso = document.getElementById('quoteNumber')?.value;
        const fechaRecepcion = document.getElementById('fechaRecepcion')?.value;
        const selectEmpresa = document.getElementById('empresaSelect');
        let clienteNombre = '';
        if (selectEmpresa && selectEmpresa.selectedIndex > 0) {
            const selectedOption = selectEmpresa.options[selectEmpresa.selectedIndex];
            clienteNombre = selectedOption.getAttribute('data-nombre') || selectedOption.text;
        }

        if (!numeroProceso || !clienteNombre || !fechaRecepcion) {
            console.warn('Datos incompletos para crear proceso en panel');
            return;
        }

        // 1. Eliminar reserva temporal si existe para este número
        try {
            await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_proceso', numero_proceso: numeroProceso })
            });
        } catch (e) {
            console.warn('No se pudo limpiar reserva temporal (puede que no exista):', e);
        }

        // 2. Limpiar bloqueo temporal local (hold) ya que el número ya se usó oficialmente
        try {
            const held = getHeldReceptionNumbers();
            if (held[numeroProceso]) {
                delete held[numeroProceso];
                setHeldReceptionNumbers(held);
            }
        } catch (e) { console.warn('Error limpiando hold:', e); }

        // 3. Crear proceso oficial
        const insertData = {
            numero_proceso: numeroProceso,
            cliente: clienteNombre,
            informe_a_nombre_de: (document.getElementById('informeNombre')?.value || clienteNombre).toUpperCase(),
            facturar_a_nombre_de: (document.getElementById('facturarNombre')?.value || clienteNombre).toUpperCase(),
            estado: 'recepcion',
            fecha_recepcion: fechaRecepcion,
            fecha_entrega_cliente: null,
            fecha_finalizado: null,
            caso_activo: true
        };

        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_proceso', insert: insertData })
        });

        const result = await response.json();

        if (!response.ok) {
            if (result && result.error && result.error.toLowerCase().includes('duplicado')) {
                showNotification('El proceso ya existe en el panel administrativo', 'info');
                return null;
            }
            throw new Error((result && result.error) || 'Error al crear proceso');
        }

        showNotification('Proceso creado oficialmente en el panel con estado RECEPCIÓN', 'success');
        return result.proceso || null;
    } catch (error) {
        console.error('Error creando proceso en panel:', error);
        showNotification('No se pudo crear el proceso en el panel: ' + error.message, 'warning');
        return null;
    }
}

// Actualiza el proceso existente a estado ENTREGA CLIENTE
async function actualizarProcesoAEntrega() {
    try {
        const numeroProceso = document.getElementById('quoteNumber')?.value;
        const fechaEntrega = document.getElementById('fechaEntrega')?.value || new Date().toISOString().split('T')[0];

        if (!numeroProceso) {
            console.warn('Sin número de proceso para actualizar a entrega');
            return;
        }

        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update_proceso_status', 
                    numero_proceso: numeroProceso, 
                    estado: 'entrega-cliente',
                    fecha_entrega_cliente: fechaEntrega
                })
        });

        const result = await response.json();

        if (!response.ok) {
            console.warn('Error actualizando proceso a entrega:', result?.error);
            return;
        }

        showNotification('Proceso actualizado a ENTREGA CLIENTE en el panel', 'success');
    } catch (error) {
        console.error('Error actualizando proceso a entrega:', error);
    }
}

// Guarda cada elemento recibido en detalle_procesos_ac
async function guardarDetalleProceso(procesoId) {
    const detalle = [];

    if (savedRowsData?.ensayos_acreditados) {
        for (const [key, row] of Object.entries(savedRowsData.ensayos_acreditados)) {
            if (!row) continue;
            const index = parseInt(key.replace(/^row_/, ''));
            const ensayo = Array.isArray(predefinedItemsData) ? predefinedItemsData[index] : null;
            const ensayoId = ensayo?.id;
            if (!ensayoId) continue;

            const units = getRowUnits('ensayos_acreditados', index);
            const obs = String(row.observaciones || '').trim();

            if (units && units.length > 0) {
                const brandGroups = {};
                for (const unit of units) {
                    const marca = unit.brand || '';
                    if (!brandGroups[marca]) brandGroups[marca] = 0;
                    brandGroups[marca]++;
                }
                for (const [marca, cantidad] of Object.entries(brandGroups)) {
                    if (cantidad > 0) {
                        detalle.push({
                            proceso_id: procesoId,
                            ensayo_id: ensayoId,
                            ensayo_nombre: ensayo?.nombre || '',
                            cantidad,
                            marca: marca || '',
                            observaciones: obs || ''
                        });
                    }
                }
            } else {
                const cantidad = parseInt(row.cantRecibida) || 0;
                if (cantidad > 0) {
                    detalle.push({
                        proceso_id: procesoId,
                        ensayo_id: ensayoId,
                        ensayo_nombre: ensayo?.nombre || '',
                        cantidad,
                        marca: '',
                        observaciones: obs || ''
                    });
                }
            }
        }
    }

    if (detalle.length === 0) return;

    try {
        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_detalle_proceso', detalle })
        });
        const result = await response.json();
        if (!response.ok) {
            console.warn('Error guardando detalle del proceso:', result?.error);
        }
    } catch (err) {
        console.warn('Error en guardarDetalleProceso:', err);
    }
}

// Abre cliente de correo tras generar PDF de recepción si hay email del cliente
async function pdfRecepcionAction() {
    const validation = validatePDFRequirements('recepcion');
    if (!validation.isValid) {
        const message = '⚠️ No se puede generar el PDF. Campos obligatorios faltantes:\n\n' + validation.missingFields.join('\n');
        alert(message);
        showNotification('⚠️ Complete los campos obligatorios antes de generar el PDF', 'warning');
        return;
    }
    // Solo genera el PDF de Recepción; no abre correo automáticamente
    generatePDFRecepcion();

    // Crear proceso oficial en el panel de administración
    const proceso = await crearProcesoEnPanelAdmin();

    // Guardar borrador completo en servidor (items, cantidades, firmas, etc.)
    await saveAsDraft();

    // Guardar detalle de cada elemento recibido en detalle_procesos_ac
    if (proceso && proceso.id) {
        await guardarDetalleProceso(proceso.id);
    }
}

// Abre cliente de correo tras generar PDF completo si hay email del cliente
async function pdfCompletoAction() {
    // Prevenir generación duplicada de entrega si ya existe un borrador marcado como 'entrega'
    try {
        const cot = document.getElementById('quoteNumber')?.value;
        if (cot) {
            const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
            const existing = drafts.find(d => d.cotizacion && d.cotizacion === cot);
            if (existing && existing.status === 'entrega') {
                alert('La entrega ya fue completada para este Nº de Recepción. No se puede generar otra entrega.');
                showNotification('Entrega ya completada para este caso', 'warning');
                return;
            }
        }
    } catch (e) { /* no bloquear por error en comprobación localStorage */ }
    // asegurar que fecha de entrega quede registrada si el usuario olvidó llenarla
    const fechaEnt = document.getElementById('fechaEntrega');
    if (fechaEnt && !fechaEnt.value) {
        fechaEnt.value = new Date().toISOString().split('T')[0];
    }
    const validation = validatePDFRequirements('entrega');
    if (!validation.isValid) {
        const message = '⚠️ No se puede generar el PDF. Campos obligatorios faltantes:\n\n' + validation.missingFields.join('\n');
        alert(message);
        showNotification('⚠️ Complete los campos obligatorios antes de generar el PDF', 'warning');
        return;
    }
    // Solo genera el PDF Completo; no abre correo automáticamente
    generatePDF();

    // Actualizar proceso existente a ENTREGA CLIENTE
    await actualizarProcesoAEntrega();

    // Guardar borrador final en servidor y marcar como completado
    await saveAsDraft();
    const cot2 = document.getElementById('quoteNumber')?.value;
    if (cot2) {
        try { updateDraftStatus(cot2, 'entrega'); } catch(e) {}
    }
}

// =======================================================
// FUNCIONES DE GESTIÓN DE BORRADORES
// =======================================================

/**
 * Guarda los datos actuales del formulario como un borrador mientras se está diligenciando.
 * Se almacena localmente en el navegador y se puede continuar después.
 * Funciona como guardado automático durante la captura de datos.
 */
async function saveAsDraft() {
    const formData = collectFormData();
    
    // Verificar si el caso ya está completado (tiene estado 'entrega')
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const existingDraft = drafts.find(d => d.cotizacion && d.cotizacion === formData.cotizacion);
    
    if (existingDraft && existingDraft.status === 'entrega') {
        showNotification('❌ Este caso ya está completado y no se puede modificar', 'error');
        return;
    }
    
    // Guarda los datos de las firmas múltiples
    formData.signatureData = signatureData;
    formData.timestamp = new Date().toISOString(); // Añade una marca de tiempo
    formData.status = 'recepcion'; // Marcar como en progreso
    
    // Recupera los borradores existentes o inicializa un array vacío
    const allDrafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');

    // Si existe un borrador con la misma cotización, lo actualizamos en lugar de duplicarlo
    const existingIdx = allDrafts.findIndex(d => d.cotizacion && d.cotizacion === formData.cotizacion);
    if (existingIdx !== -1) {
        // Mantener historial: fusionar timestamp y status
        const existing = allDrafts[existingIdx];
        formData._createdAt = existing._createdAt || existing.timestamp || formData.timestamp;
        allDrafts[existingIdx] = Object.assign({}, existing, formData);
    } else {
        // Nuevo borrador
        formData._createdAt = formData.timestamp;
        allDrafts.push(formData);
    }

    localStorage.setItem('cmr_drafts', JSON.stringify(allDrafts)); // Guarda el array actualizado en el almacenamiento local

    // Sincronizar con servidor (con await para asegurar que se guarde)
    try { await saveDraftsToServer(allDrafts); } catch(e) { console.log('Sync server error', e); }

    // Refrescar selector de casos y notificar al usuario
    setTimeout(refreshCasesSelect, 100);
    showNotification('✅ Borrador guardado - Puedes continuar cuando lo desees', 'success');
}

// Helper: buscar índice de borrador por cotización
function findDraftIndexByCotizacion(cotizacion) {
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    return drafts.findIndex(d => d.cotizacion && d.cotizacion === cotizacion);
}

// Helper: actualizar estado de un borrador (p.ej. 'recepcion' o 'entrega')
function updateDraftStatus(cotizacion, status) {
    if (!cotizacion) return false;
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const idx = drafts.findIndex(d => d.cotizacion && d.cotizacion === cotizacion);
    if (idx === -1) return false;
    
    // Actualizar status y timestamp
    drafts[idx].status = status;
    drafts[idx].timestamp = new Date().toISOString();
    
    if (status === 'recepcion' || status === 'entrega') {
        try {
            const currentFormData = collectFormData();
            if (typeof signatureData === 'object' && signatureData !== null) {
                currentFormData.signatureData = signatureData;
            }
            drafts[idx] = { ...drafts[idx], ...currentFormData, status: status, timestamp: new Date().toISOString() };
        } catch (e) {
            console.log('No hay formulario activo, solo actualizando status');
        }
    }
    
    localStorage.setItem('cmr_drafts', JSON.stringify(drafts));
    try { saveDraftsToServer(drafts); } catch(e) {}
    setTimeout(refreshCasesSelect, 100);
    return true;
}

// ----------------------------------------------------
// Permisos y eliminación desde reportes
// ----------------------------------------------------

/**
 * Determina si el usuario actual puede administrar casos (ver/editar/eliminar).
 * Admin o Director Técnico
 */
function canManageCases() {
    // Si existe helper de roles, úsalo primero
    if (typeof hasRole === 'function') {
        if (hasRole('administrador') || hasRole('director_tecnico')) {
            return true;
        }
    }

    // Fallback por sesión local
    try {
        const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
        const rolRaw = (session && session.user && session.user.rol) ? session.user.rol : session.rol;
        if (!rolRaw) return false;
        const rol = String(rolRaw).trim().toLowerCase().replace(/\s+/g, '_');
        return (rol === 'administrador' || rol === 'director_tecnico');
    } catch (e) {
        console.warn('canManageCases: error leyendo sesión', e);
        return false;
    }
}

/**
 * Elimina un caso identificado por el número de recepción (cotización) de los borradores.
 * Se puede invocar desde los reportes/historial y valida permisos.
 */
function deleteCaseByReception(num) {
    if (!canManageCases()) {
        try { showNotification('❌ No tiene permisos para eliminar casos', 'error'); } catch(e){ alert('No tiene permisos para eliminar casos'); }
        return;
    }
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const idx = drafts.findIndex(d => ((d.cotizacion || d.quoteNumber || '') + '') === (num + ''));
    if (idx === -1) {
        try { showNotification('❌ Caso no encontrado', 'error'); } catch(e){ alert('Caso no encontrado'); }
        return;
    }
    const target = drafts[idx];
    if (!confirm(`¿Eliminar el caso ${num}? Esta acción no se puede deshacer.`)) return;
    drafts.splice(idx, 1);
    localStorage.setItem('cmr_drafts', JSON.stringify(drafts));
    try { saveDraftsToServer(drafts); } catch(e) {}
    invalidarCacheCasos();
    try { showNotification('✅ Caso eliminado', 'success'); } catch(e){}
    refreshCasesSelect();
}


/**
 * Importa un archivo JSON exportado desde Reportes y Análisis.
 * Solo disponible para Administrador y Director Técnico.
 */
function loadDraft() {
    // Validar permisos: solo Admin y Director Técnico
    const getUserRole = () => {
        try {
            return typeof window.currentUser === 'function' ? window.currentUser()?.rol : localStorage.getItem('userRole');
        } catch (e) {
            return localStorage.getItem('userRole');
        }
    };
    
    const userRole = getUserRole();
    if (!userRole) {
        showNotification('❌ Debes estar autenticado para importar formularios', 'error');
        return;
    }
    
    const allowedRoles = ['administrador', 'director_tecnico'];
    if (!allowedRoles.includes(userRole)) {
        showNotification(`❌ Solo ${allowedRoles.join(' y ')} pueden importar formularios`, 'error');
        return;
    }

    // Crear input file para seleccionar JSON
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                
                // Validar que sea un objeto con datos de formulario
                if (!jsonData.cotizacion && !jsonData.case?.cotizacion) {
                    throw new Error('JSON inválido: no contiene datos de formulario');
                }
                
                // Soportar dos formatos:
                // 1. Exportación individual desde reportes: { case: {...}, exportDate: ... }
                // 2. Exportación directa del formulario: { cotizacion: ..., ... }
                const caseData = jsonData.case || jsonData;
                
                // Cargar el formulario SIN fechas
                loadFormData(caseData, true); // true = cargar sin fechas
                showNotification('✅ Caso importado exitosamente - Puedes editarlo', 'success');
                
                // Refrescar tablas/totales
                setTimeout(() => {
                    if (typeof cargarEnsayosAcreditados === 'function') cargarEnsayosAcreditados();
                    if (typeof updateTotals === 'function') updateTotals();
                    if (typeof updateSavedItemsPreview === 'function') updateSavedItemsPreview();
                }, 200);
            } catch (error) {
                showNotification(`❌ Error al importar JSON: ${error.message}`, 'error');
                console.error('Error importando JSON:', error);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * Comprueba si existe un borrador guardado al cargar la página y
 * pregunta al usuario si desea cargarlo.
 */
function loadDraftIfExists() {
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    if (drafts.length > 0) {
        const lastDraft = drafts[drafts.length - 1]; // Obtiene el borrador más reciente
        // Pregunta al usuario si desea cargar el último borrador
        if (confirm(`¿Desea cargar el último borrador guardado?\n\nCliente: ${lastDraft.cliente}\nCotización: ${lastDraft.cotizacion}`)) {
            loadFormData(lastDraft); // Carga los datos del borrador
            showNotification('Último borrador cargado exitosamente', 'success');
        }
    }
}

// =======================================================
// FUNCIONES DE UTILIDAD
// =======================================================

/**
 * Muestra un mensaje de notificación temporal en la pantalla.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de notificación (ej. 'success', 'error', 'info', 'warning').
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        opacity: 0;
        transform: translateX(300px);
        transition: all 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2); /* Sombra para mejor visibilidad */
    `;

    // Define colores para los diferentes tipos de notificación
    const colors = {
        success: '#28a745', // Verde
        error: '#dc3545',   // Rojo
        info: '#007bff',    // Azul
        warning: '#ffc107'  // Amarillo
    };

    notification.style.backgroundColor = colors[type] || colors.info; // Establece el color de fondo
    notification.textContent = message; // Establece el mensaje de texto

    document.body.appendChild(notification); // Añade la notificación al cuerpo del documento

    // Anima la entrada (se desliza desde la derecha)
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Elimina la notificación después de 4 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(300px)';
        // Elimina del DOM después de que la transición de salida se complete
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// =======================================================
// ESCUCHADORES DE EVENTOS
// =======================================================

// Escuchador de eventos para un botón genérico (miBoton)
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("miBoton")?.addEventListener("click", function() {
        // Acción a realizar cuando se hace clic en el botón
        showNotification('Botón "miBoton" clicado.', 'info');
    });
});

// =======================================================
// FUNCIONES PARA LAVADO
// =======================================================

/**
 * Calcula la suma total de elementos lavados de ambas tablas
 * Incluye tanto los valores visibles como los guardados
 */
function calcularTotalElementosLavados() {
    let totalLavados = 0;
    
    // Sumar valores guardados de ensayos alcance
    if (savedRowsData.ensayos_acreditados) {
        Object.values(savedRowsData.ensayos_acreditados).forEach(rowData => {
            if (rowData && rowData.saved && rowData.cantLavados) {
                const cantidad = parseInt(rowData.cantLavados) || 0;
                totalLavados += cantidad;
            }
        });
    }
    
    // Sumar valores guardados de ensayos no acreditados
    if (savedRowsData.ensayos_no_acreditados) {
        Object.values(savedRowsData.ensayos_no_acreditados).forEach(rowData => {
            if (rowData && rowData.saved && rowData.cantLavados) {
                const cantidad = parseInt(rowData.cantLavados) || 0;
                totalLavados += cantidad;
            }
        });
    }
    
    // Buscar en los inputs de lavados de ensayos alcance (itemsList) - solo los no guardados
    const inputsLavadosAcreditados = document.querySelectorAll('#itemsList input[id^="status_"]');
    
    inputsLavadosAcreditados.forEach(input => {
        if (input && input.value && !input.disabled) {
            // Obtener el índice del input para verificar si está guardado
            const match = input.id.match(/status_(\d+)/);
            if (match) {
                const rowIndex = parseInt(match[1]);
                // Solo sumar si no está guardado (para evitar duplicados)
                if (!savedRowsData.ensayos_acreditados[rowIndex] || !savedRowsData.ensayos_acreditados[rowIndex].saved) {
                    const cantidad = parseInt(input.value) || 0;
                    totalLavados += cantidad;
                }
            }
        }
    });
    
    // Buscar en los inputs de lavados de ensayos no acreditados (itemsList2) - solo los no guardados
    const inputsLavadosNoAcreditados = document.querySelectorAll('#itemsList2 input[id^="status2_"]');
    
    inputsLavadosNoAcreditados.forEach(input => {
        if (input && input.value && !input.disabled) {
            // Obtener el índice del input para verificar si está guardado
            const match = input.id.match(/status2_(\d+)/);
            if (match) {
                const rowIndex = parseInt(match[1]);
                // Solo sumar si no está guardado (para evitar duplicados)
                if (!savedRowsData.ensayos_no_acreditados[rowIndex] || !savedRowsData.ensayos_no_acreditados[rowIndex].saved) {
                    const cantidad = parseInt(input.value) || 0;
                    totalLavados += cantidad;
                }
            }
        }
    });
    
    console.log('Total lavados calculado (incluye guardados):', totalLavados);
    return totalLavados;
}

/**
 * Actualiza el campo de cantidad de elementos lavados
 */
function actualizarCantidadLavados() {
    const elementosLavados = document.getElementById('elementosLavados');
    if (elementosLavados) {
        const total = calcularTotalElementosLavados();
        elementosLavados.value = total;

        // Autoseleccionar SI/NO según el total de lavados
        const lavadoSi = document.getElementById('lavadoSi');
        const lavadoNo = document.getElementById('lavadoNo');
        const lavadoFields = document.getElementById('lavadoFields');
        const responsableLavado = document.getElementById('responsableLavado');

        if (lavadoSi && lavadoNo) {
            if (total > 0) {
                lavadoSi.checked = true;
                // Mostrar campos y habilitar responsable
                if (lavadoFields) {
                    lavadoFields.style.display = 'flex';
                    lavadoFields.classList.add('active');
                }
                if (responsableLavado) {
                    responsableLavado.disabled = false;
                }
            } else {
                lavadoNo.checked = true;
                // Ocultar campos y deshabilitar responsable
                if (lavadoFields) {
                    lavadoFields.style.display = 'none';
                    lavadoFields.classList.remove('active');
                }
                if (responsableLavado) {
                    responsableLavado.disabled = true;
                    if (!responsableLavado.value) responsableLavado.value = '-';
                }
            }
        }
    }
}

/**
 * Controla la habilitación/deshabilitación de campos según la selección de lavado
 */
function toggleLavadoFields() {
    const lavadoSi = document.getElementById('lavadoSi');
    const lavadoNo = document.getElementById('lavadoNo');
    const lavadoFields = document.getElementById('lavadoFields');
    const elementosLavados = document.getElementById('elementosLavados');
    const responsableLavado = document.getElementById('responsableLavado');

    // Siempre mantener el campo de cantidad actualizado y de solo lectura
    actualizarCantidadLavados();

    if (lavadoNo && lavadoNo.checked) {
        // Si se selecciona NO: ocultar campos adicionales
        lavadoFields.style.display = 'none';
        lavadoFields.classList.remove('active');
        
        // Limpiar valores
        responsableLavado.value = '-';
        responsableLavado.disabled = true;
        
    } else if (lavadoSi && lavadoSi.checked) {
        // Si se selecciona SÍ: mostrar campos adicionales
        lavadoFields.style.display = 'flex';
        lavadoFields.classList.add('active');
        
        // Habilitar campo de responsable
        responsableLavado.disabled = false;
        responsableLavado.focus(); // Enfocar para facilitar la entrada
        
    } else {
        // Estado por defecto: ocultar campos
        lavadoFields.style.display = 'none';
        lavadoFields.classList.remove('active');
    }
}

// Inicializar el estado de los campos al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Establecer estado inicial
    const lavadoFields = document.getElementById('lavadoFields');
    if (lavadoFields) {
        lavadoFields.classList.add('disabled');
        
        // Configurar campos inicialmente
        const elementosLavados = document.getElementById('elementosLavados');
        const responsableLavado = document.getElementById('responsableLavado');
        
        if (elementosLavados) {
            actualizarCantidadLavados(); // Calcular total inicial
            // El campo siempre es readonly para mostrar cálculo automático
        }
        if (responsableLavado) {
            responsableLavado.disabled = true;
            responsableLavado.value = '-';
        }
        
        // Igualar backgrounds inicialmente
        if (elementosLavados && responsableLavado) {
            elementosLavados.style.backgroundColor = '#f8f9fa';
            responsableLavado.style.backgroundColor = '#f8f9fa';
        }
    }
    
    // Escuchar cambios en los campos de lavados de las tablas para actualizar el total
    document.addEventListener('input', function(e) {
        // Detectar cambios en los inputs de lavados (status_ para acreditados, status2_ para no acreditados)
        if (e.target.matches('#itemsList input[id^="status_"], #itemsList2 input[id^="status2_"]')) {
            actualizarCantidadLavados();
            console.log('Total de lavados actualizado por cambio en input:', e.target.id);
        }
    });
    
    // También escuchar cuando se agregan/eliminan filas o se cargan elementos
    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Si se añadieron o eliminaron elementos en las listas
                if (mutation.target.id === 'itemsList' || mutation.target.id === 'itemsList2') {
                    shouldUpdate = true;
                }
                // También detectar si se añadieron nuevos inputs de lavados
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.querySelector && 
                        node.querySelector('input[id^="status_"]')) {
                        shouldUpdate = true;
                    }
                });
            }
        });
        
        if (shouldUpdate) {
            // Pequeño delay para asegurar que los elementos estén completamente cargados
            setTimeout(actualizarCantidadLavados, 100);
        }
    });
    
    // Observar cambios en las listas de elementos
    const itemsList = document.getElementById('itemsList');
    const itemsList2 = document.getElementById('itemsList2');
    if (itemsList) observer.observe(itemsList, { childList: true, subtree: true });
    if (itemsList2) observer.observe(itemsList2, { childList: true, subtree: true });
});

// =======================================================
// FUNCIONES PARA SELECCIÓN DE NOMBRE DE FACTURACIÓN E INFORME
// =======================================================

/**
 * Controla la selección de la opción de facturación (Mismo Cliente / Otro)
 */
function setFacturarOption(opcion) {
    console.log('setFacturarOption llamada con opción:', opcion);
    
    const btnMismo = document.getElementById('btnFacturarMismoCliente');
    const btnOtro = document.getElementById('btnFacturarOtro');
    const inputFacturar = document.getElementById('facturarNombre');
    
    // Obtener el nombre del cliente desde el selector
    let nombreEmpresa = '';
    const selectEmpresa = document.getElementById('empresaSelect');
    
    if (selectEmpresa && selectEmpresa.selectedIndex > 0) {
        const selectedOption = selectEmpresa.options[selectEmpresa.selectedIndex];
        nombreEmpresa = selectedOption.getAttribute('data-nombre') || selectedOption.text;
    }
    
    console.log('Elementos encontrados:', {btnMismo, btnOtro, inputFacturar, nombreEmpresa});
    
    if (!btnMismo || !btnOtro || !inputFacturar) {
        console.error('No se encontraron todos los elementos necesarios');
        return;
    }
    
    // Actualizar estado visual de los botones
    btnMismo.classList.remove('active');
    btnOtro.classList.remove('active');
    
    if (opcion === 'mismo') {
        btnMismo.classList.add('active');
        // Usar el mismo cliente seleccionado
        inputFacturar.value = nombreEmpresa.toUpperCase();
        inputFacturar.readOnly = true;
        inputFacturar.placeholder = 'Se usará el nombre del cliente seleccionado';
    } else {
        btnOtro.classList.add('active');
        // Permitir entrada manual
        inputFacturar.value = '';
        inputFacturar.readOnly = false;
        inputFacturar.placeholder = 'Escriba el nombre para facturación';
        inputFacturar.focus();
        inputFacturar.oninput = function() { this.value = this.value.toUpperCase(); };
    }
}

/**
 * Controla la selección de la opción de informe (Mismo Cliente / Otro)
 */
function setInformeOption(opcion) {
    console.log('setInformeOption llamada con opción:', opcion);
    
    const btnMismo = document.getElementById('btnInformeMismoCliente');
    const btnOtro = document.getElementById('btnInformeOtro');
    const inputInforme = document.getElementById('informeNombre');
    
    // Obtener el nombre del cliente desde el selector
    let nombreEmpresa = '';
    const selectEmpresa = document.getElementById('empresaSelect');
    
    if (selectEmpresa && selectEmpresa.selectedIndex > 0) {
        const selectedOption = selectEmpresa.options[selectEmpresa.selectedIndex];
        nombreEmpresa = selectedOption.getAttribute('data-nombre') || selectedOption.text;
    }
    
    console.log('Elementos encontrados:', {btnMismo, btnOtro, inputInforme, nombreEmpresa});
    
    if (!btnMismo || !btnOtro || !inputInforme) {
        console.error('No se encontraron todos los elementos necesarios');
        return;
    }
    
    // Actualizar estado visual de los botones
    btnMismo.classList.remove('active');
    btnOtro.classList.remove('active');
    
    if (opcion === 'mismo') {
        btnMismo.classList.add('active');
        // Usar el mismo cliente seleccionado
        inputInforme.value = nombreEmpresa.toUpperCase();
        inputInforme.readOnly = true;
        inputInforme.placeholder = 'Se usará el nombre del cliente seleccionado';
    } else {
        btnOtro.classList.add('active');
        // Permitir entrada manual
        inputInforme.value = '';
        inputInforme.readOnly = false;
        inputInforme.placeholder = 'Escriba el nombre para el informe';
        inputInforme.focus();
        inputInforme.oninput = function() { this.value = this.value.toUpperCase(); };
    }
}

/**
 * Controla la selección de la opción de remisión (No Presenta / Otro)
 */
function setRemisionOption(opcion) {
    console.log('setRemisionOption llamada con opción:', opcion);
    
    const btnNoPresenta = document.getElementById('btnRemisionNoPresenta');
    const btnOtro = document.getElementById('btnRemisionOtro');
    const inputRemision = document.getElementById('facturar');
    
    console.log('Elementos encontrados:', {btnNoPresenta, btnOtro, inputRemision});
    
    if (!btnNoPresenta || !btnOtro || !inputRemision) {
        console.error('No se encontraron todos los elementos necesarios para remisión');
        return;
    }
    
    // Actualizar estado visual de los botones
    btnNoPresenta.classList.remove('active');
    btnOtro.classList.remove('active');
    
    if (opcion === 'noPresenta') {
        btnNoPresenta.classList.add('active');
        // Usar "NO REGISTRA" por defecto
        inputRemision.value = 'NO REGISTRA';
        inputRemision.readOnly = true;
    } else {
        btnOtro.classList.add('active');
        // Permitir entrada manual
        inputRemision.value = '';
        inputRemision.readOnly = false;
        inputRemision.placeholder = 'Escriba el número de remisión';
        inputRemision.focus();
    }
}

/**
 * Actualiza automáticamente los campos cuando cambia la selección de empresa
 */
function actualizarCamposSegunEmpresa() {
    // Obtener el nombre del cliente desde el selector
    let nombreEmpresa = '';
    const selectEmpresa = document.getElementById('empresaSelect');
    
    if (selectEmpresa && selectEmpresa.selectedIndex > 0) {
        const selectedOption = selectEmpresa.options[selectEmpresa.selectedIndex];
        nombreEmpresa = selectedOption.getAttribute('data-nombre') || selectedOption.text;
    }
    
    console.log('Actualizando campos con nombre:', nombreEmpresa);
    
    // Si está seleccionado "Mismo Cliente" para facturación, actualizar
    const btnFacturarMismo = document.getElementById('btnFacturarMismoCliente');
    if (btnFacturarMismo && btnFacturarMismo.classList.contains('active')) {
        const facturarEl = document.getElementById('facturarNombre');
        if (facturarEl && !facturarEl.value) {
            facturarEl.value = nombreEmpresa.toUpperCase();
        }
    }
    
    // Si está seleccionado "Mismo Cliente" para informe, actualizar
    const btnInformeMismo = document.getElementById('btnInformeMismoCliente');
    if (btnInformeMismo && btnInformeMismo.classList.contains('active')) {
        const informeEl = document.getElementById('informeNombre');
        if (informeEl && !informeEl.value) {
            informeEl.value = nombreEmpresa.toUpperCase();
        }
    }
}

// Modificar el event listener existente para incluir la actualización automática
document.getElementById("empresaSelect")?.addEventListener("change", function() {
    const selected = this.options[this.selectedIndex];
    const nitValue = selected.getAttribute("data-nit") || "";
    const nitInput = document.getElementById("nitEmpresa");
    if (nitInput) {
        nitInput.value = nitValue || '';
    }
    
    // Mostrar u ocultar botón de limpiar según si hay selección
    const btnLimpiar = document.getElementById('btnLimpiarCliente');
    if (btnLimpiar) {
        btnLimpiar.style.display = this.value ? 'block' : 'none';
    }
    
    // Actualizar los campos de facturación e informe si están en modo "Mismo Cliente"
    actualizarCamposSegunEmpresa();
});

// Botón para limpiar cliente y campos relacionados
document.getElementById('btnLimpiarCliente')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Limpiar select
    const empresaSelect = document.getElementById('empresaSelect');
    if (empresaSelect) {
        empresaSelect.value = '';
        empresaSelect.dispatchEvent(new Event('change'));
    }
    
    // Limpiar NIT
    const nitEmpresa = document.getElementById('nitEmpresa');
    if (nitEmpresa) {
        nitEmpresa.value = '';
    }
    
    // Limpiar campos de facturación y informe
    const facturarNombre = document.getElementById('facturarNombre');
    const informeNombre = document.getElementById('informeNombre');
    const empresaSearchInput = document.getElementById('empresaSearchInput');
    
    if (facturarNombre) facturarNombre.value = '';
    if (informeNombre) informeNombre.value = '';
    if (empresaSearchInput) empresaSearchInput.value = '';
    
    // Ocultar el botón
    this.style.display = 'none';
    
    showNotification('🗑️ Cliente y campos relacionados limpios', 'info');
});

// =======================================================
// SISTEMA DE ADVERTENCIA AL RECARGAR LA PÁGINA
// =======================================================

/**
 * Verifica si hay datos ingresados en el formulario
 * @returns {boolean} true si hay datos, false si está vacío
 */
function formularioTieneDatos() {
    const form = document.getElementById('deliveryForm');
    if (!form) return false;

    // Verificar campos principales
    const quoteNumber = document.getElementById('quoteNumber')?.value?.trim();
    const fechaRecepcion = document.getElementById('fechaRecepcion')?.value?.trim();
    const empresaSelect = document.getElementById('empresaSelect')?.value?.trim();
    const facturar = document.getElementById('facturar')?.value?.trim();
    const observaciones = document.getElementById('observaciones')?.value?.trim();

    // Verificar si hay elementos guardados o datos en tablas
    const hasItemsData = Object.keys(savedRowsData.ensayos_acreditados).length > 0 ||
                        Object.keys(savedRowsData.ensayos_no_acreditados).length > 0;

    // Verificar si hay datos en los inputs visibles de las tablas
    const itemsInputs = document.querySelectorAll('#itemsList input[type="number"], #itemsList2 input[type="number"]');
    let hasTableData = false;
    itemsInputs.forEach(input => {
        if (input.value && parseInt(input.value) > 0) {
            hasTableData = true;
        }
    });

    // Verificar si hay firmas
    const hasFirmas = Object.values(signatureData).some(d => d !== null && d !== undefined);

    // Retornar true si hay CUALQUIER dato ingresado
    return !!(quoteNumber || fechaRecepcion || empresaSelect || facturar || observaciones || 
              hasItemsData || hasTableData || hasFirmas);
}

/**
 * Función para limpiar secciones de tablas al iniciar
 */
function limpiarSeccionesTablas() {
    // Limpiar completamente savedRowsData
    if (typeof savedRowsData !== 'undefined') {
        savedRowsData.ensayos_acreditados = {};
        savedRowsData.ensayos_no_acreditados = {};
    }

    // Ocultar tabla de Elementos del Alcance
    const menu1 = document.getElementById('menu1');
    if (menu1) menu1.style.display = 'none';

    // Limpiar lista de items visibles
    const itemsList = document.getElementById('itemsList');
    if (itemsList) itemsList.innerHTML = '';

    const itemsList2 = document.getElementById('itemsList2');
    if (itemsList2) itemsList2.innerHTML = '';

    // Resetear selector de tipo de ensayos
    const tipoEnsayosSelect = document.getElementById('tipoEnsayos');
    if (tipoEnsayosSelect) tipoEnsayosSelect.value = '';

    // Limpiar paginación
    const itemsListPagination = document.getElementById('itemsListPagination');
    if (itemsListPagination) itemsListPagination.innerHTML = '';

    const itemsList2Pagination = document.getElementById('itemsList2Pagination');
    if (itemsList2Pagination) itemsList2Pagination.innerHTML = '';

    // Ocultar Vista Previa de Elementos Guardados
    const savedPrev = document.getElementById('savedItemsPreview');
    if (savedPrev) savedPrev.style.display = 'none';

    // Limpiar contenedor de elementos guardados
    const savedContainer = document.getElementById('savedItemsContainer');
    if (savedContainer) savedContainer.innerHTML = '';

    // Resetear contador de elementos guardados
    const savedCount = document.getElementById('savedItemsCount');
    if (savedCount) savedCount.textContent = '0 elementos guardados';

    // Limpiar del localStorage también
    localStorage.removeItem('savedRowsData');

    console.log('✅ Secciones de tablas limpiadas completamente');
}

/**
 * Función para bloquear/desbloquear campos de firma basado en consentimiento LPDP
 */
function toggleConsentFields(tipo) {
    const isRecepcion = tipo === 'Recepcion';
    const checkboxId = isRecepcion ? 'consentRecepcion' : 'consentEntrega';
    const isConsented = document.getElementById(checkboxId)?.checked;
    
    // Campos a bloquear/desbloquear
    const nombreFieldId = isRecepcion ? 'clienteRecepcionNombre' : 'clienteEntregaNombre';
    const cargoFieldId = isRecepcion ? 'clienteRecepcionCargo' : 'clienteEntregaCargo';
    const cedulaFieldId = isRecepcion ? 'clienteRecepcionCedula' : 'clienteEntregaCedula';
    const canvasId = isRecepcion ? 'signatureCanvasRecepcion' : 'signatureCanvasEntrega';
    const limpiarBtnId = isRecepcion ? '.signature-controls button:nth-child(1)' : '.signature-controls button:nth-child(1)';
    const guardarBtnId = isRecepcion ? '.signature-controls button:nth-child(2)' : '.signature-controls button:nth-child(2)';
    
    // Obtener elementos
    const nombreField = document.getElementById(nombreFieldId);
    const cargoField = document.getElementById(cargoFieldId);
    const cedulaField = document.getElementById(cedulaFieldId);
    const canvas = document.getElementById(canvasId);
    
    // Obtener los botones del contenedor padre de la firma
    const signatureContainer = canvas?.parentElement;
    const buttons = signatureContainer?.querySelectorAll('button');
    
    if (isConsented) {
        // Habilitar campos
        if (nombreField) {
            nombreField.disabled = false;
            nombreField.style.opacity = '1';
            nombreField.style.cursor = 'text';
            nombreField.style.backgroundColor = 'white';
        }
        if (cargoField) {
            cargoField.disabled = false;
            cargoField.style.opacity = '1';
            cargoField.style.cursor = 'text';
            cargoField.style.backgroundColor = 'white';
        }
        if (cedulaField) {
            cedulaField.disabled = false;
            cedulaField.style.opacity = '1';
            cedulaField.style.cursor = 'text';
            cedulaField.style.backgroundColor = 'white';
        }
        if (canvas) {
            canvas.style.opacity = '1';
            canvas.style.cursor = 'crosshair';
            canvas.style.pointerEvents = 'auto';
        }
        if (buttons) {
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
        }
    } else {
        // Deshabilitar campos
        if (nombreField) {
            nombreField.disabled = true;
            nombreField.style.opacity = '0.5';
            nombreField.style.cursor = 'not-allowed';
            nombreField.style.backgroundColor = '#f5f5f5';
            nombreField.value = '';
        }
        if (cargoField) {
            cargoField.disabled = true;
            cargoField.style.opacity = '0.5';
            cargoField.style.cursor = 'not-allowed';
            cargoField.style.backgroundColor = '#f5f5f5';
            cargoField.value = '';
        }
        if (cedulaField) {
            cedulaField.disabled = true;
            cedulaField.style.opacity = '0.5';
            cedulaField.style.cursor = 'not-allowed';
            cedulaField.style.backgroundColor = '#f5f5f5';
            cedulaField.value = '';
        }
        if (canvas) {
            canvas.style.opacity = '0.5';
            canvas.style.cursor = 'not-allowed';
            canvas.style.pointerEvents = 'none';
        }
        if (buttons) {
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
        }
    }
}

/**
 * Enforce restrictions at the UI level: prevent focus/input on representative fields
 * when the corresponding consent checkbox is not checked. Adds focus/input handlers
 * that immediately blur and notify the user.
 */
function enforceConsentRestrictions() {
    const mappings = [
        { checkbox: 'consentRecepcion', fields: ['clienteRecepcionNombre','clienteRecepcionCargo','clienteRecepcionCedula'], canvas: 'signatureCanvasRecepcion' },
        { checkbox: 'consentEntrega', fields: ['clienteEntregaNombre','clienteEntregaCargo','clienteEntregaCedula'], canvas: 'signatureCanvasEntrega' }
    ];

    mappings.forEach(map => {
        const checkbox = document.getElementById(map.checkbox);
        map.fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            // on focus: if not consented, blur and alert
            field.addEventListener('focus', (e) => {
                const consented = checkbox?.checked;
                if (!consented) {
                    e.target.blur();
                    alert('Debe autorizar el tratamiento de datos y firma digital antes de completar este campo.');
                }
            });

            // on input/paste: prevent changes when not consented
            field.addEventListener('input', (e) => {
                const consented = checkbox?.checked;
                if (!consented) {
                    e.target.value = '';
                }
            });
        });

        // canvas: block pointer events if no consent (extra safety)
        const canvas = document.getElementById(map.canvas);
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => {
                const consented = document.getElementById(map.checkbox)?.checked;
                if (!consented) {
                    e.preventDefault();
                    alert('Debe autorizar el tratamiento de datos y firma digital antes de firmar.');
                }
            });
        }
    });
}

/**
 * Evento beforeunload: muestra advertencia si hay datos sin guardar
 */
window.addEventListener('beforeunload', function(event) {
    // Solo mostrar advertencia si hay datos en el formulario
    // y se llenaron los campos mínimos para guardado
    const formData = collectFormData();
    if (formularioTieneDatos() && hasRequiredFieldsForSave(formData)) {
        // El mensaje personalizado no se mostrará en navegadores modernos por seguridad
        // pero el navegador mostrará su propio diálogo de confirmación
        event.preventDefault();
        event.returnValue = '⚠️ Advertencia: Si recarga la página, perderá todos los datos ingresados. ¿Desea continuar?';
        return event.returnValue;
    }
});

/**
 * Validar que la fecha de entrega sea >= fecha de recepción
 */
function validarFechaEntrega() {
    const fechaRecepcion = document.getElementById('fechaRecepcion');
    const fechaEntrega = document.getElementById('fechaEntrega');
    
    if (!fechaRecepcion || !fechaEntrega) return;
    
    const fechaRecepcionValue = fechaRecepcion.value;
    const fechaEntregaValue = fechaEntrega.value;
    
    // Si ambas fechas están completas, validar
    if (fechaRecepcionValue && fechaEntregaValue) {
        const recepcion = new Date(fechaRecepcionValue);
        const entrega = new Date(fechaEntregaValue);
        
        // Si entrega es anterior a recepción, mostrar error
        if (entrega < recepcion) {
            alert('❌ Error: La fecha de entrega no puede ser anterior a la fecha de recepción.');
            fechaEntrega.value = '';
            fechaEntrega.focus();
            return false;
        }
    }
    
    // Establecer el atributo min del campo de entrega
    if (fechaRecepcionValue) {
        fechaEntrega.min = fechaRecepcionValue;
    }
    
    return true;
}

/**
 * MÓDULO DE REPORTES E HISTORIAL
 * Funciones para gestionar datos, búsquedas, filtros y exportaciones
 */

// Obtener todos los casos guardados (solo localStorage, síncrono)
function obtenerTodosCasos() {
    const casosGuardados = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    // Asegurar que es un array
    return Array.isArray(casosGuardados) ? casosGuardados : Object.values(casosGuardados);
}

// Cache de casos unificados para evitar llamadas repetidas
window._casosUnificadosCache = window._casosUnificadosCache || null;
window._fetchEnCurso = window._fetchEnCurso || false;
window._callbacksRender = window._callbacksRender || [];

// Convertir un proceso de la tabla procesos_acreditados al formato de caso del frontend
function procesoACaso(p) {
    if (!p) return null;
    const nroProceso = p.numero_proceso || '';
    const estadoRaw = p.estado || '';
    return {
        cotizacion: nroProceso,
        quoteNumber: nroProceso,
        cliente: p.cliente || '',
        fechaRecepcion: p.fecha_recepcion || '',
        fechaEntrega: p.fecha_entrega_cliente || '',
        status: (estadoRaw === 'finalizado' || estadoRaw === 'entrega-cliente') ? 'entrega' : (estadoRaw || 'recepcion'),
        estado: estadoRaw || 'recepcion',
        items: [],
        n_informe: p.n_informe || '',
        numero_proceso: nroProceso,
        informeNombre: p.informe_a_nombre_de || '',
        facturarNombre: p.facturar_a_nombre_de || '',
        timestamp: p.updated_at || p.created_at || '',
        _source: 'supabase_proceso',
        caso_activo: p.caso_activo !== undefined ? p.caso_activo : true
    };
}

function _getKeyCaso(c) {
    return c && (c.cotizacion || c.quoteNumber || c.numero_proceso || '');
}

function _insertIfNewer(map, caso) {
    if (!caso || typeof caso !== 'object') return;
    const key = _getKeyCaso(caso);
    if (!key) return;
    const existing = map.get(key);
    if (!existing) {
        map.set(key, caso);
    } else {
        const tsNew = caso.timestamp || caso.updated_at || caso.created_at || '';
        const tsOld = existing.timestamp || existing.updated_at || existing.created_at || '';
        const casoIsProceso = caso._source === 'supabase_proceso';
        const existingIsProceso = existing._source === 'supabase_proceso';
        const shouldOverwrite = casoIsProceso || tsNew > tsOld;
        if (shouldOverwrite) {
            const preserveFields = [
                'signatureData', 'items', 'formData', 'cotizacion',
                'cliente', 'nitEmpresa', 'facturar',
                'informe', 'observaciones', 'clienteEmail', 'empresaEmail', 'copiaEmail',
                'lavado', 'elementosLavados', 'tipoLavado', 'fechaLavado', 'responsableLavado', 'observacionesLavado',
                'inspeccionVisual', 'pruebasFuncionales', 'inspectorCalidad', 'fechaInspeccion', 'observacionesCalidad', 'estadoCalidad',
                'clienteRecepcionNombre', 'clienteRecepcionCedula', 'clienteRecepcionCargo', 'fechaFirmaRecepcion',
                'clienteEntregaNombre', 'clienteEntregaCedula', 'clienteEntregaCargo', 'fechaFirmaEntrega',
                'consentRecepcion', 'consentEntrega',
                'highTestRecepcionNombre', 'highTestRecepcionCargo', 'highTestEntregaNombre', 'highTestEntregaCargo',
                'fechaRecepcion', 'fechaEntrega'
            ];
            preserveFields.forEach(f => {
                const val = caso[f];
                const isEmpty = val === null || val === undefined || val === '' || val === 'NO DEFINIDA' || (Array.isArray(val) && val.length === 0);
                if (isEmpty && existing[f]) {
                    caso[f] = existing[f];
                }
            });
            map.set(key, caso);
        }
    }
}

function _mergeCasos(localCasos, supabaseCasos) {
    const merged = new Map();
    localCasos.forEach(c => _insertIfNewer(merged, c));
    supabaseCasos.forEach(c => _insertIfNewer(merged, c));
    const unified = Array.from(merged.values());
    unified.sort((a, b) => {
        const numA = String(a.cotizacion || a.quoteNumber || a.numero_proceso || '');
        const numB = String(b.cotizacion || b.quoteNumber || b.numero_proceso || '');
        return numB.localeCompare(numA);
    });
    return unified;
}

async function _fetchSupabaseEnBackground() {
    if (window._fetchEnCurso) return;
    window._fetchEnCurso = true;

    const supabaseCasos = [];

    try {
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_borradores' })
        });
        const result = await resp.json();
        if (result.ok && Array.isArray(result.data)) {
            result.data.forEach(d => {
                if (d && typeof d === 'object') {
                    d._source = 'supabase_borrador';
                    supabaseCasos.push(d);
                }
            });
        }
    } catch (e) {
        console.warn('⚠️ No se pudieron obtener borradores del servidor:', e.message || e);
    }

    try {
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_procesos_acreditados', limit: 1000 })
        });
        const result = await resp.json();
        if (result.ok && Array.isArray(result.procesos)) {
            result.procesos.forEach(p => {
                const caso = procesoACaso(p);
                if (caso) supabaseCasos.push(caso);
            });
        }
    } catch (e) {
        console.warn('⚠️ No se pudieron obtener procesos del servidor:', e.message || e);
    }

    // Merge con datos locales
    const localCasos = obtenerTodosCasos();
    window._casosUnificadosCache = _mergeCasos(localCasos, supabaseCasos);
    window._fetchEnCurso = false;

    // Disparar re-render en todos los callbacks registrados
    const cbs = window._callbacksRender.slice();
    window._callbacksRender = [];
    cbs.forEach(cb => {
        try { cb(window._casosUnificadosCache); } catch(e) { console.warn('Error en callback de render:', e); }
    });

    console.log(`✅ Datos unificados: ${window._casosUnificadosCache.length} casos (${localCasos.length} locales + ${supabaseCasos.length} remotos)`);
}

// Obtener casos unificados: devuelve localStorage INMEDIATAMENTE (síncrono)
// y busca Supabase en background. Si ya hay datos fusionados, devuelve esos.
function obtenerCasosUnificados() {
    // Si ya tenemos cache fusionado, devolverlo
    if (window._casosUnificadosCache) return window._casosUnificadosCache;

    // Devolver localStorage inmediatamente
    const localCasos = obtenerTodosCasos();

    // Iniciar fetch a Supabase en background (no bloquear)
    _fetchSupabaseEnBackground();

    return localCasos;
}

// Como obtenerCasosUnificados pero registra un callback para re-render
// cuando lleguen datos de Supabase (útil para analytics)
function obtenerCasosUnificadosConRender(callback) {
    const casos = obtenerCasosUnificados();

    if (window._fetchEnCurso) {
        window._callbacksRender.push(callback);
    }

    return casos;
}

// Forzar recarga del cache de casos unificados
function invalidarCacheCasos() {
    window._casosUnificadosCache = null;
}

// Mostrar/ocultar pestañas de reportes
function showReportsTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('[id^="tab"]').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    // Mostrar tab seleccionado
    const selectedTab = document.getElementById('tabContent' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (selectedTab) {
        selectedTab.style.display = 'block';
        document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.remove('btn-secondary');
        document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('btn-primary');
    }
    
    // Ejecutar función específica del tab
    if (tabName === 'historial') {
        // Limpiar filtro de búsqueda rápida al volver al historial y refrescar
        const searchInput = document.getElementById('searchHistorial');
        if (searchInput) { searchInput.value = ''; }
        refrescarHistorial();
    } else if (tabName === 'estadisticas') {
        actualizarEstadisticas();
    } else if (tabName === 'busqueda') {
        // Preparar lista de empresas para filtro (opcional)
        try { populateFiltroEmpresas(); } catch(e){}
        ejecutarBusquedaAvanzada();
    }
}

// Refrescar y mostrar historial
function refrescarHistorial() {
    const tbody = document.getElementById('historialTableBody');
    if (!tbody) return;

    const casos = obtenerCasosUnificadosConRender(() => {
        const el = document.getElementById('historialTableBody');
        if (el) refrescarHistorial();
    });
    const searchValue = document.getElementById('searchHistorial')?.value.toLowerCase() || '';

    tbody.innerHTML = '';
    
    if (!casos || casos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 20px; text-align: center; color: #999;">No hay casos registrados</td></tr>';
        return;
    }
    
    const casosFiltrados = casos.filter(caso => {
        if (!searchValue) return true;
        return JSON.stringify(caso).toLowerCase().includes(searchValue);
    });

    const casosOrdenados = casosFiltrados.sort((a, b) => {
        const numA = (a.cotizacion || a.quoteNumber || a.numero_proceso || '');
        const numB = (b.cotizacion || b.quoteNumber || b.numero_proceso || '');
        return String(numB).localeCompare(String(numA));
    });

    const itemsPorPagina = 20;
    const totalPaginas = Math.ceil(casosOrdenados.length / itemsPorPagina);
    let pagina = window._paginaHistorial || 1;
    if (pagina > totalPaginas) pagina = totalPaginas;
    if (pagina < 1) pagina = 1;
    window._paginaHistorial = pagina;
    const inicio = (pagina - 1) * itemsPorPagina;
    const paginados = casosOrdenados.slice(inicio, inicio + itemsPorPagina);
    
    paginados.forEach((caso, index) => {
        const clienteNombre = caso.cliente || caso.clienteRecepcionNombre || 'N/A';
        const informeNombre = caso.informeNombre || 'N/A';
        const facturarNombre = caso.facturarNombre || 'N/A';
        const numRecepcion = caso.cotizacion || caso.quoteNumber || 'N/A';
        const fechaRecepcion = caso.fechaRecepcion || 'N/A';
        const fechaEntrega = caso.fechaEntrega || 'N/A';
        const itemCount = (caso.items ? caso.items.length : 0);
        
        let estadoRaw = caso.estado || caso.status || 'recepcion';
        let estadoColor = '#ff9800';
        let estadoLabel = estadoRaw || 'Sin estado';
        const e = estadoRaw.toLowerCase();
        if (e === 'entrega' || e === 'finalizado' || e === 'entrega-cliente') {
            estadoColor = '#28a745';
        } else if (e === 'recepcion') {
            estadoColor = '#007bff';
        } else if (e === 'informe-de-ensayo' || e === 'informe') {
            estadoColor = '#9c27b0';
        } else if (e === 'inspeccion') {
            estadoColor = '#ff5722';
        }
        const esEntrega = e === 'entrega' || e === 'finalizado' || e === 'entrega-cliente';
        
        const row = `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">${numRecepcion}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${clienteNombre}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${informeNombre}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${facturarNombre}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${fechaRecepcion}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${fechaEntrega}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${itemCount}</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <span style="background: ${estadoColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        ${estadoLabel}
                    </span>
                </td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <button type="button" class="btn btn-small" onclick="mostrarVistaPrevia('${numRecepcion}')" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;">
                        👁️ Ver
                    </button>
                    ${caso.status === 'entrega' ? `<button type="button" class="btn btn-small" onclick="exportarCasoJSON('${numRecepcion}')" style="padding: 4px 8px; font-size: 12px; margin-right:4px;">📥 Exp</button>` : ''}
                    <button type="button" class="btn btn-small" onclick="deleteCaseByReception('${numRecepcion}')" style="padding: 4px 8px; font-size: 12px; margin-left:4px;">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    const pagDiv = document.getElementById('paginacionHistorial');
    if (pagDiv) {
        if (totalPaginas <= 1) { pagDiv.innerHTML = ''; return; }
        let html = `<span style="font-size: 13px; color: #666;">Mostrando ${inicio + 1}-${Math.min(inicio + itemsPorPagina, casosOrdenados.length)} de ${casosOrdenados.length}</span>`;
        html += `<button type="button" class="btn btn-small" onclick="paginarHistorial(1)" ${pagina === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">«</button>`;
        html += `<button type="button" class="btn btn-small" onclick="paginarHistorial(${pagina - 1})" ${pagina === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">‹</button>`;
        let startPage = Math.max(1, pagina - 2);
        let endPage = Math.min(totalPaginas, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
        for (let i = startPage; i <= endPage; i++) {
            html += `<button type="button" class="btn btn-small" onclick="paginarHistorial(${i})" style="padding: 4px 10px; font-size: 13px; ${i === pagina ? 'background: #022859; color: white;' : ''}">${i}</button>`;
        }
        html += `<button type="button" class="btn btn-small" onclick="paginarHistorial(${pagina + 1})" ${pagina === totalPaginas ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">›</button>`;
        html += `<button type="button" class="btn btn-small" onclick="paginarHistorial(${totalPaginas})" ${pagina === totalPaginas ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">»</button>`;
        pagDiv.innerHTML = html;
    }
}

function paginarHistorial(pagina) {
    window._paginaHistorial = pagina;
    refrescarHistorial();
    document.getElementById('historialContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const casos = obtenerCasosUnificadosConRender(() => {
        const el = document.getElementById('estadisticasCasoTableBody');
        if (el) actualizarEstadisticas();
    });
    
    let totalCasos = casos.length;
    let completados = casos.filter(c => {
        const e = (c.estado || c.status || '').toLowerCase();
        return e === 'entrega' || e === 'finalizado' || e === 'entrega-cliente' || (c.signatureData?.Recepcion?.isSignature && c.signatureData?.Entrega?.isSignature);
    }).length;
    let enProgreso = totalCasos - completados;
    let discrepancias = 0;
    
    // Helper para extraer número
    const parseFields = (obj, possibleKeys) => {
        for (let k of possibleKeys) {
            if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
                const v = Number(String(obj[k]).replace(/[^0-9\-\.]/g, ''));
                if (!isNaN(v)) return v;
            }
        }
        return 0;
    };

    // Agrupar casos por cotización con sus items
    const caseStats = {};
    casos.forEach(caso => {
        const cotizacion = caso.cotizacion || caso.quoteNumber || 'N/A';
        const cliente = caso.cliente || caso.clienteRecepcionNombre || 'N/A';
        const informeNombre = caso.informeNombre || caso.empresa || 'N/A';
        const facturarNombre = caso.facturarNombre || 'N/A';
        
        if (!caseStats[cotizacion]) {
            caseStats[cotizacion] = {
                cliente: cliente,
                informeNombre: informeNombre,
                facturarNombre: facturarNombre,
                totalRecibidos: 0,
                totalEntregados: 0,
                items: {},
                totalItems: 0
            };
        }
        
        // Contar items y cantidades desde caso.items (formData.items guardado)
        let caseRecibidos = 0, caseEntregados = 0, itemCount = 0;
        
        if (Array.isArray(caso.items) && caso.items.length > 0) {
            caso.items.forEach(item => {
                const nombre = item.name || item.elemento || item.nombre || 'Unknown';
                const rec = parseInt(item.quantity) || 0;  // quantity = cantRecibida
                const ent = parseInt(item.quantity2) || 0; // quantity2 = cantEntregada
                
                if (!caseStats[cotizacion].items[nombre]) {
                    caseStats[cotizacion].items[nombre] = { recibidos: 0, entregados: 0 };
                }
                caseStats[cotizacion].items[nombre].recibidos += rec;
                caseStats[cotizacion].items[nombre].entregados += ent;
                caseRecibidos += rec;
                caseEntregados += ent;
                itemCount++;
            });
        }
        
        caseStats[cotizacion].totalRecibidos += caseRecibidos;
        caseStats[cotizacion].totalEntregados += caseEntregados;
        caseStats[cotizacion].totalItems += itemCount;
        
        if (caseRecibidos !== caseEntregados) {
            discrepancias++;
        }
    });
    
    // Actualizar cards
    document.getElementById('stat-totalCasos').textContent = totalCasos;
    document.getElementById('stat-completados').textContent = completados;
    document.getElementById('stat-enProgreso').textContent = enProgreso;
    document.getElementById('stat-discrepancias').textContent = discrepancias;
    
    // Llenar tabla de casos
    const tbody = document.getElementById('estadisticasCasoTableBody');
    tbody.innerHTML = '';
    const casesArray = Object.entries(caseStats).sort((a,b) => {
        // Ordenar de mayor a menor por Nº de Recepción (alfanumérico descendente)
        return String(b[0]).localeCompare(String(a[0]));
    });
    
    // Paginación
    const itemsPorPagina = 20;
    const totalPaginasEst = Math.ceil(casesArray.length / itemsPorPagina);
    let paginaEst = window._paginaEstadisticas || 1;
    if (paginaEst > totalPaginasEst) paginaEst = totalPaginasEst;
    if (paginaEst < 1) paginaEst = 1;
    window._paginaEstadisticas = paginaEst;
    const inicioEst = (paginaEst - 1) * itemsPorPagina;
    const paginadosEst = casesArray.slice(inicioEst, inicioEst + itemsPorPagina);
    
    if (casesArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 16px; text-align: center; color: #666;">No hay registros</td></tr>';
    } else {
        paginadosEst.forEach(([cotizacion, stats]) => {
            const diferencia = stats.totalEntregados - stats.totalRecibidos;
            const diferenciasStyle = diferencia !== 0 ? 'background: #ffebee; color: #c62828; font-weight: bold;' : '';
            const discrepanciaIndicador = diferencia !== 0 ? '<div style="color: #e91e63; font-size: 11px; margin-top: 4px; font-weight: bold;">⚠️ Discrepancia</div>' : '';
            const row = `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${cotizacion}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${stats.cliente}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${stats.informeNombre}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${stats.facturarNombre}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${stats.totalItems}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${stats.totalRecibidos}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${stats.totalEntregados}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; ${diferenciasStyle}">${diferencia > 0 ? '+' : ''}${diferencia}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                        <button type="button" class="btn btn-small" onclick="mostrarDetallesEstadisticas('${cotizacion}')" style="padding: 6px 10px; font-size: 12px;">👁️ Ver</button>
                        ${discrepanciaIndicador}
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }
    
    // Renderizar paginación de estadísticas
    const pagDivEst = document.getElementById('paginacionEstadisticas');
    if (pagDivEst) {
        if (totalPaginasEst <= 1) { pagDivEst.innerHTML = ''; return; }
        let html = `<span style="font-size: 13px; color: #666;">Mostrando ${inicioEst + 1}-${Math.min(inicioEst + itemsPorPagina, casesArray.length)} de ${casesArray.length}</span>`;
        html += `<button type="button" class="btn btn-small" onclick="paginarEstadisticas(1)" ${paginaEst === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">«</button>`;
        html += `<button type="button" class="btn btn-small" onclick="paginarEstadisticas(${paginaEst - 1})" ${paginaEst === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">‹</button>`;
        let startPage = Math.max(1, paginaEst - 2);
        let endPage = Math.min(totalPaginasEst, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
        for (let i = startPage; i <= endPage; i++) {
            html += `<button type="button" class="btn btn-small" onclick="paginarEstadisticas(${i})" style="padding: 4px 10px; font-size: 13px; ${i === paginaEst ? 'background: #022859; color: white;' : ''}">${i}</button>`;
        }
        html += `<button type="button" class="btn btn-small" onclick="paginarEstadisticas(${paginaEst + 1})" ${paginaEst === totalPaginasEst ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">›</button>`;
        html += `<button type="button" class="btn btn-small" onclick="paginarEstadisticas(${totalPaginasEst})" ${paginaEst === totalPaginasEst ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">»</button>`;
        pagDivEst.innerHTML = html;
    }
}

// Paginación de estadísticas
function paginarEstadisticas(pagina) {
    window._paginaEstadisticas = pagina;
    actualizarEstadisticas();
    document.getElementById('estadisticasCasoTableBody').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Búsqueda avanzada
window._paginaBusqueda = window._paginaBusqueda || 1;

function ejecutarBusquedaAvanzada() {
    window._paginaBusqueda = 1;
    _renderBusquedaAvanzada();
}

function paginarBusqueda(pagina) {
    window._paginaBusqueda = pagina;
    _renderBusquedaAvanzada();
    document.getElementById('resultadosBusquedaContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _renderBusquedaAvanzada() {
    const casos = obtenerCasosUnificadosConRender(() => {
        const el = document.getElementById('resultadosBusquedaBody');
        if (el) _renderBusquedaAvanzada();
    });
    const filtros = {
        numRecepcion: document.getElementById('filtroNumRecepcion')?.value.toLowerCase() || '',
        cliente: document.getElementById('filtroCliente')?.value.toLowerCase() || '',
        empresa: document.getElementById('filtroEmpresa')?.value.toLowerCase() || '',
        estado: document.getElementById('filtroEstado')?.value.toLowerCase() || '',
        mes: document.getElementById('filtroMes')?.value || '',
        fechaDesde: document.getElementById('filtroFechaDesde')?.value || '',
        fechaHasta: document.getElementById('filtroFechaHasta')?.value || ''
    };

    const resultados = casos.filter(caso => {
        const numRecepcion = (caso.cotizacion || caso.quoteNumber || '').toLowerCase();
        const cliente = (caso.cliente || caso.clienteRecepcionNombre || '').toLowerCase();
        const empresaNombre = (caso.informeNombre || caso.empresa || '').toLowerCase();
        const fechaRecepcion = caso.fechaRecepcion || '';
        const fechaEntrega = caso.fechaEntrega || '';

        if (filtros.numRecepcion && !numRecepcion.includes(filtros.numRecepcion)) return false;
        if (filtros.cliente && !cliente.includes(filtros.cliente)) return false;
        if (filtros.empresa && !empresaNombre.includes(filtros.empresa)) return false;
        if (filtros.estado) {
            const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[\s_]+/g, '-');
            const aliasMap = {
                'proceso-de-ensayo': 'en-proceso-de-ensayo',
                'informe': 'informe-de-ensayo'
            };
            const filtro = aliasMap[normalize(filtros.estado)] || normalize(filtros.estado);
            const e = aliasMap[normalize(caso.estado || '')] || normalize(caso.estado || '');
            const s = aliasMap[normalize(caso.status || '')] || normalize(caso.status || '');

            let match = false;

            if (e && e === filtro) {
                match = true;
            }
            else if (s && s === filtro) {
                match = true;
            }
            else if (s === 'entrega') {
                if (filtro === 'entrega-cliente') match = true;
                if (filtro === 'finalizado') match = true;
            }

            if (!match) return false;
        }
        if (filtros.mes) {
            const fechaEntregaMes = (fechaEntrega || fechaRecepcion || '').substring(0, 7);
            if (fechaEntregaMes !== filtros.mes) return false;
        }
        if (filtros.fechaDesde && fechaRecepcion < filtros.fechaDesde) return false;
        if (filtros.fechaHasta && fechaRecepcion > filtros.fechaHasta) return false;

        return true;
    });

    // Ordenar resultados descendentemente por Nº de Recepción
    resultados.sort((a, b) => {
        const numA = (a.cotizacion || a.quoteNumber || '');
        const numB = (b.cotizacion || b.quoteNumber || '');
        return String(numB).localeCompare(String(numA));
    });

    // Paginación
    const itemsPorPagina = 20;
    const totalPaginas = Math.ceil(resultados.length / itemsPorPagina);
    let pagina = window._paginaBusqueda || 1;
    if (pagina > totalPaginas) pagina = totalPaginas;
    if (pagina < 1) pagina = 1;
    window._paginaBusqueda = pagina;
    const inicio = (pagina - 1) * itemsPorPagina;
    const paginados = resultados.slice(inicio, inicio + itemsPorPagina);

    // Mostrar resultados
    const tbody = document.getElementById('resultadosBusquedaBody');
    tbody.innerHTML = '';

    if (resultados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="padding: 20px; text-align: center; color: #999;">No se encontraron resultados</td></tr>';
        document.getElementById('paginacionBusqueda').innerHTML = '';
        return;
    }

    paginados.forEach(caso => {
        const itemCount = (caso.items ? caso.items.length : 0) || ((caso.savedRowsData?.ensayos_acreditados ? Object.keys(caso.savedRowsData.ensayos_acreditados).length : 0) +
                         (caso.savedRowsData?.ensayos_no_acreditados ? Object.keys(caso.savedRowsData.ensayos_no_acreditados).length : 0));

        let estadoRaw = caso.estado || caso.status || 'recepcion';
        let estadoColor = '#ff9800';
        let estadoLabel = estadoRaw || 'Sin estado';
        const e = estadoRaw.toLowerCase();
        if (e === 'entrega' || e === 'finalizado' || e === 'entrega-cliente') {
            estadoColor = '#28a745';
        } else if (e === 'recepcion') {
            estadoColor = '#007bff';
        } else if (e === 'informe-de-ensayo' || e === 'informe') {
            estadoColor = '#9c27b0';
        } else if (e === 'inspeccion') {
            estadoColor = '#ff5722';
        }
        const esEntregaBusqueda = e === 'entrega' || e === 'finalizado' || e === 'entrega-cliente';

        const num = caso.cotizacion || caso.quoteNumber || 'N/A';
        const clienteDisp = caso.cliente || caso.clienteRecepcionNombre || 'N/A';
        const informeDisp = caso.informeNombre || caso.empresa || 'N/A';
        const facturaDisp = caso.facturarNombre || 'N/A';

        const row = `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px; border: 1px solid #ddd;">${num}</td>
                <td style="padding: 10px; border: 1px solid #ddd; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${clienteDisp}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${informeDisp}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${facturaDisp}</td>
                <td style="padding: 10px; border: 1px solid #ddd; width: 110px;">${caso.fechaRecepcion || 'N/A'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; width: 140px;">${caso.fechaEntrega || 'N/A'}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${itemCount}</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <span style="background: ${estadoColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${estadoLabel}</span>
                </td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center; width: 80px; min-width: 80px;">
                    <button type="button" class="btn btn-small" onclick="mostrarVistaPrevia('${num}')" style="padding: 4px 8px; font-size: 12px; margin-right:4px;">👁️ Ver</button>
                    ${canManageCases() ? `<button type="button" class="btn btn-small" onclick="deleteCaseByReception('${num}')" style="padding: 4px 8px; font-size: 12px; margin-left:4px;">🗑️</button>` : ''}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Renderizar paginación
    const pagDiv = document.getElementById('paginacionBusqueda');
    if (totalPaginas <= 1) { pagDiv.innerHTML = ''; return; }

    let html = `<span style="font-size: 13px; color: #666;">Mostrando ${inicio + 1}-${Math.min(inicio + itemsPorPagina, resultados.length)} de ${resultados.length}</span>`;
    html += `<button type="button" class="btn btn-small" onclick="paginarBusqueda(1)" ${pagina === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">«</button>`;
    html += `<button type="button" class="btn btn-small" onclick="paginarBusqueda(${pagina - 1})" ${pagina === 1 ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">‹</button>`;

    let startPage = Math.max(1, pagina - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button type="button" class="btn btn-small" onclick="paginarBusqueda(${i})" style="padding: 4px 10px; font-size: 13px; ${i === pagina ? 'background: #022859; color: white;' : ''}">${i}</button>`;
    }

    html += `<button type="button" class="btn btn-small" onclick="paginarBusqueda(${pagina + 1})" ${pagina === totalPaginas ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">›</button>`;
    html += `<button type="button" class="btn btn-small" onclick="paginarBusqueda(${totalPaginas})" ${pagina === totalPaginas ? 'disabled' : ''} style="padding: 4px 10px; font-size: 13px;">»</button>`;
    pagDiv.innerHTML = html;
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('filtroNumRecepcion').value = '';
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroEmpresa').value = '';
    document.getElementById('filtroEstado').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    ejecutarBusquedaAvanzada();
}

// Poblar filtro de empresas/informes en la pestaña de búsqueda
function populateFiltroEmpresas() {
    const select = document.getElementById('filtroEmpresa');
    if (!select) return;
    const casos = obtenerCasosUnificados();
    const nombres = Array.from(new Set(casos.map(c => (c.informeNombre || c.empresa || '').trim()).filter(x => x)));
    select.innerHTML = '<option value="">(Todas)</option>' + nombres.map(n => `<option value="${n}">${n}</option>`).join('');
}

// Exportar a CSV
function exportarCSV() {
    const casos = obtenerCasosUnificados();
    let csv = 'Nº Recepción,Cliente,Empresa,Fecha Recepción,Fecha Entrega,Items,Estado,Ensayos\n';
    
    casos.forEach(caso => {
        const numRecepcion = caso.quoteNumber || '';
        const cliente = caso.clienteRecepcionNombre || '';
        const empresa = caso.empresa || '';
        const fechaRecepcion = caso.fechaRecepcion || '';
        const fechaEntrega = caso.fechaEntrega || '';
        const itemCount = (caso.savedRowsData?.ensayos_acreditados ? Object.keys(caso.savedRowsData.ensayos_acreditados).length : 0) +
                         (caso.savedRowsData?.ensayos_no_acreditados ? Object.keys(caso.savedRowsData.ensayos_no_acreditados).length : 0);
        const estado = caso.signatureData?.Recepcion?.isSignature && caso.signatureData?.Entrega?.isSignature ? 'Completado' : 'En Progreso';
        
        const ensayos = [];
        if (caso.savedRowsData?.ensayos_acreditados) {
            Object.values(caso.savedRowsData.ensayos_acreditados).forEach(item => {
                ensayos.push(`${item.elemento} (${item.cantidadRecibida}/${item.cantidadEntregada})`);
            });
        }
        if (caso.savedRowsData?.ensayos_no_acreditados) {
            Object.values(caso.savedRowsData.ensayos_no_acreditados).forEach(item => {
                ensayos.push(`${item.elemento} (${item.cantidadRecibida}/${item.cantidadEntregada})`);
            });
        }
        
        csv += `"${numRecepcion}","${cliente}","${empresa}","${fechaRecepcion}","${fechaEntrega}",${itemCount},"${estado}","${ensayos.join('; ')}"\n`;
    });
    
    descargarArchivo(csv, `reporteRecepcionEntrega_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

// Exportar a Excel (usando formato CSV compatible con Excel)
function exportarExcel() {
    // Para Excel real necesitarías una librería como xlsx, por ahora usamos CSV
    alert('ℹ️ La exportación a Excel se abrirá como CSV. Para Excel completo, instala la librería XLSX.');
    exportarCSV();
}

// Función auxiliar para descargar archivos
function descargarArchivo(contenido, nombreArchivo, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Cargar caso desde historial
function cargarCasoDesdeHistorial(numRecepcion) {
    const casos = obtenerTodosCasos();
    const caso = casos.find(c => (c.cotizacion || c.quoteNumber || '').toString() === String(numRecepcion));
    if (!caso) {
        try { showNotification('❌ Caso no encontrado', 'error'); } catch(e){ alert('Caso no encontrado'); }
        return;
    }

    // Guardar caso temporalmente y abrir el formulario principal para cargarlo
    try {
        localStorage.setItem('cmr_currentCaseForReport', JSON.stringify(caso));
        // Abrir página principal y el código de index.html debe leer cmr_currentCaseForReport al cargar
        window.open('index.html', '_self');
    } catch (e) {
        // Si no se puede abrir, intentar cargar localmente (si hay formulario en esta página)
        // no queremos omitir las fechas aquí porque el usuario espera verlas
        try { loadFormData(caso, false); showNotification('✅ Caso cargado en formulario', 'success'); } catch (err) { alert('No se pudo cargar el caso: ' + (err.message || err)); }
    }
}

// Event listeners para búsqueda rápida
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchHistorial');
    if (searchInput) {
        searchInput.addEventListener('keyup', refrescarHistorial);
    }
}, { once: true });

/**
 * Sistema de Control de Sesión - Cierre por Inactividad (30 minutos)
 */
let sessionTimeout;
let warningTimeout;
let countdownInterval;
// Configurado a 30 minutos de inactividad
const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos
// Advertencia a los 25 minutos
const WARNING_TIME = 25 * 60 * 1000; // Mostrar advertencia a los 5 minutos de finalizar
const COUNTDOWN_TIME = 900; // 15 minutos de countdown

function resetSessionTimer() {
    // Limpiar temporizadores previos
    clearTimeout(sessionTimeout);
    clearTimeout(warningTimeout);
    clearInterval(countdownInterval);
    
    // Ocultar modal si está visible
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.style.display = 'none';
    
    console.log('⏱️ Temporizador de sesión reiniciado');
    
    // Configurar advertencia
    warningTimeout = setTimeout(() => {
        console.log('⚠️ Advertencia de sesión: 2 minutos restantes');
        showSessionWarning();
    }, WARNING_TIME);
    
    // Configurar cierre automático
    sessionTimeout = setTimeout(() => {
        console.log('❌ Sesión cerrada por inactividad');
        endSession();
    }, INACTIVITY_TIME);
}

function showSessionWarning() {
    const modal = document.getElementById('sessionWarningModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    let secondsLeft = COUNTDOWN_TIME;
    
    const countdownDiv = document.getElementById('sessionCountdown');
    if (countdownDiv) {
        countdownDiv.textContent = secondsLeft;
    }
    
    countdownInterval = setInterval(() => {
        secondsLeft--;
        if (countdownDiv) {
            countdownDiv.textContent = secondsLeft;
        }
        
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            endSession();
        }
    }, 1000);
}

function continueSession() {
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.style.display = 'none';
    
    clearInterval(countdownInterval);
    resetSessionTimer();
    console.log('✓ Sesión continuada por usuario');
}

function endSession() {
    clearTimeout(sessionTimeout);
    clearTimeout(warningTimeout);
    clearInterval(countdownInterval);
    
    console.log('Cerrando sesión...');
    limpiarSeccionesTablas();
    
    alert('⏰ Su sesión ha expirado por inactividad. Se reiniciará el formulario.');
    location.reload();
}

// Detectar actividad del usuario
function initializeSessionMonitoring() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'change', 'input'];
    
    events.forEach(event => {
        document.addEventListener(event, resetSessionTimer, true);
    });
    
    // Iniciar temporizador
    resetSessionTimer();
    console.log('✅ Monitoreo de sesión iniciado (30 minutos de inactividad)');
}

window.addEventListener('load', function() {
    setTimeout(limpiarSeccionesTablas, 100);
});

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada, inicializando botones de selección');
    
    // ocultar botón de importación de PDF si no tiene permisos
    // (comentado: ya no se restringe - cualquier usuario puede importar)
    // const btnImport = document.getElementById('btnImportPDF');
    // if (btnImport && !isAdminOrDirector()) {
    //     btnImport.style.display = 'none';
    // }
    
    // Inicializar monitoreo de sesión
    initializeSessionMonitoring();
    
    // Inicializar validación de fechas
    validarFechaEntrega();
    
    // Bloquear campos de firma hasta que se acepte el consentimiento
    toggleConsentFields('Recepcion');
    toggleConsentFields('Entrega');
    // Enforce: bloquear interacciones si no hay consentimiento (defensa adicional)
    enforceConsentRestrictions();

        // Verificar si el usuario puede acceder a la sección de reportes
        verificarAccesoReportes();
    
    // Inicializar los campos en modo "Mismo Cliente" por defecto
    setTimeout(() => {
        setFacturarOption('mismo');
        setInformeOption('mismo');
    }, 100);
    
    // Event listener para el select de tipo de ensayos (solo acreditados)
    const tipoEnsayosSelect = document.getElementById('tipoEnsayos');
    if (tipoEnsayosSelect) {
        tipoEnsayosSelect.addEventListener('change', async function() {
            const valorSeleccionado = this.value;
            const menu1 = document.getElementById('menu1');
            const quoteEl = document.getElementById('quoteNumber');
            
            console.log('Tipo de ensayo seleccionado:', valorSeleccionado);
            
            // Mostrar la tabla de ensayos alcance solo cuando se seleccione
            if (valorSeleccionado === 'acreditados' && menu1) {
                try {
                    await refreshDbUnavailableReceptionNumbers();
                } catch (error) {
                    console.warn('No se pudo refrescar la reserva de números antes de abrir Ensayos Alcance:', error);
                }

                try {
                    restoreHeldReceptionSelection();
                } catch (error) {
                    console.warn('No se pudo actualizar el número de recepción al estado más reciente:', error);
                }

                const quoteNumber = (quoteEl?.value || '').trim();

                const unavailable = getUnavailableReceptionNumbers();
                const normalizedQuote = normalizeReceptionNumber(quoteNumber);

                if (!quoteNumber || !unavailable.has(normalizedQuote)) {
                    setTipoEnsayosAlert('Primero bloquea el número de recepción para poder continuar con Ensayos Alcance.', 'warning');
                    showNotification('⚠️ Primero bloquea el número de recepción para poder continuar con Ensayos Alcance.', 'warning');
                    this.value = '';
                    menu1.style.display = 'none';
                    return;
                }

                setTipoEnsayosAlert(`El número ${quoteNumber} ya está bloqueado. Puedes continuar con Ensayos Alcance.`, 'success');
                showNotification(`✅ El número ${quoteNumber} ya está bloqueado. Puedes continuar con Ensayos Alcance.`, 'success');
                console.log('Mostrando tabla de Ensayos Alcance');
                menu1.style.display = 'block';
                cargarEnsayosAcreditados();
                // Inicializar filtros después de cargar la tabla
                setTimeout(() => {
                    initializeFilterEventListeners();
                }, 100);
            } else if (menu1 && !isLoadingCase) {
                // Guardar los datos de la tabla antes de ocultar menu1
                try { saveCurrentTableData('ensayos_acreditados'); } catch (e) { console.warn('Error guardando datos antes de ocultar menu1', e); }
                // Solo ocultar menu1 si NO estamos en modo caso cargado
                menu1.style.display = 'none';
                setTipoEnsayosAlert('');
            }
        });
    }
    
    // Inicializar sistema de guardado de filas
    initializeSaveSystem();
});

/**
 * Actualiza los controles de paginación de manera profesional
 * @param {string} paginationId - ID del contenedor de paginación
 * @param {number} totalPages - Número total de páginas
 * @param {number} currentPage - Página actual
 * @param {Function} onPageChange - Función callback para cambio de página
 */
function updatePaginationControls(paginationId, totalPages, currentPage, onPageChange) {
    const paginationContainer = document.getElementById(paginationId);
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';

    // Crear estructura de paginación profesional
    const paginationWrapper = document.createElement('div');
    paginationWrapper.className = 'pagination-wrapper';
    paginationWrapper.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        margin: 20px 0;
        flex-wrap: wrap;
    `;

    // Botón Anterior
    const prevBtn = createPaginationButton('«', currentPage > 1 ? currentPage - 1 : null, onPageChange);
    prevBtn.disabled = currentPage === 1;
    prevBtn.title = 'Página anterior';
    paginationWrapper.appendChild(prevBtn);

    // Lógica de páginas a mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Ajustar para mostrar siempre 5 páginas si es posible
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }

    // Primera página y ellipsis
    if (startPage > 1) {
        paginationWrapper.appendChild(createPaginationButton('1', 1, onPageChange));
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.style.cssText = 'padding: 8px 4px; color: #666; user-select: none;';
            paginationWrapper.appendChild(ellipsis);
        }
    }

    // Páginas del rango principal
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPaginationButton(i.toString(), i, onPageChange);
        if (i === currentPage) {
            pageBtn.classList.add('active');
            pageBtn.style.backgroundColor = '#022859';
            pageBtn.style.color = 'white';
            pageBtn.style.borderColor = '#022859';
        }
        paginationWrapper.appendChild(pageBtn);
    }

    // Ellipsis y última página
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.style.cssText = 'padding: 8px 4px; color: #666; user-select: none;';
            paginationWrapper.appendChild(ellipsis);
        }
        paginationWrapper.appendChild(createPaginationButton(totalPages.toString(), totalPages, onPageChange));
    }

    // Botón Siguiente
    const nextBtn = createPaginationButton('»', currentPage < totalPages ? currentPage + 1 : null, onPageChange);
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.title = 'Página siguiente';
    paginationWrapper.appendChild(nextBtn);

    // Información de página
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.style.cssText = `
        margin-left: 15px;
        padding: 8px 12px;
        background-color: #f8f9fa;
        border-radius: 4px;
        font-size: 14px;
        color: #666;
        white-space: nowrap;
    `;
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    paginationWrapper.appendChild(pageInfo);

    paginationContainer.appendChild(paginationWrapper);
}

/**
 * Crea un botón de paginación con estilos profesionales
 * @param {string} text - Texto del botón
 * @param {number|null} page - Número de página (null para botones deshabilitados)
 * @param {Function} onPageChange - Función callback
 * @returns {HTMLButtonElement} Botón de paginación
 */
function createPaginationButton(text, page, onPageChange) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'pagination-btn';
    button.style.cssText = `
        min-width: 35px;
        height: 35px;
        border: 1px solid #ddd;
        background-color: #fff;
        color: #333;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
    `;

    if (page !== null) {
        button.addEventListener('click', () => onPageChange(page));
        
        // Efectos hover
        button.addEventListener('mouseenter', () => {
            if (!button.classList.contains('active') && !button.disabled) {
                button.style.backgroundColor = '#e9ecef';
                button.style.borderColor = '#adb5bd';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active') && !button.disabled) {
                button.style.backgroundColor = '#fff';
                button.style.borderColor = '#ddd';
            }
        });
    } else {
        button.disabled = true;
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.5';
    }

    return button;
}

/**
 * Función para limpiar el campo de búsqueda
 * @param {string} inputId - ID del campo de búsqueda a limpiar
 */
function clearSearch(inputId) {
    const searchInput = document.getElementById(inputId);
    if (searchInput) {
        searchInput.value = '';
        
        // Determinar cuál tabla actualizar
        if (inputId === 'searchInput1') {
            // Tabla de ensayos alcance
            const activeFilterBtn = document.querySelector('#menu1 .filter-btn-1.active');
            const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            loadPredefinedItems('', filterValue, 1);
        } else if (inputId === 'searchInput2') {
            // Tabla de ensayos no acreditados
            const activeFilterBtn = document.querySelector('#menu2 .filter-btn-2.active');
            const filterValue = activeFilterBtn ? activeFilterBtn.dataset.filter : 'Todos';
            loadPredefinedItemsNoAcreditados('', filterValue, 1);
        }
        
        // Focus en el input para mejor UX
        searchInput.focus();
    }
}

// =========================================
// SISTEMA DE GUARDADO DE FILAS
// =========================================

// Variable global para almacenar los datos guardados de las filas
let savedRowsData = {
    ensayos_acreditados: {},
    ensayos_no_acreditados: {}
};

/**
 * Guarda los datos de una fila específica
 * @param {string} tableType - Tipo de tabla ('ensayos_acreditados' o 'ensayos_no_acreditados')
 * @param {number} rowIndex - Índice de la fila
 */
function saveRowData(tableType, rowIndex) {
    try {
        let rowData = {};
        
        if (tableType === 'ensayos_acreditados') {
            // Obtener datos de la tabla de ensayos alcance
            const cantRecibida = document.getElementById(`qty_${rowIndex}`)?.value || '0';
            const cantEntregada = document.getElementById(`qty_2_${rowIndex}`)?.value || '0';
            const cantNoUsado = document.getElementById(`qty_3_${rowIndex}`)?.value || '0';
            const cantUsado = document.getElementById(`qty_4_${rowIndex}`)?.value || '0';
            const cantLavados = document.getElementById(`status_${rowIndex}`)?.value || '0';
            const observaciones = document.getElementById(`observaciones_${rowIndex}`)?.value || '';
            
            rowData = {
                cantRecibida,
                cantEntregada,
                cantNoUsado,
                cantUsado,
                cantLavados,
                observaciones,
                timestamp: new Date().toISOString(),
                saved: true
            };
        } else if (tableType === 'ensayos_no_acreditados') {
            // Obtener datos de la tabla de ensayos no acreditados
            const cantRecibida = document.getElementById(`qty2_${rowIndex}`)?.value || '0';
            const cantEntregada = document.getElementById(`qty2_2_${rowIndex}`)?.value || '0';
            const cantNoUsado = document.getElementById(`qty2_3_${rowIndex}`)?.value || '0';
            const cantUsado = document.getElementById(`qty2_4_${rowIndex}`)?.value || '0';
            const cantLavados = document.getElementById(`status2_${rowIndex}`)?.value || '0';
            const observaciones = document.getElementById(`observaciones2_${rowIndex}`)?.value || '';
            
            rowData = {
                cantRecibida,
                cantEntregada,
                cantNoUsado,
                cantUsado,
                cantLavados,
                observaciones,
                timestamp: new Date().toISOString(),
                saved: true
            };
        }
        
        // Guardar en la variable global (usar clave consistente 'row_X')
        if (!savedRowsData[tableType]) {
            savedRowsData[tableType] = {};
        }
        const saveKey = `row_${rowIndex}`;
        savedRowsData[tableType][saveKey] = rowData;
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('savedRowsData', JSON.stringify(savedRowsData));
        
        // Actualizar UI para mostrar que está guardado y deshabilitar la fila
        updateRowSaveStatus(tableType, rowIndex, true);
        disableRowEditing(tableType, rowIndex);
        
        // Actualizar vista previa de elementos guardados
        updateSavedItemsPreview();
        
        // Actualizar cantidad de lavados
        actualizarCantidadLavados();
        
        // Actualizar totales
        updateTotals();
        
        // Mostrar mensaje de éxito
        showSaveMessage(`Fila guardada exitosamente`, 'success');
        
        console.log(`Fila ${rowIndex} guardada para ${tableType}:`, rowData);
        
    } catch (error) {
        console.error('Error al guardar la fila:', error);
        showSaveMessage('Error al guardar la fila', 'error');
    }
}

/**
 * Carga los datos guardados de una fila específica
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 */
function loadRowData(tableType, rowIndex) {
    try {
        // Buscar con el formato "row_X" en savedRowsData
        const rowKey = `row_${rowIndex}`;
        const savedData = savedRowsData[tableType] && savedRowsData[tableType][rowKey];
        
        if (savedData) {
            if (tableType === 'ensayos_acreditados') {
                // Cargar datos en la tabla de ensayos acreditados
                const cantRecibida = document.getElementById(`qty_${rowIndex}`);
                const cantEntregada = document.getElementById(`qty_2_${rowIndex}`);
                const cantNoUsado = document.getElementById(`qty_3_${rowIndex}`);
                const cantUsado = document.getElementById(`qty_4_${rowIndex}`);
                const cantLavados = document.getElementById(`status_${rowIndex}`);
                const observaciones = document.getElementById(`observaciones_${rowIndex}`);
                
                if (cantRecibida) cantRecibida.value = savedData.cantRecibida;
                if (cantEntregada) cantEntregada.value = savedData.cantEntregada;
                if (cantNoUsado) cantNoUsado.value = savedData.cantNoUsado;
                if (cantUsado) cantUsado.value = savedData.cantUsado;
                if (cantLavados) cantLavados.value = savedData.cantLavados;
                if (observaciones) observaciones.value = savedData.observaciones;
                
            } else if (tableType === 'ensayos_no_acreditados') {
                // Cargar datos en la tabla de ensayos no acreditados
                const cantRecibida = document.getElementById(`qty2_${rowIndex}`);
                const cantEntregada = document.getElementById(`qty2_2_${rowIndex}`);
                const cantNoUsado = document.getElementById(`qty2_3_${rowIndex}`);
                const cantUsado = document.getElementById(`qty2_4_${rowIndex}`);
                const cantLavados = document.getElementById(`status2_${rowIndex}`);
                const observaciones = document.getElementById(`observaciones2_${rowIndex}`);
                
                if (cantRecibida) cantRecibida.value = savedData.cantRecibida;
                if (cantEntregada) cantEntregada.value = savedData.cantEntregada;
                if (cantNoUsado) cantNoUsado.value = savedData.cantNoUsado;
                if (cantUsado) cantUsado.value = savedData.cantUsado;
                if (cantLavados) cantLavados.value = savedData.cantLavados;
                if (observaciones) observaciones.value = savedData.observaciones;
            }
            
            // Actualizar UI para mostrar que está guardado
            updateRowSaveStatus(tableType, rowIndex, true);
            
            console.log(`Datos cargados para fila ${rowIndex} en ${tableType}`);
        }
    } catch (error) {
        console.error('Error al cargar los datos de la fila:', error);
    }
}

// =======================================================
// SISTEMA DE VALIDACIONES ROBUSTAS
// =======================================================

/**
 * Valida formato de cédula colombiana
 * @param {string} cedula - Número de cédula a validar
 * @returns {boolean} True si es válida
 */
function validarCedula(cedula) {
    if (!cedula) return false;
    
    // Eliminar espacios y caracteres no numéricos excepto guiones
    const clean = cedula.replace(/[^\d]/g, '');
    
    // Debe tener entre 7 y 10 dígitos
    if (clean.length < 7 || clean.length > 10) return false;
    
    // No puede ser todo ceros o números consecutivos obvios
    if (/^0+$/.test(clean) || /^1+$/.test(clean) || /^123456789/.test(clean)) return false;
    
    return true;
}

/**
 * Valida formato de NIT colombiano
 * Acepta NITs con o sin dígito de verificación
 * @param {string} nit - NIT a validar
 * @returns {boolean} True si es válido
 */
function validarNIT(nit) {
    if (!nit) return false;
    
    // Eliminar espacios, puntos y guiones
    const clean = nit.replace(/[\s.\-]/g, '');
    
    // Solo dígitos
    if (!/^\d+$/.test(clean)) return false;
    
    // Acepta entre 8 y 11 dígitos (cédula: 8-10, NIT: 9-11)
    if (clean.length < 8 || clean.length > 11) return false;
    
    return true;
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function validarEmail(email) {
    if (!email) return false;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Valida que una fecha no sea futura
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {boolean} True si es válida
 */
function validarFechaNoFutura(fecha) {
    if (!fecha) return false;
    
    const fechaInput = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    return fechaInput <= hoy;
}

/**
 * Valida campos obligatorios del formulario
 * @returns {Object} Resultado de validación
 */
function validarFormularioCompleto() {
    const errores = [];
    const warnings = [];
    
    // 1. Validar campos básicos obligatorios
    const cotizacion = document.getElementById('quoteNumber')?.value?.trim();
    const fechaRecepcion = document.getElementById('fechaRecepcion')?.value;
    const empresaSelect = document.getElementById('empresaSelect');
    const remision = document.getElementById('facturar')?.value?.trim();
    
    if (!cotizacion) {
        errores.push('El número de recepción es obligatorio');
    }
    
    if (!fechaRecepcion) {
        errores.push('La fecha de recepción es obligatoria');
    } else if (!validarFechaNoFutura(fechaRecepcion)) {
        errores.push('La fecha de recepción no puede ser futura');
    }
    
    if (!empresaSelect || empresaSelect.selectedIndex === 0) {
        errores.push('Debe seleccionar una empresa cliente');
    }
    
    if (!remision) {
        errores.push('El número de remisión es obligatorio');
    }
    
    // 2. Validar datos de empresa
    const nit = document.getElementById('nitEmpresa')?.value?.trim();
    if (nit && !validarNIT(nit)) {
        errores.push('El formato del NIT no es válido');
    }
    
    // 3. Validar emails
    const clienteEmail = document.getElementById('clienteEmail')?.value?.trim();
    const empresaEmail = document.getElementById('empresaEmail')?.value?.trim();
    const copiaEmail = document.getElementById('copiaEmail')?.value?.trim();
    
    if (clienteEmail && !validarEmail(clienteEmail)) {
        errores.push('El email del cliente no tiene un formato válido');
    }
    
    if (empresaEmail && !validarEmail(empresaEmail)) {
        errores.push('El email de la empresa no tiene un formato válido');
    }
    
    if (copiaEmail && !validarEmail(copiaEmail)) {
        errores.push('El email de copia no tiene un formato válido');
    }
    
    // 4. Validar cédulas en firmas
    const cedulaRecepcion = document.getElementById('clienteRecepcionCedula')?.value?.trim();
    const cedulaEntrega = document.getElementById('clienteEntregaCedula')?.value?.trim();
    
    if (cedulaRecepcion && !validarCedula(cedulaRecepcion)) {
        errores.push('La cédula de recepción no tiene un formato válido');
    }
    
    if (cedulaEntrega && !validarCedula(cedulaEntrega)) {
        errores.push('La cédula de entrega no tiene un formato válido');
    }
    
    // 5. Validar que hay elementos seleccionados
    const formData = collectFormData();
    if (!formData.items || formData.items.length === 0) {
        warnings.push('No se han seleccionado elementos para recepción/entrega');
    }
    
    // 6. Validar firmas obligatorias
    const hasSignature = Object.values(signatureData).some(data => data !== null && data !== undefined);
    if (!hasSignature) {
        warnings.push('Se recomienda agregar al menos una firma digital');
    }
    
    return {
        valido: errores.length === 0,
        errores: errores,
        warnings: warnings
    };
}

/**
 * Valida un campo específico y muestra el resultado visualmente
 * @param {string} fieldId - ID del campo a validar
 * @param {Function} validator - Función de validación
 * @param {string} errorMessage - Mensaje de error
 */
function validarCampoEnTiempoReal(fieldId, validator, errorMessage) {
    const campo = document.getElementById(fieldId);
    if (!campo) return;
    
    const valor = campo.value.trim();
    const esValido = valor === '' || validator(valor);
    
    // Actualizar estilos visuales
    if (esValido) {
        campo.style.borderColor = '#28a745';
        campo.style.backgroundColor = '#f8fff9';
        campo.title = '';
    } else {
        campo.style.borderColor = '#dc3545';
        campo.style.backgroundColor = '#fff8f8';
        campo.title = errorMessage;
    }
    
    // Mostrar/ocultar mensaje de error
    let errorDiv = document.getElementById(fieldId + '_error');
    if (!esValido) {
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = fieldId + '_error';
            errorDiv.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 2px;';
            campo.parentNode.insertBefore(errorDiv, campo.nextSibling);
        }
        errorDiv.textContent = errorMessage;
    } else if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Aplica validación en tiempo real a un campo
 * @param {string} fieldId - ID del campo
 * @param {Function} validator - Función validadora
 * @param {string} errorMessage - Mensaje de error
 */
function aplicarValidacionTiempoReal(fieldId, validator, errorMessage) {
    const campo = document.getElementById(fieldId);
    if (!campo) return;
    
    // Validar al salir del campo (blur)
    campo.addEventListener('blur', () => {
        validarCampoEnTiempoReal(fieldId, validator, errorMessage);
    });
    
    // Limpiar errores al empezar a escribir
    campo.addEventListener('input', () => {
        if (campo.style.borderColor === 'rgb(220, 53, 69)') {
            campo.style.borderColor = '';
            campo.style.backgroundColor = '';
            campo.title = '';
            
            const errorDiv = document.getElementById(fieldId + '_error');
            if (errorDiv) errorDiv.remove();
        }
    });
}

/**
 * Valida el formulario antes de generar PDF
 * @returns {boolean} True si puede continuar
 */
function validarAntesDeGenerarPDF() {
    const validacion = validarFormularioCompleto();
    
    if (!validacion.valido) {
        let mensaje = '❌ Corrija los siguientes errores antes de generar el PDF:\n\n';
        validacion.errores.forEach((error, index) => {
            mensaje += `${index + 1}. ${error}\n`;
        });
        
        alert(mensaje);
        return false;
    }
    
    if (validacion.warnings.length > 0) {
        let mensaje = '⚠️ Advertencias:\n\n';
        validacion.warnings.forEach((warning, index) => {
            mensaje += `${index + 1}. ${warning}\n`;
        });
        mensaje += '\n¿Desea continuar de todos modos?';
        
        return confirm(mensaje);
    }
    
    return true;
}

/**
 * Formatea automáticamente campos mientras el usuario escribe
 */
function aplicarFormateoAutomatico() {
    // Formateo de cédulas
    document.addEventListener('input', function(e) {
        if (e.target.id === 'clienteRecepcionCedula' || e.target.id === 'clienteEntregaCedula') {
            // Eliminar caracteres no numéricos
            let valor = e.target.value.replace(/\D/g, '');
            // Limitar a 10 dígitos
            if (valor.length > 10) valor = valor.slice(0, 10);
            // Formatear con puntos cada 3 dígitos desde la derecha
            valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            e.target.value = valor;
        }
    });
    
    // Formateo de NIT
    document.addEventListener('input', function(e) {
        if (e.target.id === 'nitEmpresa') {
            let valor = e.target.value.replace(/[^\d\-]/g, '');
            // Formatear NIT: XXXXXXXXX-X
            if (valor.length >= 9 && !valor.includes('-')) {
                const numero = valor.slice(0, -1);
                const digito = valor.slice(-1);
                valor = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + digito;
            }
            e.target.value = valor;
        }
    });
    
    // Formateo de emails (convertir a minúsculas)
    document.addEventListener('input', function(e) {
        if (e.target.type === 'email' || e.target.id.includes('Email')) {
            e.target.value = e.target.value.toLowerCase();
        }
    });
}

// =======================================================
// INICIALIZACIÓN DE VALIDACIONES
// =======================================================

/**
 * Inicializa todas las validaciones cuando la página se carga
 */
function inicializarValidaciones() {
    console.log('🔒 Inicializando sistema de validaciones robustas...');
    
    // Aplicar formateo automático
    aplicarFormateoAutomatico();
    
    // Configurar validaciones en tiempo real
    aplicarValidacionTiempoReal('clienteRecepcionCedula', validarCedula, 'Formato de cédula inválido (7-10 dígitos)');
    aplicarValidacionTiempoReal('clienteEntregaCedula', validarCedula, 'Formato de cédula inválido (7-10 dígitos)');
    aplicarValidacionTiempoReal('nitEmpresa', validarNIT, 'Formato de NIT inválido');
    aplicarValidacionTiempoReal('clienteEmail', validarEmail, 'Formato de email inválido');
    aplicarValidacionTiempoReal('empresaEmail', validarEmail, 'Formato de email inválido');
    aplicarValidacionTiempoReal('copiaEmail', validarEmail, 'Formato de email inválido');
    
    // Validar fecha de recepción
    aplicarValidacionTiempoReal('fechaRecepcion', validarFechaNoFutura, 'La fecha no puede ser futura');
    
    console.log('✅ Sistema de validaciones inicializado correctamente');
}

// Integrar validaciones con las funciones de PDF existentes
const generatePDFOriginal = generatePDF;
generatePDF = function() {
    // Verificar autenticación
    if (typeof currentUser === 'function' && !currentUser()) {
        showNotification('❌ Debe iniciar sesión para generar PDFs', 'error');
        return;
    }
    
    if (typeof hasPermission === 'function' && !hasPermission('crear')) {
        showNotification('❌ No tiene permisos para generar PDFs', 'error');
        return;
    }

    // Validar formulario
    if (validarAntesDeGenerarPDF()) {
        // Registrar actividad si el sistema está disponible
        if (typeof logUserActivity === 'function') {
            logUserActivity('generate_pdf_complete', 'PDF completo generado');
        }
        
        generatePDFOriginal();
    }
};

const generatePDFRecepcionOriginal = generatePDFRecepcion;
generatePDFRecepcion = function() {
    // Verificar autenticación
    if (typeof currentUser === 'function' && !currentUser()) {
        showNotification('❌ Debe iniciar sesión para generar PDFs', 'error');
        return;
    }
    
    if (typeof hasPermission === 'function' && !hasPermission('crear')) {
        showNotification('❌ No tiene permisos para generar PDFs', 'error');
        return;
    }

    // Validar formulario
    if (validarAntesDeGenerarPDF()) {
        // Registrar actividad si el sistema está disponible
        if (typeof logUserActivity === 'function') {
            logUserActivity('generate_pdf_recepcion', 'PDF de recepción generado');
        }
        
        generatePDFRecepcionOriginal();
    }
};

// Inicializar validaciones cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(inicializarValidaciones, 500);
});

console.log('🔒 Sistema de validaciones robustas cargado');

/**
 * Actualiza el estado visual del botón de guardar
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 * @param {boolean} isSaved - Si la fila está guardada
 */
function updateRowSaveStatus(tableType, rowIndex, isSaved) {
    const tableSelector = tableType === 'ensayos_acreditados' ? '#itemsList' : '#itemsList2';
    const rowEl = document.querySelector(`${tableSelector} .items-grid[data-row-index="${rowIndex}"]`);

    // Buscar los botones en ambas tablas
    const saveButton = document.querySelector(`button.guardar-fila-btn[data-index="${rowIndex}"]`);
    const editButton = document.querySelector(`button.editar-fila-btn[data-index="${rowIndex}"]`);
    
    // Determinar el prefijo del indicador según el tipo de tabla
    const indicatorPrefix = tableType === 'ensayos_no_acreditados' ? 'saved-indicator-noacred' : 'saved-indicator';
    const savedIndicator = document.getElementById(`${indicatorPrefix}-${rowIndex}`);
    
    if (saveButton && editButton) {
        if (isSaved) {
            // Ocultar botón de guardar y mostrar botón de editar
            saveButton.style.display = 'none';
            editButton.style.display = 'inline-flex';
            saveButton.classList.add('saved');
            // Mostrar el candado
            if (savedIndicator) {
                savedIndicator.style.display = 'inline-block';
            }
        } else {
            // Mostrar botón de guardar y ocultar botón de editar
            saveButton.style.display = 'inline-flex';
            editButton.style.display = 'none';
            saveButton.classList.remove('saved');
            // Ocultar el candado
            if (savedIndicator) {
                savedIndicator.style.display = 'none';
            }
        }
    }

    // Mantener estado visual de fila guardada aunque no existan botones legacy.
    if (rowEl) {
        rowEl.classList.toggle('row-saved', Boolean(isSaved));
    }
}

/**
 * Edita una fila guardada (habilita la edición)
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 */
function editRowData(tableType, rowIndex) {
    // Primero cargar los datos guardados en los inputs (si existen)
    loadRowData(tableType, rowIndex);
    
    // Habilitar edición de la fila
    enableRowEditing(tableType, rowIndex);
    
    // Marcar como no guardado para permitir edición
    // rowIndex es un número, pero en savedRowsData están guardados como "row_X"
    const rowKey = `row_${rowIndex}`;
    if (savedRowsData[tableType] && savedRowsData[tableType][rowKey]) {
        savedRowsData[tableType][rowKey].saved = false;
        // Actualizar localStorage
        localStorage.setItem('savedRowsData', JSON.stringify(savedRowsData));
    }
    
    // Actualizar UI
    updateRowSaveStatus(tableType, rowIndex, false);
    
    // Actualizar vista previa de elementos guardados
    updateSavedItemsPreview();
    
    // Actualizar cantidad de lavados
    actualizarCantidadLavados();
    
    showSaveMessage('Modo de edición activado', 'info');
}

/**
 * Deshabilita la edición de una fila (después de guardar)
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 */
function disableRowEditing(tableType, rowIndex) {
    // Obtener todos los inputs de la fila
    let rowInputs = [];
    
    if (tableType === 'ensayos_acreditados') {
        rowInputs = [
            document.getElementById(`qty_${rowIndex}`),
            document.getElementById(`qty_2_${rowIndex}`),
            document.getElementById(`qty_3_${rowIndex}`),
            document.getElementById(`qty_4_${rowIndex}`),
            document.getElementById(`status_${rowIndex}`),
            document.getElementById(`observaciones_${rowIndex}`)
        ];
    } else if (tableType === 'ensayos_no_acreditados') {
        rowInputs = [
            document.getElementById(`qty2_${rowIndex}`),
            document.getElementById(`qty2_2_${rowIndex}`),
            document.getElementById(`qty2_3_${rowIndex}`),
            document.getElementById(`qty2_4_${rowIndex}`),
            document.getElementById(`status2_${rowIndex}`),
            document.getElementById(`observaciones2_${rowIndex}`)
        ];
    }
    
    // Deshabilitar todos los inputs
    rowInputs.forEach(input => {
        if (input) {
            input.disabled = true;
            input.style.backgroundColor = '#f8f9fa';
            input.style.color = '#6c757d';
            input.style.cursor = 'not-allowed';
        }
    });
    
    // Encontrar el contenedor de la fila y agregar clase de deshabilitado
    const firstInput = rowInputs.find(input => input !== null);
    if (firstInput) {
        const rowContainer = firstInput.closest('.items-grid');
        if (rowContainer) {
            rowContainer.classList.add('row-disabled');
            // No eliminar row-saved para conservar el color al cambiar filtros o buscar.
        }
    }
}

/**
 * Habilita la edición de una fila guardada
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 */
function enableRowEditing(tableType, rowIndex) {
    // Obtener todos los inputs de la fila
    let rowInputs = [];
    
    if (tableType === 'ensayos_acreditados') {
        rowInputs = [
            document.getElementById(`qty_${rowIndex}`),
            document.getElementById(`qty_2_${rowIndex}`),
            document.getElementById(`qty_3_${rowIndex}`),
            document.getElementById(`qty_4_${rowIndex}`),
            document.getElementById(`status_${rowIndex}`),
            document.getElementById(`observaciones_${rowIndex}`)
        ];
    } else if (tableType === 'ensayos_no_acreditados') {
        rowInputs = [
            document.getElementById(`qty2_${rowIndex}`),
            document.getElementById(`qty2_2_${rowIndex}`),
            document.getElementById(`qty2_3_${rowIndex}`),
            document.getElementById(`qty2_4_${rowIndex}`),
            document.getElementById(`status2_${rowIndex}`),
            document.getElementById(`observaciones2_${rowIndex}`)
        ];
    }
    
    // Habilitar todos los inputs
    rowInputs.forEach(input => {
        if (input) {
            input.disabled = false;
            input.style.backgroundColor = '';
            input.style.color = '';
            input.style.cursor = '';
        }
    });
    
    // Encontrar el contenedor de la fila y remover clase de deshabilitado
    const firstInput = rowInputs.find(input => input !== null);
    if (firstInput) {
        const rowContainer = firstInput.closest('.items-grid');
        if (rowContainer) {
            rowContainer.classList.remove('row-disabled');
            rowContainer.classList.remove('row-saved');
        }
    }
}

/**
 * Carga todos los datos guardados desde localStorage
 */
function loadAllSavedData() {
    try {
        const saved = localStorage.getItem('savedRowsData');
        if (saved) {
            savedRowsData = JSON.parse(saved);
            console.log('Datos guardados cargados:', savedRowsData);
        }
    } catch (error) {
        console.error('Error al cargar datos guardados:', error);
        savedRowsData = {
            ensayos_acreditados: {},
            ensayos_no_acreditados: {}
        };
    }
}

/**
 * Guarda los valores actuales de los inputs en savedRowsData antes de cambiar de filtro
 * Esto evita que se pierdan cambios cuando el usuario no ha guardado pero cambia de filtro
 * @param {string} tableType - Tipo de tabla ('ensayos_acreditados' o 'ensayos_no_acreditados')
 */
function saveCurrentTableData(tableType) {
    const itemsList = tableType === 'ensayos_acreditados' ? document.getElementById('itemsList') : document.getElementById('itemsList2');
    if (!itemsList) return;
    
    // Recorrer todas las filas visibles actualmente
    const rows = itemsList.querySelectorAll('.items-grid:not(.header)');
    rows.forEach(row => {
        // Encontrar el índice de la fila del botón guardar/editar
        const saveBtn = row.querySelector('.guardar-fila-btn');
        if (saveBtn) {
            const index = parseInt(saveBtn.getAttribute('data-index'));
            
            // Obtener los inputs según el tipo de tabla
            let qtyInput, qty2Input, qty3Input, qty4Input, statusInput, obsInput;
            if (tableType === 'ensayos_acreditados') {
                qtyInput = row.querySelector(`#qty_${index}`);
                qty2Input = row.querySelector(`#qty_2_${index}`);
                qty3Input = row.querySelector(`#qty_3_${index}`);
                qty4Input = row.querySelector(`#qty_4_${index}`);
                statusInput = row.querySelector(`#status_${index}`);
                obsInput = row.querySelector(`#observaciones_${index}`);
            } else {
                qtyInput = row.querySelector(`#qty2_${index}`);
                qty2Input = row.querySelector(`#qty2_2_${index}`);
                qty3Input = row.querySelector(`#qty2_3_${index}`);
                qty4Input = row.querySelector(`#qty2_4_${index}`);
                statusInput = row.querySelector(`#status2_${index}`);
                obsInput = row.querySelector(`#observaciones2_${index}`);
            }
            
            // Si hay valores en los inputs, guardarlos
            const hasValues = (qtyInput?.value) || (qty2Input?.value) || (qty3Input?.value) || (qty4Input?.value) || (obsInput?.value);
            if (hasValues) {
                // Inicializar el objeto si no existe
                if (!savedRowsData[tableType][`row_${index}`]) {
                    savedRowsData[tableType][`row_${index}`] = {};
                }
                
                // Actualizar con los valores actuales
                savedRowsData[tableType][`row_${index}`].cantRecibida = parseInt(qtyInput?.value) || 0;
                savedRowsData[tableType][`row_${index}`].cantEntregada = parseInt(qty2Input?.value) || 0;
                savedRowsData[tableType][`row_${index}`].cantNoUsado = parseInt(qty3Input?.value) || 0;
                savedRowsData[tableType][`row_${index}`].cantUsado = parseInt(qty4Input?.value) || 0;
                savedRowsData[tableType][`row_${index}`].cantLavados = parseInt(statusInput?.value) || 0;
                savedRowsData[tableType][`row_${index}`].observaciones = obsInput?.value || '';
                
                // Detectar si está en modo edición (botón de guardar visible) o guardado (botón de editar visible)
                const editBtn = row.querySelector('.editar-fila-btn');
                const isSaved = editBtn && editBtn.style.display !== 'none';
                savedRowsData[tableType][`row_${index}`].saved = isSaved;
            }
        }
    });
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('savedRowsData', JSON.stringify(savedRowsData));
    console.log('✅ Datos actuales guardados antes de cambiar filtro');
}

/**
 * Aplica los datos guardados a las filas cuando se cargan las tablas
 * @param {string} tableType - Tipo de tabla
 */
function applySavedDataToTable(tableType) {
    if (savedRowsData[tableType]) {
        Object.keys(savedRowsData[tableType]).forEach(rowIndex => {
            const rowData = savedRowsData[tableType][rowIndex];
            // Extraer el número de "row_0", "row_1", etc.
            const numericIndex = rowIndex.replace(/^row_/, '');
            
            // Cargar los datos en la fila
            loadRowData(tableType, numericIndex);
            
            // Si está guardado, aplicar estado de guardado y deshabilitar
            if (rowData && rowData.saved) {
                setTimeout(() => {
                    updateRowSaveStatus(tableType, numericIndex, true);
                    disableRowEditing(tableType, numericIndex);
                }, 150);
            } else if (rowData && !rowData.saved) {
                // Si tiene datos pero NO está guardado, mostrar en modo edición
                setTimeout(() => {
                    updateRowSaveStatus(tableType, numericIndex, false);
                    enableRowEditing(tableType, numericIndex);
                }, 150);
            }
        });
        
        // Actualizar totales después de aplicar datos guardados
        setTimeout(() => {
            updateTotals();
            updateSavedItemsPreview();
        }, 200);
    }
}

/**
 * Muestra un mensaje de estado para el guardado
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('success', 'error', 'info')
 */
function showSaveMessage(message, type) {
    // Crear elemento de mensaje si no existe
    let messageDiv = document.getElementById('saveMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'saveMessage';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;
        document.body.appendChild(messageDiv);
    }
    
    // Configurar colores según el tipo
    let backgroundColor, textColor;
    switch (type) {
        case 'success':
            backgroundColor = '#28a745';
            textColor = 'white';
            break;
        case 'error':
            backgroundColor = '#dc3545';
            textColor = 'white';
            break;
        case 'info':
            backgroundColor = '#17a2b8';
            textColor = 'white';
            break;
        default:
            backgroundColor = '#6c757d';
            textColor = 'white';
    }
    
    messageDiv.style.backgroundColor = backgroundColor;
    messageDiv.style.color = textColor;
    messageDiv.textContent = message;
    
    // Animar entrada
    messageDiv.style.transform = 'translateX(0)';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
    }, 3000);
}

/**
 * Inicializa el sistema de guardado de filas
 * Configura event listeners y carga datos guardados
 */
function initializeSaveSystem() {
    // Cargar datos guardados al inicializar
    loadAllSavedData();
    
    // Configurar event listeners para botones usando delegación de eventos
    document.addEventListener('click', function(e) {
        // Abrir gestión de unidades resumidas
        const manageUnitsButton = e.target.closest('.manage-units-btn');
        if (manageUnitsButton) {
            e.preventDefault();
            e.stopPropagation();

            const tableType = manageUnitsButton.getAttribute('data-table-type');
            const dataIndex = manageUnitsButton.getAttribute('data-index');
            if (tableType && dataIndex !== null) {
                openUnitManager(tableType, parseInt(dataIndex, 10));
            }
            return;
        }

        // Manejar botón de guardar
        if (e.target.classList.contains('guardar-fila-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const dataIndex = e.target.getAttribute('data-index');
            if (dataIndex === null) return;
            
            const index = parseInt(dataIndex);
            
            // Determinar el tipo de tabla basándose en el contenedor padre
            let tableType = '';
            const itemsListContainer = e.target.closest('#itemsList');
            const itemsList2Container = e.target.closest('#itemsList2');
            
            if (itemsListContainer) {
                tableType = 'ensayos_acreditados';
            } else if (itemsList2Container) {
                tableType = 'ensayos_no_acreditados';
            }
            
            if (tableType && index >= 0) {
                saveRowData(tableType, index);
            }
        }
        
        // Manejar botón de editar
        if (e.target.classList.contains('editar-fila-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const dataIndex = e.target.getAttribute('data-index');
            if (dataIndex === null) return;
            
            const index = parseInt(dataIndex);
            
            // Determinar el tipo de tabla basándose en el contenedor padre
            let tableType = '';
            const itemsListContainer = e.target.closest('#itemsList');
            const itemsList2Container = e.target.closest('#itemsList2');
            
            if (itemsListContainer) {
                tableType = 'ensayos_acreditados';
            } else if (itemsList2Container) {
                tableType = 'ensayos_no_acreditados';
            }
            
            if (tableType && index >= 0) {
                editRowData(tableType, index);
            }
        }
    });
    
    // Inicializar vista previa de elementos guardados
    initializeSavedItemsPreview();
    
    console.log('Sistema de guardado de filas inicializado');
}

/**
 * Carga todos los datos guardados y los aplica a las tablas
 */
function loadAllSavedData() {
    try {
        const savedData = localStorage.getItem('savedRowsData');
        if (!savedData) {
            savedRowsData = {
                ensayos_acreditados: {},
                ensayos_no_acreditados: {}
            };
            return;
        }
        
        savedRowsData = JSON.parse(savedData);
        
        // Aplicar datos guardados después de un pequeño delay para asegurar que las tablas estén cargadas
        setTimeout(() => {
            // Los datos se aplicarán automáticamente cuando se carguen las tablas
            // a través de applySavedDataToTable() en loadPredefinedItems y loadPredefinedItemsNoAcreditados
            updateSavedItemsPreview();
            updateTotals();
            console.log('Datos guardados cargados exitosamente:', savedRowsData);
        }, 500);
        
    } catch (error) {
        console.error('Error al cargar datos guardados:', error);
        savedRowsData = {
            ensayos_acreditados: {},
            ensayos_no_acreditados: {}
        };
    }
}

/**
 * Aplica datos guardados a una fila específica
 * @param {string} tableType - Tipo de tabla ('acreditados' o 'noAcreditados')
 * @param {number} rowIndex - Índice de la fila
 * @param {Object} rowData - Datos guardados de la fila
 */
function applySavedDataToRow(tableType, rowIndex, rowData) {
    try {
        let table;
        if (tableType === 'acreditados') {
            table = document.querySelector('#acreditadosTable tbody');
        } else if (tableType === 'noAcreditados') {
            table = document.querySelector('#noAcreditadosTable tbody');
        }
        
        if (!table) return;
        
        const row = table.children[rowIndex];
        if (!row) return;
        
        // Aplicar los valores guardados a los inputs de la fila
        Object.keys(rowData).forEach(fieldName => {
            const input = row.querySelector(`[name="${fieldName}"]`);
            if (input) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = rowData[fieldName];
                } else {
                    input.value = rowData[fieldName];
                }
            }
        });
        
        // Marcar la fila como guardada visualmente
        const saveBtn = row.querySelector('.guardar-fila-btn');
        if (saveBtn) {
            saveBtn.textContent = '✓ Guardado';
            saveBtn.classList.add('saved');
            row.classList.add('row-saved');
        }
        
    } catch (error) {
        console.error('Error al aplicar datos guardados a la fila:', error);
    }
}

/* =========================================
   VISTA PREVIA DE ELEMENTOS GUARDADOS
========================================= */

/**
 * Inicializa la vista previa de elementos guardados
 */
function initializeSavedItemsPreview() {
    const toggleBtn = document.getElementById('toggleSavedItems');
    const container = document.getElementById('savedItemsContainer');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            if (container.style.display === 'none') {
                container.style.display = 'block';
                updateSavedItemsPreview();
            } else {
                container.style.display = 'none';
            }
        });
    }
    
    // Inicializar con el contenedor oculto
    if (container) {
        container.style.display = 'none';
    }
    
    // Actualizar la vista previa inicial
    updateSavedItemsPreview();
}

/**
 * Actualiza la vista previa de elementos guardados
 */
function updateSavedItemsPreview() {
    const container = document.getElementById('savedItemsContainer');
    const countElement = document.getElementById('savedItemsCount');
    const previewSection = document.getElementById('savedItemsPreview');
    
    if (!container || !countElement || !previewSection) return;
    
    let totalSavedItems = 0;
    let allItems = [];
    
    // Recopilar todos los elementos guardados
    if (savedRowsData.ensayos_acreditados) {
        Object.keys(savedRowsData.ensayos_acreditados).forEach(rowIndex => {
            const rowData = savedRowsData.ensayos_acreditados[rowIndex];
            if (rowData && rowData.saved) {
                totalSavedItems++;
                allItems.push(createSavedItemCard('ensayos_acreditados', rowIndex, rowData));
            }
        });
    }
    
    if (savedRowsData.ensayos_no_acreditados) {
        Object.keys(savedRowsData.ensayos_no_acreditados).forEach(rowIndex => {
            const rowData = savedRowsData.ensayos_no_acreditados[rowIndex];
            if (rowData && rowData.saved) {
                totalSavedItems++;
                allItems.push(createSavedItemCard('ensayos_no_acreditados', rowIndex, rowData));
            }
        });
    }
    
    // Actualizar contador
    countElement.textContent = `${totalSavedItems} elementos guardados`;
    
    // Mostrar u ocultar la sección según si hay elementos guardados
    if (totalSavedItems > 0) {
        previewSection.style.display = 'block';
        container.style.display = 'flex'; // Asegurar que sea flex para las columnas
        
        // Dividir elementos en dos columnas
        const leftItems = [];
        const rightItems = [];
        
        allItems.forEach((item, index) => {
            if (index % 2 === 0) {
                leftItems.push(item);
            } else {
                rightItems.push(item);
            }
        });
        
        // Crear HTML con dos divs (columnas)
        const htmlContent = `
            <div class="saved-items-left">
                ${leftItems.join('')}
            </div>
            <div class="saved-items-right">
                ${rightItems.join('')}
            </div>
        `;
        
        container.innerHTML = htmlContent;
    } else {
        previewSection.style.display = 'block';
        container.innerHTML = '<div class="no-saved-items">No hay elementos guardados</div>';
        container.style.display = 'block'; // Cambiar a block para el mensaje
    }
}

/**
 * Crea una tarjeta para un elemento guardado
 * @param {string} tableType - Tipo de tabla
 * @param {string} rowIndex - Índice de la fila
 * @param {Object} rowData - Datos de la fila
 * @returns {string} HTML de la tarjeta
 */
function createSavedItemCard(tableType, rowIndex, rowData) {
    const tableTypeName = tableType === 'ensayos_acreditados' ? 'Ensayos Alcance' : 'No Acreditados';
    
    // Extraer el número del rowIndex si tiene formato "row_X"
    const numericIndex = rowIndex.toString().replace('row_', '');
    const elementName = getElementName(tableType, numericIndex);
    const units = getRowUnits(tableType, numericIndex);
    const quantitySnapshot = getRowQuantitySnapshot(tableType, numericIndex);
    const observationSummary = String(rowData.observaciones || units.map(unit => unit.observations).filter(Boolean).join(' | ')).trim();
    const washedCount = parseInt(rowData.cantLavados) || 0;
    
    return `
        <div class="saved-item-card" data-table-type="${tableType}" data-row-index="${rowIndex}">
            <div class="saved-item-info">
                <div class="saved-item-header">
                    <div class="saved-item-name">${elementName}</div>
                    <div class="saved-item-table-type">${tableTypeName}</div>
                </div>
                <div class="saved-item-details">
                    <div class="saved-item-detail">
                        📦 <span>Recibida: ${quantitySnapshot.received}</span>
                    </div>
                    <div class="saved-item-detail">
                        🚚 <span>Entregada: ${quantitySnapshot.delivered}</span>
                    </div>
                    <div class="saved-item-detail">
                        🧽 <span>Lavado: ${washedCount}</span>
                    </div>
                    <div class="saved-item-detail">
                        📝 <span>Obs: ${observationSummary || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="saved-item-actions">
                <button class="preview-saved-btn" onclick="openSavedItemPreview('${tableType}', '${rowIndex}')" title="Vista previa del elemento">
                    👁️ Vista previa
                </button>
                <button class="reset-saved-btn" onclick="resetSavedItem('${tableType}', '${rowIndex}')" title="Resetear elemento completamente">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * Obtiene el nombre del elemento basándose en el tipo de tabla y el índice
 * @param {string} tableType - Tipo de tabla
 * @param {string} rowIndex - Índice de la fila
 * @returns {string} Nombre del elemento
 */
function getElementName(tableType, rowIndex) {
    try {
        const index = parseInt(rowIndex);
        if (tableType === 'ensayos_acreditados' && Array.isArray(predefinedItemsData) && predefinedItemsData[index]) {
            return predefinedItemsData[index].nombre || `Elemento ${index + 1}`;
        } else if (tableType === 'ensayos_no_acreditados' && Array.isArray(predefinedItemsDataNoAcreditados) && predefinedItemsDataNoAcreditados[index]) {
            return predefinedItemsDataNoAcreditados[index].nombre || `Elemento ${index + 1}`;
        }
        return `Elemento ${index + 1}`;
    } catch (error) {
        return `Elemento ${rowIndex}`;
    }
}

/**
 * Edita un elemento guardado desde la vista previa
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 */
function editSavedItem(tableType, rowIndex) {
    // Cambiar al tipo de ensayo correcto (siempre acreditados)
    const tipoEnsayosSelect = document.getElementById('tipoEnsayos');
    if (tipoEnsayosSelect) {
        tipoEnsayosSelect.value = 'acreditados';
        cargarEnsayosAcreditados();
    }
    
    // Esperar a que se cargue la tabla y luego activar edición
    setTimeout(() => {
        editRowData(tableType, rowIndex);
        showSaveMessage('Elemento listo para editar', 'info');
    }, 500);
}

/**
 * Abre una vista previa resumida de un elemento guardado.
 * @param {string} tableType - Tipo de tabla
 * @param {string} rowIndex - Índice de la fila
 */
function openSavedItemPreview(tableType, rowIndex) {
    const numericIndex = rowIndex.toString().replace('row_', '');
    const rowKey = String(rowIndex).startsWith('row_')
        ? String(rowIndex)
        : getUnitRowKey(numericIndex);
    const rowData =
        savedRowsData?.[tableType]?.[rowKey] ||
        savedRowsData?.[tableType]?.[getUnitRowKey(numericIndex)] ||
        savedRowsData?.[tableType]?.[String(numericIndex)] ||
        {};
    const elementName = getElementName(tableType, numericIndex);
    const units = getRowUnits(tableType, numericIndex);
    const quantitySnapshot = getRowQuantitySnapshot(tableType, numericIndex);
    const usedCount = parseInt(rowData.cantUsado ?? rowData.quantity4 ?? 0, 10) || 0;
    const noUsedCount = parseInt(rowData.cantNoUsado ?? rowData.quantity3 ?? 0, 10) || 0;
    const observationSummary = String(rowData.observaciones || units.map(unit => unit.observations).filter(Boolean).join(' | ')).trim() || 'N/A';
    const brandGroups = getUnitBrandGroups(units);
    const brandSummaryText = brandGroups.length > 0
        ? brandGroups.map(({ brand, count }) => `${brand} x${count}`).join(' · ')
        : 'Sin marca';

    const modal = document.getElementById('modalVistaPrevia');
    const content = document.getElementById('modalPreviewContent');
    if (!modal || !content) return;

    content.innerHTML = `
        <div style="display:grid; gap:16px;">
            <div style="background:#f8fbff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:16px;">
                <div style="font-size:13px; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:.06em;">Elemento</div>
                <div style="font-size:22px; font-weight:800; color:#022859; margin-top:4px;">${escapeHtml(elementName)}</div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px;">
                <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:14px;">
                    <div style="font-size:12px; color:#6c757d; font-weight:700;">Cantidad recibida</div>
                    <div style="font-size:20px; font-weight:800; color:#022859;">${quantitySnapshot.received}</div>
                </div>
                <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:14px;">
                    <div style="font-size:12px; color:#6c757d; font-weight:700;">Cantidad entregada</div>
                    <div style="font-size:20px; font-weight:800; color:#0b5ed7;">${quantitySnapshot.delivered}</div>
                </div>
                <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:14px;">
                    <div style="font-size:12px; color:#6c757d; font-weight:700;">Usado</div>
                    <div style="font-size:20px; font-weight:800; color:#b45309;">${usedCount}</div>
                </div>
                <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:14px;">
                    <div style="font-size:12px; color:#6c757d; font-weight:700;">No usado</div>
                    <div style="font-size:20px; font-weight:800; color:#7c3aed;">${noUsedCount}</div>
                </div>
                <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:14px;">
                    <div style="font-size:12px; color:#6c757d; font-weight:700;">Lavado</div>
                    <div style="font-size:20px; font-weight:800; color:#0f766e;">${quantitySnapshot.washed}</div>
                </div>
            </div>
            <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:16px;">
                <div style="font-size:13px; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:.06em;">Marcas</div>
                <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:6px;">${renderBrandChips(units)}</div>
                <div style="margin-top:8px; color:#334155; font-size:13px;">${escapeHtml(brandSummaryText)}</div>
            </div>
            <div style="background:#fff; border:1px solid rgba(2,40,89,0.08); border-radius:12px; padding:16px;">
                <div style="font-size:13px; color:#6c757d; font-weight:700; text-transform:uppercase; letter-spacing:.06em;">Observaciones</div>
                <div style="margin-top:8px; color:#334155;">${escapeHtml(observationSummary)}</div>
            </div>
        </div>
    `;
    modal.style.display = 'block';
}

/**
 * Resetea un elemento guardado desde la vista previa
 * @param {string} tableType - Tipo de tabla
 * @param {number} rowIndex - Índice de la fila
 */
function resetSavedItem(tableType, rowIndex) {
    if (confirm('¿Estás seguro de que quieres resetear este elemento? Se perderán todos los datos guardados.')) {
        // Eliminar de los datos guardados
        if (savedRowsData[tableType]) {
            // Soportar ambas claves por compatibilidad
            if (savedRowsData[tableType][rowIndex]) {
                delete savedRowsData[tableType][rowIndex];
            }
            const prefKey = `row_${rowIndex}`;
            if (savedRowsData[tableType][prefKey]) {
                delete savedRowsData[tableType][prefKey];
            }
        }
        
        // Actualizar localStorage
        localStorage.setItem('savedRowsData', JSON.stringify(savedRowsData));
        
        // Resetear los campos de la fila si están visibles
        resetRowFields(tableType, rowIndex);
        
        // Actualizar vista previa
        updateSavedItemsPreview();
        
        // Actualizar cantidad de lavados
        actualizarCantidadLavados();
        
        // Actualizar totales
        updateTotals();
        
        // Extraer el número del rowIndex si tiene formato "row_X" para las funciones que esperan solo el número
        const numericIndex = rowIndex.toString().replace('row_', '');
        
        // Si la tabla está actualmente visible, actualizar el estado de la fila
        setTimeout(() => {
            updateRowSaveStatus(tableType, numericIndex, false);
            enableRowEditing(tableType, numericIndex);
        }, 100);
        
        showSaveMessage('Elemento reseteado exitosamente', 'success');
    }
}

/**
 * Resetea los campos de una fila específica
 * @param {string} tableType - Tipo de tabla
 * @param {string} rowIndex - Índice de la fila (puede ser "row_0" o solo "0")
 */
function resetRowFields(tableType, rowIndex) {
    // Extraer el número del rowIndex si tiene formato "row_X"
    const numericIndex = rowIndex.toString().replace('row_', '');
    let inputIds = [];
    
    if (tableType === 'ensayos_acreditados') {
        inputIds = [
            `qty_${numericIndex}`,
            `qty_2_${numericIndex}`,
            `qty_3_${numericIndex}`,
            `qty_4_${numericIndex}`,
            `status_${numericIndex}`,
            `observaciones_${numericIndex}`
        ];
    } else if (tableType === 'ensayos_no_acreditados') {
        inputIds = [
            `qty2_${numericIndex}`,
            `qty2_2_${numericIndex}`,
            `qty2_3_${numericIndex}`,
            `qty2_4_${numericIndex}`,
            `status2_${numericIndex}`,
            `observaciones2_${numericIndex}`
        ];
    }
    
    // Resetear los valores de los inputs a vacío (sin ceros)
    inputIds.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            const tag = input.tagName?.toUpperCase();
            if (tag === 'SELECT') {
                // Intentar dejar vacío; si no existe esa opción, ir a la primera
                input.value = '';
                if (input.value !== '') {
                    input.selectedIndex = 0;
                }
            } else {
                // Para number, text y textarea: vacío
                input.value = '';
            }
            // Disparar eventos para refrescar cálculos/estados si hay listeners
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

// ===============================
// Abrir Reportes con Datos del Caso
// ===============================
function openReportsWithCaseData() {
    // Abrir analytics.html en nueva pestaña directamente
    // El reporte cargará todos los casos desde localStorage
    window.open('analytics.html', '_blank');
}

// ===============================
// Mostrar Vista Previa en Modal
// ===============================
function mostrarVistaPrevia(numRecepcion) {
    const casos = obtenerCasosUnificados();
    const caso = casos.find(c => (c.cotizacion || c.quoteNumber || c.numero_proceso) === numRecepcion);
    
    if (!caso) {
        alert('No se encontraron datos para este caso');
        return;
    }
    
    // Generar HTML de vista previa
    const items = caso.items || [];
    const itemsHTML = generarHTMLItems(items, caso.status);
    const totalRecibidos = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalEntregados = items.reduce((sum, item) => sum + (Number(item.quantity2) || 0), 0);
    const totalLavados = items.reduce((sum, item) => sum + (Number(item.status) || 0), 0);
    const lavadoValor = caso.lavado || '-';
    const responsableLavado = caso.responsableLavado || '-';
    
    const html = `
        <div style="border: 1px solid #ddd; padding: 20px; background: white;">
            <h2 style="color: #022859; text-align: center;">FORMATO DE RECEPCIÓN Y ENTREGA DE ITEMS</h2>

            <!-- Información General -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <p><strong>Nº de Recepción:</strong> ${caso.cotizacion || '-'}</p>
                    <p><strong>Cliente:</strong> ${caso.cliente || '-'}</p>
                    <p><strong>NIT / CC:</strong> ${caso.nitEmpresa || '-'}</p>
                    <p><strong>Informe a Nombre de:</strong> ${caso.informeNombre || '-'}</p>
                    <p><strong>Facturar a Nombre de:</strong> ${caso.facturarNombre || '-'}</p>
                </div>
                <div>
                    <p><strong>Nº de Remisión:</strong> ${caso.facturar || '-'}</p>
                    <p><strong>Fecha Recepción:</strong> ${caso.fechaRecepcion || '-'}</p>
                    <p><strong>Fecha Entrega:</strong> ${caso.fechaEntrega || '-'}</p>
                </div>
            </div>

            <h3 style="color: #022859;">📦 Elementos de Ensayo:</h3>
            ${itemsHTML || '<p style="text-align: center; color: #666;">No hay elementos seleccionados.</p>'}

            <!-- Resumen de elementos -->
            <div style="margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div><strong>Total Elementos Recepción:</strong> <span>${totalRecibidos}</span></div>
                <div><strong>Total Elementos Entrega:</strong> <span>${totalEntregados}</span></div>
            </div>

            <!-- Lavados -->
            <div style="margin-top: 12px;">
                <div><strong>🧽 LAVADO:</strong> ${lavadoValor}</div>
                <div style="margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div><strong>Cantidad de Lavados:</strong> <span style="color: #022859; font-weight: bold;">${totalLavados}</span></div>
                    <div><strong>Responsables del Lavado:</strong> ${responsableLavado}</div>
                </div>
            </div>

            <!-- Observaciones -->
            ${caso.observaciones ? `<div style="margin-top: 20px;"><strong>Observaciones Generales:</strong><br>${caso.observaciones}</div>` : ''}

            <!-- Firmas -->
            <div style="margin-top: 25px;">
                <h4>Firmas: (Cliente)</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
                    <div>
                        <h5>👤 Cliente (Recepción)</h5>
                        <div><strong>Nombre:</strong> ${caso.clienteRecepcionNombre || '-'}</div>
                        <div><strong>Cédula:</strong> ${caso.clienteRecepcionCedula || '-'}</div>
                        <div><strong>Cargo:</strong> ${caso.clienteRecepcionCargo || '-'}</div>
                    </div>
                    <div>
                        <h5>👤 Cliente (Entrega)</h5>
                        <div><strong>Nombre:</strong> ${caso.clienteEntregaNombre || '-'}</div>
                        <div><strong>Cédula:</strong> ${caso.clienteEntregaCedula || '-'}</div>
                        <div><strong>Cargo:</strong> ${caso.clienteEntregaCargo || '-'}</div>
                    </div>
                </div>

                <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="text-align:center;">
                        <h5 style="margin:6px 0;">🖋️ Firma Recepción</h5>
                        ${(() => {
                            const sig = (caso.signatureData && (caso.signatureData.signatureCanvasRecepcion || caso.signatureData.signatureCanvas || (caso.signatureData.Recepcion && caso.signatureData.Recepcion.data))) || null;
                            return sig ? `<img src="${sig}" style="max-width: 100%; max-height: 170px; border: 1px solid #ccc; border-radius: 8px;">` : '<em>Sin firma registrada</em>';
                        })()}
                    </div>
                    <div style="text-align:center;">
                        <h5 style="margin:6px 0;">🖋️ Firma Entrega</h5>
                        ${(() => {
                            const sig = (caso.signatureData && (caso.signatureData.signatureCanvasEntrega || caso.signatureData.signatureCanvas || (caso.signatureData.Entrega && caso.signatureData.Entrega.data))) || null;
                            return sig ? `<img src="${sig}" style="max-width: 100%; max-height: 170px; border: 1px solid #ccc; border-radius: 8px;">` : '<em>Sin firma registrada</em>';
                        })()}
                    </div>
                </div>
            </div>

            <!-- Representante HIGH TEST -->
            <div style="margin-top: 25px;">
                <h4>🏢 Representante HIGH TEST</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div><strong>Nombre (Recepción):</strong> ${caso.highTestRecepcionNombre || '-'}</div>
                        <div><strong>Cargo:</strong> ${caso.highTestRecepcionCargo || '-'}</div>
                    </div>
                    <div>
                        <div><strong>Nombre (Entrega):</strong> ${caso.highTestEntregaNombre || '-'}</div>
                        <div><strong>Cargo:</strong> ${caso.highTestEntregaCargo || '-'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar modal
    const modal = document.getElementById('modalVistaPrevia');
    const content = document.getElementById('modalPreviewContent');
    if (modal && content) {
        content.innerHTML = html;
        modal.style.display = 'block';
    }
}

function generarHTMLItems(items, status) {
    if (!items || items.length === 0) return '';
    
    let html = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
    html += '<thead style="background: #f5f5f5; border-bottom: 2px solid #022859;"><tr>';
    html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Elemento</th>';
    
    // Helper: obtener texto compacto de marcas
    const getBrandText = (brandSummary) => {
        if (!brandSummary) return '-';
        if (Array.isArray(brandSummary)) return brandSummary.map(b => `${b.count || 0} ${b.brand || ''}`).join(', ');
        return String(brandSummary || '-');
    };

    // Mostrar columnas diferentes según el estado
    if (status === 'entrega') {
        // Completado: mostrar todas las cantidades como en el PDF
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Cant. Recibida</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Cant. Entregada</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Marcas</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">No Usado</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Usado</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Lavados</th>';
    } else if (status === 'recepcion') {
        // Recepción: mostrar recibidos y entregados
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Recibidos</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Entregados</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Marcas</th>';
    } else {
        // Borrador: mostrar todas las columnas como en completado
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Recibidos</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Entregados</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Marcas</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">No Usado</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Usado</th>';
        html += '<th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Lavados</th>';
    }
    html += '</tr></thead><tbody>';
    
    items.forEach(item => {
        html += '<tr style="border-bottom: 1px solid #ddd;">';
        html += `<td style="padding: 8px; border: 1px solid #ddd;">${item.name || '-'}</td>`;
        
        if (status === 'entrega') {
            // Mostrar quantity (recibidos), quantity2 (entregados), marcas, quantity3 (no usados), quantity4 (usados), status (lavados)
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity2 || 0}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${escapeHtml(getBrandText(item.brandSummary))}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity3 || '-'}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity4 || '-'}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.status || 0}</td>`;
        } else if (status === 'recepcion') {
            // Mostrar quantity (recibidos) y quantity2 (entregados) y marcas
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity2 || 0}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${escapeHtml(getBrandText(item.brandSummary))}</td>`;
        } else {
            // Borrador: mostrar todas las columnas
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity2 || 0}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${escapeHtml(getBrandText(item.brandSummary))}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity3 || '-'}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity4 || '-'}</td>`;
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.status || 0}</td>`;
        }
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

function cerrarVistaPrevia() {
    const modal = document.getElementById('modalVistaPrevia');
    if (modal) {
        modal.style.display = 'none';
    }
}

function cerrarModalEstadisticasDetalle() {
    const modal = document.getElementById('modalEstadisticasDetalle');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Mostrar detalles de estadísticas para un caso
function mostrarDetallesEstadisticas(cotizacion) {
    const casos = obtenerCasosUnificados();
    const caso = casos.find(c => (c.cotizacion || c.quoteNumber || c.numero_proceso) === cotizacion);
    
    if (!caso) {
        try { showNotification('❌ Caso no encontrado', 'error'); } catch(e){}
        return;
    }
    
    // Debug: log para ver qué hay en savedRowsData
    console.log('Debug: caso.savedRowsData =', caso.savedRowsData);
    
    // Recopilar todos los items del caso directamente desde formData.items si existe
    const itemsMap = {};
    
    // Prioridad 1: usar items del formData guardado (son los que se mostraron en el formulario)
    if (Array.isArray(caso.items) && caso.items.length > 0) {
        caso.items.forEach(item => {
            const nombre = item.name || item.elemento || item.nombre || 'Unknown';
            if (!itemsMap[nombre]) itemsMap[nombre] = { recibidos: 0, entregados: 0 };
            const recibidos = parseInt(item.quantity) || 0;
            const entregados = parseInt(item.quantity2) || 0;
            itemsMap[nombre].recibidos += recibidos;
            itemsMap[nombre].entregados += entregados;
        });
    }
    
    // Si no hay items en formData, intentar desde savedRowsData (estructura antigua)
    if (Object.keys(itemsMap).length === 0) {
        if (caso.savedRowsData?.ensayos_acreditados) {
            Object.entries(caso.savedRowsData.ensayos_acreditados).forEach(([idx, item]) => {
                const nombre = item.elemento || item.nombre || 'Unknown';
                if (!itemsMap[nombre]) itemsMap[nombre] = { recibidos: 0, entregados: 0 };
                itemsMap[nombre].recibidos += parseInt(item.cantRecibida) || 0;
                itemsMap[nombre].entregados += parseInt(item.cantEntregada) || 0;
            });
        }
        if (caso.savedRowsData?.ensayos_no_acreditados) {
            Object.entries(caso.savedRowsData.ensayos_no_acreditados).forEach(([idx, item]) => {
                const nombre = item.elemento || item.nombre || 'Unknown';
                if (!itemsMap[nombre]) itemsMap[nombre] = { recibidos: 0, entregados: 0 };
                itemsMap[nombre].recibidos += parseInt(item.cantRecibida) || 0;
                itemsMap[nombre].entregados += parseInt(item.cantEntregada) || 0;
            });
        }
    }
    
    console.log('Debug: itemsMap final =', itemsMap);
    
    // Llenar modal
    document.getElementById('modalDetalleCotizacion').textContent = cotizacion;
    document.getElementById('modalDetalleCliente').textContent = caso.cliente || caso.clienteRecepcionNombre || 'N/A';
    
    const tbody = document.getElementById('modalDetalleItemsBody');
    tbody.innerHTML = '';
    
    const items = Object.entries(itemsMap).sort((a,b) => b[1].recibidos - a[1].recibidos);
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #666;">No hay items registrados</td></tr>';
    } else {
        items.forEach(([nombre, data]) => {
            const diferencia = data.entregados - data.recibidos;
            const diferenciasStyle = diferencia !== 0 ? 'background: #ffebee; color: #c62828; font-weight: bold;' : '';
            const row = `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${nombre}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${data.recibidos}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${data.entregados}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; ${diferenciasStyle}">${diferencia > 0 ? '+' : ''}${diferencia}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }
    
    // Mostrar modal
    document.getElementById('modalEstadisticasDetalle').style.display = 'block';
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(e) {
    const modalPrevia = document.getElementById('modalVistaPrevia');
    if (modalPrevia && e.target === modalPrevia) {
        modalPrevia.style.display = 'none';
    }
    const modalDetalle = document.getElementById('modalEstadisticasDetalle');
    if (modalDetalle && e.target === modalDetalle) {
        modalDetalle.style.display = 'none';
    }
});

// ===============================
// Exportar/Importar JSON desde Reportes
// ===============================
function exportarJSON() {
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const data = { 
        drafts, 
        exportDate: new Date().toISOString(), 
        appName: 'Recepción de Items - High Test',
        exportedFrom: 'Reportes y Análisis'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `casos-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    try { showNotification('📥 Casos exportados correctamente - Puedes importarlos en otro navegador', 'success'); } catch(e){}
}

function importarJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            let incoming = [];
            if (Array.isArray(data)) incoming = data;
            else if (Array.isArray(data.drafts)) incoming = data.drafts;
            else if (Array.isArray(data.casoscargando)) incoming = data.casoscargando;

            if (!Array.isArray(incoming)) {
                try { showNotification('❌ Archivo inválido: no contiene array de casos', 'error'); } catch(e){}
                return;
            }

            const actionReplace = confirm(`Se encontraron ${incoming.length} caso(s).\n\n¿Deseas REEMPLAZAR los casos locales? (OK = reemplazar, Cancelar = fusionar)`);

            let drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
            if (actionReplace) {
                drafts = incoming;
            } else {
                // Fusionar evitando duplicados por cotización
                const existMap = {};
                drafts.forEach(d => { if (d && d.cotizacion) existMap[String(d.cotizacion)] = true; });
                incoming.forEach(d => {
                    if (d && d.cotizacion) {
                        if (!existMap[String(d.cotizacion)]) {
                            drafts.push(d);
                            existMap[String(d.cotizacion)] = true;
                        }
                    } else {
                        const key = JSON.stringify(d);
                        const already = drafts.some(x => JSON.stringify(x) === key);
                        if (!already) drafts.push(d);
                    }
                });
            }

            localStorage.setItem('cmr_drafts', JSON.stringify(drafts));
            try { saveDraftsToServer(drafts); } catch(e) {}
            invalidarCacheCasos();

            try { showNotification(`✅ ${actionReplace ? 'Reemplazados' : 'Fusionados'} ${drafts.length} caso(s)`, 'success'); } catch(e){}
            try { refrescarHistorial(); } catch(e){}
        } catch (err) {
            try { showNotification('❌ Error al leer archivo: ' + (err.message || err), 'error'); } catch(e){}
        }
    };
    input.click();
}

// ===============================
// Exportar Caso Individual como JSON
// ===============================
function exportarCasoJSON(numRecepcion) {
    const casos = obtenerCasosUnificados();
    const caso = casos.find(c => (c.cotizacion || c.quoteNumber || c.numero_proceso) === numRecepcion);
    
    if (!caso) {
        try { showNotification('❌ No se encontró el caso', 'error'); } catch(e){}
        return;
    }
    
    // Exportar solo este caso
    const data = {
        case: caso,
        exportDate: new Date().toISOString(),
        appName: 'Recepción de Items - High Test',
        exportedFrom: 'Reportes y Análisis - Caso Individual'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeNombre = (caso.cliente || 'caso').replace(/[^\w]/g, '_');
    const fechaEntrega = caso.fechaEntrega || new Date().toISOString().split('T')[0];
    link.download = `${numRecepcion}_${safeNombre}_entrega_${fechaEntrega}.json`;    link.click();
    URL.revokeObjectURL(url);
    try { showNotification('📥 Caso exportado - Puedes cargarlo en el formulario', 'success'); } catch(e){}
}

// =======================================================
// FUNCIONES DE MARCACIÓN DE ELEMENTOS
// =======================================================

let marcacionData = [];
let marcacionProcesoPrefix = 'R26';
let marcacionConsecutivos = [];
let marcacionProcesosList = [];
let marcacionProcesosFiltered = [];
let marcacionProcesoId = null;
let marcacionProcesoNumero = null;
let marcacionIsExistente = false;
let marcacionResumen = {};

/**
 * Abre el selector de procesos para marcación.
 * Carga todos los procesos desde la BD y muestra la lista.
 */
async function verMarcacion() {
    const listEl = document.getElementById('marcacionProcesosList');
    if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#64748b;">Cargando procesos...</div>';
    const modal = document.getElementById('marcacionSelectModal');
    if (modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; }

    try {
        const [procsResp, resumenResp] = await Promise.all([
            fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_procesos_acreditados' })
            }),
            fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_marcaciones_resumen' })
            })
        ]);
        const procsResult = await procsResp.json();
        const resumenResult = await resumenResp.json();

        if (procsResult.ok && Array.isArray(procsResult.procesos)) {
            marcacionProcesosList = procsResult.procesos;
            marcacionProcesosFiltered = [...marcacionProcesosList];
        } else {
            marcacionProcesosList = [];
            marcacionProcesosFiltered = [];
        }

        marcacionResumen = (resumenResult.ok && resumenResult.resumen) ? resumenResult.resumen : {};
    } catch (e) {
        console.warn('Error cargando procesos:', e);
        marcacionProcesosList = [];
        marcacionProcesosFiltered = [];
        marcacionResumen = {};
    }

    renderMarcacionProcesosList();
}

/**
 * Renderiza la lista de procesos en el selector.
 */
function renderMarcacionProcesosList() {
    const listEl = document.getElementById('marcacionProcesosList');
    if (!listEl) return;

    if (marcacionProcesosFiltered.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#64748b;">No se encontraron procesos</div>';
        return;
    }

    const sorted = [...marcacionProcesosFiltered].sort((a, b) => {
        const numA = String(a.numero_proceso || '').replace(/\D/g, '');
        const numB = String(b.numero_proceso || '').replace(/\D/g, '');
        return Number(numB) - Number(numA);
    });

    listEl.innerHTML = sorted.map(p => {
        const num = p.numero_proceso || '—';
        const cliente = p.cliente || '—';
        const estado = p.estado || '—';
        const fecha = (p.fecha_recepcion || '').substring(0, 10);
        const tipo = p.tipo || 'Ensayo';
        const informe = p.n_informe || '';
        const upperEstado = String(estado).toLowerCase();
        let badge = '<span class="marcacion-estado-badge pendiente">Pendiente</span>';
        if (upperEstado.includes('recepcion')) badge = '<span class="marcacion-estado-badge pendiente">Recepción</span>';
        else if (upperEstado.includes('marcacion') || upperEstado.includes('marcación')) badge = '<span class="marcacion-estado-badge marcado">Marcación</span>';
        else if (upperEstado.includes('ensayo') || upperEstado.includes('proceso')) badge = '<span class="marcacion-estado-badge revisado">Ensayo</span>';
        else if (upperEstado.includes('finalizado')) badge = '<span class="marcacion-estado-badge no-conforme">Finalizado</span>';
        else if (upperEstado.includes('informe') || upperEstado.includes('entrega')) badge = '<span class="marcacion-estado-badge marcado">Entrega</span>';

        const r = marcacionResumen[p.id] || null;
        let statusHtml = '';
        let cardBorder = '#e2e8f0';
        let cardBg = '#fff';

        if (r && r.total > 0) {
            const pct = Math.round((r.marcados / r.total) * 100);
            if (r.marcados === r.total) {
                statusHtml = `<div style="font-size:11px;color:#047857;margin-top:4px;font-weight:700;">✅ Completo (${r.total}/${r.total})</div>`;
                cardBorder = '#6ee7b7';
                cardBg = '#f0fdf4';
            } else {
                statusHtml = `<div style="font-size:11px;color:#92400e;margin-top:4px;font-weight:600;">⚠️ ${r.marcados} de ${r.total} marcados (${pct}%)</div>`;
                cardBorder = '#fcd34d';
                cardBg = '#fffbeb';
            }
        } else {
            statusHtml = `<div style="font-size:11px;color:#ef4444;margin-top:4px;font-weight:600;">🔴 Sin marcación</div>`;
            cardBorder = '#fca5a5';
            cardBg = '#fef2f2';
        }

        return `
        <div class="marcacion-process-select-item" onclick="selectProcesoMarcacion('${escapeHtml(num)}')" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:2px solid ${cardBorder};border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;background:${cardBg};" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-family:monospace;font-size:14px;color:#022859;">${escapeHtml(num)}</div>
                <div style="font-size:12px;color:#475569;margin-top:2px;">${escapeHtml(cliente)} — ${escapeHtml(tipo)}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">📅 ${fecha}${informe ? ' · 📄 ' + escapeHtml(informe) : ''}</div>
                ${statusHtml}
            </div>
            <div>${badge}</div>
            <div style="color:#94a3b8;font-size:18px;">›</div>
        </div>`;
    }).join('');
}

/**
 * Filtra procesos por búsqueda de texto.
 */
function filterMarcacionProcesos() {
    const q = (document.getElementById('marcacionSearchProcesos')?.value || '').toLowerCase();
    if (!q) {
        marcacionProcesosFiltered = [...marcacionProcesosList];
    } else {
        marcacionProcesosFiltered = marcacionProcesosList.filter(p => {
            const num = (p.numero_proceso || '').toLowerCase();
            const cliente = (p.cliente || '').toLowerCase();
            const tipo = (p.tipo || '').toLowerCase();
            return num.includes(q) || cliente.includes(q) || tipo.includes(q);
        });
    }
    renderMarcacionProcesosList();
}

/**
 * Cierra el selector de procesos.
 */
function closeMarcacionSelect(goBack) {
    const modal = document.getElementById('marcacionSelectModal');
    if (modal) { modal.hidden = true; document.body.style.overflow = ''; }
    if (goBack && new URLSearchParams(window.location.search).get('from') === 'admin') {
        window.location.href = '/admin-panel.html#items';
    }
}

/**
 * Selecciona un proceso y carga sus items para marcación.
 */
async function selectProcesoMarcacion(numeroProceso) {
    closeMarcacionSelect(false);

    const proceso = marcacionProcesosList.find(p => p.numero_proceso === numeroProceso);
    if (!proceso) { alert('Proceso no encontrado.'); return; }

    const procesoId = proceso.id;
    marcacionProcesoId = procesoId;
    marcacionProcesoNumero = numeroProceso;
    const prefixMatch = numeroProceso.match(/^([A-Za-z]+\s*)/);
    marcacionProcesoPrefix = prefixMatch ? prefixMatch[1].trim() : 'R26';

    // Poblar barra de info
    document.getElementById('marcacionProcesoNum').textContent = numeroProceso;
    document.getElementById('marcacionCliente').textContent = proceso.cliente || '-';
    document.getElementById('marcacionInformeNombre').value = proceso.informe_a_nombre_de || proceso.cliente || '';
    document.getElementById('marcacionFecha').textContent = (proceso.fecha_recepcion || '').substring(0, 10) || '-';
    document.getElementById('marcacionEstado').textContent = proceso.estado || 'Recepción';
    document.getElementById('marcacionFechaEjecucion').value = (proceso.fecha_ejecucion || '').substring(0, 10) || '';

    // Intentar cargar detalle del proceso desde la BD
    let detalle = [];
    if (procesoId) {
        try {
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_detalle_proceso', proceso_id: procesoId })
            });
            const result = await resp.json();
            if (result.ok && Array.isArray(result.detalle)) {
                detalle = result.detalle;
            }
        } catch (e) {
            console.warn('Error obteniendo detalle:', e);
        }
    }

    // Buscar borrador de la recepción en cmr_drafts para obtener nombres reales
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    const draft = drafts.find(d =>
        (d.cotizacion || '').toUpperCase() === numeroProceso.toUpperCase() ||
        (d.numero_proceso || '').toUpperCase() === numeroProceso.toUpperCase()
    );
    const draftItems = (draft && Array.isArray(draft.items)) ? draft.items : [];

    // Construir marcacionData
    marcacionData = [];
    let numCounter = 1;

    if (detalle.length > 0) {
        // Agrupar detalle por ensayo_id (puede haber varias filas por marca)
        const groups = {};
        const groupOrder = [];
        detalle.forEach(item => {
            const key = item.ensayo_id || ('_idx_' + groupOrder.length);
            if (!groups[key]) {
                groups[key] = { ensayo_id: item.ensayo_id, totalCantidad: 0, marcaCantidades: {}, ensayo_nombre: item.ensayo_nombre || '', ids: [] };
                groupOrder.push(key);
            }
            groups[key].totalCantidad += (item.cantidad || 0);
            groups[key].ids.push(item.id);
            // Guardar cantidad por marca
            const mk = (item.marca || '').trim();
            if (mk) {
                groups[key].marcaCantidades[mk] = (groups[key].marcaCantidades[mk] || 0) + (item.cantidad || 0);
            }
            if (!groups[key].ensayo_nombre && item.ensayo_nombre) groups[key].ensayo_nombre = item.ensayo_nombre;
        });

        // Emparejar por posición: cada grupo del BD ↔ cada item del borrador
        groupOrder.forEach((key, index) => {
            const g = groups[key];
            const draftItem = draftItems[index] || null;
            const nombre = draftItem?.name || g.ensayo_nombre || `Elemento ${index + 1}`;
            const cantidad = g.totalCantidad || 0;
            if (cantidad === 0) return;

            // Desglose de marcas: cantidades reales
            const marcaDesglose = Object.entries(g.marcaCantidades)
                .map(([marca, cant]) => `${cant} ${marca}`)
                .join(', ') || 'Sin marca';

            const observacion = '';

            const upper = nombre.toUpperCase();
            let unidadesEnsayables = 1;
            let tipoUnidad = 'unidad';
            if (upper.includes('PAR DE') || upper.includes('PARES DE')) { unidadesEnsayables = cantidad * 2; tipoUnidad = 'par'; }
            else if (upper.includes('SECCION')) {
                const match = upper.match(/(\d+)\s*SECCION/);
                const numSecciones = match ? parseInt(match[1], 10) : cantidad;
                unidadesEnsayables = cantidad * numSecciones;
                tipoUnidad = 'Secc';
            }
            else if (upper.includes('CUERPO') || upper.includes('PÉRTIGA') || upper.includes('PERTIGA')) {
                const match = upper.match(/(\d+)\s*(CUERPO|PÉRTIGA|PERTIGA)/);
                const numCuerpos = match ? parseInt(match[1], 10) : 4;
                unidadesEnsayables = cantidad * numCuerpos;
                tipoUnidad = 'cuerpos';
            }
            else { unidadesEnsayables = cantidad; tipoUnidad = 'und'; }

            const totalGenerar = unidadesEnsayables;

            marcacionData.push({
                ids: g.ids, elemento: nombre, marca: marcaDesglose, marcaDesglose, cantidad, unidadesEnsayables, tipoUnidad,
                totalGenerar, observacion_tecnica: observacion, marcacion: 'Pendiente',
                consecutivoStart: numCounter, consecutivoEnd: numCounter + totalGenerar - 1
            });
            numCounter += totalGenerar;
        });
    }

    // Si no hay detalle de BD, usar items del borrador directamente
    if (marcacionData.length === 0 && draftItems.length > 0) {
        draftItems.forEach((item, idx) => {
            const nombre = item.name || `Elemento ${idx + 1}`;
            const cantidad = item.quantity || 0;
            if (cantidad === 0) return;
            const marcaRawBS = item.brandSummary || item.brand || 'Sin marca';
            const marcaDesglose = Array.isArray(marcaRawBS) ? marcaRawBS.map(b => `${b.count || 0} ${b.brand || ''}`).join(', ') || 'Sin marca' : String(marcaRawBS || 'Sin marca');
            const observacion = item.observaciones || '';

            const upper = nombre.toUpperCase();
            let unidadesEnsayables = 1;
            let tipoUnidad = 'unidad';
            if (upper.includes('PAR DE') || upper.includes('PARES DE')) { unidadesEnsayables = cantidad * 2; tipoUnidad = 'par'; }
            else if (upper.includes('SECCION')) {
                const match = upper.match(/(\d+)\s*SECCION/);
                const numSecciones = match ? parseInt(match[1], 10) : cantidad;
                unidadesEnsayables = cantidad * numSecciones;
                tipoUnidad = 'Secc';
            }
            else if (upper.includes('CUERPO') || upper.includes('PÉRTIGA') || upper.includes('PERTIGA')) {
                const match = upper.match(/(\d+)\s*(CUERPO|PÉRTIGA|PERTIGA)/);
                const numCuerpos = match ? parseInt(match[1], 10) : 4;
                unidadesEnsayables = cantidad * numCuerpos;
                tipoUnidad = 'cuerpos';
            }
            else { unidadesEnsayables = cantidad; tipoUnidad = 'und'; }

            const totalGenerar = unidadesEnsayables;

            marcacionData.push({
                ids: [], elemento: nombre, marca: marcaDesglose, marcaDesglose, cantidad, unidadesEnsayables, tipoUnidad,
                totalGenerar, observacion_tecnica: observacion, marcacion: 'Pendiente',
                consecutivoStart: numCounter, consecutivoEnd: numCounter + totalGenerar - 1
            });
            numCounter += totalGenerar;
        });
    }

    renderMarcacionLeftPanel();

    // Cargar marcaciones existentes desde la BD
    marcacionIsExistente = false;
    if (marcacionProcesoId) {
        try {
            const respMarc = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_marcaciones_by_proceso', proceso_id: marcacionProcesoId })
            });
            const resultMarc = await respMarc.json();
            console.log('MARCACIONES BD:', resultMarc.marcaciones);
            console.log('MARCACION DATA:', marcacionData);
            if (resultMarc.ok && Array.isArray(resultMarc.marcaciones) && resultMarc.marcaciones.length > 0) {
                marcacionIsExistente = true;

                // Contar cuántos consecutivos hay por elemento para calcular unidad
                const countByElemento = {};
                resultMarc.marcaciones.forEach(m => {
                    countByElemento[m.elemento] = (countByElemento[m.elemento] || 0) + 1;
                });
                const posByElemento = {};

                marcacionConsecutivos = resultMarc.marcaciones.map(marc => {
                    const itemIdx = marcacionData.findIndex(d => d.elemento === marc.elemento);
                    console.log('Consecutivo:', marc.consecutivo, 'elemento_marca:', marc.elemento, 'itemIdx:', itemIdx, 'marcacionData_elementos:', marcacionData.map(d => d.elemento));
                    posByElemento[marc.elemento] = (posByElemento[marc.elemento] || 0) + 1;
                    const unidadNum = posByElemento[marc.elemento];
                    return {
                        consecutivo: marc.consecutivo,
                        elemento: marc.elemento,
                        marca: marc.descripcion || '',
                        unidad: `U-${unidadNum}`,
                        descripcion: `${marc.descripcion || ''} - U-${unidadNum}`,
                        estado: marc.estado || 'Pendiente',
                        observaciones: marc.observacion || '',
                        nci: marc.nci || '',
                        itemIndex: itemIdx >= 0 ? itemIdx : 0,
                        accion: true,
                        updated_at: marc.updated_at || null
                    };
                });
                console.log('CONSECUTIVOS RECONSTRUIDOS:', marcacionConsecutivos);
            }
        } catch (e) {
            console.warn('Error cargando marcaciones existentes:', e);
        }
    }

    // Actualizar UI según origen de datos
    updateMarcacionStatusUI(numeroProceso);
    renderConsecutivos();
    renderSummaryCards();
    renderStatusSummaryCards();
    updateGenCounter();

    const modal = document.getElementById('marcacionModal');
    if (modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; }
}

/**
 * Renderiza el panel izquierdo: tabla de elementos recibidos.
 */
function renderMarcacionLeftPanel() {
    const tbody = document.getElementById('marcacionTableBody');
    if (!tbody) return;

    if (marcacionData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="marcacion-empty"><i class="fas fa-clipboard-list"></i>No hay elementos para mostrar</td></tr>`;
        return;
    }

    tbody.innerHTML = marcacionData.map((item, i) => {
        const maxUnidades = item.cantidad || 1;
        const upper = item.elemento.toUpperCase();
        let unidadLabel = 'und';
        if (upper.includes('PAR DE') || upper.includes('PARES DE')) unidadLabel = 'par';
        else if (upper.includes('SECCION')) unidadLabel = 'Secc';
        const marcaDesglose = item.marcaDesglose || item.marca || '';
        return `
        <tr>
            <td style="text-align:center; font-weight:700; color:#022859;">${i + 1}</td>
            <td>
                <div style="font-weight:600;">${escapeHtml(item.elemento)}</div>
                ${marcaDesglose ? `<small style="color:#64748b;">${escapeHtml(marcaDesglose)}</small>` : ''}
            </td>
            <td style="text-align:center;">${item.cantidad} <small style="color:#64748b;">${unidadLabel}</small></td>
            <td style="text-align:center;">
                <input type="number" min="1" max="${maxUnidades}" value="${item.unidadesEnsayables}"
                    style="width:70px; text-align:center; padding:6px 4px; border:2px solid #cbd5e1; border-radius:8px; font-size:14px; font-weight:700; background:#f8fafc;"
                    onchange="updateUnidadesEnsayables(${i}, this.value)">
            </td>
            <td style="text-align:center; font-weight:700;" id="totalGen_${i}">${item.totalGenerar}</td>
        </tr>`;
    }).join('');
}

/**
 * Actualiza las unidades ensayables de un elemento y recalcula el total.
 */
function updateUnidadesEnsayables(index, value) {
    if (!marcacionData[index]) return;
    const nuevas = parseInt(value, 10) || 1;
    const item = marcacionData[index];

    item.unidadesEnsayables = nuevas;
    item.totalGenerar = nuevas;

    // Actualizar total visual
    const totalEl = document.getElementById('totalGen_' + index);
    if (totalEl) totalEl.textContent = item.totalGenerar;

    // Recalcular consecutivos
    recalcularConsecutivos();
    renderSummaryCards();
}

async function guardarCampoProceso(campo, valor) {
    if (!marcacionProcesoNumero) return;
    try {
        await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_proceso', numero_proceso: marcacionProcesoNumero, [campo]: valor })
        });
    } catch (e) { console.error('Error guardando campo:', e); }
}

/**
 * Recalcula los consecutivos basándose en los datos actuales de marcacionData.
 */
function recalcularConsecutivos() {
    let numCounter = 1;
    marcacionData.forEach(item => {
        item.consecutivoStart = numCounter;
        item.consecutivoEnd = numCounter + item.totalGenerar - 1;
        numCounter += item.totalGenerar;
    });
}

/**
 * Genera los consecutivos para cada elemento.
 */
function generarMarcacion() {
    if (marcacionData.length === 0) {
        alert('No hay elementos para generar marcación.');
        return;
    }

    marcacionConsecutivos = [];
    let globalNum = 1;

    marcacionData.forEach((item, itemIdx) => {
        const numUnidades = item.unidadesEnsayables || 1;
        const marcaRaw = item.marcaDesglose || item.marca || item.elemento;
        const marcaStr = Array.isArray(marcaRaw) ? marcaRaw.map(b => `${b.count || 0} ${b.brand || ''}`).join(', ') : String(marcaRaw || item.elemento);

        // Expandir marcas: "3 Hastings, 1 Salisbury" → ["Hastings","Hastings","Hastings","Salisbury"]
        const marcaEntries = marcaStr.split(',').map(s => s.trim()).filter(Boolean);
        const marcasExpandidas = [];
        marcaEntries.forEach(entry => {
            const match = entry.match(/^(\d+)\s+(.+)$/);
            if (match) {
                const cant = parseInt(match[1], 10);
                const nombre = match[2].trim();
                for (let k = 0; k < cant; k++) marcasExpandidas.push(nombre);
            } else {
                marcasExpandidas.push(entry);
            }
        });
        if (marcasExpandidas.length === 0) marcasExpandidas.push('Sin marca');

        for (let u = 0; u < numUnidades; u++) {
            const numStr = String(globalNum).padStart(3, '0');
            const consecutivo = numStr;
            const marcaNombre = marcasExpandidas[u % marcasExpandidas.length] || 'Sin marca';
            const unidadLabel = `U-${u + 1}`;

            marcacionConsecutivos.push({
                consecutivo: consecutivo,
                elemento: item.elemento,
                marca: marcaNombre,
                unidad: unidadLabel,
                descripcion: `${marcaNombre} - ${unidadLabel}`,
                estado: item.marcacion || 'Pendiente',
                observaciones: '',
                nci: '',
                itemIndex: itemIdx,
                accion: true
            });
            globalNum++;
        }
    });

    renderConsecutivos();
    renderSummaryCards();
    renderStatusSummaryCards();
    updateGenCounter();
}

/**
 * Renderiza la tabla de consecutivos generados (panel derecho).
 */
function renderConsecutivos(filter) {
    const tbody = document.getElementById('marcacionConsecutivosBody');
    if (!tbody) return;

    let data = marcacionConsecutivos || [];
    if (filter) {
        const q = filter.toLowerCase();
        data = data.filter(c =>
            c.consecutivo.toLowerCase().includes(q) ||
            c.elemento.toLowerCase().includes(q) ||
            (c.marca || '').toLowerCase().includes(q)
        );
    }

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="marcacion-empty"><i class="fas fa-clipboard-list"></i>${marcacionConsecutivos.length === 0 ? 'Genere la marcación para ver los consecutivos' : 'No se encontraron resultados'}</td></tr>`;
        return;
    }

    const marcaColors = {
        'Hastings': { bg: '#fde2e2', text: '#b91c1c', border: '#f5a3a3' },
        'Salisbury': { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
        'Chance': { bg: '#d1fae5', text: '#047857', border: '#6ee7b7' },
        'Sin marca': { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' }
    };
    const defaultMarcaColor = { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };

    const estadoRowClasses = {
        'Marcado': 'estado-marcado',
        'Revisado': 'estado-revisado',
        'No Conforme': 'estado-no-conforme',
        'Pendiente': ''
    };

    tbody.innerHTML = data.map((c, i) => {
        const fechaMod = c.updated_at ? new Date(c.updated_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        const mc = marcaColors[c.marca] || defaultMarcaColor;
        const obsValue = escapeHtml(c.observaciones || '');
        const hasObs = (c.observaciones || '').trim().length > 0;
        const obsBg = hasObs ? 'background:#fffbeb; border:1px solid #fcd34d;' : 'border:1px solid #e2e8f0;';
        const rowClass = estadoRowClasses[c.estado] || '';
        return `
        <tr class="${rowClass}">
            <td class="marcacion-row-num">${c.consecutivo}</td>
            <td class="marcacion-td-elemento">${escapeHtml(c.elemento)}</td>
            <td>
                <span class="marcacion-badge marca-badge" style="background:${mc.bg};color:${mc.text};border:1px solid ${mc.border};">
                    ${escapeHtml(c.marca || 'Sin marca')}
                </span>
            </td>
            <td>
                <span class="marcacion-badge unidad-badge">${escapeHtml(c.unidad || '')}</span>
            </td>
            <td>
                <select class="marcacion-select" data-value="${c.nci || ''}" onchange="updateConsecutivoNCI('${c.consecutivo}', this.value, this)" style="width:auto; min-width:50px; font-size:0.62rem; padding:2px 3px;">
                    <option value="" ${!c.nci ? 'selected' : ''}>--</option>
                    <option value="NCI" ${c.nci === 'NCI' ? 'selected' : ''}>NCI</option>
                    <option value="NCE" ${c.nci === 'NCE' ? 'selected' : ''}>NCE</option>
                </select>
            </td>
            <td>
                <input type="text" class="marcacion-obs-inline" value="${obsValue}"
                    placeholder="Obs..." oninput="liveObsStyle(this)" onchange="updateConsecutivoObs('${c.consecutivo}', this.value)"
                    style="${obsBg} width:100%; font-size:0.6rem; padding:2px 4px; border-radius:4px; ${hasObs ? 'color:#92400e; font-weight:600;' : 'color:#64748b;'}">
            </td>
            <td>
                <select class="marcacion-select marcacion-estado-select" data-value="${c.estado}" onchange="updateConsecutivoEstado('${c.consecutivo}', this.value, this)" style="font-size:0.62rem; padding:2px 3px;">
                    <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="Marcado" ${c.estado === 'Marcado' ? 'selected' : ''}>✅ Marcado</option>
                    <option value="Revisado" ${c.estado === 'Revisado' ? 'selected' : ''}>🔍 Revisado</option>
                    <option value="No Conforme" ${c.estado === 'No Conforme' ? 'selected' : ''}>❌ No Conforme</option>
                </select>
            </td>
            <td class="marcacion-ultima-mod">${fechaMod}</td>
            <td style="text-align:center; white-space:nowrap;">
                <button class="marcacion-action-btn" title="Mover arriba" onclick="moverConsecutivo('${c.consecutivo}', -1)" style="color:#64748b;"><i class="fas fa-arrow-up"></i></button>
                <button class="marcacion-action-btn" title="Mover abajo" onclick="moverConsecutivo('${c.consecutivo}', 1)" style="color:#64748b;"><i class="fas fa-arrow-down"></i></button>
                <button class="marcacion-action-btn" title="Eliminar" onclick="eliminarConsecutivo('${c.consecutivo}')" style="margin-left:2px;color:#ef4444;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

/**
 * Actualiza el estado de un consecutivo específico.
 */
function updateConsecutivoEstado(consecutivo, value, selectEl) {
    const c = marcacionConsecutivos.find(x => x.consecutivo === consecutivo);
    if (c) {
        c.estado = value;
        if (selectEl) selectEl.setAttribute('data-value', value);
    }
    const estadoRowClasses = {
        'Marcado': 'estado-marcado',
        'Revisado': 'estado-revisado',
        'No Conforme': 'estado-no-conforme',
        'Pendiente': ''
    };
    if (selectEl) {
        const tr = selectEl.closest('tr');
        if (tr) {
            tr.classList.remove('estado-marcado', 'estado-revisado', 'estado-no-conforme');
            const cls = estadoRowClasses[value];
            if (cls) tr.classList.add(cls);
        }
    }
    updateGenCounter();
    renderStatusSummaryCards();
}

function toggleObsInput(consecutivo, btn) {
    const popup = document.getElementById('obsPopup_' + consecutivo);
    if (!popup) return;
    const isVisible = popup.style.display !== 'none';
    document.querySelectorAll('.marcacion-obs-popup').forEach(p => p.style.display = 'none');
    if (!isVisible) {
        popup.style.display = 'block';
        popup.querySelector('input').focus();
    }
}

function updateConsecutivoObs(consecutivo, value) {
    const c = marcacionConsecutivos.find(x => x.consecutivo === consecutivo);
    if (c) c.observaciones = value;
}

function liveObsStyle(input) {
    const hasText = input.value.trim().length > 0;
    if (hasText) {
        input.style.background = '#fffbeb';
        input.style.border = '1px solid #fcd34d';
        input.style.color = '#92400e';
        input.style.fontWeight = '600';
    } else {
        input.style.background = '';
        input.style.border = '1px solid #e2e8f0';
        input.style.color = '#64748b';
        input.style.fontWeight = '';
    }
}

function updateConsecutivoNCI(consecutivo, value, selectEl) {
    const c = marcacionConsecutivos.find(x => x.consecutivo === consecutivo);
    if (c) {
        c.nci = value;
        if (selectEl) selectEl.setAttribute('data-value', value);
    }
}

function eliminarConsecutivo(consecutivo) {
    if (!confirm(`¿Eliminar el consecutivo ${consecutivo}?`)) return;
    marcacionConsecutivos = marcacionConsecutivos.filter(c => c.consecutivo !== consecutivo);
    renumerarConsecutivos();
    renderConsecutivos(document.getElementById('marcacionFilterInput')?.value || '');
    updateGenCounter();
    renderStatusSummaryCards();
}

function renumerarConsecutivos() {
    marcacionConsecutivos.forEach((c, i) => {
        c.consecutivo = String(i + 1).padStart(3, '0');
    });
}

function moverConsecutivo(consecutivo, direccion) {
    const idx = marcacionConsecutivos.findIndex(c => c.consecutivo === consecutivo);
    if (idx === -1) return;
    const nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= marcacionConsecutivos.length) return;

    const temp = marcacionConsecutivos[idx];
    marcacionConsecutivos[idx] = marcacionConsecutivos[nuevoIdx];
    marcacionConsecutivos[nuevoIdx] = temp;

    renumerarConsecutivos();
    renderConsecutivos(document.getElementById('marcacionFilterInput')?.value || '');
}

function moverConsecutivoTop(consecutivo) {
    const idx = marcacionConsecutivos.findIndex(c => c.consecutivo === consecutivo);
    if (idx <= 0) return;
    const item = marcacionConsecutivos.splice(idx, 1)[0];
    marcacionConsecutivos.unshift(item);
    renumerarConsecutivos();
    renderConsecutivos(document.getElementById('marcacionFilterInput')?.value || '');
}

function moverConsecutivoBottom(consecutivo) {
    const idx = marcacionConsecutivos.findIndex(c => c.consecutivo === consecutivo);
    if (idx === -1 || idx >= marcacionConsecutivos.length - 1) return;
    const item = marcacionConsecutivos.splice(idx, 1)[0];
    marcacionConsecutivos.push(item);
    renumerarConsecutivos();
    renderConsecutivos(document.getElementById('marcacionFilterInput')?.value || '');
}

/**
 * Actualiza el contador de consecutivos generados.
 */
function updateGenCounter() {
    const total = marcacionConsecutivos.length;
    const itemsTotal = marcacionData.reduce((sum, item) => sum + item.totalGenerar, 0);
    const pct = itemsTotal > 0 ? Math.round((total / itemsTotal) * 100) : 0;

    const counter = document.getElementById('marcacionGenCounter');
    const percent = document.getElementById('marcacionGenPercent');
    if (counter) counter.textContent = `Generados: ${total} de ${itemsTotal}`;
    if (percent) percent.textContent = `${pct}%`;
}

/**
 * Actualiza el banner de estado y los botones según si la marcación es nueva o existente.
 */
function updateMarcacionStatusUI(numeroProceso) {
    const banner = document.getElementById('marcacionStatusBanner');
    const generarBtn = document.getElementById('marcacionGenerarBtn');
    const guardarBtn = document.getElementById('marcacionGuardarBtn');
    const totalUnidades = marcacionData.reduce((sum, item) => sum + item.totalGenerar, 0);

    if (marcacionIsExistente) {
        if (banner) {
            banner.className = 'marcacion-status-banner existente';
            banner.style.display = 'flex';
            banner.innerHTML = `
                <span class="banner-icon">✏️</span>
                <div>
                    <div><strong>Marcación Existente</strong></div>
                    <div class="banner-detail">Proceso: ${escapeHtml(numeroProceso)} · Consecutivos registrados: ${marcacionConsecutivos.length}</div>
                </div>`;
        }
        if (generarBtn) {
            generarBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerar Marcación';
        }
        if (guardarBtn) {
            guardarBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
    } else {
        if (banner) {
            banner.className = 'marcacion-status-banner nueva';
            banner.style.display = 'flex';
            banner.innerHTML = `
                <span class="banner-icon">🆕</span>
                <div>
                    <div><strong>Nueva Marcación</strong></div>
                    <div class="banner-detail">Proceso: ${escapeHtml(numeroProceso)} · Total unidades ensayables: ${totalUnidades}</div>
                </div>`;
        }
        if (generarBtn) {
            generarBtn.innerHTML = '<i class="fas fa-cogs"></i> Generar Marcación';
        }
        if (guardarBtn) {
            guardarBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Marcación';
        }
    }
}

/**
 * Renderiza las tarjetas de resumen de estado (Marcados, Pendientes, Revisados, No Conformes).
 */
function renderStatusSummaryCards() {
    const container = document.getElementById('marcacionStatusCards');
    if (!container) return;

    if (marcacionConsecutivos.length === 0) {
        container.innerHTML = '';
        return;
    }

    const counts = { Marcado: 0, Pendiente: 0, Revisado: 0, 'No Conforme': 0 };
    marcacionConsecutivos.forEach(c => {
        if (counts.hasOwnProperty(c.estado)) {
            counts[c.estado]++;
        } else {
            counts.Pendiente++;
        }
    });

    container.innerHTML = `
        <div class="marcacion-status-card marcados">
            <div class="status-row">
                <i class="fas fa-check-circle status-icon"></i>
                <span class="status-count">${counts.Marcado}</span>
            </div>
            <div class="status-label">MARCADOS</div>
        </div>
        <div class="marcacion-status-card pendientes">
            <div class="status-row">
                <i class="fas fa-clock status-icon"></i>
                <span class="status-count">${counts.Pendiente}</span>
            </div>
            <div class="status-label">PENDIENTES</div>
        </div>
        <div class="marcacion-status-card revisados">
            <div class="status-row">
                <i class="fas fa-eye status-icon"></i>
                <span class="status-count">${counts.Revisado}</span>
            </div>
            <div class="status-label">REVISADOS</div>
        </div>
        <div class="marcacion-status-card no-conformes">
            <div class="status-row">
                <i class="fas fa-times-circle status-icon"></i>
                <span class="status-count">${counts['No Conforme']}</span>
            </div>
            <div class="status-label">NO CONFORMES</div>
        </div>`;
}

/**
 * Renderiza las cards de resumen por elemento (parte inferior del panel izquierdo).
 */
function renderSummaryCards() {
    const container = document.getElementById('marcacionSummaryCards');
    if (!container) return;

    if (marcacionData.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    let totalConsecutivos = 0;

    marcacionData.forEach(item => {
        totalConsecutivos += item.totalGenerar;
        const start = String(item.consecutivoStart).padStart(3, '0');
        const end = String(item.consecutivoEnd).padStart(3, '0');
        html += `
        <div class="marcacion-summary-card">
            <div class="marcacion-summary-card-title">${escapeHtml(item.elemento)}</div>
            <div class="marcacion-summary-card-sub">${item.totalGenerar} consecutivos</div>
            <div class="marcacion-summary-card-range">${start} → ${end}</div>
        </div>`;
    });

    html += `
    <div class="marcacion-summary-card-total">
        <div class="marcacion-summary-card-title">Total</div>
        <div class="marcacion-summary-card-range">${totalConsecutivos}</div>
    </div>`;

    container.innerHTML = html;
}

/**
 * Actualiza el estado de marcación de un ítem del panel izquierdo.
 */
function updateMarcacionEstado(index, value, selectEl) {
    if (!marcacionData[index]) return;
    marcacionData[index].marcacion = value;
    if (selectEl) selectEl.setAttribute('data-value', value);

    // Actualizar todos los consecutivos asociados a este ítem
    marcacionConsecutivos.forEach(c => {
        if (c.itemIndex === index) c.estado = value;
    });

    renderConsecutivos(document.getElementById('marcacionFilterInput')?.value || '');
}

/**
 * Toggle barra de filtro de consecutivos.
 */
function toggleFilterConsecutivos() {
    const bar = document.getElementById('marcacionFilterBar');
    if (bar) bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
}

/**
 * Filtra consecutivos según texto de búsqueda.
 */
function filterConsecutivos() {
    const q = document.getElementById('marcacionFilterInput')?.value || '';
    renderConsecutivos(q);
}

/**
 * Guarda todas las marcaciones en la BD.
 */
async function guardarMarcacion() {
    if (marcacionData.length === 0) {
        alert('No hay ítems para guardar.');
        return;
    }

    console.log('marcacionData:', marcacionData);
    console.log('marcacionConsecutivos:', marcacionConsecutivos);
    console.log('procesoId:', marcacionProcesoId);

    const marcaciones = [];
    marcacionData.forEach(item => {
        const ids = item.ids || (item.id ? [item.id] : []);
        ids.forEach(detalleId => {
            marcaciones.push({
                detalle_id: detalleId,
                marcacion: item.marcacion,
                observacion_tecnica: item.observacion_tecnica
            });
        });
    });
    console.log('marcaciones construidas:', marcaciones);
    console.log('cantidad marcaciones:', marcaciones.length);

    try {
        if (marcaciones.length > 0) {
            console.log('PAYLOAD update_marcacion_batch:', { action: 'update_marcacion_batch', marcaciones });
            const resp = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_marcacion_batch', marcaciones })
            });
            const result = await resp.json();

            if (!result.ok) {
                alert('Error al guardar: ' + (result.error || 'Error desconocido'));
                return;
            }
        } else {
            console.log('SKIP update_marcacion_batch: marcaciones vacío');
        }

        // Guardar consecutivos en marcaciones_ac
        if (marcacionProcesoId) {
            const consecutivosPayload = marcacionConsecutivos.map(c => {
                const item = marcacionData[c.itemIndex] || {};
                const ids = item.ids || (item.id ? [item.id] : []);
                return {
                    proceso_id: marcacionProcesoId,
                    detalle_id: ids[0] || null,
                    ensayo_id: item.ensayo_id || null,
                    consecutivo: c.consecutivo,
                    elemento: c.elemento || '',
                    descripcion: c.marca || '',
                    estado: c.estado || 'Pendiente',
                    observacion: c.observaciones || '',
                    nci: c.nci || ''
                };
            });

            console.log('PAYLOAD create_marcaciones_batch:', { action: 'create_marcaciones_batch', proceso_id: marcacionProcesoId, marcaciones: consecutivosPayload });
            const respCons = await fetch('/.netlify/functions/conectar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_marcaciones_batch', marcaciones: consecutivosPayload, proceso_id: marcacionProcesoId })
            });
            const resultCons = await respCons.json();
            if (!resultCons.ok) {
                console.error('Error guardando consecutivos:', resultCons);
                showNotification('⚠️ Marcación guardada, pero hubo un error guardando los consecutivos. Ejecuta la SQL de columnas marca/unidad.', 'error');
            }
        } else {
            console.log('SKIP create_marcaciones_batch: marcacionProcesoId es null');
        }

        showNotification('✅ Marcación guardada correctamente', 'success');
        closeMarcacion();
        // Si vino desde admin panel, redirigir de vuelta
        if (new URLSearchParams(window.location.search).get('from') === 'admin') {
            setTimeout(() => { window.location.href = '/admin-panel.html#items'; }, 800);
        }
    } catch (e) {
        console.error('Error guardando marcación:', e);
        alert('Error de conexión al guardar la marcación.');
    }
}

/**
 * Cierra el modal de marcación.
 */
function closeMarcacion() {
    const modal = document.getElementById('marcacionModal');
    if (modal) {
        modal.hidden = true;
        document.body.style.overflow = '';
    }
    marcacionData = [];
    marcacionConsecutivos = [];
    if (new URLSearchParams(window.location.search).get('from') === 'admin') {
        window.location.href = '/admin-panel.html#items';
    }
    marcacionProcesoId = null;
    marcacionProcesoNumero = null;
    marcacionIsExistente = false;
}

// =======================================================
// GENERACIÓN DE PDF DESDE CASO (sin depender del DOM/formulario)
// =======================================================

function generatePDFFromCase(caso, tipo) {
    if (__pdfGenerating) { showNotification('Generación de PDF en curso, por favor espera...', 'info'); return; }
    __pdfGenerating = true;

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('Error: jsPDF no está disponible.');
        __pdfGenerating = false; return;
    }

    if (!caso || (!caso.items || caso.items.length === 0)) {
        alert('Este caso no tiene items registrados. No se puede generar el PDF.');
        __pdfGenerating = false; return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    let y = margin;

    const numRecepcion = caso.cotizacion || caso.quoteNumber || caso.numero_proceso || 'N/A';
    const cliente = caso.cliente || caso.clienteRecepcionNombre || 'N/A';
    const nitEmpresa = caso.nitEmpresa || '-';
    const fechaRecepcion = caso.fechaRecepcion || '-';
    const fechaEntrega = caso.fechaEntrega || '-';
    const informeNombre = caso.informeNombre || '-';
    const facturarNombre = caso.facturarNombre || '-';
    const facturar = caso.facturar || '-';
    const observaciones = caso.observaciones || '';

    const items = caso.items.map(it => ({
        name: it.name || it.elemento || it.nombre || '-',
        quantity: parseInt(it.quantity) || parseInt(it.cantRecibida) || 0,
        quantity2: parseInt(it.quantity2) || parseInt(it.cantEntregada) || 0,
        quantity3: parseInt(it.quantity3) || parseInt(it.cantNoUsado) || 0,
        quantity4: parseInt(it.quantity4) || parseInt(it.cantUsado) || 0,
        status: parseInt(it.status) || parseInt(it.cantLavados) || 0,
        observaciones: it.observaciones || '',
        brandSummary: it.brandSummary || it.marcas || it.brandDistribution || [],
        type: it.type || 'Ensayos Alcance'
    }));

    const addFooter = () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const pageCount = doc.getNumberOfPages();
        doc.text(`Página ${pageCount}`, pageWidth - margin - 20, pageHeight - 8);
    };

    const addWatermark = () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        const prevFont = doc.getFont();
        const prevFontSize = doc.getFontSize();
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(40);
        const watermarkText = tipo === 'recepcion' ? 'RECEPCION HIGH TEST' : 'ENTREGADO HIGH TEST';
        doc.text(watermarkText, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        doc.setFont(prevFont.fontName || 'helvetica', prevFont.fontStyle || 'normal');
        doc.setFontSize(prevFontSize);
        doc.setTextColor(0, 0, 0);
    };

    const maybeAddPage = (limit = 265) => {
        if (y > limit) { addFooter(); doc.addPage(); addWatermark(); y = margin; }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RECEPCIÓN Y ENTREGA', 105, y, { align: 'center' });
    doc.text('DE ITEMS', 105, y += 6, { align: 'center' });
    y = 6;

    try { const logo = new Image(); logo.src = 'Logo.png'; doc.addImage(logo, 'PNG', margin, y + 4, 28, 22); } catch (_) {}
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('CÓDIGO: FR-7.4.1', 210 - margin, y + 16, { align: 'right' });
    doc.text('VERSIÓN: 01', 210 - margin, y + 19, { align: 'right' });
    doc.text('FECHA: 2025-07-07', 210 - margin, y + 22, { align: 'right' });
    y += 26; doc.setLineWidth(0.5); doc.line(margin, y, 210 - margin, y); y += 6;

    addWatermark();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN GENERAL', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const col1X = margin, col2X = 110, lineGap = 6;
    doc.text(`Nº de Recepción: ${numRecepcion}`, col1X, y);
    doc.text(`Cliente: ${cliente}`, col2X, y); y += lineGap;
    doc.text(`Fecha Recepción: ${fechaRecepcion}`, col1X, y);
    doc.text(`NIT / CC: ${nitEmpresa}`, col2X, y); y += lineGap;
    if (tipo === 'entrega') {
        doc.text(`Fecha Entrega: ${fechaEntrega}`, col1X, y);
    }
    doc.text(`Nº de Remisión: ${facturar}`, col2X, y); y += lineGap;
    doc.text(`Informe a Nombre de: ${informeNombre}`, col1X, y);
    doc.text(`Facturar a Nombre de: ${facturarNombre}`, col2X, y); y += 8;

    const totalRecep = items.reduce((s, it) => s + it.quantity, 0);
    const totalEnt = items.reduce((s, it) => s + it.quantity2, 0);
    let estado = 'Pendiente';
    if (totalRecep === 0) estado = 'Pendiente';
    else if (totalEnt === 0) estado = 'En Proceso';
    else if (totalRecep === totalEnt) estado = 'Completo';
    else estado = 'Parcial';

    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Recepción: ${totalRecep}`, margin + 25, y);
    if (tipo === 'entrega') {
        doc.text(`Total Entrega: ${totalEnt}`, margin + 80, y);
    }
    doc.text(`Estado: ${tipo === 'recepcion' ? 'Recepción' : estado}`, margin + (tipo === 'entrega' ? 140 : 90), y);
    y += 10;

    const acc = items.filter(i => i.type === 'Ensayos Alcance');
    const noAcc = items.filter(i => i.type !== 'Ensayos Alcance');

    function drawTableEntrega(title, tableItems) {
        if (!tableItems || tableItems.length === 0) return;
        maybeAddPage();
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(title, margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        const headerDefs = [
            { key: 'elemento', label: 'Elemento', w: 70, align: 'left' },
            { key: 'cant_recibida', label: 'Cant.\nRecibida', w: 18, align: 'center' },
            { key: 'cant_entregada', label: 'Cant.\nEntregada', w: 18, align: 'center' },
            { key: 'marcas', label: 'Marcas', w: 22, align: 'left' },
            { key: 'no_usado', label: 'No Usado', w: 15, align: 'center' },
            { key: 'usado', label: 'Usado', w: 15, align: 'center' },
            { key: 'lavados', label: 'Lavados', w: 12, align: 'center' },
            { key: 'observaciones', label: 'Observaciones', w: 25, align: 'center' }
        ];
        const lineHeight = 3;
        const headerLines = headerDefs.map(def => {
            const available = Math.max(def.w - 2, 6);
            const lines = doc.splitTextToSize(def.label, available);
            return Array.isArray(lines) ? lines : [def.label];
        });
        const headerHeight = Math.max(...headerLines.map(ls => ls.length)) * lineHeight + 4;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 195, headerHeight, 'F');
        let colX = margin;
        const cols = headerDefs.map((def, i) => {
            const c = { x: colX, w: def.w, align: def.align };
            const lines = headerLines[i];
            const contentH = lines.length * lineHeight;
            const startY = y + (headerHeight - contentH) / 2 + 1;
            lines.forEach((ln, idx) => {
                const tx = def.align === 'left' ? c.x + 2 : c.x + c.w / 2;
                const ty = startY + idx * lineHeight + 1;
                doc.text(ln, tx, ty, { align: def.align === 'left' ? 'left' : 'center' });
            });
            colX += def.w; return c;
        });
        y += headerHeight + 2;
        const fmt = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '-' : String(v));
        doc.setFontSize(9);
        tableItems.forEach((it, idx) => {
            maybeAddPage(270);
            if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 3, 195, 7, 'F'); }
            const desc = (doc.splitTextToSize(it.name, cols[0].w - 4)[0]) || '';
            doc.text(desc, cols[0].x + 2, y);
            doc.text(fmt(it.quantity), cols[1].x + cols[1].w / 2, y, { align: 'center' });
            doc.text(fmt(it.quantity2), cols[2].x + cols[2].w / 2, y, { align: 'center' });
            const marcasText = (function(b) { if (!b) return '-'; if (Array.isArray(b)) return b.map(x => `${x.brand || ''} x${x.count || 0}`).join(', '); return String(b || '-'); })(it.brandSummary);
            const marcasLines = doc.splitTextToSize(marcasText, cols[3].w - 4);
            doc.text(marcasLines, cols[3].x + 2, y);
            doc.text(fmt(it.quantity3), cols[4].x + cols[4].w / 2, y, { align: 'center' });
            doc.text(fmt(it.quantity4), cols[5].x + cols[5].w / 2, y, { align: 'center' });
            doc.text(fmt(it.status), cols[6].x + cols[6].w / 2, y, { align: 'center' });
            const obs = (doc.splitTextToSize(it.observaciones.toString(), cols[7].w - 4)[0]) || '-';
            doc.text(obs, cols[7].x + 2, y);
            y += 7;
        });
        y += 4;
    }

    function drawTableRecepcion(title, tableItems) {
        if (!tableItems || tableItems.length === 0) return;
        maybeAddPage();
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(title, margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        const headerDefs = [
            { key: 'elemento', label: 'Elemento', w: 78, align: 'left' },
            { key: 'cant_recibida', label: 'Cant.\nRecibida', w: 20, align: 'center' },
            { key: 'usados', label: 'Usados', w: 22, align: 'center' },
            { key: 'no_usados', label: 'No\nusados', w: 20, align: 'center' },
            { key: 'lavados', label: 'Lavados', w: 20, align: 'center' },
            { key: 'observaciones', label: 'Observaciones', w: 31, align: 'right' }
        ];
        const lineHeight = 3;
        const headerLines = headerDefs.map(def => {
            const available = Math.max(def.w - 2, 6);
            const lines = doc.splitTextToSize(def.label, available);
            return Array.isArray(lines) ? lines : [def.label];
        });
        const headerHeight = Math.max(...headerLines.map(ls => ls.length)) * lineHeight + 4;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 195, headerHeight, 'F');
        let colX = margin;
        const cols = headerDefs.map((def, i) => {
            const c = { x: colX, w: def.w, align: def.align };
            const lines = headerLines[i];
            const contentH = lines.length * lineHeight;
            const startY = y + (headerHeight - contentH) / 2 + 1;
            lines.forEach((ln, idx) => {
                const tx = def.align === 'left' ? c.x + 2 : c.x + c.w / 2;
                const ty = startY + idx * lineHeight + 1;
                doc.text(ln, tx, ty, { align: def.align === 'left' ? 'left' : 'center' });
            });
            colX += def.w; return c;
        });
        y += headerHeight + 2;
        const fmt = (v) => (v === undefined || v === null || v === '' || Number(v) === 0 ? '-' : String(v));
        doc.setFontSize(9);
        tableItems.forEach((it, idx) => {
            maybeAddPage(270);
            if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 3, 195, 7, 'F'); }
            const desc = (doc.splitTextToSize(it.name, cols[0].w - 4)[0]) || '';
            doc.text(desc, cols[0].x + 2, y);
            doc.text(fmt(it.quantity), cols[1].x + cols[1].w / 2, y, { align: 'center' });
            doc.text(fmt(it.quantity4), cols[2].x + cols[2].w / 2, y, { align: 'center' });
            doc.text(fmt(it.quantity3), cols[3].x + cols[3].w / 2, y, { align: 'center' });
            doc.text(fmt(it.status), cols[4].x + cols[4].w / 2, y, { align: 'center' });
            const obs = (doc.splitTextToSize(it.observaciones.toString(), cols[5].w - 4)[0]) || '-';
            doc.text(obs, cols[5].x + 2, y);
            y += 7;
        });
        y += 4;
    }

    if (tipo === 'entrega') {
        drawTableEntrega('ENSAYOS ALCANCE', acc);
        drawTableEntrega('ENSAYOS NO ACREDITADOS', noAcc);
    } else {
        drawTableRecepcion('ENSAYOS ALCANCE', acc);
        drawTableRecepcion('ENSAYOS NO ACREDITADOS', noAcc);
    }

    const totalLavados = items.reduce((s, it) => s + it.status, 0);
    const hasLavadoData = caso.lavado || caso.elementosLavados || caso.tipoLavado || caso.fechaLavado || caso.observacionesLavado;
    if (hasLavadoData) {
        maybeAddPage(250);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('LAVADO', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Se realizó lavado: ${caso.lavado || '-'}    Elementos lavados: ${caso.elementosLavados || '-'}`, margin, y); y += 5;
        if (caso.observacionesLavado) {
            const obsLav = doc.splitTextToSize(`Observaciones: ${caso.observacionesLavado}`, 195);
            doc.text(obsLav, margin, y); y += obsLav.length * 5;
        }
        y += 2;
    } else {
        maybeAddPage(250);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Lavados', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Cantidad de Lavados: ${totalLavados}`, margin, y); y += 10;
    }

    if (observaciones) {
        maybeAddPage(250);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text('OBSERVACIONES GENERALES', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const obsLines = doc.splitTextToSize(observaciones, 195);
        doc.text(obsLines, margin, y); y += obsLines.length * 5 + 2;
    }

    maybeAddPage(220);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    if (tipo === 'recepcion') {
        doc.text('FIRMA / DATOS CLIENTE (RECEPCIÓN)', margin, y); y += 8;
    } else {
        doc.text('Representantes (CLIENTE)', margin, y); y += 8;
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);

    const sigRec = caso.signatureData?.['signatureCanvasRecepcion'] || caso.signatureData?.Recepcion?.data || null;
    const sigEnt = caso.signatureData?.['signatureCanvasEntrega'] || caso.signatureData?.Entrega?.data || null;

    if (tipo === 'entrega') {
        doc.text('Cliente (Recepción)', margin + 2, y + 6);
        doc.text('Cliente (Entrega)', margin + 102, y + 6);
        if (sigRec) try { doc.addImage(sigRec, 'PNG', margin + 5, y + 10, 70, 25); } catch (_) {}
        if (sigEnt) try { doc.addImage(sigEnt, 'PNG', margin + 105, y + 10, 70, 25); } catch (_) {}
        doc.line(margin + 5, y + 38, margin + 75, y + 38);
        doc.line(margin + 105, y + 38, margin + 175, y + 38);
        doc.setFontSize(9);
        const recepX = margin + 2, entreX = margin + 102, baseY = y + 44;
        doc.text(`Nombre: ${caso.clienteRecepcionNombre || '-'}   Cédula: ${caso.clienteRecepcionCedula || '-'}`, recepX, baseY);
        doc.text(`Cargo: ${caso.clienteRecepcionCargo || '-'}`, recepX, baseY + 5);
        doc.text(`Nombre: ${caso.clienteEntregaNombre || '-'}   Cédula: ${caso.clienteEntregaCedula || '-'}`, entreX, baseY);
        doc.text(`Cargo: ${caso.clienteEntregaCargo || '-'}`, entreX, baseY + 5);
        y += 58;
    } else {
        doc.text('Cliente (Recepción)', margin + 2, y + 6);
        if (sigRec) try { doc.addImage(sigRec, 'PNG', margin + 5, y + 10, 70, 25); } catch (_) {}
        doc.line(margin + 5, y + 38, margin + 75, y + 38);
        doc.setFontSize(9);
        const baseY = y + 44;
        doc.text(`Nombre: ${caso.clienteRecepcionNombre || '-'}   Cédula: ${caso.clienteRecepcionCedula || '-'}`, margin + 2, baseY);
        doc.text(`Cargo: ${caso.clienteRecepcionCargo || '-'}`, margin + 2, baseY + 5);
        y += 58;
    }

    maybeAddPage(240);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    if (tipo === 'entrega') {
        doc.text('Representantes (HIGH TEST)', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Recepción: ${caso.highTestRecepcionNombre || '-'}  |  ${caso.highTestRecepcionCargo || '-'}`, margin, y); y += 5;
        doc.text(`Entrega: ${caso.highTestEntregaNombre || '-'}  |  ${caso.highTestEntregaCargo || '-'}`, margin, y);
    } else {
        doc.text('REPRESENTANTE HIGH TEST (RECEPCIÓN)', margin, y); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`Recepción: ${caso.highTestRecepcionNombre || '-'}  |  ${caso.highTestRecepcionCargo || '-'}`, margin, y);
    }
    y += 8;

    maybeAddPage(260);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.text('Fin Del Documento', 105, y, { align: 'center' }); y += 6;
    addFooter();

    const now = new Date();
    const safeCliente = cliente.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '_').substring(0, 30);
    const safeCot = numRecepcion.replace(/\s+/g, '_');
    const fechaRef = tipo === 'recepcion' ? fechaRecepcion : fechaEntrega;
    const fechaStr = (fechaRef && fechaRef !== '-') ? fechaRef : now.toISOString().split('T')[0];
    const sufijo = tipo === 'recepcion' ? 'Recepcion' : 'Entrega';
    const pdfName = `${safeCot}_${fechaStr}_${safeCliente}_${sufijo}.pdf`;

    try {
        doc.save(pdfName);
        showNotification(`✅ PDF de ${sufijo.toLowerCase()} generado: ${pdfName}`, 'success');
    } catch (e) {
        console.error('Error guardando PDF:', e);
        showNotification('Error al descargar el PDF. Inténtalo de nuevo.', 'error');
    } finally {
        __pdfGenerating = false;
    }
}

function descargarPDFFromCase(numRecepcion, tipo) {
    const casos = obtenerCasosUnificados();
    const caso = casos.find(c => (c.cotizacion || c.quoteNumber || c.numero_proceso) === numRecepcion);
    if (!caso) {
        showNotification('Caso no encontrado.', 'error');
        return;
    }
    generatePDFFromCase(caso, tipo);
}

function descargarTodosPDFs(tipo) {
    const casos = obtenerCasosUnificados();
    const casosValidos = casos.filter(c => {
        if (!c.items || c.items.length === 0) return false;
        if (tipo === 'entrega') {
            const e = (c.estado || c.status || '').toLowerCase();
            return e === 'entrega' || e === 'finalizado' || e === 'entrega-cliente';
        }
        return true;
    });

    if (casosValidos.length === 0) {
        showNotification(`No hay casos con datos para descargar PDFs de ${tipo === 'recepcion' ? 'recepción' : 'entrega'}.`, 'info');
        return;
    }

    const confirmMsg = tipo === 'recepcion'
        ? `Se descargarán ${casosValidos.length} PDFs de recepción. ¿Continuar?`
        : `Se descargarán ${casosValidos.length} PDFs de entrega (solo casos finalizados). ¿Continuar?`;
    if (!confirm(confirmMsg)) return;

    let index = 0;
    function downloadNext() {
        if (index >= casosValidos.length) {
            showNotification(`✅ Se descargaron ${casosValidos.length} PDFs de ${tipo === 'recepcion' ? 'recepción' : 'entrega'}.`, 'success');
            return;
        }
        generatePDFFromCase(casosValidos[index], tipo);
        index++;
        setTimeout(downloadNext, 1500);
    }
    downloadNext();
}

