#!/usr/bin/env node

/**
 * Script para crear administrador inicial en Railway
 * Uso: node scripts/create-admin-railway.js
 * 
 * Variables de entorno requeridas:
 * - INITIAL_ADMIN_EMAIL
 * - INITIAL_ADMIN_PASSWORD
 * - INITIAL_ADMIN_NAME (opcional)
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Administrador Inicial";

  if (!email || !password) {
    console.error("❌ Error: Faltan variables de entorno requeridas");
    console.error("   Configura en Railway:");
    console.error("   - INITIAL_ADMIN_EMAIL=admin@tu-dominio.com");
    console.error("   - INITIAL_ADMIN_PASSWORD=tu_password_seguro");
    console.error("   - INITIAL_ADMIN_NAME=Administrador (opcional)");
    process.exit(1);
  }

  try {
    console.log("🔐 Verificando si ya existe un administrador...");
    
    const existing = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    if (existing) {
      console.log(`✅ Ya existe un usuario con email ${email}:`, existing);
      return;
    }

    console.log("🔐 Creando administrador inicial...");
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

    console.log("✅ Administrador creado exitosamente:", user);
    console.log("🎉 Ya puedes iniciar sesión con las credenciales configuradas");

  } catch (error) {
    console.error("❌ Error al crear administrador:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
