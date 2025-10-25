import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cache, ServiceCache } from "@/lib/cache"
import { z } from "zod"

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es requerido"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  priceType: z.enum(["FIXED", "DYNAMIC"]).default("FIXED"),
  category: z.string().optional(),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100) // Límite entre 1-100
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const skip = (page - 1) * limit

    // Construir clave de caché
    const cacheKey = `services:${session.user.role}:${page}:${limit}:${search}:${category}:${status}`
    
    // Intentar obtener del caché primero
    const cachedResult = cache.get(cacheKey)
    if (cachedResult) {
      console.log(`📦 Cache hit para servicios: ${cacheKey}`)
      return NextResponse.json(cachedResult)
    }
    
    console.log(`🔄 Cache miss - cargando servicios desde BD: ${cacheKey}`)

    // Construir condiciones de búsqueda
    const whereCondition: any = {}
    
    // Filtro por estado
    if (status === 'active') {
      whereCondition.isActive = true
    } else if (status === 'inactive') {
      whereCondition.isActive = false
    } else if (session.user.role !== "ADMIN") {
      // Si no es admin, solo mostrar servicios activos
      whereCondition.isActive = true
    }

    // Filtro por búsqueda
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filtro por categoría
    if (category) {
      whereCondition.category = category
    }

    // Consulta optimizada con índices
    const [services, totalCount] = await Promise.all([
      prisma.service.findMany({
        where: whereCondition,
        orderBy: [
          { isActive: 'desc' },
          { name: 'asc' }
        ],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          priceType: true,
          category: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.service.count({ where: whereCondition })
    ])

    const totalPages = Math.ceil(totalCount / limit)
    
    const result = {
      services,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      cache: {
        hit: false,
        key: cacheKey
      }
    }

    // Guardar en caché (TTL más corto para búsquedas)
    const ttl = search ? ServiceCache.TTL.SERVICES / 2 : ServiceCache.TTL.SERVICES
    cache.set(cacheKey, result, ttl)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al obtener servicios:", error)
    
    // Manejo específico de errores de base de datos
    if (error instanceof Error) {
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: "Error de conexión a la base de datos. Intenta nuevamente." },
          { status: 503 }
        )
      }
      if (error.message.includes('too many connections')) {
        return NextResponse.json(
          { error: "Servidor sobrecargado. Intenta nuevamente en unos momentos." },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Función para generar el siguiente ID de servicio
async function generateNextServiceId(): Promise<string> {
  try {
    console.log("🔍 Buscando último servicio...")
    
    // Obtener el último servicio ordenado por ID
    const lastService = await prisma.service.findFirst({
      orderBy: { id: 'desc' }
    })

    if (!lastService) {
      console.log("✅ No hay servicios, usando serv0001")
      return "serv0001"
    }

    console.log("📋 Último servicio encontrado:", lastService.id)

    // Extraer el número del último ID
    const lastId = lastService.id
    const match = lastId.match(/serv(\d+)/)
    
    if (match) {
      const lastNumber = parseInt(match[1])
      const nextNumber = lastNumber + 1
      const newId = `serv${nextNumber.toString().padStart(4, '0')}`
      console.log("✅ Nuevo ID generado:", newId)
      return newId
    } else {
      // Si no coincide el patrón, empezar desde serv0001
      console.log("⚠️ Patrón de ID no reconocido, usando serv0001")
      return "serv0001"
    }
  } catch (error) {
    console.error("❌ Error al generar ID de servicio:", error)
    console.log("🔄 Usando ID por defecto: serv0001")
    return "serv0001"
  }
}

// Esquema para creación masiva
const bulkServiceSchema = z.object({
  services: z.array(serviceSchema).min(1).max(250) // Máximo 250 servicios por lote
})

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 Iniciando creación de servicio...")
    
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      console.log("❌ Usuario no autorizado:", session?.user?.role)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("✅ Usuario autorizado:", session.user.role)
    
    const body = await request.json()
    console.log("📝 Datos recibidos:", body)
    
    // Verificar si es creación masiva
    if (body.services && Array.isArray(body.services)) {
      console.log("📦 Creación masiva detectada")
      return await createBulkServices(body)
    }

    // Creación individual
    console.log("🔍 Validando datos...")
    const validatedData = serviceSchema.parse(body)
    console.log("✅ Datos validados:", validatedData)
    
    console.log("🆔 Generando ID de servicio...")
    const serviceId = await generateNextServiceId()
    console.log("✅ ID generado:", serviceId)

    console.log("💾 Creando servicio en base de datos...")
    const service = await prisma.service.create({
      data: {
        id: serviceId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        priceType: validatedData.priceType,
        category: validatedData.category,
        isActive: validatedData.isActive
      }
    })
    console.log("✅ Servicio creado:", service.id)

    // Invalidar caché de manera más agresiva
    console.log("🗑️ Invalidando caché...")
    ServiceCache.invalidateServices()
    
    // Invalidar también caché específico por rol y página
    const userCacheKey = `services:${session.user.role}:1:20::all:all`
    cache.delete(userCacheKey)
    console.log(`🗑️ Caché invalidado para: ${userCacheKey}`)

    console.log("🎉 Servicio creado exitosamente")
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("❌ Error al crear servicio:", error)
    
    if (error instanceof z.ZodError) {
      console.log("❌ Error de validación:", error.errors)
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    // Manejo específico de errores de base de datos
    if (error instanceof Error) {
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        console.log("❌ Error de conexión a base de datos")
        return NextResponse.json(
          { error: "Error de conexión a la base de datos. Intenta nuevamente." },
          { status: 503 }
        )
      }
      if (error.message.includes('too many connections')) {
        console.log("❌ Demasiadas conexiones")
        return NextResponse.json(
          { error: "Servidor sobrecargado. Intenta nuevamente en unos momentos." },
          { status: 503 }
        )
      }
      if (error.message.includes('Unique constraint')) {
        console.log("❌ Violación de restricción única")
        return NextResponse.json(
          { error: "Ya existe un servicio con este ID. Intenta nuevamente." },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}

// Función para creación masiva de servicios
async function createBulkServices(body: any) {
  const { services } = bulkServiceSchema.parse(body)
  
  // Generar IDs para todos los servicios
  const lastService = await prisma.service.findFirst({
    orderBy: { id: 'desc' }
  })
  
  let lastNumber = 0
  if (lastService) {
    const match = lastService.id.match(/serv(\d+)/)
    if (match) {
      lastNumber = parseInt(match[1])
    }
  }

  // Preparar datos para inserción masiva
  const servicesData = services.map((service, index) => {
    const serviceNumber = lastNumber + index + 1
    return {
      ...service,
      id: `serv${serviceNumber.toString().padStart(4, '0')}`
    }
  })

  // Usar transacción para inserción masiva
  const result = await prisma.$transaction(async (tx) => {
    const createdServices = []
    
    for (const serviceData of servicesData) {
      const service = await tx.service.create({
        data: {
          id: serviceData.id,
          name: serviceData.name,
          description: serviceData.description,
          price: serviceData.price,
          priceType: serviceData.priceType,
          category: serviceData.category,
          isActive: serviceData.isActive
        }
      })
      createdServices.push(service)
    }
    
    return createdServices
  })

  // Invalidar caché
  ServiceCache.invalidateServices()

  return NextResponse.json({
    services: result,
    count: result.length,
    message: `${result.length} servicios creados exitosamente`
  }, { status: 201 })
}
