const { PrismaClient } = require('@prisma/client')

// Configurar Prisma sin SSL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('sslmode=require', 'sslmode=disable') || 
           process.env.DATABASE_URL?.replace('sslmode=prefer', 'sslmode=disable') ||
           process.env.DATABASE_URL + '?sslmode=disable'
    }
  }
})

async function testAppointmentNoSSL() {
  try {
    console.log('=== DEBUGGING APPOINTMENT CREATION (NO SSL) ===')
    
    // Verificar que las tablas existen
    console.log('\n1. Verificando tablas...')
    
    // Verificar pacientes
    const patients = await prisma.patient.findMany({ take: 1 })
    console.log('Pacientes encontrados:', patients.length)
    if (patients.length > 0) {
      console.log('Primer paciente:', patients[0].name, patients[0].id)
    }
    
    // Verificar doctores virtuales
    const virtualDoctors = await prisma.doctor.findMany({ take: 1 })
    console.log('Doctores virtuales encontrados:', virtualDoctors.length)
    if (virtualDoctors.length > 0) {
      console.log('Primer doctor virtual:', virtualDoctors[0].name, virtualDoctors[0].id)
    }
    
    // Verificar usuarios doctores
    const userDoctors = await prisma.user.findMany({ 
      where: { role: 'DOCTOR' },
      take: 1 
    })
    console.log('Usuarios doctores encontrados:', userDoctors.length)
    if (userDoctors.length > 0) {
      console.log('Primer usuario doctor:', userDoctors[0].name, userDoctors[0].id)
    }
    
    // Verificar servicios
    const services = await prisma.service.findMany({ take: 1 })
    console.log('Servicios encontrados:', services.length)
    if (services.length > 0) {
      console.log('Primer servicio:', services[0].name, services[0].id)
    }
    
    // Verificar estructura de la tabla appointments
    console.log('\n2. Verificando estructura de appointments...')
    const appointmentCount = await prisma.appointment.count()
    console.log('Total de citas existentes:', appointmentCount)
    
    // Intentar crear una cita de prueba
    console.log('\n3. Intentando crear cita de prueba...')
    
    if (patients.length === 0) {
      console.log('ERROR: No hay pacientes en la base de datos')
      return
    }
    
    if (virtualDoctors.length === 0 && userDoctors.length === 0) {
      console.log('ERROR: No hay doctores en la base de datos')
      return
    }
    
    const testData = {
      patientId: patients[0].id,
      doctorProfileId: virtualDoctors.length > 0 ? virtualDoctors[0].id : undefined,
      doctorId: virtualDoctors.length === 0 && userDoctors.length > 0 ? userDoctors[0].id : undefined,
      serviceId: services.length > 0 ? services[0].id : undefined,
      date: new Date('2025-06-10T00:00:00.000Z'),
      reason: 'Prueba de cita',
      notes: 'Cita de prueba para debugging',
      status: 'SCHEDULED'
    }
    
    console.log('Datos de prueba:', testData)
    
    // Intentar crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        date: testData.date,
        reason: testData.reason,
        notes: testData.notes,
        status: testData.status,
        patient: { connect: { id: testData.patientId } },
        ...(testData.doctorProfileId && { doctorProfile: { connect: { id: testData.doctorProfileId } } }),
        ...(testData.doctorId && { doctor: { connect: { id: testData.doctorId } } }),
        ...(testData.serviceId && { service: { connect: { id: testData.serviceId } } })
      },
      include: {
        patient: true,
        doctor: true,
        doctorProfile: true,
        service: true
      }
    })
    
    console.log('✅ Cita creada exitosamente:', appointment.id)
    console.log('Cita completa:', JSON.stringify(appointment, null, 2))
    
    // Limpiar la cita de prueba
    await prisma.appointment.delete({ where: { id: appointment.id } })
    console.log('✅ Cita de prueba eliminada')
    
  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('Stack trace:', error.stack)
    
    if (error.code) {
      console.error('Error code:', error.code)
    }
    
    if (error.meta) {
      console.error('Error meta:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testAppointmentNoSSL()

