# 🚀 Instrucciones de Migración - Campos Opcionales

## 📋 Archivos a Reemplazar

### 1. **Schema de Prisma:**
```bash
cp prisma/schema-updated.prisma prisma/schema.prisma
```

### 2. **API de Pacientes:**
```bash
cp app/api/patients/route-updated.ts app/api/patients/route.ts
```

### 3. **Endpoint de Migración (ya corregido):**
- `app/api/debug/apply-optional-migration/route.ts` ✅ (ya corregido)

## 🔧 Cambios Realizados

### Schema de Prisma:
- `nationality: String` → `nationality: String?` (opcional)
- `cedula: String` → `cedula: String?` (opcional)

### API de Pacientes:
- Campos `nationality` y `cedula` ahora son opcionales
- Validación: `z.string().optional()`
- Búsqueda: incluye `nationality` y `cedula` en búsquedas
- Creación: acepta `null` para campos opcionales

## 🚀 Pasos para Aplicar

### 1. **Reemplazar archivos:**
```bash
# Reemplazar schema
cp prisma/schema-updated.prisma prisma/schema.prisma

# Reemplazar API de pacientes  
cp app/api/patients/route-updated.ts app/api/patients/route.ts
```

### 2. **Hacer commit y push:**
```bash
git add .
git commit -m "feat: hacer nationality y cedula opcionales en Patient model"
git push origin main
```

### 3. **Aplicar migración de base de datos:**
- Ve a: `https://cesadib.kronusmed.app/api/debug/apply-optional-migration`
- Haz **POST** para aplicar la migración

### 4. **Verificar migración:**
- Ve a: `https://cesadib.kronusmed.app/api/debug/apply-optional-migration`
- Haz **GET** para verificar el estado

## ✅ Resultado Esperado

Después de la migración:
- ✅ Campos `nationality` y `cedula` serán opcionales
- ✅ Registros existentes tendrán valores por defecto
- ✅ APIs funcionarán sin errores 500
- ✅ Nuevos pacientes pueden crearse sin estos campos

## 🔍 Verificación

1. **Probar API de pacientes:**
   - `GET https://cesadib.kronusmed.app/api/patients`

2. **Probar API de facturas:**
   - `GET https://cesadib.kronusmed.app/api/invoices`

3. **Probar creación de paciente:**
   - `POST https://cesadib.kronusmed.app/api/patients`
   - Con datos sin `nationality` y `cedula`

## 📝 Notas

- Los campos opcionales permiten migración gradual
- Registros existentes mantienen compatibilidad
- Búsquedas funcionan con campos opcionales
- No se requieren cambios en el frontend inmediatamente
