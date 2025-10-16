const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initFeatureFlags() {
  console.log('🚀 Inicializando feature flags del sistema de seguros...\n')

  try {
    const featureFlags = [
      {
        name: 'insurance_system',
        isEnabled: false,
        description: 'Sistema de seguros médicos con cálculo automático de cobertura'
      },
      {
        name: 'insurance_billing',
        isEnabled: false,
        description: 'Integración de seguros en facturación'
      },
      {
        name: 'insurance_pdf',
        isEnabled: false,
        description: 'Inclusión de información de seguros en PDFs'
      }
    ]

    for (const flag of featureFlags) {
      const existingFlag = await prisma.featureFlag.findUnique({
        where: { name: flag.name }
      })

      if (existingFlag) {
        console.log(`⚠️ Feature flag '${flag.name}' ya existe`)
      } else {
        await prisma.featureFlag.create({
          data: flag
        })
        console.log(`✅ Feature flag '${flag.name}' creado`)
      }
    }

    console.log('\n🎉 Feature flags inicializados correctamente!')
    console.log('\n📋 Para activar el sistema de seguros:')
    console.log('   1. Ve a Configuración del Sistema')
    console.log('   2. Activa "Sistema de Seguros"')
    console.log('   3. Activa "Facturación con Seguros"')
    console.log('   4. Activa "PDFs con Seguros" (opcional)')
    console.log('   5. Configura seguros en Gestión de Seguros')

  } catch (error) {
    console.error('❌ Error al inicializar feature flags:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la inicialización
initFeatureFlags()
