// =============================================================================
// SISTEMA DE EMAIL ARREGLADO Y FUNCIONAL - HIGH TEST S.A.S
// Versión simplificada sin errores
// =============================================================================

console.log('📧 Email Fixed v1.0 - Sistema corregido');

// CONFIGURACIÓN EMAILJS
const EMAIL_CONFIG = {
    serviceId: 'service_xxiz7yg',
    templateId: 'template_0r8n9z4',
    publicKey: 'yyiS3YE3H7fqKdzkB'
};

// FUNCIÓN: INICIALIZAR SISTEMA
function initEmailFixed() {
    console.log('🚀 Iniciando Email Fixed...');
    
    try {
        // Verificar EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAIL_CONFIG.publicKey);
            console.log('✅ EmailJS inicializado');
            crearBotonEmail();
        } else {
            console.log('⏳ Esperando EmailJS...');
            setTimeout(initEmailFixed, 2000);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        crearBotonRespaldo();
    }
}

// FUNCIÓN: CREAR BOTÓN FLOTANTE
function crearBotonEmail() {
    // Eliminar botón existente
    const existente = document.getElementById('btn-email-fixed');
    if (existente) existente.remove();
    
    const boton = document.createElement('button');
    boton.id = 'btn-email-fixed';
    boton.innerHTML = '📧';
    boton.title = 'Enviar Email';
    boton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: transform 0.3s ease;
    `;
    
    boton.onmouseover = () => boton.style.transform = 'scale(1.1)';
    boton.onmouseout = () => boton.style.transform = 'scale(1)';
    boton.onclick = abrirModal;
    
    document.body.appendChild(boton);
    console.log('✅ Botón email creado');
}

// FUNCIÓN: CREAR BOTÓN DE RESPALDO
function crearBotonRespaldo() {
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
        z-index: 9999;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    boton.onclick = () => alert('📧 Sistema email en desarrollo\n\nFuncionalidad básica disponible.');
    document.body.appendChild(boton);
    console.log('🚨 Botón respaldo creado');
}

// FUNCIÓN: ABRIR MODAL
function abrirModal() {
    const modal = document.createElement('div');
    modal.id = 'modal-email-fixed';
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
        z-index: 10000;
    ">
        <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            width: 500px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <h2 style="color: #022859; margin-bottom: 25px; text-align: center;">
                📧 Enviar Email - HIGH TEST
            </h2>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Para:</label>
                <input type="email" id="email-para" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="destinatario@ejemplo.com" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre:</label>
                <input type="text" id="email-nombre" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Nombre del destinatario" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Asunto:</label>
                <input type="text" id="email-asunto" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Asunto del email" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Archivos (opcional):</label>
                <input type="file" id="email-archivos" multiple style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" onchange="mostrarArchivos()">
                <div id="info-archivos" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px;">
                    <em>No hay archivos seleccionados</em>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Método de compartir:</label>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <button type="button" id="btn-local-fixed" onclick="seleccionarMetodo('local')" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px; opacity: 0.6;">
                        🏠 Local
                    </button>
                    <button type="button" id="btn-proxy-fixed" onclick="seleccionarMetodo('proxy')" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; opacity: 1;">
                        🔗 Proxy
                    </button>
                </div>
                <div id="info-metodo" style="padding: 8px; background: #e3f2fd; border-radius: 5px; font-size: 13px;">
                    🔗 <strong>Proxy Sin CORS:</strong> Tu servidor sube por ti a 0x0.st. Enlaces públicos válidos 365 días.
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <button onclick="enviarEmail()" style="background: #28a745; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    📧 Enviar
                </button>
                <button onclick="cerrarModal()" style="background: #6c757d; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.appendChild(modal);
}

// FUNCIÓN: MOSTRAR ARCHIVOS SELECCIONADOS
function mostrarArchivos() {
    const input = document.getElementById('email-archivos');
    const info = document.getElementById('info-archivos');
    
    if (!input || !info) return;
    
    if (!input.files.length) {
        info.innerHTML = '<em>No hay archivos seleccionados</em>';
        return;
    }
    
    let html = '<strong>Archivos seleccionados:</strong><br><br>';
    Array.from(input.files).forEach((archivo, index) => {
        const size = archivo.size < 1024 * 1024 
            ? `${(archivo.size / 1024).toFixed(1)} KB`
            : `${(archivo.size / 1024 / 1024).toFixed(2)} MB`;
        html += `📄 ${archivo.name} (${size})<br>`;
    });
    
    info.innerHTML = html;
}

// FUNCIÓN: SELECCIONAR MÉTODO
function seleccionarMetodo(metodo) {
    console.log('🔧 Método seleccionado:', metodo);
    
    // Resetear botones
    const btnLocal = document.getElementById('btn-local-fixed');
    const btnProxy = document.getElementById('btn-proxy-fixed');
    const info = document.getElementById('info-metodo');
    
    if (btnLocal) btnLocal.style.opacity = '0.6';
    if (btnProxy) btnProxy.style.opacity = '0.6';
    
    // Activar seleccionado
    if (metodo === 'local' && btnLocal) {
        btnLocal.style.opacity = '1';
        if (info) info.innerHTML = '🏠 <strong>Servidor Local:</strong> Los archivos se suben a tu servidor. Solo funcionan en tu red local.';
    } else if (metodo === 'proxy' && btnProxy) {
        btnProxy.style.opacity = '1';
        if (info) info.innerHTML = '🔗 <strong>Proxy Sin CORS:</strong> Tu servidor sube por ti a 0x0.st. Enlaces públicos válidos 365 días.';
    }
    
    // Guardar selección
    localStorage.setItem('EMAIL_METHOD_FIXED', metodo);
}

// FUNCIÓN: ENVIAR EMAIL
async function enviarEmail() {
    const para = document.getElementById('email-para')?.value?.trim();
    const nombre = document.getElementById('email-nombre')?.value?.trim();
    const asunto = document.getElementById('email-asunto')?.value?.trim();
    const archivos = document.getElementById('email-archivos')?.files;
    
    if (!para || !nombre || !asunto) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }
    
    try {
        console.log('📤 Enviando email...');
        
        // Obtener datos del formulario principal
        const numeroRecepcion = document.getElementById('quoteNumber')?.value || 'No especificado';
        const fechaRecepcion = document.getElementById('fechaRecepcion')?.value || new Date().toLocaleDateString();
        const nombreCliente = document.getElementById('empresaSelect')?.selectedOptions[0]?.textContent || 'Cliente no especificado';
        const nitEmpresa = document.getElementById('nitEmpresa')?.value || 'NIT no especificado';
        
        // Procesar archivos
        let infoArchivos = '';
        if (archivos && archivos.length > 0) {
            const metodo = localStorage.getItem('EMAIL_METHOD_FIXED') || 'proxy';
            
            if (metodo === 'proxy') {
                try {
                    console.log('📤 Subiendo via proxy...');
                    const formData = new FormData();
                    Array.from(archivos).forEach(f => formData.append('files', f));
                    
                    const response = await fetch('http://localhost:3000/api/proxy-upload', {
                        method: 'POST',
                        body: formData,
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.files && data.files.length > 0) {
                            infoArchivos = `

📎 ARCHIVOS DISPONIBLES PARA DESCARGA:

`;
                            data.files.forEach((f, idx) => {
                                if (f.url) {
                                    const size = f.size < 1024 * 1024 
                                        ? `${(f.size / 1024).toFixed(1)} KB`
                                        : `${(f.size / 1024 / 1024).toFixed(2)} MB`;
                                    infoArchivos += `${idx + 1}. 📄 ${f.originalName} (${size}) - válido 365 días
   → ${f.url}

`;
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Error en proxy upload:', error);
                    infoArchivos = `

📎 ARCHIVOS MENCIONADOS (no se pudieron subir):

`;
                    Array.from(archivos).forEach((archivo, idx) => {
                        infoArchivos += `${idx + 1}. 📄 ${archivo.name}
`;
                    });
                    infoArchivos += `
💡 Para obtener estos archivos, contacte al remitente.
`;
                }
            }
        }
        
        // Construir mensaje
        const mensaje = `Estimado/a ${nombre},

Nos complacemos en informarle sobre el proceso correspondiente al caso ${numeroRecepcion}.

📋 INFORMACIÓN DEL PROCESO:
• Cliente: ${nombreCliente}  
• NIT: ${nitEmpresa}
• Fecha: ${fechaRecepcion}
• Caso: ${numeroRecepcion}

${infoArchivos}

Para cualquier consulta adicional, no dude en contactarnos.

Saludos cordiales,
Equipo HIGH TEST S.A.S`;
        
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
        
        console.log('📋 Enviando con parámetros:', parametros);
        
        const resultado = await emailjs.send(
            EMAIL_CONFIG.serviceId,
            EMAIL_CONFIG.templateId,
            parametros
        );
        
        console.log('✅ Email enviado:', resultado);
        alert(`✅ Email enviado exitosamente a ${para}`);
        cerrarModal();
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        alert('❌ Error enviando email: ' + (error.text || error.message));
    }
}

// FUNCIÓN: CERRAR MODAL
function cerrarModal() {
    const modal = document.getElementById('modal-email-fixed');
    if (modal) modal.remove();
}

// EXPONER FUNCIONES GLOBALES
window.initEmailFixed = initEmailFixed;
window.crearBotonRespaldo = crearBotonRespaldo;
window.abrirModal = abrirModal;
window.enviarEmail = enviarEmail;
window.cerrarModal = cerrarModal;
window.mostrarArchivos = mostrarArchivos;
window.seleccionarMetodo = seleccionarMetodo;

// INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 DOM listo, iniciando email fixed...');
    setTimeout(initEmailFixed, 1000);
});

// Respaldo adicional
setTimeout(function() {
    if (!document.getElementById('btn-email-fixed')) {
        console.log('🚨 Creando botón de emergencia...');
        crearBotonRespaldo();
    }
}, 4000);

console.log('✅ Sistema Email Fixed cargado');
