#!/bin/bash

# Script para generar claves seguras para la aplicación
# Uso: ./scripts/generate-secrets.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para generar clave segura
generate_secret() {
    openssl rand -base64 32
}

# Función para verificar si openssl está instalado
check_openssl() {
    if ! command -v openssl &> /dev/null; then
        error "OpenSSL no está instalado. Instálalo para generar claves seguras."
        exit 1
    fi
}

# Función para generar claves
generate_secrets() {
    log "Generando claves seguras..."
    
    # Generar NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(generate_secret)
    log "NEXTAUTH_SECRET generado"
    
    # Generar ENCRYPTION_KEY
    ENCRYPTION_KEY=$(generate_secret)
    log "ENCRYPTION_KEY generado"
    
    # Crear archivo .env.local si no existe
    if [ ! -f ".env.local" ]; then
        log "Creando archivo .env.local..."
        cp env.example .env.local
    fi
    
    # Actualizar .env.local con las nuevas claves
    log "Actualizando .env.local con las nuevas claves..."
    
    # Actualizar NEXTAUTH_SECRET
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env.local
    else
        # Linux
        sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"/" .env.local
    fi
    
    # Actualizar ENCRYPTION_KEY
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" .env.local
    else
        # Linux
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"/" .env.local
    fi
    
    log "✅ Claves generadas y guardadas en .env.local"
    
    # Mostrar resumen
    echo ""
    log "📋 RESUMEN DE CLAVES GENERADAS:"
    echo "=================================="
    echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:20}..."
    echo "ENCRYPTION_KEY:  ${ENCRYPTION_KEY:0:20}..."
    echo ""
    warn "⚠️  IMPORTANTE: Guarda estas claves en un lugar seguro"
    warn "⚠️  No las compartas ni las subas a control de versiones"
    echo ""
}

# Función para verificar claves existentes
check_existing_secrets() {
    log "Verificando claves existentes..."
    
    if [ -f ".env.local" ]; then
        # Verificar NEXTAUTH_SECRET
        if grep -q "NEXTAUTH_SECRET=\"CHANGE_ME" .env.local; then
            warn "⚠️  NEXTAUTH_SECRET usa valor por defecto inseguro"
        elif grep -q "NEXTAUTH_SECRET=\"kiklakikla" .env.local; then
            warn "⚠️  NEXTAUTH_SECRET usa valor de desarrollo inseguro"
        else
            log "✅ NEXTAUTH_SECRET configurado correctamente"
        fi
        
        # Verificar ENCRYPTION_KEY
        if grep -q "ENCRYPTION_KEY=\"CHANGE_ME" .env.local; then
            warn "⚠️  ENCRYPTION_KEY usa valor por defecto inseguro"
        elif grep -q "ENCRYPTION_KEY=\"fallback-key" .env.local; then
            warn "⚠️  ENCRYPTION_KEY usa valor de desarrollo inseguro"
        else
            log "✅ ENCRYPTION_KEY configurado correctamente"
        fi
    else
        warn "⚠️  Archivo .env.local no encontrado"
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "Script para generar claves seguras para la aplicación"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  generate  - Generar nuevas claves seguras"
    echo "  check     - Verificar claves existentes"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 generate"
    echo "  $0 check"
    echo ""
    echo "Notas:"
    echo "  - Requiere OpenSSL instalado"
    echo "  - Las claves se guardan en .env.local"
    echo "  - Nunca subas .env.local a control de versiones"
}

# Función principal
main() {
    case "${1:-help}" in
        generate)
            check_openssl
            generate_secrets
            ;;
        check)
            check_existing_secrets
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
