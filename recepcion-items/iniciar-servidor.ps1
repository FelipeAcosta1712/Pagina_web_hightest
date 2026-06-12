# Script para iniciar el servidor de números restringidos en Windows (PowerShell)

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 Servidor de Números Restringidos      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verificar si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    Write-Host ""
    npm install --save express cors
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Error al instalar dependencias`n" -ForegroundColor Red
        Write-Host "Asegúrate de tener Node.js instalado" -ForegroundColor Yellow
        Write-Host "Descarga desde: https://nodejs.org`n" -ForegroundColor Yellow
        Read-Host "Presiona Enter para salir"
        exit 1
    }
}

Write-Host "`n✅ Iniciando servidor...`n" -ForegroundColor Green
Write-Host "🌐 URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📁 Datos: restricted-numbers.json" -ForegroundColor Cyan
Write-Host "`nPresiona Ctrl+C para detener`n" -ForegroundColor Yellow

node server-restricted.js

Read-Host "Presiona Enter para salir"
