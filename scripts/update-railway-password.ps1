# Script para actualizar contraseña a la de Railway
Write-Host "🔧 ACTUALIZANDO CONTRASEÑA PARA RAILWAY" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue

Write-Host ""
Write-Host "📝 Cambiando contraseña de admin123 a kikla12345..." -ForegroundColor Yellow

# Leer el archivo actual
$envContent = Get-Content ".env.local" -Raw

# Reemplazar la contraseña
$envContent = $envContent -replace 'INITIAL_ADMIN_PASSWORD="admin123"', 'INITIAL_ADMIN_PASSWORD="kikla12345"'

# Guardar el archivo actualizado
Set-Content ".env.local" $envContent

Write-Host "✅ Contraseña actualizada correctamente" -ForegroundColor Green

Write-Host ""
Write-Host "🔑 CREDENCIALES ACTUALIZADAS:" -ForegroundColor Cyan
Write-Host "Email: admin@kronusmed.com" -ForegroundColor White
Write-Host "Password: kikla12345" -ForegroundColor White

Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Hacer commit de los cambios" -ForegroundColor White
Write-Host "2. Hacer push a Railway" -ForegroundColor White
Write-Host "3. Verificar que las variables de entorno en Railway coincidan" -ForegroundColor White
Write-Host "4. Probar el login con las nuevas credenciales" -ForegroundColor White

Write-Host ""
Write-Host "💡 NOTA:" -ForegroundColor Cyan
Write-Host "Asegúrate de que en Railway Dashboard las variables sean:" -ForegroundColor White
Write-Host "INITIAL_ADMIN_EMAIL=admin@kronusmed.com" -ForegroundColor White
Write-Host "INITIAL_ADMIN_PASSWORD=kikla12345" -ForegroundColor White
