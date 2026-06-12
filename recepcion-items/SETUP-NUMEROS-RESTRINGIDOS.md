# 📋 Números Restringidos - Sincronización Multi-Navegador

Este sistema permite sincronizar números de recepción restringidos entre múltiples navegadores y máquinas usando un servidor Node.js simple.

## 🚀 Setup Rápido (LOCAL)

### 1. Instalar dependencias del servidor

```bash
cd c:/Users/DELL/Documents/FELIPE ACOSTA/PROYECTOS_2025/PROGRAMACION_HT/Recepecion_Items-Inicial
npm install --save express cors
```

### 2. Iniciar el servidor

```bash
node server-restricted.js
```

Deberías ver:
```
╔════════════════════════════════════════════╗
║  🚀 Servidor de Números Restringidos      ║
║  ✅ Corriendo en http://localhost:3001    ║
╚════════════════════════════════════════════╝
```

### 3. El archivo se guarda automáticamente

Se crea `restricted-numbers.json` en la misma carpeta del servidor.

---

## 💾 Usar Localmente (Sin Servidor)

Si NO deseas instalar Node.js, tienes dos opciones:

### Opción A: Exportar/Importar JSON
1. **Exportar**: Abre el modal 🔐 → Botón "📥 Exportar"
2. **Guardar**: El archivo JSON se descarga
3. **Compartir**: Envía el JSON a otra computadora
4. **Importar**: En otra máquina, abre el modal → "📤 Importar" → selecciona el archivo

### Opción B: Usar Replit (Gratis en la nube)
1. Ve a https://replit.com
2. Crea una cuenta gratuita
3. Sube los archivos `server-restricted.js` y `package-server.json`
4. En `script.js`, cambia la línea:
   ```javascript
   const RESTRICTED_SERVER_URL = 'https://tu-replit-url.replit.dev';
   ```
5. ¡Ahora los datos están en la nube y accesibles desde cualquier lado!

---

## 📱 Funciones Disponibles

### En el Modal 🔐:

| Botón | Función |
|-------|---------|
| **📥 Exportar** | Descarga números en archivo JSON |
| **📤 Importar** | Carga números desde archivo JSON |
| **🔄 Sincronizar** | Descarga números del servidor |
| **➕ Agregar** | Agrega un número a la lista |
| **🗑️ Eliminar** | Elimina un número (solo admin/director) |

---

## 🔑 Permisos por Rol

| Rol | Agregar | Eliminar | Ver |
|-----|---------|----------|-----|
| **Administrador** | ✅ | ✅ | ✅ |
| **Director Técnico** | ✅ | ✅ | ✅ |
| **Técnico de Ensayos** | ✅ | ❌ | ✅ |
| **Otros** | ❌ | ❌ | ❌ |

---

## 📂 Estructura de Datos

El archivo `restricted-numbers.json` se ve así:

```json
{
  "restricted": [
    "R26 0001",
    "R26 0002",
    "R26 0050"
  ],
  "lastUpdate": "2026-01-30T15:30:45.123Z"
}
```

---

## 🌐 Endpoints del Servidor

### GET `/api/restricted-numbers`
Obtiene la lista actual de números restringidos

```bash
curl http://localhost:3001/api/restricted-numbers
```

Respuesta:
```json
{
  "success": true,
  "data": ["R26 0001", "R26 0002"],
  "lastUpdate": "2026-01-30T15:30:45.123Z"
}
```

### POST `/api/restricted-numbers`
Guarda una lista completa (REEMPLAZA todo)

```bash
curl -X POST http://localhost:3001/api/restricted-numbers \
  -H "Content-Type: application/json" \
  -d '{"restricted": ["R26 0001", "R26 0002"]}'
```

### POST `/api/restricted-numbers/add`
Agrega un número a la lista

```bash
curl -X POST http://localhost:3001/api/restricted-numbers/add \
  -H "Content-Type: application/json" \
  -d '{"number": "R26 0001"}'
```

### DELETE `/api/restricted-numbers/:index`
Elimina un número por índice

```bash
curl -X DELETE http://localhost:3001/api/restricted-numbers/0
```

---

## ⚙️ Configuración

### Cambiar URL del Servidor

En `script.js` línea ~710:
```javascript
const RESTRICTED_SERVER_URL = localStorage.getItem('restricted_server_url') || 'http://localhost:3001';
```

O desde DevTools (F12 → Console):
```javascript
localStorage.setItem('restricted_server_url', 'https://mi-servidor.com');
location.reload();
```

---

## 🐛 Troubleshooting

### "⚠️ No se pudo conectar con servidor"
- ✅ Verifica que el servidor esté corriendo: `node server-restricted.js`
- ✅ Verifica el URL en `RESTRICTED_SERVER_URL`
- ✅ Si es local, usa `http://localhost:3001` (no HTTPS)

### Los números no se sincronizan
- ✅ Haz clic en el botón "🔄 Sincronizar" en el modal
- ✅ O cierra y reabre el modal
- ✅ Verifica que el servidor esté guardando en `restricted-numbers.json`

### Quiero usar Replit
1. https://replit.com/new/nodejs
2. Nombre: `restricted-numbers-server`
3. Sube `server-restricted.js` y `package-server.json`
4. Run → instala dependencias automáticamente
5. Copia la URL (ej: `https://restricted-numbers-server.replit.dev`)
6. En `script.js`, cambia `RESTRICTED_SERVER_URL` a esa URL

---

## 📝 Historial de Cambios

- **v1.0** (30 Ene 2026): Lanzamiento inicial
  - ✅ Sincronización servidor
  - ✅ Exportar/Importar JSON
  - ✅ Permisos por rol
  - ✅ Preestablecido con "R26"
