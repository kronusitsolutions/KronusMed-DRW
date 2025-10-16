#!/usr/bin/env node

/**
 * Script para verificar la configuración del build
 * Verifica que los archivos necesarios existen y están configurados correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para build...\n');

// Verificar archivos críticos
const criticalFiles = [
  'next.config.mjs',
  'package.json',
  'tsconfig.json',
  'app/api/static/[...path]/route.ts',
  'app/api/upload-simple/route.ts'
];

console.log('📄 Verificando archivos críticos:');
let allFilesExist = true;

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NO EXISTE`);
    allFilesExist = false;
  }
});

console.log('');

// Verificar configuración de Next.js
console.log('🔧 Verificando next.config.mjs:');
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (configContent.includes('rewrites')) {
    console.log('✅ Rewrites configurado');
  } else {
    console.log('❌ Rewrites NO configurado');
  }
  
  if (configContent.includes('/uploads/:path*')) {
    console.log('✅ Rewrite para uploads configurado');
  } else {
    console.log('❌ Rewrite para uploads NO configurado');
  }
  
  if (configContent.includes('output: \'standalone\'')) {
    console.log('✅ Output standalone configurado');
  } else {
    console.log('❌ Output standalone NO configurado');
  }
} else {
  console.log('❌ next.config.mjs no existe');
}

console.log('');

// Verificar endpoint estático
console.log('🔧 Verificando endpoint estático:');
const staticEndpointPath = path.join(process.cwd(), 'app', 'api', 'static', '[...path]', 'route.ts');
if (fs.existsSync(staticEndpointPath)) {
  const endpointContent = fs.readFileSync(staticEndpointPath, 'utf8');
  
  if (endpointContent.includes('export async function GET')) {
    console.log('✅ Función GET exportada');
  } else {
    console.log('❌ Función GET NO exportada');
  }
  
  if (endpointContent.includes('Promise<{ path: string[] }>')) {
    console.log('✅ Tipos de parámetros correctos');
  } else {
    console.log('❌ Tipos de parámetros incorrectos');
  }
  
  if (endpointContent.includes('"public"') && endpointContent.includes('"uploads"')) {
    console.log('✅ Ruta de archivos configurada');
  } else {
    console.log('❌ Ruta de archivos NO configurada');
  }
} else {
  console.log('❌ Endpoint estático no existe');
}

console.log('');

// Verificar package.json
console.log('📦 Verificando package.json:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageContent.scripts && packageContent.scripts.build) {
    console.log('✅ Script de build configurado');
  } else {
    console.log('❌ Script de build NO configurado');
  }
  
  if (packageContent.dependencies && packageContent.dependencies.next) {
    console.log(`✅ Next.js instalado (${packageContent.dependencies.next})`);
  } else {
    console.log('❌ Next.js NO instalado');
  }
} else {
  console.log('❌ package.json no existe');
}

console.log('');

// Resumen
if (allFilesExist) {
  console.log('🎉 Todos los archivos críticos existen');
  console.log('✅ La configuración está lista para el build');
  console.log('\n📋 Para construir la aplicación:');
  console.log('1. Asegúrate de tener Node.js 18+ instalado');
  console.log('2. Ejecuta: npm run build');
  console.log('3. Si hay errores, verifica los logs arriba');
} else {
  console.log('❌ Faltan archivos críticos');
  console.log('⚠️  Revisa los errores arriba antes de hacer build');
}
