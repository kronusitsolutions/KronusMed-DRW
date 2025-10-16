# Script de migración a Node.js 22.18.0 LTS
# Uso: .\scripts\migrate-to-node18.ps1

Write-Host "🔄 INICIANDO MIGRACIÓN A NODE.JS 22.18.0 LTS" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# Verificar versión actual
$currentNodeVersion = node --version
$currentNpmVersion = npm --version

Write-Host "Versión actual de Node.js: $currentNodeVersion" -ForegroundColor Yellow
Write-Host "Versión actual de npm: $currentNpmVersion" -ForegroundColor Yellow

# Verificar si ya está en Node.js 22+
if ($currentNodeVersion -match "v22\." -or $currentNodeVersion -match "v23\." -or $currentNodeVersion -match "v24\.") {
    Write-Host "✅ Ya estás usando Node.js 22+ o superior" -ForegroundColor Green
    Write-Host "No es necesaria la migración" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📋 PASOS PARA MIGRAR A NODE.JS 22.18.0 LTS:" -ForegroundColor Cyan
Write-Host "1. Descargar e instalar Node.js 22.18.0 LTS desde https://nodejs.org/" -ForegroundColor White
Write-Host "2. Reiniciar la terminal/PowerShell" -ForegroundColor White
Write-Host "3. Verificar la instalación" -ForegroundColor White
Write-Host "4. Limpiar caché de npm" -ForegroundColor White
Write-Host "5. Reinstalar dependencias" -ForegroundColor White
Write-Host "6. Probar la aplicación" -ForegroundColor White

Write-Host ""
Write-Host "🔧 COMANDOS A EJECUTAR DESPUÉS DE INSTALAR NODE.JS 22.18.0 LTS:" -ForegroundColor Green

Write-Host ""
Write-Host "# 1. Verificar versión:" -ForegroundColor Yellow
Write-Host "node --version" -ForegroundColor Gray
Write-Host "npm --version" -ForegroundColor Gray

Write-Host ""
Write-Host "# 2. Limpiar caché:" -ForegroundColor Yellow
Write-Host "npm cache clean --force" -ForegroundColor Gray

Write-Host ""
Write-Host "# 3. Eliminar node_modules y package-lock.json:" -ForegroundColor Yellow
Write-Host "Remove-Item -Recurse -Force node_modules" -ForegroundColor Gray
Write-Host "Remove-Item package-lock.json" -ForegroundColor Gray

Write-Host ""
Write-Host "# 4. Reinstalar dependencias:" -ForegroundColor Yellow
Write-Host "npm install" -ForegroundColor Gray

Write-Host ""
Write-Host "# 5. Generar Prisma client:" -ForegroundColor Yellow
Write-Host "npm run db:generate" -ForegroundColor Gray

Write-Host ""
Write-Host "# 6. Probar la aplicación:" -ForegroundColor Yellow
Write-Host "npm run build" -ForegroundColor Gray
Write-Host "npm run dev" -ForegroundColor Gray

Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "- Haz backup de tu proyecto antes de la migración" -ForegroundColor White
Write-Host "- Asegúrate de tener Node.js 22.18.0 LTS instalado" -ForegroundColor White
Write-Host "- Reinicia la terminal después de instalar Node.js" -ForegroundColor White

Write-Host ""
Write-Host "📚 RECURSOS:" -ForegroundColor Cyan
Write-Host "- Descargar Node.js 22.18.0 LTS: https://nodejs.org/" -ForegroundColor White
Write-Host "- Documentación de migración: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/" -ForegroundColor White

Write-Host ""
Write-Host "¿Necesitas ayuda con algún paso específico?" -ForegroundColor Green
