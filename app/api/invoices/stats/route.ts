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

    // Obtener fecha de hoy para estadísticas diarias
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Obtener facturas del día actual
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        exoneration: {
          select: {
            exoneratedAmount: true,
            originalAmount: true
          }
        }
      }
    })

    // Obtener todas las facturas para estadísticas globales (para reportes)
    const allInvoices = await prisma.invoice.findMany({
      include: {
        exoneration: {
          select: {
            exoneratedAmount: true,
            originalAmount: true
          }
        }
      }
    })

    // Calcular estadísticas del día
    const todayTotalInvoices = todayInvoices.length
    
    // Total Facturado: Solo montos realmente cobrados (PAID + paidAmount de PARTIAL)
    const todayTotalFacturado = todayInvoices.reduce((sum, invoice) => {
      if (invoice.status === 'PAID') {
        return sum + invoice.totalAmount
      } else if (invoice.status === 'PARTIAL') {
        return sum + (invoice.paidAmount || 0)
      }
      return sum
    }, 0)

    const todayExoneradas = todayInvoices.filter(invoice => 
      invoice.status === 'EXONERATED' || 
      invoice.exoneration
    )

    const todayExoneradasCount = todayExoneradas.length
    const todayExoneradasTotal = todayExoneradas.reduce((sum, invoice) => {
      if (invoice.exoneration) {
        return sum + (invoice.exoneration.originalAmount || invoice.totalAmount)
      }
      return sum + invoice.totalAmount
    }, 0)

    // Calcular facturas pendientes del día (PENDING + saldos pendientes de PARTIAL)
    const todayPendientes = todayInvoices.filter(invoice => 
      invoice.status === 'PENDING'
    )
    const todayPendientesCount = todayPendientes.length
    const todayPendientesTotal = todayPendientes.reduce((sum, invoice) => {
      return sum + (invoice.pendingAmount || invoice.totalAmount)
    }, 0)
    
    // Calcular saldos pendientes de facturas parciales
    const todayParcialesPendientes = todayInvoices.filter(invoice => 
      invoice.status === 'PARTIAL'
    )
    const todayParcialesPendientesTotal = todayParcialesPendientes.reduce((sum, invoice) => {
      return sum + (invoice.pendingAmount || 0)
    }, 0)

    // Calcular estadísticas globales (para reportes)
    const globalTotalInvoices = allInvoices.length
    
    // Total Facturado Global: Solo montos realmente cobrados (PAID + paidAmount de PARTIAL)
    const globalTotalFacturado = allInvoices.reduce((sum, invoice) => {
      if (invoice.status === 'PAID') {
        return sum + invoice.totalAmount
      } else if (invoice.status === 'PARTIAL') {
        return sum + (invoice.paidAmount || 0)
      }
      return sum
    }, 0)

    const globalExoneradas = allInvoices.filter(invoice => 
      invoice.status === 'EXONERATED' || 
      invoice.exoneration
    )

    const globalExoneradasCount = globalExoneradas.length
    const globalExoneradasTotal = globalExoneradas.reduce((sum, invoice) => {
      if (invoice.exoneration) {
        return sum + (invoice.exoneration.originalAmount || invoice.totalAmount)
      }
      return sum + invoice.totalAmount
    }, 0)

    // Calcular facturas pendientes (PENDING + saldos pendientes de PARTIAL)
    const globalPendientes = allInvoices.filter(invoice => 
      invoice.status === 'PENDING'
    )
    const globalPendientesCount = globalPendientes.length
    const globalPendientesTotal = globalPendientes.reduce((sum, invoice) => {
      return sum + (invoice.pendingAmount || invoice.totalAmount)
    }, 0)
    
    // Calcular saldos pendientes de facturas parciales globales
    const globalParcialesPendientes = allInvoices.filter(invoice => 
      invoice.status === 'PARTIAL'
    )
    const globalParcialesPendientesTotal = globalParcialesPendientes.reduce((sum, invoice) => {
      return sum + (invoice.pendingAmount || 0)
    }, 0)

    // Calcular estadísticas de facturas parciales
    const todayParciales = todayInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const todayParcialesCount = todayParciales.length
    const todayParcialesTotal = todayParciales.reduce((sum, invoice) => {
      return sum + (invoice.paidAmount || 0)
    }, 0)

    const globalParciales = allInvoices.filter(invoice => invoice.status === 'PARTIAL')
    const globalParcialesCount = globalParciales.length
    const globalParcialesTotal = globalParciales.reduce((sum, invoice) => {
      return sum + (invoice.paidAmount || 0)
    }, 0)

    return NextResponse.json({
      // Estadísticas del día (para facturación)
      totalInvoices: todayTotalInvoices,
      totalFacturado: todayTotalFacturado,
      exoneradasCount: todayExoneradasCount,
      exoneradasTotal: todayExoneradasTotal,
      pendientesCount: todayPendientesCount,
      pendientesTotal: todayPendientesTotal + todayParcialesPendientesTotal,
      parcialesCount: todayParcialesCount,
      parcialesTotal: todayParcialesTotal,
      // Estadísticas globales (para reportes)
      global: {
        totalInvoices: globalTotalInvoices,
        totalFacturado: globalTotalFacturado,
        exoneradasCount: globalExoneradasCount,
        exoneradasTotal: globalExoneradasTotal,
        pendientesCount: globalPendientesCount,
        pendientesTotal: globalPendientesTotal + globalParcialesPendientesTotal,
        parcialesCount: globalParcialesCount,
        parcialesTotal: globalParcialesTotal
      }
    })

  } catch (error) {
    console.error("Error al obtener estadísticas de facturas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
