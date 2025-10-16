# Script para verificar y configurar variables de entorno en Railway
# Ejecutar: .\scripts\verify-railway-credentials.ps1

Write-Host "🔍 Verificando configuración de Railway..." -ForegroundColor Cyan

# Verificar si railway CLI está instalado
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI instalado: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI no está instalado" -ForegroundColor Red
    Write-Host "Instalar con: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar login
try {
    $user = railway whoami
    Write-Host "✅ Logeado en Railway como: $user" -ForegroundColor Green
} catch {
    Write-Host "❌ No estás logueado en Railway" -ForegroundColor Red
    Write-Host "Ejecutar: railway login" -ForegroundColor Yellow
    exit 1
}

# Listar proyectos
Write-Host "`n📋 Proyectos disponibles:" -ForegroundColor Cyan
railway projects

Write-Host "`n🔧 Variables de entorno requeridas:" -ForegroundColor Cyan
Write-Host "1. NEXTAUTH_URL=https://tu-app.railway.app" -ForegroundColor Yellow
Write-Host "2. NEXTAUTH_SECRET=tu-secret-base64" -ForegroundColor Yellow
Write-Host "3. DATABASE_URL=postgresql://..." -ForegroundColor Yellow
Write-Host "4. ENCRYPTION_KEY=tu-encryption-key" -ForegroundColor Yellow
Write-Host "5. SECURE_COOKIES=true" -ForegroundColor Yellow

Write-Host "`n📝 Comandos para configurar:" -ForegroundColor Cyan
Write-Host "# Obtener URL de tu app:" -ForegroundColor White
Write-Host "railway status" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "# Configurar variables:" -ForegroundColor White
Write-Host "railway variables set NEXTAUTH_URL=https://tu-app.railway.app" -ForegroundColor Gray
Write-Host "railway variables set NEXTAUTH_SECRET=tu-secret-base64" -ForegroundColor Gray
Write-Host "railway variables set SECURE_COOKIES=true" -ForegroundColor Gray
Write-Host "railway variables set NODE_ENV=production" -ForegroundColor Gray

Write-Host "`n🔍 Para verificar variables actuales:" -ForegroundColor Cyan
Write-Host "railway variables" -ForegroundColor Gray

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "- NEXTAUTH_URL debe ser la URL real de tu app en Railway" -ForegroundColor White
Write-Host "- NEXTAUTH_SECRET debe ser una cadena base64 de 32 bytes" -ForegroundColor White
Write-Host "- SECURE_COOKIES debe ser 'true' en producción" -ForegroundColor White
Write-Host "- Verificar que DATABASE_URL esté configurada correctamente" -ForegroundColor White
