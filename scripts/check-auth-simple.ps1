# Script simple para verificar autenticación
Write-Host "Verificando configuracion de autenticacion..." -ForegroundColor Green

# Verificar archivos críticos
$files = @("lib/auth.ts", "lib/prisma.ts", "prisma/schema.prisma", ".env.local")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "OK: $file" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $file no encontrado" -ForegroundColor Red
    }
}

# Verificar variables de entorno
Write-Host ""
Write-Host "Variables de entorno:" -ForegroundColor Yellow
$envContent = Get-Content ".env.local" -Raw

if ($envContent -match "NEXTAUTH_SECRET=") {
    Write-Host "OK: NEXTAUTH_SECRET configurado" -ForegroundColor Green
} else {
    Write-Host "ERROR: NEXTAUTH_SECRET no configurado" -ForegroundColor Red
}

if ($envContent -match "ENCRYPTION_KEY=") {
    Write-Host "OK: ENCRYPTION_KEY configurado" -ForegroundColor Green
} else {
    Write-Host "ERROR: ENCRYPTION_KEY no configurado" -ForegroundColor Red
}

if ($envContent -match "INITIAL_ADMIN_EMAIL=") {
    Write-Host "OK: Credenciales de admin configuradas" -ForegroundColor Green
} else {
    Write-Host "ERROR: Credenciales de admin no configuradas" -ForegroundColor Red
}

Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "Email: admin@kronusmed.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
