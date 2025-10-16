#!/usr/bin/env node

/**
 * Script de Actualización de Dependencias
 * Actualiza dependencias de forma segura y verifica compatibilidad
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`📦 ${title}`, 'bold');
  console.log('='.repeat(60));
}

// Verificar vulnerabilidades actuales
function checkCurrentVulnerabilities() {
  logSection('VERIFICACIÓN DE VULNERABILIDADES ACTUALES');
  
  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(auditOutput);
    
    const vulnerabilities = auditData.metadata.vulnerabilities;
    const totalVulnerabilities = vulnerabilities.low + vulnerabilities.moderate + vulnerabilities.high + vulnerabilities.critical;
    
    log(`📊 Vulnerabilidades encontradas:`, 'blue');
    log(`   🔴 Críticas: ${vulnerabilities.critical}`, 'red');
    log(`   🟠 Altas: ${vulnerabilities.high}`, 'yellow');
    log(`   🟡 Moderadas: ${vulnerabilities.moderate}`, 'yellow');
    log(`   🟢 Bajas: ${vulnerabilities.low}`, 'green');
    
    return totalVulnerabilities;
  } catch (error) {
    log('❌ Error al verificar vulnerabilidades', 'red');
    return 0;
  }
}

// Actualizar dependencias específicas
function updateSpecificDependencies() {
  logSection('ACTUALIZACIÓN DE DEPENDENCIAS ESPECÍFICAS');
  
  const criticalUpdates = [
    'exceljs@latest',
    'next@latest',
    'react@latest',
    'react-dom@latest',
    '@prisma/client@latest',
    'prisma@latest'
  ];
  
  criticalUpdates.forEach(dep => {
    try {
      log(`🔄 Actualizando ${dep}...`, 'blue');
      execSync(`npm install ${dep}`, { stdio: 'inherit' });
      log(`✅ ${dep} actualizado`, 'green');
    } catch (error) {
      log(`❌ Error al actualizar ${dep}: ${error.message}`, 'red');
    }
  });
}

// Verificar compatibilidad de versiones
function checkVersionCompatibility() {
  logSection('VERIFICACIÓN DE COMPATIBILIDAD');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Verificar versiones críticas
    const criticalChecks = [
      {
        name: 'Node.js',
        current: process.version,
        required: '>=18.18.0',
        check: () => {
          const version = process.version.replace('v', '');
          const [major, minor] = version.split('.').map(Number);
          return major >= 18 && minor >= 18;
        }
      },
      {
        name: 'Next.js',
        current: packageJson.dependencies.next,
        required: '>=15.0.0',
        check: () => {
          const version = packageJson.dependencies.next.replace('^', '');
          const [major] = version.split('.').map(Number);
          return major >= 15;
        }
      },
      {
        name: 'React',
        current: packageJson.dependencies.react,
        required: '>=18.0.0',
        check: () => {
          const version = packageJson.dependencies.react.replace('^', '');
          const [major] = version.split('.').map(Number);
          return major >= 18;
        }
      }
    ];
    
    criticalChecks.forEach(check => {
      if (check.check()) {
        log(`✅ ${check.name}: ${check.current} (requerido: ${check.required})`, 'green');
      } else {
        log(`❌ ${check.name}: ${check.current} (requerido: ${check.required})`, 'red');
      }
    });
    
  } catch (error) {
    log(`❌ Error al verificar compatibilidad: ${error.message}`, 'red');
  }
}

// Generar reporte de actualización
function generateUpdateReport(initialVulnerabilities, finalVulnerabilities) {
  logSection('REPORTE DE ACTUALIZACIÓN');
  
  const vulnerabilitiesFixed = initialVulnerabilities - finalVulnerabilities;
  
  log(`📊 Vulnerabilidades iniciales: ${initialVulnerabilities}`, 'blue');
  log(`📊 Vulnerabilidades finales: ${finalVulnerabilities}`, 'blue');
  log(`✅ Vulnerabilidades corregidas: ${vulnerabilitiesFixed}`, 'green');
  
  if (vulnerabilitiesFixed > 0) {
    log('🎉 ¡Actualización exitosa!', 'green');
  } else if (finalVulnerabilities === 0) {
    log('🎉 ¡No hay vulnerabilidades!', 'green');
  } else {
    log('⚠️  Algunas vulnerabilidades persisten', 'yellow');
  }
}

// Función principal
function main() {
  log('📦 INICIANDO ACTUALIZACIÓN DE DEPENDENCIAS', 'bold');
  log('Fecha: ' + new Date().toISOString(), 'blue');
  
  // Verificar vulnerabilidades iniciales
  const initialVulnerabilities = checkCurrentVulnerabilities();
  
  // Actualizar dependencias
  updateSpecificDependencies();
  
  // Verificar compatibilidad
  checkVersionCompatibility();
  
  // Verificar vulnerabilidades finales
  const finalVulnerabilities = checkCurrentVulnerabilities();
  
  // Generar reporte
  generateUpdateReport(initialVulnerabilities, finalVulnerabilities);
}

// Ejecutar actualización
if (require.main === module) {
  main();
}

module.exports = {
  checkCurrentVulnerabilities,
  updateSpecificDependencies,
  checkVersionCompatibility,
  generateUpdateReport
};
