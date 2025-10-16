const { PrismaClient } = require('@prisma/client');

// Usar la URL pública directamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:OjJxIMyKKWdmZUzCBCinBLfOsrHgDuhS@ballast.proxy.rlwy.net:57492/railway"
    }
  }
});

async function verifyDatabase() {
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión exitosa');
    
    // Verificar tablas
    console.log('📊 Verificando tablas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📊 Tablas encontradas:', tables.length);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Verificar usuarios
    console.log('👤 Verificando usuarios...');
    const userCount = await prisma.user.count();
    console.log(`✅ Usuarios en la base de datos: ${userCount}`);
    
    if (userCount > 0) {
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { email: true, name: true, role: true }
      });
      console.log('👑 Administrador:', admin);
    }
    
    console.log('🎉 ¡Base de datos configurada correctamente!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
