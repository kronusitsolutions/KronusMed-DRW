# Script para probar la configuración de Node.js 22
# Ejecutar después de la actualización para verificar que todo funciona

Write-Host "=== Prueba de Configuración Node.js 22 ===" -ForegroundColor Green

# Verificar versión de Node.js
Write-Host "1. Verificando versión de Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
if ($nodeVersion -match "v22\.") {
    Write-Host "✓ Node.js $nodeVersion detectado" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js 22 no detectado. Versión actual: $nodeVersion" -ForegroundColor Red
    Write-Host "Ejecuta: nvm use 22" -ForegroundColor Yellow
    exit 1
}

# Verificar pnpm
Write-Host "2. Verificando pnpm..." -ForegroundColor Cyan
try {
    $pnpmVersion = pnpm --version
    Write-Host "✓ pnpm $pnpmVersion detectado" -ForegroundColor Green
} catch {
    Write-Host "✗ pnpm no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm@latest
}

# Verificar dependencias
Write-Host "3. Verificando dependencias..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    pnpm install
}

# Verificar Prisma
Write-Host "4. Verificando Prisma..." -ForegroundColor Cyan
try {
    pnpm run db:generate
    Write-Host "✓ Cliente Prisma generado correctamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error generando cliente Prisma" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Verificar TypeScript
Write-Host "5. Verificando TypeScript..." -ForegroundColor Cyan
try {
    pnpm run typecheck
    Write-Host "✓ TypeScript compila correctamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error en compilación TypeScript" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Verificar linting
Write-Host "6. Verificando linting..." -ForegroundColor Cyan
try {
    pnpm run lint
    Write-Host "✓ Linting pasado correctamente" -ForegroundColor Green
} catch {
    Write-Host "⚠ Advertencias de linting encontradas" -ForegroundColor Yellow
}

# Verificar construcción
Write-Host "7. Verificando construcción..." -ForegroundColor Cyan
try {
    Write-Host "Construyendo aplicación (modo de prueba)..." -ForegroundColor Yellow
    $env:NODE_ENV = "test"
    pnpm run build
    Write-Host "✓ Aplicación construida correctamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error en construcción" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

# Verificar archivos de configuración
Write-Host "8. Verificando archivos de configuración..." -ForegroundColor Cyan

# Verificar package.json
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.engines.node -match "22\.") {
        Write-Host "✓ package.json configurado para Node.js 22" -ForegroundColor Green
    } else {
        Write-Host "✗ package.json no configurado para Node.js 22" -ForegroundColor Red
    }
} else {
    Write-Host "✗ package.json no encontrado" -ForegroundColor Red
}

# Verificar Dockerfile
if (Test-Path "Dockerfile") {
    $dockerfile = Get-Content "Dockerfile"
    if ($dockerfile -match "node:22\.") {
        Write-Host "✓ Dockerfile configurado para Node.js 22" -ForegroundColor Green
    } else {
        Write-Host "✗ Dockerfile no configurado para Node.js 22" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Dockerfile no encontrado" -ForegroundColor Red
}

Write-Host "=== Prueba Completada ===" -ForegroundColor Green
Write-Host "Si todos los checks pasaron, tu aplicación está lista para Node.js 22" -ForegroundColor Green
Write-Host "Puedes ejecutar 'pnpm run dev' para iniciar el servidor de desarrollo" -ForegroundColor Cyan
