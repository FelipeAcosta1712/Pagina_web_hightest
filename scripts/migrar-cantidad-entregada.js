#!/usr/bin/env node
// =============================================
// MIGRACIÓN TEMPORAL: cantidad_entregada
// Recupera cantidad_entregada desde borradores hacia detalle_procesos_ac
//
// USO:
//   node scripts/migrar-cantidad-entregada.js [BASE_URL]
//
// Ejemplo local:
//   node scripts/migrar-cantidad-entregada.js http://localhost:8888
//
// Ejemplo producción:
//   node scripts/migrar-cantidad-entregada.js https://tu-sitio.netlify.app
//
// IMPORTANTE: Esta migración es de uso único.
// Después de ejecutarla, eliminar este archivo y el endpoint de conectar.js.
// =============================================

const BASE_URL = process.argv[2] || 'http://localhost:8888';

async function apiCall(action, payload = {}) {
    const res = await fetch(`${BASE_URL}/.netlify/functions/conectar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
    });
    return res.json();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('='.repeat(60));
    console.log('MIGRACIÓN: cantidad_entregada desde borradores');
    console.log(`Base URL: ${BASE_URL}`);
    console.log('='.repeat(60));
    console.log('');

    // ── PASO 1: Obtener borradores ──
    console.log('[Paso 1] Obteniendo borradores...');
    const borradoresRes = await apiCall('get_borradores');
    if (!borradoresRes.ok) {
        console.error('Error al obtener borradores:', borradoresRes.error);
        process.exit(1);
    }
    const borradores = borradoresRes.data || [];
    console.log(`  Borradores encontrados: ${borradores.length}`);
    console.log('');

    // ── PASO 2: Obtener ensayos acreditados ──
    console.log('[Paso 2] Obteniendo ensayos acreditados...');
    const ensayosRes = await apiCall('get_ensayos_acreditados');
    if (!ensayosRes.ok) {
        console.error('Error al obtener ensayos:', ensayosRes.error);
        process.exit(1);
    }
    const ensayos = ensayosRes.items || ensayosRes.ensayos_acreditados || [];
    console.log(`  Ensayos encontrados: ${ensayos.length}`);

    // Construir mapa: nombre → ensayo_id
    const ensayoMap = {};
    for (const e of ensayos) {
        if (e.nombre && e.id) {
            ensayoMap[e.nombre.trim().toLowerCase()] = e.id;
        }
    }
    console.log(`  Mapa nombre→id construido: ${Object.keys(ensayoMap).length} entradas`);
    console.log('');

    // ── PASO 3-5: Recorrer borradores y migrar ──
    console.log('[Paso 3-5] Procesando borradores...');
    console.log('');

    const stats = {
        procesosRecorridos: 0,
        itemsEncontrados: 0,
        itemsActualizados: 0,
        itemsOmitidos: 0,
        ensayosNoEncontrados: 0,
        procesosNoEncontrados: 0,
        errores: 0
    };

    for (const borrador of borradores) {
        const numeroProceso = borrador.cotizacion || borrador.quoteNumber || borrador.numero_proceso || '';
        if (!numeroProceso) continue;

        const items = borrador.items || [];
        if (items.length === 0) continue;

        stats.procesosRecorridos++;
        console.log(`─── Proceso: ${numeroProceso} (${items.length} items) ───`);

        for (const item of items) {
            const itemName = (item.name || item.elemento || '').trim();
            const quantity2 = parseInt(item.quantity2) || 0;

            if (!itemName) continue;
            stats.itemsEncontrados++;

            // Buscar ensayo_id por nombre
            const ensayoId = ensayoMap[itemName.toLowerCase()];
            if (!ensayoId) {
                console.log(`  ⚠ Ensayo no encontrado: "${itemName}"`);
                stats.ensayosNoEncontrados++;
                continue;
            }

            // Si quantity2 es 0, no hay nada que migrar
            if (quantity2 === 0) {
                console.log(`  ⏭ ${itemName}: quantity2=0, omitido`);
                stats.itemsOmitidos++;
                continue;
            }

            // Llamar endpoint de migración
            try {
                const result = await apiCall('migrar_cantidad_entregada', {
                    numero_proceso: numeroProceso,
                    ensayo_id: ensayoId,
                    cantidad_entregada: quantity2
                });

                if (!result.ok) {
                    console.error(`  ✖ ${itemName}: Error - ${result.error}`);
                    stats.errores++;
                    continue;
                }

                if (result.updated) {
                    console.log(`  ✔ ${itemName}: cantidad_entregada = ${quantity2} (actualizado)`);
                    stats.itemsActualizados++;
                } else if (result.reason === 'proceso_no_encontrado') {
                    console.log(`  ⚠ ${itemName}: Proceso no encontrado en BD`);
                    stats.procesosNoEncontrados++;
                } else {
                    console.log(`  ⏭ ${itemName}: Ya tiene valor distinto de 0, omitido`);
                    stats.itemsOmitidos++;
                }
            } catch (err) {
                console.error(`  ✖ ${itemName}: Excepción - ${err.message}`);
                stats.errores++;
            }

            // Pequeña pausa para no saturar la BD
            await sleep(50);
        }

        console.log('');
    }

    // ── RESUMEN ──
    console.log('='.repeat(60));
    console.log('RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`  Procesos recorridos:        ${stats.procesosRecorridos}`);
    console.log(`  Items encontrados:          ${stats.itemsEncontrados}`);
    console.log(`  Items actualizados:         ${stats.itemsActualizados}`);
    console.log(`  Items omitidos:             ${stats.itemsOmitidos}`);
    console.log(`  Ensayos no encontrados:     ${stats.ensayosNoEncontrados}`);
    console.log(`  Procesos no encontrados:    ${stats.procesosNoEncontrados}`);
    console.log(`  Errores:                    ${stats.errores}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Migración completada.');
    console.log('Recuerda eliminar este archivo y el endpoint migrar_cantidad_entregada de conectar.js');
}

main().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
