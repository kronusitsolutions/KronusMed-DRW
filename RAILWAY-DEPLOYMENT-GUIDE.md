# 🚀 Guía Completa de Despliegue - KronusMed

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO
**Railway usa URLs internas que no funcionan en contenedores.**
- ❌ `DATABASE_URL` interna: `postgres.railway.internal:5432` (NO FUNCIONA)
- ✅ `DATABASE_PUBLIC_URL`: `ballast.proxy.rlwy.net:57492` (SÍ FUNCIONA)

## 🎯 SOLUCIÓN DEFINITIVA

### 1. **Configuración Correcta en Railway Dashboard**

#### Variables de Entorno OBLIGATORIAS:
```bash
# Base de datos (USAR LA PÚBLICA)
DATABASE_URL=postgresql://postgres:password@ballast.proxy.rlwy.net:57492/railway

# NextAuth
NEXTAUTH_URL=https://tu-app.up.railway.app
NEXTAUTH_SECRET=tu_secret_de_32_caracteres

# Admin inicial
INITIAL_ADMIN_EMAIL=admin@kronusmed.app
INITIAL_ADMIN_PASSWORD=password_seguro_2024
INITIAL_ADMIN_NAME=Administrador Principal

# App
NEXT_PUBLIC_APP_URL=https://tu-app.up.railway.app
NODE_ENV=production
SECURE_COOKIES=true
AUTH_TRUST_HOST=true

# Encriptación
ENCRYPTION_KEY=clave_de_encriptacion_32_caracteres
```

### 2. **Script de Inicialización Robusto**

El script `scripts/railway-init.sh` debe:
- ✅ Usar `DATABASE_PUBLIC_URL` si está disponible
- ✅ Fallback a `DATABASE_URL` si es necesario
- ✅ Manejar errores graciosamente
- ✅ Logs detallados para debugging

### 3. **Comando de Inicio Optimizado**

```json
{
  "startCommand": "sh -c 'echo \"🚀 Iniciando Railway...\" && (npx prisma migrate deploy || npx prisma db push) && echo \"✅ Migraciones completadas\" && pnpm run db:setup-production-admin && echo \"✅ Admin configurado\" && node server.js'"
}
```

## 🚀 PROCESO DE DESPLIEGUE (SIN PROBLEMAS)

### Paso 1: Preparar el Proyecto
```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd KronusMed-DRW

# 2. Instalar dependencias
npm install

# 3. Generar Prisma Client
npx prisma generate
```

### Paso 2: Configurar Railway
```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Agregar base de datos PostgreSQL
railway add postgresql
```

### Paso 3: Configurar Variables de Entorno
**EN RAILWAY DASHBOARD:**

1. Ve a tu proyecto en Railway
2. Selecciona el servicio de tu app
3. Ve a "Variables"
4. Agrega TODAS las variables de la sección anterior

### Paso 4: Desplegar
```bash
# 1. Hacer commit de cambios
git add .
git commit -m "Deploy to Railway"
git push

# 2. Railway se despliega automáticamente
# 3. Verificar logs
railway logs
```

## 🔧 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "Can't reach database server"
**Causa:** Usando `DATABASE_URL` interna
**Solución:** Usar `DATABASE_PUBLIC_URL` en Railway Dashboard

### ❌ Error: "Tables not created"
**Causa:** Migraciones no se ejecutaron
**Solución:** Verificar que `startCommand` ejecute migraciones

### ❌ Error: "Admin not created"
**Causa:** Variables de admin no configuradas
**Solución:** Verificar `INITIAL_ADMIN_*` variables

## 📊 VERIFICACIÓN POST-DESPLIEGUE

### 1. Verificar Base de Datos
```bash
railway run npx prisma db push
```

### 2. Verificar Admin
```bash
railway run pnpm run db:setup-production-admin
```

### 3. Verificar Aplicación
- Visitar la URL de Railway
- Intentar login con credenciales de admin
- Verificar que todas las páginas cargan

## 🎯 MEJORAS IMPLEMENTADAS

### 1. **Script de Inicialización Mejorado**
- Detecta automáticamente la URL correcta
- Maneja errores graciosamente
- Logs detallados para debugging

### 2. **Configuración de Railway Optimizada**
- Comando de inicio robusto
- Variables de entorno predefinidas
- Health checks configurados

### 3. **Documentación Completa**
- Guía paso a paso
- Solución de problemas
- Mejores prácticas

## ⚡ DESPLIEGUE RÁPIDO (5 MINUTOS)

```bash
# 1. Clonar y configurar
git clone <repo>
cd KronusMed-DRW
npm install

# 2. Railway
railway login
railway init
railway add postgresql

# 3. Configurar variables en Railway Dashboard
# (Ver sección de variables arriba)

# 4. Desplegar
git push
```

**¡Listo! La aplicación debería funcionar sin problemas.**
