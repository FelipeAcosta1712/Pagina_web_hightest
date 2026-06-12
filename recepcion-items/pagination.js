// Variables globales para la paginación
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let currentData = [];
let filteredData = [];
let currentTableId = '';
let tableState = new Map(); // Almacena el estado de los inputs

// Función para guardar el estado de una fila
function saveRowState(rowIndex, row) {
    const state = {
        recepcion: row.querySelector('.cantidad-input:nth-of-type(1)').value,
        entrega: row.querySelector('.cantidad-input:nth-of-type(2)').value,
        noUsado: row.querySelector('.cantidad-input:nth-of-type(3)').value,
        usado: row.querySelector('.cantidad-input:nth-of-type(4)').value,
        lavado: row.querySelector('.cantidad-input:nth-of-type(5)').value,
        observaciones: row.querySelector('.observaciones-input').value
    };
    
    if (!tableState.has(currentTableId)) {
        tableState.set(currentTableId, new Map());
    }
    tableState.get(currentTableId).set(rowIndex, state);
}

// Función para obtener el estado de una fila
function getRowState(rowIndex) {
    if (!tableState.has(currentTableId)) return null;
    return tableState.get(currentTableId).get(rowIndex);
}

// Función para cargar los datos iniciales
function loadTableData(menuId) {
    const jsonFile = menuId === 'menu1' ? 'list_elementos.json' : 'list_elementos2.json';
    const tableId = menuId === 'menu1' ? 'elementsTableBody' : 'elementsTableBody2';
    
    fetch(jsonFile)
        .then(response => response.json())
        .then(data => {
            currentData = data;
            filteredData = data;
            currentTableId = tableId;
            setupSearchAndFilters(tableId);
            displayTableData(data, tableId, 1);
        })
        .catch(error => console.error('Error loading data:', error));
}

// Función para mostrar los datos en la tabla
function displayTableData(data, tableId, page) {
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, data.length);
    const paginatedData = data.slice(start, end);

    // Limpiar tabla
    tableBody.innerHTML = '';

    // Mostrar datos
    paginatedData.forEach((item, index) => {
        const globalIndex = start + index;
        const row = document.createElement('div');
        row.className = 'table-row';
        
        // Recuperar el estado guardado o usar valores por defecto
        const savedState = getRowState(globalIndex) || {
            cantidad: "0",
            cantidad: "0",
            estado: "no-usado",
            lavado: "no",
            observaciones: ""
        };
        
        row.innerHTML = `
            <div>${globalIndex + 1}</div>
            <div>${item.nombre || ''}</div>
            <div><input type="number" value="${savedState.cantidad}" min="0" class="cantidad-input"></div>
            <div><input type="number" value="${savedState.cantidad}" min="0" class="cantidad-input"></div>
            <div class="checkbox-cell">
                <input type="number" min="0" ${savedState.estado === 'si' ? 'checked' : ''}>
            </div>
            <div class="checkbox-cell">
                <input type="number" min="0" ${savedState.estado === 'si' ? 'checked' : ''}>
            </div>
            <div class="checkbox-cell">
                <input type="number" min="0" ${savedState.lavado === 'si' ? 'checked' : ''}>
            </div>
            <div><input type="text" class="observaciones-input" value="${savedState.observaciones}" placeholder="Agregar observación..."></div>
            <div>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
                <button id="guardarBtn"><i class="fas fa-save"></i></button>
            </div>
        `;
        
        // Agregar event listeners para guardar cambios
        row.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('change', () => {
                const state = {
                    cantidad: row.querySelector('.cantidad-input').value,
                    cantidad: row.querySelector('.cantidad-input').value,
                    estado: row.querySelector('.estado-select').value,
                    lavado: row.querySelector('.lavado-select').value,
                    observaciones: row.querySelector('.observaciones-input').value
                };
                saveRowState(globalIndex, state);
            });
        });
        
        tableBody.appendChild(row);
    });

    updatePagination(data.length, tableId + 'Pagination', page);
}

// Función para actualizar la paginación
function updatePagination(totalItems, paginationId, currentPage) {
    const paginationContainer = document.getElementById(paginationId);
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    paginationContainer.innerHTML = '';

    // Botón Anterior
    if (totalPages > 1) {
        addPageButton('«', Math.max(1, currentPage - 1), paginationContainer);
    }

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= 7 || 
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 1 && i <= currentPage + 1)) {
            addPageButton(i.toString(), i, paginationContainer);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const span = document.createElement('span');
            span.className = 'pagination-ellipsis';
            span.textContent = '...';
            paginationContainer.appendChild(span);
        }
    }

    // Botón Siguiente
    if (totalPages > 1) {
        addPageButton('»', Math.min(totalPages, currentPage + 1), paginationContainer);
    }
}

// Función para agregar botones de página
function addPageButton(text, pageNumber, container) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'pagination-btn' + (pageNumber === currentPage ? ' active' : '');
    button.addEventListener('click', () => {
        currentPage = pageNumber;
        displayTableData(currentData, currentTableId, currentPage);
    });
    container.appendChild(button);
}

// Sobrescribir la función mostrarMenu existente
function mostrarMenu() {
    const select = document.getElementById('opciones');
    const menu1 = document.getElementById('menu1');
    const menu2 = document.getElementById('menu2');

    // Resetear la página actual
    currentPage = 1;

    if (select.value === 'menu1') {
        menu1.style.display = 'block';
        menu2.style.display = 'none';
        loadTableData('menu1');
    } else if (select.value === 'menu2') {
        menu1.style.display = 'none';
        menu2.style.display = 'block';
        loadTableData('menu2');
    } else {
        menu1.style.display = 'none';
        menu2.style.display = 'none';
    }
}

// Función para configurar búsqueda y filtros
function setupSearchAndFilters(tableId) {
    const menuId = tableId === 'elementsTableBody' ? 'menu1' : 'menu2';
    const menu = document.getElementById(menuId);
    
    // Configurar búsqueda
    const searchInput = menu.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndDisplayData(tableId);
        });
    }

    // Configurar filtros de botones
    const filterButtons = menu.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remover clase active de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar clase active al botón clickeado
            e.target.classList.add('active');
            filterAndDisplayData(tableId);
        });
    });
}

// Función para filtrar y mostrar datos
function filterAndDisplayData(tableId) {
    const menuId = tableId === 'elementsTableBody' ? 'menu1' : 'menu2';
    const menu = document.getElementById(menuId);
    const searchInput = menu.querySelector('.search-bar input');
    const activeFilter = menu.querySelector('.filter-btn.active');

    let filtered = [...currentData];

    // Aplicar filtro de tipo
    if (activeFilter && activeFilter.dataset.filter !== 'Todos') {
        filtered = filtered.filter(item => item.tipo === activeFilter.dataset.filter);
    }

    // Aplicar filtro de búsqueda
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(item => 
            item.nombre.toLowerCase().includes(searchTerm) ||
            (item.tipo && item.tipo.toLowerCase().includes(searchTerm))
        );
    }

    filteredData = filtered;
    currentPage = 1; // Resetear a la primera página
    displayTableData(filtered, tableId, 1);
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales si hay un menú seleccionado
    const select = document.getElementById('opciones');
    if (select && (select.value === 'menu1' || select.value === 'menu2')) {
        mostrarMenu();
    }
});
