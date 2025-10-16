import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const insuranceId = searchParams.get("insuranceId")

    // Configurar rango de fechas
    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    }

    // Obtener todas las aseguradoras
    const insurances = await prisma.insurance.findMany({
      where: insuranceId ? { id: insuranceId } : {},
      include: {
        patients: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            patientNumber: true
          }
        },
        coverageRules: {
          include: {
            service: {
              select: {
                name: true,
                category: true,
                price: true
              }
            }
          }
        }
      }
    })

    // Obtener facturas que usaron seguros en el período
    const invoicesWithInsurance = await prisma.invoice.findMany({
      where: {
        ...dateFilter,
        insuranceCalculation: {
          not: null
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            patientNumber: true,
            insurance: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Procesar datos por aseguradora
    const insuranceReports = insurances.map(insurance => {
      // Filtrar facturas de esta aseguradora
      const insuranceInvoices = invoicesWithInsurance.filter(invoice => 
        invoice.patient.insurance?.id === insurance.id
      )

      // Calcular estadísticas de servicios utilizados
      const serviceUsage = new Map()
      let totalOriginalAmount = 0
      let totalPatientPays = 0
      let totalInsuranceCovers = 0
      let totalDiscounts = 0

      insuranceInvoices.forEach(invoice => {
        const insuranceCalc = invoice.insuranceCalculation as any
        
        if (insuranceCalc) {
          totalOriginalAmount += insuranceCalc.totalOriginalAmount || 0
          totalPatientPays += insuranceCalc.totalPatientPays || 0
          totalInsuranceCovers += insuranceCalc.totalInsuranceCovers || 0
          totalDiscounts += (insuranceCalc.totalOriginalAmount || 0) - (insuranceCalc.totalPatientPays || 0)

          // Procesar cada servicio en la factura
          invoice.items.forEach(item => {
            const serviceId = item.service.id
            const serviceName = item.service.name
            const serviceCategory = item.service.category

            if (!serviceUsage.has(serviceId)) {
              serviceUsage.set(serviceId, {
                serviceId,
                serviceName,
                serviceCategory,
                originalPrice: item.service.price,
                totalQuantity: 0,
                totalOriginalAmount: 0,
                totalPatientPays: 0,
                totalInsuranceCovers: 0,
                totalDiscounts: 0,
                usageCount: 0,
                coveragePercent: 0
              })
            }

            const serviceData = serviceUsage.get(serviceId)
            serviceData.totalQuantity += item.quantity
            serviceData.totalOriginalAmount += item.totalPrice
            
            // Calcular cobertura para este servicio específico
            const itemOriginalAmount = item.totalPrice
            const itemCoveragePercent = insurance.coverageRules.find(rule => 
              rule.serviceId === serviceId
            )?.coveragePercent || 0
            
            const itemInsuranceCovers = (itemOriginalAmount * itemCoveragePercent) / 100
            const itemPatientPays = itemOriginalAmount - itemInsuranceCovers
            const itemDiscounts = itemOriginalAmount - itemPatientPays

            serviceData.totalPatientPays += itemPatientPays
            serviceData.totalInsuranceCovers += itemInsuranceCovers
            serviceData.totalDiscounts += itemDiscounts
            serviceData.usageCount += 1
            serviceData.coveragePercent = itemCoveragePercent
          })
        }
      })

      // Convertir Map a Array y ordenar por descuentos
      const serviceUsageArray = Array.from(serviceUsage.values())
        .sort((a, b) => b.totalDiscounts - a.totalDiscounts)

      // Calcular estadísticas de cobertura
      const coverageStats = insurance.coverageRules.map(rule => ({
        serviceId: rule.serviceId,
        serviceName: rule.service.name,
        serviceCategory: rule.service.category,
        coveragePercent: rule.coveragePercent,
        isActive: rule.isActive
      }))

      return {
        insurance: {
          id: insurance.id,
          name: insurance.name,
          description: insurance.description,
          patientCount: insurance.patients.length
        },
        summary: {
          totalInvoices: insuranceInvoices.length,
          totalOriginalAmount,
          totalPatientPays,
          totalInsuranceCovers,
          totalDiscounts,
          avgDiscountPerInvoice: insuranceInvoices.length > 0 ? (totalDiscounts / insuranceInvoices.length) : 0,
          avgCoveragePercent: serviceUsageArray.length > 0 ? 
            (serviceUsageArray.reduce((sum, s) => sum + s.coveragePercent, 0) / serviceUsageArray.length) : 0
        },
        serviceUsage: serviceUsageArray,
        coverageRules: coverageStats,
        invoices: insuranceInvoices.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          patientName: invoice.patient.name,
          patientNumber: invoice.patient.patientNumber,
          createdAt: invoice.createdAt,
          totalAmount: invoice.totalAmount,
          insuranceCalculation: invoice.insuranceCalculation,
          items: invoice.items.map(item => ({
            serviceName: item.service.name,
            serviceCategory: item.service.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }))
      }
    })

    // Calcular estadísticas generales
    const totalInsurances = insurances.length
    const totalInsuredPatients = insurances.reduce((sum, ins) => sum + ins.patients.length, 0)
    const totalInvoicesWithInsurance = invoicesWithInsurance.length
    const totalOriginalAmount = invoicesWithInsurance.reduce((sum, inv) => {
      const calc = inv.insuranceCalculation as any
      return sum + (calc?.totalOriginalAmount || 0)
    }, 0)
    const totalPatientPays = invoicesWithInsurance.reduce((sum, inv) => {
      const calc = inv.insuranceCalculation as any
      return sum + (calc?.totalPatientPays || 0)
    }, 0)
    const totalDiscounts = totalOriginalAmount - totalPatientPays

    const reportData = {
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      summary: {
        totalInsurances,
        totalInsuredPatients,
        totalInvoicesWithInsurance,
        totalOriginalAmount,
        totalPatientPays,
        totalDiscounts,
        avgDiscountPerInvoice: totalInvoicesWithInsurance > 0 ? (totalDiscounts / totalInvoicesWithInsurance) : 0,
        savingsPercentage: totalOriginalAmount > 0 ? ((totalDiscounts / totalOriginalAmount) * 100) : 0
      },
      insuranceReports,
      topServicesByDiscount: invoicesWithInsurance
        .flatMap(inv => inv.items)
        .reduce((acc, item) => {
          const serviceId = item.service.id
          if (!acc[serviceId]) {
            acc[serviceId] = {
              serviceId,
              serviceName: item.service.name,
              serviceCategory: item.service.category,
              totalQuantity: 0,
              totalOriginalAmount: 0,
              totalDiscounts: 0,
              usageCount: 0
            }
          }
          acc[serviceId].totalQuantity += item.quantity
          acc[serviceId].totalOriginalAmount += item.totalPrice
          acc[serviceId].usageCount += 1
          return acc
        }, {} as Record<string, any>)
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error("Error al generar reporte de seguros:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
