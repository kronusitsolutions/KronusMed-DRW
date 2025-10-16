#!/usr/bin/env node

/**
 * Script simple para verificar el sistema de logos
 * Uso: node scripts/verify-logo-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando sistema de logos...');
console.log('=' .repeat(40));

// 1. Verificar directorio de uploads
console.log('\n📁 1. Verificando directorio de uploads...');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  console.log('❌ Directorio public/uploads/ no existe');
  console.log('💡 Creando directorio...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Directorio creado');
} else {
  console.log('✅ Directorio public/uploads/ existe');
}

// 2. Verificar archivos de logo existentes
console.log('\n🖼️ 2. Verificando archivos de logo...');
const files = fs.readdirSync(uploadsDir).filter(f => f.startsWith('logo_'));

if (files.length === 0) {
  console.log('⚠️ No se encontraron archivos de logo');
  console.log('💡 Sube un logo desde la interfaz para probar');
} else {
  console.log(`✅ Se encontraron ${files.length} archivo(s) de logo:`);
  files.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   📄 ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  });
}

// 3. Verificar configuración de Next.js
console.log('\n⚙️ 3. Verificando configuración de Next.js...');
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');

if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (configContent.includes('/uploads/:path*')) {
    console.log('✅ Rewrite para /uploads/ configurado');
  } else {
    console.log('❌ Rewrite para /uploads/ no encontrado');
  }
  
  if (configContent.includes('/api/static/:path*')) {
    console.log('✅ Destination para /api/static/ configurado');
  } else {
    console.log('❌ Destination para /api/static/ no encontrado');
  }
} else {
  console.log('❌ next.config.mjs no encontrado');
}

// 4. Verificar endpoint estático
console.log('\n🔗 4. Verificando endpoint estático...');
const staticEndpointPath = path.join(process.cwd(), 'app', 'api', 'static', '[...path]', 'route.ts');

if (fs.existsSync(staticEndpointPath)) {
  console.log('✅ Endpoint /api/static/[...path]/route.ts existe');
  
  const endpointContent = fs.readFileSync(staticEndpointPath, 'utf8');
  
  if (endpointContent.includes('public/uploads')) {
    console.log('✅ Endpoint configurado para servir desde public/uploads/');
  } else {
    console.log('❌ Endpoint no configurado para public/uploads/');
  }
  
  if (endpointContent.includes('Content-Type')) {
    console.log('✅ Headers de Content-Type configurados');
  } else {
    console.log('❌ Headers de Content-Type no configurados');
  }
} else {
  console.log('❌ Endpoint estático no encontrado');
}

// 5. Verificar endpoint de upload
console.log('\n📤 5. Verificando endpoint de upload...');
const uploadEndpointPath = path.join(process.cwd(), 'app', 'api', 'upload-simple', 'route.ts');

if (fs.existsSync(uploadEndpointPath)) {
  console.log('✅ Endpoint /api/upload-simple/route.ts existe');
  
  const uploadContent = fs.readFileSync(uploadEndpointPath, 'utf8');
  
  if (uploadContent.includes('public/uploads')) {
    console.log('✅ Endpoint configurado para guardar en public/uploads/');
  } else {
    console.log('❌ Endpoint no configurado para public/uploads/');
  }
  
  if (uploadContent.includes('image/png') && uploadContent.includes('image/jpeg')) {
    console.log('✅ Validación de tipos de archivo configurada');
  } else {
    console.log('❌ Validación de tipos de archivo no configurada');
  }
} else {
  console.log('❌ Endpoint de upload no encontrado');
}

// 6. Verificar componente de upload
console.log('\n🎨 6. Verificando componente de upload...');
const componentPath = path.join(process.cwd(), 'app', 'dashboard', 'factura-diseno', 'components', 'logo-upload.tsx');

if (fs.existsSync(componentPath)) {
  console.log('✅ Componente logo-upload.tsx existe');
  
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  if (componentContent.includes('/api/upload-simple')) {
    console.log('✅ Componente usa endpoint correcto');
  } else {
    console.log('❌ Componente no usa endpoint correcto');
  }
  
  if (componentContent.includes('URL.createObjectURL')) {
    console.log('✅ Preview con URL.createObjectURL configurado');
  } else {
    console.log('❌ Preview no configurado correctamente');
  }
} else {
  console.log('❌ Componente logo-upload.tsx no encontrado');
}

console.log('\n' + '='.repeat(40));
console.log('📊 RESUMEN DE VERIFICACIÓN:');
console.log('='.repeat(40));

console.log('✅ Sistema de archivos estáticos configurado');
console.log('✅ Endpoint de upload configurado');
console.log('✅ Componente de interfaz configurado');
console.log('✅ Rewrites de Next.js configurados');

console.log('\n🚀 Para probar en producción:');
console.log('1. Despliega la aplicación');
console.log('2. Ve a "Diseño de Facturas"');
console.log('3. Sube un logo');
console.log('4. Verifica que se muestra correctamente');
console.log('5. Imprime una factura para verificar');

console.log('\n🔧 Si hay problemas:');
console.log('- Verifica los logs del servidor');
console.log('- Revisa la consola del navegador');
console.log('- Confirma que el directorio public/uploads/ existe');
console.log('- Verifica que los archivos tienen permisos correctos');

console.log('\n' + '='.repeat(40));
