# 📋 Historial de Consultas Médicas - KronusMed

## 🎯 Descripción General

Sistema completo de historial de consultas médicas para KronusMed que permite a los médicos y administradores gestionar, visualizar y exportar el historial médico completo de los pacientes.

## ✨ Características Principales

### 🏥 Gestión de Consultas
- ✅ **Crear nuevas consultas** con formulario completo de 4 pasos
- ✅ **Ver detalles** en modal lateral con información completa
- ✅ **Editar consultas** existentes (solo doctores)
- ✅ **Eliminar consultas** con confirmación de seguridad
- ✅ **Exportar a PDF** individual o por rango de fechas

### 🔍 Búsqueda y Filtros Avanzados
- 🔍 **Búsqueda por texto** en motivo, diagnóstico, síntomas y notas
- 📅 **Filtro por fecha** con rango personalizable
- 👨‍⚕️ **Filtro por médico** con dropdown
- 🏥 **Filtro por tipo** de consulta
- 📊 **Vista de resumen** estadístico

### 📱 Diseño Responsive
- 💻 **Desktop**: Tabla completa con todas las columnas
- 📱 **Mobile**: Vista de tarjetas optimizada
- 🔄 **Toggle de vista** para cambiar entre tabla y tarjetas
- ♿ **Accesibilidad** WCAG 2.1 compliant

## 🏗️ Arquitectura Técnica

### 📁 Estructura de Archivos

```
app/
├── api/
│   ├── patients/[id]/history/route.ts     # API historial completo
│   ├── medical-notes/
│   │   ├── route.ts                       # CRUD notas médicas
│   │   └── [id]/route.ts                  # Actualizar/eliminar
├── dashboard/patients/[id]/history/
│   └── page.tsx                           # Página principal

components/patients/
├── patient-info-header.tsx                # Header información paciente
├── consultation-table.tsx                 # Tabla de consultas
├── consultation-detail-modal.tsx          # Modal detalles
├── consultation-mobile-card.tsx           # Tarjeta móvil
└── new-consultation-dialog.tsx            # Diálogo nueva consulta

hooks/
├── use-patient-history.ts                 # Hook historial
├── use-consultation-filters.ts            # Hook filtros
└── use-pdf-export.ts                      # Hook exportación PDF
```

### 🗄️ Modelos de Datos

#### Patient (Extendido)
```typescript
model Patient {
  // ... campos existentes
  birthDate     DateTime?     // Fecha de nacimiento
  bloodType     String?       // Grupo sanguíneo
  allergies     String?       // Alergias conocidas
  emergencyContact String?    // Contacto de emergencia
  medicalHistory String?      // Antecedentes médicos
}
```

#### MedicalNote (Mejorado)
```typescript
model MedicalNote {
  // ... campos existentes
  reason        String?       // Motivo de consulta
  diagnosis     String?       // Diagnóstico principal
  symptoms      String?       // Síntomas reportados
  vitalSigns    Json?         // Signos vitales
  prescriptions Json?         // Medicamentos recetados
  followUpDate  DateTime?     // Fecha de seguimiento
}
```

## 🚀 Funcionalidades Implementadas

### 1. 📊 Dashboard de Historial
- **Información del paciente** con datos médicos completos
- **Estadísticas** del historial (total consultas, primera/última consulta)
- **Distribución por tipos** de consulta
- **Navegación intuitiva** con breadcrumbs

### 2. 📋 Gestión de Consultas
- **Formulario de 4 pasos**:
  1. Información básica (fecha, tipo, motivo, diagnóstico)
  2. Signos vitales (presión, temperatura, frecuencia cardíaca, etc.)
  3. Notas médicas y tratamiento
  4. Medicamentos recetados
- **Validación completa** con Zod
- **Encriptación** de datos sensibles
- **Auditoría** de cambios

### 3. 🔍 Sistema de Filtros
- **Búsqueda en tiempo real** por texto
- **Filtros de fecha** con calendario
- **Filtro por médico** con autocompletado
- **Filtro por tipo** de consulta
- **Contador de resultados** y filtros activos
- **Limpieza rápida** de filtros

### 4. 📱 Experiencia Móvil
- **Vista de tarjetas** optimizada para móviles
- **Toggle de vista** entre tabla y tarjetas
- **Botones táctiles** con iconos claros
- **Navegación gestual** intuitiva
- **Texto truncado** con expansión

### 5. 📄 Exportación PDF
- **Diseño profesional** con colores médicos
- **Información completa** del paciente
- **Historial detallado** de consultas
- **Signos vitales** y prescripciones
- **Filtros aplicables** por fecha o consultas específicas

## 🎨 Diseño y UX

### Paleta de Colores Médicos
```css
--medical-blue: #2563eb      /* Azul médico profesional */
--medical-light-blue: #dbeafe /* Azul claro para fondos */
--medical-green: #059669     /* Verde para estados positivos */
--medical-red: #dc2626       /* Rojo para alertas */
--medical-gray: #6b7280      /* Gris para texto secundario */
```

### Componentes UI
- **Cards** con sombras sutiles y bordes redondeados
- **Badges** para tipos de consulta y estados
- **Modales** con scroll y responsive
- **Formularios** con validación visual
- **Tablas** con hover effects y selección múltiple

## 🔧 APIs Implementadas

### GET `/api/patients/[id]/history`
Obtiene el historial completo de un paciente con estadísticas.

**Respuesta:**
```typescript
{
  patient: Patient,
  consultations: Consultation[],
  stats: {
    totalConsultations: number,
    firstConsultation: string | null,
    lastConsultation: string | null,
    consultationTypes: {
      PRIMERA_CONSULTA: number,
      SEGUIMIENTO: number,
      CONTROL: number,
      URGENCIA: number
    }
  }
}
```

### POST `/api/medical-notes`
Crea una nueva consulta médica.

**Body:**
```typescript
{
  patientId: string,
  doctorId: string,
  date: string,
  type: "PRIMERA_CONSULTA" | "SEGUIMIENTO" | "CONTROL" | "URGENCIA",
  reason: string,
  diagnosis: string,
  symptoms?: string,
  notes: string,
  duration: string,
  treatment?: string,
  vitalSigns?: {
    bloodPressure?: string,
    temperature?: string,
    heartRate?: string,
    weight?: string,
    height?: string
  },
  prescriptions?: Array<{
    medication: string,
    dosage: string,
    frequency: string,
    duration?: string
  }>,
  followUpDate?: string
}
```

### PUT `/api/medical-notes/[id]`
Actualiza una consulta médica existente.

### DELETE `/api/medical-notes/[id]`
Elimina una consulta médica.

## 🛡️ Seguridad y Privacidad

### Encriptación de Datos
- **Campos sensibles** encriptados: `notes`, `treatment`, `reason`, `diagnosis`, `symptoms`
- **Algoritmo AES-256** para encriptación
- **Desencriptación automática** en la UI

### Control de Acceso
- **Solo doctores** pueden crear/editar/eliminar consultas
- **Autenticación requerida** para todas las operaciones
- **Validación de permisos** en cada endpoint

### Auditoría
- **Log de todas las operaciones** con timestamp
- **Trazabilidad** de cambios
- **Información del usuario** que realiza la acción

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (vista de tarjetas)
- **Tablet**: 768px - 1023px (tabla compacta)
- **Desktop**: > 1024px (tabla completa)

### Adaptaciones Móviles
- **Vista de tarjetas** en lugar de tabla
- **Botones táctiles** más grandes
- **Texto truncado** con expansión
- **Navegación simplificada**
- **Formularios optimizados** para teclado móvil

## ♿ Accesibilidad

### Características Implementadas
- **Navegación por teclado** completa
- **Etiquetas ARIA** descriptivas
- **Contraste de colores** WCAG AA
- **Reducción de movimiento** respetada
- **Focus visible** en todos los elementos interactivos
- **Texto alternativo** en iconos

### Mejores Prácticas
- **Semántica HTML** correcta
- **Estructura de encabezados** lógica
- **Formularios accesibles** con labels
- **Mensajes de error** descriptivos
- **Estados de carga** claros

## 🚀 Instalación y Uso

### 1. Migración de Base de Datos
```bash
npx prisma migrate dev --name add-patient-medical-history-fields
```

### 2. Navegación
Accede al historial desde la lista de pacientes:
```
/dashboard/patients/[id]/history
```

### 3. Uso Básico
1. **Ver historial**: Navega a un paciente y haz clic en "Ver Historial"
2. **Nueva consulta**: Botón "Nueva Consulta" en la parte superior
3. **Filtrar**: Usa los filtros en la parte superior de la tabla
4. **Exportar**: Botón "Exportar PDF" para generar reporte

## 🔮 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] **Notificaciones** de citas de seguimiento
- [ ] **Integración** con calendario
- [ ] **Plantillas** de consultas frecuentes
- [ ] **Análisis** de tendencias médicas
- [ ] **Integración** con laboratorios
- [ ] **Chat** médico-paciente
- [ ] **Recordatorios** automáticos

### Optimizaciones Técnicas
- [ ] **Paginación** infinita para grandes historiales
- [ ] **Caché** de consultas frecuentes
- [ ] **Compresión** de imágenes médicas
- [ ] **Sincronización** offline
- [ ] **PWA** para uso móvil

## 📞 Soporte

Para soporte técnico o reportar bugs, contacta al equipo de desarrollo de KronusMed.

---

**Desarrollado con ❤️ para KronusMed** - Sistema de Gestión Médica Integral
