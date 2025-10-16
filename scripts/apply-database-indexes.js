#!/usr/bin/env node

/**
 * Script para aplicar índices de optimización a la base de datos
 * Ejecuta de forma segura los índices necesarios para mejorar el rendimiento
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyDatabaseIndexes() {
  try {
    console.log('🔧 Aplicando índices de optimización a la base de datos...\n')
    
    // Leer el archivo SQL de índices
    const sqlFilePath = path.join(__dirname, 'optimize-database-indexes.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Dividir el contenido en declaraciones individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Encontradas ${statements.length} declaraciones de índices\n`)
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    
    // Aplicar cada índice individualmente
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.includes('CREATE INDEX')) {
        try {
          console.log(`⏳ Aplicando índice ${i + 1}/${statements.length}...`)
          await prisma.$executeRawUnsafe(statement)
          console.log(`✅ Índice aplicado exitosamente`)
          successCount++
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`⚠️ Índice ya existe, omitiendo`)
            skipCount++
          } else {
            console.log(`❌ Error al aplicar índice: ${error.message}`)
            errorCount++
          }
        }
      } else if (statement.includes('SELECT')) {
        // Ejecutar consulta de verificación
        try {
          console.log(`🔍 Verificando índices...`)
          const result = await prisma.$queryRawUnsafe(statement)
          console.log(`📊 Índices encontrados: ${result.length}`)
        } catch (error) {
          console.log(`⚠️ Error en verificación: ${error.message}`)
        }
      }
    }
    
    console.log('\n📊 RESUMEN DE APLICACIÓN DE ÍNDICES:')
    console.log(`✅ Índices aplicados exitosamente: ${successCount}`)
    console.log(`⚠️ Índices ya existentes (omitidos): ${skipCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Todos los índices se aplicaron correctamente!')
      console.log('📈 El rendimiento de la base de datos debería mejorar significativamente')
    } else {
      console.log('\n⚠️ Algunos índices tuvieron errores, pero la mayoría se aplicaron')
    }
    
    // Verificar conexiones activas después de aplicar índices
    console.log('\n🔍 Verificando estado de la base de datos...')
    const dbStatus = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `
    console.log('📊 Estado de la base de datos:')
    console.log(`   - Base de datos: ${dbStatus[0].database_name}`)
    console.log(`   - Usuario: ${dbStatus[0].current_user}`)
    console.log(`   - PostgreSQL: ${dbStatus[0].postgres_version.split(' ')[0]}`)
    
  } catch (error) {
    console.error('❌ Error general al aplicar índices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  applyDatabaseIndexes()
}

module.exports = { applyDatabaseIndexes }
