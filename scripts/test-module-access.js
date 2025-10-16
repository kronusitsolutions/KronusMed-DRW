const http = require('http');

async function testModuleAccess() {
  console.log('🧪 Probando acceso al módulo de Diseño de Facturas...\n');

  // Función para hacer peticiones HTTP
  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET'
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

      req.end();
    });
  }

  try {
    // Probar la página principal del módulo
    console.log('1. Probando página del módulo...');
    const pageResponse = await makeRequest('/dashboard/factura-diseno');
    console.log(`   Status: ${pageResponse.statusCode}`);
    if (pageResponse.statusCode === 200) {
      console.log('   ✅ Página del módulo accesible');
    } else {
      console.log('   ❌ Error en la página del módulo');
    }

    // Probar el endpoint de la API
    console.log('\n2. Probando endpoint de la API...');
    const apiResponse = await makeRequest('/api/invoice-design');
    console.log(`   Status: ${apiResponse.statusCode}`);
    if (apiResponse.statusCode === 401) {
      console.log('   ✅ Endpoint de API funcionando (401 = No autorizado, esperado)');
    } else if (apiResponse.statusCode === 200) {
      console.log('   ✅ Endpoint de API funcionando (200 = Autorizado)');
    } else {
      console.log('   ❌ Error en el endpoint de la API');
    }

    // Probar la página principal del dashboard
    console.log('\n3. Probando página principal del dashboard...');
    const dashboardResponse = await makeRequest('/dashboard');
    console.log(`   Status: ${dashboardResponse.statusCode}`);
    if (dashboardResponse.statusCode === 200) {
      console.log('   ✅ Dashboard accesible');
    } else {
      console.log('   ❌ Error en el dashboard');
    }

    console.log('\n🎉 Pruebas completadas');
    console.log('\n📋 Resumen:');
    console.log('   - El módulo "Diseño de Facturas" está disponible en:');
    console.log('     http://localhost:3000/dashboard/factura-diseno');
    console.log('   - El endpoint de la API está disponible en:');
    console.log('     http://localhost:3000/api/invoice-design');
    console.log('\n🔑 Para acceder al módulo:');
    console.log('   1. Inicia sesión en la aplicación');
    console.log('   2. Navega al menú lateral');
    console.log('   3. Busca "Diseño de Facturas" en la lista');
    console.log('   4. Haz clic para acceder al módulo');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

testModuleAccess();
