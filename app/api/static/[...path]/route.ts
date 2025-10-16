import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ path: string[] }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Resolver los parámetros
    const { path: pathSegments } = await params
    
    // Construir la ruta del archivo
    const filePath = join(process.cwd(), "public", "uploads", ...pathSegments)
    
    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      console.log('❌ Archivo no encontrado:', filePath)
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }
    
    // Leer el archivo
    const fileBuffer = await readFile(filePath)
    
    // Determinar el tipo MIME basado en la extensión
    const extension = pathSegments[pathSegments.length - 1]?.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'png':
        contentType = 'image/png'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      default:
        contentType = 'application/octet-stream'
    }
    
    // Convertir Buffer a Uint8Array para compatibilidad con Response
    const uint8Array = new Uint8Array(fileBuffer)
    
    // Retornar el archivo con los headers apropiados usando Response
    return new Response(uint8Array, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache por 1 año
        'Access-Control-Allow-Origin': '*',
      },
    })
    
  } catch (error) {
    console.error("❌ Error sirviendo archivo estático:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
