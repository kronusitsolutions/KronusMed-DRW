const fs = require('fs');
const path = require('path');

// Datos de prueba para factura con seguros
const testInvoice = {
  id: 'test-80mm-001',
  invoiceNumber: 'FAC-2024-001',
  patient: {
    name: 'Juan Pérez',
    insurance: {
      name: 'Seguro Médico ABC',
      id: 'ins-001'
    }
  },
  status: 'PENDING',
  createdAt: new Date(),
  totalAmount: 1230.00,
  insuranceCalculation: {
    totalBaseAmount: 1230.00,
    totalInsuranceCovers: 500.00,
    totalPatientPays: 730.00,
    items: [
      {
        serviceId: 'svc-001',
        serviceName: 'Consulta General',
        basePrice: 1230.00,
        coveragePercent: 40.7,
        insuranceCovers: 500.00,
        patientPays: 730.00
      }
    ]
  },
  items: [
    {
      service: { name: 'Consulta General', id: 'svc-001' },
      quantity: 1,
      unitPrice: 1230.00,
      totalPrice: 1230.00
    }
  ]
};

// Generar HTML de prueba para 80mm
const generateTestHTML = (invoice) => {
  const design = { format: '80MM' };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Prueba Impresión 80mm - ${invoice.invoiceNumber}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 0;
      background: white;
    }
    .invoice-container {
      max-width: 80mm;
      margin: 0 auto;
      padding: 5mm;
      font-size: 12px;
      background: white;
    }
    .header { 
      text-align: center; 
      margin-bottom: 20px; 
    }
    .business-name {
      font-weight: bold;
      font-size: 16px;
      margin: 0;
    }
    .business-info {
      text-align: center;
      margin-bottom: 15px;
      font-size: 11px;
      color: #666;
    }
    .separator {
      border-top: 1px solid #ccc;
      margin: 15px 0;
    }
    .invoice-info { 
      margin-bottom: 15px; 
      font-size: 12px;
    }
    .invoice-info p {
      margin: 5px 0;
    }
    .services-list {
      margin: 15px 0;
    }
    .service-item {
      margin-bottom: 8px;
      padding: 6px 0;
      border-bottom: 1px solid #eee;
    }
    .service-item:last-child {
      border-bottom: none;
    }
    .service-name {
      font-weight: bold;
      font-size: 13px;
    }
    .coverage-info {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }
    .total { 
      text-align: right; 
      font-weight: bold; 
      font-size: 14px; 
      margin-top: 15px; 
      border-top: 2px solid #333;
      padding-top: 10px;
    }
    .status { 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-size: 10px;
      display: inline-block;
    }
    .status-pending { background-color: #fff3cd; color: #856404; }
    .custom-message {
      text-align: center;
      margin-top: 20px;
      font-style: italic;
      font-size: 10px;
      color: #666;
    }
    @media print {
      body { margin: 0; }
      .invoice-container { 
        max-width: none;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1 class="business-name">Sistema de Clínica Médica</h1>
      <div class="business-info">
        <div>Av. Principal 123, Santo Domingo</div>
        <div>Tel: (809) 555-0123</div>
        <div>RNC: 123456789</div>
      </div>
    </div>
    
    <div class="separator"></div>
    
    <div class="invoice-info">
      <p><strong>FACTURA:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>FECHA:</strong> ${new Date(invoice.createdAt).toLocaleDateString('es-ES')}</p>
      <p><strong>PACIENTE:</strong> ${invoice.patient.name}</p>
      <p><strong>ESTADO:</strong> <span class="status status-pending">Pendiente</span></p>
    </div>
    
    <div class="separator"></div>
    
    <!-- Diseño compacto para 80mm con seguros -->
    <div class="services-list">
      ${invoice.items.map((item) => {
        const basePrice = item.unitPrice;
        const insuranceData = invoice.insuranceCalculation;
        const itemData = insuranceData.items.find(i => i.serviceId === item.service.id) || {};
        const coveragePercent = itemData.coveragePercent || 0;
        const insuranceCovers = itemData.insuranceCovers || 0;
        const patientPays = itemData.patientPays || basePrice;
        
        return `
          <div class="service-item">
            <div class="service-name">${item.service.name}</div>
            <div class="coverage-info">Cant: ${item.quantity} | Precio: $${basePrice.toFixed(2)} | Cobertura: ${coveragePercent.toFixed(1)}%</div>
            <div class="coverage-info">Seguro: $${insuranceCovers.toFixed(2)} | Paciente: $${patientPays.toFixed(2)}</div>
          </div>
        `;
      }).join('')}
    </div>
    
    <div class="total">
      <p><strong>Total Base: $${invoice.insuranceCalculation.totalBaseAmount.toFixed(2)}</strong></p>
      <p>Descuento Total: -$${invoice.insuranceCalculation.totalInsuranceCovers.toFixed(2)}</p>
      <p>Seguro Cubre: $${invoice.insuranceCalculation.totalInsuranceCovers.toFixed(2)}</p>
      <p><strong>TOTAL A PAGAR: $${invoice.insuranceCalculation.totalPatientPays.toFixed(2)}</strong></p>
      <p style="color: #22c55e;">Ahorro: $${(invoice.insuranceCalculation.totalBaseAmount - invoice.insuranceCalculation.totalPatientPays).toFixed(2)}</p>
    </div>
    
    <div class="custom-message">
      ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
    </div>
  </div>
</body>
</html>
  `;
};

// Generar archivo de prueba
const testHTML = generateTestHTML(testInvoice);
const outputPath = path.join(__dirname, 'test-80mm-print.html');

fs.writeFileSync(outputPath, testHTML);

console.log('✅ Archivo de prueba generado:', outputPath);
console.log('📄 Abre el archivo en tu navegador para probar la impresión en 80mm');
console.log('🔍 Verifica que:');
console.log('   - El texto sea legible (no muy pequeño)');
console.log('   - La información de seguros se muestre correctamente');
console.log('   - Todo el contenido quepa en 80mm de ancho');
console.log('   - Los precios estén alineados correctamente');
