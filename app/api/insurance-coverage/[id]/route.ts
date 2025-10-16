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
      return NextResponse.json({ error: "No autorizado. Solo los administradores pueden eliminar reglas de cobertura." }, { status: 401 })
    }

    const { id } = await context.params

    // Verificar que la regla existe
    const existingRule = await prisma.insuranceCoverage.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json({ error: "Regla de cobertura no encontrada" }, { status: 404 })
    }

    // Eliminar la regla
    await prisma.insuranceCoverage.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Regla de cobertura eliminada exitosamente" })
  } catch (error) {
    console.error("Error al eliminar regla de cobertura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
