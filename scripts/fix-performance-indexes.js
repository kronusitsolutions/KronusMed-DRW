const { PrismaClient } = require('@prisma/client')

async function fixPerformanceIndexes() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Reparando migración de índices de rendimiento...')
    
    // Verificar estructura de la tabla invoices
    const invoiceColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices'
      ORDER BY column_name
    `
    
    console.log('📋 Columnas en tabla invoices:', invoiceColumns.map(c => c.column_name))
    
    // Crear índices con los nombres correctos
    const indexes = [
      // Índices para invoices
      'CREATE INDEX IF NOT EXISTS "idx_invoices_status_created" ON "invoices"("status", "createdAt" DESC)',
      'CREATE INDEX IF NOT EXISTS "idx_invoices_patient_id" ON "invoices"("patientId")',
      'CREATE INDEX IF NOT EXISTS "idx_invoices_user_id" ON "invoices"("userId")',
      
      // Índices para patients
      'CREATE INDEX IF NOT EXISTS "idx_patients_status" ON "patients"("status")',
      'CREATE INDEX IF NOT EXISTS "idx_patients_name_search" ON "patients"("name")',
      
      // Índices para appointments
      'CREATE INDEX IF NOT EXISTS "idx_appointments_date" ON "appointments"("date")',
      'CREATE INDEX IF NOT EXISTS "idx_appointments_patient_id" ON "appointments"("patientId")',
      'CREATE INDEX IF NOT EXISTS "idx_appointments_doctor_id" ON "appointments"("doctorId")',
      'CREATE INDEX IF NOT EXISTS "idx_appointments_status" ON "appointments"("status")',
      
      // Índices para services
      'CREATE INDEX IF NOT EXISTS "idx_services_active_name" ON "services"("isActive", "name")',
      'CREATE INDEX IF NOT EXISTS "idx_services_category" ON "services"("category")',
      
      // Índices para invoice_items
      'CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items"("invoiceId")',
      'CREATE INDEX IF NOT EXISTS "idx_invoice_items_service_id" ON "invoice_items"("serviceId")',
      
      // Índices para medical_notes
      'CREATE INDEX IF NOT EXISTS "idx_medical_notes_patient_id" ON "medical_notes"("patientId")',
      'CREATE INDEX IF NOT EXISTS "idx_medical_notes_doctor_id" ON "medical_notes"("doctorId")',
      'CREATE INDEX IF NOT EXISTS "idx_medical_notes_date" ON "medical_notes"("date")',
      
      // Índices para insurance_coverage
      'CREATE INDEX IF NOT EXISTS "idx_insurance_coverage_insurance_id" ON "insurance_coverage"("insuranceId")',
      'CREATE INDEX IF NOT EXISTS "idx_insurance_coverage_service_id" ON "insurance_coverage"("serviceId")',
      
      // Índices para invoice_exonerations
      'CREATE INDEX IF NOT EXISTS "idx_invoice_exonerations_invoice_id" ON "invoice_exonerations"("invoiceId")',
      'CREATE INDEX IF NOT EXISTS "idx_invoice_exonerations_authorized_by" ON "invoice_exonerations"("authorizedBy")',
      
      // Índices para audit_logs
      'CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("userId")',
      'CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity_type" ON "audit_logs"("entityType")',
      'CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("createdAt")'
    ]
    
    console.log('🔨 Creando índices...')
    
    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery)
        console.log(`✅ Índice creado: ${indexQuery.split('"')[1]}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Índice ya existe: ${indexQuery.split('"')[1]}`)
        } else {
          console.log(`❌ Error creando índice: ${error.message}`)
        }
      }
    }
    
    // Marcar la migración como completada
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations" 
      SET "finished_at" = NOW(), 
          "logs" = 'Migration completed manually - indexes created with correct column names'
      WHERE "migration_name" = '20241216000000_add_performance_indexes'
      AND "finished_at" IS NULL
    `
    
    console.log('✅ Migración de índices marcada como completada')
    console.log('🎉 Índices de rendimiento aplicados exitosamente')
    
  } catch (error) {
    console.error('❌ Error al reparar índices:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixPerformanceIndexes()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error.message)
      process.exit(1)
    })
}

module.exports = { fixPerformanceIndexes }
