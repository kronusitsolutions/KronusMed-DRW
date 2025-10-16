#!/bin/bash

# Script para desarrollo completo con Docker
# Incluye PostgreSQL y la aplicación Next.js

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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para verificar si Docker está corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker no está corriendo. Por favor inicia Docker Desktop."
        exit 1
    fi
}

# Función para iniciar desarrollo completo
start_dev() {
    log "Iniciando entorno de desarrollo completo..."
    
    # Construir y iniciar todos los servicios
    docker-compose -f docker-compose.dev.yml --profile dev up -d --build
    
    # Esperar a que PostgreSQL esté listo
    log "Esperando a que PostgreSQL esté listo..."
    until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U medical_user -d medical_clinic; do
        sleep 2
    done
    
    log "PostgreSQL está listo!"
    
    # Configurar base de datos
    log "Configurando base de datos..."
    docker-compose -f docker-compose.dev.yml exec app pnpm run db:push
    docker-compose -f docker-compose.dev.yml exec app pnpm run db:seed
    
    log "✅ Entorno de desarrollo iniciado!"
    log "🌐 Aplicación: http://localhost:3000"
    log "🗄️  pgAdmin: http://localhost:5050"
    log "📊 Logs: npm run docker:dev:logs"
}

# Función para detener desarrollo
stop_dev() {
    log "Deteniendo entorno de desarrollo..."
    docker-compose -f docker-compose.dev.yml down
    log "✅ Entorno de desarrollo detenido!"
}

# Función para reiniciar servicios
restart_dev() {
    log "Reiniciando servicios..."
    docker-compose -f docker-compose.dev.yml restart
}

# Función para ver logs
logs() {
    if [ "$1" = "app" ]; then
        docker-compose -f docker-compose.dev.yml logs -f app
    elif [ "$1" = "postgres" ]; then
        docker-compose -f docker-compose.dev.yml logs -f postgres
    else
        docker-compose -f docker-compose.dev.yml logs -f
    fi
}

# Función para ejecutar comandos en la aplicación
exec_app() {
    if [ -z "$1" ]; then
        error "Debes especificar un comando"
        echo "Uso: $0 exec-app <comando>"
        exit 1
    fi
    
    log "Ejecutando comando en la aplicación: $1"
    docker-compose -f docker-compose.dev.yml exec app $1
}

# Función para ejecutar comandos en la base de datos
exec_db() {
    if [ -z "$1" ]; then
        error "Debes especificar un comando"
        echo "Uso: $0 exec-db <comando>"
        exit 1
    fi
    
    log "Ejecutando comando en la base de datos: $1"
    docker-compose -f docker-compose.dev.yml exec postgres $1
}

# Función para hacer backup
backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"
    
    log "Creando backup: $backup_file"
    docker-compose -f docker-compose.dev.yml exec -T postgres pg_dump -U medical_user medical_clinic > "backups/$backup_file"
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
    docker-compose -f docker-compose.dev.yml exec -T postgres psql -U medical_user -d medical_clinic < "backups/$backup_file"
    log "Backup restaurado exitosamente!"
}

# Función para mostrar estado
status() {
    log "Estado de los servicios:"
    docker-compose -f docker-compose.dev.yml ps
    
    echo ""
    log "Información de la base de datos:"
    docker-compose -f docker-compose.dev.yml exec -T postgres psql -U medical_user -d medical_clinic -c "
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
    warn "Esto eliminará todos los datos y contenedores. ¿Estás seguro? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log "Limpiando todo..."
        docker-compose -f docker-compose.dev.yml down -v
        docker system prune -f
        log "Todo limpiado!"
    else
        log "Operación cancelada."
    fi
}

# Función para reconstruir aplicación
rebuild() {
    log "Reconstruyendo aplicación..."
    docker-compose -f docker-compose.dev.yml build --no-cache app
    log "Aplicación reconstruida!"
}

# Función para mostrar ayuda
help() {
    echo "Script de desarrollo completo con Docker para Sistema de Clínica Médica"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start       - Iniciar entorno de desarrollo completo"
    echo "  stop        - Detener entorno de desarrollo"
    echo "  restart     - Reiniciar servicios"
    echo "  logs        - Ver logs (app|postgres|all)"
    echo "  status      - Mostrar estado de servicios"
    echo "  backup      - Crear backup de la base de datos"
    echo "  restore     - Restaurar backup (especificar archivo)"
    echo "  clean       - Limpiar todo (datos y contenedores)"
    echo "  rebuild     - Reconstruir aplicación"
    echo "  exec-app    - Ejecutar comando en la aplicación"
    echo "  exec-db     - Ejecutar comando en la base de datos"
    echo "  help        - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start"
    echo "  $0 logs app"
    echo "  $0 exec-app pnpm run db:seed"
    echo "  $0 backup"
    echo "  $0 restore backup_20241201_143022.sql"
    echo ""
    echo "URLs de acceso:"
    echo "  🌐 Aplicación: http://localhost:3000"
    echo "  🗄️  pgAdmin: http://localhost:5050"
}

# Verificar Docker
check_docker

# Crear directorio de backups si no existe
mkdir -p backups

# Procesar comandos
case "${1:-help}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    logs)
        logs "$2"
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
    rebuild)
        rebuild
        ;;
    exec-app)
        shift
        exec_app "$@"
        ;;
    exec-db)
        shift
        exec_db "$@"
        ;;
    help|*)
        help
        ;;
esac
