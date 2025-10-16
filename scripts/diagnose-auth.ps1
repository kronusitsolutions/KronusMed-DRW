# Script para diagnosticar problemas de autenticación
Write-Host "🔍 DIAGNÓSTICO DE AUTENTICACIÓN KRONUSMED" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

Write-Host ""
Write-Host "📋 VERIFICANDO CONFIGURACIÓN DE AUTENTICACIÓN..." -ForegroundColor Yellow

# Verificar variables de entorno críticas
Write-Host ""
Write-Host "🔑 VARIABLES DE ENTORNO:" -ForegroundColor Cyan

$envVars = @(
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET", 
    "ENCRYPTION_KEY",
    "DATABASE_URL",
    "INITIAL_ADMIN_EMAIL",
    "INITIAL_ADMIN_PASSWORD"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        if ($var -like "*SECRET*" -or $var -like "*KEY*" -or $var -like "*PASSWORD*") {
            Write-Host "✅ $var = [HIDDEN]" -ForegroundColor Green
        } else {
            Write-Host "✅ $var = $value" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ $var = NO DEFINIDA" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🌐 VERIFICANDO CONECTIVIDAD..." -ForegroundColor Yellow

# Verificar si la aplicación está corriendo
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Aplicación respondiendo en http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Aplicación no responde en http://localhost:3000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔧 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN..." -ForegroundColor Yellow

# Verificar archivos críticos
$criticalFiles = @(
    "lib/auth.ts",
    "lib/prisma.ts", 
    "prisma/schema.prisma",
    ".env.local"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 CREDENCIALES DE PRUEBA:" -ForegroundColor Cyan
Write-Host "Email: admin@kronusmed.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White

Write-Host ""
Write-Host "🚨 POSIBLES PROBLEMAS Y SOLUCIONES:" -ForegroundColor Red

Write-Host ""
Write-Host "1. PROBLEMA: Variables de entorno no definidas" -ForegroundColor Yellow
Write-Host "   SOLUCIÓN: Ejecutar scripts/update-env.ps1" -ForegroundColor White

Write-Host ""
Write-Host "2. PROBLEMA: Base de datos no inicializada" -ForegroundColor Yellow
Write-Host "   SOLUCIÓN: Verificar que PostgreSQL esté corriendo" -ForegroundColor White

Write-Host ""
Write-Host "3. PROBLEMA: Usuario admin no creado" -ForegroundColor Yellow
Write-Host "   SOLUCIÓN: Ejecutar script de creación de admin" -ForegroundColor White

Write-Host ""
Write-Host "4. PROBLEMA: Configuración de NextAuth incorrecta" -ForegroundColor Yellow
Write-Host "   SOLUCIÓN: Verificar NEXTAUTH_SECRET y NEXTAUTH_URL" -ForegroundColor White

Write-Host ""
Write-Host "🔧 COMANDOS DE DIAGNÓSTICO:" -ForegroundColor Cyan
Write-Host "1. Verificar logs: docker-compose logs app" -ForegroundColor White
Write-Host "2. Verificar base de datos: docker-compose logs postgres" -ForegroundColor White
Write-Host "3. Reiniciar servicios: docker-compose restart" -ForegroundColor White
