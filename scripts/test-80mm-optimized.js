const fs = require('fs');
const path = require('path');

// Datos de prueba para factura con seguros
const testInvoice = {
  invoiceNumber: 'INV-00000002',
  createdAt: new Date(),
  patient: {
    name: 'Marcos Rafael Polanco Aracena',
    insurance: true
  },
  status: 'PAID',
  insuranceCalculation: {
    totalBaseAmount: 1000.00,
    totalInsuranceCovers: 500.00,
    totalPatientPays: 500.00,
    items: [
      {
        serviceId: '1',
        serviceName: 'Consulta General',
        basePrice: 1000.00,
        coveragePercent: 50.0,
        insuranceCovers: 500.00,
        patientPays: 500.00
      }
    ]
  },
  items: [
    {
      service: { id: '1', name: 'aaa' },
      quantity: 1,
      unitPrice: 1000.00,
      totalPrice: 1000.00
    }
  ]
};

// Generar HTML de prueba con el formato optimizado
const generateOptimizedTestHTML = (invoice) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Factura ${invoice.invoiceNumber}</title>
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
      padding: 2mm;
      font-size: 10px;
      background: white;
    }
    .header { 
      text-align: center; 
      margin-bottom: 10px; 
    }
    .business-name {
      font-weight: bold;
      font-size: 14px;
      margin: 0;
    }
    .business-info {
      text-align: center;
      margin-bottom: 8px;
      font-size: 9px;
      color: #666;
    }
    .separator {
      border-top: 1px solid #ccc;
      margin: 8px 0;
    }
    .invoice-info { 
      margin-bottom: 8px; 
      font-size: 10px;
    }
    .invoice-info p {
      margin: 2px 0;
    }
    .services-table-compact {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9px;
      table-layout: fixed;
    }
    .services-table-compact th,
    .services-table-compact td {
      border: 1px solid #ccc;
      padding: 2px 1px;
      text-align: center;
      font-size: 8px;
      line-height: 1.1;
    }
    .services-table-compact th {
      background-color: #f0f0f0;
      font-weight: bold;
      font-size: 8px;
    }
    .col-service { width: 30%; text-align: left; padding-left: 2px; }
    .col-qty { width: 10%; }
    .col-price { width: 20%; }
    .col-coverage { width: 15%; }
    .col-insurance { width: 25%; }
    .patient-row {
      background-color: #f9f9f9;
      font-weight: bold;
    }
    .patient-label {
      text-align: right;
      font-size: 8px;
      color: #333;
    }
    .patient-amount {
      color: #dc2626;
      font-weight: bold;
      font-size: 9px;
    }
    .total { 
      text-align: right; 
      font-weight: bold; 
      font-size: 12px; 
      margin-top: 10px; 
      border-top: 2px solid #333;
      padding-top: 8px;
    }
    .custom-message {
      text-align: center;
      margin-top: 15px;
      font-style: italic;
      font-size: 8px;
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
      <p><strong>ESTADO:</strong> <span style="color: #22c55e; font-weight: bold;">Pagado</span></p>
    </div>
    
    <div class="separator"></div>
    
    <!-- Tabla optimizada para 80mm -->
    <table class="services-table-compact">
      <thead>
        <tr>
          <th class="col-service">Servicio</th>
          <th class="col-qty">Cant</th>
          <th class="col-price">P.Unit</th>
          <th class="col-coverage">Cob%</th>
          <th class="col-insurance">Seg Cub</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map((item) => {
          const basePrice = item.unitPrice;
          const insuranceData = invoice.insuranceCalculation;
          const itemData = insuranceData.items.find(i => i.serviceId === item.service.id) || {};
          const coveragePercent = itemData.coveragePercent || 0;
          const insuranceCovers = itemData.insuranceCovers || 0;
          const patientPays = itemData.patientPays || basePrice;
          
          return `
            <tr>
              <td class="col-service">${item.service.name.substring(0, 8)}</td>
              <td class="col-qty">${item.quantity}</td>
              <td class="col-price">$${basePrice.toFixed(0)}</td>
              <td class="col-coverage">${coveragePercent.toFixed(0)}%</td>
              <td class="col-insurance">$${insuranceCovers.toFixed(0)}</td>
            </tr>
            <tr class="patient-row">
              <td colspan="4" class="patient-label">Paciente Paga:</td>
              <td class="patient-amount">$${patientPays.toFixed(0)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    
    <div class="total">
      <p><strong>Total Base: $${invoice.insuranceCalculation.totalBaseAmount.toFixed(0)}</strong></p>
      <p>Descuento Total: -$${invoice.insuranceCalculation.totalInsuranceCovers.toFixed(0)}</p>
      <p>Seguro Cubre: $${invoice.insuranceCalculation.totalInsuranceCovers.toFixed(0)}</p>
      <p><strong>TOTAL A PAGAR: $${invoice.insuranceCalculation.totalPatientPays.toFixed(0)}</strong></p>
      <p style="color: #22c55e;">Ahorro: $${(invoice.insuranceCalculation.totalBaseAmount - invoice.insuranceCalculation.totalPatientPays).toFixed(0)}</p>
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
const htmlContent = generateOptimizedTestHTML(testInvoice);
const outputPath = path.join(__dirname, 'test-80mm-optimized.html');

fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Archivo de prueba optimizado generado exitosamente:');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('🔍 Abre el archivo en tu navegador para ver el formato optimizado');
console.log('📱 Optimizado para terminales de 80mm con máximo aprovechamiento del espacio');
console.log('');
console.log('Mejoras implementadas:');
console.log('• Márgenes reducidos de 5mm a 2mm');
console.log('• Fuentes más pequeñas y compactas');
console.log('• Tabla con columnas optimizadas para 80mm');
console.log('• Espaciado reducido entre elementos');
console.log('• Nombres de servicios truncados a 8 caracteres');
console.log('• Montos sin decimales para ahorrar espacio');
console.log('• Distribución de columnas: 30%-10%-20%-15%-25%');
