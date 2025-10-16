# Script para configurar autenticación en Railway
# Ejecutar: .\scripts\fix-railway-auth.ps1

Write-Host "🔧 Configurando autenticación en Railway..." -ForegroundColor Cyan

# Verificar Railway CLI
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI no está instalado" -ForegroundColor Red
    Write-Host "Instalar con: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Verificar login
try {
    $user = railway whoami
    Write-Host "✅ Logeado como: $user" -ForegroundColor Green
} catch {
    Write-Host "❌ No estás logueado" -ForegroundColor Red
    Write-Host "Ejecutar: railway login" -ForegroundColor Yellow
    exit 1
}

# Obtener URL de la app
Write-Host "`n🔍 Obteniendo URL de la app..." -ForegroundColor Cyan
try {
    $status = railway status --json | ConvertFrom-Json
    $appUrl = $status.service.url
    Write-Host "✅ URL de la app: $appUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ No se pudo obtener la URL de la app" -ForegroundColor Red
    Write-Host "Verificar que estés en el proyecto correcto" -ForegroundColor Yellow
    exit 1
}

# Generar NEXTAUTH_SECRET si no existe
Write-Host "`n🔑 Generando NEXTAUTH_SECRET..." -ForegroundColor Cyan
$nextAuthSecret = ""
try {
    $currentSecret = railway variables get NEXTAUTH_SECRET 2>$null
    if ($currentSecret) {
        Write-Host "✅ NEXTAUTH_SECRET ya está configurado" -ForegroundColor Green
        $nextAuthSecret = $currentSecret
    } else {
        # Generar nuevo secret
        $newSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
        Write-Host "🔧 Generando nuevo NEXTAUTH_SECRET..." -ForegroundColor Yellow
        railway variables set NEXTAUTH_SECRET=$newSecret
        $nextAuthSecret = $newSecret
        Write-Host "✅ NEXTAUTH_SECRET configurado" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error al configurar NEXTAUTH_SECRET" -ForegroundColor Red
}

# Configurar NEXTAUTH_URL
Write-Host "`n🌐 Configurando NEXTAUTH_URL..." -ForegroundColor Cyan
try {
    railway variables set NEXTAUTH_URL=$appUrl
    Write-Host "✅ NEXTAUTH_URL configurado: $appUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al configurar NEXTAUTH_URL" -ForegroundColor Red
}

# Configurar SECURE_COOKIES
Write-Host "`n🍪 Configurando SECURE_COOKIES..." -ForegroundColor Cyan
try {
    railway variables set SECURE_COOKIES=true
    Write-Host "✅ SECURE_COOKIES configurado: true" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al configurar SECURE_COOKIES" -ForegroundColor Red
}

# Configurar NODE_ENV
Write-Host "`n⚙️ Configurando NODE_ENV..." -ForegroundColor Cyan
try {
    railway variables set NODE_ENV=production
    Write-Host "✅ NODE_ENV configurado: production" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al configurar NODE_ENV" -ForegroundColor Red
}

# Verificar variables configuradas
Write-Host "`n📋 Variables configuradas:" -ForegroundColor Cyan
railway variables

Write-Host "`n🔍 Para verificar la configuración:" -ForegroundColor Cyan
Write-Host "1. Visitar: $appUrl/api/auth/diagnose" -ForegroundColor White
Write-Host "2. Verificar que no haya errores" -ForegroundColor White
Write-Host "3. Intentar iniciar sesión" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "- Reiniciar la aplicación después de cambiar variables" -ForegroundColor White
Write-Host "- Verificar que DATABASE_URL esté configurada" -ForegroundColor White
Write-Host "- Asegurar que haya usuarios en la base de datos" -ForegroundColor White

Write-Host "`n✅ Configuración completada" -ForegroundColor Green
