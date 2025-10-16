const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function createAdmin() {
  try {
    console.log('🔍 Verificando si ya existe el administrador...');
    
    const email = "admin@kronusmed.app";
    const password = "tu_password_seguro_2024";
    const name = "Administrador Principal";
    
    const existing = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    if (existing) {
      console.log(`✅ Administrador ya existe: ${email}`);
      return;
    }

    console.log('🔐 Creando administrador...');
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

    console.log('✅ Administrador creado exitosamente');
    console.log(`   Email: ${email}`);
    console.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
