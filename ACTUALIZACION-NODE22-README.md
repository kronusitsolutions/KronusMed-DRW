# Actualización a Node.js 22

Este documento describe cómo actualizar la aplicación KronusMed a Node.js 22 manteniendo la funcionalidad actual.

## Cambios Realizados

### 1. Configuración de Node.js
- **Versión requerida**: Node.js >= 22.0.0
- **npm requerido**: >= 10.0.0
- **Dockerfiles actualizados** para usar `node:22-alpine`

### 2. Dependencias Actualizadas
- **Next.js**: 15.2.4 → 15.2.5
- **Prisma**: 6.13.0 → 6.15.0
- **@prisma/client**: 6.13.0 → 6.15.0
- **TypeScript**: 5.5 → 5.7

### 3. Archivos Modificados
- `package.json` - Versiones de Node.js y dependencias
- `Dockerfile` - Imagen base actualizada
- `Dockerfile.dev` - Imagen base actualizada
- `scripts/update-to-node22.ps1` - Script de actualización
- `scripts/verify-node22-compatibility.ps1` - Script de verificación

## Instrucciones de Actualización

### Opción 1: Actualización Automática (Recomendada)

1. **Ejecutar el script de actualización**:
   ```powershell
   pnpm run update:node22
   ```

2. **Verificar la instalación**:
   ```powershell
   pnpm run verify:node22
   ```

### Opción 2: Actualización Manual

1. **Instalar Node.js 22**:
   ```powershell
   nvm install 22
   nvm use 22
   ```

2. **Instalar pnpm**:
   ```powershell
   npm install -g pnpm@latest
   ```

3. **Instalar dependencias**:
   ```powershell
   pnpm install
   ```

4. **Generar cliente Prisma**:
   ```powershell
   pnpm run db:generate
   ```

5. **Verificar funcionamiento**:
   ```powershell
   pnpm run typecheck
   pnpm run lint
   ```

## Verificación Post-Actualización

### 1. Verificar Versiones
```powershell
node --version    # Debe mostrar v22.x.x
npm --version     # Debe mostrar 10.x.x o superior
pnpm --version    # Debe mostrar la versión más reciente
```

### 2. Verificar Funcionalidad
```powershell
# Compilación TypeScript
pnpm run typecheck

# Linting
pnpm run lint

# Generación de Prisma
pnpm run db:generate

# Construcción de la aplicación
pnpm run build
```

### 3. Verificar Desarrollo
```powershell
# Iniciar servidor de desarrollo
pnpm run dev
```

## Beneficios de la Actualización

### Rendimiento
- **Mejoras de rendimiento** en V8 engine
- **Mejor gestión de memoria** con Node.js 22
- **Optimizaciones de red** y I/O

### Seguridad
- **Parches de seguridad** más recientes
- **Mejor soporte** para TLS/SSL
- **Actualizaciones de dependencias** con correcciones de seguridad

### Compatibilidad
- **Mejor soporte** para ES modules
- **Compatibilidad mejorada** con TypeScript 5.7
- **Soporte nativo** para las últimas características de JavaScript

## Solución de Problemas

### Error: "Node.js version not supported"
- Verificar que estás usando Node.js 22
- Ejecutar: `nvm use 22`

### Error: "Module not found"
- Limpiar caché: `pnpm cache clean --force`
- Reinstalar dependencias: `pnpm install`

### Error: "Prisma client not generated"
- Ejecutar: `pnpm run db:generate`
- Verificar que Prisma esté instalado: `pnpm list prisma`

### Error de compilación TypeScript
- Verificar versión: `pnpm list typescript`
- Actualizar si es necesario: `pnpm update typescript`

## Docker

Los Dockerfiles ya están actualizados para usar Node.js 22:

```bash
# Construir imagen de producción
docker build -t kronusmed-app .

# Construir imagen de desarrollo
docker build -f Dockerfile.dev -t kronusmed-dev .
```

## Railway Deployment

La configuración de Railway no requiere cambios adicionales. El deployment usará automáticamente la nueva versión de Node.js especificada en el Dockerfile.

## Rollback (Si es necesario)

Si necesitas volver a Node.js 18:

```powershell
nvm use 18.17.0
pnpm install
pnpm run db:generate
```

## Notas Importantes

1. **Backup**: Siempre haz backup de tu base de datos antes de actualizar
2. **Testing**: Prueba la aplicación en un entorno de desarrollo antes de producción
3. **Dependencias**: Algunas dependencias pueden requerir actualización adicional
4. **Compatibilidad**: Verifica que todos los scripts personalizados funcionen con Node.js 22

## Soporte

Si encuentras problemas durante la actualización:

1. Ejecuta `pnpm run verify:node22` para diagnóstico
2. Revisa los logs de error
3. Verifica que todas las dependencias estén actualizadas
4. Consulta la documentación oficial de Node.js 22

---

**Fecha de actualización**: Diciembre 2024  
**Versión de Node.js objetivo**: 22.x.x (última estable)  
**Estado**: Listo para producción
