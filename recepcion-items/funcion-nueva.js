// FUNCIÓN: GENERAR REPORTE COMPLETO USANDO DATOS DE VISTA PREVIA
function generarReporteCompleto(info) {
    let reporte = `

                REPORTE COMPLETO HIGH TEST S.A.S


📋 INFORMACIÓN GENERAL

• Nº de Recepción: ${info.cotizacion || 'No especificada'} 
• Fecha de Recepción: ${info.fechaRecepcion || 'No especificada'}
• Fecha de Entrega: ${info.fechaEntrega || 'No especificada'}
• Cliente: ${info.cliente || 'No especificado'} 
• NIT: ${info.nitEmpresa || 'No especificado'}
• Informe a Nombre de: ${info.informeNombre || 'No especificado'} 
• Facturar a Nombre de: ${info.facturarNombre || 'No especificado'}
• N° de Remisión: ${info.facturar || 'No especificada'}

-----------------------------------------------------------------

📦 ELEMENTOS DE ENSAYO DETALLADOS`;

    // Elementos detallados
    if (info.items && info.items.length > 0) {
        let ensayosAlcance = info.items.filter(item => item.type === 'Ensayos Alcance');
        let ensayosNoAcreditados = info.items.filter(item => item.type === 'Ensayos No Acreditados');
        
        if (ensayosAlcance.length > 0) {
            reporte += `\n\n🔬 ENSAYOS ALCANCE:`;
            reporte += `\n  `;
            ensayosAlcance.forEach((item, index) => {
                reporte += `\n   ${index + 1}. ${item.name}`;
                reporte += `\n      📥 Recibidas: ${item.quantity || 0}`;
                if (item.quantity2 > 0) reporte += `\n      📤 Entregadas: ${item.quantity2}`;
                if (item.quantity3 > 0) reporte += `\n      ⭕ No Usadas: ${item.quantity3}`;
                if (item.quantity4 > 0) reporte += `\n      ✅ Usadas: ${item.quantity4}`;
                if (item.status > 0) reporte += `\n      🧽 Lavados: ${item.status}`;
                if (item.observaciones && item.observaciones.trim()) {
                    reporte += `\n      - Obs: ${item.observaciones}`;
                }
            });
        }
        
        if (ensayosNoAcreditados.length > 0) {
            reporte += `\n\n⚪ ENSAYOS NO ACREDITADOS:`;
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
            });
        }
    } else {
        reporte += `\n\n❌ No se encontraron elementos en el formulario.`;
    }

    reporte += `\n-----------------------------------------------------------------`;

    // Información de lavado completa
    reporte += `\n\n🧽 INFORMACIÓN DE LAVADO

• Estado de Lavado: ${info.lavado || 'No especificado'}`;
    if (info.elementosLavados) {
        reporte += `\n• Cantidad de Lavados: ${info.elementosLavados}`;
    }
    if (info.tipoLavado) {
        reporte += `\n• Tipo de Lavado: ${info.tipoLavado}`;
    }
    if (info.fechaLavado) {
        reporte += `\n• Fecha de Lavado: ${info.fechaLavado}`;
    }
    if (info.responsableLavado) {
        reporte += `\n• Responsable del Lavado: ${info.responsableLavado}`;
    }
    if (info.observacionesLavado) {
        reporte += `\n• Observaciones de Lavado: ${info.observacionesLavado}`;
    }

    // Información de calidad
    if (info.inspeccionVisual || info.pruebasFuncionales || info.estadoCalidad) {
        reporte += `\n\n🔍 CONTROL DE CALIDAD

`;
        if (info.inspeccionVisual) {
            reporte += `• Inspección Visual: ${info.inspeccionVisual}\n`;
        }
        if (info.pruebasFuncionales) {
            reporte += `• Pruebas Funcionales: ${info.pruebasFuncionales}\n`;
        }
        if (info.estadoCalidad) {
            reporte += `• Estado de Calidad: ${info.estadoCalidad}\n`;
        }
        if (info.inspectorCalidad) {
            reporte += `• Inspector de Calidad: ${info.inspectorCalidad}\n`;
        }
        if (info.fechaInspeccion) {
            reporte += `• Fecha de Inspección: ${info.fechaInspeccion}\n`;
        }
        if (info.observacionesCalidad) {
            reporte += `• Observaciones de Calidad: ${info.observacionesCalidad}`;
        }
    }

    // Firmas completas
    reporte += `\n\n✍️ FIRMAS Y RESPONSABILIDADES 
        `;
    
    // Cliente - Recepción
    if (info.clienteRecepcionNombre || info.fechaFirmaRecepcion) {
        reporte += `\n\n 🏢 Representante CLIENTE (RECEPCIÓN)`;
        if (info.clienteRecepcionNombre) reporte += `\n• Nombre: ${info.clienteRecepcionNombre}`;
        if (info.clienteRecepcionCedula) reporte += `\n• Cédula: ${info.clienteRecepcionCedula}`;
        if (info.clienteRecepcionCargo) reporte += `\n• Cargo: ${info.clienteRecepcionCargo}`;
    }
    
    // Cliente - Entrega
    if (info.clienteEntregaNombre || info.fechaFirmaEntrega) {
        reporte += `\n\n 🏢 Representante CLIENTE (ENTREGA)`;
        if (info.clienteEntregaNombre) reporte += `\n• Nombre: ${info.clienteEntregaNombre}`;
        if (info.clienteEntregaCedula) reporte += `\n• Cédula: ${info.clienteEntregaCedula}`;
        if (info.clienteEntregaCargo) reporte += `\n• Cargo: ${info.clienteEntregaCargo}`;
    }
    
    // Representante HIGH TEST
    if (info.highTestRecepcionNombre || info.highTestEntregaNombre) {
        reporte += `\n\n🏢 Representante HIGH TEST:`;
        if (info.highTestRecepcionNombre) {
            reporte += `\n• Recepción - Nombre: ${info.highTestRecepcionNombre}`;
            if (info.highTestRecepcionCargo) reporte += `\n• Recepción - Cargo: ${info.highTestRecepcionCargo}`;
        }
        if (info.highTestEntregaNombre) {
            reporte += `\n• Entrega - Nombre: ${info.highTestEntregaNombre}`;
            if (info.highTestEntregaCargo) reporte += `\n• Entrega - Cargo: ${info.highTestEntregaCargo}`;
        }
    }

    // Información de contacto
    if (info.clienteEmail || info.empresaEmail || info.copiaEmail) {
        reporte += `\n\n📧 INFORMACIÓN DE CONTACTO

`;
        if (info.clienteEmail) reporte += `• Email Cliente: ${info.clienteEmail}\n`;
        if (info.empresaEmail) reporte += `• Email Empresa: ${info.empresaEmail}\n`;
        if (info.copiaEmail) reporte += `• CC: ${info.copiaEmail}`;
    }

    // Observaciones generales
    if (info.observaciones && info.observaciones.trim()) {
        reporte += `\n\n📝 OBSERVACIONES GENERALES

${info.observaciones}`;
    }

    reporte += `\n\n═══════════════════════════════════════════════════════════════
                    FIN DEL REPORTE COMPLETO`;

    return reporte;
}
