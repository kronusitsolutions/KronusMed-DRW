# 🚀 Prompt: Implementar Servicios Dinámicos - Paso a Paso

## 📋 Contexto
Necesito implementar la funcionalidad de **servicios dinámicos** en mi proyecto copia de KronusMed. Los servicios dinámicos permiten establecer el precio al momento de facturar, mientras que los servicios fijos mantienen su precio predefinido.

## 🎯 Objetivo
Agregar soporte para servicios con precios dinámicos sin afectar la base de datos de producción ni los servicios existentes.

## 📁 Estructura del Proyecto
- **Framework:** Next.js 15.2.5
- **Base de datos:** PostgreSQL con Prisma ORM
- **Node.js:** Versión 22.x
- **Ubicación:** [ESPECIFICAR RUTA DE TU PROYECTO COPIA]

## 🛡️ Requisitos de Seguridad
- ✅ **NO afectar datos existentes** en producción
- ✅ **Migración segura** con valores por defecto
- ✅ **Compatibilidad total** con servicios actuales
- ✅ **Implementación gradual** para evitar errores

---

## 📝 PASO 1: Preparar Schema de Base de Datos

### 1.1 Actualizar `prisma/schema.prisma`

**Archivo:** `prisma/schema.prisma`

**Cambios necesarios:**
```prisma
// Agregar este enum después de los otros enums existentes
enum PriceType {
  FIXED
  DYNAMIC
}

// En el modelo Service, agregar esta línea:
model Service {
  // ... todos los campos existentes ...
  priceType PriceType @default(FIXED)  // ← AGREGAR ESTA LÍNEA
}
```

**Instrucciones:**
1. Abrir `prisma/schema.prisma`
2. Buscar la sección de enums y agregar el enum `PriceType`
3. En el modelo `Service`, agregar el campo `priceType` con valor por defecto `FIXED`
4. Guardar el archivo

---

## 📝 PASO 2: Crear Migración SQL Segura

### 2.1 Crear archivo de migración manual

**Archivo:** `prisma/migrations/add_price_type_to_service.sql`

**Contenido:**
```sql
-- Crear el tipo enum si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceType') THEN
        CREATE TYPE "PriceType" AS ENUM ('FIXED', 'DYNAMIC');
    END IF;
END $$;

-- Agregar la columna priceType con valor por defecto FIXED
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "priceType" "PriceType" NOT NULL DEFAULT 'FIXED';

-- Verificar que todos los servicios existentes tengan el valor FIXED
UPDATE "services" SET "priceType" = 'FIXED' WHERE "priceType" IS NULL;
```

**Instrucciones:**
1. Crear la carpeta `prisma/migrations/` si no existe
2. Crear el archivo `add_price_type_to_service.sql` con el contenido SQL
3. **IMPORTANTE:** Este SQL es seguro y no afecta datos existentes

---

## 📝 PASO 3: Actualizar Backend - API de Servicios

### 3.1 Actualizar `app/api/services/route.ts`

**Cambios necesarios:**

1. **Actualizar el schema de validación:**
```typescript
// Buscar la línea con serviceSchema y actualizarla:
const serviceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  priceType: z.enum(["FIXED", "DYNAMIC"]).default("FIXED"), // ← AGREGAR ESTA LÍNEA
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
})
```

2. **Actualizar la consulta GET:**
```typescript
// En la función GET, buscar el select y agregar priceType:
const services = await prisma.service.findMany({
  where: { isActive: true },
  select: {
    id: true,
    name: true,
    price: true,
    priceType: true, // ← AGREGAR ESTA LÍNEA
    category: true,
    description: true,
    isActive: true
  }
})
```

3. **Actualizar la creación de servicios:**
```typescript
// En la función POST, buscar prisma.service.create y agregar:
const service = await prisma.service.create({
  data: {
    name: validatedData.name,
    price: validatedData.price,
    priceType: validatedData.priceType, // ← AGREGAR ESTA LÍNEA
    category: validatedData.category,
    description: validatedData.description,
    isActive: validatedData.isActive
  }
})
```

---

## 📝 PASO 4: Actualizar Backend - API de Items de Factura

### 4.1 Actualizar `app/api/invoices/[id]/services/route.ts`

**Cambios necesarios:**

1. **Actualizar el schema de validación:**
```typescript
// Buscar addServiceSchema y actualizarla:
const addServiceSchema = z.object({
  serviceId: z.string().min(1, "El ID del servicio es requerido"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  dynamicPrice: z.number().min(0, "El precio dinámico debe ser mayor o igual a 0").optional() // ← AGREGAR ESTA LÍNEA
})
```

2. **Actualizar la lógica de creación:**
```typescript
// Buscar la sección donde se obtiene el servicio y agregar:
const service = await prisma.service.findUnique({
  where: { id: validatedData.serviceId }
})

if (!service) {
  return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
}

// Determinar el precio final
let finalUnitPrice: number
let finalTotalPrice: number

if (service.priceType === 'DYNAMIC') {
  if (!validatedData.dynamicPrice || validatedData.dynamicPrice <= 0) {
    return NextResponse.json({ error: "El precio dinámico debe ser mayor a 0" }, { status: 400 })
  }
  finalUnitPrice = validatedData.dynamicPrice
  finalTotalPrice = validatedData.dynamicPrice * validatedData.quantity
} else {
  finalUnitPrice = service.price
  finalTotalPrice = service.price * validatedData.quantity
}

// Actualizar la creación del item:
const invoiceItem = await prisma.invoiceItem.create({
  data: {
    invoiceId: invoiceId,
    serviceId: validatedData.serviceId,
    quantity: validatedData.quantity,
    unitPrice: finalUnitPrice, // ← USAR finalUnitPrice
    totalPrice: finalTotalPrice, // ← USAR finalTotalPrice
    dynamicPrice: service.priceType === 'DYNAMIC' ? validatedData.dynamicPrice : null // ← AGREGAR ESTA LÍNEA
  }
})
```

---

## 📝 PASO 5: Actualizar Frontend - Gestión de Servicios

### 5.1 Actualizar `app/dashboard/services/page.tsx`

**Cambios necesarios:**

1. **Actualizar la interfaz Service:**
```typescript
// Buscar la interfaz Service y agregar:
interface Service {
  id: string
  name: string
  price: number
  priceType?: 'FIXED' | 'DYNAMIC' // ← AGREGAR ESTA LÍNEA
  category?: string
  description?: string
  isActive: boolean
}
```

2. **Actualizar el schema de validación:**
```typescript
// Buscar serviceSchema y actualizarla:
const serviceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  priceType: z.enum(["FIXED", "DYNAMIC"]).default("FIXED"), // ← AGREGAR ESTA LÍNEA
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
})
```

3. **Actualizar el formulario de edición:**
```typescript
// En la función handleEditService, agregar:
const handleEditService = (service: Service) => {
  setValue('name', service.name)
  setValue('price', service.price)
  setValue('priceType', service.priceType || 'FIXED') // ← AGREGAR ESTA LÍNEA
  setValue('category', service.category || '')
  setValue('description', service.description || '')
  setValue('isActive', service.isActive)
  setEditingService(service)
  setIsEditDialogOpen(true)
}
```

4. **Agregar campo select en el formulario:**
```tsx
// En el formulario, después del campo de precio, agregar:
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="price">Precio</Label>
    <Input
      id="price"
      type="number"
      step="0.01"
      min="0"
      {...register('price')}
      className={errors.price ? 'border-red-500' : ''}
    />
    {errors.price && (
      <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
    )}
  </div>
  
  {/* ← AGREGAR ESTE CAMPO COMPLETO */}
  <div>
    <Label htmlFor="priceType">Tipo de Precio</Label>
    <select
      id="priceType"
      {...register('priceType')}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="FIXED">Fijo</option>
      <option value="DYNAMIC">Dinámico</option>
    </select>
    {watch('priceType') === 'DYNAMIC' && (
      <p className="text-sm text-gray-600 mt-1">
        El precio será establecido al momento de facturar
      </p>
    )}
  </div>
</div>
```

5. **Agregar badge en la lista de servicios:**
```tsx
// En la lista de servicios, buscar donde se muestra el nombre y agregar:
<div className="flex items-center justify-between">
  <div className="flex items-center space-x-2">
    <span className="font-medium">{service.name}</span>
    {service.priceType === 'DYNAMIC' && (
      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
        Dinámico
      </span>
    )}
  </div>
  <div className="text-right">
    <span className="text-sm text-gray-600">
      {service.priceType === 'DYNAMIC' ? 'Precio dinámico' : `$${service.price.toFixed(2)}`}
    </span>
  </div>
</div>
```

---

## 📝 PASO 6: Actualizar Frontend - Modal de Facturación

### 6.1 Actualizar `app/dashboard/billing/page.tsx`

**Cambios necesarios:**

1. **Actualizar la interfaz Service:**
```typescript
// Buscar la interfaz Service y agregar:
interface Service {
  id: string
  name: string
  price: number
  priceType?: 'FIXED' | 'DYNAMIC' // ← AGREGAR ESTA LÍNEA
  category?: string
  description?: string
  isActive: boolean
  uniqueId?: number
}
```

2. **Agregar estados para precios dinámicos:**
```typescript
// Después de los otros useState, agregar:
const [dynamicPrices, setDynamicPrices] = useState<{[key: string]: number}>({})
const [editingDynamicPrice, setEditingDynamicPrice] = useState<string | null>(null)
```

3. **Actualizar función addService:**
```typescript
// Reemplazar la función addService completa:
const addService = (serviceName: string) => {
  const service = services.find(s => s.name === serviceName)
  if (service) {
    const uniqueId = Date.now()
    const newService = {
      ...service,
      uniqueId: uniqueId
    }
    
    // Si es un servicio dinámico, inicializar el precio dinámico
    if (service.priceType === 'DYNAMIC') {
      setDynamicPrices(prev => ({
        ...prev,
        [uniqueId.toString()]: service.price || 0
      }))
    }
    
    setSelectedServices(prev => [...prev, newService])
  }
}
```

4. **Actualizar función removeService:**
```typescript
// Reemplazar la función removeService:
const removeService = (uniqueId: number) => {
  setSelectedServices(prev => prev.filter(s => s.uniqueId !== uniqueId))
  // Limpiar precio dinámico si existe
  setDynamicPrices(prev => {
    const newPrices = { ...prev }
    delete newPrices[uniqueId.toString()]
    return newPrices
  })
}
```

5. **Actualizar función calculateTotal:**
```typescript
// Reemplazar la función calculateTotal:
const calculateTotal = () => {
  return selectedServices.reduce((total, service) => {
    if (service.priceType === 'DYNAMIC') {
      return total + (dynamicPrices[service.uniqueId!.toString()] || 0)
    }
    return total + service.price
  }, 0)
}
```

6. **Actualizar la visualización de servicios en el dropdown:**
```tsx
// En la lista de servicios disponibles, buscar donde se muestra el precio y actualizar:
<div className="text-right ml-3">
  <span className="text-blue-600 font-semibold text-sm">
    {service.priceType === 'DYNAMIC' ? 'Precio dinámico' : `$${service.price.toFixed(2)}`}
  </span>
</div>
```

7. **Actualizar la sección de servicios seleccionados:**
```tsx
// Reemplazar toda la sección de servicios seleccionados con:
{selectedServices.length > 0 && (
  <div className="border rounded-lg p-3 space-y-2">
    <h4 className="font-medium text-sm text-gray-700 mb-2">Servicios seleccionados:</h4>
    {selectedServices.map((service) => (
      <div key={service.uniqueId} className="flex justify-between items-center p-2 bg-blue-50 rounded">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{service.name}</span>
            {service.priceType === 'DYNAMIC' && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Dinámico
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {service.priceType === 'DYNAMIC' ? (
            <div className="flex items-center space-x-2">
              {editingDynamicPrice === service.uniqueId?.toString() ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dynamicPrices[service.uniqueId!.toString()] || 0}
                    onChange={(e) => setDynamicPrices(prev => ({
                      ...prev,
                      [service.uniqueId!.toString()]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-20 h-8 text-sm border border-gray-300 rounded px-2"
                    onBlur={() => setEditingDynamicPrice(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingDynamicPrice(null)
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setEditingDynamicPrice(null)}
                    className="h-8 px-2 bg-green-500 text-white rounded text-sm"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div 
                  className="font-semibold text-blue-600 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                  onClick={() => setEditingDynamicPrice(service.uniqueId!.toString())}
                >
                  ${(dynamicPrices[service.uniqueId!.toString()] || 0).toFixed(2)}
                </div>
              )}
            </div>
          ) : (
            <span className="font-semibold text-blue-600">${service.price.toFixed(2)}</span>
          )}
          <button
            type="button"
            onClick={() => removeService(service.uniqueId!)}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Quitar
          </button>
        </div>
      </div>
    ))}
    <div className="border-t pt-2 flex justify-between font-semibold">
      <span>Total:</span>
      <span>${calculateTotal().toFixed(2)}</span>
    </div>
  </div>
)}
```

8. **Actualizar función handleCreateInvoice:**
```typescript
// En la función handleCreateInvoice, buscar la sección de items y actualizar:
items: selectedServices.map(s => {
  const unitPrice = s.priceType === 'DYNAMIC' ? (dynamicPrices[s.uniqueId!.toString()] || 0) : s.price
  return {
    serviceId: s.id,
    quantity: 1,
    unitPrice: unitPrice,
    totalPrice: unitPrice,
    dynamicPrice: s.priceType === 'DYNAMIC' ? unitPrice : undefined
  }
}),
```

---

## 📝 PASO 7: Actualizar Otros Archivos Frontend

### 7.1 Actualizar interfaces en otros archivos

**Archivos a actualizar:**
- `hooks/use-services-pagination.ts`
- `app/dashboard/insurance/page.tsx`
- `app/dashboard/billing/page-updated.tsx`
- `app/dashboard/billing/page-backup.tsx`

**Cambio en cada archivo:**
```typescript
// Buscar la interfaz Service y agregar:
interface Service {
  // ... campos existentes ...
  priceType?: 'FIXED' | 'DYNAMIC' // ← AGREGAR ESTA LÍNEA
}
```

---

## 📝 PASO 8: Aplicar Migración a Base de Datos

### 8.1 Ejecutar migración SQL

**Comando:**
```bash
# Conectar a tu base de datos PostgreSQL y ejecutar:
psql -h [HOST] -U [USER] -d [DATABASE] -f prisma/migrations/add_price_type_to_service.sql
```

**O usando Prisma:**
```bash
# Si tienes Prisma CLI configurado:
npx prisma db push
```

---

## 📝 PASO 9: Probar Funcionalidad

### 9.1 Checklist de pruebas

**Backend:**
- [ ] Crear servicio con precio fijo
- [ ] Crear servicio con precio dinámico
- [ ] Listar servicios (debe mostrar priceType)
- [ ] Facturar con servicio fijo
- [ ] Facturar con servicio dinámico

**Frontend:**
- [ ] Página de servicios muestra tipo de precio
- [ ] Formulario de servicios permite seleccionar tipo
- [ ] Modal de facturación muestra "Precio dinámico" para servicios dinámicos
- [ ] Campo de precio dinámico es editable
- [ ] Total se calcula correctamente con precios dinámicos

---

## 🚨 Notas Importantes

1. **Seguridad:** La migración SQL es segura y no afecta datos existentes
2. **Compatibilidad:** Todos los servicios existentes serán automáticamente `FIXED`
3. **Rollback:** Si algo sale mal, puedes eliminar la columna `priceType` sin perder datos
4. **Testing:** Prueba exhaustivamente antes de aplicar a producción

---

## ✅ Resultado Final

Después de completar todos los pasos, tendrás:
- ✅ Servicios con precios fijos (funcionan igual que antes)
- ✅ Servicios con precios dinámicos (precio se establece al facturar)
- ✅ Interfaz intuitiva para gestionar ambos tipos
- ✅ Base de datos segura sin pérdida de datos
- ✅ Compatibilidad total con el sistema existente

**¿Listo para empezar? ¡Vamos paso a paso! 🚀**


