import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Configuración para archivos grandes en App Router
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el Content-Type sea multipart/form-data (más flexible)
    const contentType = request.headers.get('content-type')
    console.log('Content-Type recibido:', contentType)
    
    // Ser más permisivo con el Content-Type
    if (!contentType) {
      return NextResponse.json({ 
        error: "Content-Type no especificado" 
      }, { status: 415 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    console.log('Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validar tipo de archivo
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten PNG, JPG, JPEG y SVG` 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB para ser más permisivo)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 5MB)` 
      }, { status: 400 })
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()?.toLowerCase()
    const fileName = `logo_${timestamp}.${extension}`
    const filePath = join(uploadsDir, fileName)

    // Convertir File a Buffer y guardar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    console.log('Archivo guardado:', filePath)

    // Retornar URL del archivo
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: fileName 
    })

  } catch (error) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    )
  }
}
