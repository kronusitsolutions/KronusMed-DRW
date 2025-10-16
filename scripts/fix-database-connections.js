#!/usr/bin/env node

/**
 * Script para diagnosticar y solucionar problemas de conexiones de base de datos
 * Ejecutar cuando el servidor falle después de agregar muchos servicios
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
})

async function fixDatabaseConnections() {
  try {
    console.log('🔧 Diagnosticando problemas de conexiones de base de datos...\n')
    
    // 1. Verificar conexión básica
    console.log('1. Probando conexión básica...')
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Conexión básica OK\n')
    
    // 2. Verificar número de servicios
    console.log('2. Contando servicios...')
    const serviceCount = await prisma.service.count()
    console.log(`📊 Total de servicios: ${serviceCount}\n`)
    
    // 3. Verificar conexiones activas
    console.log('3. Verificando conexiones activas...')
    try {
      const activeConnections = await prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `
      console.log(`🔗 Conexiones activas: ${activeConnections[0].active_connections}\n`)
    } catch (error) {
      console.log('⚠️ No se pudo obtener información de conexiones activas\n')
    }
    
    // 4. Limpiar conexiones inactivas
    console.log('4. Limpiando conexiones inactivas...')
    try {
      await prisma.$queryRaw`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE state = 'idle' 
        AND state_change < now() - interval '5 minutes'
      `
      console.log('✅ Conexiones inactivas limpiadas\n')
    } catch (error) {
      console.log('⚠️ No se pudieron limpiar conexiones inactivas\n')
    }
    
    // 5. Verificar estado de la base de datos
    console.log('5. Verificando estado de la base de datos...')
    const dbStatus = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `
    console.log('📊 Estado de la base de datos:')
    console.log(`   - Base de datos: ${dbStatus[0].database_name}`)
    console.log(`   - Usuario: ${dbStatus[0].current_user}`)
    console.log(`   - PostgreSQL: ${dbStatus[0].postgres_version.split(' ')[0]}\n`)
    
    // 6. Recomendaciones
    console.log('💡 RECOMENDACIONES:')
    console.log('   1. El problema es probablemente el límite de conexiones de Railway')
    console.log('   2. Considera actualizar el plan de Railway para más conexiones')
    console.log('   3. Implementa paginación en las consultas de servicios')
    console.log('   4. Usa cache para reducir consultas a la base de datos')
    console.log('   5. Considera usar un pool de conexiones más pequeño\n')
    
    console.log('✅ Diagnóstico completado')
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
    
    if (error.message.includes('connection')) {
      console.log('\n💡 SOLUCIÓN:')
      console.log('   - El servidor está sobrecargado')
      console.log('   - Espera unos minutos y reintenta')
      console.log('   - Considera reiniciar el servidor en Railway')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixDatabaseConnections()
}

module.exports = { fixDatabaseConnections }
