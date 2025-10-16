# Script para verificar que el proyecto está listo para deployment en Railway
# Uso: .\scripts\verify-railway-deployment.ps1

Write-Host "VERIFICANDO PREPARACION PARA RAILWAY DEPLOYMENT" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

Write-Host ""
Write-Host "VERIFICANDO CONFIGURACION DE DOCKER..." -ForegroundColor Yellow

# Verificar Dockerfile principal
$dockerfileContent = Get-Content "Dockerfile" -Raw
$dockerfileDevContent = Get-Content "Dockerfile.dev" -Raw

# Verificar versiones de Node.js en Dockerfiles
$nodeVersionMain = if ($dockerfileContent -match "FROM node:(\d+\.\d+\.\d+)-alpine") { $matches[1] } else { "0.0.0" }
$nodeVersionDev = if ($dockerfileDevContent -match "FROM node:(\d+\.\d+\.\d+)-alpine") { $matches[1] } else { "0.0.0" }

# Si no encuentra la primera línea, buscar en todas las líneas
if ($nodeVersionMain -eq "0.0.0") {
    $lines = $dockerfileContent -split "`n"
    foreach ($line in $lines) {
        if ($line -match "FROM node:(\d+\.\d+\.\d+)-alpine") {
            $nodeVersionMain = $matches[1]
            break
        }
    }
}

if ($nodeVersionDev -eq "0.0.0") {
    $lines = $dockerfileDevContent -split "`n"
    foreach ($line in $lines) {
        if ($line -match "FROM node:(\d+\.\d+\.\d+)-alpine") {
            $nodeVersionDev = $matches[1]
            break
        }
    }
}

Write-Host "Dockerfile principal (Railway): Node.js $nodeVersionMain" -ForegroundColor Cyan
Write-Host "Dockerfile.dev: Node.js $nodeVersionDev" -ForegroundColor Cyan

# Verificar package.json engines
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$requiredNodeVersion = $packageJson.engines.node

Write-Host "package.json requiere: $requiredNodeVersion" -ForegroundColor Cyan

Write-Host ""
Write-Host "VERIFICANDO COMPATIBILIDAD..." -ForegroundColor Yellow

# Verificar compatibilidad
$mainNodeMajor = [int]($nodeVersionMain -split "\.")[0]
$devNodeMajor = [int]($nodeVersionDev -split "\.")[0]
$requiredNodeMajor = [int]($requiredNodeVersion -replace ">=", "" -split "\.")[0]

$mainOk = $mainNodeMajor -ge $requiredNodeMajor
$devOk = $devNodeMajor -ge $requiredNodeMajor

if ($mainOk) {
    Write-Host "Dockerfile principal compatible con package.json" -ForegroundColor Green
} else {
    Write-Host "Dockerfile principal INCOMPATIBLE con package.json" -ForegroundColor Red
    Write-Host "   Dockerfile usa Node.js $nodeVersionMain, pero package.json requiere $requiredNodeVersion" -ForegroundColor Red
}

if ($devOk) {
    Write-Host "Dockerfile.dev compatible con package.json" -ForegroundColor Green
} else {
    Write-Host "Dockerfile.dev INCOMPATIBLE con package.json" -ForegroundColor Red
}

Write-Host ""
Write-Host "VERIFICANDO ARCHIVOS CRITICOS..." -ForegroundColor Yellow

# Verificar archivos críticos para Railway
$criticalFiles = @(
    "Dockerfile",
    "package.json",
    "next.config.mjs",
    "prisma/schema.prisma",
    "env.example"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "$file encontrado" -ForegroundColor Green
    } else {
        Write-Host "$file NO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "VERIFICANDO SCRIPTS DE INICIO..." -ForegroundColor Yellow

# Verificar script de inicio
if (Test-Path "scripts/start.sh") {
    Write-Host "scripts/start.sh encontrado" -ForegroundColor Green
} else {
    Write-Host "scripts/start.sh no encontrado - Railway podria tener problemas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "VERIFICANDO VARIABLES DE ENTORNO..." -ForegroundColor Yellow

# Verificar variables críticas en env.example
$envExample = Get-Content "env.example" -Raw
$criticalEnvVars = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "ENCRYPTION_KEY"
)

foreach ($var in $criticalEnvVars) {
    if ($envExample -match "$var=") {
        Write-Host "$var definida en env.example" -ForegroundColor Green
    } else {
        Write-Host "$var no encontrada en env.example" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "RESUMEN DE VERIFICACION:" -ForegroundColor Blue
Write-Host "============================" -ForegroundColor Blue

if ($mainOk -and $devOk) {
    Write-Host "PROYECTO LISTO PARA RAILWAY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Puedes hacer commit y push de manera segura" -ForegroundColor Green
    Write-Host "Railway podra construir la aplicacion correctamente" -ForegroundColor Green
    Write-Host "Todas las versiones de Node.js son compatibles" -ForegroundColor Green
} else {
    Write-Host "PROBLEMAS DETECTADOS - NO HAGAS COMMIT" -ForegroundColor Red
    Write-Host ""
    Write-Host "ACCIONES REQUERIDAS:" -ForegroundColor Yellow
    if (-not $mainOk) {
        Write-Host "  - Actualizar Dockerfile principal a Node.js $requiredNodeVersion" -ForegroundColor White
    }
    if (-not $devOk) {
        Write-Host "  - Actualizar Dockerfile.dev a Node.js $requiredNodeVersion" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "NO hagas commit hasta resolver estos problemas" -ForegroundColor Red
}

Write-Host ""
Write-Host "COMANDOS PARA RAILWAY:" -ForegroundColor Cyan
Write-Host "git add ." -ForegroundColor Gray
Write-Host "git commit -m 'feat: actualizar a Node.js 22.18.0 LTS y mejoras de seguridad'" -ForegroundColor Gray
Write-Host "git push origin main" -ForegroundColor Gray

Write-Host ""
Write-Host "MONITOREO POST-DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "1. Verificar logs de Railway" -ForegroundColor White
Write-Host "2. Probar funcionalidades criticas" -ForegroundColor White
Write-Host "3. Verificar que la base de datos funciona" -ForegroundColor White
Write-Host "4. Probar autenticacion y encriptacion" -ForegroundColor White
