import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 Iniciando subida de archivo...')
    
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      console.log('❌ Usuario no autorizado')
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log('✅ Usuario autorizado:', session.user.role)

    // Obtener el Content-Type
    const contentType = request.headers.get('content-type')
    console.log('📄 Content-Type recibido:', contentType)

    // Intentar procesar el formData sin validaciones estrictas
    let formData
    try {
      formData = await request.formData()
      console.log('✅ FormData procesado correctamente')
    } catch (error) {
      console.error('❌ Error procesando FormData:', error)
      return NextResponse.json({ 
        error: "Error procesando archivo: " + (error instanceof Error ? error.message : 'Error desconocido') 
      }, { status: 400 })
    }

    const file = formData.get("file") as File

    if (!file) {
      console.log('❌ No se proporcionó archivo')
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
    }

    console.log('📁 Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validar tipo de archivo
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Tipo de archivo no permitido:', file.type)
      return NextResponse.json({ 
        error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten PNG, JPG, JPEG y SVG` 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('❌ Archivo demasiado grande:', file.size, 'bytes')
      return NextResponse.json({ 
        error: `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 5MB)` 
      }, { status: 400 })
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = join(process.cwd(), "public", "uploads")
    console.log('📁 Directorio de uploads:', uploadsDir)
    
    if (!existsSync(uploadsDir)) {
      console.log('📁 Creando directorio de uploads...')
      await mkdir(uploadsDir, { recursive: true })
      console.log('✅ Directorio creado exitosamente')
    } else {
      console.log('✅ Directorio ya existe')
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()?.toLowerCase()
    const fileName = `logo_${timestamp}.${extension}`
    const filePath = join(uploadsDir, fileName)

    console.log('💾 Guardando archivo en:', filePath)

    // Convertir File a Buffer y guardar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    console.log('✅ Archivo guardado exitosamente')

    // Verificar que el archivo se guardó correctamente
    if (!existsSync(filePath)) {
      console.log('❌ Error: El archivo no se guardó correctamente')
      return NextResponse.json({ 
        error: "Error al guardar el archivo en el servidor" 
      }, { status: 500 })
    }

    // Retornar URL del archivo (usando el endpoint estático)
    const fileUrl = `/uploads/${fileName}`

    console.log('🎯 URL del archivo:', fileUrl)

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: fileName 
    })

  } catch (error) {
    console.error("❌ Error al subir archivo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    )
  }
}
