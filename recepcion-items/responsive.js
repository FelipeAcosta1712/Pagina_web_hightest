// =======================================================
// FUNCIONES DE DISEÑO RESPONSIVO Y MÓVIL
// =======================================================

/**
 * Funcionalidades específicas para dispositivos móviles y responsive
 * Incluye detección de dispositivos, optimizaciones de UX móvil y adaptaciones
 */

// Estado del sistema responsivo
const responsiveState = {
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait',
    screenSize: 'desktop',
    touchEnabled: false
};

// =======================================================
// DETECCIÓN DE DISPOSITIVOS
// =======================================================

/**
 * Detecta el tipo de dispositivo y actualiza el estado
 */
function detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Detectar por ancho de pantalla
    responsiveState.isMobile = width <= 768;
    responsiveState.isTablet = width > 768 && width <= 1024;
    responsiveState.isDesktop = width > 1024;
    
    // Detectar orientación
    responsiveState.orientation = height > width ? 'portrait' : 'landscape';
    
    // Determinar tamaño de pantalla
    if (width <= 480) {
        responsiveState.screenSize = 'mobile-small';
    } else if (width <= 768) {
        responsiveState.screenSize = 'mobile-large';
    } else if (width <= 1024) {
        responsiveState.screenSize = 'tablet';
    } else if (width <= 1440) {
        responsiveState.screenSize = 'desktop';
    } else {
        responsiveState.screenSize = 'desktop-large';
    }
    
    // Detectar touch
    responsiveState.touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Actualizar clases del body
    updateBodyClasses();
    
    console.log('📱 Dispositivo detectado:', responsiveState);
}

/**
 * Actualiza las clases CSS del body según el dispositivo
 */
function updateBodyClasses() {
    const body = document.body;
    
    // Limpiar clases anteriores
    body.classList.remove('mobile', 'tablet', 'desktop', 'touch', 'no-touch', 'portrait', 'landscape');
    
    // Agregar clases actuales
    if (responsiveState.isMobile) body.classList.add('mobile');
    if (responsiveState.isTablet) body.classList.add('tablet');
    if (responsiveState.isDesktop) body.classList.add('desktop');
    
    body.classList.add(responsiveState.touchEnabled ? 'touch' : 'no-touch');
    body.classList.add(responsiveState.orientation);
    body.classList.add(responsiveState.screenSize);
}

// =======================================================
// OPTIMIZACIONES PARA MÓVILES
// =======================================================

/**
 * Optimiza el formulario para dispositivos móviles
 */
function optimizeForMobile() {
    if (!responsiveState.isMobile) return;
    
    console.log('📱 Optimizando para móvil...');
    
    // Agregar clases responsivas a elementos principales
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.classList.add('mobile-optimized');
    }
    
    // Optimizar inputs para móvil
    optimizeInputsForMobile();
    
    // Optimizar botones para móvil
    optimizeButtonsForMobile();
    
    // Optimizar tablas para móvil
    optimizeTablesForMobile();
    
    // Agregar scroll suave
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Mejorar accesibilidad táctil
    enhanceTouchAccessibility();
}

/**
 * Optimiza inputs para dispositivos móviles
 */
function optimizeInputsForMobile() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        // Ajustar tamaño de fuente para evitar zoom en iOS
        if (input.type === 'text' || input.type === 'email' || input.type === 'tel' || input.tagName === 'TEXTAREA') {
            input.style.fontSize = '16px';
        }
        
        // Agregar atributos para mejor UX móvil
        if (input.type === 'email') {
            input.setAttribute('inputmode', 'email');
            input.setAttribute('autocomplete', 'email');
        }
        
        if (input.type === 'tel') {
            input.setAttribute('inputmode', 'tel');
            input.setAttribute('autocomplete', 'tel');
        }
        
        if (input.type === 'number') {
            input.setAttribute('inputmode', 'numeric');
        }
        
        // Mejorar área de toque
        input.style.minHeight = '44px';
        input.classList.add('touch-optimized');
    });
}

/**
 * Optimiza botones para dispositivos móviles
 */
function optimizeButtonsForMobile() {
    const buttons = document.querySelectorAll('button, .btn');
    
    buttons.forEach(button => {
        // Asegurar área de toque mínima
        if (!button.classList.contains('btn-sm')) {
            button.style.minHeight = '48px';
            button.style.minWidth = '48px';
        }
        
        button.classList.add('touch-target');
        
        // Mejorar feedback táctil
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
    });
}

/**
 * Optimiza tablas para dispositivos móviles
 */
function optimizeTablesForMobile() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        // Envolver tabla en contenedor responsivo si no existe
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentElement.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
        
        // Agregar alternativa de vista de cards para móviles muy pequeños
        if (responsiveState.screenSize === 'mobile-small') {
            createTableCardView(table);
        }
    });
}

/**
 * Crea vista de cards para tablas en pantallas pequeñas
 */
function createTableCardView(table) {
    const cardView = document.createElement('div');
    cardView.className = 'table-card-view';
    cardView.style.display = 'none';
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach((row, index) => {
        const card = document.createElement('div');
        card.className = 'table-card';
        
        const cardTitle = document.createElement('div');
        cardTitle.className = 'table-card-title';
        cardTitle.textContent = `Registro ${index + 1}`;
        card.appendChild(cardTitle);
        
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, cellIndex) => {
            if (headers[cellIndex] && cell.textContent.trim()) {
                const item = document.createElement('div');
                item.className = 'table-card-item';
                
                const label = document.createElement('span');
                label.className = 'table-card-label';
                label.textContent = headers[cellIndex];
                
                const value = document.createElement('span');
                value.className = 'table-card-value';
                value.innerHTML = cell.innerHTML;
                
                item.appendChild(label);
                item.appendChild(value);
                card.appendChild(item);
            }
        });
        
        cardView.appendChild(card);
    });
    
    // Insertar vista de cards después de la tabla
    table.parentElement.insertAdjacentElement('afterend', cardView);
    
    // Agregar botón para alternar vistas
    addTableViewToggle(table, cardView);
}

/**
 * Agrega botón para alternar entre vista de tabla y cards
 */
function addTableViewToggle(table, cardView) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-sm btn-outline-secondary table-view-toggle visible-mobile';
    toggleBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Cambiar Vista';
    toggleBtn.style.marginBottom = '10px';
    
    let showingCards = false;
    
    // toggleBtn.addEventListener('click', function() {
    //     showingCards = !showingCards;
        
    //     if (showingCards) {
    //         table.parentElement.style.display = 'none';
    //         cardView.style.display = 'block';
    //         toggleBtn.innerHTML = '<i class="fas fa-table"></i> Vista Tabla';
    //     } else {
    //         table.parentElement.style.display = 'block';
    //         cardView.style.display = 'none';
    //         toggleBtn.innerHTML = '<i class="fas fa-th-large"></i> Vista Cards';
    //     }
    // });
    
    table.parentElement.insertAdjacentElement('beforebegin', toggleBtn);
}

// =======================================================
// MEJORAS DE ACCESIBILIDAD TÁCTIL
// =======================================================

/**
 * Mejora la accesibilidad para dispositivos táctiles
 */
function enhanceTouchAccessibility() {
    // Mejorar contraste para pantallas pequeñas
    if (responsiveState.screenSize === 'mobile-small') {
        document.body.classList.add('high-contrast-mobile');
    }
    
    // Agregar indicadores de interacción
    addTouchIndicators();
    
    // Mejorar navegación por teclado
    enhanceKeyboardNavigation();
    
    // Optimizar scroll
    optimizeScrolling();
}

/**
 * Agrega indicadores visuales para elementos interactivos
 */
function addTouchIndicators() {
    const interactiveElements = document.querySelectorAll('button, .btn, input, select, textarea, a, [onclick], [role="button"]');
    
    interactiveElements.forEach(element => {
        // Agregar clase de elemento interactivo
        element.classList.add('interactive-element');
        
        // Agregar ripple effect para feedback táctil
        element.addEventListener('touchstart', createRippleEffect, { passive: true });
    });
}

/**
 * Crea efecto de ripple para feedback táctil
 */
function createRippleEffect(event) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.touches[0].clientX - rect.left - size / 2;
    const y = event.touches[0].clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1;
    `;
    
    // Asegurar posición relativa
    if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
    }
    
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    // Eliminar ripple después de la animación
    setTimeout(() => {
        if (ripple.parentElement) {
            ripple.parentElement.removeChild(ripple);
        }
    }, 600);
}

/**
 * Mejora la navegación por teclado
 */
function enhanceKeyboardNavigation() {
    // Asegurar que todos los elementos interactivos sean focusables
    const interactiveElements = document.querySelectorAll('button, .btn, input, select, textarea, a');
    
    interactiveElements.forEach((element, index) => {
        if (!element.hasAttribute('tabindex') && !element.disabled) {
            element.tabIndex = 0;
        }
        
        // Mejorar indicador de focus
        element.addEventListener('focus', function() {
            this.classList.add('keyboard-focused');
        });
        
        element.addEventListener('blur', function() {
            this.classList.remove('keyboard-focused');
        });
    });
}

/**
 * Optimiza el comportamiento del scroll
 */
function optimizeScrolling() {
    // Scroll suave para dispositivos que lo soporten
    if ('scrollBehavior' in document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    // Optimizar scroll en contenedores específicos
    const scrollContainers = document.querySelectorAll('.table-responsive, .modal-content');
    
    scrollContainers.forEach(container => {
        container.classList.add('scroll-container');
        
        // Agregar momentum scrolling en iOS
        container.style.webkitOverflowScrolling = 'touch';
        container.style.overscrollBehavior = 'contain';
    });
}

// =======================================================
// FUNCIONES DE ORIENTACIÓN
// =======================================================

/**
 * Maneja cambios de orientación
 */
function handleOrientationChange() {
    // Esperar a que se complete el cambio de orientación
    setTimeout(() => {
        detectDevice();
        
        // Reoptimizar para la nueva orientación
        if (responsiveState.isMobile) {
            optimizeForMobile();
        }
        
        // Ajustar modales si están abiertos
        adjustModalsForOrientation();
        
        // Notificar cambio
        console.log('🔄 Orientación cambiada:', responsiveState.orientation);
        
    }, 100);
}

/**
 * Ajusta modales para cambios de orientación
 */
function adjustModalsForOrientation() {
    const modals = document.querySelectorAll('.modal:not([style*="display: none"])');
    
    modals.forEach(modal => {
        const content = modal.querySelector('.modal-content');
        if (content) {
            if (responsiveState.orientation === 'landscape' && responsiveState.isMobile) {
                content.style.maxHeight = '90vh';
                content.style.overflowY = 'auto';
            } else {
                content.style.maxHeight = '95vh';
            }
        }
    });
}

// =======================================================
// FUNCIONES DE NOTIFICACIONES MÓVILES
// =======================================================

/**
 * Muestra notificación optimizada para móviles
 */
function showMobileNotification(message, type = 'info', duration = 5000) {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('mobile-notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mobile-notifications';
        container.className = 'mobile-notifications-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            max-width: calc(100vw - 20px);
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `mobile-notification mobile-notification-${type}`;
    notification.style.cssText = `
        background: ${getNotificationColor(type)};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInTop 0.3s ease-out;
        pointer-events: auto;
        max-width: 100%;
        word-wrap: break-word;
    `;
    
    notification.textContent = message;
    
    // Agregar botón de cerrar
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        float: right;
        margin-left: 10px;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    notification.appendChild(closeBtn);
    container.appendChild(notification);
    
    // Auto-remove después del tiempo especificado
    setTimeout(() => {
        if (notification.parentElement) {
            removeNotification(notification);
        }
    }, duration);
}

/**
 * Obtiene el color de la notificación según el tipo
 */
function getNotificationColor(type) {
    const colors = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };
    return colors[type] || colors['info'];
}

/**
 * Remueve una notificación con animación
 */
function removeNotification(notification) {
    notification.style.animation = 'slideOutTop 0.3s ease-in forwards';
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 300);
}

// =======================================================
// INICIALIZACIÓN Y EVENTOS
// =======================================================

/**
 * Inicializa el sistema responsivo
 */
function initializeResponsiveSystem() {
    console.log('📱 Inicializando sistema responsivo...');
    
    // Detectar dispositivo inicial
    detectDevice();
    
    // Optimizar para móvil si es necesario
    if (responsiveState.isMobile) {
        optimizeForMobile();
    }
    
    // Configurar eventos
    window.addEventListener('resize', debounce(detectDevice, 150));
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Agregar estilos CSS dinámicos
    addResponsiveStyles();
    
    // Interceptar notificaciones existentes para móviles
    if (responsiveState.isMobile && typeof showNotification === 'function') {
        const originalShowNotification = window.showNotification;
        window.showNotification = function(message, type, duration) {
            if (responsiveState.isMobile) {
                showMobileNotification(message, type, duration);
            } else {
                originalShowNotification(message, type, duration);
            }
        };
    }
    
    console.log('✅ Sistema responsivo inicializado');
}

/**
 * Agrega estilos CSS dinámicos para el sistema responsivo
 */
function addResponsiveStyles() {
    if (document.getElementById('responsive-dynamic-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'responsive-dynamic-styles';
    styles.textContent = `
        /* Animaciones para notificaciones móviles */
        @keyframes slideInTop {
            from { transform: translateY(-100px) translateX(-50%); opacity: 0; }
            to { transform: translateY(0) translateX(-50%); opacity: 1; }
        }
        
        @keyframes slideOutTop {
            from { transform: translateY(0) translateX(-50%); opacity: 1; }
            to { transform: translateY(-100px) translateX(-50%); opacity: 0; }
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        /* Estilos para elementos con focus de teclado */
        .keyboard-focused {
            outline: 3px solid #4A90E2 !important;
            outline-offset: 2px !important;
        }
        
        /* Estilos para alto contraste en móvil */
        .high-contrast-mobile .text-muted {
            color: #555 !important;
        }
        
        .high-contrast-mobile .bg-light {
            background-color: #f8f9fa !important;
            border: 1px solid #e9ecef !important;
        }
        
        /* Optimizaciones para touch */
        .touch-optimized {
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
        
        .touch-target {
            position: relative;
            overflow: hidden;
        }
        
        .interactive-element:active {
            transform: scale(0.98);
        }
    `;
    
    document.head.appendChild(styles);
}

/**
 * Función de debounce para optimizar eventos
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =======================================================
// UTILIDADES PÚBLICAS
// =======================================================

/**
 * Verifica si estamos en un dispositivo móvil
 */
function isMobileDevice() {
    return responsiveState.isMobile;
}

/**
 * Verifica si estamos en una tablet
 */
function isTabletDevice() {
    return responsiveState.isTablet;
}

/**
 * Obtiene información del dispositivo actual
 */
function getDeviceInfo() {
    return { ...responsiveState };
}

/**
 * Fuerza la detección del dispositivo
 */
function forceDeviceDetection() {
    detectDevice();
    if (responsiveState.isMobile) {
        optimizeForMobile();
    }
}

// Exponer funciones globales
window.initializeResponsiveSystem = initializeResponsiveSystem;
window.isMobileDevice = isMobileDevice;
window.isTabletDevice = isTabletDevice;
window.getDeviceInfo = getDeviceInfo;
window.forceDeviceDetection = forceDeviceDetection;
window.showMobileNotification = showMobileNotification;

console.log('📱 Sistema de funciones responsivas cargado');
