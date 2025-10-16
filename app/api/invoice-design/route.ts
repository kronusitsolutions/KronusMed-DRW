import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const invoiceDesignSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  logoUrl: z.string().optional(),
  logoPosition: z.enum(["LEFT", "CENTER", "RIGHT"]).default("LEFT"),
  businessName: z.string().default(""),
  address: z.string().default(""),
  phone: z.string().default(""),
  taxId: z.string().default(""),
  customMessage: z.string().default(""),
  format: z.enum(["80MM", "LETTER"]).default("80MM"),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    const designs = await prisma.invoiceDesign.findMany({
      where,
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(designs)
  } catch (error) {
    console.error("Error al obtener diseños de factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invoiceDesignSchema.parse(body)

    // Verificar si ya existe una configuración activa
    const existingActive = await prisma.invoiceDesign.findFirst({
      where: { isActive: true }
    })

    // Si se está creando una nueva configuración activa, desactivar las demás
    if (validatedData.isActive && existingActive) {
      await prisma.invoiceDesign.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    const design = await prisma.invoiceDesign.create({
      data: validatedData
    })

    return NextResponse.json(design, { status: 201 })
  } catch (error) {
    console.error("Error al crear diseño de factura:", error)
    
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
