// =======================================================
// SISTEMA DE AUTENTICACIÓN
// =======================================================

/**
 * Sistema de autenticación con usuarios predefinidos y roles
 * Incluye login, logout, control de sesiones y permisos
 */

const ROLE_PERMISSIONS = {
    administrador: ['crear', 'editar', 'eliminar', 'ver', 'configurar'],
    director_tecnico: ['crear', 'editar', 'eliminar', 'ver'],
    tecnico_ensayos: ['crear', 'editar', 'ver'],
    operador: ['crear', 'ver'],
    cliente: ['ver', 'crear']
};

// Configuración de sesión
const SESSION_CONFIG = {
    duration: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
    warningTime: 15 * 60 * 1000,  // Advertir 15 minutos antes
    storageKey: 'hightest_session'
};

// Variable global para el usuario actual
let currentUser = null;
let sessionTimer = null;
let warningTimer = null;

// =======================================================
// FUNCIONES DE AUTENTICACIÓN
// =======================================================

/**
 * Intenta autenticar un usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Object} Resultado de la autenticación
 */
function buildUserFromRole(row) {
    const roleKey = String(row?.rol || '').trim().toLowerCase();
    const permissions = ROLE_PERMISSIONS[roleKey] || ['ver'];

    return {
        id: row?.id || row?.user_id || `user_${Date.now()}`,
        nombre: row?.nombre || row?.name || row?.email || 'Usuario',
        email: String(row?.email || '').trim().toLowerCase(),
        rol: roleKey || 'cliente',
        permisos: Array.isArray(row?.permisos) && row.permisos.length ? row.permisos : permissions,
        activo: row?.activo !== false,
        ultimoAcceso: row?.ultimoAcceso || new Date().toISOString()
    };
}

async function authenticateUser(email, password) {
    try {
        const response = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        });

        const result = await response.json();
        if (!response.ok || !result?.ok || !result?.user) {
            return { success: false, error: result?.error || 'Credenciales inválidas' };
        }

        const user = buildUserFromRole(result.user);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error?.message || 'No se pudo autenticar' };
    }
}

/**
 * Inicia sesión de usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {boolean} True si el login fue exitoso
 */
async function login(email, password) {
    const result = await authenticateUser(email, password);
    
    if (!result.success) {
        safeNotification(`❌ ${result.error}`, 'error');
        return false;
    }

    // **LIMPIAR MODO SOLO LECTURA ANTES DE AUTENTICAR**
    exitReadOnlyMode();
    
    // Crear sesión
    const session = {
        user: result.user,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        sessionId: generateSessionId()
    };
    
    // Guardar sesión
    localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(session));
    sessionStorage.setItem('session_active', 'true');
    
    // Establecer usuario actual
    currentUser = result.user;
    
    // Configurar timers de sesión
    setupSessionTimers();
    
    // Actualizar UI según los permisos del usuario autenticado
    updateUIForUser();
    hideLoginModal();
    
    // Aplicar permisos específicos del usuario
    applyUserPermissions(result.user);
    
    // Registrar actividad
    logUserActivity('login');
    
    showNotification(`¡Bienvenido ${result.user.nombre}! Sesión iniciada con permisos de ${result.user.rol}`, 'success');
    
    console.log('✅ Usuario autenticado:', result.user);
    console.log('🔐 Modo solo lectura desactivado, permisos aplicados:', result.user.permisos);
    return true;
}

/**
 * Muestra opciones al hacer clic en "Salir"
 */
function showLogoutOptions() {
    const modal = document.createElement('div');
    modal.id = 'logoutOptionsModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content" style="max-width: 400px;">
            <div class="auth-header">
                <h3>🚪 Opciones de Salida</h3>
                <p>¿Qué deseas hacer?</p>
            </div>
            
            <div class="logout-options">
                <button onclick="fullLogout()" class="auth-btn auth-btn-primary" style="margin-bottom: 10px;">
                    🔓 Cerrar Sesión Completa
                    <small>Volver al login para ingresar con otro usuario</small>
                </button>
                
                <button onclick="viewOnlyMode()" class="auth-btn auth-btn-secondary" style="margin-bottom: 10px;">
                    👁️ Solo Ver Formato
                    <small>Minimizar sesión para solo visualizar</small>
                </button>
                
                <button onclick="cancelLogout()" class="auth-btn auth-btn-light">
                    ❌ Cancelar
                    <small>Continuar con la sesión actual</small>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus en el modal para accesibilidad
    modal.focus();
}

/**
 * Cierra sesión completamente (comportamiento original)
 */
function fullLogout() {
    // Cerrar modal de opciones
    const optionsModal = document.getElementById('logoutOptionsModal');
    if (optionsModal) {
        optionsModal.remove();
    }
    
    console.log('🔓 Iniciando cierre de sesión completo...');
    
    if (currentUser) {
        logUserActivity('full_logout');
        safeNotification(`👋 Hasta luego, ${currentUser.nombre}`, 'info');
    }
    
    // Limpiar TODOS los estados y modales existentes
    try {
        localStorage.removeItem(SESSION_CONFIG.storageKey);
        sessionStorage.removeItem('session_active');
        
        // Limpiar también otros datos de sesión si existen
        localStorage.removeItem('user_preferences');
        sessionStorage.clear();
    } catch (error) {
        console.error('Error al limpiar almacenamiento:', error);
    }
    
    // Limpiar timers de forma segura
    if (sessionTimer) {
        clearTimeout(sessionTimer);
        sessionTimer = null;
    }
    if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = null;
    }
    
    // Resetear variables globales
    currentUser = null;
    
    // Limpiar TODAS las clases del body
    document.body.classList.remove('user-authenticated', 'user-anonymous', 'view-only-mode');
    document.body.classList.add('user-anonymous');
    
    // Limpiar UI del usuario actual
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.remove();
    }
    
    // Cerrar CUALQUIER modal existente
    const existingModals = document.querySelectorAll('#authModal, #credentialsModal, #logoutOptionsModal');
    existingModals.forEach(modal => modal.remove());
    
    // Rehabilitar todos los elementos que puedan estar deshabilitados
    const disabledElements = document.querySelectorAll('[disabled]');
    disabledElements.forEach(element => {
        element.disabled = false;
        element.style.opacity = '';
        element.title = '';
    });
    
    // Forzar mostrar el modal de login después de un pequeño delay
    setTimeout(() => {
        showLoginModal();
        console.log('✅ Modal de login mostrado');
    }, 100);
    
    // Bloquear interfaz
    updateUIForUser();
    
    console.log('✅ Sesión cerrada completamente - Listo para nuevo usuario');
}

/**
 * Activa modo "solo visualización"
 */
function viewOnlyMode() {
    // Cerrar modal de opciones
    const optionsModal = document.getElementById('logoutOptionsModal');
    if (optionsModal) {
        optionsModal.remove();
    }
    
    if (currentUser) {
        logUserActivity('view_only_mode');
        safeNotification(`👁️ Modo solo lectura activado`, 'info');
    }
    
    // Marcar como modo solo lectura
    document.body.classList.add('view-only-mode');
    
    // Actualizar información del usuario para mostrar el modo
    updateUserInfoViewOnly();
    
    // Deshabilitar todos los controles excepto los de visualización
    applyViewOnlyRestrictions();
    
    console.log('👁️ Modo solo visualización activado');
}

/**
 * Cancela la acción de logout
 */
function cancelLogout() {
    const optionsModal = document.getElementById('logoutOptionsModal');
    if (optionsModal) {
        optionsModal.remove();
    }
    
    safeNotification('↩️ Continuando con la sesión actual', 'info');
}

/**
 * Entra en modo solo lectura sin autenticación
 */
function enterReadOnlyMode() {
    console.log('👁️ Iniciando proceso de modo solo lectura...');
    
    // Mostrar confirmación antes de activar modo solo lectura
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.id = 'readOnlyConfirmModal';
    modal.innerHTML = `
        <div class="auth-modal-content" style="max-width: 500px;">
            <h3 style="text-align: center; margin-bottom: 20px; color: #6f42c1;">
                <span style="font-size: 24px;">👁️</span><br>
                Modo Solo Lectura
            </h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #495057; line-height: 1.5;">
                    <strong>¿Qué puedes hacer en este modo?</strong><br>
                    • Ver todo el formato completo<br>
                    • Navegar por todas las secciones<br>
                    • Revisar la información sin restricciones<br><br>
                    
                    <strong>Limitaciones:</strong><br>
                    • No podrás editar ningún campo<br>
                    • No podrás guardar cambios<br>
                    • No podrás generar reportes
                </p>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="confirmReadOnlyMode()" class="auth-btn" style="background: #6f42c1; flex: 1;">
                    <span style="font-size: 16px;">👁️</span>
                    Continuar en Solo Lectura
                </button>
                <button onclick="cancelReadOnlyMode()" class="auth-btn" style="background: #6c757d; color: white; flex: 1;">
                    <span style="font-size: 16px;">↩️</span>
                    Volver al Login
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar modal con animación
    setTimeout(() => {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
    }, 10);
}

/**
 * Confirma y activa el modo solo lectura
 */
function confirmReadOnlyMode() {
    console.log('👁️ Activando modo solo lectura confirmado...');
    
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('readOnlyConfirmModal');
    if (confirmModal) {
        confirmModal.remove();
    }
    
    // Cerrar modal de login si existe
    hideLoginModal();
    
    // Crear un usuario temporal para modo de solo lectura
    currentUser = {
        id: 'readonly_user',
        nombre: 'Visitante',
        email: 'readonly@sistema.local',
        rol: 'readonly',
        permisos: ['ver'],
        activo: true,
        isReadOnly: true
    };
    
    // No crear sesión persistente para modo solo lectura
    // Esto permite que al recargar la página vuelva al login
    
    // Marcar como modo solo lectura
    document.body.classList.add('view-only-mode', 'anonymous-readonly');
    
    // Crear interfaz especial para modo solo lectura
    updateUserInfoReadOnly();
    
    // Aplicar restricciones de solo lectura
    applyReadOnlyRestrictions();
    
    // Log de la actividad
    console.log('✅ Modo solo lectura activado para visitante');
    
    safeNotification('👁️ Modo solo lectura activado. Puede ver el formato sin restricciones.', 'info');
}

/**
 * Cancela el modo solo lectura y vuelve al login
 */
function cancelReadOnlyMode() {
    console.log('↩️ Cancelando modo solo lectura...');
    
    // Cerrar modal de confirmación
    const confirmModal = document.getElementById('readOnlyConfirmModal');
    if (confirmModal) {
        confirmModal.remove();
    }
    
    // El modal de login ya estaba abierto, no necesitamos hacer nada más
    console.log('✅ Volviendo al modal de login');
}

/**
 * Cierra la sesión actual (función original renombrada)
 */
function logout() {
    // En lugar de cerrar directamente, mostrar opciones
    showLogoutOptions();
}

/**
 * Verifica si hay una sesión válida
 * @returns {boolean} True si la sesión es válida
 */
function checkSession() {
    try {
        const sessionData = localStorage.getItem(SESSION_CONFIG.storageKey);
        
        if (!sessionData) {
            console.log('🔍 No hay datos de sesión guardados');
            return false;
        }
        
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        // Verificar estructura de la sesión
        if (!session.user || !session.loginTime || !session.lastActivity) {
            console.log('⚠️ Datos de sesión incompletos');
            localStorage.removeItem(SESSION_CONFIG.storageKey);
            return false;
        }
        
        // Verificar si la sesión ha expirado
        if (now - session.lastActivity > SESSION_CONFIG.duration) {
            console.log('⏰ Sesión expirada');
            logout();
            safeNotification('⏰ Sesión expirada. Por favor, inicie sesión nuevamente.', 'warning');
            return false;
        }
        
        // Restaurar sesión usando la información guardada en localStorage
        const user = {
            ...session.user,
            permisos: Array.isArray(session.user.permisos) && session.user.permisos.length
                ? session.user.permisos
                : (ROLE_PERMISSIONS[String(session.user.rol || '').trim().toLowerCase()] || ['ver'])
        };

        if (!user.email || !user.rol) {
            console.log('❌ Usuario no válido o desactivado');
            logout();
            return false;
        }

        // Restaurar sesión
        currentUser = user;
        
        // Actualizar última actividad
        session.lastActivity = now;
        localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(session));
        
        // Configurar timers solo si no están ya configurados
        if (!sessionTimer) {
            setupSessionTimers();
        }
        
        console.log('✅ Sesión válida restaurada para:', user.nombre);
        return true;
        
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        // Limpiar datos corruptos
        localStorage.removeItem(SESSION_CONFIG.storageKey);
        sessionStorage.removeItem('session_active');
        currentUser = null;
        return false;
    }
}

/**
 * Actualiza la actividad del usuario (mantiene la sesión activa)
 */
function updateUserActivity() {
    if (!currentUser) return;
    
    const sessionData = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = Date.now();
        localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(session));
    }
}

// =======================================================
// CONTROL DE PERMISOS
// =======================================================

/**
 * Verifica si el usuario actual tiene un permiso específico
 * @param {string} permiso - Permiso a verificar
 * @returns {boolean} True si tiene el permiso
 */
function hasPermission(permiso) {
    if (!currentUser) return false;
    return currentUser.permisos.includes(permiso);
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} rol - Rol a verificar
 * @returns {boolean} True si tiene el rol
 */
function hasRole(rol) {
    if (!currentUser) return false;
    return currentUser.rol === rol;
}

/**
 * Bloquea elementos de la interfaz según permisos
 */
function applyPermissions() {
    if (!currentUser) {
        // Sin usuario: bloquear todo
        document.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (!el.classList.contains('auth-allowed')) {
                el.disabled = true;
            }
        });
        return;
    }
    
    // Habilitar elementos según permisos
    document.querySelectorAll('[data-permission]').forEach(element => {
        const requiredPermission = element.dataset.permission;
        const hasAccess = hasPermission(requiredPermission);
        
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'SELECT') {
            element.disabled = !hasAccess;
        } else {
            element.style.display = hasAccess ? '' : 'none';
        }
        
        if (!hasAccess) {
            element.title = 'No tiene permisos para esta acción';
        }
    });
    
    // Control específico por roles
    const isAdmin = hasRole('administrador');
    const isDirector = hasRole('director_tecnico');
    const isTecnico = hasRole('tecnico_ensayos');
    const isOperador = hasRole('operador');
    const isCliente = hasRole('cliente');
    
    // Solo admin puede ver configuración
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });
    
    // Director y admin pueden eliminar
    document.querySelectorAll('.delete-btn').forEach(el => {
        const allowedToDelete = (isAdmin || isDirector);
        el.disabled = !allowedToDelete;
        el.style.display = '';

        if (!allowedToDelete) {
            try {
                // Guardar onclick original para posible restauración
                if (!el.dataset.origOnclick) {
                    const orig = el.getAttribute('onclick') || '';
                    el.dataset.origOnclick = orig;
                }
                // Quitar onclick inline para evitar ejecuciones
                el.removeAttribute('onclick');
                // Añadir un handler seguro que sólo muestra notificación
                if (!el.dataset.preventHandlerAttached) {
                    el.addEventListener('click', function preventDeleteClick(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        try { showNotification('❌ No tienes permisos para eliminar.', 'error'); } catch (err) { alert('No tienes permisos para eliminar.'); }
                    });
                    el.dataset.preventHandlerAttached = '1';
                }
                // Ajustar aspecto del botón
                el.style.opacity = '0.6';
                el.style.pointerEvents = 'auto';
                el.title = 'No tienes permisos para eliminar';
            } catch (err) {
                console.warn('Error aplicando bloqueo delete-btn:', err);
            }
        } else {
            // Restaurar estado para administradores/directores
            try {
                if (el.dataset.origOnclick) {
                    const orig = el.dataset.origOnclick;
                    if (orig) el.setAttribute('onclick', orig);
                }
                if (el.dataset.preventHandlerAttached) {
                    const clone = el.cloneNode(true);
                    el.parentNode.replaceChild(clone, el);
                }
                document.querySelectorAll('.delete-btn').forEach(b => {
                    b.style.display = '';
                    b.style.opacity = '';
                    b.style.pointerEvents = '';
                });
                el.title = 'Eliminar caso';
            } catch (err) {
                console.warn('Error restaurando delete-btn:', err);
            }
        }
    });
    
    // Clientes solo pueden ver
    if (isCliente) {
        document.querySelectorAll('input:not([readonly]), select:not([disabled]), textarea:not([readonly])').forEach(el => {
            if (!el.classList.contains('client-allowed')) {
                el.readOnly = true;
                el.disabled = true;
            }
        });
    }
}

// =======================================================
// INTERFAZ DE LOGIN
// =======================================================

/**
 * Muestra el modal de login
 */
function showLoginModal() {
    // Limpiar cualquier modal existente primero
    const existingModal = document.getElementById('authModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div id="authModal" class="auth-modal">
            <div class="auth-modal-content">
                <div class="auth-header">
                    <img src="Logo.png" alt="HIGH TEST" class="auth-logo">
                    <h2>🔐 Iniciar Sesión</h2>
                    <p>HIGH TEST S.A.S - Sistema de Recepción y Entrega</p>
                </div>
                
                <div id="loginError" class="auth-error" style="display: none;"></div>
                
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">📧 Email:</label>
                        <input type="email" id="loginEmail" name="email" required 
                               class="auth-input" placeholder="usuario@hightest.com" autocomplete="off"
                               readonly onload="this.value=''" onpaste="this.value=''" ondrop="return false">
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">🔒 Contraseña:</label>
                        <div class="password-input-container">
                            <input type="password" id="loginPassword" name="password" required 
                                   class="auth-input password-input" placeholder="Ingrese su contraseña" autocomplete="off"
                                   readonly onload="this.value=''" onpaste="return false" ondrop="return false">
                            <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('loginPassword')" title="Mostrar/Ocultar contraseña">
                                👁️
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" class="auth-btn auth-btn-primary">
                        🚀 Iniciar Sesión
                    </button>
                </form>
                
                <!-- Opción de Solo Lectura -->
                <div class="auth-read-only-section">
                    <div class="read-only-divider">
                        <span>o</span>
                    </div>
                    
                    <button type="button" onclick="enterReadOnlyMode()" 
                            class="auth-btn auth-btn-read-only">
                        👁️ Solo Ver en Lectura
                        <small>Ver el formato sin necesidad de login</small>
                    </button>
                </div>
                
                <div id="loginError" class="auth-error"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Agregar estilos
    addAuthStyles();
    
    // Configurar eventos
    setupLoginEvents();
    
    // Focus en el primer campo
    setTimeout(() => {
        document.getElementById('loginEmail').focus();
    }, 100);
}

/**
 * Oculta el modal de login
 */
function hideLoginModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        // Opcional: remover completamente el modal
        // modal.remove();
    }
}

/**
 * Rellena campos con usuario demo
 */
function fillDemoUser(email, password) {
    // Limpiar errores previos
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Llenar campos
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField && passwordField) {
        emailField.value = email;
        passwordField.value = password;
        
        // Focus en el botón de submit
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.focus();
        }
    }
}

/**
 * Configura eventos del formulario de login
 */
function setupLoginEvents() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    // LIMPIEZA INMEDIATA antes de cualquier otra cosa
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField) {
        emailField.value = '';
        emailField.removeAttribute('readonly');
        emailField.setAttribute('autocomplete', 'off');
    }
    
    if (passwordField) {
        passwordField.value = '';
        passwordField.removeAttribute('readonly');
        passwordField.setAttribute('autocomplete', 'off');
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpiar errores previos
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showLoginError('Por favor complete todos los campos');
            return;
        }
        
        const loginBtn = loginForm.querySelector('button[type="submit"]');
        loginBtn.disabled = true;
        loginBtn.textContent = '🔄 Iniciando sesión...';
        
        // Simular un pequeño delay para mejor UX
        setTimeout(async () => {
            const success = await login(email, password);
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = '🚀 Iniciar Sesión';
            
            if (!success) {
                showLoginError('Email o contraseña incorrectos');
                // Limpiar campos en caso de error
                document.getElementById('loginPassword').value = '';
                document.getElementById('loginEmail').focus();
            }
        }, 300);
    });
    
    // Enter para hacer login
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    // Limpiar errores al escribir
    if (emailField) {
        emailField.addEventListener('input', clearLoginError);
    }
    if (passwordField) {
        passwordField.addEventListener('input', clearLoginError);
    }
}

/**
 * Limpia errores del formulario de login
 */
function clearLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Muestra error en el formulario de login
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// =======================================================
// ACTUALIZACIÓN DE INTERFAZ
// =======================================================

/**
 * Actualiza la interfaz según el usuario actual
 */
function updateUIForUser() {
    // Aplicar permisos
    applyPermissions();
    
    // Actualizar info del usuario
    updateUserInfo();
    
    // Mostrar/ocultar elementos según estado
    if (currentUser) {
        document.body.classList.add('user-authenticated');
        document.body.classList.remove('user-anonymous');
    } else {
        document.body.classList.add('user-anonymous');
        document.body.classList.remove('user-authenticated');
    }
}

/**
 * Actualiza la información del usuario en la interfaz
 */
function updateUserInfo() {
    let userInfoDiv = document.getElementById('userInfo');
    
    if (!currentUser) {
        if (userInfoDiv) userInfoDiv.remove();
        return;
    }
    
    if (!userInfoDiv) {
        userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'userInfo';
        userInfoDiv.className = 'user-info';
        
        // Insertar después de la curva decorativa (SVG)
        const curvaDecorativa = document.querySelector('svg[viewBox="0 0 1440 100"]');
        const formContainer = document.querySelector('.form-container');
        
        if (curvaDecorativa) {
            // Insertar después del SVG de la curva
            curvaDecorativa.insertAdjacentElement('afterend', userInfoDiv);
        } else if (formContainer) {
            // Si no encuentra el SVG, insertar antes del form-container
            formContainer.insertAdjacentElement('beforebegin', userInfoDiv);
        } else {
            // Fallback: insertar después del header
            const header = document.querySelector('.header');
            if (header) {
                header.insertAdjacentElement('afterend', userInfoDiv);
            } else {
                document.body.insertBefore(userInfoDiv, document.body.firstChild);
            }
        }
    }
    
    const roleLabels = {
        'administrador': '👨‍💼 Administrador',
        'director_tecnico': '🎯 Director Técnico',
        'tecnico_ensayos': '🔧 Técnico de Ensayos',
        'operador': '📝 Operador',
        'cliente': '👤 Cliente'
    };
    
    userInfoDiv.innerHTML = `
        <div class="user-info-content">
            <div class="user-details">
                <span class="user-name">Bienvenido ${currentUser.nombre}</span>
                <span class="user-role">${roleLabels[currentUser.rol] || currentUser.rol}</span>
            </div>
            <div class="user-actions">
                <button onclick="showSessionInfo()" class="user-btn" title="Info de sesión">
                    ⏰
                </button>
                <button onclick="logout()" class="user-btn logout-btn" title="Cerrar sesión">
                    🚪 Salir
                </button>
            </div>
        </div>
    `;
}

/**
 * Actualiza la información del usuario para el modo "solo visualización"
 */
function updateUserInfoViewOnly() {
    let userInfoDiv = document.getElementById('userInfo');
    
    if (!userInfoDiv || !currentUser) return;
    
    const roleLabels = {
        'administrador': '👨‍💼 Administrador',
        'director_tecnico': '🎯 Director Técnico',
        'tecnico_ensayos': '🔧 Técnico de Ensayos',
        'operador': '📝 Operador',
        'cliente': '👤 Otro Usuario'
    };
    
    userInfoDiv.innerHTML = `
        <div class="user-info-content">
            <div class="user-details">
                <span class="user-name">👁️ MODO SOLO LECTURA - ${currentUser.nombre}</span>
                <span class="user-role">${roleLabels[currentUser.rol] || currentUser.rol}</span>
            </div>
            <div class="user-actions">
                <button onclick="returnToFullAccess()" class="user-btn" title="Volver a acceso completo">
                    🔓 Ingresar Datos
                </button>
                <button onclick="fullLogout()" class="user-btn logout-btn" title="Cambiar usuario">
                    🔄 Cambiar Usuario
                </button>
            </div>
        </div>
    `;
}

/**
 * Wrapper para aplicar las mismas restricciones cuando un usuario autenticado
 * activa "Solo Ver Formato". Reutiliza la lógica de applyReadOnlyRestrictions.
 */
function applyViewOnlyRestrictions() {
    if (typeof applyReadOnlyRestrictions === 'function') {
        applyReadOnlyRestrictions();
    } else {
        // Fallback mínimo: deshabilitar edición básica
        const interactiveElements = document.querySelectorAll('input, select, textarea');
        interactiveElements.forEach(el => {
            try { el.readOnly = true; } catch (e) {}
            el.disabled = true;
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.8';
            el.title = 'Solo lectura - No editable';
        });
        document.body.classList.add('view-only-mode');
    }
}

/**
 * Aplica restricciones del modo "solo visualización"
 */
function applyReadOnlyRestrictions() {
    // Modo solo lectura: deshabilitar completamente edición y selección
    const inputElements = document.querySelectorAll('input, select, textarea');

    inputElements.forEach(element => {
        // Marcar como no editable y deshabilitar la interacción
        try {
            element.readOnly = true;
        } catch (e) {}
        element.disabled = true;
        element.style.opacity = '0.8';
        element.style.pointerEvents = 'none';
        element.title = 'Solo lectura - No editable';
    });

    // Manejar botones: permitir solo los de navegación/visualización
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        const allowedButtons = [
            'previewDocument',
            'returnToFullAccess',
            'fullLogout',
            'showSessionInfo',
            'generatePDF',
            'generatePDFRecepcion',
            'showLoginModal',
            'exitReadOnlyMode'
        ];

        const isAllowed = allowedButtons.some(allowed =>
            button.onclick && button.onclick.toString().includes(allowed)
        );

        if (!isAllowed && !button.classList.contains('user-btn')) {
            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.pointerEvents = 'none';
            button.title = 'Solo lectura - No disponible';
        } else {
            // Asegurar que los botones permitidos estén habilitados
            button.disabled = false;
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    });

    // Aplicar clase de estado
    document.body.classList.add('view-only-mode');
}

/**
 * Regresa del modo "solo visualización" al acceso completo
 */
function returnToFullAccess() {
    // Mostrar modal de confirmación de credenciales
    showCredentialsConfirmation();
}

/**
 * Muestra modal para confirmar credenciales antes de volver al acceso completo
 */
function showCredentialsConfirmation() {
    const modal = document.createElement('div');
    modal.id = 'credentialsModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content" style="max-width: 400px;">
            <div class="auth-header">
                <h3>🔓 Confirmar Acceso</h3>
                <p>Para volver al modo de edición, confirme su contraseña:</p>
            </div>
            
            <form id="credentialsForm" class="auth-form">
                <div class="form-group">
                    <label>👤 Usuario: <strong>${currentUser.nombre}</strong></label>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">🔒 Contraseña:</label>
                    <div class="password-input-container">
                        <input type="password" id="confirmPassword" required 
                               class="auth-input password-input" placeholder="Confirme su contraseña">
                        <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('confirmPassword')" title="Mostrar/Ocultar contraseña">
                            👁️
                        </button>
                    </div>
                </div>
                
                <div id="credentialsError" class="auth-error" style="display: none;"></div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="auth-btn auth-btn-primary">
                        ✅ Confirmar
                    </button>
                    <button type="button" onclick="cancelCredentialsConfirmation()" class="auth-btn auth-btn-secondary">
                        ❌ Cancelar
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar el formulario
    const form = document.getElementById('credentialsForm');
    form.addEventListener('submit', handleCredentialsConfirmation);
    
    // Focus en el campo de contraseña
    document.getElementById('confirmPassword').focus();
}

/**
 * Maneja la confirmación de credenciales
 */
function handleCredentialsConfirmation(e) {
    e.preventDefault();
    
    const password = document.getElementById('confirmPassword').value;
    const result = authenticateUser(currentUser.email, password);
    
    if (result.success) {
        // Credenciales correctas - volver a modo completo
        exitViewOnlyMode();
        
        const modal = document.getElementById('credentialsModal');
        if (modal) modal.remove();
        
        safeNotification('🔓 Acceso completo restaurado', 'success');
    } else {
        // Credenciales incorrectas
        const errorDiv = document.getElementById('credentialsError');
        if (errorDiv) {
            errorDiv.textContent = '❌ Contraseña incorrecta';
            errorDiv.style.display = 'block';
        }
        
        // Limpiar campo
        document.getElementById('confirmPassword').value = '';
        document.getElementById('confirmPassword').focus();
    }
}

/**
 * Cancela la confirmación de credenciales
 */
function cancelCredentialsConfirmation() {
    const modal = document.getElementById('credentialsModal');
    if (modal) modal.remove();
}

/**
 * Sale del modo "solo visualización"
 */
function exitViewOnlyMode() {
    // Quitar clase del body
    document.body.classList.remove('view-only-mode');
    
    // Rehabilitar todos los elementos
    const disabledElements = document.querySelectorAll('input[disabled], select[disabled], textarea[disabled], button[disabled]');
    
    disabledElements.forEach(element => {
        element.disabled = false;
        element.style.opacity = '';
        element.title = '';
    });
    
    // Restaurar información del usuario normal
    updateUserInfo();
    
    // Reaplicar permisos normales
    applyPermissions();
    
    if (currentUser) {
        logUserActivity('exit_view_only_mode');
    }
}

/**
 * Actualiza la información del usuario para modo solo lectura sin autenticación
 */
function updateUserInfoReadOnly() {
    let userInfoDiv = document.getElementById('userInfo');
    
    if (!userInfoDiv) {
        userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'userInfo';
        userInfoDiv.className = 'user-info';
        
        // Insertar después de la curva decorativa (SVG)
        const curvaDecorativa = document.querySelector('svg[viewBox="0 0 1440 100"]');
        const formContainer = document.querySelector('.form-container');
        
        if (curvaDecorativa) {
            curvaDecorativa.insertAdjacentElement('afterend', userInfoDiv);
        } else if (formContainer) {
            formContainer.insertAdjacentElement('beforebegin', userInfoDiv);
        } else {
            const header = document.querySelector('.header');
            if (header) {
                header.insertAdjacentElement('afterend', userInfoDiv);
            } else {
                document.body.insertBefore(userInfoDiv, document.body.firstChild);
            }
        }
    }
    
    userInfoDiv.innerHTML = `
        <div class="user-info-content">
            <div class="user-details">
                <span class="user-name">👁️ MODO SOLO LECTURA - Visitante</span>
                <span class="user-role">🌐 Acceso Público</span>
            </div>
            <div class="user-actions">
                <button onclick="showLoginModal()" class="user-btn" title="Iniciar sesión para editar">
                    🔓 Iniciar Sesión
                </button>
                <button onclick="exitReadOnlyMode()" class="user-btn logout-btn" title="Cerrar vista">
                    ❌ Cerrar
                </button>
            </div>
        </div>
    `;
}

/**
 * Aplica restricciones de solo lectura sin autenticación
 */
function applyReadOnlyRestrictions() {
    // Deshabilitar todos los inputs, selects, textareas, y botones excepto los específicos
    const interactiveElements = document.querySelectorAll('input, select, textarea, button');
    
    interactiveElements.forEach(element => {
        // Permitir solo botones específicos de navegación
        const allowedButtons = [
            'showLoginModal', // Iniciar sesión
            'exitReadOnlyMode', // Cerrar vista
            'previewDocument', // Vista previa
            'generatePDF', // Generar PDF (solo lectura)
            'generatePDFRecepcion' // PDF de recepción (solo lectura)
        ];
        
        const isAllowedButton = allowedButtons.some(allowed => {
            if (element.onclick) {
                return element.onclick.toString().includes(allowed);
            }
            return false;
        });
        
        const isUserBtn = element.classList.contains('user-btn');
        const isPreviewBtn = element.textContent.includes('Vista Previa') || 
                           element.textContent.includes('PDF');
        
        if (!isAllowedButton && !isUserBtn && !isPreviewBtn) {
            element.disabled = true;
            element.style.opacity = '0.4';
            element.title = 'Inicie sesión para usar esta función';
        }
    });
    
    // Agregar clase CSS específica para modo anónimo
    document.body.classList.add('anonymous-readonly');
}

/**
 * Sale del modo solo lectura sin autenticación
 */
function exitReadOnlyMode() {
    console.log('❌ Saliendo del modo solo lectura...');
    
    // Verificar si hay un usuario autenticado antes de limpiar
    const wasAuthenticated = currentUser && currentUser.id !== 'readonly_user';
    
    // Limpiar usuario temporal solo si era usuario de solo lectura
    if (currentUser && currentUser.isReadOnly) {
        currentUser = null;
    }
    
    // Quitar clases específicas
    document.body.classList.remove('view-only-mode', 'anonymous-readonly');
    
    // Si no había usuario autenticado, volver a estado anónimo
    if (!wasAuthenticated) {
        document.body.classList.add('user-anonymous');
    }
    
    // Rehabilitar todos los elementos
    const disabledElements = document.querySelectorAll('[disabled]');
    disabledElements.forEach(element => {
        element.disabled = false;
        element.style.opacity = '';
        element.title = '';
    });
    
    // Limpiar UI del usuario solo si era modo solo lectura
    const userInfo = document.getElementById('userInfo');
    if (userInfo && !wasAuthenticated) {
        userInfo.remove();
    }
    
    // Mostrar modal de login solo si no había usuario autenticado
    if (!wasAuthenticated) {
        showLoginModal();
        safeNotification('🚪 Modo solo lectura cerrado', 'info');
    } else {
        safeNotification('🔓 Modo solo lectura desactivado', 'info');
    }
}

/**
 * Aplica permisos específicos del usuario autenticado
 * @param {Object} user - Usuario autenticado
 */
function applyUserPermissions(user) {
    console.log('🔐 Aplicando permisos para usuario:', user.rol);
    
    // Limpiar cualquier restricción previa
    document.body.classList.remove('view-only-mode', 'anonymous-readonly', 'user-anonymous');
    document.body.classList.add('user-authenticated');
    
    // Rehabilitar completamente todos los elementos del formulario
    const allInputs = document.querySelectorAll('input, select, textarea, button');
    allInputs.forEach(element => {
        element.disabled = false;
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        element.title = '';
        element.removeAttribute('readonly');
    });
    
    // Rehabilitar contenedores que podrían estar bloqueados
    const containers = document.querySelectorAll('.form-container, .section, fieldset');
    containers.forEach(container => {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    });
    
    // Aplicar permisos específicos según el rol
    switch(user.rol) {
        case 'administrator':
            console.log('✅ Permisos de administrador: acceso completo');
            // Los administradores tienen acceso completo, no necesitamos restricciones
            break;
            
        case 'director_tecnico':
            console.log('✅ Permisos de director técnico: acceso completo a gestión');
            // Los directores técnicos tienen acceso casi completo
            break;
            
        case 'tecnico_ensayos':
            console.log('✅ Permisos de técnico de ensayos: edición de formularios');
            // Los técnicos pueden editar la mayoría de campos
            break;
            
        case 'operador':
            console.log('✅ Permisos de : operaciones básicas');
            // Los operadores tienen permisos limitados pero pueden editar
            break;
            
        case 'cliente':
            console.log('✅ Permisos de cliente: visualización y consulta');
            // Los clientes pueden ver y hacer consultas limitadas
            break;
            
        default:
            console.log('⚠️ Rol no reconocido, aplicando permisos básicos');
            break;
    }
    
    // Asegurar que el formulario es completamente funcional
    enableFullFormFunctionality();
    
    console.log('✅ Permisos aplicados correctamente para:', user.nombre);
}

/**
 * Habilita completamente la funcionalidad del formulario
 */
function enableFullFormFunctionality() {
    // Quitar overlay de solo lectura si existe
    const overlay = document.querySelector('.readonly-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Rehabilitar todos los botones de acción
    const actionButtons = document.querySelectorAll('.btn, button[type="submit"], button[type="button"]');
    actionButtons.forEach(button => {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
    });
    
    // Rehabilitar campos específicos que podrían estar bloqueados
    const formFields = document.querySelectorAll('[data-readonly], .readonly');
    formFields.forEach(field => {
        field.classList.remove('readonly');
        field.removeAttribute('data-readonly');
        field.disabled = false;
        field.readOnly = false;
    });
    
    console.log('🔓 Formulario completamente habilitado para edición');
}

// =======================================================
// GESTIÓN DE SESIÓN
// =======================================================

/**
 * Configura los timers de sesión
 */
function setupSessionTimers() {
    // Timers de sesión deshabilitados
    return;
}

/**
 * Muestra advertencia de expiración de sesión
 */
function showSessionWarning() {
    // Función desactivada - no mostrar ventana de sesión
    if (!currentUser) return;
    return;
}

/**
 * Muestra información de la sesión actual
 */
function showSessionInfo() {
    if (!currentUser) return;
    
    const sessionData = JSON.parse(localStorage.getItem(SESSION_CONFIG.storageKey));
    const loginTime = new Date(sessionData.loginTime);
    const lastActivity = new Date(sessionData.lastActivity);
    const timeLeft = Math.floor((SESSION_CONFIG.duration - (Date.now() - sessionData.lastActivity)) / 60000);
    
    alert(`📋 Información de Sesión\n\n` +
          `Usuario: ${currentUser.nombre}\n` +
          `Rol: ${currentUser.rol}\n` +
          `Inicio de sesión: ${loginTime.toLocaleString()}\n` +
          `Última actividad: ${lastActivity.toLocaleString()}\n` +
          `Tiempo restante: ${timeLeft} minutos\n` +
          `Permisos: ${currentUser.permisos.join(', ')}`);
}

// =======================================================
// UTILIDADES
// =======================================================

/**
 * Alterna la visibilidad de un campo de contraseña
 * @param {string} passwordFieldId - ID del campo de contraseña
 */
function togglePasswordVisibility(passwordFieldId) {
    const passwordField = document.getElementById(passwordFieldId);
    const toggleBtn = passwordField?.parentElement?.querySelector('.password-toggle-btn');
    
    if (!passwordField || !toggleBtn) {
        console.error('Campo de contraseña o botón no encontrado:', passwordFieldId);
        return;
    }
    
    if (passwordField.type === 'password') {
        // Mostrar contraseña
        passwordField.type = 'text';
        toggleBtn.innerHTML = '🙈';
        toggleBtn.title = 'Ocultar contraseña';
    } else {
        // Ocultar contraseña
        passwordField.type = 'password';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.title = 'Mostrar contraseña';
    }
}

/**
 * Genera un ID único para la sesión
 */
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Registra actividad del usuario (para auditoría)
 */
function logUserActivity(action, details = '') {
    if (!currentUser) return;
    
    const logEntry = {
        userId: currentUser.id,
        userName: currentUser.nombre,
        action: action,
        details: details,
        timestamp: new Date().toISOString(),
        ip: 'localhost', // En producción obtener IP real
        userAgent: navigator.userAgent
    };
    
    // Guardar en localStorage (en producción enviar a servidor)
    const activityLog = JSON.parse(localStorage.getItem('activity_log') || '[]');
    activityLog.push(logEntry);
    
    // Mantener solo los últimos 100 registros
    if (activityLog.length > 100) {
        activityLog.shift();
    }
    
    localStorage.setItem('activity_log', JSON.stringify(activityLog));
    
    console.log('📝 Actividad registrada:', logEntry);
}

/**
 * Carga los estilos CSS para la autenticación
 */
function loadAuthStyles() {
    // Evitar cargar estilos duplicados
    if (document.getElementById('authStyles')) {
        return;
    }
    
    try {
        addAuthStyles();
        console.log('✅ Estilos de autenticación cargados');
    } catch (error) {
        console.error('❌ Error al cargar estilos de autenticación:', error);
    }
}

/**
 * Función de notificación segura (funciona aunque no esté definida la principal)
 */
function safeNotification(message, type = 'info') {
    // Intentar usar la función principal si está disponible
    if (typeof showNotification === 'function') {
        try {
            showNotification(message, type);
            return;
        } catch (error) {
            console.warn('Error en showNotification principal:', error);
        }
    }
    
    // Fallback: usar console y alert para casos críticos
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    if (type === 'error') {
        alert(message);
    }
}

/**
 * Agrega los estilos CSS para la autenticación
 */
function addAuthStyles() {
    if (document.getElementById('authStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'authStyles';
    styles.textContent = `
        /* ESTILOS DEL SISTEMA DE AUTENTICACIÓN */
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(2, 40, 89, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .auth-modal-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .auth-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .auth-logo {
            width: 60px;
            height: auto;
            margin-bottom: 15px;
        }
        
        .auth-header h2 {
            color: #022859;
            margin: 10px 0;
            font-size: 24px;
        }
        
        .auth-header p {
            color: #666;
            font-size: 14px;
        }
        
        .auth-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .auth-input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        
        .auth-input:focus {
            outline: none;
            border-color: #022859;
            box-shadow: 0 0 0 3px rgba(2, 40, 89, 0.1);
        }
        
        /* ESTILOS PARA CAMPO DE CONTRASEÑA CON BOTÓN */
        .password-input-container {
            position: relative;
            width: 100%;
        }
        
        .password-input {
            padding-right: 50px !important; /* Espacio para el botón */
        }
        
        .password-toggle-btn {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
            transition: all 0.2s ease;
            z-index: 2;
        }
        
        .password-toggle-btn:hover {
            background: rgba(0, 0, 0, 0.1);
            transform: translateY(-50%) scale(1.1);
        }
        
        .password-toggle-btn:active {
            transform: translateY(-50%) scale(0.95);
        }
        
        .auth-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .auth-btn-primary {
            background: linear-gradient(135deg, #022859 0%, #0056b3 100%);
            color: white;
        }
        
        .auth-btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(2, 40, 89, 0.3);
        }
        
        .auth-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .auth-demo-users {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .auth-demo-users h4 {
            color: #022859;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .demo-user-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
        }
        
        .demo-user-btn {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 10px 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 12px;
            text-align: center;
        }
        
        .demo-user-btn:hover {
            background: #e9ecef;
            border-color: #022859;
            transform: translateY(-1px);
        }
        
        .demo-user-btn small {
            display: block;
            color: #666;
            margin-top: 5px;
        }
        
        .auth-error {
            display: none;
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
            text-align: center;
        }
        
        /* INFO DEL USUARIO */
        .user-info {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 3px solid #022859;
            padding: 10px 20px;
            margin-bottom: 10px;
        }
        
        .user-info-content {
            max-width: 1500px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .user-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .user-name {
            font-weight: bold;
            color: #022859;
            font-size: 16px;
        }
        
        .user-role {
            color: #666;
            font-size: 14px;
        }
        
        .user-actions {
            display: flex;
            gap: 10px;
        }
        
        .user-btn {
            background: #ffffff;
            border: 2px solid #dee2e6;
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
        }
        
        .user-btn:hover {
            background: #f8f9fa;
            border-color: #022859;
            transform: translateY(-1px);
        }
        
        .logout-btn:hover {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        /* ESTADOS DE USUARIO */
        .user-anonymous .form-container {
            opacity: 0.8;
            pointer-events: auto;
        }
        
        .user-authenticated .form-container {
            opacity: 1;
            pointer-events: auto;
        }
        
        /* ANIMACIONES */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* ESTILOS PARA OPCIONES DE LOGOUT */
        .logout-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .logout-options button {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .logout-options button small {
            margin-top: 5px;
            font-size: 12px;
            opacity: 0.7;
            font-weight: normal;
        }
        
        .logout-options button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        /* MODO SOLO VISUALIZACIÓN */
        .view-only-mode {
            position: relative;
        }
        
        .view-only-mode::before {
            content: "👁️ MODO SOLO LECTURA";
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 193, 7, 0.9);
            color: #000;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            z-index: 1000;
            animation: pulse 2s infinite;
        }
        
        /* SECCIÓN SOLO LECTURA EN LOGIN */
        .readonly-section {
            border-top: 2px solid #e9ecef;
            margin-top: 20px;
            padding-top: 20px;
            text-align: center;
        }
        
        .readonly-title {
            color: #495057;
            font-size: 14px;
            margin-bottom: 15px;
            font-weight: 500;
        }
        
        .readonly-btn {
            background: linear-gradient(135deg, #6f42c1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            box-shadow: 0 2px 8px rgba(111, 66, 193, 0.3);
        }
        
        .readonly-btn:hover {
            background: linear-gradient(135deg, #5a2d91 0%, #7c3aed 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.4);
        }
        
        .readonly-btn .icon {
            font-size: 16px;
        }
        
        .readonly-description {
            color: #6c757d;
            font-size: 12px;
            margin-top: 8px;
            line-height: 1.4;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
        }
        
        .view-only-mode .user-info {
            background: linear-gradient(135deg, #ffc107, #ff9800);
            border-left: 4px solid #ff6f00;
        }
        
        .view-only-mode .user-name {
            color: #000 !important;
        }
        
        /* FORMULARIO DE CREDENCIALES */
        .auth-error {
            background: #ffebee;
            border: 1px solid #f44336;
            color: #c62828;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            margin-top: 10px;
        }
        
        /* RESPONSIVE */
        @media (max-width: 600px) {
            .auth-modal-content {
                padding: 20px;
                margin: 20px;
            }
            
            .demo-user-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .user-info-content {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// =======================================================
// INICIALIZACIÓN DEL SISTEMA DE AUTENTICACIÓN
// =======================================================

/**
 * Inicializa el sistema de autenticación
 */
function initializeAuth() {
    console.log('🔐 Inicializando sistema de autenticación...');
    
    // Limpiar cualquier estado previo
    const existingModal = document.getElementById('authModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const existingUserInfo = document.getElementById('userInfo');
    if (existingUserInfo) {
        existingUserInfo.remove();
    }
    
    // Cargar estilos CSS
    loadAuthStyles();
    
    // Verificar sesión existente
    const hasValidSession = checkSession();
    
    if (!hasValidSession) {
        console.log('❌ No hay sesión válida, mostrando login...');
        // Mostrar login si no hay sesión válida
        setTimeout(() => {
            showLoginModal();
        }, 100); // Pequeño delay para asegurar que el DOM esté listo
    } else {
        console.log('✅ Sesión válida encontrada');
        // Actualizar UI para usuario autenticado
        updateUIForUser();
        try { if (typeof window.restoreSelectedReceptionNumber === 'function') window.restoreSelectedReceptionNumber(); } catch(e){}
        // Re-evaluar UI dependiente del rol (ej: botón de gestión de números restringidos)
        try { if (typeof window.initializeQuoteNumbers === 'function') window.initializeQuoteNumbers(); } catch(e) { console.warn('No se pudo re-evaluar initializeQuoteNumbers:', e); }
        try { if (typeof window.showProposedReceptionNumber === 'function') window.showProposedReceptionNumber(); } catch(e) { console.warn('No se pudo re-evaluar showProposedReceptionNumber:', e); }
        console.log('✅ Sesión restaurada para:', currentUser.nombre);
    }
    
    // Configurar listener para actividad del usuario
    ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
        document.addEventListener(event, updateUserActivity, { passive: true });
    });
    
    // Verificar sesión cada minuto
    const sessionCheckInterval = setInterval(() => {
        if (!checkSession()) {
            clearInterval(sessionCheckInterval);
        }
    }, 60000);

    console.log('✅ Sistema de autenticación inicializado');
}

// Limpiar campos de login al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Limpiar de inmediato
    const limpiarCampos = () => {
        const loginEmailField = document.getElementById('loginEmail');
        const loginPasswordField = document.getElementById('loginPassword');
        
        if (loginEmailField) {
            if (loginEmailField.value) {
                console.warn('⚠️ Limpiando email:', loginEmailField.value);
            }
            loginEmailField.value = '';
            loginEmailField.setAttribute('autocomplete', 'off');
        }
        
        if (loginPasswordField) {
            if (loginPasswordField.value) {
                console.warn('⚠️ Limpiando contraseña');
            }
            loginPasswordField.value = '';
            loginPasswordField.setAttribute('autocomplete', 'off');
        }
    };
    
    // Limpieza inmediata
    limpiarCampos();
    
    // Limpieza agresiva cada 100ms durante 3 segundos
    let monitorAttempts = 0;
    const monitorInterval = setInterval(() => {
        const loginEmailField = document.getElementById('loginEmail');
        const loginPasswordField = document.getElementById('loginPassword');
        
        let needsClean = false;
        
        if (loginEmailField && loginEmailField.value) {
            console.warn('⚠️ Email autocompletado detectado, limpiando:', loginEmailField.value);
            loginEmailField.value = '';
            needsClean = true;
        }
        
        if (loginPasswordField && loginPasswordField.value) {
            console.warn('⚠️ Contraseña autocompletada detectada, limpiando');
            loginPasswordField.value = '';
            needsClean = true;
        }
        
        if (needsClean) {
            console.log('🧹 Campos limpios');
        }
        
        monitorAttempts++;
        if (monitorAttempts >= 30) { // 30 * 100ms = 3 segundos
            clearInterval(monitorInterval);
            console.log('✅ Monitoreo de autocompletado finalizado');
        }
    }, 100);
});

// =======================================================
// DIAGNÓSTICO DE AUTENTICACIÓN
// =======================================================

/**
 * Función de diagnóstico para verificar estado de autenticación
 * Llamar desde consola: checkAuthStatus()
 */
function checkAuthStatus() {
    console.log('🔍 === DIAGNÓSTICO DE AUTENTICACIÓN ===');
    
    // Verificar si auth.js está cargado
    console.log('✅ auth.js cargado');
    
    // Verificar variables globales
    console.log('Usuario actual:', currentUser);
    console.log('Session timer:', sessionTimer);
    console.log('Warning timer:', warningTimer);
    
    // Verificar localStorage
    const sessionData = localStorage.getItem(SESSION_CONFIG.storageKey);
    console.log('Datos de sesión en localStorage:', sessionData ? 'Presentes' : 'Ausentes');
    
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            console.log('Sesión parseada:', session);
            console.log('Usuario en sesión:', session.user?.email);
            console.log('Login time:', new Date(session.loginTime));
            console.log('Last activity:', new Date(session.lastActivity));
        } catch (e) {
            console.error('Error parseando sesión:', e);
        }
    }
    
    // Verificar sessionStorage
    const sessionActive = sessionStorage.getItem('session_active');
    console.log('Session active en sessionStorage:', sessionActive);
    
    // Verificar elementos del DOM
    const authModal = document.getElementById('authModal');
    const userInfo = document.getElementById('userInfo');
    console.log('Modal de auth visible:', authModal ? 'Sí' : 'No');
    console.log('User info visible:', userInfo ? 'Sí' : 'No');
    
    // Verificar clases del body
    console.log('Clases del body:', document.body.className);
    
    // Verificar si hay modales ocultos
    const allModals = document.querySelectorAll('#authModal, #credentialsModal, #logoutOptionsModal');
    console.log('Modales encontrados:', allModals.length);
    allModals.forEach((modal, i) => {
        console.log(`Modal ${i+1}:`, modal.id, 'style.display:', modal.style.display);
    });
    
    console.log('🔍 === FIN DIAGNÓSTICO ===');
    
    return {
        currentUser,
        hasSessionData: !!sessionData,
        authModalVisible: !!authModal,
        userInfoVisible: !!userInfo,
        bodyClasses: document.body.className
    };
}

/**
 * Forzar mostrar modal de login (para pruebas)
 */
function forceShowLogin() {
    console.log('🔧 Forzando mostrar modal de login...');
    showLoginModal();
}

/**
 * Limpiar completamente la sesión (para pruebas)
 */
function forceClearSession() {
    console.log('🧹 Limpiando sesión completamente...');
    localStorage.removeItem(SESSION_CONFIG.storageKey);
    sessionStorage.removeItem('session_active');
    localStorage.removeItem('user_preferences');
    sessionStorage.clear();
    currentUser = null;
    document.body.classList.remove('user-authenticated', 'user-anonymous', 'view-only-mode');
    document.body.classList.add('user-anonymous');
    console.log('✅ Sesión limpiada');
}

// Exponer funciones globales necesarias
window.login = login;
window.logout = logout;
window.hasPermission = hasPermission;
window.hasRole = hasRole;
window.fillDemoUser = fillDemoUser;
window.showSessionInfo = showSessionInfo;
window.currentUser = () => currentUser;

// Funciones de diagnóstico
window.checkAuthStatus = checkAuthStatus;
window.forceShowLogin = forceShowLogin;
window.forceClearSession = forceClearSession;

console.log('🔐 Sistema de autenticación cargado');
