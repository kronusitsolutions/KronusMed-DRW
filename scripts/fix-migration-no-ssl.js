const { PrismaClient } = require('@prisma/client')

async function fixFailedMigrationNoSSL() {
  // Crear cliente con configuración sin SSL para producción
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL?.replace('?sslmode=require', '?sslmode=disable') || process.env.DATABASE_URL
      }
    }
  })
  
  try {
    console.log('🔍 Conectando a base de datos sin SSL...')
    
    // Verificar conexión
    await prisma.$connect()
    console.log('✅ Conexión establecida')
    
    // Verificar si la columna ya existe
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name = 'insuranceCalculation'
    `
    
    if (tableInfo.length > 0) {
      console.log('✅ La columna insuranceCalculation ya existe')
      
      // Marcar migración como completada
      await prisma.$executeRaw`
        UPDATE "_prisma_migrations" 
        SET "finished_at" = NOW(), 
            "logs" = 'Migration completed manually - column already exists'
        WHERE "migration_name" = '20241211000000_add_insurance_calculation_to_invoices'
        AND "finished_at" IS NULL
      `
      
      console.log('✅ Migración marcada como completada')
    } else {
      console.log('⚠️  Aplicando migración...')
      
      await prisma.$executeRaw`
        ALTER TABLE "invoices" ADD COLUMN "insuranceCalculation" JSONB
      `
      
      console.log('✅ Migración aplicada exitosamente')
    }
    
    console.log('🎉 Problema resuelto')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    
    // Intentar con conexión directa a PostgreSQL
    console.log('🔄 Intentando conexión directa...')
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL?.replace('?sslmode=require', '?sslmode=disable')
    })
    
    try {
      await client.connect()
      console.log('✅ Conexión directa establecida')
      
      // Verificar columna
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'insuranceCalculation'
      `)
      
      if (result.rows.length > 0) {
        console.log('✅ Columna ya existe, marcando migración como completada')
        
        await client.query(`
          UPDATE "_prisma_migrations" 
          SET "finished_at" = NOW(), 
              "logs" = 'Migration completed manually - column already exists'
          WHERE "migration_name" = '20241211000000_add_insurance_calculation_to_invoices'
          AND "finished_at" IS NULL
        `)
      } else {
        console.log('⚠️  Aplicando migración...')
        
        await client.query(`
          ALTER TABLE "invoices" ADD COLUMN "insuranceCalculation" JSONB
        `)
        
        console.log('✅ Migración aplicada')
      }
      
      await client.end()
      console.log('🎉 Problema resuelto con conexión directa')
      
    } catch (directError) {
      console.error('❌ Error en conexión directa:', directError.message)
      throw directError
    }
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixFailedMigrationNoSSL()
    .then(() => {
      console.log('✅ Script completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error.message)
      process.exit(1)
    })
}

module.exports = { fixFailedMigrationNoSSL }
