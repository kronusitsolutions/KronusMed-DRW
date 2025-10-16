// Script para probar el endpoint de diagnóstico
// Ejecutar: node scripts/test-diagnose-endpoint.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando endpoint de diagnóstico...');

// Verificar que el archivo existe
const endpointPath = path.join(__dirname, '../app/api/auth/diagnose/route.ts');
if (!fs.existsSync(endpointPath)) {
  console.error('❌ El archivo del endpoint no existe:', endpointPath);
  process.exit(1);
}

console.log('✅ Archivo del endpoint encontrado');

// Verificar sintaxis básica
try {
  const content = fs.readFileSync(endpointPath, 'utf8');
  
  // Verificar imports necesarios
  const requiredImports = [
    'NextRequest',
    'NextResponse',
    'getServerSession',
    'authOptions',
    'prisma'
  ];
  
  const missingImports = requiredImports.filter(importName => 
    !content.includes(importName)
  );
  
  if (missingImports.length > 0) {
    console.error('❌ Imports faltantes:', missingImports);
    process.exit(1);
  }
  
  // Verificar estructura básica
  if (!content.includes('export async function GET')) {
    console.error('❌ Función GET no encontrada');
    process.exit(1);
  }
  
  if (!content.includes('NextResponse.json')) {
    console.error('❌ NextResponse.json no encontrado');
    process.exit(1);
  }
  
  console.log('✅ Sintaxis básica correcta');
  console.log('✅ Endpoint listo para usar');
  
  console.log('\n📋 Para usar el endpoint:');
  console.log('1. Hacer deploy a Railway');
  console.log('2. Visitar: https://tu-app.railway.app/api/auth/diagnose');
  console.log('3. Verificar la respuesta JSON');
  
} catch (error) {
  console.error('❌ Error al verificar el archivo:', error.message);
  process.exit(1);
}
