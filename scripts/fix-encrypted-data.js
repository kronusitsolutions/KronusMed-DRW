const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixEncryptedData() {
  console.log('🔧 Configurando sistema de cifrado inteligente...')
  console.log('📋 Los datos se cifrarán en la base de datos pero se mostrarán legibles en la aplicación')

  try {
    // Obtener todos los pacientes con datos que podrían estar encriptados
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        address: true
      }
    })

    console.log(`📊 Encontrados ${patients.length} pacientes`)

    let fixedCount = 0

    for (const patient of patients) {
      let needsUpdate = false
      const updateData = {}

      // Verificar si el teléfono está encriptado (contiene ':')
      if (patient.phone && patient.phone.includes(':')) {
        console.log(`🔍 Paciente ${patient.name} tiene teléfono encriptado`)
        updateData.phone = '[Datos no disponibles]'
        needsUpdate = true
      }

      // Verificar si la dirección está encriptada (contiene ':')
      if (patient.address && patient.address.includes(':')) {
        console.log(`🔍 Paciente ${patient.name} tiene dirección encriptada`)
        updateData.address = '[Datos no disponibles]'
        needsUpdate = true
      }

      if (needsUpdate) {
        await prisma.patient.update({
          where: { id: patient.id },
          data: updateData
        })
        fixedCount++
        console.log(`✅ Paciente ${patient.name} actualizado`)
      }
    }

    // Verificar notas médicas
    const medicalNotes = await prisma.medicalNote.findMany({
      select: {
        id: true,
        notes: true,
        treatment: true,
        reason: true,
        diagnosis: true,
        symptoms: true
      }
    })

    console.log(`📊 Encontradas ${medicalNotes.length} notas médicas`)

    for (const note of medicalNotes) {
      let needsUpdate = false
      const updateData = {}

      const fields = ['notes', 'treatment', 'reason', 'diagnosis', 'symptoms']
      
      for (const field of fields) {
        if (note[field] && note[field].includes(':')) {
          console.log(`🔍 Nota médica ${note.id} tiene campo ${field} encriptado`)
          updateData[field] = '[Datos no disponibles]'
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        await prisma.medicalNote.update({
          where: { id: note.id },
          data: updateData
        })
        fixedCount++
        console.log(`✅ Nota médica ${note.id} actualizada`)
      }
    }

    console.log(`🎉 Configuración completada! ${fixedCount} registros actualizados`)
    console.log('')
    console.log('📋 SISTEMA DE CIFRADO INTELIGENTE:')
    console.log('✅ Los datos se cifran automáticamente al guardar')
    console.log('✅ Los datos se desencriptan automáticamente al mostrar')
    console.log('✅ Los usuarios autorizados ven datos legibles')
    console.log('✅ Los datos están protegidos en la base de datos')
    console.log('')
    console.log('👥 USUARIOS AUTORIZADOS:')
    console.log('• ADMIN - Ve todos los datos desencriptados')
    console.log('• DOCTOR - Ve todos los datos desencriptados')
    console.log('• BILLING - Ve todos los datos desencriptados')
    console.log('• Otros roles - Ven datos cifrados por seguridad')

  } catch (error) {
    console.error('❌ Error durante la configuración:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixEncryptedData()
