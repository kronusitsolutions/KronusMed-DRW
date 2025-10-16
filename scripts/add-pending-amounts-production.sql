-- Migración para agregar campos de montos pendientes en producción
-- IMPORTANTE: Esta migración NO afecta los datos existentes

-- 1. Agregar el nuevo valor PARTIAL al enum InvoiceStatus
DO $$ 
BEGIN
    -- Intentar agregar el valor al enum
    BEGIN
        ALTER TYPE "InvoiceStatus" ADD VALUE 'PARTIAL';
        RAISE NOTICE 'Valor PARTIAL agregado al enum InvoiceStatus';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Valor PARTIAL ya existe en el enum';
    END;
END $$;

-- 2. Agregar columnas a la tabla invoices
ALTER TABLE "invoices" 
ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pendingAmount" DOUBLE PRECISION DEFAULT 0;

-- 3. Crear la tabla invoice_payments
CREATE TABLE IF NOT EXISTS "invoice_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- 4. Crear índices para la tabla invoice_payments
CREATE INDEX IF NOT EXISTS "invoice_payments_invoiceId_idx" ON "invoice_payments"("invoiceId");
CREATE INDEX IF NOT EXISTS "invoice_payments_paidAt_idx" ON "invoice_payments"("paidAt");
CREATE INDEX IF NOT EXISTS "invoice_payments_createdAt_idx" ON "invoice_payments"("createdAt");

-- 5. Agregar foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoice_payments_invoiceId_fkey'
    ) THEN
        ALTER TABLE "invoice_payments" 
        ADD CONSTRAINT "invoice_payments_invoiceId_fkey" 
        FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 6. Actualizar las facturas existentes para inicializar los nuevos campos
UPDATE "invoices" 
SET 
    "paidAmount" = 0,
    "pendingAmount" = "totalAmount"
WHERE "paidAmount" IS NULL OR "pendingAmount" IS NULL;

-- 7. Hacer que las columnas no sean nulas después de la actualización
ALTER TABLE "invoices" 
ALTER COLUMN "paidAmount" SET NOT NULL,
ALTER COLUMN "pendingAmount" SET NOT NULL;

-- 8. Verificar el resultado
SELECT 
    'invoices' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN "paidAmount" = 0 THEN 1 END) as sin_pagos,
    COUNT(CASE WHEN "paidAmount" > 0 THEN 1 END) as con_pagos
FROM "invoices"
UNION ALL
SELECT 
    'invoice_payments' as tabla,
    COUNT(*) as total_registros,
    0 as sin_pagos,
    0 as con_pagos
FROM "invoice_payments";

-- 9. Mostrar estados de facturas
SELECT 
    "status",
    COUNT(*) as cantidad,
    SUM("totalAmount") as total_monto,
    SUM("paidAmount") as total_pagado,
    SUM("pendingAmount") as total_pendiente
FROM "invoices" 
GROUP BY "status"
ORDER BY "status";
