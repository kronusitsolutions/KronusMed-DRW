#!/usr/bin/env node

/**
 * Script para probar el rendimiento después de las optimizaciones
 * Mide tiempos de respuesta de las APIs principales
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPerformance() {
  try {
    console.log('🚀 Probando rendimiento después de las optimizaciones...\n')
    
    const tests = [
      {
        name: 'Dashboard Stats',
        test: async () => {
          const start = Date.now()
          const [stats] = await prisma.$queryRaw`
            SELECT 
              (SELECT COUNT(*) FROM appointments WHERE DATE(date) = CURRENT_DATE) as today_appointments,
              (SELECT COUNT(*) FROM patients WHERE status = 'ACTIVE') as active_patients,
              (SELECT COUNT(*) FROM invoices WHERE status = 'PENDING') as pending_invoices,
              (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'PENDING') as pending_amount
          `
          const end = Date.now()
          return { duration: end - start, result: stats[0] }
        }
      },
      {
        name: 'Facturas Paginadas (Página 1)',
        test: async () => {
          const start = Date.now()
          const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
              take: 50,
              skip: 0,
              include: {
                patient: { select: { id: true, name: true, email: true } },
                user: { select: { id: true, name: true } },
                items: { 
                  take: 5,
                  include: { service: { select: { name: true, price: true } } }
                }
              },
              orderBy: { createdAt: "desc" }
            }),
            prisma.invoice.count()
          ])
          const end = Date.now()
          return { duration: end - start, result: { count: invoices.length, total } }
        }
      },
      {
        name: 'Servicios Paginados (Página 1)',
        test: async () => {
          const start = Date.now()
          const [services, total] = await Promise.all([
            prisma.service.findMany({
              where: { isActive: true },
              take: 50,
              skip: 0,
              orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
            }),
            prisma.service.count({ where: { isActive: true } })
          ])
          const end = Date.now()
          return { duration: end - start, result: { count: services.length, total } }
        }
      },
      {
        name: 'Pacientes Activos',
        test: async () => {
          const start = Date.now()
          const patients = await prisma.patient.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: "desc" }
          })
          const end = Date.now()
          return { duration: end - start, result: { count: patients.length } }
        }
      },
      {
        name: 'Citas de Hoy',
        test: async () => {
          const start = Date.now()
          const appointments = await prisma.appointment.findMany({
            where: {
              date: {
                gte: new Date(new Date().toISOString().split('T')[0])
              }
            },
            take: 4,
            include: {
              patient: { select: { id: true, name: true } },
              doctor: { select: { id: true, name: true } },
              service: { select: { id: true, name: true } }
            },
            orderBy: { date: 'asc' }
          })
          const end = Date.now()
          return { duration: end - start, result: { count: appointments.length } }
        }
      }
    ]

    console.log('📊 Ejecutando pruebas de rendimiento...\n')
    
    const results = []
    for (const test of tests) {
      try {
        console.log(`⏳ Ejecutando: ${test.name}...`)
        const result = await test.test()
        results.push({
          name: test.name,
          duration: result.duration,
          success: true,
          data: result.result
        })
        console.log(`✅ ${test.name}: ${result.duration}ms`)
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error.message}`)
        results.push({
          name: test.name,
          duration: 0,
          success: false,
          error: error.message
        })
      }
    }

    console.log('\n📈 RESUMEN DE RENDIMIENTO:')
    console.log('=' .repeat(50))
    
    const successfulTests = results.filter(r => r.success)
    const totalDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0)
    const averageDuration = successfulTests.length > 0 ? totalDuration / successfulTests.length : 0
    
    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const duration = result.success ? `${result.duration}ms` : 'ERROR'
      console.log(`${status} ${result.name}: ${duration}`)
    })
    
    console.log('=' .repeat(50))
    console.log(`📊 Total de pruebas: ${results.length}`)
    console.log(`✅ Exitosas: ${successfulTests.length}`)
    console.log(`❌ Fallidas: ${results.length - successfulTests.length}`)
    console.log(`⏱️ Tiempo total: ${totalDuration}ms`)
    console.log(`📈 Tiempo promedio: ${averageDuration.toFixed(2)}ms`)
    
    // Evaluación de rendimiento
    console.log('\n🎯 EVALUACIÓN DE RENDIMIENTO:')
    if (averageDuration < 100) {
      console.log('🟢 EXCELENTE: Tiempo de respuesta muy rápido')
    } else if (averageDuration < 500) {
      console.log('🟡 BUENO: Tiempo de respuesta aceptable')
    } else if (averageDuration < 1000) {
      console.log('🟠 REGULAR: Tiempo de respuesta lento')
    } else {
      console.log('🔴 MALO: Tiempo de respuesta muy lento')
    }
    
    // Verificar conexiones activas
    console.log('\n🔍 Verificando conexiones de base de datos...')
    try {
      const connections = await prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `
      console.log(`🔗 Conexiones activas: ${connections[0].active_connections}`)
    } catch (error) {
      console.log('⚠️ No se pudo obtener información de conexiones')
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas de rendimiento:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testPerformance()
}

module.exports = { testPerformance }
