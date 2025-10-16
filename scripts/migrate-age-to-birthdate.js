/**
 * Script de migración para convertir edad a fecha de nacimiento
 * Este script calcula una fecha de nacimiento aproximada basada en la edad actual
 * 
 * IMPORTANTE: Ejecutar en un entorno de desarrollo primero para probar
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Calcula una fecha de nacimiento aproximada basada en la edad
 * @param {number} age - Edad en años
 * @returns {Date} Fecha de nacimiento aproximada
 */
function calculateBirthDateFromAge(age) {
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - age
  return new Date(birthYear, 0, 1) // 1 de enero del año calculado
}

/**
 * Migra los datos de edad a fecha de nacimiento
 */
async function migrateAgeToBirthDate() {
  try {
    console.log('🔄 Iniciando migración de edad a fecha de nacimiento...')
    
    // Obtener todos los pacientes que tienen edad pero no fecha de nacimiento
    const patientsToMigrate = await prisma.patient.findMany({
      where: {
        age: {
          not: null
        },
        birthDate: null
      },
      select: {
        id: true,
        name: true,
        age: true
      }
    })
    
    console.log(`📊 Encontrados ${patientsToMigrate.length} pacientes para migrar`)
    
    if (patientsToMigrate.length === 0) {
      console.log('✅ No hay pacientes que necesiten migración')
      return
    }
    
    // Mostrar preview de los datos que se van a migrar
    console.log('\n📋 Preview de la migración:')
    patientsToMigrate.slice(0, 5).forEach(patient => {
      const birthDate = calculateBirthDateFromAge(patient.age)
      console.log(`- ${patient.name}: ${patient.age} años → ${birthDate.toISOString().split('T')[0]}`)
    })
    
    if (patientsToMigrate.length > 5) {
      console.log(`... y ${patientsToMigrate.length - 5} más`)
    }
    
    // Preguntar confirmación
    console.log('\n⚠️  ADVERTENCIA: Esta operación modificará los datos existentes.')
    console.log('   Se recomienda hacer un backup antes de continuar.')
    console.log('   Para continuar, descomenta la línea de confirmación en el script.')
    
    // Descomenta la siguiente línea para ejecutar la migración real
    // await executeMigration(patientsToMigrate)
    
    console.log('\n✅ Script completado. Revisa los datos antes de ejecutar la migración real.')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Ejecuta la migración real
 * @param {Array} patients - Lista de pacientes a migrar
 */
async function executeMigration(patients) {
  console.log('\n🔄 Ejecutando migración...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const patient of patients) {
    try {
      const birthDate = calculateBirthDateFromAge(patient.age)
      
      await prisma.patient.update({
        where: { id: patient.id },
        data: { birthDate: birthDate }
      })
      
      successCount++
      console.log(`✅ Migrado: ${patient.name}`)
      
    } catch (error) {
      errorCount++
      console.error(`❌ Error migrando ${patient.name}:`, error.message)
    }
  }
  
  console.log(`\n📊 Resumen de migración:`)
  console.log(`   ✅ Exitosos: ${successCount}`)
  console.log(`   ❌ Errores: ${errorCount}`)
  console.log(`   📈 Total: ${patients.length}`)
}

/**
 * Verifica el estado de la migración
 */
async function checkMigrationStatus() {
  try {
    const totalPatients = await prisma.patient.count()
    const patientsWithBirthDate = await prisma.patient.count({
      where: { birthDate: { not: null } }
    })
    const patientsWithAgeOnly = await prisma.patient.count({
      where: {
        age: { not: null },
        birthDate: null
      }
    })
    
    console.log('📊 Estado de la migración:')
    console.log(`   Total de pacientes: ${totalPatients}`)
    console.log(`   Con fecha de nacimiento: ${patientsWithBirthDate}`)
    console.log(`   Solo con edad: ${patientsWithAgeOnly}`)
    console.log(`   Progreso: ${((patientsWithBirthDate / totalPatients) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error)
  }
}

// Ejecutar el script
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'check') {
    checkMigrationStatus()
  } else {
    migrateAgeToBirthDate()
  }
}

module.exports = {
  migrateAgeToBirthDate,
  executeMigration,
  checkMigrationStatus
}
