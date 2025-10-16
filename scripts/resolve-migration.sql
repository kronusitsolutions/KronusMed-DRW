-- Script para resolver migración fallida en Railway
-- Ejecutar en la consola de PostgreSQL de Railway

-- Ver migraciones fallidas
SELECT migration_name, started_at, finished_at, logs 
FROM "_prisma_migrations" 
WHERE finished_at IS NULL 
ORDER BY started_at DESC;

-- Marcar migración como aplicada
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    logs = 'Manually resolved - migration was already applied to schema' 
WHERE migration_name = '20240911234500_add_insurance_system' 
AND finished_at IS NULL;

-- Verificar que se resolvió
SELECT migration_name, started_at, finished_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20240911234500_add_insurance_system';
