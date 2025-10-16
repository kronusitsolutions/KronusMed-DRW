#!/usr/bin/env node

/**
 * Script para probar el healthcheck localmente
 */

const http = require('http');

async function testHealthcheck() {
  console.log('🔍 Probando healthcheck...');
  
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/health/liveness',
    method: 'GET',
    timeout: 5000
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📋 Response: ${data}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Healthcheck exitoso');
          resolve(true);
        } else {
          console.log('❌ Healthcheck falló');
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en healthcheck:', error.message);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error('❌ Timeout en healthcheck');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Ejecutar prueba
testHealthcheck()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  });
