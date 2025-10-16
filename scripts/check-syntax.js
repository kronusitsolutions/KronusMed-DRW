const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE SINTAXIS - SERVICIOS');
console.log('=====================================');
console.log('');

// Leer el archivo de servicios
const servicesFile = path.join(__dirname, '..', 'app', 'dashboard', 'services', 'page.tsx');
const content = fs.readFileSync(servicesFile, 'utf8');

console.log('📁 Archivo verificado: app/dashboard/services/page.tsx');
console.log('');

// Verificar elementos JSX básicos
const jsxElements = {
  'div': (content.match(/<div/g) || []).length,
  'div cerrados': (content.match(/<\/div>/g) || []).length,
  'Dialog': (content.match(/<Dialog/g) || []).length,
  'Dialog cerrados': (content.match(/<\/Dialog>/g) || []).length,
  'Button': (content.match(/<Button/g) || []).length,
  'Button cerrados': (content.match(/<\/Button>/g) || []).length,
  'return (': (content.match(/return \(/g) || []).length,
  'return statements': (content.match(/return /g) || []).length
};

console.log('📊 ELEMENTOS JSX:');
Object.entries(jsxElements).forEach(([element, count]) => {
  console.log(`  • ${element}: ${count}`);
});

console.log('');

// Verificar balance de elementos
const divBalance = jsxElements['div'] - jsxElements['div cerrados'];
const dialogBalance = jsxElements['Dialog'] - jsxElements['Dialog cerrados'];
const buttonBalance = jsxElements['Button'] - jsxElements['Button cerrados'];

console.log('⚖️ BALANCE DE ELEMENTOS:');
console.log(`  • div: ${divBalance === 0 ? '✅ Balanceado' : `❌ Desbalanceado (${divBalance})`}`);
console.log(`  • Dialog: ${dialogBalance === 0 ? '✅ Balanceado' : `❌ Desbalanceado (${dialogBalance})`}`);
console.log(`  • Button: ${buttonBalance === 0 ? '✅ Balanceado' : `❌ Desbalanceado (${buttonBalance})`}`);

console.log('');

// Verificar estructura de return
const returnMatches = content.match(/return\s*\([\s\S]*?\)/g);
console.log('🔄 ESTRUCTURA DE RETURN:');
console.log(`  • Return statements encontrados: ${returnMatches ? returnMatches.length : 0}`);

if (returnMatches) {
  returnMatches.forEach((match, index) => {
    const lines = match.split('\n');
    console.log(`  • Return ${index + 1}: ${lines.length} líneas`);
  });
}

console.log('');

// Verificar imports
const imports = content.match(/import.*from/g);
console.log('📦 IMPORTS:');
console.log(`  • Imports encontrados: ${imports ? imports.length : 0}`);

console.log('');

// Verificar funciones
const functions = content.match(/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g);
console.log('🔧 FUNCIONES:');
console.log(`  • Funciones arrow encontradas: ${functions ? functions.length : 0}`);

console.log('');

// Verificar estado
const useState = content.match(/useState/g);
const useEffect = content.match(/useEffect/g);
console.log('🎯 HOOKS:');
console.log(`  • useState: ${useState ? useState.length : 0}`);
console.log(`  • useEffect: ${useEffect ? useEffect.length : 0}`);

console.log('');

// Verificar si hay errores de sintaxis obvios
const syntaxIssues = [];
if (content.includes('<>') && !content.includes('</>')) {
  syntaxIssues.push('Fragment no cerrado');
}
if (content.includes('<div') && content.split('<div').length !== content.split('</div>').length) {
  syntaxIssues.push('Div no balanceado');
}
if (content.includes('return (') && !content.includes(')')) {
  syntaxIssues.push('Return statement no cerrado');
}

console.log('🚨 PROBLEMAS DE SINTAXIS:');
if (syntaxIssues.length === 0) {
  console.log('  ✅ No se encontraron problemas obvios de sintaxis');
} else {
  syntaxIssues.forEach(issue => {
    console.log(`  ❌ ${issue}`);
  });
}

console.log('');
console.log('✅ VERIFICACIÓN COMPLETADA');
console.log('');
console.log('💡 NOTA: Para verificar completamente la sintaxis, ejecuta:');
console.log('   npx tsc --noEmit --jsx preserve app/dashboard/services/page.tsx');
