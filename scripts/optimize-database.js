#!/usr/bin/env node

/**
 * Script para optimizar la base de datos para manejar miles de servicios
 * Ejecutar después de desplegar los cambios
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function optimizeDatabase() {
  try {
    console.log('🚀 Optimizando base de datos para alta capacidad...\n')
    
    // 1. Crear índices para optimizar consultas
    console.log('1. Creando índices de optimización...')
    
    const indexes = [
      // Índice para búsqueda por nombre
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_name 
       ON services USING gin(to_tsvector('spanish', name))`,
      
      // Índice para búsqueda por categoría
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category 
       ON services (category) WHERE category IS NOT NULL`,
      
      // Índice para servicios activos
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_active 
       ON services (is_active, name) WHERE is_active = true`,
      
      // Índice para ordenamiento por fecha
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_created_at 
       ON services (created_at DESC)`,
      
      // Índice compuesto para búsquedas complejas
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_search 
       ON services (is_active, category, name)`,
      
      // Índice para invoice_items por service_id
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoice_items_service_id 
       ON invoice_items (service_id)`,
      
      // Índice para appointments por service_id
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_service_id 
       ON appointments (service_id)`
    ]
    
    for (const indexQuery of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexQuery)
        console.log(`✅ Índice creado: ${indexQuery.split('idx_')[1].split(' ')[0]}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Índice ya existe: ${indexQuery.split('idx_')[1].split(' ')[0]}`)
        } else {
          console.log(`❌ Error creando índice: ${error.message}`)
        }
      }
    }
    
    // 2. Analizar tablas para optimizar el planificador
    console.log('\n2. Analizando tablas...')
    await prisma.$executeRaw`ANALYZE services`
    await prisma.$executeRaw`ANALYZE invoice_items`
    await prisma.$executeRaw`ANALYZE appointments`
    console.log('✅ Análisis completado')
    
    // 3. Verificar configuración de conexiones
    console.log('\n3. Verificando configuración de conexiones...')
    const connectionSettings = await prisma.$queryRaw`
      SELECT name, setting, unit 
      FROM pg_settings 
      WHERE name IN ('max_connections', 'shared_buffers', 'work_mem', 'maintenance_work_mem')
    `
    
    console.log('📊 Configuración actual:')
    connectionSettings.forEach(setting => {
      console.log(`   - ${setting.name}: ${setting.setting} ${setting.unit || ''}`)
    })
    
    // 4. Verificar estadísticas de uso
    console.log('\n4. Verificando estadísticas de uso...')
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE tablename IN ('services', 'invoice_items', 'appointments')
      ORDER BY n_live_tup DESC
    `
    
    console.log('📊 Estadísticas de tablas:')
    tableStats.forEach(table => {
      console.log(`   - ${table.tablename}:`)
      console.log(`     * Tuplas vivas: ${table.live_tuples}`)
      console.log(`     * Inserciones: ${table.inserts}`)
      console.log(`     * Actualizaciones: ${table.updates}`)
      console.log(`     * Eliminaciones: ${table.deletes}`)
    })
    
    // 5. Recomendaciones específicas
    console.log('\n💡 RECOMENDACIONES:')
    console.log('   1. Los índices mejorarán significativamente el rendimiento')
    console.log('   2. Considera ejecutar VACUUM periódicamente en producción')
    console.log('   3. Monitorea el uso de conexiones con /api/services/stats')
    console.log('   4. Implementa limpieza automática de datos antiguos si es necesario')
    console.log('   5. Considera particionar la tabla services si supera 1M registros')
    
    console.log('\n✅ Optimización completada exitosamente!')
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  optimizeDatabase()
}

module.exports = { optimizeDatabase }
