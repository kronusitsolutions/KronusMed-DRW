#!/usr/bin/env node

/**
 * Script para probar el endpoint de archivos estáticos
 * Verifica que los archivos se pueden servir correctamente
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Probando endpoint de archivos estáticos...\n');

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

console.log(`📄 Probando ${files.length} archivo(s)...\n`);

// Función para probar un archivo
function testFile(fileName) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/uploads/${fileName}`;
    
    console.log(`🔍 Probando: ${url}`);
    
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${fileName} - OK (${res.statusCode})`);
          console.log(`   Content-Type: ${res.headers['content-type']}`);
          console.log(`   Content-Length: ${res.headers['content-length']} bytes`);
          resolve(true);
        } else {
          console.log(`❌ ${fileName} - Error (${res.statusCode})`);
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${fileName} - Error de conexión: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${fileName} - Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

// Probar todos los archivos
async function testAllFiles() {
  const results = [];
  
  for (const file of files) {
    const result = await testFile(file);
    results.push({ file, success: result });
    console.log(''); // Línea en blanco
  }
  
  // Resumen
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('📊 Resumen:');
  console.log(`✅ Exitosos: ${successful}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📄 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Archivos con problemas:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.file}`);
    });
  }
  
  if (successful === results.length) {
    console.log('\n🎉 ¡Todos los archivos funcionan correctamente!');
  } else {
    console.log('\n⚠️  Algunos archivos tienen problemas');
  }
}

// Ejecutar pruebas
testAllFiles().catch(console.error);
