const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Iniciando seed para Railway...')

    // Verificar si ya existen usuarios
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    })

    if (existingUsers.length > 0) {
      console.log(`✅ Ya existen ${existingUsers.length} usuarios en la base de datos`)
      existingUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`)
      })
      console.log('\n🔑 Credenciales disponibles:')
      console.log('   Email: admin@kronusmed.app')
      console.log('   Contraseña: admin123456')
      return
    }

    // Crear contraseña hasheada
    const hashedPassword = await bcrypt.hash('admin123456', 12)

    // Crear administrador principal
    const admin = await prisma.user.create({
      data: {
        email: 'admin@kronusmed.app',
        name: 'Administrador Principal',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('✅ Administrador creado exitosamente:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: admin@kronusmed.app`)
    console.log(`   Contraseña: admin123456`)
    console.log(`   Rol: ADMIN`)

    // Crear doctor de prueba
    const doctor = await prisma.user.create({
      data: {
        email: 'doctor@kronusmed.app',
        name: 'Dr. Sarah Johnson',
        password: hashedPassword,
        role: 'DOCTOR'
      }
    })

    console.log('✅ Doctor creado:')
    console.log(`   Email: doctor@kronusmed.app`)
    console.log(`   Contraseña: admin123456`)

    // Crear usuario de facturación
    const billing = await prisma.user.create({
      data: {
        email: 'billing@kronusmed.app',
        name: 'Facturación',
        password: hashedPassword,
        role: 'BILLING'
      }
    })

    console.log('✅ Usuario de facturación creado:')
    console.log(`   Email: billing@kronusmed.app`)
    console.log(`   Contraseña: admin123456`)

    console.log('\n🎉 Seed completado exitosamente!')
    console.log('🚀 Ya puedes iniciar sesión en Railway con cualquiera de estas credenciales')

  } catch (error) {
    console.error('❌ Error durante el seed:', error.message)
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
