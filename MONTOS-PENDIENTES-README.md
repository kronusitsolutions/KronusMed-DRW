# 💰 Sistema de Montos Pendientes en Facturas

## 📋 Descripción

Se ha implementado un sistema completo de montos pendientes en facturas que permite:

- **Registrar pagos parciales** en facturas
- **Seguimiento automático** de montos pagados y pendientes
- **Actualización automática** del estado de facturas
- **Visualización clara** en la interfaz y en impresiones
- **Historial completo** de pagos por factura

## 🏗️ Cambios Implementados

### 1. Base de Datos

#### Nuevos Campos en la Tabla `Invoice`:
```sql
paidAmount    Float @default(0)     -- Monto total pagado hasta el momento
pendingAmount Float @default(0)     -- Monto pendiente (totalAmount - paidAmount)
```

#### Nuevo Estado en el Enum `InvoiceStatus`:
```sql
PARTIAL  -- Factura con pagos parciales
```

#### Nueva Tabla `InvoicePayment`:
```sql
model InvoicePayment {
  id            String   @id @default(cuid())
  invoiceId     String
  amount        Float    -- Monto del pago individual
  paymentMethod String?  -- Método de pago (efectivo, tarjeta, etc.)
  notes         String?  -- Notas del pago
  paidAt        DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 2. API Endpoints

#### Nuevo Endpoint: `/api/invoices/[id]/payments`
- **POST**: Crear un nuevo pago para una factura
- **GET**: Obtener todos los pagos de una factura

#### Lógica de Actualización Automática:
- Al registrar un pago, se actualiza automáticamente:
  - `paidAmount`: Suma del monto pagado
  - `pendingAmount`: Diferencia entre total y pagado
  - `status`: Cambia a `PARTIAL` si hay pagos parciales, `PAID` si se completa

### 3. Interfaz de Usuario

#### Componentes Nuevos:
- **`PaymentModal`**: Modal para registrar pagos
- **Botón de pago**: En la lista de facturas para facturas pendientes/parciales
- **Visualización de montos**: Muestra pagado y pendiente en la lista

#### Mejoras en la Lista de Facturas:
- Filtro para facturas "Parciales"
- Badge visual para estado `PARTIAL`
- Información de montos pendientes en cada factura

### 4. Impresión de Facturas

#### Nuevos Elementos en PDF:
- **Resumen de pagos**: Monto pagado y pendiente
- **Estilos visuales**: Destacado para montos pendientes
- **Compatibilidad**: Funciona con diseños 80MM y LETTER

## 🚀 Cómo Usar

### 1. Registrar un Pago Parcial

1. Ir a **Facturación** (`/dashboard/billing`)
2. Buscar la factura pendiente o parcial
3. Hacer clic en el botón de **pago** (💳)
4. Completar el formulario:
   - Monto del pago
   - Método de pago
   - Notas (opcional)
5. Confirmar el pago

### 2. Ver Historial de Pagos

- Los pagos se muestran automáticamente en la factura
- Cada pago incluye fecha, monto y método
- El estado se actualiza automáticamente

### 3. Filtrar Facturas

- Usar el filtro "Parciales" para ver solo facturas con pagos parciales
- El estado se actualiza automáticamente según los pagos

## 🔧 Configuración Técnica

### Migración de Datos Existentes

Para actualizar facturas existentes, ejecutar:

```bash
node scripts/migrate-invoice-pending-amounts.js
```

### Pruebas

Para probar la funcionalidad:

```bash
node scripts/test-pending-amounts.js
```

## 📊 Estados de Facturas

| Estado | Descripción | Condición |
|--------|-------------|-----------|
| `PENDING` | Sin pagos | `paidAmount = 0` |
| `PARTIAL` | Pagos parciales | `0 < paidAmount < totalAmount` |
| `PAID` | Completamente pagada | `paidAmount >= totalAmount` |
| `CANCELLED` | Cancelada | Manual |
| `EXONERATED` | Exonerada | Manual |

## 🎯 Flujo de Pagos

1. **Crear Factura**: Estado `PENDING`, `paidAmount = 0`, `pendingAmount = totalAmount`
2. **Primer Pago**: Estado cambia a `PARTIAL`
3. **Pagos Adicionales**: Se acumulan en `paidAmount`
4. **Pago Completo**: Estado cambia a `PAID`, `paidAt` se establece

## 🔍 Monitoreo

### Métricas Disponibles:
- Total de facturas pendientes
- Monto total pendiente
- Facturas con pagos parciales
- Historial de pagos por período

### Consultas Útiles:
```sql
-- Facturas con pagos parciales
SELECT * FROM invoices WHERE status = 'PARTIAL';

-- Monto total pendiente
SELECT SUM(pendingAmount) FROM invoices WHERE status IN ('PENDING', 'PARTIAL');

-- Historial de pagos por factura
SELECT i.invoiceNumber, p.amount, p.paymentMethod, p.paidAt 
FROM invoices i 
JOIN invoice_payments p ON i.id = p.invoiceId 
ORDER BY p.paidAt DESC;
```

## ⚠️ Consideraciones Importantes

1. **Consistencia**: Los campos se actualizan automáticamente
2. **Validación**: No se puede pagar más del monto pendiente
3. **Auditoría**: Todos los pagos quedan registrados
4. **Impresión**: Los montos pendientes se muestran claramente
5. **Compatibilidad**: Funciona con el sistema de seguros existente

## 🐛 Solución de Problemas

### Error: "El monto no puede exceder el monto pendiente"
- Verificar que el pago no sea mayor al `pendingAmount`
- Revisar que la factura no esté ya pagada

### Estado no se actualiza
- Verificar que la API esté funcionando correctamente
- Revisar los logs del servidor

### Montos incorrectos
- Ejecutar el script de migración
- Verificar que no haya pagos duplicados

## 📈 Beneficios

✅ **Control Total**: Seguimiento preciso de pagos parciales  
✅ **Automatización**: Estados se actualizan automáticamente  
✅ **Transparencia**: Información clara para pacientes y personal  
✅ **Auditoría**: Historial completo de pagos  
✅ **Flexibilidad**: Múltiples métodos de pago  
✅ **Compatibilidad**: Integración con sistema existente  

---

**Implementado por**: Sistema KronusMed  
**Fecha**: Diciembre 2024  
**Versión**: 1.0.0
