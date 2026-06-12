// =============================================================================
// SISTEMA DE EMAIL CON INFORMACIÓN COMPLETA - HIGH TEST S.A.S
// Versión mejorada que envía toda la información del formulario en el email
// =============================================================================

console.log('📧 Email con Información Completa v2.0 - Sin archivos adjuntos');

// CONFIGURACIÓN EMAILJS
const EMAIL_COMPLETO_CONFIG = {
    serviceId: 'service_xxiz7yg',
    templateId: 'template_0r8n9z4',
    publicKey: 'yyiS3YE3H7fqKdzkB'
};

// FUNCIÓN: INICIALIZAR EMAIL COMPLETO
function initEmailCompleto() {
    console.log('🚀 Iniciando Email Completo...');
    
    try {
        // Verificar EmailJS
        if (typeof emailjs === 'undefined') {
            console.error('❌ EmailJS no disponible');
            setTimeout(initEmailCompleto, 2000);
            return;
        }
        
        emailjs.init(EMAIL_COMPLETO_CONFIG.publicKey);
        console.log('✅ EmailJS inicializado correctamente');
        
        // Crear botón flotante
        crearBotonEmailCompleto();
        
    } catch (error) {
        console.error('❌ Error inicializando email:', error);
        setTimeout(crearBotonRespaldo, 1000);
    }
}

// FUNCIÓN: CREAR BOTÓN FLOTANTE
function crearBotonEmailCompleto() {
    // Eliminar botón existente
    const existente = document.getElementById('btn-email-completo');
    if (existente) existente.remove();

    // Contenedor del botón flotante y menú
    const wrapper = document.createElement('div');
    wrapper.id = 'btn-email-completo';
    wrapper.style.cssText = `
        position: fixed;
        top: 60px;
        right: 16px;
        z-index: 9999;
    `;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.setAttribute('aria-haspopup', 'true');
    boton.setAttribute('aria-expanded', 'false');
    boton.title = 'Opciones de envío';
    boton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    boton.style.cssText = `
        width: 48px;
        height: 48px;
        background: #1c37cf;
        color: #fff;
        border: none;
        border-radius: 24px;
        cursor: pointer;
        font-size: 18px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        transition: transform .2s ease;
    `;
    boton.onmouseover = () => boton.style.transform = 'scale(1.05)';
    boton.onmouseout = () => boton.style.transform = 'scale(1)';

    // Menú desplegable
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: absolute;
        top: 56px;
        right: 0;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(0,0,0,.15);
        min-width: 240px;
        padding: 8px;
        display: none;
    `;

    const makeItem = (icon, text, handler, color) => {
        const a = document.createElement('button');
        a.type = 'button';
        a.innerHTML = `${icon} ${text}`;
        a.style.cssText = `
            display: block;
            width: 100%;
            text-align: left;
            padding: 10px 12px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            color: #111827;
            font-size: 14px;
        `;
        a.onmouseover = () => { a.style.background = '#f3f4f6'; };
        a.onmouseout = () => { a.style.background = 'transparent'; };
        a.onclick = () => { menu.style.display = 'none'; handler(); };
        if (color) a.style.color = color;
        return a;
    };

    // Solicita email y ejecuta envío
    const askEmailAndSend = (tipo) => {
        let sugerido = '';
        try {
            const d = typeof collectFormData === 'function' ? collectFormData() : {};
            sugerido = d?.clienteEmail || '';
        } catch {}
        const correo = prompt('Ingrese el correo destino', sugerido || '');
        if (!correo) { if (window.showNotification) showNotification('Envío cancelado: sin correo.', 'warning'); return; }
        if (/^\S+@\S+\.\S+$/.test(correo) === false) { alert('Correo inválido'); return; }
        if (tipo === 'recepcion' && typeof openComposeRecepcion === 'function') {
            openComposeRecepcion(correo);
        } else if (tipo === 'entrega' && typeof openComposeEntregaTotal === 'function') {
            openComposeEntregaTotal(correo);
        } else {
            abrirModalEmailCompleto();
        }
    };

    // Solicita número y abre WhatsApp
    const askWhatsAppAndSend = () => {
        let sugerido = '';
        try {
            const sel = document.getElementById('empresaSelect');
            if (sel?.selectedOptions?.[0]) sugerido = sel.selectedOptions[0].getAttribute('data-phone') || '';
        } catch {}
        const numero = prompt('Ingrese el número de WhatsApp (solo dígitos, con indicativo si aplica)', sugerido || '');
        if (!numero) { if (window.showNotification) showNotification('Envío por WhatsApp cancelado: sin número.', 'warning'); return; }
        if (typeof openWhatsApp === 'function') openWhatsApp(numero); else abrirModalEmailCompleto();
    };

    menu.appendChild(makeItem('📥', 'Enviar Recepción (Email)', () => askEmailAndSend('recepcion')));
    menu.appendChild(makeItem('📦', 'Enviar Entrega Total (Email)', () => askEmailAndSend('entrega')));
    menu.appendChild(makeItem('🟢', 'Enviar por WhatsApp', () => askWhatsAppAndSend(), '#16a34a'));

    boton.addEventListener('click', () => {
        const visible = menu.style.display === 'block';
        menu.style.display = visible ? 'none' : 'block';
        boton.setAttribute('aria-expanded', String(!visible));
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) menu.style.display = 'none';
    });

    wrapper.appendChild(boton);
    wrapper.appendChild(menu);
    document.body.appendChild(wrapper);

    // Botón flotante adicional (restaurar) en esquina inferior izquierda
    if (!document.getElementById('btn-email-alterno')) {
        const legacy = document.createElement('button');
        legacy.id = 'btn-email-alterno';
        legacy.type = 'button';
        legacy.title = 'Envío alterno';
        legacy.innerHTML = '📧';
        legacy.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 52px; height: 52px;
            background: #3b82f6; color:#fff; border:none; border-radius:26px;
            box-shadow: 0 6px 16px rgba(0,0,0,.25);
            z-index: 9998; cursor: pointer; font-size: 20px;
        `;
        legacy.onclick = () => {
            // Abre el modal completo como alternativa clásica
            if (typeof abrirModalEmailCompleto === 'function') abrirModalEmailCompleto();
        };
        document.body.appendChild(legacy);
    }

    console.log('✅ Botón flotante de envío creado');
}

// FUNCIÓN: CREAR BOTÓN DE RESPALDO
function crearBotonRespaldo() {
    console.log('🔄 Creando botón de respaldo...');
    
    const boton = document.createElement('button');
    boton.id = 'btn-email-respaldo';
    boton.innerHTML = '📧';
    boton.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: #3b28a7;
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
        if (typeof abrirModalEmailCompleto === 'function') {
            abrirModalEmailCompleto();
        } else {
            alert('📧 Sistema de Email Completo\n\n✅ El botón se está mostrando correctamente!\n\n📋 Este sistema envía toda la información del formulario directamente en el email, sin necesidad de archivos adjuntos.');
        }
    };
    
    document.body.appendChild(boton);
    console.log('✅ Botón de respaldo creado');
}

// FUNCIÓN: EXTRAER INFORMACIÓN USANDO LA MISMA LÓGICA QUE LA VISTA PREVIA
function extraerInformacionVistaPrevia(soloRecepcion = false) {
    console.log('📋 Extrayendo información usando lógica de vista previa...');
    
    try {
        // Usar la misma función que usa la vista previa
        if (typeof collectFormData !== 'function') {
            console.error('La función collectFormData no está disponible');
            throw new Error('collectFormData no disponible');
        }

        const formData = collectFormData();
        console.log('✅ Datos obtenidos de collectFormData:', formData);
        
        // Si es solo recepción, filtrar información relevante
        if (soloRecepcion) {
            console.log('📋 Filtrando solo información de recepción...');
            const datosRecepcion = {
                // Información básica de recepción
                cotizacion: formData.cotizacion,
                fechaRecepcion: formData.fechaRecepcion,
                cliente: formData.cliente,
                nitEmpresa: formData.nitEmpresa,
                facturar: formData.facturar,
                informeNombre: formData.informeNombre,
                facturarNombre: formData.facturarNombre,
                
                // Solo elementos recibidos (quantity)
                items: formData.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity, // Solo cantidades recibidas
                    type: item.type,
                    observaciones: item.observaciones || '',
                    category: item.category
                })).filter(item => item.quantity > 0), // Solo items con cantidad recibida
                
                // Lavado básico
                lavado: formData.lavado,
                elementosLavados: formData.elementosLavados,
                responsableLavado: formData.responsableLavado,
                
                // Información del cliente de recepción
                clienteRecepcionNombre: formData.clienteRecepcionNombre,
                clienteRecepcionCedula: formData.clienteRecepcionCedula,
                clienteRecepcionCargo: formData.clienteRecepcionCargo,
                fechaFirmaRecepcion: formData.fechaFirmaRecepcion,
                
                // Representante HIGH TEST recepción
                highTestRecepcionNombre: formData.highTestRecepcionNombre,
                highTestRecepcionCargo: formData.highTestRecepcionCargo,
                
                // Correos
                clienteEmail: formData.clienteEmail,
                empresaEmail: formData.empresaEmail,
                copiaEmail: formData.copiaEmail,
                
                // Observaciones
                observaciones: formData.observaciones
            };
            
            console.log('✅ Datos de recepción filtrados:', datosRecepcion);
            return datosRecepcion;
        }
        
        // Retornar información completa
        console.log('✅ Retornando información completa');
        return formData;
        
    } catch (error) {
        console.error('❌ Error al extraer información de vista previa:', error);
        
        // Función de respaldo usando métodos anteriores
        return extraerInformacionRespaldo();
    }
}

// FUNCIÓN: RESPALDO PARA EXTRAER INFORMACIÓN (en caso de que collectFormData falle)
function extraerInformacionRespaldo() {
    console.log('🔄 Usando método de respaldo para extraer información...');
    
    try {
        // Función auxiliar para obtener valores de manera segura
        const getValue = (id, defaultValue = 'No especificado') => {
            try {
                const element = document.getElementById(id);
                return element?.value?.trim() || defaultValue;
            } catch (e) {
                console.warn(`⚠️ Error obteniendo valor de ${id}:`, e);
                return defaultValue;
            }
        };
        
        // Función auxiliar para obtener texto de select
        const getSelectText = (id, defaultValue = 'No seleccionada') => {
            try {
                const element = document.getElementById(id);
                if (element && element.selectedOptions && element.selectedOptions.length > 0) {
                    return element.selectedOptions[0].textContent?.trim() || defaultValue;
                }
                return defaultValue;
            } catch (e) {
                console.warn(`⚠️ Error obteniendo texto de select ${id}:`, e);
                return defaultValue;
            }
        };
        
        // Información básica
        return {
            cotizacion: getValue('quoteNumber'),
            fechaRecepcion: getValue('fechaRecepcion'),
            fechaEntrega: getValue('fechaEntrega'),
            cliente: getSelectText('empresaSelect'),
            nitEmpresa: getValue('nitEmpresa'),
            facturar: getValue('facturar'),
            informeNombre: getValue('informeNombre'),
            facturarNombre: getValue('facturarNombre'),
            observaciones: getValue('observaciones'),
            clienteEmail: getValue('clienteEmail'),
            empresaEmail: getValue('empresaEmail'),
            copiaEmail: getValue('copiaEmail'),
            items: [] // Array vacío como respaldo
        };
        
    } catch (error) {
        console.error('❌ Error en función de respaldo:', error);
        return {
            cotizacion: 'Error al obtener',
            fechaRecepcion: new Date().toLocaleDateString(),
            cliente: 'Error al obtener',
            observaciones: 'Error al extraer información',
            items: []
        };
    }
}

// FUNCIÓN: GENERAR REPORTE DE RECEPCIÓN USANDO DATOS DE VISTA PREVIA
function generarReporteRecepcion(info) {
    let reporte = `

                <b>REPORTE DE RECEPCIÓN HIGH TEST S.A.S</b>


📋 <b>INFORMACIÓN GENERAL</b>

• Nº de Recepción: ${info.cotizacion || 'No especificada'} \n• Fecha de Recepción: ${info.fechaRecepcion || 'No especificada'}
• Cliente: ${info.cliente || 'No especificado'} \n • NIT: ${info.nitEmpresa || 'No especificado'}
• Informe a Nombre de: ${info.informeNombre || 'No especificado'} \n • Facturar a Nombre de: ${info.facturarNombre || 'No especificado'}
• N° de Remisión: ${info.facturar || 'No especificada'}

-----------------------------------------------------------------

📦 <b>ELEMENTOS RECIBIDOS</b>`

    if (info.items && info.items.length > 0) {
        let ensayosAlcance = info.items.filter(item => item.type === 'Ensayos Alcance');
        let ensayosNoAcreditados = info.items.filter(item => item.type === 'Ensayos No Acreditados');
        
        if (ensayosAlcance.length > 0) {
            reporte += `\n\n🔬 ENSAYOS ALCANCE:`;
            reporte += `\n  `;
            ensayosAlcance.forEach((item, index) => {
                reporte += `\n   ${index + 1}. ${item.name} - Cantidad Recibida: ${item.quantity}`;
                if (item.observaciones && item.observaciones.trim()) {
                    reporte += `      - Obs: ${item.observaciones}`;
                }
            });
        }
        
        if (ensayosNoAcreditados.length > 0) {
            reporte += `\n\n⚪ ENSAYOS NO ACREDITADOS:`;
            ensayosNoAcreditados.forEach((item, index) => {
                reporte += `\n   ${index + 1}. ${item.name} - Cantidad Recibida: ${item.quantity}`;
                if (item.observaciones && item.observaciones.trim()) {
                    reporte += `\n      📝 Obs: ${item.observaciones}`;
                }
            });
        }
    } else {
        reporte += `\n\n❌ No se encontraron elementos recibidos.`;
    }
    reporte += `\n-----------------------------------------------------------------`;
    // Información de lavado si está disponible
    if (info.lavado && info.lavado !== 'No especificado') {
        reporte += `\n\n🧽 <b>INFORMACIÓN DE LAVADO</b>

• Estado de Lavado: ${info.lavado}`;
        if (info.elementosLavados) {
            reporte += `\n• Elementos Lavados: ${info.elementosLavados}`;
        }
        // if (info.responsableLavado) {
        //     reporte += `\n• Responsable: ${info.responsableLavado}`;
        // }
    }
reporte += `\n-----------------------------------------------------------------`;
    // Firma de recepción
    if (info.clienteRecepcionNombre || info.fechaFirmaRecepcion) {
        reporte += `\n\n✍️ <b>FIRMAS Y RESPONSABILIDADES</b>
        \n 🏢 <b>Representante CLIENTE (Recepción)</b>`;

        if (info.clienteRecepcionNombre) {
            reporte += `\n• Nombre: ${info.clienteRecepcionNombre}`;
        }
        if (info.clienteRecepcionCedula) {
            reporte += `\n• Cédula: ${info.clienteRecepcionCedula}`;
        }
        if (info.clienteRecepcionCargo) {
            reporte += `\n• Cargo: ${info.clienteRecepcionCargo}`;
        }
        // if (info.fechaFirmaRecepcion) {
        //     reporte += `\n• Fecha/Hora: ${info.fechaFirmaRecepcion}`;
        // }
        
        if (info.highTestRecepcionNombre) {
            reporte += `\n\n🏢 <b>Representante HIGH TEST (Recepción):</b>`;
            reporte += `\n• Nombre: ${info.highTestRecepcionNombre}`;
            if (info.highTestRecepcionCargo) {
                reporte += `\n• Cargo: ${info.highTestRecepcionCargo}`;
            }
        }
    }
reporte += `\n-----------------------------------------------------------------`;
    // Observaciones
    if (info.observaciones && info.observaciones.trim()) {
        reporte += `\n\n📝 <b>OBSERVACIONES GENERALES</b>

${info.observaciones}`;
    }

    reporte += `\n\n═══════════════════════════════════════════════════════════════
              <b>DOCUMENTO DE RECEPCIÓN GENERADO</b>`;

    return reporte;
}

// FUNCIÓN: GENERAR REPORTE COMPLETO USANDO DATOS DE VISTA PREVIA
function generarReporteCompleto(info) {
    let reporte = `

                <b>REPORTE ENTREGA COMPLETO HIGH TEST S.A.S</b>


📋 <b>INFORMACIÓN GENERAL</b>

• Nº de Recepción: ${info.cotizacion || 'No especificada'} 
• Fecha de Recepción: ${info.fechaRecepcion || 'No especificada'}
• Fecha de Entrega: ${info.fechaEntrega || 'No especificada'}
• Cliente: ${info.cliente || 'No especificado'} 
• NIT: ${info.nitEmpresa || 'No especificado'}
• Informe a Nombre de: ${info.informeNombre || 'No especificado'} 
• Facturar a Nombre de: ${info.facturarNombre || 'No especificado'}
• N° de Remisión: ${info.facturar || 'No especificada'}

-----------------------------------------------------------------

📦 <b>CANTIDAD ELEMENTOS DE ENSAYO DETALLADOS</b>`;

    // Elementos detallados
    if (info.items && info.items.length > 0) {
        let ensayosAlcance = info.items.filter(item => item.type === 'Ensayos Alcance');
        let ensayosNoAcreditados = info.items.filter(item => item.type === 'Ensayos No Acreditados');
        
        reporte += `\n\n
`;
        
        if (ensayosAlcance.length > 0) {
            reporte += `\n\n🔬 ENSAYOS ALCANCE:`;
            ensayosAlcance.forEach((item, index) => {
                reporte += `\n   ${index + 1}. ${item.name}`;
                reporte += `\n      Recibidas: ${item.quantity || 0}`;
                if (item.quantity2 > 0) reporte += `- Entregadas: ${item.quantity2}`;
                // if (item.quantity3 > 0) reporte += `\n      ⭕ No Usadas: ${item.quantity3}`;
                // if (item.quantity4 > 0) reporte += `\n      ✅ Usadas: ${item.quantity4}`;
                // if (item.status > 0) reporte += `\n      🧽 Lavados: ${item.status}`;
                if (item.observaciones && item.observaciones.trim()) {
                    reporte += `- Obs: ${item.observaciones}`;
                }
                reporte += '\n';
            });
        }
        
        if (ensayosNoAcreditados.length > 0) {
            reporte += `\n⚪ ENSAYOS NO ACREDITADOS:`;
            ensayosNoAcreditados.forEach((item, index) => {
                reporte += `\n   ${index + 1}. ${item.name}`;
                reporte += `\n      📥 Recibidas: ${item.quantity || 0}`;
                if (item.quantity2 > 0) reporte += `\n      📤 Entregadas: ${item.quantity2}`;
                if (item.quantity3 > 0) reporte += `\n      ⭕ No Usadas: ${item.quantity3}`;
                if (item.quantity4 > 0) reporte += `\n      ✅ Usadas: ${item.quantity4}`;
                if (item.status > 0) reporte += `\n      🧽 Lavados: ${item.status}`;
                if (item.observaciones && item.observaciones.trim()) {
                    reporte += `\n      📝 Obs: ${item.observaciones}`;
                }
                reporte += '\n';
            });
        }
    } else {
        reporte += `\n\n❌ No se encontraron elementos en el formulario.`;
    }
reporte += `\n-----------------------------------------------------------------`;
    // Información de lavado completa
    reporte += `\n\n🧽 <b>INFORMACIÓN DE LAVADO</b>
`;
    reporte += `\n• Estado de Lavado: ${info.lavado || 'No especificado'}`;
    if (info.elementosLavados) {
        reporte += `\n• Cantidad de Lavados: ${info.elementosLavados}`;
    }
    // if (info.tipoLavado) {
    //     reporte += `\n• Tipo de Lavado: ${info.tipoLavado}`;
    // }
    // if (info.fechaLavado) {
    //     reporte += `\n• Fecha de Lavado: ${info.fechaLavado}`;
    // }
    // if (info.responsableLavado) {
    //     reporte += `\n• Responsable del Lavado: ${info.responsableLavado}`;
    // }
    // if (info.observacionesLavado) {
    //     reporte += `\n• Observaciones de Lavado: ${info.observacionesLavado}`;
    // }

    // Información de calidad
//     if (info.inspeccionVisual || info.pruebasFuncionales || info.estadoCalidad) {
//         reporte += `\n\n🔍 CONTROL DE CALIDAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
//         if (info.inspeccionVisual) {
//             reporte += `\n• Inspección Visual: ${info.inspeccionVisual}`;
//         }
//         if (info.pruebasFuncionales) {
//             reporte += `\n• Pruebas Funcionales: ${info.pruebasFuncionales}`;
//         }
//         if (info.estadoCalidad) {
//             reporte += `\n• Estado de Calidad: ${info.estadoCalidad}`;
//         }
//         if (info.inspectorCalidad) {
//             reporte += `\n• Inspector de Calidad: ${info.inspectorCalidad}`;
//         }
//         if (info.fechaInspeccion) {
//             reporte += `\n• Fecha de Inspección: ${info.fechaInspeccion}`;
//         }
//         if (info.observacionesCalidad) {
//             reporte += `\n• Observaciones de Calidad: ${info.observacionesCalidad}`;
//         }
//     }
reporte += `\n-----------------------------------------------------------------`;
    // Firmas completas
    reporte += `\n\n✍️ <b>FIRMAS Y RESPONSABILIDADES</b>
`;
    
    // Cliente - Recepción
    if (info.clienteRecepcionNombre || info.fechaFirmaRecepcion) {
        reporte += `\n\n👤 CLIENTE (RECEPCIÓN):`;
        if (info.clienteRecepcionNombre) reporte += `\n• Nombre: ${info.clienteRecepcionNombre}`;
        if (info.clienteRecepcionCedula) reporte += `\n• Cédula: ${info.clienteRecepcionCedula}`;
        if (info.clienteRecepcionCargo) reporte += `\n• Cargo: ${info.clienteRecepcionCargo}`;
        // if (info.fechaFirmaRecepcion) reporte += `\n• Fecha/Hora: ${info.fechaFirmaRecepcion}`;
    }
    
    // Cliente - Entrega
    if (info.clienteEntregaNombre || info.fechaFirmaEntrega) {
        reporte += `\n\n👤 CLIENTE (ENTREGA):`;
        if (info.clienteEntregaNombre) reporte += `\n• Nombre: ${info.clienteEntregaNombre}`;
        if (info.clienteEntregaCedula) reporte += `\n• Cédula: ${info.clienteEntregaCedula}`;
        if (info.clienteEntregaCargo) reporte += `\n• Cargo: ${info.clienteEntregaCargo}`;
        // if (info.fechaFirmaEntrega) reporte += `\n• Fecha/Hora: ${info.fechaFirmaEntrega}`;
    }

    reporte += `\n------------------------`;
    // Representante HIGH TEST
    reporte += `\n\n🏢 <b>REPRESENTANTE HIGH TEST:</b>`;
    if (info.highTestRecepcionNombre) {
        reporte += `\n• Recepción - Nombre: ${info.highTestRecepcionNombre}`;
        if (info.highTestRecepcionCargo) reporte += `\n• Recepción - Cargo: ${info.highTestRecepcionCargo}`;
    }
    if (info.highTestEntregaNombre) {
        reporte += `\n• Entrega - Nombre: ${info.highTestEntregaNombre}`;
        if (info.highTestEntregaCargo) reporte += `\n• Entrega - Cargo: ${info.highTestEntregaCargo}`;
    }

//     // Información de contacto
//     reporte += `\n\n📧 INFORMACIÓN DE CONTACTO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
//     if (info.clienteEmail) reporte += `\n• Email Cliente: ${info.clienteEmail}`;
//     if (info.empresaEmail) reporte += `\n• Email Empresa: ${info.empresaEmail}`;
//     if (info.copiaEmail) reporte += `\n• CC: ${info.copiaEmail}`;
reporte += `\n-----------------------------------------------------------------`;
    // Observaciones generales
    if (info.observaciones && info.observaciones.trim()) {
        reporte += `\n\n📝 <b>OBSERVACIONES GENERALES</b>

${info.observaciones}`;
    }

    reporte += `\n\n═══════════════════════════════════════════════════════════════
                    FIN DEL REPORTE COMPLETO
        
═══════════════════════════════════════════════════════════════`;

    return reporte;
}

// FUNCIÓN: ABRIR MODAL
function abrirModalEmailCompleto() {
    try {
        // Extraer información previa para mostrar en el modal de manera segura
        console.log('🚀 Abriendo modal de email...');
        let infoPrevia;
        
        try {
            infoPrevia = extraerInformacionVistaPrevia(false); // false = información completa para la vista previa
        } catch (error) {
            console.warn('⚠️ Error extrayendo información previa, usando datos por defecto:', error);
            infoPrevia = {
                numeroRecepcion: 'Pendiente',
                empresaSelect: 'Pendiente',
                nitEmpresa: 'Pendiente',
                nombreContacto: 'Pendiente',
                tipoMuestra: 'Pendiente',
                ensayosAcreditados: [],
                ensayosNoAcreditados: [],
                observaciones: 'Sin observaciones'
            };
        }
        
        const modal = document.createElement('div');
        modal.id = 'modal-email-completo';
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
                width: 700px;
                max-width: 95%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <h2 style="color: #022859; margin-bottom: 25px; text-align: center;">
                    📧 Enviar Información - HIGH TEST
                </h2>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #1976d2;">
                    <h4 style="margin: 0 0 10px 0; color: #1976d2;">📋 Tipo de Información a Enviar:</h4>
                    <div style="display: flex; gap: 15px; margin-top: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 10px; background: white; border-radius: 5px; border: 2px solid #ddd;">
                            <input type="radio" name="tipoReporte" value="recepcion" checked style="margin-right: 10px;">
                            <div>
                                <strong>📄 Reporte de Recepción</strong><br>
                                <small style="color: #666;">Info básica de recepción y muestra</small>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 10px; background: white; border-radius: 5px; border: 2px solid #ddd;">
                            <input type="radio" name="tipoReporte" value="completo" style="margin-right: 10px;">
                            <div>
                                <strong>📋 Reporte Completo</strong><br>
                                <small style="color: #666;">Toda la información detallada</small>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Para: <span style="color: red;">*</span></label>
                    <input type="email" id="email-para-completo" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="destinatario@ejemplo.com" required>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">CC (Opcional):</label>
                    <input type="email" id="email-cc-completo" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="copia@ejemplo.com (opcional)">
                    <small style="color: #666; font-size: 12px;">Para enviar copia a otro destinatario</small>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Cliente / Nombre: <span style="color: red;">*</span></label>
                    <input type="text" id="email-nombre-completo" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" placeholder="Nombre del destinatario" required>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Asunto: <span style="color: red;">*</span></label>
                    <input type="text" id="email-asunto-completo" value="${infoPrevia.cotizacion || 'HT-2026'} - HIGH TEST" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" required>
                </div>
                
                <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; max-height: 200px; overflow-y: auto;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">📋 Vista previa de la información:</h4>
                    <div id="vista-previa-info" style="font-size: 13px; font-family: monospace; white-space: pre-line; color: #495057;">
Cargando información del formulario...

• Cotización: ${infoPrevia.cotizacion || 'No especificada'}
• Cliente: ${infoPrevia.cliente || 'No especificado'}  
• NIT: ${infoPrevia.nitEmpresa || 'No especificado'}
• Fecha Recepción: ${infoPrevia.fechaRecepcion || 'No especificada'}
• Fecha Entrega: ${infoPrevia.fechaEntrega || 'No especificada'}
• Elementos: ${infoPrevia.items ? infoPrevia.items.length : 0} registrados
• Observaciones: ${infoPrevia.observaciones ? infoPrevia.observaciones.substring(0, 50) + (infoPrevia.observaciones.length > 50 ? '...' : '') : 'Sin observaciones'}
                    </div>
                    <div style="margin-top: 10px; text-align: center;">
                        <button onclick="actualizarVistaPrevia()" style="background: #007bff; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                            🔄 Actualizar Vista Previa
                        </button>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                    <button onclick="enviarEmailCompleto()" style="background: #28a745; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
                        📧 Enviar Email
                    </button>
                    <button onclick="cerrarModalEmailCompleto()" style="background: #6c757d; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        ❌ Cancelar
                    </button>
                </div>
                
                <div style="margin-top: 15px; text-align: center; font-size: 12px; color: #6c757d;">
                    ✨ Selecciona el tipo de reporte y toda la información se incluirá en el cuerpo del email
                </div>
            </div>
        </div>`;
        
        document.body.appendChild(modal);
        
        // Agregar event listeners de manera segura
        setTimeout(() => {
            try {
                const radios = document.querySelectorAll('input[name="tipoReporte"]');
                radios.forEach(radio => {
                    radio.addEventListener('change', actualizarVistaPrevia);
                    radio.addEventListener('change', actualizarEstilosRadio);
                });
                
                // Actualizar estilos iniciales
                actualizarEstilosRadio();
                
                // Actualizar vista previa inicial después de un momento
                setTimeout(actualizarVistaPrevia, 500);
                
                console.log('✅ Modal abierto correctamente con event listeners');
                
            } catch (error) {
                console.warn('⚠️ Error configurando event listeners:', error);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error abriendo modal:', error);
        alert('Error abriendo el modal de email. Por favor, recarga la página e intenta de nuevo.');
    }
}

// FUNCIÓN: ACTUALIZAR VISTA PREVIA
function actualizarVistaPrevia() {
    try {
        const tipoReporte = document.querySelector('input[name="tipoReporte"]:checked')?.value || 'recepcion';
        const vistaPrevia = document.getElementById('vista-previa-info');
        
        if (!vistaPrevia) {
            console.warn('⚠️ Elemento vista-previa-info no encontrado');
            return;
        }
        
        console.log('🔄 Actualizando vista previa para tipo:', tipoReporte);
        
        const infoCompleta = extraerInformacionVistaPrevia(tipoReporte === 'recepcion'); // true para recepción, false para completo
        
        if (tipoReporte === 'recepcion') {
            const reporteRecepcion = generarReporteRecepcion(infoCompleta);
            // Renderizar HTML para que <b>, <strong>, etc. se vean en la vista previa
            vistaPrevia.innerHTML = reporteRecepcion.substring(0, 500) + '\n\n... [Vista previa limitada] ...';
        } else {
            const reporteCompleto = generarReporteCompleto(infoCompleta);
            // Renderizar HTML para que <b>, <strong>, etc. se vean en la vista previa
            vistaPrevia.innerHTML = reporteCompleto.substring(0, 500) + '\n\n... [Vista previa limitada] ...';
        }
        
        console.log('✅ Vista previa actualizada correctamente');
        
    } catch (error) {
        console.error('❌ Error actualizando vista previa:', error);
        const vistaPrevia = document.getElementById('vista-previa-info');
        if (vistaPrevia) {
            vistaPrevia.textContent = 'Error al generar vista previa. El sistema funcionará normalmente al enviar el email.';
        }
    }
}

// FUNCIÓN: ACTUALIZAR ESTILOS DE RADIO BUTTONS
function actualizarEstilosRadio() {
    const radios = document.querySelectorAll('input[name="tipoReporte"]');
    radios.forEach(radio => {
        const label = radio.closest('label');
        if (radio.checked) {
            label.style.borderColor = '#1976d2';
            label.style.backgroundColor = '#e3f2fd';
        } else {
            label.style.borderColor = '#ddd';
            label.style.backgroundColor = 'white';
        }
    });
}

// FUNCIÓN: ENVIAR EMAIL COMPLETO
async function enviarEmailCompleto() {
    const para = document.getElementById('email-para-completo').value.trim();
    const cc = document.getElementById('email-cc-completo').value.trim();
    const nombre = document.getElementById('email-nombre-completo').value.trim();
    const asunto = document.getElementById('email-asunto-completo').value.trim();
    const tipoReporte = document.querySelector('input[name="tipoReporte"]:checked')?.value || 'recepcion';
    
    if (!para || !nombre || !asunto) {
        alert('Por favor complete todos los campos obligatorios (Para, Nombre y Asunto)');
        return;
    }
    
    // Validar formato de email CC si se proporciona
    if (cc && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cc)) {
        alert('Por favor ingrese un email válido en el campo CC');
        return;
    }
    
    try {
        console.log(`📤 Enviando email con reporte ${tipoReporte}...`);
        
        // Extraer TODA la información del formulario usando la nueva función de vista previa
        const infoCompleta = extraerInformacionVistaPrevia(tipoReporte === 'recepcion'); // true para recepción, false para completo
        
        // Generar el reporte según el tipo seleccionado
        let reporteSeleccionado;
        let tipoReporteTexto;
        
        if (tipoReporte === 'recepcion') {
            reporteSeleccionado = generarReporteRecepcion(infoCompleta);
            tipoReporteTexto = 'Reporte de Recepción';
        } else {
            reporteSeleccionado = generarReporteCompleto(infoCompleta);
            tipoReporteTexto = 'Reporte Completo';
        }
        
        // Crear mensaje profesional con la información seleccionada
        const mensaje = `Estimado/a ${nombre},

Nos complacemos en enviarle la información correspondiente al proceso ${infoCompleta.cotizacion || infoCompleta.numeroRecepcion}.

${reporteSeleccionado}

Este email contiene datos de recepción. Toda la información relevante está incluida en este mensaje.

${cc ? `\n📧 Copia enviada también a: ${cc}\n` : ''}

`;
        
        // Parámetros para EmailJS
        const parametros = {
            to_email: para,
            cc_email: cc || '',
            to_name: nombre,
            subject: asunto,
            html_message: mensaje,
            numero_recepcion: infoCompleta.quoteNumber || infoCompleta.cotizacion || 'No especificado',
            nombre_cliente: infoCompleta.empresaSelect || infoCompleta.cliente || 'No especificado',
            nit_empresa: infoCompleta.nitEmpresa || 'No especificado',
            fecha_recepcion: infoCompleta.fechaRecepcion || 'No especificada',
            tipo_reporte: tipoReporteTexto,
            tipo_muestra: infoCompleta.tipoMuestra || 'No especificado',
            descripcion_muestra: infoCompleta.descripcionMuestra || 'No especificada',
            from_name: 'HIGH TEST S.A.S',
            email: 'reportes.hightest@gmail.com'
        };
        
        console.log('📋 Enviando información:', parametros);
        
        const resultado = await emailjs.send(
            EMAIL_COMPLETO_CONFIG.serviceId,
            EMAIL_COMPLETO_CONFIG.templateId,
            parametros
        );
        
        console.log('✅ Email enviado exitosamente:', resultado);
        
        // Mensaje de confirmación detallado
        let confirmacion = `✅ Email enviado exitosamente a ${para}

📋 Tipo de información enviada: ${tipoReporteTexto}
📧 Destinatario principal: ${para}`;
        
        if (cc) {
            confirmacion += `\n📧 Copia enviada a: ${cc}`;
        }
        
        confirmacion += `
        
📄 Contenido incluido:`;
        
        if (tipoReporte === 'recepcion') {
            confirmacion += `
• Información básica de recepción
• Datos del cliente y contacto  
• Detalles de la muestra recibida
• Observaciones principales`;
        } else {
            confirmacion += `
• Información completa del caso
• Datos del cliente y contacto
• Detalles de muestras y ensayos
• Ensayos acreditados y no acreditados
• Información de facturación
• Observaciones completas`;
        }
        
        confirmacion += `\n\n✨ ¡Información enviada sin archivos adjuntos!`;
        
        alert(confirmacion);
        cerrarModalEmailCompleto();
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        alert('❌ Error enviando email: ' + (error.text || error.message));
    }
}

// FUNCIÓN: CERRAR MODAL
function cerrarModalEmailCompleto() {
    const modal = document.getElementById('modal-email-completo');
    if (modal) modal.remove();
}

// EXPONER FUNCIONES GLOBALES
window.initEmailCompleto = initEmailCompleto;
window.crearBotonRespaldo = crearBotonRespaldo;
window.abrirModalEmailCompleto = abrirModalEmailCompleto;
window.enviarEmailCompleto = enviarEmailCompleto;
window.cerrarModalEmailCompleto = cerrarModalEmailCompleto;
window.extraerInformacionCompleta = extraerInformacionCompleta;
window.generarReporteCompleto = generarReporteCompleto;
window.generarReporteRecepcion = generarReporteRecepcion;
window.actualizarVistaPrevia = actualizarVistaPrevia;
window.actualizarEstilosRadio = actualizarEstilosRadio;

// INICIALIZACIÓN MÚLTIPLE
document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 DOM listo, inicializando email completo...');
    setTimeout(initEmailCompleto, 500);
});

// Respaldo de inicialización
setTimeout(function() {
    console.log('📧 Respaldo: Verificando botón de email completo...');
    if (!document.getElementById('btn-email-completo') && !document.getElementById('btn-email-respaldo')) {
        console.log('📧 No hay botón, creando respaldo...');
        crearBotonRespaldo();
    }
}, 3000);

console.log('✅ Sistema de Email Completo cargado - Sin archivos adjuntos');
