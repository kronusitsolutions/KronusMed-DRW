#!/bin/bash

# Script de backup seguro con encriptación
# Uso: ./scripts/secure-backup.sh [opciones]

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

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="secure_backup_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
RETENTION_DAYS=30

# Verificar si GPG está instalado
check_gpg() {
    if ! command -v gpg &> /dev/null; then
        error "GPG no está instalado. Instálalo para encriptar backups."
        exit 1
    fi
}

# Verificar si Docker está corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker no está corriendo."
        exit 1
    fi
}

# Crear directorio de backups si no existe
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creando directorio de backups: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Hacer backup encriptado
create_encrypted_backup() {
    log "Creando backup encriptado..."
    
    # Crear backup de PostgreSQL
    log "Exportando base de datos..."
    docker-compose exec -T postgres pg_dump -U medical_user medical_clinic > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "Backup creado exitosamente: $BACKUP_FILE"
        
        # Encriptar backup
        log "Encriptando backup..."
        gpg --encrypt --recipient admin@clinica.com --output "$BACKUP_DIR/$ENCRYPTED_FILE" "$BACKUP_DIR/$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            log "Backup encriptado creado: $ENCRYPTED_FILE"
            
            # Eliminar archivo sin encriptar
            rm "$BACKUP_DIR/$BACKUP_FILE"
            log "Archivo sin encriptar eliminado por seguridad"
            
            # Mostrar información del backup
            BACKUP_SIZE=$(du -h "$BACKUP_DIR/$ENCRYPTED_FILE" | cut -f1)
            log "Tamaño del backup: $BACKUP_SIZE"
        else
            error "Error al encriptar backup"
            exit 1
        fi
    else
        error "Error al crear backup de la base de datos"
        exit 1
    fi
}

# Restaurar backup encriptado
restore_encrypted_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Debes especificar un archivo de backup"
        echo "Uso: $0 restore <archivo_backup.gpg>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        error "Archivo de backup no encontrado: $BACKUP_DIR/$backup_file"
        exit 1
    fi
    
    warn "¿Estás seguro de que quieres restaurar el backup? Esto sobrescribirá los datos actuales. (y/N)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log "Restauración cancelada."
        exit 0
    fi
    
    log "Desencriptando backup..."
    local temp_file=$(mktemp)
    gpg --decrypt --output "$temp_file" "$BACKUP_DIR/$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Restaurando backup..."
        docker-compose exec -T postgres psql -U medical_user -d medical_clinic < "$temp_file"
        
        if [ $? -eq 0 ]; then
            log "Backup restaurado exitosamente!"
        else
            error "Error al restaurar backup"
        fi
        
        # Limpiar archivo temporal
        rm "$temp_file"
    else
        error "Error al desencriptar backup"
        rm -f "$temp_file"
        exit 1
    fi
}

# Limpiar backups antiguos
cleanup_old_backups() {
    log "Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
    
    find "$BACKUP_DIR" -name "secure_backup_*.gpg" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Limpieza completada"
}

# Listar backups disponibles
list_backups() {
    log "Backups disponibles:"
    echo ""
    
    if [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo "No hay backups disponibles."
        return
    fi
    
    for backup in "$BACKUP_DIR"/secure_backup_*.gpg; do
        if [ -f "$backup" ]; then
            filename=$(basename "$backup")
            size=$(du -h "$backup" | cut -f1)
            date=$(stat -c %y "$backup" | cut -d' ' -f1)
            echo "📁 $filename"
            echo "   📅 Fecha: $date"
            echo "   📊 Tamaño: $size"
            echo ""
        fi
    done
}

# Verificar integridad del backup
verify_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Debes especificar un archivo de backup"
        echo "Uso: $0 verify <archivo_backup.gpg>"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        error "Archivo de backup no encontrado: $BACKUP_DIR/$backup_file"
        exit 1
    fi
    
    log "Verificando integridad del backup: $backup_file"
    
    # Verificar que se puede desencriptar
    local temp_file=$(mktemp)
    if gpg --decrypt --output "$temp_file" "$BACKUP_DIR/$backup_file" > /dev/null 2>&1; then
        log "✅ Backup se puede desencriptar correctamente"
        
        # Verificar que contiene datos SQL válidos
        if head -n 1 "$temp_file" | grep -q "PostgreSQL database dump"; then
            log "✅ Backup contiene datos SQL válidos"
        else
            warn "⚠️  Backup no parece contener datos SQL válidos"
        fi
        
        rm "$temp_file"
    else
        error "❌ Backup corrupto o no se puede desencriptar"
        rm -f "$temp_file"
        exit 1
    fi
}

# Mostrar ayuda
show_help() {
    echo "Script de backup seguro con encriptación para Sistema de Clínica Médica"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos disponibles:"
    echo "  create     - Crear backup encriptado"
    echo "  restore    - Restaurar backup encriptado"
    echo "  list       - Listar backups disponibles"
    echo "  verify     - Verificar integridad de backup"
    echo "  cleanup    - Limpiar backups antiguos"
    echo "  help       - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 create"
    echo "  $0 restore secure_backup_20241201_143022.sql.gpg"
    echo "  $0 verify secure_backup_20241201_143022.sql.gpg"
    echo "  $0 list"
    echo ""
    echo "Configuración:"
    echo "  Directorio de backups: $BACKUP_DIR"
    echo "  Retención: $RETENTION_DAYS días"
    echo "  Encriptación: GPG con clave admin@clinica.com"
}

# Verificar prerrequisitos
check_prerequisites() {
    check_docker
    check_gpg
    create_backup_dir
}

# Función principal
main() {
    case "${1:-help}" in
        create)
            check_prerequisites
            create_encrypted_backup
            cleanup_old_backups
            ;;
        restore)
            check_prerequisites
            restore_encrypted_backup "$2"
            ;;
        list)
            list_backups
            ;;
        verify)
            check_prerequisites
            verify_backup "$2"
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
