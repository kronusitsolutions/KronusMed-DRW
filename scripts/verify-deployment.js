#!/usr/bin/env node

/**
 * Script de verificación automática para Railway
 * Verifica que todo esté configurado correctamente
 */

const { PrismaClient } = require('@prisma/client');

async function verifyDeployment() {
  console.log('🔍 Verificando despliegue de Railway...');
  
  let prisma;
  
  try {
    // SOLUCIÓN: Usar DATABASE_PUBLIC_URL si está disponible
    const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log('❌ No hay URL de base de datos configurada');
      return false;
    }
    
    console.log('🔗 Usando URL:', databaseUrl.substring(0, 30) + '...');
    // 1. Verificar variables de entorno
    console.log('📋 Verificando variables de entorno...');
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'INITIAL_ADMIN_EMAIL',
      'INITIAL_ADMIN_PASSWORD'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log('❌ Variables faltantes:', missingVars.join(', '));
      return false;
    }
    console.log('✅ Variables de entorno configuradas');
    
    // 2. Verificar conexión a base de datos
    console.log('🔗 Verificando conexión a base de datos...');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a base de datos exitosa');
    
    // 3. Verificar tablas
    console.log('📊 Verificando tablas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name NOT LIKE '_prisma_%'
    `;
    
    const expectedTables = ['users', 'patients', 'services', 'invoices'];
    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Tablas faltantes:', missingTables.join(', '));
      return false;
    }
    console.log('✅ Todas las tablas principales existen');
    
    // 4. Verificar admin
    console.log('👤 Verificando administrador...');
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    if (adminCount === 0) {
      console.log('❌ No hay administradores en la base de datos');
      return false;
    }
    console.log(`✅ ${adminCount} administrador(es) encontrado(s)`);
    
    // 5. Verificar ENUMs
    console.log('🏷️  Verificando tipos ENUM...');
    const enums = await prisma.$queryRaw`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' AND typname IN ('UserRole', 'Gender', 'PatientStatus', 'InvoiceStatus')
    `;
    
    if (enums.length < 4) {
      console.log('❌ Tipos ENUM faltantes');
      return false;
    }
    console.log('✅ Todos los tipos ENUM configurados');
    
    console.log('🎉 ¡Despliegue verificado exitosamente!');
    return true;
    
  } catch (error) {
    console.log('❌ Error durante la verificación:', error.message);
    return false;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Ejecutar verificación
verifyDeployment()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  });
