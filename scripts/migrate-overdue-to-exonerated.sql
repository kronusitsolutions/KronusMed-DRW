-- Migrar facturas de estado OVERDUE a EXONERATED
-- Primero actualizar las facturas existentes
UPDATE "invoices" 
SET "status" = 'EXONERATED' 
WHERE "status" = 'OVERDUE';

-- Verificar el resultado
SELECT 
  "status",
  COUNT(*) as count,
  SUM("totalAmount") as total_amount
FROM "invoices" 
GROUP BY "status"
ORDER BY "status";
