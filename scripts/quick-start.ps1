# Script para inicio rápido de la aplicación
Write-Host "🚀 INICIANDO APLICACIÓN KRONUSMED" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

Write-Host ""
Write-Host "📋 VERIFICANDO CONFIGURACIÓN..." -ForegroundColor Yellow

# Verificar Node.js
$nodeVersion = node --version
Write-Host "Node.js versión: $nodeVersion" -ForegroundColor Cyan

# Verificar si .env.local existe
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 INICIANDO SERVIDOR DE DESARROLLO..." -ForegroundColor Yellow
Write-Host ""

# Intentar iniciar con npm
try {
    Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Gray
    npm run dev
} catch {
    Write-Host "❌ Error al iniciar con npm" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 DIAGNÓSTICO:" -ForegroundColor Yellow
    Write-Host "1. Verificar que Node.js esté instalado" -ForegroundColor White
    Write-Host "2. Verificar que las dependencias estén instaladas" -ForegroundColor White
    Write-Host "3. Verificar que la base de datos esté funcionando" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 SOLUCIONES:" -ForegroundColor Cyan
    Write-Host "1. Instalar Node.js 22.18.0 LTS desde https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Ejecutar: npm install --legacy-peer-deps" -ForegroundColor White
    Write-Host "3. Ejecutar: npm run db:create-initial-admin" -ForegroundColor White
}
