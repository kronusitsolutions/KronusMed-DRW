const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateServiceIds() {
  try {
    console.log('🔄 Iniciando migración de IDs de servicios...')
    
    // Obtener todos los servicios ordenados por fecha de creación
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`📋 Encontrados ${services.length} servicios para migrar`)
    
    // Migrar cada servicio con un nuevo ID secuencial
    for (let i = 0; i < services.length; i++) {
      const service = services[i]
      const newId = `serv${(i + 1).toString().padStart(4, '0')}`
      
      console.log(`🔄 Migrando servicio: ${service.id} → ${newId} (${service.name})`)
      
      // Actualizar el servicio con el nuevo ID
      await prisma.service.update({
        where: { id: service.id },
        data: { id: newId }
      })
    }
    
    console.log('✅ Migración completada exitosamente!')
    console.log('📊 Servicios migrados:')
    
    // Mostrar los servicios migrados
    const migratedServices = await prisma.service.findMany({
      orderBy: { id: 'asc' }
    })
    
    migratedServices.forEach(service => {
      console.log(`  • ${service.id}: ${service.name} - $${service.price}`)
    })
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
migrateServiceIds()
