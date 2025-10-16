const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Verificando usuarios existentes...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log(`📊 Total de usuarios: ${users.length}`)
    
    if (users.length > 0) {
      console.log('\n👥 Usuarios encontrados:')
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role}`)
      })
    } else {
      console.log('❌ No se encontraron usuarios en la base de datos')
    }
    
  } catch (error) {
    console.error('❌ Error al consultar usuarios:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
