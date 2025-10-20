const { PrismaClient } = require('@prisma/client')

// Configurar variable de entorno
process.env.DATABASE_URL = "postgresql://medical_user:medical_password_2024@localhost:5432/medical_clinic?sslmode=disable"

const prisma = new PrismaClient()

async function addPriceTypeColumn() {
  try {
    console.log('🔄 Iniciando migración para agregar campo priceType...')
    
    // Verificar si la columna ya existe
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'services' AND column_name = 'priceType'
    `
    
    if (tableInfo.length > 0) {
      console.log('✅ La columna priceType ya existe en la tabla services')
      return
    }
    
    // Agregar el enum PriceType si no existe
    console.log('📝 Creando enum PriceType...')
    await prisma.$queryRaw`
      CREATE TYPE "PriceType" AS ENUM ('FIXED', 'DYNAMIC')
    `
    console.log('✅ Enum PriceType creado')
    
    // Agregar la columna priceType con valor por defecto FIXED
    console.log('📝 Agregando columna priceType...')
    await prisma.$queryRaw`
      ALTER TABLE "services" 
      ADD COLUMN "priceType" "PriceType" NOT NULL DEFAULT 'FIXED'
    `
    console.log('✅ Columna priceType agregada con valor por defecto FIXED')
    
    // Verificar que todos los servicios existentes tengan el valor FIXED
    const servicesCount = await prisma.service.count()
    console.log(`📊 Total de servicios existentes: ${servicesCount}`)
    
    const fixedServicesCount = await prisma.service.count({
      where: { priceType: 'FIXED' }
    })
    console.log(`📊 Servicios con precio fijo: ${fixedServicesCount}`)
    
    console.log('🎉 Migración completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
addPriceTypeColumn()
  .then(() => {
    console.log('✅ Migración finalizada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en la migración:', error)
    process.exit(1)
  })
