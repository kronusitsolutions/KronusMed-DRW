# Script para generar claves seguras para la aplicación (PowerShell)
# Uso: .\scripts\generate-secrets.ps1 [comando]

param(
    [string]$Command = "help"
)

# Colores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Función para mostrar mensajes
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    Write-Host "[INFO] $Message" -ForegroundColor $Color
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Función para generar clave segura
function Generate-Secret {
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Función para generar claves
function Generate-Secrets {
    Write-Log "Generando claves seguras..." $Green
    
    # Generar NEXTAUTH_SECRET
    $NEXTAUTH_SECRET = Generate-Secret
    Write-Log "NEXTAUTH_SECRET generado" $Green
    
    # Generar ENCRYPTION_KEY
    $ENCRYPTION_KEY = Generate-Secret
    Write-Log "ENCRYPTION_KEY generado" $Green
    
    # Crear archivo .env.local si no existe
    if (-not (Test-Path ".env.local")) {
        Write-Log "Creando archivo .env.local..." $Green
        Copy-Item "env.example" ".env.local"
    }
    
    # Actualizar .env.local con las nuevas claves
    Write-Log "Actualizando .env.local con las nuevas claves..." $Green
    
    $envContent = Get-Content ".env.local" -Raw
    
    # Actualizar NEXTAUTH_SECRET
    $envContent = $envContent -replace 'NEXTAUTH_SECRET=.*', "NEXTAUTH_SECRET=`"$NEXTAUTH_SECRET`""
    
    # Actualizar ENCRYPTION_KEY
    $envContent = $envContent -replace 'ENCRYPTION_KEY=.*', "ENCRYPTION_KEY=`"$ENCRYPTION_KEY`""
    
    # Guardar archivo actualizado
    Set-Content ".env.local" $envContent
    
    Write-Log "✅ Claves generadas y guardadas en .env.local" $Green
    
    # Mostrar resumen
    Write-Host ""
    Write-Log "📋 RESUMEN DE CLAVES GENERADAS:" $Blue
    Write-Host "=================================="
    Write-Host "NEXTAUTH_SECRET: $($NEXTAUTH_SECRET.Substring(0, 20))..."
    Write-Host "ENCRYPTION_KEY:  $($ENCRYPTION_KEY.Substring(0, 20))..."
    Write-Host ""
    Write-Warn "⚠️  IMPORTANTE: Guarda estas claves en un lugar seguro"
    Write-Warn "⚠️  No las compartas ni las subas a control de versiones"
    Write-Host ""
}

# Función para verificar claves existentes
function Check-ExistingSecrets {
    Write-Log "Verificando claves existentes..." $Green
    
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        
        # Verificar NEXTAUTH_SECRET
        if ($envContent -match 'NEXTAUTH_SECRET="CHANGE_ME') {
            Write-Warn "⚠️  NEXTAUTH_SECRET usa valor por defecto inseguro"
        } elseif ($envContent -match 'NEXTAUTH_SECRET="kiklakikla') {
            Write-Warn "⚠️  NEXTAUTH_SECRET usa valor de desarrollo inseguro"
        } else {
            Write-Log "✅ NEXTAUTH_SECRET configurado correctamente" $Green
        }
        
        # Verificar ENCRYPTION_KEY
        if ($envContent -match 'ENCRYPTION_KEY="CHANGE_ME') {
            Write-Warn "⚠️  ENCRYPTION_KEY usa valor por defecto inseguro"
        } elseif ($envContent -match 'ENCRYPTION_KEY="fallback-key') {
            Write-Warn "⚠️  ENCRYPTION_KEY usa valor de desarrollo inseguro"
        } else {
            Write-Log "✅ ENCRYPTION_KEY configurado correctamente" $Green
        }
    } else {
        Write-Warn "⚠️  Archivo .env.local no encontrado"
    }
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host "Script para generar claves seguras para la aplicación (PowerShell)"
    Write-Host ""
    Write-Host "Uso: .\scripts\generate-secrets.ps1 [comando]"
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host "  generate  - Generar nuevas claves seguras"
    Write-Host "  check     - Verificar claves existentes"
    Write-Host "  help      - Mostrar esta ayuda"
    Write-Host ""
    Write-Host "Ejemplos:"
    Write-Host "  .\scripts\generate-secrets.ps1 generate"
    Write-Host "  .\scripts\generate-secrets.ps1 check"
    Write-Host ""
    Write-Host "Notas:"
    Write-Host "  - Las claves se guardan en .env.local"
    Write-Host "  - Nunca subas .env.local a control de versiones"
}

# Función principal
function Main {
    switch ($Command.ToLower()) {
        "generate" {
            Generate-Secrets
        }
        "check" {
            Check-ExistingSecrets
        }
        "help" {
            Show-Help
        }
        default {
            Show-Help
        }
    }
}

# Ejecutar función principal
Main
