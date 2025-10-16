# Módulo de Diseño de Facturas

Este módulo permite personalizar el diseño y contenido de las facturas generadas por el sistema KronusMed.

## Características

- **Subida de Logotipos**: Soporte para archivos PNG, JPG y SVG (máximo 2MB)
- **Posicionamiento de Logo**: Izquierda, centro o derecha
- **Campos Personalizables**:
  - Nombre comercial
  - Dirección
  - Teléfono
  - RNC
  - Mensaje personalizado
- **Formatos de Impresión**:
  - Formato 80mm (terminal térmica)
  - Formato Letter (A4)
- **Vista Previa en Tiempo Real**: Simulación visual de ambos formatos
- **Persistencia en Base de Datos**: Configuraciones guardadas como JSON

## Estructura del Módulo

```
factura-diseno/
├── components/
│   ├── invoice-design-preview.tsx  # Componente de vista previa
│   └── logo-upload.tsx            # Componente de subida de logos
├── types/
│   └── index.ts                   # Tipos TypeScript
├── page.tsx                       # Página principal
└── README.md                      # Esta documentación
```

## API Endpoints

### GET /api/invoice-design
Obtiene todas las configuraciones de diseño de facturas.

**Parámetros de consulta:**
- `isActive`: Filtra por configuraciones activas (true/false)

### POST /api/invoice-design
Crea una nueva configuración de diseño.

**Cuerpo de la petición:**
```json
{
  "name": "Configuración por defecto",
  "logoUrl": "https://ejemplo.com/logo.png",
  "logoPosition": "LEFT",
  "businessName": "Mi Empresa",
  "address": "Dirección completa",
  "phone": "123-456-7890",
  "taxId": "NIT123456789",
  "customMessage": "Gracias por su preferencia",
  "format": "80MM",
  "isActive": true
}
```

### PUT /api/invoice-design/[id]
Actualiza una configuración existente.

### DELETE /api/invoice-design/[id]
Elimina una configuración (no permite eliminar la activa).

## Modelo de Base de Datos

```sql
model InvoiceDesign {
  id            String   @id @default(cuid())
  name          String   @default("Configuración por defecto")
  logoUrl       String?
  logoPosition  String   @default("LEFT")
  businessName  String   @default("")
  address       String   @default("")
  phone         String   @default("")
  taxId         String   @default("")
  customMessage String   @default("")
  format        String   @default("80MM")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Uso

1. **Acceso**: Navega a `/dashboard/factura-diseno`
2. **Configuración**: Completa los campos de información de la empresa
3. **Logotipo**: Sube y posiciona el logotipo
4. **Formato**: Selecciona entre 80mm o Letter
5. **Vista Previa**: Revisa cómo se verá la factura en tiempo real
6. **Guardar**: Guarda la configuración

## Permisos

- **ADMIN**: Acceso completo
- **BILLING**: Acceso completo
- **DOCTOR**: Sin acceso

## Validaciones

- **Logotipo**: Solo PNG, JPG, SVG. Máximo 2MB
- **Campos requeridos**: Nombre de la configuración
- **Configuración activa**: Solo una configuración puede estar activa a la vez

## Integración

Este módulo está completamente aislado y no modifica el código existente. Se integra con:

- Sistema de autenticación existente
- Base de datos PostgreSQL a través de Prisma
- Componentes UI existentes
- Sistema de notificaciones (toast)

## Mantenimiento

- **Modular**: Cada componente tiene una responsabilidad específica
- **Tipado**: TypeScript para prevenir errores
- **Validación**: Zod para validación de datos
- **Documentado**: Código comentado y documentado
