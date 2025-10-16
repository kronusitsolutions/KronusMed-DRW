const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInvoiceDesign() {
  try {
    console.log('🧪 Probando módulo de Diseño de Facturas...\n');

    // Verificar si la tabla existe
    try {
      const designs = await prisma.invoiceDesign.findMany();
      console.log('✅ Tabla InvoiceDesign existe');
      console.log(`📊 Configuraciones encontradas: ${designs.length}`);
      
      if (designs.length > 0) {
        console.log('📋 Configuraciones existentes:');
        designs.forEach((design, index) => {
          console.log(`  ${index + 1}. ${design.name} (${design.isActive ? 'Activa' : 'Inactiva'})`);
        });
      }
    } catch (error) {
      console.log('❌ Error al acceder a la tabla InvoiceDesign:');
      console.log('   Esto es normal si la migración no se ha ejecutado aún');
      console.log('   Error:', error.message);
    }

    // Crear una configuración de prueba
    try {
      const testDesign = await prisma.invoiceDesign.create({
        data: {
          name: "Configuración de Prueba",
          logoPosition: "CENTER",
          businessName: "Clínica de Prueba",
          address: "Calle 123, Ciudad",
          phone: "123-456-7890",
          taxId: "NIT123456789",
          customMessage: "Gracias por su preferencia",
          format: "80MM",
          isActive: true
        }
      });
      
      console.log('\n✅ Configuración de prueba creada:');
      console.log(`   ID: ${testDesign.id}`);
      console.log(`   Nombre: ${testDesign.name}`);
      console.log(`   Formato: ${testDesign.format}`);
      
      // Actualizar la configuración
      const updatedDesign = await prisma.invoiceDesign.update({
        where: { id: testDesign.id },
        data: { 
          businessName: "Clínica Actualizada",
          format: "LETTER"
        }
      });
      
      console.log('\n✅ Configuración actualizada:');
      console.log(`   Nombre comercial: ${updatedDesign.businessName}`);
      console.log(`   Formato: ${updatedDesign.format}`);
      
      // Eliminar la configuración de prueba
      await prisma.invoiceDesign.delete({
        where: { id: testDesign.id }
      });
      
      console.log('\n✅ Configuración de prueba eliminada');
      
    } catch (error) {
      console.log('\n❌ Error en operaciones CRUD:');
      console.log('   Error:', error.message);
    }

    console.log('\n🎉 Prueba completada');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceDesign();
