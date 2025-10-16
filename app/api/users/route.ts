import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { logger, extractRequestContext } from "@/lib/logger"
import { sanitizeRequestBody, sanitizedStringSchema, sanitizedEmailSchema } from "@/lib/sanitizer"
import { securityMiddleware, createSecureErrorResponse } from "@/lib/security"

const userSchema = z.object({
  name: sanitizedStringSchema,
  email: sanitizedEmailSchema,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "DOCTOR", "BILLING"])
})

export async function GET(request: NextRequest) {
  try {
    // Aplicar middleware de seguridad
    const securityResponse = securityMiddleware(request)
    if (securityResponse) return securityResponse

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      logger.warn("Acceso no autorizado a usuarios", {
        userId: session?.user?.id,
        role: session?.user?.role,
        ...extractRequestContext(request)
      })
      return createSecureErrorResponse("No autorizado", 401)
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    logger.info("Usuarios obtenidos exitosamente", {
      userId: session.user.id,
      count: users.length,
      ...extractRequestContext(request)
    })

    return NextResponse.json(users)
  } catch (error) {
    logger.error("Error al obtener usuarios", error as Error, extractRequestContext(request))
    return createSecureErrorResponse("Error interno del servidor", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Aplicar middleware de seguridad
    const securityResponse = securityMiddleware(request)
    if (securityResponse) return securityResponse

    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      logger.warn("Intento de crear usuario sin autorización", {
        userId: session?.user?.id,
        role: session?.user?.role,
        ...extractRequestContext(request)
      })
      return createSecureErrorResponse("No autorizado", 401)
    }

    const validatedData = await sanitizeRequestBody(request, userSchema)

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error al crear usuario:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
