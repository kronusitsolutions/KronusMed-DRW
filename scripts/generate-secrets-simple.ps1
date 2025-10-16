# Script simple para generar claves seguras
Write-Host "Generando claves seguras..." -ForegroundColor Green

# Generar NEXTAUTH_SECRET
$bytes1 = New-Object Byte[] 32
$rng1 = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng1.GetBytes($bytes1)
$NEXTAUTH_SECRET = [Convert]::ToBase64String($bytes1)

# Generar ENCRYPTION_KEY
$bytes2 = New-Object Byte[] 32
$rng2 = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng2.GetBytes($bytes2)
$ENCRYPTION_KEY = [Convert]::ToBase64String($bytes2)

Write-Host "NEXTAUTH_SECRET generado" -ForegroundColor Green
Write-Host "ENCRYPTION_KEY generado" -ForegroundColor Green

# Crear archivo .env.local si no existe
if (-not (Test-Path ".env.local")) {
    Write-Host "Creando archivo .env.local..." -ForegroundColor Green
    Copy-Item "env.example" ".env.local"
}

# Actualizar .env.local con las nuevas claves
Write-Host "Actualizando .env.local con las nuevas claves..." -ForegroundColor Green

$envContent = Get-Content ".env.local" -Raw

# Actualizar NEXTAUTH_SECRET
$envContent = $envContent -replace 'NEXTAUTH_SECRET=.*', "NEXTAUTH_SECRET=`"$NEXTAUTH_SECRET`""

# Actualizar ENCRYPTION_KEY
$envContent = $envContent -replace 'ENCRYPTION_KEY=.*', "ENCRYPTION_KEY=`"$ENCRYPTION_KEY`""

# Guardar archivo actualizado
Set-Content ".env.local" $envContent

Write-Host "Claves generadas y guardadas en .env.local" -ForegroundColor Green

# Mostrar resumen
Write-Host ""
Write-Host "RESUMEN DE CLAVES GENERADAS:" -ForegroundColor Blue
Write-Host "=================================="
Write-Host "NEXTAUTH_SECRET: $($NEXTAUTH_SECRET.Substring(0, 20))..."
Write-Host "ENCRYPTION_KEY:  $($ENCRYPTION_KEY.Substring(0, 20))..."
Write-Host ""
Write-Host "IMPORTANTE: Guarda estas claves en un lugar seguro" -ForegroundColor Yellow
Write-Host "No las compartas ni las subas a control de versiones" -ForegroundColor Yellow
Write-Host ""
