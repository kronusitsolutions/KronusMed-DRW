#!/bin/bash

# Script para desarrollo con Docker
# Uso: ./scripts/docker-dev.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Función para verificar si Docker está corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker no está corriendo. Por favor inicia Docker Desktop."
        exit 1
    fi
}

# Función para iniciar servicios
start_services() {
    log "Iniciando servicios de desarrollo..."
    docker-compose up -d postgres
    
    # Esperar a que PostgreSQL esté listo
    log "Esperando a que PostgreSQL esté listo..."
    until docker-compose exec -T postgres pg_isready -U medical_user -d medical_clinic; do
        sleep 2
    done
    
    log "PostgreSQL está listo!"
}

# Función para detener servicios
stop_services() {
    log "Deteniendo servicios..."
    docker-compose down
}

# Función para reiniciar servicios
restart_services() {
    log "Reiniciando servicios..."
    docker-compose restart
}

# Función para ver logs
logs() {
    docker-compose logs -f postgres
}

# Función para ejecutar comandos en la base de datos
db_exec() {
    docker-compose exec postgres psql -U medical_user -d medical_clinic -c "$1"
}

# Función para hacer backup
backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"
    
    log "Creando backup: $backup_file"
    docker-compose exec -T postgres pg_dump -U medical_user medical_clinic > "backups/$backup_file"
    log "Backup creado exitosamente!"
}

# Función para restaurar backup
restore() {
    if [ -z "$1" ]; then
        error "Debes especificar un archivo de backup"
        echo "Uso: $0 restore <archivo_backup>"
        exit 1
    fi
    
    local backup_file="$1"
    if [ ! -f "backups/$backup_file" ]; then
        error "Archivo de backup no encontrado: backups/$backup_file"
        exit 1
    fi
    
    log "Restaurando backup: $backup_file"
    docker-compose exec -T postgres psql -U medical_user -d medical_clinic < "backups/$backup_file"
    log "Backup restaurado exitosamente!"
}

# Función para mostrar estado
status() {
    log "Estado de los servicios:"
    docker-compose ps
    
    echo ""
    log "Información de la base de datos:"
    docker-compose exec -T postgres psql -U medical_user -d medical_clinic -c "
        SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation
        FROM pg_stats 
        WHERE schemaname = 'public' 
        ORDER BY tablename, attname;
    "
}

# Función para limpiar todo
clean() {
    warn "Esto eliminará todos los datos de la base de datos. ¿Estás seguro? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log "Limpiando datos..."
        docker-compose down -v
        docker-compose up -d postgres
        log "Datos limpiados!"
    else
        log "Operación cancelada."
    fi
}

# Función para mostrar ayuda
help() {
    echo "Script de desarrollo con Docker para Sistema de Clínica Médica"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start     - Iniciar servicios de desarrollo"
    echo "  stop      - Detener servicios"
    echo "  restart   - Reiniciar servicios"
    echo "  logs      - Ver logs de PostgreSQL"
    echo "  status    - Mostrar estado de servicios"
    echo "  backup    - Crear backup de la base de datos"
    echo "  restore   - Restaurar backup (especificar archivo)"
    echo "  clean     - Limpiar todos los datos"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start"
    echo "  $0 backup"
    echo "  $0 restore backup_20241201_143022.sql"
}

# Verificar Docker
check_docker

# Crear directorio de backups si no existe
mkdir -p backups

# Procesar comandos
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    clean)
        clean
        ;;
    help|*)
        help
        ;;
esac
