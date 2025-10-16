-- Migrar enum InvoiceStatus de OVERDUE a EXONERATED
-- Este script actualiza el enum en la base de datos PostgreSQL

-- Paso 1: Agregar el nuevo valor al enum
ALTER TYPE "InvoiceStatus" ADD VALUE 'EXONERATED';

-- Paso 2: Actualizar las facturas existentes de OVERDUE a EXONERATED
UPDATE "invoices" 
SET "status" = 'EXONERATED' 
WHERE "status" = 'OVERDUE';

-- Paso 3: Verificar que no hay facturas con estado OVERDUE
SELECT 
  "status",
  COUNT(*) as count
FROM "invoices" 
WHERE "status" = 'OVERDUE'
GROUP BY "status";

-- Paso 4: Mostrar resumen de estados
SELECT 
  "status",
  COUNT(*) as count,
  SUM("totalAmount") as total_amount
FROM "invoices" 
GROUP BY "status"
ORDER BY "status";
