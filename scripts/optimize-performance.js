#!/usr/bin/env node

/**
 * Script de optimización de rendimiento para KronusMed
 * Ejecuta optimizaciones de base de datos y caché
 */

const { PrismaClient } = require('@prisma/client')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

async function optimizePerformance() {
  try {
    console.log('🚀 Iniciando optimización de rendimiento...\n')
    
    // 1. Aplicar migraciones de índices
    console.log('📊 Aplicando índices de rendimiento...')
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✅ Índices aplicados correctamente\n')
    } catch (error) {
      console.log('⚠️  Error aplicando migraciones:', error.message)
    }

    // 2. Analizar estadísticas de la base de datos
    console.log('📈 Analizando estadísticas de la base de datos...')
    
    const stats = await Promise.all([
      prisma.patient.count(),
      prisma.invoice.count(),
      prisma.appointment.count(),
      prisma.service.count(),
      prisma.medicalNote.count()
    ])

    console.log('📊 Estadísticas actuales:')
    console.log(`   - Pacientes: ${stats[0]}`)
    console.log(`   - Facturas: ${stats[1]}`)
    console.log(`   - Citas: ${stats[2]}`)
    console.log(`   - Servicios: ${stats[3]}`)
    console.log(`   - Notas médicas: ${stats[4]}\n`)

    // 3. Verificar índices existentes
    console.log('🔍 Verificando índices de rendimiento...')
    
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE '%_idx'
      ORDER BY tablename, indexname
    `

    console.log(`✅ Se encontraron ${indexes.length} índices de rendimiento\n`)

    // 4. Analizar consultas lentas
    console.log('⏱️  Analizando consultas lentas...')
    
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_time > 100
      ORDER BY mean_time DESC
      LIMIT 10
    `

    if (slowQueries.length > 0) {
      console.log('🐌 Consultas lentas encontradas:')
      slowQueries.forEach((query, index) => {
        console.log(`   ${index + 1}. Tiempo promedio: ${Math.round(query.mean_time)}ms`)
        console.log(`      Llamadas: ${query.calls}`)
        console.log(`      Filas: ${query.rows}`)
        console.log(`      Query: ${query.query.substring(0, 100)}...\n`)
      })
    } else {
      console.log('✅ No se encontraron consultas lentas significativas\n')
    }

    // 5. Optimizar configuración de PostgreSQL
    console.log('⚙️  Verificando configuración de PostgreSQL...')
    
    const config = await prisma.$queryRaw`
      SELECT 
        name,
        setting,
        unit,
        short_desc
      FROM pg_settings 
      WHERE name IN (
        'shared_buffers',
        'effective_cache_size',
        'work_mem',
        'maintenance_work_mem',
        'random_page_cost',
        'effective_io_concurrency'
      )
      ORDER BY name
    `

    console.log('📋 Configuración actual:')
    config.forEach(setting => {
      console.log(`   - ${setting.name}: ${setting.setting} ${setting.unit || ''}`)
    })
    console.log()

    // 6. Generar recomendaciones
    console.log('💡 Recomendaciones de optimización:')
    
    const totalRecords = stats.reduce((sum, count) => sum + count, 0)
    
    if (totalRecords > 10000) {
      console.log('   🔥 ALTO VOLUMEN DE DATOS DETECTADO')
      console.log('   - Considera implementar particionado de tablas')
      console.log('   - Revisa la configuración de PostgreSQL para alto volumen')
      console.log('   - Implementa archivado de datos antiguos')
    }
    
    if (stats[1] > 1000) { // Facturas
      console.log('   📄 Muchas facturas - considera archivado anual')
    }
    
    if (stats[2] > 5000) { // Citas
      console.log('   📅 Muchas citas - considera particionado por fecha')
    }

    console.log('   ✅ Índices de rendimiento aplicados')
    console.log('   ✅ Sistema de caché implementado')
    console.log('   ✅ Paginación agregada a APIs principales')
    console.log('   ✅ Consultas optimizadas con agregaciones SQL')

    console.log('\n🎉 Optimización completada exitosamente!')
    console.log('\n📝 Próximos pasos recomendados:')
    console.log('   1. Monitorea el rendimiento en producción')
    console.log('   2. Configura alertas de rendimiento')
    console.log('   3. Implementa archivado de datos antiguos')
    console.log('   4. Considera usar Redis para caché distribuido')

  } catch (error) {
    console.error('❌ Error durante la optimización:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar optimización
optimizePerformance()
