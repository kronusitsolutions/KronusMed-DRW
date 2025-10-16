# Script para verificar compatibilidad con Node.js 22
# Ejecutar después de actualizar a Node.js 22

Write-Host "=== Verificación de Compatibilidad con Node.js 22 ===" -ForegroundColor Green

# Verificar versión de Node.js
Write-Host "Verificando versión de Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor White

if ($nodeVersion -notmatch "v22\.") {
    Write-Host "ADVERTENCIA: No estás usando Node.js 22" -ForegroundColor Red
    Write-Host "Ejecuta primero: nvm use 22" -ForegroundColor Yellow
}

# Verificar versión de npm
Write-Host "Verificando versión de npm..." -ForegroundColor Cyan
$npmVersion = npm --version
Write-Host "npm: $npmVersion" -ForegroundColor White

# Verificar versión de pnpm
Write-Host "Verificando versión de pnpm..." -ForegroundColor Cyan
$pnpmVersion = pnpm --version
Write-Host "pnpm: $pnpmVersion" -ForegroundColor White

# Verificar dependencias desactualizadas
Write-Host "Verificando dependencias desactualizadas..." -ForegroundColor Cyan
pnpm outdated

# Verificar vulnerabilidades de seguridad
Write-Host "Verificando vulnerabilidades de seguridad..." -ForegroundColor Cyan
pnpm audit

# Verificar que TypeScript compila
Write-Host "Verificando compilación de TypeScript..." -ForegroundColor Cyan
pnpm run typecheck

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript compila correctamente" -ForegroundColor Green
} else {
    Write-Host "✗ Error en compilación de TypeScript" -ForegroundColor Red
}

# Verificar que Prisma genera el cliente
Write-Host "Verificando generación de cliente Prisma..." -ForegroundColor Cyan
pnpm run db:generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Cliente Prisma generado correctamente" -ForegroundColor Green
} else {
    Write-Host "✗ Error generando cliente Prisma" -ForegroundColor Red
}

# Verificar linting
Write-Host "Verificando linting..." -ForegroundColor Cyan
pnpm run lint

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Linting pasado correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠ Advertencias de linting encontradas" -ForegroundColor Yellow
}

Write-Host "=== Verificación completada ===" -ForegroundColor Green
Write-Host "Si todos los checks pasaron, tu aplicación está lista para Node.js 22" -ForegroundColor Green
