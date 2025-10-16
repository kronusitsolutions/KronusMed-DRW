import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo los administradores pueden eliminar seguros." }, { status: 401 })
    }

    const { id } = await context.params

    // Verificar que el seguro existe
    const existingInsurance = await prisma.insurance.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            patients: true,
            coverageRules: true
          }
        }
      }
    })

    if (!existingInsurance) {
      return NextResponse.json({ error: "Seguro no encontrado" }, { status: 404 })
    }

    // Verificar si hay pacientes asociados
    if (existingInsurance._count.patients > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el seguro porque tiene ${existingInsurance._count.patients} paciente(s) asociado(s). Primero debe desasociar los pacientes.` 
      }, { status: 400 })
    }

    // Eliminar todas las reglas de cobertura asociadas primero
    if (existingInsurance._count.coverageRules > 0) {
      await prisma.insuranceCoverage.deleteMany({
        where: { insuranceId: id }
      })
    }

    // Eliminar el seguro
    await prisma.insurance.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: `Seguro "${existingInsurance.name}" eliminado exitosamente junto con ${existingInsurance._count.coverageRules} regla(s) de cobertura` 
    })
  } catch (error) {
    console.error("Error al eliminar seguro:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
