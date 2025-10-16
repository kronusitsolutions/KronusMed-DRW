import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decryptObject } from "@/lib/encryption.server"
import { logger } from "@/lib/logger"

/**
 * Endpoint optimizado para cargar TODOS los pacientes de una vez
 * Diseñado para listas virtualizadas que manejan hasta 2000 registros
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // Solo filtro por status, búsqueda se hace en frontend
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }

    // Consulta optimizada: obtener TODOS los pacientes sin paginación
    // Solo campos necesarios para la lista virtualizada
    const patients = await prisma.patient.findMany({
      where,
      select: {
        id: true,
        patientNumber: true,
        name: true,
        age: true,
        gender: true,
        phone: true,
        address: true,
        nationality: true,
        cedula: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { 
        createdAt: "desc" 
      }
    })

    // Desencriptar datos para usuarios autorizados (médicos, facturación, administradores)
    const decryptedPatients = patients.map(patient => 
      decryptObject(patient, ['phone', 'address'])
    )

    logger.info("Todos los pacientes cargados para lista virtualizada", {
      count: patients.length,
      status: status || "all"
    })

    // Devolver directamente el array de pacientes (sin paginación)
    return NextResponse.json(decryptedPatients)
  } catch (error) {
    logger.error("Error al obtener todos los pacientes:", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
