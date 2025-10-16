import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.appointment.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.service.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('password123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@clinica.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@clinica.com',
      name: 'Dr. Sarah Johnson',
      password: hashedPassword,
      role: 'DOCTOR'
    }
  })

  const billing = await prisma.user.create({
    data: {
      email: 'billing@clinica.com',
      name: 'Facturación',
      password: hashedPassword,
      role: 'BILLING'
    }
  })

  // Crear servicios
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Consulta General',
        description: 'Consulta médica general',
        price: 50.0,
        category: 'Consultas'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Consulta Especializada',
        description: 'Consulta con especialista',
        price: 80.0,
        category: 'Consultas'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Análisis de Sangre',
        description: 'Análisis completo de sangre',
        price: 120.0,
        category: 'Laboratorio'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Radiografía',
        description: 'Radiografía simple',
        price: 90.0,
        category: 'Imágenes'
      }
    }),
    prisma.service.create({
      data: {
        name: 'Vacuna',
        description: 'Aplicación de vacuna',
        price: 30.0,
        category: 'Vacunación'
      }
    })
  ])

  // Crear pacientes
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        patientNumber: 'A000001',
        name: 'John Smith',
        age: 45,
        gender: 'MALE',
        phone: '(555) 123-4567',
        nationality: 'Estadounidense',
        cedula: '1234567890',
        status: 'ACTIVE'
      }
    }),
    prisma.patient.create({
      data: {
        patientNumber: 'A000002',
        name: 'Emily Davis',
        age: 32,
        gender: 'FEMALE',
        phone: '(555) 234-5678',
        nationality: 'Canadiense',
        cedula: '0987654321',
        status: 'ACTIVE'
      }
    }),
    prisma.patient.create({
      data: {
        patientNumber: 'A000003',
        name: 'Robert Wilson',
        age: 58,
        gender: 'MALE',
        phone: '(555) 345-6789',
        nationality: 'Británico',
        cedula: '1122334455',
        status: 'ACTIVE'
      }
    }),
    prisma.patient.create({
      data: {
        patientNumber: 'A000004',
        name: 'María García',
        age: 28,
        gender: 'FEMALE',
        phone: '(555) 456-7890',
        nationality: 'Dominicana',
        cedula: '0012345678',
        status: 'ACTIVE'
      }
    })
  ])

  // Crear algunas facturas de ejemplo
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now()}-001`,
      patientId: patients[0].id,
      userId: billing.id,
        totalAmount: 170.0,
        status: 'PENDING',
      items: {
        create: [
          {
            serviceId: services[0].id,
            quantity: 1,
            unitPrice: 50.0,
            totalPrice: 50.0
          },
          {
            serviceId: services[2].id,
            quantity: 1,
            unitPrice: 120.0,
            totalPrice: 120.0
          }
        ]
      }
    }
  })

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now()}-002`,
      patientId: patients[1].id,
      userId: billing.id,
        totalAmount: 110.0,
        status: 'PAID',
      paidAt: new Date(),
      items: {
        create: [
          {
            serviceId: services[1].id,
            quantity: 1,
            unitPrice: 80.0,
            totalPrice: 80.0
          },
          {
            serviceId: services[4].id,
            quantity: 1,
            unitPrice: 30.0,
            totalPrice: 30.0
          }
        ]
      }
    }
  })

  // Crear algunas citas de ejemplo
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        serviceId: services[0].id,
        date: today,
        startTime: "09:00",
        endTime: "09:30",
        reason: "Consulta de control",
        status: "CONFIRMED"
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctor.id,
        serviceId: services[1].id,
        date: today,
        startTime: "10:30",
        endTime: "11:00",
        reason: "Seguimiento diabetes",
        status: "CONFIRMED"
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctor.id,
        date: today,
        startTime: "11:15",
        endTime: "11:45",
        reason: "Revisión artritis",
        status: "SCHEDULED"
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        doctorId: doctor.id,
        serviceId: services[4].id,
        date: tomorrow,
        startTime: "14:00",
        endTime: "14:30",
        reason: "Vacunación",
        status: "SCHEDULED"
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctor.id,
        serviceId: services[2].id,
        date: nextWeek,
        startTime: "09:00",
        endTime: "09:30",
        reason: "Resultados de análisis",
        status: "SCHEDULED"
      }
    })
  ])

  console.log('✅ Seed completado exitosamente!')
  console.log(`👥 Usuarios creados: ${admin.name}, ${doctor.name}, ${billing.name}`)
  console.log(`🏥 Servicios creados: ${services.length}`)
  console.log(`👨‍⚕️ Pacientes creados: ${patients.length}`)
  console.log(`💰 Facturas creadas: 2`)
  console.log(`📅 Citas creadas: ${appointments.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
