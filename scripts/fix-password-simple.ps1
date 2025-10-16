# Script simple para actualizar contraseña
Write-Host "Actualizando contraseña..." -ForegroundColor Green

# Verificar si .env.local existe
if (Test-Path ".env.local") {
    Write-Host "Archivo .env.local encontrado" -ForegroundColor Green
    
    # Leer y actualizar
    $content = Get-Content ".env.local" -Raw
    $updated = $content -replace 'INITIAL_ADMIN_PASSWORD="admin123"', 'INITIAL_ADMIN_PASSWORD="kikla12345"'
    
    if ($content -ne $updated) {
        Set-Content ".env.local" $updated
        Write-Host "Contraseña actualizada a kikla12345" -ForegroundColor Green
    } else {
        Write-Host "Contraseña ya es kikla12345 o no se encontró admin123" -ForegroundColor Yellow
    }
} else {
    Write-Host "Archivo .env.local no encontrado" -ForegroundColor Red
    Write-Host "Creando archivo con credenciales correctas..." -ForegroundColor Yellow
    
    $envContent = @"
# Configuración de base de datos
DATABASE_URL="postgresql://medical_user:medical_password_2024@localhost:5432/medical_clinic?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kiklakikla"

# Encriptación de datos sensibles (PHI)
ENCRYPTION_KEY="x8PE16EcIhkkB1H23ymIdlMtX/Qh5Q2LD+e5xfcmd1U="

# Admin inicial
INITIAL_ADMIN_EMAIL="admin@kronusmed.com"
INITIAL_ADMIN_PASSWORD="kikla12345"
INITIAL_ADMIN_NAME="Administrador"

# Configuración de seguridad
NODE_ENV="development"
SECURE_COOKIES="false"

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@
    
    Set-Content ".env.local" $envContent
    Write-Host "Archivo .env.local creado con credenciales correctas" -ForegroundColor Green
}

Write-Host ""
Write-Host "Credenciales actualizadas:" -ForegroundColor Cyan
Write-Host "Email: admin@kronusmed.com" -ForegroundColor White
Write-Host "Password: kikla12345" -ForegroundColor White
