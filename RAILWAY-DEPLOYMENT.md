# Despliegue en Railway

## Configuración Inicial

### 1. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Crea un nuevo proyecto
4. Conecta tu repositorio de GitHub

### 2. Configurar Base de Datos

1. En Railway, agrega un servicio de PostgreSQL
2. Railway generará automáticamente la variable `DATABASE_URL`

### 3. Configurar Variables de Entorno

En Railway, ve a Variables y configura:

```bash
# NextAuth.js
NEXTAUTH_URL=https://tu-app.railway.app
NEXTAUTH_SECRET=tu_secret_generado_con_openssl_rand_base64_32

# Encriptación
ENCRYPTION_KEY=tu_clave_de_encriptacion_generada

# App
NEXT_PUBLIC_APP_URL=https://tu-app.railway.app

# Admin Inicial
INITIAL_ADMIN_EMAIL=admin@tu-dominio.com
INITIAL_ADMIN_PASSWORD=tu_password_seguro
INITIAL_ADMIN_NAME=Administrador

# Seguridad
NODE_ENV=production
SECURE_COOKIES=true
```

### 4. Desplegar

1. Railway detectará automáticamente el Dockerfile
2. El despliegue se iniciará automáticamente
3. La aplicación estará disponible en la URL proporcionada por Railway

## Características del Despliegue

- ✅ **Docker multi-etapa** para optimización
- ✅ **Node.js 22.18** (compatible con Next.js 15)
- ✅ **Prisma** con migraciones automáticas
- ✅ **Health checks** para monitoreo
- ✅ **Admin inicial** automático
- ✅ **Archivos estáticos** servidos correctamente
- ✅ **Seguridad** con headers HTTP

## Solución de Problemas

### Error de Build
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de Railway para errores específicos

### Error de Base de Datos
- Verifica que `DATABASE_URL` esté configurada correctamente
- Las migraciones se ejecutan automáticamente al iniciar

### Error de Autenticación
- Verifica que `NEXTAUTH_SECRET` esté configurado
- Verifica que `NEXTAUTH_URL` coincida con la URL de Railway

## Monitoreo

- Railway proporciona logs en tiempo real
- Health check disponible en `/api/health/liveness`
- Métricas de CPU y memoria en el dashboard
