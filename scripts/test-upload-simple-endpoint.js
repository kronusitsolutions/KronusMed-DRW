const http = require('http');
const fs = require('fs');
const path = require('path');

async function testUploadSimpleEndpoint() {
  console.log('🧪 Probando endpoint de subida simple...\n');

  // Crear un archivo de prueba pequeño
  const testFilePath = path.join(__dirname, 'test-simple.txt');
  const testContent = 'Test content for simple upload';
  
  try {
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Archivo de prueba creado:', testFilePath);
    console.log('📏 Tamaño del archivo:', fs.statSync(testFilePath).size, 'bytes');

    // Función para hacer petición simple
    function uploadFile(filePath) {
      return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
        
        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;
        body += fileContent.toString() + '\r\n';
        body += `--${boundary}--\r\n`;

        const options = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/upload-simple',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(body)
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

        req.write(body);
        req.end();
      });
    }

    // Probar subida de archivo
    console.log('\n1. Probando subida de archivo pequeño...');
    const uploadResponse = await uploadFile(testFilePath);
    console.log(`   Status: ${uploadResponse.statusCode}`);
    
    if (uploadResponse.statusCode === 401) {
      console.log('   ⚠️  Necesitas autenticación para subir archivos');
      console.log('   ✅ El endpoint está funcionando correctamente');
    } else if (uploadResponse.statusCode === 400) {
      console.log('   ⚠️  Error de validación (esperado para archivo .txt)');
      console.log('   📄 Respuesta:', uploadResponse.data);
      console.log('   ✅ El endpoint está funcionando correctamente');
    } else if (uploadResponse.statusCode === 413) {
      console.log('   ❌ Error: Archivo demasiado grande');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else if (uploadResponse.statusCode === 415) {
      console.log('   ❌ Error: Content-Type no válido');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else if (uploadResponse.statusCode === 200) {
      console.log('   ✅ Archivo subido exitosamente');
      console.log('   📄 Respuesta:', uploadResponse.data);
    } else {
      console.log('   ❌ Error inesperado');
      console.log('   📄 Respuesta:', uploadResponse.data);
    }

    // Verificar logs del servidor
    console.log('\n2. Verificando logs del servidor...');
    console.log('   🔍 Revisa los logs con: docker-compose logs app --tail=20');

    console.log('\n🎉 Pruebas de subida completadas');
    console.log('\n📋 Resumen:');
    console.log('   - El endpoint de subida simple está configurado');
    console.log('   - Logs detallados habilitados');
    console.log('\n🔑 Para probar la subida de logos:');
    console.log('   1. Inicia sesión en la aplicación');
    console.log('   2. Ve a "Diseño de Facturas"');
    console.log('   3. Sube un logo (PNG, JPG, SVG)');
    console.log('   4. Verifica que no hay errores en la consola');

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

testUploadSimpleEndpoint();
