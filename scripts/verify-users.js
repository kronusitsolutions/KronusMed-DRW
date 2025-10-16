const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`\n📊 Total de usuarios: ${users.length}`)
    console.log('\n👥 Usuarios encontrados:')
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
    })

    if (users.length === 0) {
      console.log('\n❌ No se encontraron usuarios en la base de datos')
    } else {
      console.log('\n✅ Usuarios verificados correctamente')
    }

  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyUsers()
