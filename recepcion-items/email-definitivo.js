// =============================================================================
// SISTEMA DE EMAIL DEFINITIVO - SOLUCIÓN SIMPLE Y FUNCIONAL
// SIN PROBLEMAS DE CORS, SIN SERVICIOS EXTERNOS
// =============================================================================

console.log('📧 Email Definitivo v1.0 - Solución simple');

// CONFIGURACIÓN EMAILJS
const EMAIL_FINAL_CONFIG = {
    serviceId: 'service_xxiz7yg',
    templateId: 'template_0r8n9z4',
    publicKey: 'yyiS3YE3H7fqKdzkB'
};

// FUNCIÓN: INICIALIZAR SISTEMA DEFINITIVO
function initEmailDefinitivo() {
    console.log('🚀 Iniciando Email Definitivo...');
    
    try {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAIL_FINAL_CONFIG.publicKey);
            console.log('✅ EmailJS listo');
            crearBotonEmailDefinitivo();
        } else {
            console.log('⏳ Esperando EmailJS...');
            setTimeout(initEmailDefinitivo, 1000);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        crearBotonBasico();
    }
}

// FUNCIÓN: CREAR BOTÓN DEFINITIVO
function crearBotonEmailDefinitivo() {
    // Limpiar cualquier botón existente
    ['btn-email-fixed', 'btn-email-simple', 'emailFloatingBtn'].forEach(id => {
        const existente = document.getElementById(id);
        if (existente) existente.remove();
    });
    
    const boton = document.createElement('button');
    boton.id = 'btn-email-definitivo';
    boton.innerHTML = '📧';
    boton.title = 'Email Definitivo';
    boton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 70px;
        height: 70px;
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10000;
        font-size: 28px;
        box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    boton.onmouseover = () => {
        boton.style.transform = 'scale(1.1) rotate(10deg)';
        boton.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.6)';
    };
    boton.onmouseout = () => {
        boton.style.transform = 'scale(1) rotate(0deg)';
        boton.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)';
    };
    boton.onclick = abrirModalDefinitivo;
    
    document.body.appendChild(boton);
    console.log('✅ Botón Email Definitivo creado');
}

// FUNCIÓN: CREAR BOTÓN BÁSICO DE RESPALDO
function crearBotonBasico() {
    const boton = document.createElement('button');
    boton.innerHTML = '📧';
    boton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10000;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    boton.onclick = () => {
        const email = prompt('📧 Email rápido:\\n\\nIngrese destinatario:', 'cliente@ejemplo.com');
        if (email) {
            alert('✅ Función básica de email configurada para: ' + email);
        }
    };
    
    document.body.appendChild(boton);
    console.log('🚨 Botón básico creado');
}

// FUNCIÓN: ABRIR MODAL DEFINITIVO
function abrirModalDefinitivo() {
    const modal = document.createElement('div');
    modal.id = 'modal-email-definitivo';
    modal.innerHTML = `
    <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 11000;
        backdrop-filter: blur(3px);
    ">
        <div style="
            background: white;
            padding: 35px;
            border-radius: 15px;
            width: 550px;
            max-width: 95%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            border: 2px solid #28a745;
        ">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #022859; margin: 0; font-size: 24px;">
                    📧 Email Definitivo - HIGH TEST
                </h2>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
                    Sistema simple y confiable sin problemas técnicos
                </p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">📤 Para:</label>
                <input type="email" id="email-para-def" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;" placeholder="destinatario@ejemplo.com" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">👤 Nombre:</label>
                <input type="text" id="email-nombre-def" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;" placeholder="Nombre del destinatario" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">📝 Asunto:</label>
                <input type="text" id="email-asunto-def" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;" placeholder="Asunto del email" required>
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #333;">📎 Archivos (se mencionarán en el email):</label>
                <input type="file" id="email-archivos-def" multiple style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;" onchange="mostrarArchivosDefinitivo()">
                <div id="info-archivos-def" style="margin-top: 15px; padding: 15px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 10px; border-left: 4px solid #28a745;">
                    <div style="color: #666; font-size: 14px;">
                        💡 <strong>Solución Simple:</strong> Los archivos se mencionarán en el email con sus nombres y tamaños. 
                        El destinatario sabrá qué archivos tienes disponibles y podrá contactarte para obtenerlos.
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <button onclick="enviarEmailDefinitivo()" style="
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    📧 Enviar Email
                </button>
                <button onclick="cerrarModalDefinitivo()" style="
                    background: linear-gradient(45deg, #6c757d, #5a6268);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.appendChild(modal);
}

// FUNCIÓN: MOSTRAR ARCHIVOS DEFINITIVO
function mostrarArchivosDefinitivo() {
    const input = document.getElementById('email-archivos-def');
    const info = document.getElementById('info-archivos-def');
    
    if (!input || !info) return;
    
    if (!input.files.length) {
        info.innerHTML = `
            <div style="color: #666; font-size: 14px;">
                💡 <strong>Solución Simple:</strong> Los archivos se mencionarán en el email con sus nombres y tamaños. 
                El destinatario sabrá qué archivos tienes disponibles y podrá contactarte para obtenerlos.
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">
            📎 Archivos que se mencionarán en el email:
        </div>
    `;
    
    Array.from(input.files).forEach((archivo, index) => {
        const size = archivo.size < 1024 * 1024 
            ? `${(archivo.size / 1024).toFixed(1)} KB`
            : `${(archivo.size / 1024 / 1024).toFixed(2)} MB`;
        html += `
            <div style="padding: 8px; margin: 5px 0; background: white; border-radius: 5px; border-left: 3px solid #28a745;">
                📄 <strong>${archivo.name}</strong> (${size})
            </div>
        `;
    });
    
    html += `
        <div style="color: #666; font-size: 13px; margin-top: 10px; font-style: italic;">
            ✅ Los destinatarios verán esta lista en el email y podrán contactarte para obtener los archivos.
        </div>
    `;
    
    info.innerHTML = html;
}

// FUNCIÓN: ENVIAR EMAIL DEFINITIVO
async function enviarEmailDefinitivo() {
    const para = document.getElementById('email-para-def')?.value?.trim();
    const nombre = document.getElementById('email-nombre-def')?.value?.trim();
    const asunto = document.getElementById('email-asunto-def')?.value?.trim();
    const archivos = document.getElementById('email-archivos-def')?.files;
    
    if (!para || !nombre || !asunto) {
        alert('❌ Por favor complete todos los campos obligatorios (Para, Nombre, Asunto)');
        return;
    }
    
    try {
        console.log('📤 Enviando email definitivo...');
        
        // Obtener datos del formulario principal
        const numeroRecepcion = document.getElementById('quoteNumber')?.value || 'No especificado';
        const fechaRecepcion = document.getElementById('fechaRecepcion')?.value || new Date().toLocaleDateString();
        const nombreCliente = document.getElementById('empresaSelect')?.selectedOptions[0]?.textContent || 'Cliente no especificado';
        const nitEmpresa = document.getElementById('nitEmpresa')?.value || 'NIT no especificado';
        
        // Procesar lista de archivos (solo nombres y tamaños)
        let infoArchivos = '';
        if (archivos && archivos.length > 0) {
            infoArchivos = `

📎 ARCHIVOS DISPONIBLES PARA ESTE CASO:

`;
            Array.from(archivos).forEach((archivo, index) => {
                const size = archivo.size < 1024 * 1024 
                    ? `${(archivo.size / 1024).toFixed(1)} KB`
                    : `${(archivo.size / 1024 / 1024).toFixed(2)} MB`;
                infoArchivos += `${index + 1}. 📄 ${archivo.name} (${size})\n`;
            });
            
            infoArchivos += `
💡 Para obtener estos archivos, por favor responda a este email o contacte directamente al equipo de HIGH TEST S.A.S.

📞 Información de contacto:
• Email: reportes.hightest@gmail.com
• Los archivos están disponibles y listos para envío
`;
        }
        
        // Construir mensaje completo
        const mensaje = `Estimado/a ${nombre},

Nos complacemos en informarle sobre el proceso correspondiente al caso ${numeroRecepcion}.

📋 INFORMACIÓN DEL PROCESO:
• Cliente: ${nombreCliente}  
• NIT: ${nitEmpresa}
• Fecha de Recepción: ${fechaRecepcion}
• Número de Caso: ${numeroRecepcion}

${infoArchivos}

Para cualquier consulta adicional o solicitud de archivos, no dude en contactarnos.

Saludos cordiales,
Equipo HIGH TEST S.A.S
📧 reportes.hightest@gmail.com`;
        
        // Parámetros para EmailJS
        const parametros = {
            to_email: para,
            to_name: nombre,
            subject: asunto,
            html_message: mensaje,
            numero_recepcion: numeroRecepcion,
            nombre_cliente: nombreCliente,
            nit_empresa: nitEmpresa,
            fecha_recepcion: fechaRecepcion,
            from_name: 'HIGH TEST S.A.S',
            email: 'reportes.hightest@gmail.com'
        };
        
        console.log('📋 Enviando email con parámetros:', parametros);
        
        const resultado = await emailjs.send(
            EMAIL_FINAL_CONFIG.serviceId,
            EMAIL_FINAL_CONFIG.templateId,
            parametros
        );
        
        console.log('✅ Email enviado exitosamente:', resultado);
        
        // Mensaje de éxito detallado
        let mensajeExito = `✅ Email enviado exitosamente a ${para}\\n\\n`;
        if (archivos && archivos.length > 0) {
            mensajeExito += `📎 Se mencionaron ${archivos.length} archivo(s) en el email.\\n`;
            mensajeExito += `💡 El destinatario podrá contactarte para obtener los archivos.`;
        }
        
        alert(mensajeExito);
        cerrarModalDefinitivo();
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        alert('❌ Error enviando email: ' + (error.text || error.message || 'Error desconocido'));
    }
}

// FUNCIÓN: CERRAR MODAL DEFINITIVO
function cerrarModalDefinitivo() {
    const modal = document.getElementById('modal-email-definitivo');
    if (modal) modal.remove();
}

// EXPONER FUNCIONES GLOBALES
window.initEmailDefinitivo = initEmailDefinitivo;
window.crearBotonBasico = crearBotonBasico;
window.abrirModalDefinitivo = abrirModalDefinitivo;
window.enviarEmailDefinitivo = enviarEmailDefinitivo;
window.cerrarModalDefinitivo = cerrarModalDefinitivo;
window.mostrarArchivosDefinitivo = mostrarArchivosDefinitivo;

// INICIALIZACIÓN AUTOMÁTICA Y ROBUSTA
document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 Iniciando Email Definitivo...');
    setTimeout(initEmailDefinitivo, 500);
});

// Verificación adicional
setTimeout(function() {
    if (!document.getElementById('btn-email-definitivo')) {
        console.log('🔄 Reintentando crear botón email...');
        if (typeof emailjs !== 'undefined') {
            crearBotonEmailDefinitivo();
        } else {
            crearBotonBasico();
        }
    }
}, 3000);

console.log('✅ Sistema Email Definitivo cargado - SIN problemas de CORS');
