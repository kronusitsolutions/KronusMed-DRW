import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuración simplificada para evitar problemas de compatibilidad
const prismaConfig: any = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error'],
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaConfig)

// Configuración de desconexión automática en desarrollo
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  
  // Limpiar conexiones inactivas cada 5 minutos en desarrollo
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      console.warn('Error en limpieza de conexiones:', error)
    }
  }, 300000)
}

// Manejo de errores de conexión
// Event listener para errores de Prisma
;(prisma as any).$on('error', (e: any) => {
  console.error('Prisma error:', e)
})

// Configuración de desconexión graceful
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
