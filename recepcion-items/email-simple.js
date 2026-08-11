// =============================================================================
// SISTEMA DE EMAIL SIMPLE Y FUNCIONAL - HIGH TEST S.A.S
// OPCIÓN 1: Solo notificar archivos (100% confiable)
// =============================================================================

// CONFIGURACIÓN EMAILJS
const EMAIL_SIMPLE_CONFIG = {
    serviceId: 'service_xxiz7yg',
    templateId: 'template_0r8n9z4',
    publicKey: 'yyiS3YE3H7fqKdzkB'
};

// FUNCIÓN: INICIALIZAR EMAIL SIMPLE
function initEmailSimple() {
    try {
        // Verificar EmailJS
        if (typeof emailjs === 'undefined') {
            console.error('❌ EmailJS no disponible');
            setTimeout(initEmailSimple, 2000); // Reintentar en 2 segundos
            return;
        }
        
        emailjs.init(EMAIL_SIMPLE_CONFIG.publicKey);
        
        // Crear botón flotante
        crearBotonEmailSimple();
        
    } catch (error) {
        console.error('❌ Error inicializando email:', error);
        
        // Crear botón básico como respaldo
        setTimeout(crearBotonRespaldo, 1000);
    }
}

// FUNCIÓN: CREAR BOTÓN DE RESPALDO
function crearBotonRespaldo() {
    const boton = document.createElement('button');
    boton.id = 'btn-email-respaldo';
    boton.innerHTML = '📧';
    boton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: #3b28a7ff;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    boton.onclick = () => {
        alert('📧 Sistema de Email Simple\n\nFuncionalidad en preparación...\n\n¡El botón se está mostrando correctamente!');
    };
    
    document.body.appendChild(boton);
    console.log('✅ Botón de respaldo creado');
}

// FUNCIÓN: CREAR BOTÓN FLOTANTE
function crearBotonEmailSimple() {
    // Eliminar botón existente
    const existente = document.getElementById('btn-email-simple');
    if (existente) existente.remove();
    
    const boton = document.createElement('button');
    boton.id = 'btn-email-simple';
    boton.innerHTML = '📧 Email';
    boton.style.cssText = `
        
        bottom: 20px;
        left: 20px;
        width: 3px;
        height: 3px;
        background: #1c37cf;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        font-size: 1px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    boton.onmouseover = () => boton.style.transform = 'scale(1.1)';
    boton.onmouseout = () => boton.style.transform = 'scale(1)';
    boton.onclick = abrirModalEmailSimple;
    
    document.body.appendChild(boton);
}

// FUNCIÓN: ABRIR MODAL
function abrirModalEmailSimple() {
    const modal = document.createElement('div');
    modal.id = 'modal-email-simple';
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
                <input type="email" id="email-para-simple" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="destinatario@ejemplo.com" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre:</label>
                <input type="text" id="email-nombre-simple" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Nombre del destinatario" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Asunto:</label>
                <input type="text" id="email-asunto-simple" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Asunto del email" required>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Archivo(s) para compartir (se subirán al servidor local):</label>
                <input type="file" id="email-archivos-simple" multiple style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" onchange="actualizarInfoArchivos()">
                <div id="info-archivos-simple" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 14px;"></div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Método de compartir:</label>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <button type="button" id="btn-local" onclick="setShareMethod('local')" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px;">
                        🏠 Local
                    </button>
                    <button type="button" id="btn-proxy" onclick="setShareMethod('proxy')" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px;">
                        🔗 Proxy (Sin CORS)
                    </button>
                    <button type="button" id="btn-filestack" onclick="setShareMethod('filestack')" style="padding: 8px 16px; background: #7b68ee; color: white; border: none; border-radius: 5px;">
                        � FileStack
                    </button>
                    <button type="button" id="btn-0x0" onclick="setShareMethod('0x0')" style="padding: 8px 16px; background: #2c3e50; color: white; border: none; border-radius: 5px;">
                        🔗 0x0.st
                    </button>
                    <button type="button" id="btn-tmpfiles" onclick="setShareMethod('tmpfiles')" style="padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 5px;">
                        � TmpFiles
                    </button>
                </div>
                <div id="share-method-info" style="padding: 8px; background: #f8f9fa; border-radius: 5px; font-size: 13px;">
                    Selecciona cómo quieres compartir los archivos
                </div>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <button onclick="enviarEmailSimple()" style="background: #28a745; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    📧 Enviar
                </button>
                <button onclick="cerrarModalEmailSimple()" style="background: #6c757d; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.appendChild(modal);
}

// FUNCIÓN: ACTUALIZAR INFO DE ARCHIVOS
function actualizarInfoArchivos() {
    const input = document.getElementById('email-archivos-simple');
    const info = document.getElementById('info-archivos-simple');
    
    if (!input.files.length) {
        info.innerHTML = '<em>No hay archivos seleccionados</em>';
        return;
    }
    
    const archivos = Array.from(input.files);
    let html = '<strong>Archivos a subir al servidor y compartir por link:</strong><br><br>';
    
    archivos.forEach((archivo, index) => {
        const size = archivo.size < 1024 * 1024 
            ? `${(archivo.size / 1024).toFixed(1)} KB`
            : `${(archivo.size / 1024 / 1024).toFixed(2)} MB`;
            
        html += `📄 ${archivo.name} (${size})<br>`;
    });
    
    html += '<br><em>💡 Se generarán links de descarga temporales desde su servidor local.</em>';
    
    info.innerHTML = html;
}

// FUNCIÓN: SELECCIONAR MÉTODO DE COMPARTIR
function setShareMethod(method) {
    const info = document.getElementById('share-method-info');
    const buttons = ['btn-local', 'btn-proxy'];
    
    // Resetear estilos
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.opacity = '0.6';
    });
    
    // Activar botón seleccionado
    const activeBtn = document.getElementById(`btn-${method}`);
    if (activeBtn) activeBtn.style.opacity = '1';
    
    // Guardar selección (siempre funciona aunque el modal no exista)
    localStorage.setItem('EMAIL_SHARE_METHOD', method);
    
    // Actualizar info SOLO si el modal está abierto
    if (!info) return;
    
    switch(method) {
        case 'local':
            info.innerHTML = '🏠 <strong>Servidor Local:</strong> Los archivos se suben a tu servidor. Solo funcionan en tu red local.';
            break;
        case 'proxy':
            info.innerHTML = '🔗 <strong>Proxy Sin CORS:</strong> Tu servidor sube por ti a 0x0.st. Enlaces públicos válidos 365 días.';
            break;
    }
}

// FUNCIÓN: SUBIR A TRANSFER.SH
async function uploadToTransferSh(files) {
    const results = [];
    
    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('https://transfer.sh/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const url = await response.text();
                results.push({
                    name: file.name,
                    size: file.size,
                    url: url.trim(),
                    expires: '14 días'
                });
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            console.error(`Error subiendo ${file.name}:`, error);
            results.push({
                name: file.name,
                size: file.size,
                url: null,
                error: error.message
            });
        }
    }
    
    return results;
}

// FUNCIÓN: SUBIR A 0X0.ST
async function uploadTo0x0(files) {
    const results = [];
    
    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('https://0x0.st', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const url = await response.text();
                results.push({
                    name: file.name,
                    size: file.size,
                    url: url.trim(),
                    expires: '365 días'
                });
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            console.error(`Error subiendo ${file.name}:`, error);
            results.push({
                name: file.name,
                size: file.size,
                url: null,
                error: error.message
            });
        }
    }
    
    return results;
}

// FUNCIÓN: SUBIR A TMPFILES
async function uploadToTmpFiles(files) {
    const results = [];
    
    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('https://tmpfiles.org/api/v1/upload', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.data && data.data.url) {
                    results.push({
                        name: file.name,
                        size: file.size,
                        url: data.data.url,
                        expires: '30 días'
                    });
                } else {
                    throw new Error('Respuesta inválida del servidor');
                }
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            console.error(`Error subiendo ${file.name}:`, error);
            results.push({
                name: file.name,
                size: file.size,
                url: null,
                error: error.message
            });
        }
    }
    
    return results;
}

// FUNCIÓN: SUBIR A FILESTACK
async function uploadToFileStack(files) {
    const results = [];
    // Clave pública de FileStack (gratis hasta 5GB)
    const API_KEY = 'AzlX8nVlxSEOGOWGwzhQgz'; // Clave demo - reemplazar por tu clave
    
    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('fileUpload', file);
            
            const response = await fetch(`https://www.filestackapi.com/api/store/S3?key=${API_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                results.push({
                    name: file.name,
                    size: file.size,
                    url: result.url,
                    permanent: true
                });
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            console.error(`Error subiendo ${file.name}:`, error);
            results.push({
                name: file.name,
                size: file.size,
                url: null,
                error: error.message
            });
        }
    }
    
    return results;
}

// FUNCIÓN: EXTRAER INFORMACIÓN COMPLETA DEL FORMULARIO
function extraerInformacionCompleta() {
    const info = {};
    
    // Información básica
    info.numeroRecepcion = document.getElementById('quoteNumber')?.value || 'No especificado';
    info.fechaRecepcion = document.getElementById('fechaRecepcion')?.value || new Date().toLocaleDateString();
    info.empresaSelect = document.getElementById('empresaSelect')?.selectedOptions[0]?.textContent || 'No seleccionada';
    info.nitEmpresa = document.getElementById('nitEmpresa')?.value || 'No especificado';
    
    // Información del cliente/contacto
    info.nombreContacto = document.getElementById('nombreContacto')?.value || 'No especificado';
    info.telefonoContacto = document.getElementById('telefonoContacto')?.value || 'No especificado';
    info.emailContacto = document.getElementById('emailContacto')?.value || 'No especificado';
    info.cargoContacto = document.getElementById('cargoContacto')?.value || 'No especificado';
    
    // Información de muestras y ensayos
    info.tipoMuestra = document.getElementById('tipoMuestra')?.value || 'No especificado';
    info.descripcionMuestra = document.getElementById('descripcionMuestra')?.value || 'No especificado';
    info.cantidadMuestras = document.getElementById('cantidadMuestras')?.value || 'No especificado';
    info.estadoMuestra = document.getElementById('estadoMuestra')?.value || 'No especificado';
    
    // Ensayos seleccionados
    const ensayosAcreditados = [];
    const ensayosNoAcreditados = [];
    
    // Ensayos acreditados
    document.querySelectorAll('input[name="ensayosAcreditados"]:checked').forEach(checkbox => {
        ensayosAcreditados.push(checkbox.nextElementSibling?.textContent || checkbox.value);
    });
    
    // Ensayos no acreditados
    document.querySelectorAll('input[name="ensayosNoAcreditados"]:checked').forEach(checkbox => {
        ensayosNoAcreditados.push(checkbox.nextElementSibling?.textContent || checkbox.value);
    });
    
    info.ensayosAcreditados = ensayosAcreditados;
    info.ensayosNoAcreditados = ensayosNoAcreditados;
    
    // Información adicional
    info.observaciones = document.getElementById('observaciones')?.value || 'Ninguna';
    info.requiereCertificado = document.getElementById('requiereCertificado')?.checked ? 'Sí' : 'No';
    info.tipoInforme = document.querySelector('input[name="tipoInforme"]:checked')?.value || 'No especificado';
    info.fechaLimite = document.getElementById('fechaLimite')?.value || 'No especificada';
    
    // Información de facturación
    info.tipoFacturacion = document.querySelector('input[name="tipoFacturacion"]:checked')?.value || 'No especificado';
    info.ordenCompra = document.getElementById('ordenCompra')?.value || 'No especificada';
    
    return info;
}

// FUNCIÓN: GENERAR REPORTE COMPLETO EN TEXTO
function generarReporteCompleto(info) {
    let reporte = `
═══════════════════════════════════════════════════════════════
                    REPORTE COMPLETO DE RECEPCIÓN
                           HIGH TEST S.A.S
═══════════════════════════════════════════════════════════════

📋 INFORMACIÓN GENERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Número de Recepción: ${info.numeroRecepcion}
• Fecha de Recepción: ${info.fechaRecepcion}
• Empresa/Cliente: ${info.empresaSelect}
• NIT: ${info.nitEmpresa}

👤 INFORMACIÓN DE CONTACTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nombre del Contacto: ${info.nombreContacto}
• Cargo: ${info.cargoContacto}
• Teléfono: ${info.telefonoContacto}
• Email: ${info.emailContacto}

🔬 INFORMACIÓN DE LA MUESTRA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tipo de Muestra: ${info.tipoMuestra}
• Descripción: ${info.descripcionMuestra}
• Cantidad: ${info.cantidadMuestras}
• Estado de la Muestra: ${info.estadoMuestra}

🧪 ENSAYOS SOLICITADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    if (info.ensayosAcreditados.length > 0) {
        reporte += `
✅ ENSAYOS ACREDITADOS:
`;
        info.ensayosAcreditados.forEach((ensayo, index) => {
            reporte += `   ${index + 1}. ${ensayo}\n`;
        });
    }

    if (info.ensayosNoAcreditados.length > 0) {
        reporte += `
⚪ ENSAYOS NO ACREDITADOS:
`;
        info.ensayosNoAcreditados.forEach((ensayo, index) => {
            reporte += `   ${index + 1}. ${ensayo}\n`;
        });
    }

    if (info.ensayosAcreditados.length === 0 && info.ensayosNoAcreditados.length === 0) {
        reporte += `
❌ No se seleccionaron ensayos específicos.
`;
    }

    reporte += `
📄 INFORMACIÓN DEL INFORME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Requiere Certificado: ${info.requiereCertificado}
• Tipo de Informe: ${info.tipoInforme}
• Fecha Límite: ${info.fechaLimite}

💰 INFORMACIÓN DE FACTURACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tipo de Facturación: ${info.tipoFacturacion}
• Orden de Compra: ${info.ordenCompra}

📝 OBSERVACIONES ADICIONALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${info.observaciones}

═══════════════════════════════════════════════════════════════
                    FIN DEL REPORTE
        Generado automáticamente el ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════
`;

    return reporte;
}

// FUNCIÓN: ENVIAR EMAIL
async function enviarEmailSimple() {
    const para = document.getElementById('email-para-simple').value.trim();
    const nombre = document.getElementById('email-nombre-simple').value.trim();
    const asunto = document.getElementById('email-asunto-simple').value.trim();
    
    if (!para || !nombre || !asunto) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }
    
    try {
        // Extraer TODA la información del formulario
        const infoCompleta = extraerInformacionCompleta();
        
        // Generar el reporte completo
        const reporteCompleto = generarReporteCompleto(infoCompleta);
        
        // Crear mensaje profesional con toda la información
        const mensaje = `Estimado/a ${nombre},

Nos complacemos en enviarle la información completa correspondiente al caso ${infoCompleta.numeroRecepcion}.

${reporteCompleto}

Este email contiene toda la información de recepción de muestras y ensayos solicitados. No es necesario adjuntar archivos adicionales ya que toda la información relevante está incluida en este mensaje.

Para cualquier consulta adicional, no dude en contactarnos.

Atentamente,
Equipo HIGH TEST S.A.S
reportes.hightest@gmail.com`;
        
        // Parámetros para EmailJS con información completa
        const parametros = {
            to_email: para,
            to_name: nombre,
            subject: asunto,
            html_message: mensaje,
            numero_recepcion: infoCompleta.numeroRecepcion,
            nombre_cliente: infoCompleta.empresaSelect,
            nit_empresa: infoCompleta.nitEmpresa,
            fecha_recepcion: infoCompleta.fechaRecepcion,
            tipo_muestra: infoCompleta.tipoMuestra,
            descripcion_muestra: infoCompleta.descripcionMuestra,
            ensayos_acreditados: infoCompleta.ensayosAcreditados.join(', ') || 'Ninguno',
            ensayos_no_acreditados: infoCompleta.ensayosNoAcreditados.join(', ') || 'Ninguno',
            observaciones: infoCompleta.observaciones,
            from_name: 'HIGH TEST S.A.S',
            email: 'reportes.hightest@gmail.com'
        };
        
        const resultado = await emailjs.send(
            EMAIL_SIMPLE_CONFIG.serviceId,
            EMAIL_SIMPLE_CONFIG.templateId,
            parametros
        );
        
        alert(`✅ Email enviado exitosamente a ${para}\n\n📋 Se incluyó toda la información del formulario de recepción en el cuerpo del mensaje.\n\n✨ ¡No se requieren archivos adjuntos!`);
        cerrarModalEmailSimple();
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        alert('❌ Error enviando email: ' + (error.text || error.message));
    }
}

// FUNCIÓN: CERRAR MODAL
function cerrarModalEmailSimple() {
    const modal = document.getElementById('modal-email-simple');
    if (modal) modal.remove();
}

// INICIALIZAR INMEDIATAMENTE
// EXPONER FUNCIONES GLOBALES
window.initEmailSimple = initEmailSimple;
window.crearBotonRespaldo = crearBotonRespaldo;
window.abrirModalEmailSimple = abrirModalEmailSimple;
window.enviarEmailSimple = enviarEmailSimple;
window.cerrarModalEmailSimple = cerrarModalEmailSimple;
window.actualizarInfoArchivos = actualizarInfoArchivos;
window.setShareMethod = setShareMethod;

// INICIALIZACIÓN MÚLTIPLE (para asegurar que funcione)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initEmailSimple, 500);
    
    // Inicializar método de compartir por defecto
    setTimeout(() => {
        const savedMethod = localStorage.getItem('EMAIL_SHARE_METHOD') || 'proxy';
        if (typeof setShareMethod === 'function') {
            setShareMethod(savedMethod);
        }
    }, 1000);
});

// También inicializar después de un tiempo como respaldo
setTimeout(function() {
    if (!document.getElementById('btn-email-simple') && !document.getElementById('btn-email-respaldo')) {
        crearBotonRespaldo();
    }
}, 3000);

