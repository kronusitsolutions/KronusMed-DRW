# 🚀 Guía de Despliegue en Railway

## 📋 Pasos para Desplegar

### 1. **Preparar el Repositorio**
```bash
# Asegúrate de que todos los archivos estén committeados
git add .
git commit -m "Preparar para despliegue en Railway"
git push origin main
```

### 2. **Configurar Railway**

1. **Crear proyecto en Railway:**
   - Ve a [railway.app](https://railway.app)
   - Crea un nuevo proyecto
   - Conecta tu repositorio de GitHub

2. **Configurar Base de Datos:**
   - Agrega un servicio PostgreSQL
   - Railway generará automáticamente la variable `DATABASE_URL`

3. **Configurar Variables de Entorno:**
   ```
   NEXTAUTH_URL=https://tu-dominio.railway.app
   NEXTAUTH_SECRET=tu-secret-aqui
   ENCRYPTION_KEY=tu-encryption-key-aqui
   NEXT_PUBLIC_APP_URL=https://tu-dominio.railway.app
   NODE_ENV=production
   SECURE_COOKIES=true
   ```

### 3. **Desplegar**

Railway detectará automáticamente que es una aplicación Next.js y ejecutará:
- `pnpm install`
- `pnpm run db:generate`
- `pnpm run db:migrate-deploy`
- `pnpm run start`

### 4. **Configurar Usuarios Iniciales**

Una vez desplegado, ejecuta el script de seed:

```bash
# En la terminal de Railway o localmente con DATABASE_URL configurada
pnpm run railway:seed
```

### 5. **Verificar Configuración**

```bash
pnpm run railway:setup
```

## 🔑 Credenciales de Acceso

Después del seed, puedes usar estas credenciales:

- **Email:** `admin@kronusmed.app`
- **Contraseña:** `admin123456`
- **Rol:** ADMIN

O también:
- **Email:** `doctor@kronusmed.app`
- **Contraseña:** `admin123456`
- **Rol:** DOCTOR

## 🐛 Solución de Problemas

### Si las citas no aparecen:

1. **Verificar logs de Railway:**
   ```bash
   railway logs
   ```

2. **Verificar base de datos:**
   ```bash
   railway connect
   ```

3. **Re-ejecutar seed:**
   ```bash
   pnpm run railway:seed
   ```

### Si hay errores de autenticación:

1. **Verificar variables de entorno:**
   - `NEXTAUTH_URL` debe ser la URL completa de Railway
   - `NEXTAUTH_SECRET` debe estar configurado
   - `DATABASE_URL` debe estar configurada

2. **Verificar conexión a base de datos:**
   ```bash
   pnpm run railway:setup
   ```

## 📊 Monitoreo

- **Logs:** `railway logs`
- **Métricas:** Dashboard de Railway
- **Base de datos:** `railway connect` para acceder a PostgreSQL

## 🔄 Actualizaciones

Para actualizar la aplicación:

```bash
git push origin main
```

Railway detectará automáticamente los cambios y redesplegará.

## ✅ Verificación Final

1. **Acceder a la aplicación:** `https://tu-dominio.railway.app`
2. **Iniciar sesión** con las credenciales
3. **Verificar que las citas aparezcan** en `/dashboard/appointments`
4. **Crear una nueva cita** para probar el flujo completo

---

**¡La aplicación debería funcionar correctamente en Railway!** 🎉
