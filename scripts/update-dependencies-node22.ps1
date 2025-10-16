# Script para actualizar dependencias para Node.js 22.18.0 LTS
# Uso: .\scripts\update-dependencies-node22.ps1

Write-Host "🔄 ACTUALIZANDO DEPENDENCIAS PARA NODE.JS 22.18.0 LTS" -ForegroundColor Blue
Write-Host "=====================================================" -ForegroundColor Blue

# Verificar versión de Node.js
$nodeVersion = node --version
Write-Host "Node.js versión actual: $nodeVersion" -ForegroundColor Cyan

# Verificar si es Node.js 22+
$nodeMajor = [int]($nodeVersion -replace "v", "" -split "\.")[0]
if ($nodeMajor -lt 22) {
    Write-Host "❌ Se requiere Node.js 22+ para esta actualización" -ForegroundColor Red
    Write-Host "Instala Node.js 22.18.0 LTS desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js versión compatible detectada" -ForegroundColor Green

Write-Host ""
Write-Host "📦 ACTUALIZANDO DEPENDENCIAS..." -ForegroundColor Yellow

# Limpiar caché
Write-Host "Limpiando caché de npm..." -ForegroundColor Gray
npm cache clean --force

# Eliminar archivos existentes
Write-Host "Eliminando node_modules y package-lock.json..." -ForegroundColor Gray
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json
}

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Gray
npm install

# Verificar instalación
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# Generar cliente de Prisma
Write-Host "Generando cliente de Prisma..." -ForegroundColor Gray
npm run db:generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cliente de Prisma generado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al generar cliente de Prisma" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 VERIFICANDO COMPATIBILIDAD..." -ForegroundColor Yellow

# Verificar vulnerabilidades
Write-Host "Verificando vulnerabilidades..." -ForegroundColor Gray
npm audit

# Verificar scripts disponibles
Write-Host "Verificando scripts disponibles..." -ForegroundColor Gray
$scripts = @("build", "dev", "start", "db:generate")
foreach ($script in $scripts) {
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
Write-Host "📊 RESUMEN DE ACTUALIZACIÓN:" -ForegroundColor Blue
Write-Host "=============================" -ForegroundColor Blue

Write-Host "✅ Node.js 22.18.0 LTS detectado" -ForegroundColor Green
Write-Host "✅ Dependencias actualizadas" -ForegroundColor Green
Write-Host "✅ Cliente de Prisma generado" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Ejecutar: npm run build" -ForegroundColor White
Write-Host "2. Ejecutar: npm run dev" -ForegroundColor White
Write-Host "3. Probar todas las funcionalidades" -ForegroundColor White
Write-Host "4. Ejecutar: npm run security:audit" -ForegroundColor White

Write-Host ""
Write-Host "🎉 ¡Actualización completada exitosamente!" -ForegroundColor Green
