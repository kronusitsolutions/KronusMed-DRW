#!/usr/bin/env node

/**
 * Script para probar las migraciones en Railway
 * Uso: node scripts/test-migrations.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testMigrations() {
  try {
    console.log("🔍 Probando conexión a la base de datos...");
    
    // Probar conexión básica
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Conexión a base de datos exitosa");

    // Verificar si las tablas existen
    console.log("🔍 Verificando tablas existentes...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log("📊 Tablas encontradas:", tables.length);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    if (tables.length === 0) {
      console.log("❌ No se encontraron tablas. Las migraciones no se ejecutaron.");
      process.exit(1);
    } else {
      console.log("✅ Tablas encontradas correctamente");
    }

    // Probar una consulta simple
    console.log("🔍 Probando consulta a usuarios...");
    const userCount = await prisma.user.count();
    console.log(`✅ Usuarios en la base de datos: ${userCount}`);

  } catch (error) {
    console.error("❌ Error durante la prueba:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMigrations();
