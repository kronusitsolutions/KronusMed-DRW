#!/usr/bin/env node

/**
 * Script para probar el sistema de archivos estáticos
 * Verifica que los logos subidos se pueden acceder correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Probando sistema de archivos estáticos...\n');

// Verificar directorio de uploads
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
console.log('📁 Directorio de uploads:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  console.log('❌ El directorio de uploads no existe');
  process.exit(1);
}

console.log('✅ Directorio de uploads existe');

// Listar archivos en uploads
const files = fs.readdirSync(uploadsDir);
console.log('📄 Archivos encontrados:', files.length);

if (files.length === 0) {
  console.log('⚠️  No hay archivos en el directorio de uploads');
} else {
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`  📄 ${file} (${sizeInMB} MB)`);
  });
}

// Verificar configuración de Next.js
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  console.log('\n✅ next.config.mjs existe');
  
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  if (configContent.includes('/uploads/:path*')) {
    console.log('✅ Rewrite para uploads configurado');
  } else {
    console.log('❌ Rewrite para uploads NO configurado');
  }
} else {
  console.log('\n❌ next.config.mjs no existe');
}

// Verificar endpoint estático
const staticEndpointPath = path.join(process.cwd(), 'app', 'api', 'static', '[...path]', 'route.ts');
if (fs.existsSync(staticEndpointPath)) {
  console.log('✅ Endpoint estático existe');
} else {
  console.log('❌ Endpoint estático NO existe');
}

console.log('\n🎯 Prueba completada');
console.log('\n📋 Para probar manualmente:');
console.log('1. Sube un logo desde la interfaz web');
console.log('2. Verifica que aparece en:', uploadsDir);
console.log('3. Intenta acceder a: http://localhost:3000/uploads/[nombre-del-archivo]');
console.log('4. Verifica que se muestra correctamente');
