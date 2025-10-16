#!/usr/bin/env node

/**
 * Script para verificar el sistema de logos en producción
 * Uso: node scripts/test-logo-upload-production.js [URL_BASE]
 * Ejemplo: node scripts/test-logo-upload-production.js https://tu-app.railway.app
 */

const fs = require('fs');
const path = require('path');

// URL base (desarrollo por defecto)
const BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log('🔍 Verificando sistema de logos en:', BASE_URL);
console.log('=' .repeat(50));

async function testStaticEndpoint() {
  console.log('\n📁 1. Verificando endpoint de archivos estáticos...');
  
  try {
    // Verificar si existe un archivo de logo
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const files = fs.readdirSync(uploadsDir).filter(f => f.startsWith('logo_'));
    
    if (files.length === 0) {
      console.log('❌ No se encontraron archivos de logo en public/uploads/');
      return false;
    }
    
    const testFile = files[0];
    console.log(`✅ Archivo encontrado: ${testFile}`);
    
    // Probar acceso al archivo
    const response = await fetch(`${BASE_URL}/uploads/${testFile}`);
    
    if (response.ok) {
      console.log(`✅ Archivo accesible: ${response.status} ${response.statusText}`);
      console.log(`📏 Tamaño: ${response.headers.get('content-length')} bytes`);
      console.log(`📄 Tipo: ${response.headers.get('content-type')}`);
      return true;
    } else {
      console.log(`❌ Error accediendo al archivo: ${response.status} ${response.statusText}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error verificando archivos estáticos:', error.message);
    return false;
  }
}

async function testUploadEndpoint() {
  console.log('\n📤 2. Verificando endpoint de subida...');
  
  try {
    // Crear un archivo de prueba pequeño
    const testImagePath = path.join(process.cwd(), 'test-logo.png');
    
    // Crear una imagen PNG simple de 1x1 pixel
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    fs.writeFileSync(testImagePath, pngHeader);
    console.log('✅ Archivo de prueba creado');
    
    // Crear FormData
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-logo.png',
      contentType: 'image/png'
    });
    
    // Probar subida
    const response = await fetch(`${BASE_URL}/api/upload-simple`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Subida exitosa');
      console.log(`📁 URL: ${result.url}`);
      console.log(`📄 Nombre: ${result.fileName}`);
      
      // Limpiar archivo de prueba
      fs.unlinkSync(testImagePath);
      
      return result.url;
    } else {
      const error = await response.text();
      console.log(`❌ Error en subida: ${response.status} ${response.statusText}`);
      console.log(`📄 Respuesta: ${error}`);
      
      // Limpiar archivo de prueba
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
      
      return null;
    }
    
  } catch (error) {
    console.log('❌ Error probando subida:', error.message);
    return null;
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️ 3. Verificando conexión a base de datos...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Conexión a base de datos: OK');
      return true;
    } else {
      console.log(`❌ Error en health check: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error verificando base de datos:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando verificación del sistema de logos...\n');
  
  const results = {
    static: await testStaticEndpoint(),
    upload: await testUploadEndpoint(),
    database: await testDatabaseConnection()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS DE LA VERIFICACIÓN:');
  console.log('='.repeat(50));
  
  console.log(`📁 Archivos estáticos: ${results.static ? '✅ OK' : '❌ FALLO'}`);
  console.log(`📤 Subida de archivos: ${results.upload ? '✅ OK' : '❌ FALLO'}`);
  console.log(`🗄️ Base de datos: ${results.database ? '✅ OK' : '❌ FALLO'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('✅ El sistema de logos está funcionando correctamente');
    console.log('🚀 Listo para producción');
  } else {
    console.log('⚠️ ALGUNAS PRUEBAS FALLARON');
    console.log('🔧 Revisa la configuración antes de desplegar');
  }
  console.log('='.repeat(50));
  
  return allPassed;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error en la verificación:', error);
    process.exit(1);
  });
}

module.exports = { main, testStaticEndpoint, testUploadEndpoint, testDatabaseConnection };
