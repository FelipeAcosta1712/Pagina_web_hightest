@echo off
REM Script para iniciar el servidor de números restringidos en Windows

echo ╔════════════════════════════════════════════╗
echo ║  🚀 Servidor de Números Restringidos      ║
echo ╚════════════════════════════════════════════╝

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo.
    echo 📦 Instalando dependencias...
    echo.
    call npm install --save express cors
    if errorlevel 1 (
        echo.
        echo ❌ Error al instalar dependencias
        echo.
        echo Asegúrate de tener Node.js instalado
        echo Descarga desde: https://nodejs.org
        pause
        exit /b 1
    )
)

echo.
echo ✅ Iniciando servidor...
echo.
echo 🌐 URL: http://localhost:3001
echo 📁 Datos: restricted-numbers.json
echo.
echo Presiona Ctrl+C para detener
echo.

node server-restricted.js

pause
