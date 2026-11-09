// Diagnóstico de solo lectura: tipos de columnas de las tablas clave.
// Uso: node scripts/consultar-tipos-columnas.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});

if (!env.DATABASE_URL) {
    console.error('Falta DATABASE_URL en .env');
    process.exit(1);
}

const TABLES = [
    'procesos_acreditados',
    'detalle_procesos_ac',
    'marcaciones_ac',
    'clientes',
    'borradores',
    'cotizaciones_ac',
    'informes_ensayo_ac',
    'ensayos_acreditados'
];

(async () => {
    const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
        const { rows } = await client.query(
            `SELECT table_name, column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = ANY($1)
             ORDER BY table_name, ordinal_position`,
            [TABLES]
        );
        let actual = '';
        for (const r of rows) {
            if (r.table_name !== actual) { actual = r.table_name; console.log('\n== ' + actual + ' =='); }
            console.log(`  ${r.column_name}: ${r.data_type}${r.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        }
    } finally {
        await client.end();
    }
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
