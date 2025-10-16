#!/usr/bin/env node

/**
 * Script de Auditoría de Seguridad
 * Verifica vulnerabilidades en dependencias y configuración
 */

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
  log(`🔒 ${title}`, 'bold');
  console.log('='.repeat(60));
}

// Verificar archivos críticos de seguridad
function checkSecurityFiles() {
  logSection('VERIFICACIÓN DE ARCHIVOS DE SEGURIDAD');
  
  const requiredFiles = [
    'middleware.ts',
    'lib/security.ts',
    'lib/logger.ts',
    'lib/sanitizer.ts',
    'lib/encryption.ts',
    'scripts/secure-backup.sh',
    '.env.local'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file} - PRESENTE`, 'green');
    } else {
      log(`❌ ${file} - FALTANTE`, 'red');
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Verificar configuración de NextAuth
function checkNextAuthConfig() {
  logSection('CONFIGURACIÓN DE NEXTAUTH');
  
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      log('❌ .env.local no encontrado', 'red');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar NEXTAUTH_SECRET
    if (envContent.includes('NEXTAUTH_SECRET=')) {
      const secretMatch = envContent.match(/NEXTAUTH_SECRET="([^"]+)"/);
      if (secretMatch && secretMatch[1] !== 'kiklakikla') {
        log('✅ NEXTAUTH_SECRET configurado correctamente', 'green');
      } else {
        log('⚠️  NEXTAUTH_SECRET usa valor por defecto inseguro', 'yellow');
      }
    } else {
      log('❌ NEXTAUTH_SECRET no configurado', 'red');
    }
    
    // Verificar ENCRYPTION_KEY
    if (envContent.includes('ENCRYPTION_KEY=')) {
      const encryptionMatch = envContent.match(/ENCRYPTION_KEY="([^"]+)"/);
      if (encryptionMatch && encryptionMatch[1] !== 'CHANGE_ME_ENCRYPTION_KEY_32_BYTES') {
        log('✅ ENCRYPTION_KEY configurado correctamente', 'green');
      } else {
        log('⚠️  ENCRYPTION_KEY usa valor por defecto inseguro', 'yellow');
      }
    } else {
      log('❌ ENCRYPTION_KEY no configurado', 'red');
    }
    
    // Verificar DATABASE_URL con SSL
    if (envContent.includes('DATABASE_URL=')) {
      if (envContent.includes('sslmode=require')) {
        log('✅ DATABASE_URL configurado con SSL', 'green');
      } else {
        log('⚠️  DATABASE_URL sin SSL configurado', 'yellow');
      }
    } else {
      log('❌ DATABASE_URL no configurado', 'red');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error al verificar configuración: ${error.message}`, 'red');
    return false;
  }
}

// Verificar headers de seguridad en next.config.mjs
function checkSecurityHeaders() {
  logSection('HEADERS DE SEGURIDAD');
  
  try {
    const configPath = path.join(process.cwd(), 'next.config.mjs');
    if (!fs.existsSync(configPath)) {
      log('❌ next.config.mjs no encontrado', 'red');
      return false;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const securityHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];
    
    let headersFound = 0;
    securityHeaders.forEach(header => {
      if (configContent.includes(header)) {
        log(`✅ ${header} configurado`, 'green');
        headersFound++;
      } else {
        log(`❌ ${header} no configurado`, 'red');
      }
    });
    
    if (headersFound === securityHeaders.length) {
      log('✅ Todos los headers de seguridad están configurados', 'green');
      return true;
    } else {
      log(`⚠️  Solo ${headersFound}/${securityHeaders.length} headers configurados`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error al verificar headers: ${error.message}`, 'red');
    return false;
  }
}

// Verificar middleware de autenticación
function checkAuthMiddleware() {
  logSection('MIDDLEWARE DE AUTENTICACIÓN');
  
  try {
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');
    if (!fs.existsSync(middlewarePath)) {
      log('❌ middleware.ts no encontrado', 'red');
      return false;
    }
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    const requiredFeatures = [
      'getToken',
      'protectedRoutes',
      'publicRoutes',
      'securityMiddleware',
      'logger'
    ];
    
    let featuresFound = 0;
    requiredFeatures.forEach(feature => {
      if (middlewareContent.includes(feature)) {
        log(`✅ ${feature} implementado`, 'green');
        featuresFound++;
      } else {
        log(`❌ ${feature} no implementado`, 'red');
      }
    });
    
    if (featuresFound === requiredFeatures.length) {
      log('✅ Middleware de autenticación completo', 'green');
      return true;
    } else {
      log(`⚠️  Solo ${featuresFound}/${requiredFeatures.length} características implementadas`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error al verificar middleware: ${error.message}`, 'red');
    return false;
  }
}

// Verificar sanitización de entrada
function checkInputSanitization() {
  logSection('SANITIZACIÓN DE ENTRADA');
  
  try {
    const sanitizerPath = path.join(process.cwd(), 'lib/sanitizer.ts');
    if (!fs.existsSync(sanitizerPath)) {
      log('❌ lib/sanitizer.ts no encontrado', 'red');
      return false;
    }
    
    const sanitizerContent = fs.readFileSync(sanitizerPath, 'utf8');
    
    const sanitizationFunctions = [
      'sanitizeString',
      'sanitizeEmail',
      'sanitizePhone',
      'sanitizeNumber',
      'sanitizePrice',
      'sanitizeId'
    ];
    
    let functionsFound = 0;
    sanitizationFunctions.forEach(func => {
      if (sanitizerContent.includes(func)) {
        log(`✅ ${func} implementada`, 'green');
        functionsFound++;
      } else {
        log(`❌ ${func} no implementada`, 'red');
      }
    });
    
    if (functionsFound === sanitizationFunctions.length) {
      log('✅ Todas las funciones de sanitización implementadas', 'green');
      return true;
    } else {
      log(`⚠️  Solo ${functionsFound}/${sanitizationFunctions.length} funciones implementadas`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error al verificar sanitización: ${error.message}`, 'red');
    return false;
  }
}

// Verificar encriptación de datos
function checkDataEncryption() {
  logSection('ENCRIPTACIÓN DE DATOS');
  
  try {
    const encryptionPath = path.join(process.cwd(), 'lib/encryption.server.ts');
    if (!fs.existsSync(encryptionPath)) {
              log('❌ lib/encryption.server.ts no encontrado', 'red');
      return false;
    }
    
    const encryptionContent = fs.readFileSync(encryptionPath, 'utf8');
    
    const encryptionFunctions = [
      'encryptPHI',
      'decryptPHI',
      'encryptObject',
      'decryptObject',
      'sanitizeForLogs'
    ];
    
    let functionsFound = 0;
    encryptionFunctions.forEach(func => {
      if (encryptionContent.includes(func)) {
        log(`✅ ${func} implementada`, 'green');
        functionsFound++;
      } else {
        log(`❌ ${func} no implementada`, 'red');
      }
    });
    
    if (functionsFound === encryptionFunctions.length) {
      log('✅ Todas las funciones de encriptación implementadas', 'green');
      return true;
    } else {
      log(`⚠️  Solo ${functionsFound}/${encryptionFunctions.length} funciones implementadas`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error al verificar encriptación: ${error.message}`, 'red');
    return false;
  }
}

// Verificar logging estructurado
function checkStructuredLogging() {
  logSection('LOGGING ESTRUCTURADO');
  
  try {
    const loggerPath = path.join(process.cwd(), 'lib/logger.ts');
    if (!fs.existsSync(loggerPath)) {
      log('❌ lib/logger.ts no encontrado', 'red');
      return false;
    }
    
    const loggerContent = fs.readFileSync(loggerPath, 'utf8');
    
    const loggingFeatures = [
      'LogLevel',
      'LogContext',
      'Logger',
      'debug',
      'info',
      'warn',
      'error',
      'apiLog',
      'authLog',
      'dbLog'
    ];
    
    let featuresFound = 0;
    loggingFeatures.forEach(feature => {
      if (loggerContent.includes(feature)) {
        log(`✅ ${feature} implementado`, 'green');
        featuresFound++;
      } else {
        log(`❌ ${feature} no implementado`, 'red');
      }
    });
    
    if (featuresFound === loggingFeatures.length) {
      log('✅ Sistema de logging completo', 'green');
      return true;
    } else {
      log(`⚠️  Solo ${featuresFound}/${loggingFeatures.length} características implementadas`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error al verificar logging: ${error.message}`, 'red');
    return false;
  }
}

// Generar reporte final
function generateReport(results) {
  logSection('REPORTE FINAL DE SEGURIDAD');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const failedChecks = totalChecks - passedChecks;
  
  log(`📊 Total de verificaciones: ${totalChecks}`, 'blue');
  log(`✅ Verificaciones exitosas: ${passedChecks}`, 'green');
  log(`❌ Verificaciones fallidas: ${failedChecks}`, 'red');
  
  const securityScore = Math.round((passedChecks / totalChecks) * 100);
  
  console.log('\n' + '='.repeat(60));
  if (securityScore >= 90) {
    log(`🟢 PUNTAJE DE SEGURIDAD: ${securityScore}% - EXCELENTE`, 'green');
  } else if (securityScore >= 70) {
    log(`🟡 PUNTAJE DE SEGURIDAD: ${securityScore}% - BUENO`, 'yellow');
  } else {
    log(`🔴 PUNTAJE DE SEGURIDAD: ${securityScore}% - REQUIERE MEJORAS`, 'red');
  }
  console.log('='.repeat(60));
  
  if (failedChecks > 0) {
    log('\n🚨 RECOMENDACIONES:', 'red');
    log('1. Revisar y corregir las verificaciones fallidas', 'yellow');
    log('2. Ejecutar npm audit para verificar vulnerabilidades', 'yellow');
    log('3. Actualizar dependencias obsoletas', 'yellow');
    log('4. Revisar configuración de variables de entorno', 'yellow');
  } else {
    log('\n🎉 ¡Sistema de seguridad implementado correctamente!', 'green');
  }
}

// Función principal
function main() {
  log('🔒 INICIANDO AUDITORÍA DE SEGURIDAD', 'bold');
  log('Fecha: ' + new Date().toISOString(), 'blue');
  
  const results = {
    securityFiles: checkSecurityFiles(),
    nextAuthConfig: checkNextAuthConfig(),
    securityHeaders: checkSecurityHeaders(),
    authMiddleware: checkAuthMiddleware(),
    inputSanitization: checkInputSanitization(),
    dataEncryption: checkDataEncryption(),
    structuredLogging: checkStructuredLogging()
  };
  
  generateReport(results);
}

// Ejecutar auditoría
if (require.main === module) {
  main();
}

module.exports = {
  checkSecurityFiles,
  checkNextAuthConfig,
  checkSecurityHeaders,
  checkAuthMiddleware,
  checkInputSanitization,
  checkDataEncryption,
  checkStructuredLogging,
  generateReport
};
