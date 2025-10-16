# Sistema de Seguros Médicos - KronusMed

## 📋 Descripción

Este sistema integra la gestión de seguros médicos con cálculo automático de cobertura en la facturación. Permite asignar seguros a pacientes y calcular automáticamente los descuentos aplicables según las reglas de cobertura configuradas.

## 🚀 Características Implementadas

### ✅ Base de Datos
- **Tabla `insurances`**: Gestión de compañías de seguros
- **Tabla `insurance_coverage`**: Reglas de cobertura por servicio
- **Tabla `feature_flags`**: Control de funcionalidades
- **Campo `insuranceId` en `patients`**: Relación opcional con seguros

### ✅ APIs
- **`/api/insurances`**: CRUD de seguros médicos
- **`/api/insurance-coverage`**: Gestión de reglas de cobertura
- **`/api/feature-flags`**: Control de funcionalidades
- **`/api/calculate-insurance`**: Cálculo en tiempo real de cobertura

### ✅ Lógica de Negocio
- **Cálculo automático de cobertura**: Porcentaje de descuento por servicio
- **Integración con facturación**: Aplicación automática de descuentos
- **Feature flags**: Control granular de funcionalidades

### ✅ Interfaz de Usuario
- **Selector de seguros**: En formulario de facturación
- **Tabla de cálculo**: Muestra cobertura en tiempo real
- **Gestión de seguros**: Página de administración
- **Configuración**: Panel de feature flags

### ✅ Exportación PDF
- **Información de seguros**: Incluida en facturas
- **Cálculo de cobertura**: Mostrado en tabla de servicios
- **Totales separados**: Base, seguro cubre, paciente paga

## 🛠️ Instalación

### 1. Aplicar Migraciones
```bash
# Ejecutar la migración de base de datos
npm run db:migrate
```

### 2. Inicializar Feature Flags
```bash
# Inicializar feature flags
node scripts/init-feature-flags.js
```

### 3. Verificar Instalación
```bash
# Ejecutar pruebas del sistema
node scripts/test-insurance-system.js
```

## 🎯 Uso del Sistema

### 1. Configuración Inicial

#### Activar Feature Flags
1. Ir a **Configuración del Sistema** (`/dashboard/settings`)
2. Activar las siguientes funcionalidades:
   - ✅ **Sistema de Seguros**: Habilita la gestión de seguros
   - ✅ **Facturación con Seguros**: Integra seguros en facturación
   - ✅ **PDFs con Seguros**: Incluye información en PDFs (opcional)

#### Configurar Seguros
1. Ir a **Gestión de Seguros** (`/dashboard/insurance`)
2. Crear compañías de seguros
3. Configurar reglas de cobertura por servicio

### 2. Asignar Seguros a Pacientes

#### Opción A: Desde Facturación
1. Ir a **Facturación** (`/dashboard/billing`)
2. Crear nueva factura
3. Seleccionar paciente
4. Seleccionar seguro del paciente
5. El sistema calculará automáticamente la cobertura

#### Opción B: Desde Perfil del Paciente
1. Ir a **Pacientes** (`/dashboard/patients`)
2. Editar paciente
3. Asignar seguro médico

### 3. Facturación con Seguros

1. **Seleccionar Paciente**: El sistema detecta si tiene seguro
2. **Agregar Servicios**: Seleccionar servicios a facturar
3. **Ver Cálculo**: La tabla muestra:
   - Precio base del servicio
   - Porcentaje de cobertura
   - Monto que cubre el seguro
   - Monto que paga el paciente
4. **Generar Factura**: Se aplica el descuento automáticamente

## 📊 Estructura de Datos

### Seguros Médicos
```typescript
interface Insurance {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Reglas de Cobertura
```typescript
interface InsuranceCoverage {
  id: string
  insuranceId: string
  serviceId: string
  coveragePercent: number // 0-100
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Cálculo de Cobertura
```typescript
interface InsuranceCalculation {
  serviceId: string
  serviceName: string
  basePrice: number
  coveragePercent: number
  insuranceCovers: number
  patientPays: number
  insuranceName?: string
}
```

## 🔧 Configuración Avanzada

### Reglas de Cobertura
- **Porcentaje**: 0-100% de cobertura
- **Por Servicio**: Cada servicio puede tener diferente cobertura
- **Por Seguro**: Cada seguro puede tener diferentes reglas

### Feature Flags
- **`insurance_system`**: Habilita/deshabilita todo el sistema
- **`insurance_billing`**: Controla integración en facturación
- **`insurance_pdf`**: Controla inclusión en PDFs

## 🧪 Pruebas

### Ejecutar Pruebas Completas
```bash
node scripts/test-insurance-system.js
```

### Verificar APIs
```bash
# Probar endpoint de cálculo
curl -X POST http://localhost:3000/api/calculate-insurance \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient_id",
    "services": [{"serviceId": "service_id", "quantity": 1, "unitPrice": 100}]
  }'
```

## 🚨 Consideraciones Importantes

### Compatibilidad
- ✅ **No destructivo**: No modifica datos existentes
- ✅ **Retrocompatible**: Facturas existentes siguen funcionando
- ✅ **Feature flags**: Control total de activación

### Seguridad
- ✅ **Validación**: Todos los inputs están validados
- ✅ **Autorización**: Solo usuarios autorizados pueden gestionar seguros
- ✅ **Auditoría**: Logs de cambios en configuración

### Rendimiento
- ✅ **Cálculo eficiente**: Consultas optimizadas
- ✅ **Caché**: Feature flags en memoria
- ✅ **Lazy loading**: Componentes se cargan bajo demanda

## 📈 Próximas Mejoras

### Funcionalidades Futuras
- [ ] **Cobertura por categoría**: Reglas por categoría de servicio
- [ ] **Límites de cobertura**: Montos máximos por seguro
- [ ] **Copagos**: Montos fijos por servicio
- [ ] **Deducibles**: Montos antes de aplicar cobertura
- [ ] **Historial de cobertura**: Tracking de cambios
- [ ] **Reportes de seguros**: Análisis de cobertura

### Mejoras Técnicas
- [ ] **Caché Redis**: Para cálculos frecuentes
- [ ] **Webhooks**: Notificaciones de cambios
- [ ] **API GraphQL**: Consultas más eficientes
- [ ] **Tests automatizados**: Suite completa de pruebas

## 🆘 Soporte

### Problemas Comunes

#### Feature Flags No Funcionan
1. Verificar que la tabla `feature_flags` existe
2. Ejecutar `node scripts/init-feature-flags.js`
3. Verificar permisos de usuario (solo ADMIN)

#### Cálculos Incorrectos
1. Verificar reglas de cobertura en `/dashboard/insurance`
2. Confirmar que el paciente tiene seguro asignado
3. Verificar que el servicio tiene regla de cobertura

#### PDFs Sin Información de Seguros
1. Activar feature flag `insurance_pdf`
2. Verificar que el paciente tiene seguro
3. Confirmar que la factura incluye cálculo de seguros

### Logs y Debugging
- **Consola del navegador**: Errores de frontend
- **Logs del servidor**: Errores de API
- **Base de datos**: Verificar datos con Prisma Studio

## 📝 Changelog

### v1.0.0 - Implementación Inicial
- ✅ Estructura de base de datos
- ✅ APIs de gestión
- ✅ Interfaz de usuario
- ✅ Integración con facturación
- ✅ Exportación PDF
- ✅ Feature flags
- ✅ Sistema de pruebas

---

**Desarrollado para KronusMed** 🏥  
*Sistema de gestión médica con integración de seguros*
