import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const patientUpdateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  age: z.number().min(0, "La edad debe ser mayor a 0"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional().transform(val => val === "" ? null : val),
  address: z.string().optional().transform(val => val === "" ? null : val),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  cedula: z.string().min(1, "La cédula es requerida"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    
    console.log("Datos de actualización recibidos:", body)
    
    const validatedData = patientUpdateSchema.parse(body)
    console.log("Datos validados para actualización:", validatedData)

    // Verificar que el paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    })

    if (!existingPatient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: {
        name: validatedData.name,
        age: validatedData.age,
        gender: validatedData.gender,
        phone: validatedData.phone,
        address: validatedData.address,
        nationality: validatedData.nationality,
        cedula: validatedData.cedula,
        status: validatedData.status
      }
    })

    console.log("Paciente actualizado:", updatedPatient)
    return NextResponse.json(updatedPatient)
  } catch (error) {
    console.error("Error al actualizar paciente:", error)
    
    if (error instanceof z.ZodError) {
      console.error("Error de validación:", error.errors)
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo los administradores pueden eliminar pacientes." }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    })

    if (!existingPatient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    // Verificar si el paciente tiene facturas asociadas
    const patientInvoices = await prisma.invoice.findFirst({
      where: { patientId: id }
    })

    if (patientInvoices) {
      return NextResponse.json(
        { error: "No se puede eliminar un paciente que tiene facturas asociadas" },
        { status: 400 }
      )
    }

    // Verificar si el paciente tiene citas asociadas
    const patientAppointments = await prisma.appointment.findFirst({
      where: { patientId: id }
    })

    if (patientAppointments) {
      return NextResponse.json(
        { error: "No se puede eliminar un paciente que tiene citas asociadas" },
        { status: 400 }
      )
    }

    // Verificar si el paciente tiene notas médicas asociadas
    const patientMedicalNotes = await prisma.medicalNote.findFirst({
      where: { patientId: id }
    })

    if (patientMedicalNotes) {
      return NextResponse.json(
        { error: "No se puede eliminar un paciente que tiene notas médicas asociadas" },
        { status: 400 }
      )
    }

    await prisma.patient.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Paciente eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar paciente:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
