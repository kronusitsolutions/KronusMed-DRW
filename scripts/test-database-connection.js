#!/usr/bin/env node

/**
 * Script para probar la conectividad de la base de datos
 * Útil para diagnosticar problemas de conexión
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('🔍 Probando conectividad de base de datos...\n')
    
    // Test 1: Conexión básica
    console.log('1️⃣ Probando conexión básica...')
    await prisma.$connect()
    console.log('✅ Conexión establecida correctamente\n')

    // Test 2: Consulta simple
    console.log('2️⃣ Probando consulta simple...')
    const userCount = await prisma.user.count()
    console.log(`✅ Usuarios en la base de datos: ${userCount}\n`)

    // Test 3: Consulta de pacientes
    console.log('3️⃣ Probando consulta de pacientes...')
    const patientCount = await prisma.patient.count()
    console.log(`✅ Pacientes en la base de datos: ${patientCount}\n`)

    // Test 4: Consulta de facturas
    console.log('4️⃣ Probando consulta de facturas...')
    const invoiceCount = await prisma.invoice.count()
    console.log(`✅ Facturas en la base de datos: ${invoiceCount}\n`)

    // Test 5: Consulta de citas
    console.log('5️⃣ Probando consulta de citas...')
    const appointmentCount = await prisma.appointment.count()
    console.log(`✅ Citas en la base de datos: ${appointmentCount}\n`)

    // Test 6: Consulta de servicios
    console.log('6️⃣ Probando consulta de servicios...')
    const serviceCount = await prisma.service.count()
    console.log(`✅ Servicios en la base de datos: ${serviceCount}\n`)

    // Test 7: Consulta con filtros
    console.log('7️⃣ Probando consultas con filtros...')
    const activePatients = await prisma.patient.count({
      where: { status: 'ACTIVE' }
    })
    console.log(`✅ Pacientes activos: ${activePatients}\n`)

    const pendingInvoices = await prisma.invoice.count({
      where: { status: 'PENDING' }
    })
    console.log(`✅ Facturas pendientes: ${pendingInvoices}\n`)

    // Test 8: Consulta de citas de hoy
    console.log('8️⃣ Probando consulta de citas de hoy...')
    const today = new Date().toISOString().split('T')[0]
    const todayAppointments = await prisma.appointment.count({
      where: {
        date: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })
    console.log(`✅ Citas de hoy: ${todayAppointments}\n`)

    // Test 9: Agregación
    console.log('9️⃣ Probando agregación...')
    const totalAmount = await prisma.invoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { totalAmount: true }
    })
    console.log(`✅ Monto total pendiente: ${totalAmount._sum.totalAmount || 0}\n`)

    // Test 10: Consulta con relaciones
    console.log('🔟 Probando consulta con relaciones...')
    const appointmentsWithRelations = await prisma.appointment.findMany({
      take: 3,
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    console.log(`✅ Citas con relaciones obtenidas: ${appointmentsWithRelations.length}\n`)

    console.log('🎉 Todas las pruebas de base de datos pasaron exitosamente!')
    console.log('\n📊 Resumen:')
    console.log(`   - Usuarios: ${userCount}`)
    console.log(`   - Pacientes: ${patientCount}`)
    console.log(`   - Facturas: ${invoiceCount}`)
    console.log(`   - Citas: ${appointmentCount}`)
    console.log(`   - Servicios: ${serviceCount}`)
    console.log(`   - Pacientes activos: ${activePatients}`)
    console.log(`   - Facturas pendientes: ${pendingInvoices}`)
    console.log(`   - Citas de hoy: ${todayAppointments}`)
    console.log(`   - Monto pendiente: ${totalAmount._sum.totalAmount || 0}`)

  } catch (error) {
    console.error('❌ Error en la prueba de base de datos:', error)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar prueba
testDatabaseConnection()
