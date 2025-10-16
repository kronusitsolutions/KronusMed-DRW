# Migración de Edad a Fecha de Nacimiento

## Resumen

Se ha implementado una migración gradual del campo `edad` al campo `fecha de nacimiento` para mejorar la precisión de los datos de los pacientes. Esta migración mantiene la compatibilidad con los datos existentes.

## Cambios Implementados

### 1. Esquema de Base de Datos
- ✅ Campo `age` ahora es opcional (`Int?`) para mantener compatibilidad
- ✅ Campo `birthDate` ya existía y es el campo principal
- ✅ Migración SQL creada: `20241218000000_make_age_optional`

### 2. Utilidades de Edad (`lib/age-utils.ts`)
- ✅ `calculateAge()` - Calcula edad a partir de fecha de nacimiento
- ✅ `calculateBirthDateFromAge()` - Calcula fecha aproximada desde edad
- ✅ `getDisplayAge()` - Obtiene edad para mostrar (prioriza fecha de nacimiento)
- ✅ `formatAge()` - Formatea la edad para visualización
- ✅ `getFormBirthDate()` - Obtiene fecha para formularios
- ✅ `parseFormDate()` - Convierte fecha de formulario a Date

### 3. Formularios Actualizados
- ✅ Formulario de nuevo paciente usa campo de fecha de nacimiento
- ✅ Formulario de edición de paciente usa campo de fecha de nacimiento
- ✅ Validación actualizada para requerir fecha de nacimiento
- ✅ Cálculo automático de edad para mantener compatibilidad

### 4. Visualización Actualizada
- ✅ Lista de pacientes muestra edad calculada desde fecha de nacimiento
- ✅ Componente de información del paciente actualizado
- ✅ Lista virtualizada de pacientes actualizada
- ✅ Lista paginada de pacientes actualizada

### 5. API Actualizada
- ✅ Endpoint POST acepta fecha de nacimiento
- ✅ Campo `age` se mantiene para compatibilidad
- ✅ Validación actualizada

## Instrucciones de Migración

### Paso 1: Aplicar Migración de Base de Datos
```bash
# Ejecutar la migración de Prisma
npx prisma migrate deploy
```

### Paso 2: Migrar Datos Existentes (Opcional)
```bash
# Verificar estado actual
node scripts/migrate-age-to-birthdate.js check

# Ejecutar migración (descomenta la línea de confirmación en el script)
node scripts/migrate-age-to-birthdate.js
```

### Paso 3: Verificar Funcionamiento
1. Crear un nuevo paciente con fecha de nacimiento
2. Verificar que la edad se calcula correctamente
3. Editar un paciente existente
4. Verificar que los datos se mantienen correctamente

## Compatibilidad

### Datos Existentes
- ✅ Los pacientes existentes con solo `age` siguen funcionando
- ✅ La edad se calcula automáticamente si hay `birthDate`
- ✅ Si no hay `birthDate`, se usa el campo `age` legacy

### Nuevos Datos
- ✅ Los nuevos pacientes requieren fecha de nacimiento
- ✅ La edad se calcula automáticamente y se guarda para compatibilidad
- ✅ Los formularios usan campos de fecha nativos del navegador

## Ventajas de la Migración

1. **Precisión**: La edad se calcula automáticamente y siempre es exacta
2. **Consistencia**: Todos los pacientes tendrán la misma estructura de datos
3. **Funcionalidad**: Permite cálculos más precisos de edad
4. **Compatibilidad**: No rompe datos existentes
5. **UX**: Mejor experiencia de usuario con campos de fecha nativos

## Rollback (Si es necesario)

Si necesitas revertir los cambios:

1. **Revertir migración de base de datos**:
   ```sql
   ALTER TABLE "patients" ALTER COLUMN "age" SET NOT NULL;
   ```

2. **Revertir código**: Usar git para revertir los cambios de código

3. **Restaurar datos**: Si se ejecutó la migración de datos, restaurar desde backup

## Notas Importantes

- ⚠️ **Backup**: Siempre hacer backup antes de ejecutar migraciones en producción
- ⚠️ **Testing**: Probar en entorno de desarrollo primero
- ⚠️ **Monitoreo**: Verificar que la aplicación funciona correctamente después de la migración
- ✅ **Gradual**: La migración es gradual y no rompe la aplicación
- ✅ **Reversible**: Los cambios pueden revertirse si es necesario

## Archivos Modificados

- `prisma/schema.prisma` - Esquema actualizado
- `prisma/migrations/20241218000000_make_age_optional/migration.sql` - Migración SQL
- `lib/age-utils.ts` - Utilidades de edad (NUEVO)
- `scripts/migrate-age-to-birthdate.js` - Script de migración (NUEVO)
- `app/dashboard/patients/page.tsx` - Formularios actualizados
- `app/api/patients/route.ts` - API actualizada
- `components/patients/patient-info-header.tsx` - Visualización actualizada
- `components/patients/paginated-patient-list.tsx` - Lista actualizada
- `components/patients/virtualized-patient-list.tsx` - Lista virtualizada actualizada
