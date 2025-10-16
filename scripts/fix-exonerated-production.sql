-- Script para corregir el estado EXONERATED en producción
-- Ejecutar este script directamente en la base de datos de Railway

-- 1. Verificar estados actuales
SELECT 
  "status",
  COUNT(*) as count
FROM "invoices" 
GROUP BY "status"
ORDER BY "status";

-- 2. Agregar EXONERATED al enum (si no existe)
DO $$ 
BEGIN
    -- Intentar agregar el valor al enum
    BEGIN
        ALTER TYPE "InvoiceStatus" ADD VALUE 'EXONERATED';
        RAISE NOTICE 'Valor EXONERATED agregado al enum InvoiceStatus';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Valor EXONERATED ya existe en el enum';
    END;
END $$;

-- 3. Actualizar facturas de OVERDUE a EXONERATED
UPDATE "invoices" 
SET "status" = 'EXONERATED' 
WHERE "status" = 'OVERDUE';

-- 4. Verificar resultado
SELECT 
  "status",
  COUNT(*) as count,
  SUM("totalAmount") as total_amount
FROM "invoices" 
GROUP BY "status"
ORDER BY "status";

-- 5. Confirmar que no hay facturas con OVERDUE
SELECT COUNT(*) as overdue_count
FROM "invoices" 
WHERE "status" = 'OVERDUE';
