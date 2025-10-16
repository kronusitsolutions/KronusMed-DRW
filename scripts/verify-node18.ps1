# Script de verificación post-migración a Node.js 22.18.0 LTS
# Uso: .\scripts\verify-node18.ps1

Write-Host "🔍 VERIFICANDO MIGRACIÓN A NODE.JS 22.18.0 LTS" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Blue

# Verificar versión de Node.js
$nodeVersion = node --version
Write-Host "Node.js versión: $nodeVersion" -ForegroundColor Cyan

# Verificar versión de npm
$npmVersion = npm --version
Write-Host "npm versión: $npmVersion" -ForegroundColor Cyan

# Verificar si cumple con los requisitos
$nodeMajor = [int]($nodeVersion -replace "v", "" -split "\.")[0]
$npmMajor = [int]($npmVersion -split "\.")[0]

$nodeOk = $nodeMajor -ge 22
$npmOk = $npmMajor -ge 10

Write-Host ""
if ($nodeOk) {
    Write-Host "✅ Node.js versión compatible (>=22)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js versión incompatible (<22)" -ForegroundColor Red
}

if ($npmOk) {
    Write-Host "✅ npm versión compatible (>=10)" -ForegroundColor Green
} else {
    Write-Host "❌ npm versión incompatible (<10)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📦 VERIFICANDO DEPENDENCIAS..." -ForegroundColor Yellow

# Verificar si node_modules existe
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules no encontrado - ejecuta 'npm install'" -ForegroundColor Red
}

# Verificar si package-lock.json existe
if (Test-Path "package-lock.json") {
    Write-Host "✅ package-lock.json encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  package-lock.json no encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 VERIFICANDO CONFIGURACIÓN..." -ForegroundColor Yellow

# Verificar archivos críticos
$criticalFiles = @(
    "package.json",
    "next.config.mjs",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "prisma/schema.prisma"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file no encontrado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🚀 VERIFICANDO SCRIPTS..." -ForegroundColor Yellow

# Verificar scripts críticos
$criticalScripts = @(
    "build",
    "dev",
    "start",
    "db:generate"
)

foreach ($script in $criticalScripts) {
    try {
        $result = npm run $script --dry-run 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Script '$script' disponible" -ForegroundColor Green
        } else {
            Write-Host "❌ Script '$script' con problemas" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Script '$script' no disponible" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔒 VERIFICANDO SEGURIDAD..." -ForegroundColor Yellow

# Verificar archivos de seguridad
$securityFiles = @(
    "lib/encryption.ts",
    "lib/security.ts",
    "lib/logger.ts",
    "lib/sanitizer.ts",
    "middleware.ts",
    ".env.local"
)

foreach ($file in $securityFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $file no encontrado" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 RESUMEN DE VERIFICACIÓN:" -ForegroundColor Blue
Write-Host "============================" -ForegroundColor Blue

if ($nodeOk -and $npmOk) {
    Write-Host "🎉 ¡Migración a Node.js 22.18.0 LTS exitosa!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Ejecutar: npm run build" -ForegroundColor White
    Write-Host "2. Ejecutar: npm run dev" -ForegroundColor White
    Write-Host "3. Probar todas las funcionalidades" -ForegroundColor White
    Write-Host "4. Ejecutar: npm run security:audit" -ForegroundColor White
} else {
    Write-Host "❌ La migración no está completa" -ForegroundColor Red
    Write-Host "Revisa los errores arriba y completa la migración" -ForegroundColor Red
}

Write-Host ""
Write-Host "¿Necesitas ayuda con algún paso?" -ForegroundColor Green
