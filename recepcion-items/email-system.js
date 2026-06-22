// SISTEMA DE EMAIL DEFINITIVO - HIGH TEST S.A.S
console.log('📧 Sistema Email Definitivo v1.0');

// CONFIGURACIÓN GLOBAL
let ADMIN_EMAIL = localStorage.getItem('adminEmail') || null;
let EMAIL_SYSTEM_READY = false;

// CONFIGURACIÓN EMAILJS - CREDENCIALES CORRECTAS
const EMAILJS_CONFIG = {
    serviceId: 'service_xxiz7yg',
    templateId: 'template_0r8n9z4',  // CORREGIDO
    publicKey: 'yyiS3YE3H7fqKdzkB'
};

// FUNCIÓN: VALIDAR EMAIL
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// CARGAR CREDENCIALES GUARDADAS
if (localStorage.getItem('emailjs_service')) {
    EMAILJS_CONFIG.serviceId = localStorage.getItem('emailjs_service');
}
if (localStorage.getItem('emailjs_template')) {
    EMAILJS_CONFIG.templateId = localStorage.getItem('emailjs_template');
}

// FUNCIÓN: MOSTRAR NOTIFICACIÓN
function mostrarNotificacion(mensaje, tipo = 'info') {
    const colores = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
    `;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 4000);
}

// FUNCIÓN: CONFIGURAR ADMIN EMAIL
function configurarAdminEmail() {
    const email = prompt('Ingrese su email de administrador:');
    if (email && validarEmail(email)) {
        ADMIN_EMAIL = email;
        localStorage.setItem('adminEmail', email);
        mostrarNotificacion('✅ Email configurado: ' + email, 'success');
        return true;
    } else {
        mostrarNotificacion('❌ Email inválido', 'error');
        return false;
    }
}

// FUNCIÓN: ENVIAR EMAIL PERSONALIZADO CON CC
async function enviarEmailPersonalizado() {
    if (!EMAIL_SYSTEM_READY) {
        mostrarNotificacion('⚠️ Sistema no inicializado', 'warning');
        return;
    }
    
    // Crear formulario emergente
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(26,32,44,0.9) 100%);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: fadeIn 0.3s ease-out;
    `;
    
    const form = document.createElement('div');
    form.className = 'email-form';
    form.style.cssText = `
        background: linear-gradient(145deg, #2d3748 0%, #1a202c 100%);
        color: white;
        padding: 35px;
        border-radius: 16px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1);
        max-width: 520px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        backdrop-filter: blur(10px);
    `;
    
    form.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; border-bottom: 1px solid #4a5568; padding-bottom: 15px;">
            <h3 style="color: #4299e1; margin: 0; font-size: 18px;">📧 Enviar Email</h3>
            <button onclick="cerrarModalEmail()" style="background: none; border: none; color: #cbd5e0; font-size: 20px; cursor: pointer; padding: 5px;">✕</button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; font-size: 14px;">Para: <span style="color: #f56565;">*</span></label>
            <input type="email" id="email-para" style="width: 100%; padding: 12px 15px; border: 2px solid #4a5568; border-radius: 8px; background: #1a202c; color: white; font-size: 14px; transition: all 0.3s ease;" placeholder="destinatario@ejemplo.com" required>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; font-size: 14px;">Cc (Con Copia a):</label>
            <input type="text" id="email-cc" style="width: 100%; padding: 12px 15px; border: 2px solid #4a5568; border-radius: 8px; background: #1a202c; color: white; font-size: 14px; transition: all 0.3s ease;" placeholder="copia1@ejemplo.com, copia2@ejemplo.com (opcional)">
            <small style="color: #a0aec0; font-size: 12px; margin-top: 5px; display: block;">Separar múltiples correos con comas</small>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; font-size: 14px;">Nombre: <span style="color: #f56565;">*</span></label>
            <input type="text" id="email-nombre" style="width: 100%; padding: 12px 15px; border: 2px solid #4a5568; border-radius: 8px; background: #1a202c; color: white; font-size: 14px; transition: all 0.3s ease;" placeholder="Nombre del destinatario" required>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; font-size: 14px;">Asunto: <span style="color: #f56565;">*</span></label>
            <input type="text" id="email-asunto" style="width: 100%; padding: 12px 15px; border: 2px solid #4a5568; border-radius: 8px; background: #1a202c; color: white; font-size: 14px; transition: all 0.3s ease;" placeholder="Asunto del correo" required>
        </div>
        
        <div style="margin-bottom: 25px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #e2e8f0; font-size: 14px;">📎 Adjuntar Archivos:</label>
            <div style="position: relative;">
                <input type="file" id="email-archivos" multiple style="display: none;" onchange="actualizarListaArchivos()">
                <button type="button" onclick="console.log('🔍 Debug - Botón clickeado'); const input = document.getElementById('email-archivos'); console.log('🔍 Input encontrado:', !!input, input); input.click();" style="width: 100%; padding: 12px 15px; border: 2px dashed #4a5568; border-radius: 8px; background: #1a202c; color: #a0aec0; font-size: 14px; cursor: pointer; transition: all 0.3s ease; text-align: left;" onmouseover="this.style.borderColor='#4299e1'; this.style.color='#4299e1'" onmouseout="this.style.borderColor='#4a5568'; this.style.color='#a0aec0'">
                    📁 Seleccionar archivos... (Cualquier tamaño y tipo)
                </button>
            </div>
            <div id="lista-archivos" style="margin-top: 10px;"></div>
            <small style="color: #a0aec0; font-size: 12px; margin-top: 5px; display: block;">
                ℹ️ Todos los archivos son bienvenidos. Se procesarán automáticamente según su tamaño.
            </small>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 30px;">
            <button onclick="procesarEnvioEmail()" style="background: linear-gradient(135deg, #38a169, #2f855a); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(56, 161, 105, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(56, 161, 105, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(56, 161, 105, 0.3)'">
                📧 Enviar
            </button>
            <button onclick="cerrarModalEmail()" style="background: linear-gradient(135deg, #718096, #4a5568); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(113, 128, 150, 0.3); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(113, 128, 150, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(113, 128, 150, 0.3)'">
                ❌ Cancelar
            </button>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #email-para:focus, #email-cc:focus, #email-nombre:focus, #email-asunto:focus {
                border-color: #4299e1 !important;
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1) !important;
                outline: none !important;
            }
            #email-para::placeholder, #email-cc::placeholder, #email-nombre::placeholder, #email-asunto::placeholder {
                color: #a0aec0;
            }
            .email-form {
                animation: slideIn 0.4s ease-out;
            }
        </style>
    `;
    
    modal.appendChild(form);
    document.body.appendChild(modal);
    modal.id = 'modal-email';
    
    // Enfocar el primer campo
    setTimeout(() => document.getElementById('email-para').focus(), 100);
}

// FUNCIÓN: PROCESAR ENVÍO DE EMAIL
async function procesarEnvioEmail() {
    // Verificar que EmailJS esté inicializado
    if (!window.emailjs) {
        mostrarNotificacion('❌ EmailJS no está cargado. Recargue la página.', 'error');
        console.error('❌ EmailJS no disponible');
        return;
    }
    
    console.log('🔍 Debug - EmailJS disponible:', !!window.emailjs);
    console.log('🔍 Configuración:', EMAILJS_CONFIG);
    
    const para = document.getElementById('email-para').value.trim();
    const cc = document.getElementById('email-cc').value.trim();
    const nombre = document.getElementById('email-nombre').value.trim();
    const asunto = document.getElementById('email-asunto').value.trim();
    
    console.log('🔍 Valores de formulario:', { para, cc, nombre, asunto });
    
    // Validaciones
    if (!para || !validarEmail(para)) {
        mostrarNotificacion('❌ Email de destinatario requerido y válido', 'error');
        return;
    }
    
    // Validar emails de Cc si se proporcionaron
    if (cc) {
        const emailsCC = cc.split(',').map(email => email.trim());
        for (let email of emailsCC) {
            if (email && !validarEmail(email)) {
                mostrarNotificacion('❌ Email de copia debe ser válido: ' + email, 'error');
                return;
            }
        }
    }
    
    if (!nombre || !asunto) {
        mostrarNotificacion('❌ Todos los campos marcados (*) son obligatorios', 'error');
        return;
    }
    
    try {
        mostrarNotificacion('📤 Procesando archivos y enviando email...', 'info');
        
        // Procesar archivos adjuntos y links
        let archivosInfo = '';
        let archivosData = { adjuntos: [], links: [] };
        
        try {
            archivosData = await procesarArchivosParaEmail();
            
            // Generar información de archivos para el email
            if (archivosData.adjuntos.length > 0 || archivosData.links.length > 0) {
                archivosInfo = `

📎 **ARCHIVOS INCLUIDOS**

`;
                
                if (archivosData.adjuntos.length > 0) {
                    archivosInfo += `**Adjuntos directos (${archivosData.adjuntos.length}):**
`;
                    archivosData.adjuntos.forEach((archivo, index) => {
                        const sizeKB = (archivo.size / 1024).toFixed(1);
                        archivosInfo += `${index + 1}. 📎 ${archivo.name} (${sizeKB} KB)
`;
                    });
                    archivosInfo += `
`;
                }
                
                if (archivosData.links.length > 0) {
                    archivosInfo += `**ARCHIVOS PARA DESCARGAR (${archivosData.links.length}):**

`;
                    archivosData.links.forEach((archivo, index) => {
                        const sizeKB = (archivo.size / 1024).toFixed(1);
                        const sizeMB = (archivo.size / 1024 / 1024).toFixed(2);
                        const displaySize = archivo.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
                        
                        archivosInfo += `� ${archivo.name} (${displaySize})
🔗 LINK DE DESCARGA: ${archivo.link}

INSTRUCCIONES:
1. Haz clic en el link de arriba
2. Se abrirá/descargará automáticamente
3. Si no descarga automáticamente, clic derecho → "Guardar como"

`;
                    });
                    
                    archivosInfo += `💡 NOTA: Los links funcionan desde cualquier dispositivo y no tienen fecha de expiración.

`;
                }
                
                archivosInfo += `ℹ️ Los links de descarga están disponibles por 7 días.

`;
            }
        } catch (error) {
            mostrarNotificacion('❌ ' + error.message, 'error');
            return;
        }
        
        // Obtener datos reales del formulario
        const datos = obtenerDatosAplicacion();
        
        // Crear link al PDF si existe
        let linkPDF = '';
        let mensajePDF = '';
        if (window.ultimoPDFGenerado && window.ultimoPDFGenerado.numeroRecepcion === datos.numeroRecepcion) {
            linkPDF = `
📄 **DOCUMENTO PDF OFICIAL**
El PDF de recepción ha sido generado para este caso.
Número de caso: ${datos.numeroRecepcion}

Para obtener el PDF oficial:
1. Acceda al sistema web de HIGH TEST S.A.S
2. Vaya a la sección de Recepción de Items
3. Haga clic en "📄 Generar PDF de Recepción"

`;
            mensajePDF = 'Incluye referencia al PDF oficial.';
        }
        
        // Crear mensaje automático basado en datos del formulario
        const mensajeAutomatico = `Estimado/a ${nombre},

Nos complace informarle sobre el proceso de recepción correspondiente al caso ${datos.numeroRecepcion}.

**Información del proceso:**
- Cliente: ${datos.nombreCliente}
- NIT: ${datos.nitEmpresa} 
- Fecha de recepción: ${datos.fechaRecepcion}
- Caso: ${datos.numeroRecepcion}

${archivosInfo}${linkPDF}

Para cualquier consulta, no dude en contactarnos.

Saludos cordiales,
HIGH TEST S.A.S`;
        
        const parametros = {
            // Variables principales que coinciden EXACTAMENTE con tu template
            to_email: para,                    // {{to_email}} - Para enviar por correo electrónico  
            from_name: 'HIGH TEST S.A.S',     // {{from_name}} - Del nombre
            email: ADMIN_EMAIL || 'reportes.hightest@gmail.com',  // {{email}} - Responder a
            cc_email: cc || '',               // {{cc_email}} - Bcc
            subject: asunto,                  // {{subject}} - Sujeto
            to_name: nombre,                  // {{to_name}} - Nombre del destinatario
            
            // Variables del contenido del documento - VERIFICAR NOMBRES
            numero_recepcion: datos.numeroRecepcion || 'N/A',   // {{numero_recepcion}}
            nombre_cliente: datos.nombreCliente || 'N/A',       // {{nombre_cliente}}
            nit_empresa: datos.nitEmpresa || 'N/A',             // {{nit_empresa}}  
            fecha_recepcion: datos.fechaRecepcion || new Date().toLocaleDateString(),     // {{fecha_recepcion}}
            
            // Contenido del mensaje - se formateará en el template
            html_message: mensajeAutomatico || 'Mensaje del sistema de recepción de items.',
            
            // Información de archivos con valores por defecto
            adjuntos_count: archivosData.adjuntos ? archivosData.adjuntos.length : 0,
            links_count: archivosData.links ? archivosData.links.length : 0,
            archivos_info: archivosInfo || 'No hay archivos incluidos en este envío.',
            
            // Incluir información de archivos directamente
            archivos_detalle: archivosData.links.length > 0 ? 
                archivosData.links.map(archivo => `${archivo.name} (${(archivo.size/1024).toFixed(1)} KB)`).join(', ') : 
                'Sin archivos',
            
            // Variables adicionales por compatibilidad con diferentes templates
            name: nombre,
            message: mensajeAutomatico,
            reply_to: ADMIN_EMAIL || 'reportes.hightest@gmail.com'
        };
        
        // Agregar archivos pequeños como parámetros directos en el template
        if (archivosData.adjuntos.length > 0) {
            archivosData.adjuntos.forEach((archivo, index) => {
                if (index < 3) { // Máximo 3 archivos pequeños
                    parametros[`archivo_${index + 1}_nombre`] = archivo.name;
                    parametros[`archivo_${index + 1}_descarga`] = archivo.dataUrl;
                }
            });
        }
        
        console.log('📋 Enviando email con archivos:', {
            para: parametros.to_email,
            cc: parametros.cc_email,
            nombre: parametros.to_name,
            asunto,
            template: EMAILJS_CONFIG.templateId,
            service: EMAILJS_CONFIG.serviceId,
            adjuntos: archivosData.adjuntos.length,
            links: archivosData.links.length,
            archivos_detalle: parametros.archivos_detalle
        });
        
        console.log('🔧 Parámetros completos:', parametros);
        
        const resultado = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            parametros
        );
        
        console.log('✅ Email enviado:', resultado);
        
        let mensajeExito = `✅ Email enviado exitosamente`;
        if (archivosData.adjuntos.length > 0) {
            mensajeExito += ` con ${archivosData.adjuntos.length} descarga(s) directa(s)`;
        }
        if (archivosData.links.length > 0) {
            mensajeExito += ` y ${archivosData.links.length} archivo(s) grande(s) referenciado(s)`;
        }
        if (mensajePDF) {
            mensajeExito += ` ${mensajePDF}`;
        }
        
        mostrarNotificacion(mensajeExito, 'success');
        cerrarModalEmail();
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        console.error('❌ Error detalles:', {
            message: error.message,
            text: error.text,
            status: error.status,
            stack: error.stack
        });
        
        let mensajeError = '❌ Error enviando email: ';
        
        if (error.text) {
            mensajeError += error.text;
        } else if (error.message) {
            mensajeError += error.message;
        } else {
            mensajeError += 'Error desconocido';
        }
        
        // Verificar errores comunes
        if (error.status === 400) {
            mensajeError += '\n🔍 Posible problema con parámetros del template';
        } else if (error.status === 401) {
            mensajeError += '\n🔍 Problema de autenticación con EmailJS';
        } else if (error.status === 404) {
            mensajeError += '\n🔍 Service ID o Template ID incorrectos';
        }
        
        mostrarNotificacion(mensajeError, 'error');
    }
}

// FUNCIÓN: CERRAR MODAL DE EMAIL
function cerrarModalEmail() {
    const modal = document.getElementById('modal-email');
    if (modal) {
        modal.remove();
    }
}

// FUNCIÓN: ACTUALIZAR LISTA DE ARCHIVOS
function actualizarListaArchivos() {
    const input = document.getElementById('email-archivos');
    const lista = document.getElementById('lista-archivos');
    
    console.log('🔍 Debug - actualizarListaArchivos llamado');
    console.log('🔍 Input encontrado:', !!input);
    console.log('🔍 Lista encontrada:', !!lista);
    
    if (!input || !lista) {
        console.log('❌ No se encontró input o lista');
        return;
    }
    
    const archivos = Array.from(input.files);
    console.log('🔍 Archivos seleccionados:', archivos.length);
    
    if (archivos.length === 0) {
        console.log('🔍 No hay archivos, limpiando lista');
        lista.innerHTML = '';
        return;
    }
    
    console.log('📁 Archivos detectados:');
    archivos.forEach((archivo, index) => {
        console.log(`${index + 1}. ${archivo.name} - ${archivo.size} bytes (${(archivo.size/1024).toFixed(2)} KB)`);
    });
    
    let totalSize = 0;
    let html = '<div style="background: #2d3748; border-radius: 8px; padding: 12px; margin-top: 8px;">';
    html += '<div style="color: #4299e1; font-weight: 600; margin-bottom: 8px; font-size: 13px;">📎 Archivos seleccionados:</div>';
    
    archivos.forEach((archivo, index) => {
        const sizeKB = (archivo.size / 1024).toFixed(1);
        const sizeMB = (archivo.size / 1024 / 1024).toFixed(2);
        totalSize += archivo.size;
        
        // Clasificar archivos por tamaño
        let tipoArchivo = '';
        let colorSize = '';
        let icono = '';
        
        if (archivo.size <= 512 * 1024) { // <= 512KB - Adjunto directo
            tipoArchivo = 'Adjunto';
            colorSize = '#68d391';
            icono = '📎';
        } else if (archivo.size <= 5 * 1024 * 1024) { // <= 5MB - Link directo
            tipoArchivo = 'Link';
            colorSize = '#4299e1';
            icono = '🔗';
        } else { // > 5MB - Link con almacenamiento
            tipoArchivo = 'Link Cloud';
            colorSize = '#f6ad55';
            icono = '☁️';
        }
        
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #4a5568;">
            <div style="flex: 1; min-width: 0;">
                <div style="color: #e2e8f0; font-size: 13px; truncate;">${archivo.name}</div>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 2px;">
                    <span style="color: ${colorSize}; font-size: 11px; font-weight: 600;">
                        ${icono} ${tipoArchivo}
                    </span>
                    <span style="color: #a0aec0; font-size: 11px;">
                        ${sizeMB > 1 ? sizeMB + ' MB' : sizeKB + ' KB'}
                    </span>
                </div>
            </div>
            <button onclick="removerArchivo(${index})" style="background: #e53e3e; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-left: 8px;">
                ✕
            </button>
        </div>`;
    });
    
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    // Estadísticas de archivos
    const adjuntos = archivos.filter(f => f.size <= 512 * 1024).length;
    const links = archivos.filter(f => f.size > 512 * 1024).length;
    
    html += `
    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #4a5568;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #68d391; font-size: 12px;">📎 Adjuntos: ${adjuntos}</span>
            <span style="color: #4299e1; font-size: 12px;">🔗 Links: ${links}</span>
        </div>
        <div style="text-align: center;">
            <span style="color: #e2e8f0; font-size: 12px; font-weight: 600;">
                Total: ${totalSizeMB} MB (${archivos.length} archivo${archivos.length !== 1 ? 's' : ''})
            </span>
        </div>
    </div>
    </div>`;
    
    lista.innerHTML = html;
    console.log('✅ Lista actualizada con', archivos.length, 'archivos');
}

// FUNCIÓN: REMOVER ARCHIVO DE LA LISTA
function removerArchivo(index) {
    const input = document.getElementById('email-archivos');
    if (!input) return;
    
    // Crear nuevo FileList sin el archivo removido
    const dt = new DataTransfer();
    const archivos = Array.from(input.files);
    
    archivos.forEach((archivo, i) => {
        if (i !== index) {
            dt.items.add(archivo);
        }
    });
    
    input.files = dt.files;
    actualizarListaArchivos();
}

// FUNCIÓN: CONVERTIR ARCHIVO A BASE64
function archivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remover el prefijo data:
        reader.onerror = reject;
        reader.readAsDataURL(archivo);
    });
}

// FUNCIÓN: PROCESAR ARCHIVOS PARA EMAILJS - SOLUCIÓN HÍBRIDA DEFINITIVA
async function procesarArchivosParaEmail() {
    const input = document.getElementById('email-archivos');
    if (!input || !input.files.length) return { adjuntos: [], links: [] };
    
    const archivos = Array.from(input.files);
    const archivosAdjuntos = [];
    const archivosLinks = [];
    
    try {
        console.log(`📁 Procesando ${archivos.length} archivo(s)...`);
        
        for (let archivo of archivos) {
            const sizeKB = archivo.size / 1024;
            console.log(`� Analizando: ${archivo.name} (${sizeKB.toFixed(1)} KB)`);
            
            if (archivo.size <= 25 * 1024) { // <= 25KB - Adjunto Base64 directo
                console.log(`📎 Procesando como adjunto directo: ${archivo.name}`);
                const base64 = await archivoABase64(archivo);
                const mimeType = archivo.type || 'application/octet-stream';
                const dataUrl = `data:${mimeType};base64,${base64}`;
                
                archivosAdjuntos.push({
                    name: archivo.name,
                    size: archivo.size,
                    dataUrl: dataUrl,
                    base64: base64,
                    mimeType: mimeType
                });
                
            } else { // > 25KB - Crear enlace de descarga con instrucciones
                console.log(`🔗 Procesando archivo grande: ${archivo.name}`);
                
                // Crear blob URL para descarga local
                const blobUrl = URL.createObjectURL(archivo);
                
                // Guardar referencia para mantener el blob activo
                if (!window.archivosTemporales) window.archivosTemporales = new Map();
                window.archivosTemporales.set(archivo.name, {
                    blob: archivo,
                    url: blobUrl,
                    created: Date.now()
                });
                
                archivosLinks.push({
                    name: archivo.name,
                    size: archivo.size,
                    link: blobUrl,
                    tipo: 'blob-local',
                    expiry: 'Disponible durante esta sesión'
                });
            }
        }
        
        console.log(`✅ Procesados: ${archivosAdjuntos.length} adjuntos directos, ${archivosLinks.length} links`);
        return { adjuntos: archivosAdjuntos, links: archivosLinks };
        
    } catch (error) {
        console.error('❌ Error procesando archivos:', error);
        throw new Error('Error procesando archivos: ' + error.message);
    }
}

// FUNCIÓN: SUBIR ARCHIVO A SERVICIO REAL
async function subirArchivoReal(archivo) {
    try {
        console.log(`📤 Procesando archivo: ${archivo.name} (${(archivo.size/1024/1024).toFixed(2)} MB)`);
        
        // Intentar con transfersh primero (más confiable)
        return await subirArchivoTransferSH(archivo);
        
    } catch (error) {
        console.error(`❌ Error subiendo ${archivo.name}:`, error);
        mostrarNotificacion(`⚠️ Usando método local para ${archivo.name}`, 'warning');
        
        // Fallback a blob temporal
        return generarBlobTemporal(archivo);
    }
}

// FUNCIÓN: SUBIR A TRANSFER.SH
async function subirArchivoTransferSH(archivo) {
    try {
        console.log(`📤 Intentando subir a transfer.sh: ${archivo.name}`);
        mostrarNotificacion(`📤 Subiendo ${archivo.name}...`, 'info');
        
        const url = `https://transfer.sh/${encodeURIComponent(archivo.name)}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            body: archivo,
            headers: {
                'Content-Type': archivo.type || 'application/octet-stream'
            }
        });
        
        if (response.ok) {
            const downloadUrl = await response.text();
            console.log(`✅ Archivo subido exitosamente: ${downloadUrl.trim()}`);
            mostrarNotificacion(`✅ ${archivo.name} subido exitosamente`, 'success');
            
            return {
                name: archivo.name,
                size: archivo.size,
                link: downloadUrl.trim(),
                expiry: 'Disponible por 14 días',
                type: 'transfer.sh',
                realLink: true
            };
        } else {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Transfer.sh falló:', error);
        throw error;
    }
}

// FUNCIÓN: SERVICIO ALTERNATIVO CON TMPFILES
async function subirArchivoAlternativo(archivo) {
    try {
        console.log(`📤 Intentando método alternativo: ${archivo.name}`);
        
        // Usar tmpfiles.org
        const formData = new FormData();
        formData.append('file', archivo);
        
        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                console.log(`✅ Archivo subido a tmpfiles.org: ${result.data.url}`);
                
                return {
                    name: archivo.name,
                    size: archivo.size,
                    link: result.data.url,
                    expiry: 'Disponible por tiempo limitado',
                    type: 'tmpfiles.org',
                    realLink: true
                };
            }
        }
        
        throw new Error('Servicios externos no disponibles');
        
    } catch (error) {
        console.error('❌ Método alternativo falló:', error);
        throw error;
    }
}

// FUNCIÓN: GENERAR BLOB TEMPORAL (FALLBACK CONFIABLE)
function generarBlobTemporal(archivo) {
    console.log(`🔄 Generando enlace temporal para ${archivo.name}`);
    
    // Crear URL temporal del blob
    const url = URL.createObjectURL(archivo);
    
    // Guardar referencia para mantener el blob activo
    if (!window.blobFiles) window.blobFiles = new Map();
    window.blobFiles.set(archivo.name, { blob: archivo, url: url });
    
    return {
        name: archivo.name,
        size: archivo.size,
        link: url,
        expiry: 'Válido durante esta sesión',
        type: 'blob-local',
        realLink: false,
        note: '📋 Descarga disponible: haz clic derecho → "Guardar enlace como..."'
    };
}

// FUNCIÓN: GENERAR LINK TEMPORAL PARA ARCHIVO (SIMPLIFICADA)
async function generarLinkTemporal(archivo) {
    console.log(`🔄 Procesando archivo: ${archivo.name} (${(archivo.size/1024/1024).toFixed(2)} MB)`);
    
    // Para la mayoría de archivos, usar blob temporal (más confiable)
    mostrarNotificacion(`📋 Preparando ${archivo.name} para descarga`, 'info');
    return generarBlobTemporal(archivo);
}


// =====================================================
// 📄 FUNCIONES PARA OBTENER DATOS DEL FORMULARIO
// =====================================================

// FUNCIÓN: OBTENER DATOS DE LA APLICACIÓN
function obtenerDatosAplicacion() {
    try {
        const numeroRecepcion = document.getElementById('quoteNumber')?.value || 'No especificado';
        const fechaRecepcion = document.getElementById('fechaRecepcion')?.value || new Date().toLocaleDateString('es-ES');
        const nombreCliente = document.getElementById('empresaSelect')?.selectedOptions[0]?.textContent || 'Cliente no especificado';
        const nitEmpresa = document.getElementById('nitEmpresa')?.value || 'NIT no especificado';
        
        return {
            numeroRecepcion,
            fechaRecepcion,
            nombreCliente,
            nitEmpresa,
            fechaActual: new Date().toLocaleDateString('es-ES'),
            horaActual: new Date().toLocaleTimeString('es-ES')
        };
    } catch (error) {
        console.error('Error obteniendo datos:', error);
        return {
            numeroRecepcion: 'ERROR-' + Date.now(),
            fechaRecepcion: new Date().toLocaleDateString('es-ES'),
            nombreCliente: 'Cliente no especificado',
            nitEmpresa: 'NIT no especificado',
            fechaActual: new Date().toLocaleDateString('es-ES'),
            horaActual: new Date().toLocaleTimeString('es-ES')
        };
    }
}

// =====================================================
// 📄 FUNCIONES DE DESCARGA DE PDF
// =====================================================

// FUNCIÓN: GENERAR PDF DE RECEPCIÓN
function generarPDFRecepcion() {
    try {
        // Verificar si hay datos en la tabla
        const tabla = document.querySelector('#itemsTable tbody');
        if (!tabla || tabla.children.length === 0) {
            mostrarNotificacion('⚠️ No hay elementos para generar PDF', 'warning');
            return;
        }

        // Obtener datos reales del formulario
        const datos = obtenerDatosAplicacion();

        // Crear ventana de PDF
        const ventanaPDF = window.open('', '_blank');
        
        // Obtener datos de la tabla
        const filas = Array.from(tabla.children);
        let itemsHTML = '';
        let totalItems = 0;
        
        filas.forEach((fila, index) => {
            const celdas = Array.from(fila.children);
            if (celdas.length >= 7) { // Verificar que tenga todas las columnas
                totalItems++;
                itemsHTML += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px; text-align: center;">${totalItems}</td>
                    <td style="padding: 8px;">${celdas[0].textContent}</td>
                    <td style="padding: 8px;">${celdas[1].textContent}</td>
                    <td style="padding: 8px; text-align: center;">${celdas[2].textContent}</td>
                    <td style="padding: 8px;">${celdas[3].textContent}</td>
                    <td style="padding: 8px;">${celdas[4].textContent}</td>
                    <td style="padding: 8px;">${celdas[5].textContent}</td>
                </tr>`;
            }
        });

        const contenidoPDF = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recepción de Elementos - ${datos.numeroRecepcion}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #007bff; margin: 0; }
                .header h2 { color: #6c757d; margin: 5px 0; }
                .info-section { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
                .info-label { font-weight: bold; color: #495057; }
                .tabla-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .tabla-items th { background: #007bff; color: white; padding: 12px 8px; text-align: left; }
                .tabla-items td { padding: 8px; border-bottom: 1px solid #ddd; }
                .tabla-items tr:nth-child(even) { background: #f8f9fa; }
                .footer { margin-top: 40px; border-top: 2px solid #6c757d; padding-top: 20px; }
                .firma-section { margin-top: 40px; display: flex; justify-content: space-between; }
                .firma-box { width: 45%; }
                .firma-line { border-top: 1px solid #333; margin-top: 40px; text-align: center; padding-top: 5px; }
                .resumen { background: #e8f4fd; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏢 HIGH TEST S.A.S</h1>
                <h2>Recepción de Elementos</h2>
                <p><strong>Caso No:</strong> ${datos.numeroRecepcion}</p>
            </div>

            <div class="info-section">
                <div class="info-row">
                    <span class="info-label">📅 Fecha de Recepción:</span>
                    <span>${datos.fechaRecepcion}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">� Cliente:</span>
                    <span>${datos.nombreCliente}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🆔 NIT / CC:</span>
                    <span>${datos.nitEmpresa}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📋 Total de Elementos:</span>
                    <span>${totalItems}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🕒 Hora de Generación:</span>
                    <span>${datos.horaActual}</span>
                </div>
            </div>

            <div class="resumen">
                <h3>📊 Resumen de Recepción</h3>
                <p>Se han recibido <strong>${totalItems} elemento(s)</strong> del cliente <strong>${datos.nombreCliente}</strong> (NIT: ${datos.nitEmpresa}) para procesamiento según las especificaciones detalladas en la tabla siguiente.</p>
            </div>

            <table class="tabla-items">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Elemento</th>
                        <th>Ensayo</th>
                        <th>Cantidad</th>
                        <th>Observaciones</th>
                        <th>Empresa</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <div class="footer">
                <div class="firma-section">
                    <div class="firma-box">
                        <div class="firma-line">
                            <strong>Entregado por</strong><br>
                            <small>${datos.nombreCliente}</small><br>
                            <small>Nombre y Firma</small>
                        </div>
                    </div>
                    <div class="firma-box">
                        <div class="firma-line">
                            <strong>Recibido por</strong><br>
                            <small>HIGH TEST S.A.S</small><br>
                            <small>Nombre y Firma</small>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #6c757d;">
                    <p><small>Documento generado automáticamente por el Sistema de Gestión HIGH TEST S.A.S</small></p>
                    <p><small>Generado el ${datos.fechaActual} a las ${datos.horaActual}</small></p>
                </div>
            </div>
        </body>
        </html>`;

        ventanaPDF.document.write(contenidoPDF);
        ventanaPDF.document.close();
        
        // Auto-imprimir/guardar después de un breve delay
        setTimeout(() => {
            ventanaPDF.print();
        }, 1000);

        mostrarNotificacion('✅ PDF generado correctamente', 'success');
        
        // Guardar referencia global del PDF para el email
        window.ultimoPDFGenerado = {
            numeroRecepcion: datos.numeroRecepcion,
            cliente: datos.nombreCliente,
            fecha: datos.fechaRecepcion,
            nit: datos.nitEmpresa,
            contenidoHTML: contenidoPDF
        };
        
        return datos.numeroRecepcion; // Retornar número de caso para referencia
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        mostrarNotificacion('❌ Error generando PDF: ' + error.message, 'error');
    }
}

// FUNCIÓN: DESCARGAR PDF COMO ARCHIVO
function descargarPDFRecepcion() {
    try {
        const numeroCaso = generarPDFRecepcion();
        if (numeroCaso) {
            // Crear enlace de descarga
            setTimeout(() => {
                mostrarNotificacion('💾 Use Ctrl+S en la ventana del PDF para guardarlo', 'info');
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Error descargando PDF:', error);
        mostrarNotificacion('❌ Error en la descarga', 'error');
    }
}

// FUNCIÓN: AGREGAR BOTÓN DE PDF A LA INTERFAZ
function agregarBotonPDF() {
    // Verificar si ya existe
    if (document.getElementById('btn-pdf-recepcion')) return;
    
    // Buscar un lugar apropiado para el botón (cerca de la tabla)
    const tabla = document.querySelector('#itemsTable');
    if (!tabla) return;
    
    const contenedorBoton = document.createElement('div');
    contenedorBoton.style.cssText = `
        margin: 20px 0;
        text-align: center;
    `;
    
    const botonPDF = document.createElement('button');
    botonPDF.id = 'btn-pdf-recepcion';
    botonPDF.innerHTML = '📄 Generar PDF de Recepción';
    botonPDF.style.cssText = `
        background: #28a745;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    botonPDF.onclick = generarPDFRecepcion;
    
    botonPDF.onmouseenter = () => {
        botonPDF.style.background = '#218838';
        botonPDF.style.transform = 'translateY(-2px)';
    };
    
    botonPDF.onmouseleave = () => {
        botonPDF.style.background = '#28a745';
        botonPDF.style.transform = 'translateY(0)';
    };
    
    contenedorBoton.appendChild(botonPDF);
    tabla.parentNode.insertBefore(contenedorBoton, tabla.nextSibling);
    
    console.log('📄 Botón de PDF agregado');
}

// FUNCIÓN: INICIALIZAR EMAILJS
function inicializarEmailJS() {
    try {
        console.log('🔍 Verificando EmailJS...');
        console.log('🔍 window.emailjs disponible:', typeof window.emailjs !== 'undefined');
        console.log('🔍 emailjs global disponible:', typeof emailjs !== 'undefined');
        
        if (typeof emailjs === 'undefined' && typeof window.emailjs === 'undefined') {
            console.error('❌ EmailJS no cargado - script faltante');
            mostrarNotificacion('❌ Error: EmailJS no está cargado', 'error');
            return false;
        }
        
        // Usar window.emailjs si emailjs global no está disponible
        if (typeof emailjs === 'undefined' && typeof window.emailjs !== 'undefined') {
            window.emailjs = window.emailjs;
            console.log('✅ Usando window.emailjs');
        }
        
        console.log('🔧 Inicializando con PublicKey:', EMAILJS_CONFIG.publicKey);
        emailjs.init(EMAILJS_CONFIG.publicKey);
        
        EMAIL_SYSTEM_READY = true;
        console.log('✅ EmailJS inicializado correctamente');
        console.log('🔧 Config actual:', EMAILJS_CONFIG);
        
        return true;
    } catch (error) {
        console.error('❌ Error inicializando EmailJS:', error);
        mostrarNotificacion('❌ Error inicializando EmailJS: ' + error.message, 'error');
        return false;
    }
}

// FUNCIÓN: ENVIAR EMAIL DE PRUEBA
async function enviarPrueba() {
    try {
        if (!ADMIN_EMAIL) {
            if (!configurarAdminEmail()) return;
        }
        
        if (!EMAIL_SYSTEM_READY) {
            if (!inicializarEmailJS()) {
                mostrarNotificacion('❌ Error inicializando sistema', 'error');
                return;
            }
        }
        
        const emailPrueba = prompt('Email de destino para prueba:');
        if (!emailPrueba || !validarEmail(emailPrueba)) {
            mostrarNotificacion('❌ Email de destino inválido', 'error');
            return;
        }
        
        console.log('📤 Enviando email con parámetros:', {
            destinatario: emailPrueba,
            administrador: ADMIN_EMAIL
        });
        
        // PARÁMETROS BÁSICOS - USANDO DATOS REALES DE LA APLICACIÓN
        const datos = obtenerDatosAplicacion();
        
        const parametros = {
            // Variables que coinciden con tu template usando datos reales
            to_email: emailPrueba,
            cc_email: '',
            to_name: 'Usuario de Prueba',
            html_message: `Este es un email de prueba del sistema HIGH TEST S.A.S.

**Información del sistema actual:**
- Número de Recepción: ${datos.numeroRecepcion}
- Cliente: ${datos.nombreCliente}
- NIT: ${datos.nitEmpresa}
- Fecha de Recepción: ${datos.fechaRecepcion}
- Fecha de prueba: ${datos.fechaActual}
- Hora: ${datos.horaActual}

Si recibes este email, el sistema funciona correctamente.

Saludos,
HIGH TEST S.A.S`,
            caso_numero: datos.numeroRecepcion,
            fecha_actual: datos.fechaRecepcion,
            desde_nombre: datos.nitEmpresa,
            empresa_nombre: 'HIGH TEST S.A.S',
            
            // Información adicional del cliente
            cliente_nombre: datos.nombreCliente,
            nit_empresa: datos.nitEmpresa,
            
            // Formato estándar adicional
            from_name: 'HIGH TEST S.A.S',
            subject: 'Prueba Sistema HIGH TEST - ' + datos.numeroRecepcion,
            message: 'Email de prueba del sistema.',
            
            // Formatos alternativos por si usa nombres diferentes
            name: 'Usuario de Prueba',
            email: emailPrueba,
            destinatario: emailPrueba,
            recipient: emailPrueba,
            user_email: emailPrueba,
            reply_to: ADMIN_EMAIL
        };
        
        console.log('📋 Parámetros finales enviados a EmailJS:', parametros);
        
        const resultado = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            parametros
        );
        
        console.log('✅ Email enviado exitosamente:', resultado);
        mostrarNotificacion('✅ Email de prueba enviado exitosamente', 'success');
        
        // INSTRUCCIONES PARA EL USUARIO
        setTimeout(() => {
            mostrarNotificacion('📧 Revisa: 1) Spam/Correo no deseado 2) Dashboard EmailJS', 'info');
        }, 2000);
        
        setTimeout(() => {
            mostrarNotificacion('🔍 Dashboard: https://dashboard.emailjs.com/admin/history', 'info');
        }, 4000);
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('❌ Tipo de error:', typeof error);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error stack:', error?.stack);
        
        let mensajeError = 'Error desconocido';
        
        if (error && error.message) {
            mensajeError = error.message;
        } else if (typeof error === 'string') {
            mensajeError = error;
        } else if (error && error.text) {
            mensajeError = error.text;
        }
        
        mostrarNotificacion('❌ Error: ' + mensajeError, 'error');
        
        // Sugerencias de solución
        console.log('💡 Posibles soluciones:');
        console.log('  1. Verificar credenciales EmailJS');
        console.log('  2. Revisar plantilla en EmailJS');
        console.log('  3. Verificar conexión a internet');
    }
}

// FUNCIÓN: MOSTRAR PANEL DE CONTROL
function mostrarPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2d3748;
        color: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        z-index: 10000;
        font-family: Arial, sans-serif;
        min-width: 400px;
        text-align: center;
    `;
    
    panel.innerHTML = `
        <h2 style="color: #4299e1; margin-bottom: 20px;">📧 Sistema de Email HIGH TEST</h2>
        <p><strong>Admin:</strong> ${ADMIN_EMAIL || 'No configurado'}</p>
        <p><strong>Estado:</strong> ${EMAIL_SYSTEM_READY ? '✅ Listo' : '⚠️ No inicializado'}</p>
        <hr style="margin: 20px 0; border-color: #4a5568;">
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button onclick="enviarEmailPersonalizado()" style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                � Enviar Email
            </button>
            <button onclick="this.parentNode.parentNode.remove()" style="background: #dc3545; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ❌ Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(panel);
}

// FUNCIÓN: CREAR BOTÓN FLOTANTE
function crearBotonFlotante() {
    // Evitar duplicados
    const existente = document.getElementById('emailBtn');
    if (existente) existente.remove();
    
    const boton = document.createElement('button');
    boton.id = 'emailBtn';
    boton.innerHTML = '📧';
    boton.title = 'Sistema de Email';
    boton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: #022859;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        transition: all 0.3s ease;
    `;
    
    boton.onclick = mostrarPanel;
    
    boton.onmouseenter = () => {
        boton.style.transform = 'scale(1.1)';
        boton.style.background = '#034075';
    };
    
    boton.onmouseleave = () => {
        boton.style.transform = 'scale(1)';
        boton.style.background = '#022859';
    };
    
    document.body.appendChild(boton);
    console.log('📧 Botón flotante creado');
}

// FUNCIÓN: INICIALIZAR SISTEMA
function inicializarSistema() {
    console.log('🚀 Inicializando sistema definitivo...');
    
    setTimeout(() => {
        inicializarEmailJS();
        crearBotonFlotante();
        agregarBotonPDF(); // Agregar botón de PDF
        mostrarNotificacion('📧 Sistema de email y PDF listo', 'success');
    }, 1000);
}

// FUNCIÓN: CONFIGURAR CREDENCIALES EMAILJS
function configurarCredencialesEmailJS() {
    const serviceId = prompt('Ingrese su Service ID de EmailJS:');
    const templateId = prompt('Ingrese su Template ID de EmailJS:');
    
    if (serviceId && templateId) {
        EMAILJS_CONFIG.serviceId = serviceId;
        EMAILJS_CONFIG.templateId = templateId;
        
        localStorage.setItem('emailjs_service', serviceId);
        localStorage.setItem('emailjs_template', templateId);
        
        mostrarNotificacion('✅ Credenciales EmailJS actualizadas', 'success');
        
        // Reinicializar EmailJS
        EMAIL_SYSTEM_READY = false;
        inicializarEmailJS();
        
        return true;
    } else {
        mostrarNotificacion('❌ Credenciales no válidas', 'error');
        return false;
    }
}

// FUNCIÓN: TEST RÁPIDO DE EMAILJS
async function testEmailJS() {
    console.log('🧪 Iniciando test de EmailJS...');
    
    if (!window.emailjs && !window.emailjs) {
        console.error('❌ EmailJS no disponible');
        mostrarNotificacion('❌ EmailJS no está cargado', 'error');
        return false;
    }
    
    try {
        const testParams = {
            to_email: 'reportes.hightest@gmail.com', // Email de prueba
            to_name: 'Test Usuario',
            subject: 'Test - Sistema HIGH TEST',
            message: 'Este es un test del sistema de emails.',
            from_name: 'HIGH TEST S.A.S'
        };
        
        console.log('🧪 Enviando test con:', testParams);
        console.log('🧪 Config:', EMAILJS_CONFIG);
        
        const result = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            testParams
        );
        
        console.log('✅ Test exitoso:', result);
        mostrarNotificacion('✅ Test de EmailJS exitoso', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ Test falló:', error);
        mostrarNotificacion('❌ Test falló: ' + (error.text || error.message), 'error');
        return false;
    }
}

// EXPONER FUNCIONES GLOBALES
window.subirArchivoReal = subirArchivoReal;
window.subirArchivoAlternativo = subirArchivoAlternativo;
window.testEmailJS = testEmailJS;
window.enviarPrueba = enviarPrueba;
window.enviarEmailPersonalizado = enviarEmailPersonalizado;
window.procesarEnvioEmail = procesarEnvioEmail;
window.cerrarModalEmail = cerrarModalEmail;
window.actualizarListaArchivos = actualizarListaArchivos;
window.removerArchivo = removerArchivo;
window.archivoABase64 = archivoABase64;
window.procesarArchivosParaEmail = procesarArchivosParaEmail;
window.generarLinkTemporal = generarLinkTemporal;
window.obtenerDatosAplicacion = obtenerDatosAplicacion;
window.generarPDFRecepcion = generarPDFRecepcion;
window.descargarPDFRecepcion = descargarPDFRecepcion;
window.agregarBotonPDF = agregarBotonPDF;
window.configurarAdminEmail = configurarAdminEmail;
window.mostrarPanel = mostrarPanel;
window.inicializarSistema = inicializarSistema;
window.crearBotonFlotante = crearBotonFlotante;

// FUNCIONES PLACEHOLDER PARA COMPATIBILIDAD
window.sendRecepcionPDF = () => mostrarNotificacion('📧 Función en desarrollo', 'info');
window.sendCompletePDF = () => mostrarNotificacion('📧 Función en desarrollo', 'info');
window.triggerPDFDownload = () => mostrarNotificacion('📧 Función en desarrollo', 'info');
window.initializeEmailSystem = inicializarEmailJS;
window.testEmailSystem = enviarPrueba;
window.createEmailFloatingButton = crearBotonFlotante;
window.initEmailOnLoad = inicializarSistema;

console.log('✅ Sistema Email Definitivo cargado');