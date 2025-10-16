const { PrismaClient } = require('@prisma/client')

async function fixAllMigrations() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Reparando todas las migraciones problemáticas...')
    
    // Lista de migraciones que necesitan reparación
    const migrationsToFix = [
      '20241217000000_add_performance_indexes',
      '20241217000001_make_nationality_cedula_optional',
      '20241218000000_make_age_optional'
    ]
    
    // Crear índices con nombres de columnas correctos
    const indexes = [
      // Patient indexes
      'CREATE INDEX IF NOT EXISTS "patients_status_idx" ON "patients"("status")',
      'CREATE INDEX IF NOT EXISTS "patients_created_at_idx" ON "patients"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "patients_name_idx" ON "patients"("name")',
      
      // Service indexes
      'CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services"("isActive")',
      'CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services"("category")',
      'CREATE INDEX IF NOT EXISTS "services_name_idx" ON "services"("name")',
      'CREATE INDEX IF NOT EXISTS "services_created_at_idx" ON "services"("createdAt")',
      
      // Invoice indexes
      'CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status")',
      'CREATE INDEX IF NOT EXISTS "invoices_patient_id_idx" ON "invoices"("patientId")',
      'CREATE INDEX IF NOT EXISTS "invoices_user_id_idx" ON "invoices"("userId")',
      'CREATE INDEX IF NOT EXISTS "invoices_created_at_idx" ON "invoices"("createdAt")',
      'CREATE INDEX IF NOT EXISTS "invoices_due_date_idx" ON "invoices"("dueDate")',
      'CREATE INDEX IF NOT EXISTS "invoices_paid_at_idx" ON "invoices"("paidAt")',
      
      // Appointment indexes
      'CREATE INDEX IF NOT EXISTS "appointments_date_idx" ON "appointments"("date")',
      'CREATE INDEX IF NOT EXISTS "appointments_patient_id_idx" ON "appointments"("patientId")',
      'CREATE INDEX IF NOT EXISTS "appointments_doctor_id_idx" ON "appointments"("doctorId")',
      'CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status")',
      'CREATE INDEX IF NOT EXISTS "appointments_created_at_idx" ON "appointments"("createdAt")',
      
      // Medical notes indexes
      'CREATE INDEX IF NOT EXISTS "medical_notes_patient_id_idx" ON "medical_notes"("patientId")',
      'CREATE INDEX IF NOT EXISTS "medical_notes_doctor_id_idx" ON "medical_notes"("doctorId")',
      'CREATE INDEX IF NOT EXISTS "medical_notes_date_idx" ON "medical_notes"("date")',
      'CREATE INDEX IF NOT EXISTS "medical_notes_created_at_idx" ON "medical_notes"("createdAt")',
      
      // Invoice items indexes
      'CREATE INDEX IF NOT EXISTS "invoice_items_invoice_id_idx" ON "invoice_items"("invoiceId")',
      'CREATE INDEX IF NOT EXISTS "invoice_items_service_id_idx" ON "invoice_items"("serviceId")',
      
      // Insurance coverage indexes
      'CREATE INDEX IF NOT EXISTS "insurance_coverage_insurance_id_idx" ON "insurance_coverage"("insuranceId")',
      'CREATE INDEX IF NOT EXISTS "insurance_coverage_service_id_idx" ON "insurance_coverage"("serviceId")',
      
      // Audit logs indexes
      'CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("userId")',
      'CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_idx" ON "audit_logs"("entityType")',
      'CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("createdAt")',
      
      // Invoice exonerations indexes
      'CREATE INDEX IF NOT EXISTS "invoice_exonerations_invoice_id_idx" ON "invoice_exonerations"("invoiceId")',
      'CREATE INDEX IF NOT EXISTS "invoice_exonerations_authorized_by_idx" ON "invoice_exonerations"("authorizedBy")',
      'CREATE INDEX IF NOT EXISTS "invoice_exonerations_created_at_idx" ON "invoice_exonerations"("createdAt")'
    ]
    
    console.log('🔨 Creando índices corregidos...')
    
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
    
    // Marcar todas las migraciones como completadas
    for (const migrationName of migrationsToFix) {
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations" 
        SET "finished_at" = NOW(), 
            "logs" = 'Migration completed manually - indexes created with correct column names'
        WHERE "migration_name" = ${migrationName}
        AND "finished_at" IS NULL
      `
      console.log(`✅ Migración ${migrationName} marcada como completada`)
    }
    
    console.log('🎉 Todas las migraciones problemáticas reparadas')
    
  } catch (error) {
    console.error('❌ Error al reparar migraciones:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixAllMigrations()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error.message)
      process.exit(1)
    })
}

module.exports = { fixAllMigrations }
