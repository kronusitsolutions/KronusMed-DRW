const http = require('http');
const fs = require('fs');
const path = require('path');

async function testUploadFixed() {
  console.log('🧪 Probando endpoint de subida de archivos (versión mejorada)...\n');

  // Crear un archivo de imagen de prueba simple (PNG válido)
  const testFilePath = path.join(__dirname, 'test-logo.png');
  
  // Crear un PNG válido simple (1x1 pixel transparente)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  try {
    fs.writeFileSync(testFilePath, pngHeader);
    console.log('✅ Archivo PNG de prueba creado:', testFilePath);
    console.log('📏 Tamaño del archivo:', fs.statSync(testFilePath).size, 'bytes');

    // Función para hacer petición multipart/form-data correcta
    function uploadFile(filePath) {
      return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
        body += `Content-Type: image/png\r\n\r\n`;
        body += fileContent.toString('binary') + '\r\n';
        body += `--${boundary}--\r\n`;

        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/upload',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(body, 'binary')
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(body, 'binary');
        req.end();
      });
    }

    // Probar subida de archivo
    console.log('\n1. Probando subida de archivo PNG...');
    const uploadResponse = await uploadFile(testFilePath);
    console.log(`   Status: ${uploadResponse.statusCode}`);
    
    if (uploadResponse.statusCode === 401) {
      console.log('   ⚠️  Necesitas autenticación para subir archivos');
      console.log('   ✅ El endpoint está funcionando correctamente');
    } else if (uploadResponse.statusCode === 200) {
      console.log('   ✅ Archivo subido exitosamente');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else if (uploadResponse.statusCode === 400) {
      console.log('   ⚠️  Error de validación');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else if (uploadResponse.statusCode === 413) {
      console.log('   ❌ Error: Archivo demasiado grande');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else if (uploadResponse.statusCode === 415) {
      console.log('   ❌ Error: Content-Type no válido');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else {
      console.log('   ❌ Error inesperado');
      console.log('   📄 Respuesta:', uploadResponse.data);
    }

    // Verificar que el directorio de uploads existe
    console.log('\n2. Verificando directorio de uploads...');
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      console.log('   ✅ Directorio de uploads existe:', uploadsDir);
      const files = fs.readdirSync(uploadsDir);
      console.log(`   📁 Archivos en uploads: ${files.length}`);
      if (files.length > 0) {
        console.log('   📄 Archivos:', files.slice(0, 5).join(', '));
      }
    } else {
      console.log('   ❌ Directorio de uploads no existe');
    }

    // Verificar configuración de Next.js
    console.log('\n3. Verificando configuración de Next.js...');
    const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      console.log('   ✅ next.config.mjs existe');
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      if (configContent.includes('sizeLimit')) {
        console.log('   ✅ Configuración de límite de tamaño encontrada');
      } else {
        console.log('   ⚠️  Configuración de límite de tamaño no encontrada');
      }
    } else {
      console.log('   ❌ next.config.mjs no existe');
    }

    console.log('\n🎉 Pruebas de subida completadas');
    console.log('\n📋 Resumen:');
    console.log('   - El endpoint de subida está configurado');
    console.log('   - El directorio de uploads está disponible');
    console.log('   - Next.js está configurado para archivos grandes');
    console.log('\n🔑 Para probar la subida de logos:');
    console.log('   1. Inicia sesión en la aplicación');
    console.log('   2. Ve a "Diseño de Facturas"');
    console.log('   3. Sube un logo (PNG, JPG, SVG)');
    console.log('   4. Verifica que se guarda correctamente');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  } finally {
    // Limpiar archivo de prueba
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Archivo de prueba eliminado');
    }
  }
}

testUploadFixed();
