import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las categorías únicas
    const categories = await prisma.service.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    })

    // Obtener estadísticas de servicios
    const [totalServices, activeServices, inactiveServices] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.count({ where: { isActive: false } })
    ])

    // Obtener precio promedio y rango de precios
    const priceStats = await prisma.service.aggregate({
      _avg: {
        price: true
      },
      _min: {
        price: true
      },
      _max: {
        price: true
      }
    })

    // Obtener servicios más utilizados (basado en facturas)
    const mostUsedServices = await prisma.invoiceItem.groupBy({
      by: ['serviceId'],
      _count: {
        serviceId: true
      },
      orderBy: {
        _count: {
          serviceId: 'desc'
        }
      },
      take: 5
    })

    // Obtener información de los servicios más utilizados
    const mostUsedServicesWithDetails = await Promise.all(
      mostUsedServices.map(async (item) => {
        const service = await prisma.service.findUnique({
          where: { id: item.serviceId },
          select: {
            name: true,
            price: true,
            category: true
          }
        })
        return {
          ...service,
          usageCount: item._count.serviceId
        }
      })
    )

    // Calcular ingresos totales por servicios
    const totalRevenue = await prisma.invoiceItem.aggregate({
      _sum: {
        totalPrice: true
      }
    })

    return NextResponse.json({
      totalServices,
      activeServices,
      inactiveServices,
      categories: categories.map(c => c.category).filter(Boolean),
      priceStats: {
        average: priceStats._avg.price || 0,
        min: priceStats._min.price || 0,
        max: priceStats._max.price || 0
      },
      mostUsedServices: mostUsedServicesWithDetails,
      totalRevenue: totalRevenue._sum.totalPrice || 0
    })

  } catch (error) {
    console.error("Error al obtener estadísticas de servicios:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}