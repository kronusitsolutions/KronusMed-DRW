const fs = require('fs');
const path = require('path');

// Datos de prueba
const testInvoice = {
  invoiceNumber: 'INV-00000003',
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

const design = {
  businessName: 'Sistema de Clínica Médica',
  address: 'Av. Principal 123, Santo Domingo',
  phone: '(809) 555-0123',
  taxId: '123456789',
  logoPosition: 'LEFT',
  format: '80MM'
};

// Generar HTML con ajustes optimizados
const generateOptimizedHTML = (invoice, design) => {
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
    .services-vertical {
      margin: 8px 0;
    }
    .service-block {
      border: 1px solid #ddd;
      margin-bottom: 3px;
      padding: 3px;
      background: #f9f9f9;
      border-radius: 2px;
    }
    .service-title {
      font-weight: bold;
      font-size: 10px;
      color: #333;
      margin-bottom: 2px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 1px;
    }
    .service-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      font-size: 8px;
      color: #666;
    }
    .detail {
      margin-right: 6px;
    }
    .service-totals {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      font-weight: bold;
      border-top: 1px solid #ccc;
      padding-top: 2px;
      margin-top: 2px;
    }
    .total-label {
      color: #333;
    }
    .total-value {
      color: #dc2626;
      font-weight: bold;
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
      <h1 class="business-name">${design.businessName}</h1>
      <div class="business-info">
        <div>${design.address}</div>
        <div>Tel: ${design.phone}</div>
        <div>RNC: ${design.taxId}</div>
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
    
    <!-- Diseño vertical optimizado -->
    <div class="services-vertical">
      ${(invoice.items || []).map((item) => {
        const basePrice = item.unitPrice || ((invoice.amount || invoice.totalAmount) / (invoice.services?.length || 1))
        const totalPrice = item.totalPrice || basePrice
        
        if (invoice.patient?.insurance || invoice.insuranceCalculation) {
          const insuranceData = invoice.insuranceCalculation || {}
          const itemData = insuranceData.items?.find((i) => i.serviceId === item.service?.id) || {}
          const coveragePercent = itemData.coveragePercent || 0
          const insuranceCovers = itemData.insuranceCovers || 0
          const patientPays = itemData.patientPays || totalPrice
          
          return `
            <div class="service-block">
              <div class="service-title">${item.service?.name || item}</div>
              <div class="service-details">
                <span class="detail">Cant: ${item.quantity || 1}</span>
                <span class="detail">Precio: $${basePrice.toFixed(0)}</span>
                <span class="detail">Cob: ${coveragePercent.toFixed(0)}%</span>
              </div>
              <div class="service-totals">
                <span class="total-label">Seguro: $${insuranceCovers.toFixed(0)}</span>
                <span class="total-label">Paciente: $${patientPays.toFixed(0)}</span>
              </div>
            </div>
          `
        } else {
          return `
            <div class="service-block">
              <div class="service-title">${item.service?.name || item}</div>
              <div class="service-details">
                <span class="detail">Cant: ${item.quantity || 1}</span>
                <span class="detail">Precio: $${basePrice.toFixed(0)}</span>
              </div>
              <div class="service-totals">
                <span class="total-label">Total:</span>
                <span class="total-value">$${totalPrice.toFixed(0)}</span>
              </div>
            </div>
          `
        }
      }).join('')}
    </div>
    
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
const htmlContent = generateOptimizedHTML(testInvoice, design);
const outputPath = path.join(__dirname, 'test-optimized-final-80mm.html');

fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Archivo de prueba optimizado generado:');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('');
console.log('🎯 AJUSTES REALIZADOS:');
console.log('• Tamaño de tabla reducido:');
console.log('  - Padding: 4px → 3px');
console.log('  - Margin-bottom: 4px → 3px');
console.log('  - Margin-right entre detalles: 8px → 6px');
console.log('');
console.log('• Tamaño de letra aumentado:');
console.log('  - Título del servicio: 9px → 10px');
console.log('  - Detalles del servicio: 7px → 8px');
console.log('  - Totales: 8px → 9px');
console.log('');
console.log('• Resultado:');
console.log('  - Tabla más compacta');
console.log('  - Texto más legible');
console.log('  - Mejor balance entre espacio y legibilidad');
