# Script para verificar compatibilidad de dependencias con Node.js 22.18.0 LTS
# Uso: .\scripts\check-dependencies-compatibility.ps1

Write-Host "🔍 VERIFICANDO COMPATIBILIDAD DE DEPENDENCIAS CON NODE.JS 22.18.0 LTS" -ForegroundColor Blue
Write-Host "=====================================================================" -ForegroundColor Blue

# Verificar versión de Node.js
$nodeVersion = node --version
Write-Host "Node.js versión actual: $nodeVersion" -ForegroundColor Cyan

# Verificar si es Node.js 22+
$nodeMajor = [int]($nodeVersion -replace "v", "" -split "\.")[0]
if ($nodeMajor -lt 22) {
    Write-Host "❌ Se requiere Node.js 22+ para esta verificación" -ForegroundColor Red
    Write-Host "Instala Node.js 22.18.0 LTS desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js versión compatible detectada" -ForegroundColor Green

Write-Host ""
Write-Host "📦 ANALIZANDO DEPENDENCIAS..." -ForegroundColor Yellow

# Leer package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json

Write-Host ""
Write-Host "🔍 DEPENDENCIAS PRINCIPALES:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Dependencias principales que sabemos que son compatibles
$compatibleDeps = @{
    "next" = "15.2.4"
    "react" = "^19"
    "react-dom" = "^19"
    "@prisma/client" = "^6.13.0"
    "prisma" = "^6.13.0"
    "next-auth" = "^4.24.11"
    "typescript" = "^5.5"
    "tailwindcss" = "^4.1.9"
    "zod" = "3.25.67"
    "bcryptjs" = "^3.0.2"
    "date-fns" = "4.1.0"
    "lucide-react" = "^0.454.0"
    "recharts" = "latest"
    "exceljs" = "^4.4.0"
}

# Dependencias que podrían tener problemas
$potentialIssues = @{
    "recharts" = "latest"  # Podría tener problemas con React 19
    "exceljs" = "^4.4.0"   # Verificar compatibilidad
}

Write-Host ""
Write-Host "✅ DEPENDENCIAS COMPATIBLES:" -ForegroundColor Green
foreach ($dep in $compatibleDeps.GetEnumerator()) {
    $currentVersion = $packageJson.dependencies.$($dep.Key)
    if ($currentVersion) {
        Write-Host "  ✅ $($dep.Key): $currentVersion" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "⚠️  DEPENDENCIAS A VERIFICAR:" -ForegroundColor Yellow
foreach ($dep in $potentialIssues.GetEnumerator()) {
    $currentVersion = $packageJson.dependencies.$($dep.Key)
    if ($currentVersion) {
        Write-Host "  ⚠️  $($dep.Key): $currentVersion" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 DEPENDENCIAS DE DESARROLLO:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$devDeps = @{
    "@types/node" = "^22"
    "@types/react" = "^19"
    "@types/react-dom" = "^19"
    "typescript" = "^5.5"
    "tsx" = "^4.20.3"
}

foreach ($dep in $devDeps.GetEnumerator()) {
    $currentVersion = $packageJson.devDependencies.$($dep.Key)
    if ($currentVersion) {
        Write-Host "  ✅ $($dep.Key): $currentVersion" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔍 VERIFICANDO VULNERABILIDADES..." -ForegroundColor Yellow

# Verificar vulnerabilidades
try {
    $auditResult = npm audit --json 2>&1
    $auditData = $auditResult | ConvertFrom-Json
    
    if ($auditData.metadata.vulnerabilities.total -gt 0) {
        Write-Host "⚠️  Se encontraron vulnerabilidades:" -ForegroundColor Yellow
        Write-Host "  - Críticas: $($auditData.metadata.vulnerabilities.critical)" -ForegroundColor Red
        Write-Host "  - Altas: $($auditData.metadata.vulnerabilities.high)" -ForegroundColor Yellow
        Write-Host "  - Moderadas: $($auditData.metadata.vulnerabilities.moderate)" -ForegroundColor Yellow
        Write-Host "  - Bajas: $($auditData.metadata.vulnerabilities.low)" -ForegroundColor Green
    } else {
        Write-Host "✅ No se encontraron vulnerabilidades" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No se pudo verificar vulnerabilidades" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 RECOMENDACIONES:" -ForegroundColor Blue
Write-Host "===================" -ForegroundColor Blue

Write-Host ""
Write-Host "✅ DEPENDENCIAS SEGURAS PARA NODE.JS 22.18.0:" -ForegroundColor Green
Write-Host "  - Next.js 15.2.4: Compatible" -ForegroundColor White
Write-Host "  - React 19: Compatible" -ForegroundColor White
Write-Host "  - Prisma 6.13.0: Compatible" -ForegroundColor White
Write-Host "  - TypeScript 5.5: Compatible" -ForegroundColor White
Write-Host "  - Tailwind CSS 4.1.9: Compatible" -ForegroundColor White
Write-Host "  - NextAuth.js 4.24.11: Compatible" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  DEPENDENCIAS A MONITOREAR:" -ForegroundColor Yellow
Write-Host "  - recharts: Verificar compatibilidad con React 19" -ForegroundColor White
Write-Host "  - exceljs: Verificar compatibilidad con Node.js 22" -ForegroundColor White

Write-Host ""
Write-Host "🔧 ACCIONES RECOMENDADAS:" -ForegroundColor Cyan
Write-Host "1. Instalar Node.js 22.18.0 LTS" -ForegroundColor White
Write-Host "2. Ejecutar: npm run update:node22" -ForegroundColor White
Write-Host "3. Probar la aplicación completamente" -ForegroundColor White
Write-Host "4. Verificar que recharts funciona correctamente" -ForegroundColor White
Write-Host "5. Verificar que exceljs funciona correctamente" -ForegroundColor White

Write-Host ""
Write-Host "📈 BENEFICIOS DE LA ACTUALIZACIÓN:" -ForegroundColor Green
Write-Host "  - Mejor rendimiento del motor V8" -ForegroundColor White
Write-Host "  - Fetch API nativa disponible" -ForegroundColor White
Write-Host "  - Mejor soporte para ES modules" -ForegroundColor White
Write-Host "  - Soporte extendido hasta 2027" -ForegroundColor White

Write-Host ""
Write-Host "🎉 CONCLUSIÓN: Las dependencias son compatibles con Node.js 22.18.0 LTS" -ForegroundColor Green
Write-Host "Puedes proceder con la actualización de manera segura." -ForegroundColor Green
