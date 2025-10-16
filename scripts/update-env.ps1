# Script para actualizar variables de entorno faltantes
Write-Host "Actualizando variables de entorno..." -ForegroundColor Green

# Leer el archivo actual
$envContent = Get-Content ".env.local" -Raw

# Agregar variables faltantes si no existen
if (-not ($envContent -match "ENCRYPTION_KEY=")) {
    $envContent += "`n# Encriptación de datos sensibles (PHI)`n"
    $envContent += "ENCRYPTION_KEY=`"x8PE16EcIhkkB1H23ymIdlMtX/Qh5Q2LD+e5xfcmd1U=`"`n"
}

if (-not ($envContent -match "INITIAL_ADMIN_EMAIL=")) {
    $envContent += "`n# Admin inicial`n"
    $envContent += "INITIAL_ADMIN_EMAIL=`"admin@kronusmed.com`"`n"
    $envContent += "INITIAL_ADMIN_PASSWORD=`"admin123`"`n"
    $envContent += "INITIAL_ADMIN_NAME=`"Administrador`"`n"
}

if (-not ($envContent -match "NODE_ENV=")) {
    $envContent += "`n# Configuración de seguridad`n"
    $envContent += "NODE_ENV=`"development`"`n"
    $envContent += "SECURE_COOKIES=`"false`"`n"
}

# Guardar el archivo actualizado
Set-Content ".env.local" $envContent

Write-Host "Variables de entorno actualizadas correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales de admin:" -ForegroundColor Yellow
Write-Host "Email: admin@kronusmed.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
