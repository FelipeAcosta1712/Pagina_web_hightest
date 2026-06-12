// =======================================================
// SISTEMA DE EMAIL REAL MEJORADO - MÚLTIPLES PROVEEDORES
// =======================================================

/**
 * Sistema avanzado de envío de emails con soporte para múltiples proveedores
 * Incluye EmailJS, SendGrid, SMTP y servicios cloud
 * 
 * Versión 2.0 - Mejorado para HIGH TEST S.A.S
 * 
 * CONFIGURACIÓN RÁPIDA:
 * 1. Para EmailJS (Recomendado para frontend):
 *    - Crear cuenta en https://emailjs.com
 *    - Configurar servicio de email (Gmail, Outlook, etc.)
 *    - Obtener Service ID, Template ID y Public Key
 *    - Configurar en el panel de administración
 * 
 * 2. Para Gmail SMTP:
 *    - Habilitar autenticación de 2 factores
 *    - Generar contraseña de aplicación
 *    - Configurar en el backend con Nodemailer
 * 
 * 3. Para SendGrid:
 *    - Crear cuenta en SendGrid
 *    - Obtener API Key
 *    - Implementar backend API
 */

// Configuraciones de proveedores de email
const EMAIL_PROVIDERS = {
    emailjs: {
        name: 'EmailJS',
        description: 'Servicio gratuito para emails desde frontend',
        config: {
            serviceId: 'service_hightest',
            templateId: 'template_pdf_recepcion',
            publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
            userId: 'user_YOUR_USER_ID'
        },
        maxAttachmentSize: 10 * 1024 * 1024, // 10MB
        rateLimit: 200 // emails por mes gratis
    },
    
    sendgrid: {
        name: 'SendGrid',
        description: 'Servicio profesional de email marketing',
        config: {
            apiKey: 'YOUR_SENDGRID_API_KEY',
            fromEmail: 'noreply@hightest.com',
            fromName: 'HIGH TEST S.A.S'
        },
        maxAttachmentSize: 30 * 1024 * 1024, // 30MB
        rateLimit: 100 // emails por día gratis
    },
    
    gmail: {
        name: 'Gmail SMTP',
        description: 'Gmail con contraseña de aplicación',
        config: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'your-email@gmail.com',
                pass: 'your-app-password' // Contraseña de aplicación de Gmail
            }
        },
        maxAttachmentSize: 25 * 1024 * 1024, // 25MB
        rateLimit: 500 // emails por día
    }
};

// Configuración actual del sistema
const EMAIL_CONFIG = {
    currentProvider: 'emailjs', // Proveedor activo
    fallbackProvider: 'gmail',  // Proveedor de respaldo
    retryAttempts: 3,
    retryDelay: 5000, // 5 segundos
    queueEnabled: true,
    compression: true,
    providers: EMAIL_PROVIDERS
};

// Estado del sistema de email
let emailSystem = {
    initialized: false,
    currentProvider: null,
    lastEmailSent: null,
    emailQueue: [],
    sendingInProgress: false,
    statistics: {
        totalSent: 0,
        successCount: 0,
        errorCount: 0,
        lastSuccess: null,
        lastError: null
    },
    rateLimits: {},
    connectionStatus: {}
};

// =======================================================
// INICIALIZACIÓN DEL SISTEMA
// =======================================================

/**
 * Inicializa el sistema de email
 */
async function initializeEmailSystem(providerName = null) {
    console.log('📧 Inicializando sistema de email mejorado...');
    
    const provider = providerName || EMAIL_CONFIG.currentProvider;
    
    try {
        // Cargar configuración guardada
        await loadEmailConfiguration();
        
        // Inicializar proveedor
        const result = await initializeProvider(provider);
        
        if (result.success) {
            emailSystem.currentProvider = provider;
            emailSystem.initialized = true;
            
            console.log(`✅ Sistema de email inicializado con ${provider}`);
            
            // Crear interfaz para administradores
            if (typeof hasRole === 'function' && hasRole('administrador')) {
                setTimeout(createEmailFloatingButton, 1000);
            }
            
            return { success: true, provider };
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('❌ Error al inicializar sistema de email:', error);
        showNotification('⚠️ Sistema de email no disponible', 'warning');
        return { success: false, error: error.message };
    }
}

/**
 * Inicializa un proveedor específico
 */
async function initializeProvider(providerName) {
    const provider = EMAIL_PROVIDERS[providerName];
    
    if (!provider) {
        return { success: false, error: `Proveedor ${providerName} no encontrado` };
    }
    
    try {
        switch (providerName) {
            case 'emailjs':
                return await initializeEmailJS(provider);
            default:
                return { success: false, error: `Proveedor ${providerName} requiere backend` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Inicializa EmailJS
 */
async function initializeEmailJS(provider) {
    if (typeof emailjs === 'undefined') {
        return { success: false, error: 'EmailJS no está cargado. Agregue: <script src="https://cdn.emailjs.com/sdk/3.11.0/email.min.js"></script>' };
    }
    
    const config = provider.config;
    
    if (!config.publicKey || config.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        return { success: false, error: 'Configure EmailJS: Service ID, Template ID y Public Key en el panel de administración' };
    }
    
    emailjs.init(config.publicKey);
    
    emailSystem.connectionStatus.emailjs = {
        status: 'connected',
        lastCheck: new Date(),
        config: {
            serviceId: config.serviceId,
            templateId: config.templateId
        }
    };
    
    return { success: true };
}

// =======================================================
// FUNCIONES DE ENVÍO DE EMAIL
// =======================================================

/**
 * Envía email con PDF adjunto
 */
async function sendEmailWithPDF(emailData) {
    if (!emailSystem.initialized) {
        throw new Error('Sistema de email no inicializado');
    }
    
    const { to, subject, htmlBody, pdfBlob, fileName } = emailData;
    
    // Validar datos
    if (!to || !isValidEmail(to)) {
        throw new Error('Email de destino inválido');
    }
    
    if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('PDF no válido');
    }
    
    try {
        emailSystem.sendingInProgress = true;
        
        console.log('📧 Enviando email a:', to);
        
        // Enviar con EmailJS
        const result = await sendViaEmailJS(emailData);
        
        if (result.success) {
            updateEmailStatistics('success', result);
            saveEmailToHistory({
                ...emailData,
                timestamp: new Date(),
                status: 'success',
                provider: 'emailjs',
                messageId: result.messageId
            });
            
            return result;
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        updateEmailStatistics('error', { error: error.message });
        saveEmailToHistory({
            ...emailData,
            timestamp: new Date(),
            status: 'error',
            error: error.message
        });
        throw error;
    } finally {
        emailSystem.sendingInProgress = false;
    }
}

/**
 * Envía email usando EmailJS
 */
async function sendViaEmailJS(emailData) {
    const { to, subject, htmlBody, pdfBlob, fileName } = emailData;
    
    try {
        // Convertir PDF a base64
        const pdfBase64 = await blobToBase64(pdfBlob);
        
        const provider = EMAIL_PROVIDERS.emailjs;
        
        // Preparar parámetros
        const templateParams = {
            to_email: to,
            to_name: getClientName() || 'Cliente',
            subject: subject,
            message: htmlBody || 'Documento adjunto de HIGH TEST S.A.S',
            html_message: htmlBody,
            pdf_attachment: pdfBase64,
            pdf_filename: fileName,
            from_name: currentUser ? currentUser.nombre : 'HIGH TEST S.A.S',
            caso_numero: document.getElementById('casoNumero')?.value || 'N/A',
            fecha_actual: new Date().toLocaleDateString('es-CO'),
            empresa_nombre: 'HIGH TEST S.A.S'
        };
        
        // Enviar email
        const response = await emailjs.send(
            provider.config.serviceId,
            provider.config.templateId,
            templateParams
        );
        
        return {
            success: true,
            messageId: response.text,
            response: response
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =======================================================
// FUNCIONES PRINCIPALES
// =======================================================

/**
 * Envía PDF de recepción por email
 */
async function sendRecepcionPDF() {
    try {
        if (typeof currentUser !== 'undefined' && !currentUser) {
            showNotification('❌ Debe iniciar sesión para enviar emails', 'error');
            return;
        }
        
        const clientEmail = await getClientEmail();
        if (!clientEmail) {
            showNotification('❌ No se encontró email del cliente', 'error');
            return;
        }
        
        showNotification('📄 Generando PDF para envío...', 'info');
        
        const pdfBlob = await generatePDFBlobRecepcion();
        if (!pdfBlob) {
            throw new Error('No se pudo generar el PDF');
        }
        
        const emailData = {
            to: clientEmail,
            subject: `📋 Recepción de Muestras #${document.getElementById('casoNumero')?.value || 'XXX'} - HIGH TEST S.A.S`,
            htmlBody: generateRecepcionHTML(),
            pdfBlob: pdfBlob,
            fileName: `Recepcion_${document.getElementById('casoNumero')?.value || 'XXX'}_${new Date().toISOString().split('T')[0]}.pdf`,
            type: 'recepcion'
        };
        
        showNotification('📧 Enviando email...', 'info');
        
        const result = await sendEmailWithPDF(emailData);
        
        if (result.success) {
            showNotification('✅ PDF de recepción enviado por email exitosamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error enviando PDF:', error);
        showNotification('❌ Error enviando email: ' + error.message, 'error');
    }
}

/**
 * Envía PDF completo por email
 */
async function sendCompletePDF() {
    try {
        if (typeof currentUser !== 'undefined' && !currentUser) {
            showNotification('❌ Debe iniciar sesión para enviar emails', 'error');
            return;
        }
        
        const clientEmail = await getClientEmail();
        if (!clientEmail) {
            showNotification('❌ No se encontró email del cliente', 'error');
            return;
        }
        
        showNotification('📄 Generando PDF completo...', 'info');
        
        const pdfBlob = await generatePDFBlob();
        if (!pdfBlob) {
            throw new Error('No se pudo generar el PDF completo');
        }
        
        const emailData = {
            to: clientEmail,
            subject: `📈 Resultados de Análisis #${document.getElementById('casoNumero')?.value || 'XXX'} - HIGH TEST S.A.S`,
            htmlBody: generateEntregaHTML(),
            pdfBlob: pdfBlob,
            fileName: `Informe_Completo_${document.getElementById('casoNumero')?.value || 'XXX'}_${new Date().toISOString().split('T')[0]}.pdf`,
            type: 'entrega'
        };
        
        showNotification('📧 Enviando email...', 'info');
        
        const result = await sendEmailWithPDF(emailData);
        
        if (result.success) {
            showNotification('✅ PDF completo enviado por email exitosamente', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error enviando PDF:', error);
        showNotification('❌ Error enviando email: ' + error.message, 'error');
    }
}

// =======================================================
// FUNCIONES DE UTILIDAD
// =======================================================

/**
 * Valida formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Convierte blob a base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Obtiene el nombre del cliente
 */
function getClientName() {
    return document.getElementById('clienteNombre')?.value ||
           document.getElementById('cliente')?.value ||
           'Cliente';
}

/**
 * Obtiene el email del cliente
 */
async function getClientEmail() {
    let email = document.getElementById('clienteEmail')?.value ||
                document.getElementById('emailCliente')?.value ||
                document.getElementById('email')?.value;
                
    if (!email) {
        email = await requestClientEmail();
    }
    
    return email;
}

/**
 * Solicita email del cliente
 */
function requestClientEmail() {
    return new Promise((resolve, reject) => {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%;">
                <h3 style="margin-top: 0; color: #022859;">📧 Email del Cliente</h3>
                <p>Por favor ingrese el email de destino:</p>
                
                <form id="emailRequestForm">
                    <div style="margin-bottom: 20px;">
                        <label for="clientEmailInput" style="display: block; margin-bottom: 5px;">Email:</label>
                        <input type="email" id="clientEmailInput" 
                               style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px;"
                               placeholder="cliente@empresa.com" required>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" style="background: #022859; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; flex: 1;">
                            ✅ Continuar
                        </button>
                        <button type="button" onclick="this.closest('.auth-modal').remove()" 
                                style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; flex: 1;">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#emailRequestForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('clientEmailInput').value;
            modal.remove();
            resolve(email);
        });
        
        modal.querySelector('button[type="button"]').addEventListener('click', () => {
            modal.remove();
            reject(new Error('Cancelado por el usuario'));
        });
        
        document.getElementById('clientEmailInput').focus();
    });
}

/**
 * Actualiza estadísticas del sistema
 */
function updateEmailStatistics(type, data) {
    emailSystem.statistics.totalSent++;
    
    if (type === 'success') {
        emailSystem.statistics.successCount++;
        emailSystem.statistics.lastSuccess = new Date();
        emailSystem.lastEmailSent = data;
    } else {
        emailSystem.statistics.errorCount++;
        emailSystem.statistics.lastError = {
            timestamp: new Date(),
            error: data.error
        };
    }
    
    localStorage.setItem('email_statistics', JSON.stringify(emailSystem.statistics));
}

/**
 * Guarda email en historial
 */
function saveEmailToHistory(emailData) {
    try {
        const history = JSON.parse(localStorage.getItem('email_history') || '[]');
        
        history.push({
            to: emailData.to,
            subject: emailData.subject,
            timestamp: emailData.timestamp || new Date(),
            status: emailData.status,
            provider: emailData.provider,
            error: emailData.error,
            messageId: emailData.messageId
        });
        
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        
        localStorage.setItem('email_history', JSON.stringify(history));
        
    } catch (error) {
        console.error('❌ Error guardando historial:', error);
    }
}

/**
 * Carga configuración guardada
 */
async function loadEmailConfiguration() {
    try {
        const savedConfig = localStorage.getItem('email_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            Object.assign(EMAIL_CONFIG, config);
            
            if (config.providers) {
                Object.assign(EMAIL_PROVIDERS, config.providers);
            }
            
            console.log('✅ Configuración de email cargada');
        }
        
        const savedStats = localStorage.getItem('email_statistics');
        if (savedStats) {
            Object.assign(emailSystem.statistics, JSON.parse(savedStats));
        }
        
    } catch (error) {
        console.warn('⚠️ Error cargando configuración:', error);
    }
}

/**
 * Genera HTML para email de recepción
 */
function generateRecepcionHTML() {
    const casoNumero = document.getElementById('casoNumero')?.value || 'N/A';
    const clienteNombre = getClientName();
    const fechaRecepcion = new Date().toLocaleDateString('es-CO');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #022859; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .info-box { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #022859; }
                .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📋 RECEPCIÓN DE MUESTRAS</h1>
                <p>HIGH TEST S.A.S - Laboratorio de Análisis</p>
            </div>
            
            <div class="content">
                <p>Estimado/a <strong>${clienteNombre}</strong>,</p>
                
                <p>Hemos recibido exitosamente sus muestras para análisis. Adjunto encontrará el documento oficial de recepción.</p>
                
                <div class="info-box">
                    <h3>📊 Detalles de la Recepción</h3>
                    <ul>
                        <li><strong>Caso Nº:</strong> ${casoNumero}</li>
                        <li><strong>Cliente:</strong> ${clienteNombre}</li>
                        <li><strong>Fecha:</strong> ${fechaRecepcion}</li>
                        <li><strong>Responsable:</strong> ${currentUser ? currentUser.nombre : 'HIGH TEST S.A.S'}</li>
                    </ul>
                </div>
                
                <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
            </div>
            
            <div class="footer">
                <p><strong>📞 Contacto:</strong> +57 (1) 123-4567 | <strong>📧 Email:</strong> info@hightest.com</p>
                <p><em>Este es un email automático. Para consultas, responda a info@hightest.com</em></p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Genera HTML para email de entrega
 */
function generateEntregaHTML() {
    const casoNumero = document.getElementById('casoNumero')?.value || 'N/A';
    const clienteNombre = getClientName();
    const fechaEntrega = new Date().toLocaleDateString('es-CO');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .info-box { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745; }
                .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; }
                .success { color: #28a745; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📈 RESULTADOS DE ANÁLISIS</h1>
                <p>HIGH TEST S.A.S - Laboratorio de Análisis</p>
            </div>
            
            <div class="content">
                <p>Estimado/a <strong>${clienteNombre}</strong>,</p>
                
                <p class="success">✅ Sus resultados de análisis están listos.</p>
                <p>Adjunto encontrará el informe técnico completo con todos los resultados y conclusiones.</p>
                
                <div class="info-box">
                    <h3>📊 Detalles del Informe</h3>
                    <ul>
                        <li><strong>Caso Nº:</strong> ${casoNumero}</li>
                        <li><strong>Cliente:</strong> ${clienteNombre}</li>
                        <li><strong>Fecha de Entrega:</strong> ${fechaEntrega}</li>
                        <li><strong>Técnico Responsable:</strong> ${currentUser ? currentUser.nombre : 'Equipo Técnico'}</li>
                        <li><strong>Estado:</strong> <span class="success">COMPLETADO</span></li>
                    </ul>
                </div>
                
                <p>Nuestro equipo técnico está disponible para resolver cualquier duda sobre los resultados.</p>
            </div>
            
            <div class="footer">
                <p><strong>📞 Contacto:</strong> +57 (1) 123-4567 | <strong>📧 Email:</strong> info@hightest.com</p>
                <p><strong>Gracias por elegir HIGH TEST S.A.S para sus análisis de laboratorio</strong></p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Crea botón flotante para administradores
 */
function createEmailFloatingButton() {
    if (document.getElementById('emailFloatingBtn')) return;
    
    const button = document.createElement('button');
    button.id = 'emailFloatingBtn';
    button.innerHTML = '📧';
    button.title = 'Configuración de Email';
    button.style.cssText = `
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
    
    button.addEventListener('click', showEmailConfigModal);
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.background = '#034075';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.background = '#022859';
    });
    
    document.body.appendChild(button);
}

/**
 * Muestra modal de configuración de email
 */
function showEmailConfigModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const currentProvider = EMAIL_PROVIDERS[EMAIL_CONFIG.currentProvider];
    const stats = emailSystem.statistics;
    const successRate = stats.totalSent > 0 ? Math.round((stats.successCount / stats.totalSent) * 100) : 0;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #022859;">📧 Sistema de Email</h3>
                <button onclick="this.closest('.auth-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖️</button>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0;">📊 Estado Actual</h4>
                <p style="margin: 5px 0;"><strong>Proveedor:</strong> ${currentProvider.name}</p>
                <p style="margin: 5px 0;"><strong>Estado:</strong> ${emailSystem.initialized ? '🟢 Conectado' : '🔴 Desconectado'}</p>
                <p style="margin: 5px 0;"><strong>Emails Enviados:</strong> ${stats.totalSent}</p>
                <p style="margin: 5px 0;"><strong>Tasa de Éxito:</strong> ${successRate}%</p>
            </div>
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0;">⚙️ Configuración EmailJS</h4>
                <p style="font-size: 14px; margin-bottom: 15px;">Para configurar EmailJS:</p>
                <ol style="font-size: 14px; padding-left: 20px;">
                    <li>Crear cuenta en <a href="https://emailjs.com" target="_blank">emailjs.com</a></li>
                    <li>Configurar servicio de email (Gmail, Outlook, etc.)</li>
                    <li>Crear template de email</li>
                    <li>Obtener Service ID, Template ID y Public Key</li>
                    <li>Configurar a continuación:</li>
                </ol>
                
                <form id="emailConfigForm" style="margin-top: 15px;">
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 13px;">Service ID:</label>
                        <input type="text" id="serviceId" value="${currentProvider.config.serviceId}" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 13px;">Template ID:</label>
                        <input type="text" id="templateId" value="${currentProvider.config.templateId}" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-size: 13px;">Public Key:</label>
                        <input type="text" id="publicKey" value="${currentProvider.config.publicKey}" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
                    </div>
                </form>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="saveEmailConfig()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; flex: 1;">
                    💾 Guardar Config
                </button>
                <button onclick="testEmailSystem()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; flex: 1;">
                    🧪 Probar
                </button>
                <button onclick="showEmailHistory()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; flex: 1;">
                    📋 Historial
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Guarda configuración de email
 */
function saveEmailConfig() {
    try {
        const serviceId = document.getElementById('serviceId')?.value;
        const templateId = document.getElementById('templateId')?.value;
        const publicKey = document.getElementById('publicKey')?.value;
        
        if (!serviceId || !templateId || !publicKey) {
            showNotification('❌ Complete todos los campos', 'error');
            return;
        }
        
        // Actualizar configuración
        EMAIL_PROVIDERS.emailjs.config.serviceId = serviceId;
        EMAIL_PROVIDERS.emailjs.config.templateId = templateId;
        EMAIL_PROVIDERS.emailjs.config.publicKey = publicKey;
        
        // Guardar en localStorage
        localStorage.setItem('email_config', JSON.stringify({
            currentProvider: EMAIL_CONFIG.currentProvider,
            providers: EMAIL_PROVIDERS
        }));
        
        // Reinicializar sistema
        initializeEmailSystem();
        
        showNotification('✅ Configuración guardada y sistema reinicializado', 'success');
        
        // Cerrar modal
        document.querySelector('.auth-modal')?.remove();
        
    } catch (error) {
        showNotification('❌ Error guardando configuración: ' + error.message, 'error');
    }
}

/**
 * Prueba el sistema de email
 */
async function testEmailSystem() {
    try {
        const testEmail = prompt('Ingrese email para prueba de envío:');
        if (!testEmail) return;
        
        if (!isValidEmail(testEmail)) {
            showNotification('❌ Email inválido', 'error');
            return;
        }
        
        showNotification('🧪 Enviando email de prueba...', 'info');
        
        // Crear PDF de prueba simple
        const testPdfBlob = new Blob(['%PDF-1.4\n1 0 obj<</Type/Page>>endobj\nEsto es un PDF de prueba de HIGH TEST S.A.S'], 
                                   { type: 'application/pdf' });
        
        const emailData = {
            to: testEmail,
            subject: '🧪 Prueba de Email - HIGH TEST S.A.S',
            htmlBody: `
                <h2>🧪 Email de Prueba</h2>
                <p>Este es un email de prueba del sistema de HIGH TEST S.A.S.</p>
                <p><strong>Si recibe este mensaje, la configuración está funcionando correctamente.</strong></p>
                <p><em>Enviado el: ${new Date().toLocaleString()}</em></p>
            `,
            pdfBlob: testPdfBlob,
            fileName: 'prueba_hightest.pdf',
            type: 'test'
        };
        
        const result = await sendEmailWithPDF(emailData);
        
        if (result.success) {
            showNotification('✅ Email de prueba enviado exitosamente', 'success');
        }
        
    } catch (error) {
        showNotification('❌ Error en prueba: ' + error.message, 'error');
    }
}

/**
 * Muestra historial de emails
 */
function showEmailHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('email_history') || '[]');
        
        if (history.length === 0) {
            showNotification('📋 No hay emails en el historial', 'info');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        let historyHTML = '';
        history.slice(-20).reverse().forEach(email => {
            const statusIcon = email.status === 'success' ? '✅' : '❌';
            const date = new Date(email.timestamp).toLocaleString();
            
            historyHTML += `
                <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; background: ${email.status === 'success' ? '#f8f9fa' : '#ffebee'};">
                    <div style="font-weight: bold;">${statusIcon} ${email.subject}</div>
                    <div style="font-size: 12px; color: #666;">📧 Para: ${email.to}</div>
                    <div style="font-size: 12px; color: #666;">⏰ ${date}</div>
                    ${email.error ? `<div style="color: red; font-size: 12px;">❌ ${email.error}</div>` : ''}
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #022859;">📋 Historial de Emails</h3>
                    <button onclick="this.closest('.auth-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖️</button>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto;">
                    ${historyHTML}
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button onclick="clearEmailHistory(); this.closest('.auth-modal').remove();" 
                            style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        🗑️ Limpiar Historial
                    </button>
                    <button onclick="this.closest('.auth-modal').remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; flex: 1;">
                        ❌ Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        showNotification('❌ Error cargando historial: ' + error.message, 'error');
    }
}

/**
 * Limpia el historial de emails
 */
function clearEmailHistory() {
    if (confirm('¿Está seguro de que desea limpiar todo el historial de emails?')) {
        localStorage.removeItem('email_history');
        emailSystem.statistics = {
            totalSent: 0,
            successCount: 0,
            errorCount: 0,
            lastSuccess: null,
            lastError: null
        };
        localStorage.setItem('email_statistics', JSON.stringify(emailSystem.statistics));
        showNotification('🗑️ Historial limpiado', 'info');
    }
}

// =======================================================
// INICIALIZACIÓN Y EXPORTACIÓN
// =======================================================

/**
 * Inicializa el sistema cuando se carga la página
 */
function initEmailOnLoad() {
    loadEmailConfiguration().then(() => {
        setTimeout(() => {
            initializeEmailSystem();
        }, 1000);
    });
    
    if (typeof hasRole === 'function' && hasRole('administrador')) {
        setTimeout(createEmailFloatingButton, 2000);
    }
}

// Exponer funciones globales
window.sendRecepcionPDF = sendRecepcionPDF;
window.sendCompletePDF = sendCompletePDF;
window.sendEmailWithPDF = sendEmailWithPDF;
window.initializeEmailSystem = initializeEmailSystem;
window.saveEmailConfig = saveEmailConfig;
window.testEmailSystem = testEmailSystem;
window.showEmailHistory = showEmailHistory;
window.clearEmailHistory = clearEmailHistory;
window.showEmailConfigModal = showEmailConfigModal;

// Inicializar cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailOnLoad);
} else {
    initEmailOnLoad();
}

console.log('📧 Sistema de Email Avanzado v2.0 cargado - HIGH TEST S.A.S');
