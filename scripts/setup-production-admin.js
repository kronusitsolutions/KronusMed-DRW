#!/usr/bin/env node

/**
 * Script seguro para configurar admin en producción
 * Solo se ejecuta si las variables de entorno están configuradas
 * Uso: node scripts/setup-production-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function setupProductionAdmin() {
  // Solo ejecutar en producción y si las variables están configuradas
  if (process.env.NODE_ENV !== "production") {
    console.log("⚠️  Este script solo debe ejecutarse en producción");
    process.exit(0);
  }

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Administrador";

  if (!email || !password) {
    console.log("⚠️  Variables de entorno no configuradas:");
    console.log("   - INITIAL_ADMIN_EMAIL");
    console.log("   - INITIAL_ADMIN_PASSWORD");
    console.log("   Configura estas variables en Railway y redespliega");
    process.exit(0);
  }

  try {
    console.log("🔍 Verificando si ya existe el administrador...");
    
    const existing = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    if (existing) {
      console.log(`✅ Administrador ya existe: ${email}`);
      console.log("   Puedes iniciar sesión con las credenciales configuradas");
      return;
    }

    console.log("🔐 Creando administrador de producción...");
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        role: "ADMIN",
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    console.log("✅ Administrador creado exitosamente");
    console.log(`   Email: ${email}`);
    console.log("   ⚠️  IMPORTANTE: Cambia la contraseña después del primer login");

  } catch (error) {
    console.error("❌ Error al crear administrador:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupProductionAdmin();
