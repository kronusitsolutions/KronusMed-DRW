#!/usr/bin/env node

/**
 * Script para probar el endpoint de archivos estáticos (offline)
 * Verifica que los archivos existen y son accesibles
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Probando archivos estáticos (offline)...\n');

// Verificar archivos existentes
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('❌ Directorio de uploads no existe');
  process.exit(1);
}

const files = fs.readdirSync(uploadsDir);
if (files.length === 0) {
  console.log('⚠️  No hay archivos para probar');
  process.exit(0);
}

console.log(`📄 Analizando ${files.length} archivo(s)...\n`);

// Función para analizar un archivo
function analyzeFile(fileName) {
  const filePath = path.join(uploadsDir, fileName);
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  
  // Verificar que el archivo es legible
  try {
    const buffer = fs.readFileSync(filePath);
    const isValid = buffer.length > 0;
    
    console.log(`📄 ${fileName}:`);
    console.log(`   Tamaño: ${sizeInMB} MB`);
    console.log(`   Legible: ${isValid ? '✅ Sí' : '❌ No'}`);
    console.log(`   Bytes: ${buffer.length}`);
    
    // Determinar tipo MIME
    const extension = fileName.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    
    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
    }
    
    console.log(`   Tipo MIME: ${mimeType}`);
    console.log(`   URL esperada: /uploads/${fileName}`);
    console.log('');
    
    return {
      file: fileName,
      size: sizeInMB,
      readable: isValid,
      mimeType: mimeType,
      url: `/uploads/${fileName}`
    };
    
  } catch (error) {
    console.log(`❌ ${fileName} - Error al leer: ${error.message}`);
    return {
      file: fileName,
      error: error.message
    };
  }
}

// Analizar todos los archivos
const results = files.map(analyzeFile);

// Resumen
const successful = results.filter(r => r.readable).length;
const failed = results.filter(r => r.error).length;

console.log('📊 Resumen:');
console.log(`✅ Archivos válidos: ${successful}`);
console.log(`❌ Archivos con problemas: ${failed}`);
console.log(`📄 Total: ${results.length}`);

if (successful > 0) {
  console.log('\n✅ Archivos listos para servir:');
  results.filter(r => r.readable).forEach(r => {
    console.log(`   - ${r.file} (${r.size} MB, ${r.mimeType})`);
  });
}

if (failed > 0) {
  console.log('\n❌ Archivos con problemas:');
  results.filter(r => r.error).forEach(r => {
    console.log(`   - ${r.file}: ${r.error}`);
  });
}

// Verificar configuración
console.log('\n🔧 Verificando configuración...');

// Verificar next.config.mjs
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  if (configContent.includes('/uploads/:path*')) {
    console.log('✅ Rewrite configurado en next.config.mjs');
  } else {
    console.log('❌ Rewrite NO configurado en next.config.mjs');
  }
} else {
  console.log('❌ next.config.mjs no existe');
}

// Verificar endpoint estático
const staticEndpointPath = path.join(process.cwd(), 'app', 'api', 'static', '[...path]', 'route.ts');
if (fs.existsSync(staticEndpointPath)) {
  console.log('✅ Endpoint estático existe');
  
  const endpointContent = fs.readFileSync(staticEndpointPath, 'utf8');
  if (endpointContent.includes('"public"') && endpointContent.includes('"uploads"')) {
    console.log('✅ Endpoint configurado para public/uploads');
  } else {
    console.log('❌ Endpoint NO configurado para public/uploads');
  }
} else {
  console.log('❌ Endpoint estático NO existe');
}

console.log('\n🎯 Análisis completado');
console.log('\n📋 Para probar cuando la app esté corriendo:');
console.log('1. Inicia la aplicación: npm run dev');
console.log('2. Ejecuta: node scripts/test-static-endpoint.js');
console.log('3. Verifica que las URLs responden correctamente');
