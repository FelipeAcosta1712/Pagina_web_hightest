const express = require('express');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'empresas.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// CORS (permite acceso desde Live Server 5501 u otros orígenes locales)
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: false,
}));

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR, {
  fallthrough: true,
  etag: true,
  maxAge: '7d',
}));

// Asegurar carpeta de subidas
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuración de multer para guardar archivos con nombre seguro
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const original = file.originalname || 'archivo';
    const ext = path.extname(original);
    const base = path.basename(original, ext)
      .replace(/[^a-zA-Z0-9-_\.]+/g, '_')
      .slice(0, 80);
    const stamp = Date.now();
    cb(null, `${base}_${stamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por archivo
    files: 20,
  },
});

// Utilidad simple para IDs
function genId() {
  const ts = Date.now().toString(36);
  const rnd = Math.floor(Math.random() * 1e9).toString(36);
  return `${ts}${rnd}`;
}

// Lectura segura
async function readEmpresas() {
  try {
    const txt = await fsp.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : data.empresas || data || [];
  } catch (e) {
    // Si el archivo no existe o está vacío, devolver lista vacía
    return [];
  }
}

// Escritura atómica
async function writeEmpresas(empresas) {
  const tmpFile = DATA_FILE + '.tmp';
  const payload = JSON.stringify(empresas, null, 2);
  await fsp.writeFile(tmpFile, payload, 'utf8');
  await fsp.rename(tmpFile, DATA_FILE);
}

// API: obtener todas las empresas
app.get('/api/empresas', async (req, res) => {
  try {
    const empresas = await readEmpresas();
    res.json(empresas);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo leer empresas.json', details: String(e) });
  }
});

// API: crear nueva empresa
app.post('/api/empresas', async (req, res) => {
  try {
    const { EMPRESA, NIT } = req.body || {};
    if (!EMPRESA || !NIT) {
      return res.status(400).json({ error: 'Faltan campos requeridos: EMPRESA y NIT' });
    }
    const empresas = await readEmpresas();
    // Evitar duplicados por NIT + nombre (opcional)
    const exists = empresas.find(e => (e.NIT || '').trim() === String(NIT).trim() && (e.EMPRESA || '').trim().toLowerCase() === String(EMPRESA).trim().toLowerCase());
    if (exists) {
      return res.status(409).json({ error: 'La empresa ya existe', empresa: exists });
    }

    const nuevo = { ID: genId(), EMPRESA: String(EMPRESA).trim(), NIT: String(NIT).trim() };
    empresas.push(nuevo);
    await writeEmpresas(empresas);
    res.status(201).json(nuevo);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo escribir empresas.json', details: String(e) });
  }
});

// API: actualizar empresa por ID
app.put('/api/empresas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { EMPRESA, NIT } = req.body || {};
    const empresas = await readEmpresas();
    const idx = empresas.findIndex(e => e.ID === id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
    if (EMPRESA) empresas[idx].EMPRESA = String(EMPRESA).trim();
    if (NIT) empresas[idx].NIT = String(NIT).trim();
    await writeEmpresas(empresas);
    res.json(empresas[idx]);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo actualizar empresas.json', details: String(e) });
  }
});

// API: subir archivos y devolver URLs públicas
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron archivos' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const files = req.files.map(f => ({
      originalName: f.originalname,
      filename: f.filename,
      size: f.size,
      mimeType: f.mimetype,
      url: `${baseUrl}/uploads/${encodeURIComponent(f.filename)}`,
    }));
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron subir los archivos', details: String(e) });
  }
});

// API: proxy para subir a 0x0.st (evita CORS)
app.post('/api/proxy-upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron archivos' });
    }

    const results = [];
    const fetch = (await import('node-fetch')).default;

    for (const file of req.files) {
      try {
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        
        // Leer el archivo desde disco
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(file.path);
        formData.append('file', fileBuffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });

        const response = await fetch('https://0x0.st', {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        });

        if (response.ok) {
          const url = await response.text();
          results.push({
            originalName: file.originalname,
            size: file.size,
            url: url.trim(),
            expires: '365 días'
          });
        } else {
          results.push({
            originalName: file.originalname,
            size: file.size,
            url: null,
            error: `Error ${response.status}`
          });
        }

        // Limpiar archivo temporal
        fs.unlinkSync(file.path);
      } catch (error) {
        results.push({
          originalName: file.originalname,
          size: file.size,
          url: null,
          error: error.message
        });
      }
    }

    res.json({ files: results });
  } catch (e) {
    res.status(500).json({ error: 'Error en proxy upload', details: String(e) });
  }
});

// ============================================
// BORRADORES (Casos en Progreso) - Almacenamiento local en archivo
// ============================================
const BORRADORES_FILE = path.join(__dirname, 'borradores.json');

async function readBorradores() {
  try {
    const txt = await fsp.readFile(BORRADORES_FILE, 'utf8');
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

async function writeBorradores(borradores) {
  const tmpFile = BORRADORES_FILE + '.tmp';
  await fsp.writeFile(tmpFile, JSON.stringify(borradores, null, 2), 'utf8');
  await fsp.rename(tmpFile, BORRADORES_FILE);
}

// Proxy: simular Netlify function para borradores
app.post('/.netlify/functions/conectar', async (req, res) => {
  try {
    const payload = req.body || {};

    // GET borradores
    if (payload.action === 'get_borradores') {
      const allRows = await readBorradores();
      const allDrafts = [];
      allRows.forEach(row => {
        if (Array.isArray(row.datos)) {
          row.datos.forEach(d => {
            if (!allDrafts.some(x => JSON.stringify(x) === JSON.stringify(d))) {
              allDrafts.push(d);
            }
          });
        }
      });
      return res.json({ ok: true, data: allDrafts });
    }

    // SAVE borradores
    if (payload.action === 'save_borradores') {
      const usuarioEmail = (payload.usuario_email || 'shared').toLowerCase();
      const drafts = payload.drafts;
      if (!Array.isArray(drafts)) {
        return res.status(400).json({ ok: false, error: 'drafts debe ser un array' });
      }
      const allRows = await readBorradores();
      const existingIdx = allRows.findIndex(r => r.usuario_email === usuarioEmail);
      if (existingIdx !== -1) {
        allRows[existingIdx].datos = drafts;
        allRows[existingIdx].updated_at = new Date().toISOString();
      } else {
        allRows.push({ usuario_email: usuarioEmail, datos: drafts, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
      await writeBorradores(allRows);
      return res.json({ ok: true, message: 'Borradores guardados' });
    }

    // DELETE borrador por cotización
    if (payload.action === 'delete_borrador') {
      const cotizacion = (payload.cotizacion || '').trim();
      if (!cotizacion) {
        return res.status(400).json({ ok: false, error: 'Se requiere cotizacion' });
      }
      const allRows = await readBorradores();
      for (const row of allRows) {
        if (!Array.isArray(row.datos)) continue;
        const filtered = row.datos.filter(d => String(d.cotizacion || d.quoteNumber || '') !== cotizacion);
        if (filtered.length !== row.datos.length) {
          row.datos = filtered;
          row.updated_at = new Date().toISOString();
        }
      }
      await writeBorradores(allRows);
      return res.json({ ok: true, message: 'Borrador eliminado' });
    }

    // Para otras acciones, devolver error (no soportado en server local)
    return res.status(404).json({ ok: false, error: `Acción no soportada en servidor local: ${payload.action}` });
  } catch (e) {
    console.error('Error en /api/borradores:', e);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor', detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
