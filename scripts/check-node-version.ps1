# Script para verificar y actualizar Node.js
# Ejecutar como administrador en PowerShell

Write-Host "=== Verificación de Versión de Node.js ===" -ForegroundColor Green

# Verificar versión actual
$currentVersion = node --version
Write-Host "Versión actual de Node.js: $currentVersion" -ForegroundColor Cyan

# Extraer número de versión
$versionNumber = [int]($currentVersion -replace 'v(\d+)\..*', '$1')
$minorVersion = [int]($currentVersion -replace 'v\d+\.(\d+)\..*', '$1')

Write-Host "Versión mayor: $versionNumber" -ForegroundColor White
Write-Host "Versión menor: $minorVersion" -ForegroundColor White

# Verificar si cumple con los requisitos
$meetsRequirements = $false

if ($versionNumber -ge 22) {
    $meetsRequirements = $true
    Write-Host "✓ Node.js 22+ detectado" -ForegroundColor Green
} elseif ($versionNumber -eq 18 -and $minorVersion -ge 18) {
    $meetsRequirements = $true
    Write-Host "✓ Node.js 18.18+ detectado" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js no cumple con los requisitos" -ForegroundColor Red
    Write-Host "Requerido: Node.js >= 18.18 o >= 22.0" -ForegroundColor Yellow
    Write-Host "Actual: $currentVersion" -ForegroundColor Yellow
}

if (-not $meetsRequirements) {
    Write-Host "`n=== Instrucciones para Actualizar Node.js ===" -ForegroundColor Yellow
    
    Write-Host "1. Instalar nvm-windows si no lo tienes:" -ForegroundColor Cyan
    Write-Host "   https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor White
    
    Write-Host "`n2. Después de instalar nvm-windows, ejecutar:" -ForegroundColor Cyan
    Write-Host "   nvm install 22" -ForegroundColor White
    Write-Host "   nvm use 22" -ForegroundColor White
    
    Write-Host "`n3. Verificar la instalación:" -ForegroundColor Cyan
    Write-Host "   node --version" -ForegroundColor White
    
    Write-Host "`n4. Instalar dependencias:" -ForegroundColor Cyan
    Write-Host "   npm install --legacy-peer-deps" -ForegroundColor White
    
    Write-Host "`n5. Probar la aplicación:" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
} else {
    Write-Host "`n=== Node.js está listo ===" -ForegroundColor Green
    Write-Host "Puedes proceder con la instalación de dependencias:" -ForegroundColor Cyan
    Write-Host "npm install --legacy-peer-deps" -ForegroundColor White
}

Write-Host "`n=== Información Adicional ===" -ForegroundColor Blue
Write-Host "Versión de npm: $(npm --version)" -ForegroundColor White
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor White
