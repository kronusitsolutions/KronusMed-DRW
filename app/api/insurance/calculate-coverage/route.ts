import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InsuranceCalculation, InvoiceCalculation } from "@/lib/insurance-calculator"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { patientId, services, insuranceId } = body

    if (!patientId || !services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: "Datos requeridos: patientId y services" },
        { status: 400 }
      )
    }

    // Obtener el paciente
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        insurance: true
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      )
    }

    // Determinar qué seguro usar
    let insuranceToUse = null
    if (insuranceId) {
      insuranceToUse = await prisma.insurance.findUnique({
        where: { id: insuranceId }
      })
    } else if (patient.insurance) {
      insuranceToUse = patient.insurance
    }

    // Si no hay seguro, retornar cálculo sin cobertura
    if (!insuranceToUse) {
      const items: InsuranceCalculation[] = services.map(service => ({
        serviceId: service.serviceId,
        serviceName: "", // Se llenará después
        basePrice: service.unitPrice * service.quantity,
        coveragePercent: 0,
        insuranceCovers: 0,
        patientPays: service.unitPrice * service.quantity
      }))

      return NextResponse.json({
        items,
        totalBaseAmount: services.reduce((sum, s) => sum + (s.unitPrice * s.quantity), 0),
        totalInsuranceCovers: 0,
        totalPatientPays: services.reduce((sum, s) => sum + (s.unitPrice * s.quantity), 0)
      })
    }

    // Obtener las reglas de cobertura para los servicios
    const serviceIds = services.map(s => s.serviceId)
    const coverageRules = await prisma.insuranceCoverage.findMany({
      where: {
        insuranceId: insuranceToUse.id,
        serviceId: { in: serviceIds },
        isActive: true
      },
      include: {
        service: true
      }
    })

    // Crear un mapa de cobertura por servicio
    const coverageMap = new Map(
      coverageRules.map(rule => [
        rule.serviceId,
        {
          coveragePercent: rule.coveragePercent,
          serviceName: rule.service.name
        }
      ])
    )

    // Calcular cobertura para cada servicio
    const items: InsuranceCalculation[] = services.map(service => {
      const coverage = coverageMap.get(service.serviceId)
      const coveragePercent = (coverage as any)?.coveragePercent || 0
      const basePrice = service.unitPrice
      const totalBasePrice = basePrice * service.quantity
      const insuranceCovers = (totalBasePrice * coveragePercent) / 100
      const patientPays = totalBasePrice - insuranceCovers

      return {
        serviceId: service.serviceId,
        serviceName: (coverage as any)?.serviceName || "",
        basePrice: totalBasePrice,
        coveragePercent,
        insuranceCovers,
        patientPays,
        insuranceName: insuranceToUse.name
      }
    })

    // Calcular totales
    const totalBaseAmount = items.reduce((sum, item) => sum + item.basePrice, 0)
    const totalInsuranceCovers = items.reduce((sum, item) => sum + item.insuranceCovers, 0)
    const totalPatientPays = items.reduce((sum, item) => sum + item.patientPays, 0)

    const result: InvoiceCalculation = {
      items,
      totalBaseAmount,
      totalInsuranceCovers,
      totalPatientPays
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error calculando cobertura de seguros:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
