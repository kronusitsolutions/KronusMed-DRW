# Script para actualizar a Node.js 22.20
# Ejecutar como administrador en PowerShell

Write-Host "=== Actualización a Node.js 22.20 ===" -ForegroundColor Green

# Verificar si nvm-windows está instalado
if (!(Get-Command nvm -ErrorAction SilentlyContinue)) {
    Write-Host "nvm-windows no está instalado. Instalando..." -ForegroundColor Yellow
    Write-Host "Por favor, instala nvm-windows desde: https://github.com/coreybutler/nvm-windows" -ForegroundColor Red
    Write-Host "Después de instalar, reinicia PowerShell y ejecuta este script nuevamente." -ForegroundColor Red
    exit 1
}

# Verificar versión actual
Write-Host "Versión actual de Node.js:" -ForegroundColor Cyan
node --version

# Instalar Node.js 22 (última versión estable)
Write-Host "Instalando Node.js 22 (última versión estable)..." -ForegroundColor Yellow
nvm install 22

# Usar Node.js 22
Write-Host "Cambiando a Node.js 22..." -ForegroundColor Yellow
nvm use 22

# Verificar instalación
Write-Host "Verificando instalación..." -ForegroundColor Cyan
node --version
npm --version

# Limpiar caché de npm
Write-Host "Limpiando caché de npm..." -ForegroundColor Yellow
npm cache clean --force

# Instalar pnpm globalmente
Write-Host "Instalando pnpm..." -ForegroundColor Yellow
npm install -g pnpm@latest

# Verificar pnpm
Write-Host "Verificando pnpm..." -ForegroundColor Cyan
pnpm --version

# Instalar dependencias del proyecto
Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Yellow
pnpm install

# Generar cliente de Prisma
Write-Host "Generando cliente de Prisma..." -ForegroundColor Yellow
pnpm run db:generate

# Verificar que todo funciona
Write-Host "Verificando que la aplicación funciona..." -ForegroundColor Yellow
pnpm run typecheck

Write-Host "=== Actualización completada ===" -ForegroundColor Green
Write-Host "Node.js 22 está listo para usar." -ForegroundColor Green
Write-Host "Puedes ejecutar 'pnpm run dev' para iniciar el servidor de desarrollo." -ForegroundColor Green
