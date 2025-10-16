const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Configurando aplicación para Railway...')

    // Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Conexión a la base de datos exitosa')

    // Verificar si existen usuarios
    const userCount = await prisma.user.count()
    console.log(`📊 Usuarios en la base de datos: ${userCount}`)

    if (userCount === 0) {
      console.log('⚠️  No se encontraron usuarios. Ejecuta el script de seed:')
      console.log('   node scripts/railway-seed.js')
    } else {
      // Mostrar usuarios existentes
      const users = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      })

      console.log('\n👥 Usuarios disponibles:')
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })

      console.log('\n🔑 Credenciales de acceso:')
      console.log('   Email: admin@kronusmed.app')
      console.log('   Contraseña: admin123456')
    }

    // Verificar citas existentes
    const appointmentCount = await prisma.appointment.count()
    console.log(`\n📅 Citas en la base de datos: ${appointmentCount}`)

    if (appointmentCount > 0) {
      const recentAppointments = await prisma.appointment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
          doctorProfile: { select: { name: true } }
        }
      })

      console.log('\n📋 Citas recientes:')
      recentAppointments.forEach((apt, index) => {
        const doctorName = apt.doctor?.name || apt.doctorProfile?.name || 'Sin doctor'
        console.log(`${index + 1}. ${apt.patient.name} - ${doctorName} - ${apt.date.toISOString().split('T')[0]}`)
      })
    }

    console.log('\n✅ Configuración completada!')
    console.log('🌐 La aplicación está lista para usar en Railway')

  } catch (error) {
    console.error('❌ Error en la configuración:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
