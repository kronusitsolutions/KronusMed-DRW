-- Script de inicialización de la base de datos
-- Se ejecuta automáticamente al crear el contenedor

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'UTC';

-- Crear índices para optimizar consultas frecuentes
-- (Se crearán automáticamente con Prisma, pero estos son adicionales)

-- Configurar parámetros de rendimiento
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Crear usuario para la aplicación (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'medical_app') THEN
        CREATE ROLE medical_app WITH LOGIN PASSWORD 'app_password_2024';
    END IF;
END
$$;

-- Dar permisos al usuario de la aplicación
GRANT CONNECT ON DATABASE medical_clinic TO medical_app;
GRANT USAGE ON SCHEMA public TO medical_app;
GRANT CREATE ON SCHEMA public TO medical_app;

-- Configurar para que Prisma pueda crear tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO medical_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO medical_app;
