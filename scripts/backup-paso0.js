// Paso 0 — Respaldo de tablas antes de optimizar timeouts.
// Uso: node scripts/backup-paso0.js
// Exporta tablas completas (paginado en bloques de 1000) a JSON en backups-paso0/.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});

if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    console.error('Falta SUPABASE_URL o SUPABASE_KEY en .env');
    process.exit(1);
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

const TABLES = [
    'clientes',
    'borradores',
    'procesos_acreditados',
    'detalle_procesos_ac',
    'marcaciones_ac'
];

async function fetchAll(table) {
    const out = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('id', { ascending: true })
            .range(from, from + page - 1);
        if (error) throw new Error(`${table}: ${error.message}`);
        out.push(...(data || []));
        if (!data || data.length < page) break;
    }
    return out;
}

(async () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const outDir = path.join(__dirname, '..', 'backups-paso0');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const resumen = { fecha: new Date().toISOString(), tablas: {} };

    for (const table of TABLES) {
        process.stdout.write(`Exportando ${table}... `);
        try {
            const rows = await fetchAll(table);
            const file = path.join(outDir, `${table}_${stamp}.json`);
            fs.writeFileSync(file, JSON.stringify(rows));
            resumen.tablas[table] = { filas: rows.length, archivo: path.basename(file), bytes: fs.statSync(file).size };
            console.log(`${rows.length} filas -> ${path.basename(file)}`);
        } catch (e) {
            resumen.tablas[table] = { error: e.message };
            console.log(`ERROR: ${e.message}`);
        }
    }

    const resumenFile = path.join(outDir, `resumen_${stamp}.json`);
    fs.writeFileSync(resumenFile, JSON.stringify(resumen, null, 2));
    console.log(`\nResumen: ${resumenFile}`);
    console.log(JSON.stringify(resumen.tablas, null, 2));
})();
