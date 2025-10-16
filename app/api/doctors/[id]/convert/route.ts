import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const convertDoctorSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  generatePassword: z.boolean().optional().default(false)
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = convertDoctorSchema.parse(body)

    // Verificar que el doctor virtual existe
    const virtualDoctor = await prisma.doctor.findUnique({
      where: { id }
    })

    if (!virtualDoctor) {
      return NextResponse.json(
        { error: "Doctor virtual no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que no tenga ya una cuenta de usuario
    if (virtualDoctor.userId) {
      return NextResponse.json(
        { error: "Este doctor ya tiene una cuenta de usuario asociada" },
        { status: 400 }
      )
    }

    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Generar contraseña si se solicita
    let password = validatedData.password
    if (validatedData.generatePassword) {
      // Generar contraseña aleatoria
      password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario con rol DOCTOR
    const user = await prisma.user.create({
      data: {
        name: virtualDoctor.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "DOCTOR"
      }
    })

    // Actualizar el doctor virtual para asociarlo con el usuario
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        userId: user.id,
        email: validatedData.email // Actualizar email si es diferente
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      doctor: updatedDoctor,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      password: validatedData.generatePassword ? password : undefined,
      message: validatedData.generatePassword 
        ? `Usuario creado exitosamente. Contraseña generada: ${password}`
        : "Usuario creado exitosamente"
    }, { status: 201 })

  } catch (error) {
    console.error("Error al convertir doctor:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
