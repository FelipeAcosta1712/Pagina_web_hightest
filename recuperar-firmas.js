// ========================================================
// SCRIPT DE RECUPERACIÓN DE FIRMAS
// Ejecutar en la consola del navegador (F12 → Console)
// en la página de recepción-de-elementos
// ========================================================

(async function recuperarFirmas() {
    console.log('🔍 Buscando borradores con firmas en localStorage...');
    
    const drafts = JSON.parse(localStorage.getItem('cmr_drafts') || '[]');
    console.log(`📋 Total borradores locales: ${drafts.length}`);
    
    // Filtrar los que tienen firma pero podrían no estar en el servidor
    const conFirma = drafts.filter(d => {
        if (!d.signatureData) return false;
        const vals = Object.values(d.signatureData);
        return vals.some(v => v !== null && v !== undefined && v !== '');
    });
    
    console.log(`✅ Borradores CON firma local: ${conFirma.length}`);
    
    if (conFirma.length === 0) {
        console.log('❌ No hay firmas en localStorage de este navegador.');
        console.log('💡 Intenta en otros navegadores/dispositivos donde se hayan creado procesos.');
        return;
    }
    
    // Mostrar qué procesos tienen firma
    conFirma.forEach(d => {
        const hasRec = d.signatureData?.signatureCanvasRecepcion || d.signatureData?.Recepcion?.data;
        const hasEnt = d.signatureData?.signatureCanvasEntrega || d.signatureData?.Entrega?.data;
        console.log(`  📝 ${d.cotizacion || '?'} → Recepción: ${hasRec ? '✓' : '✗'} | Entrega: ${hasEnt ? '✓' : '✗'}`);
    });
    
    // Preguntar si quiere sincronizar
    const sincronizar = confirm(
        `Se encontraron ${conFirma.length} borradores con firmas.\n\n` +
        `¿Deseas sincronizar estas firmas al servidor?\n` +
        `(Esto sobrescribirá los datos del servidor para estos procesos)`
    );
    
    if (!sincronizar) {
        console.log('⏹️ Sincronización cancelada.');
        return;
    }
    
    console.log('🔄 Sincronizando firmas al servidor...');
    
    // Obtener borradores actuales del servidor
    const userEmail = (() => {
        try {
            const session = JSON.parse(localStorage.getItem('hightest_session') || '{}');
            if (session?.user?.email) return session.user.email;
            if (session?.email) return session.email;
            return 'shared';
        } catch(e) { return 'shared'; }
    })();
    
    let serverDrafts = [];
    try {
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_borradores', usuario_email: userEmail })
        });
        const result = await resp.json();
        if (result?.ok && Array.isArray(result.data)) {
            serverDrafts = result.data;
        }
    } catch(e) {
        console.warn('⚠️ No se pudieron obtener borradores del servidor:', e.message);
    }
    
    // Merge: local firma → servidor
    const serverMap = new Map();
    serverDrafts.forEach(d => {
        if (d.cotizacion) serverMap.set(d.cotizacion, d);
    });
    
    let updated = 0;
    conFirma.forEach(localDraft => {
        const key = localDraft.cotizacion;
        if (!key) return;
        
        const serverDraft = serverMap.get(key);
        if (!serverDraft) {
            // No existe en servidor, agregar
            serverMap.set(key, localDraft);
            updated++;
        } else if (!serverDraft.signatureData || !Object.values(serverDraft.signatureData || {}).some(v => v)) {
            // Existe pero sin firma, actualizar con la local
            serverMap.set(key, { ...serverDraft, signatureData: localDraft.signatureData });
            updated++;
        }
    });
    
    if (updated === 0) {
        console.log('✅ Todos los servidores ya tienen las firmas. No hay nada que sincronizar.');
        return;
    }
    
    // Guardar en servidor
    const mergedDrafts = Array.from(serverMap.values());
    
    try {
        const resp = await fetch('/.netlify/functions/conectar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_borradores', usuario_email: userEmail, drafts: mergedDrafts })
        });
        const result = await resp.json();
        if (result?.ok) {
            console.log(`✅ ¡ÉXITO! ${updated} procesos sincronizados con firmas.`);
            console.log('💡 Recarga la página del admin-panel para ver las firmas.');
        } else {
            console.error('❌ Error al guardar:', result);
        }
    } catch(e) {
        console.error('❌ Error de conexión:', e.message);
    }
})();
