/**
 * Servidor simple para guardar números restringidos de forma compartida
 * Ejecutar: node server-restricted.js
 * Acceso: http://localhost:3001
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'restricted-numbers.json');

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar archivo de datos si no existe
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ restricted: [], lastUpdate: new Date().toISOString() }, null, 2));
    }
}

// Leer datos
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo datos:', error);
        return { restricted: [], lastUpdate: new Date().toISOString() };
    }
}

// Escribir datos
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error escribiendo datos:', error);
        return false;
    }
}

// ============================================
// ENDPOINTS
// ============================================

// Ruta raíz simple para comprobación de salud (Replit requiere / responda rápido)
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'restricted-numbers-server OK' });
});

/**
 * GET /api/restricted-numbers
 * Obtener todos los números restringidos
 */
app.get('/api/restricted-numbers', (req, res) => {
    initDataFile();
    const data = readData();
    res.json({
        success: true,
        data: data.restricted,
        lastUpdate: data.lastUpdate
    });
});

/**
 * POST /api/restricted-numbers
 * Guardar lista completa de números restringidos
 * Body: { restricted: ['R26 0001', 'R26 0002', ...] }
 */
app.post('/api/restricted-numbers', (req, res) => {
    initDataFile();
    const { restricted } = req.body;
    
    if (!Array.isArray(restricted)) {
        return res.status(400).json({
            success: false,
            message: 'El campo "restricted" debe ser un array'
        });
    }
    
    const data = {
        restricted: restricted,
        lastUpdate: new Date().toISOString()
    };
    
    const success = writeData(data);
    
    if (success) {
        res.json({
            success: true,
            message: 'Números restringidos guardados',
            data: data
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Error al guardar los datos'
        });
    }
});

/**
 * POST /api/restricted-numbers/add
 * Agregar un número restringido
 * Body: { number: 'R26 0001' }
 */
app.post('/api/restricted-numbers/add', (req, res) => {
    initDataFile();
    const { number } = req.body;
    
    if (!number || typeof number !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Se requiere un "number" válido'
        });
    }
    
    const data = readData();
    
    // Evitar duplicados (normalizado)
    const normalize = (s) => s.toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
    if (data.restricted.some(n => normalize(n) === normalize(number))) {
        return res.status(400).json({
            success: false,
            message: 'Este número ya está restringido'
        });
    }
    
    data.restricted.push(number.toUpperCase());
    data.lastUpdate = new Date().toISOString();
    
    const success = writeData(data);
    
    if (success) {
        res.json({
            success: true,
            message: 'Número agregado',
            data: data.restricted
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Error al guardar'
        });
    }
});

/**
 * DELETE /api/restricted-numbers/:index
 * Eliminar un número por índice
 */
app.delete('/api/restricted-numbers/:index', (req, res) => {
    initDataFile();
    const index = parseInt(req.params.index);
    
    const data = readData();
    
    if (index < 0 || index >= data.restricted.length) {
        return res.status(400).json({
            success: false,
            message: 'Índice inválido'
        });
    }
    
    const deleted = data.restricted[index];
    data.restricted.splice(index, 1);
    data.lastUpdate = new Date().toISOString();
    
    const success = writeData(data);
    
    if (success) {
        res.json({
            success: true,
            message: `Número ${deleted} eliminado`,
            data: data.restricted
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar'
        });
    }
});

/**
 * DELETE /api/restricted-numbers
 * Eliminar todos los números
 */
app.delete('/api/restricted-numbers', (req, res) => {
    initDataFile();
    
    const data = {
        restricted: [],
        lastUpdate: new Date().toISOString()
    };
    
    const success = writeData(data);
    
    if (success) {
        res.json({
            success: true,
            message: 'Todos los números restringidos han sido eliminados',
            data: data.restricted
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar'
        });
    }
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================

initDataFile();

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  🚀 Servidor de Números Restringidos      ║
║  ✅ Corriendo en http://localhost:${PORT}    ║
║                                            ║
║  Endpoints disponibles:                    ║
║  • GET    /api/restricted-numbers          ║
║  • POST   /api/restricted-numbers          ║
║  • POST   /api/restricted-numbers/add      ║
║  • DELETE /api/restricted-numbers/:index   ║
║  • DELETE /api/restricted-numbers          ║
╚════════════════════════════════════════════╝
    `);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});
