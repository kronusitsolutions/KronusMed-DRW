/**
 * Script para ejecutar la migración de montos pendientes en producción
 * Este script es SEGURO y NO afecta los datos existentes
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const prisma = new PrismaClient()

async function runPendingAmountsMigration() {
  console.log('🚀 Iniciando migración de montos pendientes en producción...')
  console.log('⚠️  Esta migración es SEGURA y NO afecta los datos existentes')
  
  try {
    // Ejecutar comandos SQL uno por uno
    console.log('🔄 Ejecutando migración SQL...')
    
    // 1. Agregar PARTIAL al enum InvoiceStatus
    console.log('   - Agregando PARTIAL al enum InvoiceStatus...')
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          BEGIN
              ALTER TYPE "InvoiceStatus" ADD VALUE 'PARTIAL';
              RAISE NOTICE 'Valor PARTIAL agregado al enum InvoiceStatus';
          EXCEPTION
              WHEN duplicate_object THEN
                  RAISE NOTICE 'Valor PARTIAL ya existe en el enum';
          END;
      END $$;
    `
    
    // 2. Agregar columnas a la tabla invoices
    console.log('   - Agregando columnas paidAmount y pendingAmount...')
    await prisma.$executeRaw`
      ALTER TABLE "invoices" 
      ADD COLUMN IF NOT EXISTS "paidAmount" DOUBLE PRECISION DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "pendingAmount" DOUBLE PRECISION DEFAULT 0;
    `
    
    // 3. Crear la tabla invoice_payments
    console.log('   - Creando tabla invoice_payments...')
    await prisma.$executeRaw`
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
    `
    
    // 4. Crear índices
    console.log('   - Creando índices...')
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "invoice_payments_invoiceId_idx" ON "invoice_payments"("invoiceId");
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "invoice_payments_paidAt_idx" ON "invoice_payments"("paidAt");
    `
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "invoice_payments_createdAt_idx" ON "invoice_payments"("createdAt");
    `
    
    // 5. Agregar foreign key constraint
    console.log('   - Agregando foreign key constraint...')
    await prisma.$executeRaw`
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
    `
    
    // 6. Actualizar facturas existentes
    console.log('   - Actualizando facturas existentes...')
    await prisma.$executeRaw`
      UPDATE "invoices" 
      SET 
          "paidAmount" = 0,
          "pendingAmount" = "totalAmount"
      WHERE "paidAmount" IS NULL OR "pendingAmount" IS NULL;
    `
    
    // 7. Hacer columnas NOT NULL
    console.log('   - Configurando columnas como NOT NULL...')
    await prisma.$executeRaw`
      ALTER TABLE "invoices" 
      ALTER COLUMN "paidAmount" SET NOT NULL,
      ALTER COLUMN "pendingAmount" SET NOT NULL;
    `
    
    console.log('✅ Migración SQL ejecutada exitosamente')
    
    // Verificar que los cambios se aplicaron correctamente
    console.log('\n🔍 Verificando cambios...')
    
    // Verificar que las columnas existen
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('paidAmount', 'pendingAmount')
      ORDER BY column_name
    `
    
    console.log('📊 Columnas agregadas a la tabla invoices:')
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Verificar que la tabla de pagos existe
    const paymentsTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'invoice_payments'
    `
    
    if (paymentsTable.length > 0) {
      console.log('✅ Tabla invoice_payments creada correctamente')
    } else {
      console.log('❌ Error: Tabla invoice_payments no se creó')
    }
    
    // Verificar el enum InvoiceStatus
    const enumValues = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"InvoiceStatus")) as status
    `
    
    console.log('📋 Valores del enum InvoiceStatus:')
    enumValues.forEach(val => {
      console.log(`   - ${val.status}`)
    })
    
    // Mostrar estadísticas de facturas
    const stats = await prisma.$queryRaw`
      SELECT 
        "status",
        COUNT(*) as cantidad,
        SUM("totalAmount") as total_monto,
        SUM("paidAmount") as total_pagado,
        SUM("pendingAmount") as total_pendiente
      FROM "invoices" 
      GROUP BY "status"
      ORDER BY "status"
    `
    
    console.log('\n📈 Estadísticas de facturas:')
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.cantidad} facturas`)
      console.log(`     Total: $${parseFloat(stat.total_monto || 0).toFixed(2)}`)
      console.log(`     Pagado: $${parseFloat(stat.total_pagado || 0).toFixed(2)}`)
      console.log(`     Pendiente: $${parseFloat(stat.total_pendiente || 0).toFixed(2)}`)
    })
    
    console.log('\n🎉 ¡Migración completada exitosamente!')
    console.log('✅ Los campos de montos pendientes están listos para usar')
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  runPendingAmountsMigration()
    .then(() => {
      console.log('✅ Script de migración ejecutado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando la migración:', error)
      process.exit(1)
    })
}

module.exports = { runPendingAmountsMigration }
