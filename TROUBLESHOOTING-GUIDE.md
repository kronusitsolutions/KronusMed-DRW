# 🔧 Guía de Solución de Problemas - KronusMed

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ **Error: "Can't reach database server at postgres.railway.internal:5432"**

**Causa:** Railway usa URLs internas que no funcionan en contenedores.

**Solución:**
1. En Railway Dashboard, ve a Variables
2. Cambia `DATABASE_URL` por `DATABASE_PUBLIC_URL`
3. O agrega `DATABASE_PUBLIC_URL` como variable separada

```bash
# Verificar URLs disponibles
railway run echo $DATABASE_URL
railway run echo $DATABASE_PUBLIC_URL
```

### ❌ **Error: "Tables not created"**

**Causa:** Migraciones no se ejecutaron.

**Solución:**
```bash
# Ejecutar migraciones manualmente
railway run npx prisma migrate deploy

# Si falla, usar db push
railway run npx prisma db push

# Si sigue fallando, crear tablas manualmente
railway run node scripts/create-tables-directly.js
```

### ❌ **Error: "Admin not created"**

**Causa:** Variables de admin no configuradas o script falló.

**Solución:**
```bash
# Verificar variables
railway run echo $INITIAL_ADMIN_EMAIL
railway run echo $INITIAL_ADMIN_PASSWORD

# Crear admin manualmente
railway run node scripts/create-admin.js
```

### ❌ **Error: "ENUM types not found"**

**Causa:** Tipos ENUM no se crearon.

**Solución:**
```bash
# Crear ENUMs manualmente
railway run node scripts/create-enums.js

# Actualizar tablas
railway run node scripts/fix-tables-step-by-step.js
```

### ❌ **Error: "Health check failed"**

**Causa:** Aplicación no inicia correctamente.

**Solución:**
1. Verificar logs: `railway logs`
2. Verificar variables de entorno
3. Verificar que el puerto esté configurado: `PORT=8080`

## 🔍 **DIAGNÓSTICO PASO A PASO**

### 1. **Verificar Conexión a Base de Datos**
```bash
railway run node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => console.log('✅ DB OK')).catch(e => console.log('❌ DB Error:', e.message)).finally(() => prisma.\$disconnect());
"
```

### 2. **Verificar Variables de Entorno**
```bash
railway variables
```

### 3. **Verificar Tablas**
```bash
railway run node scripts/verify-database.js
```

### 4. **Verificar Admin**
```bash
railway run node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(count => console.log('Usuarios:', count)).finally(() => prisma.\$disconnect());
"
```

## 🚀 **SOLUCIÓN RÁPIDA (5 MINUTOS)**

Si todo falla, ejecuta estos comandos en orden:

```bash
# 1. Crear ENUMs
railway run node scripts/create-enums.js

# 2. Crear tablas
railway run node scripts/create-tables-directly.js

# 3. Actualizar tipos
railway run node scripts/fix-tables-step-by-step.js

# 4. Crear admin
railway run node scripts/create-admin.js

# 5. Verificar todo
railway run node scripts/verify-database.js
```

## 📊 **VERIFICACIÓN COMPLETA**

```bash
# Ejecutar verificación automática
railway run node scripts/verify-deployment.js
```

Este script verificará:
- ✅ Variables de entorno
- ✅ Conexión a base de datos
- ✅ Tablas principales
- ✅ Administrador
- ✅ Tipos ENUM

## 🎯 **PREVENCIÓN DE PROBLEMAS**

### 1. **Configuración Correcta en Railway**
- Usar `DATABASE_PUBLIC_URL` en lugar de `DATABASE_URL`
- Configurar todas las variables requeridas
- Verificar que `NODE_ENV=production`

### 2. **Script de Inicialización Robusto**
- El script `railway-init.sh` maneja errores automáticamente
- Tiene fallbacks para cada paso
- Logs detallados para debugging

### 3. **Verificación Automática**
- Ejecutar `verify-deployment.js` después de cada despliegue
- Identificar problemas antes de que afecten a usuarios

## 📞 **SOPORTE**

Si sigues teniendo problemas:

1. **Verificar logs:** `railway logs`
2. **Ejecutar diagnóstico:** `railway run node scripts/verify-deployment.js`
3. **Revisar variables:** `railway variables`
4. **Contactar soporte** con los logs de error

**¡Con esta guía, nunca más perderás 7 horas en problemas de despliegue!** 🎉
