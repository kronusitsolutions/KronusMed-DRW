import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const featureFlagSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  isEnabled: z.boolean(),
  description: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const featureFlags = await prisma.featureFlag.findMany({
      orderBy: { name: "asc" }
    })

    return NextResponse.json(featureFlags)
  } catch (error) {
    console.error("Error al obtener feature flags:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = featureFlagSchema.parse(body)

    const featureFlag = await prisma.featureFlag.upsert({
      where: { name: validatedData.name },
      update: {
        isEnabled: validatedData.isEnabled,
        description: validatedData.description
      },
      create: {
        name: validatedData.name,
        description: validatedData.description,
        isEnabled: validatedData.isEnabled
      }
    })

    return NextResponse.json(featureFlag, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error al crear/actualizar feature flag:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, isEnabled } = body

    if (!name || typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Nombre y estado son requeridos" },
        { status: 400 }
      )
    }

    const featureFlag = await prisma.featureFlag.update({
      where: { name },
      data: { isEnabled }
    })

    return NextResponse.json(featureFlag)
  } catch (error) {
    console.error("Error al actualizar feature flag:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
