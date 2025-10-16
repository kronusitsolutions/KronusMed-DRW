-- Agregar columna insuranceCalculation a la tabla invoices
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "insuranceCalculation" JSONB;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name = 'insuranceCalculation';
