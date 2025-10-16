const fs = require('fs');
const path = require('path');

// Datos de prueba
const testInvoice = {
  invoiceNumber: 'INV-00000004',
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

// Generar HTML con alineación izquierda y fuentes aumentadas
const generateLeftAlignedHTML = (invoice, design) => {
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
      padding: 1mm;
      font-size: 10px;
      background: white;
    }
    .header { 
      text-align: left; /* Cambiado de center a left */
      margin-bottom: 10px; 
    }
    .business-name {
      font-weight: bold;
      font-size: 14px;
      margin: 0;
    }
    .business-info {
      text-align: left; /* Cambiado de center a left */
      margin-bottom: 8px;
      font-size: 10px; /* Aumentado de 9px a 10px */
      color: #666;
    }
    .separator {
      border-top: 1px solid #ccc;
      margin: 8px 0;
    }
    .invoice-info { 
      margin-bottom: 8px; 
      font-size: 11px; /* Aumentado de 10px a 11px */
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
      font-size: 11px; /* Aumentado de 10px a 11px */
      color: #333;
      margin-bottom: 2px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 1px;
    }
    .service-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      font-size: 9px; /* Aumentado de 8px a 9px */
      color: #666;
      flex-wrap: wrap;
    }
    .detail {
      margin-right: 4px;
      white-space: nowrap;
    }
    .service-totals {
      display: flex;
      justify-content: space-between;
      font-size: 10px; /* Aumentado de 9px a 10px */
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
      text-align: left; /* Cambiado de right a left */
      font-weight: bold; 
      font-size: 12px; /* Aumentado de 14px a 12px para 80mm */
      margin-top: 15px; 
      border-top: 2px solid #333;
      padding-top: 10px;
    }
    .custom-message {
      text-align: left; /* Cambiado de center a left */
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
    
    <!-- Diseño vertical con alineación izquierda y fuentes aumentadas -->
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
                <span class="detail">Cant:${item.quantity || 1}</span>
                <span class="detail">Precio:$${basePrice.toFixed(0)}</span>
                <span class="detail">Cob:${coveragePercent.toFixed(0)}%</span>
              </div>
              <div class="service-totals">
                <span class="total-label">Seg:$${insuranceCovers.toFixed(0)}</span>
                <span class="total-label">Pac:$${patientPays.toFixed(0)}</span>
              </div>
            </div>
          `
        } else {
          return `
            <div class="service-block">
              <div class="service-title">${item.service?.name || item}</div>
              <div class="service-details">
                <span class="detail">Cant:${item.quantity || 1}</span>
                <span class="detail">Precio:$${basePrice.toFixed(0)}</span>
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
const htmlContent = generateLeftAlignedHTML(testInvoice, design);
const outputPath = path.join(__dirname, 'test-final-left-aligned-80mm.html');

fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Archivo de prueba con alineación izquierda y fuentes aumentadas generado:');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('');
console.log('🎯 CAMBIOS REALIZADOS:');
console.log('');
console.log('📝 ALINEACIÓN IZQUIERDA:');
console.log('• Header: center → left');
console.log('• Business info: center → left');
console.log('• Total: right → left');
console.log('• Custom message: center → left');
console.log('');
console.log('🔤 TAMAÑOS DE FUENTE AUMENTADOS:');
console.log('• Business info: 9px → 10px');
console.log('• Invoice info: 10px → 11px');
console.log('• Service title: 10px → 11px');
console.log('• Service details: 8px → 9px');
console.log('• Service totals: 9px → 10px');
console.log('• Total: 14px → 12px (optimizado para 80mm)');
console.log('');
console.log('✨ RESULTADO:');
console.log('• Todo el texto alineado a la izquierda');
console.log('• Fuentes más grandes y legibles');
console.log('• Mejor aprovechamiento del espacio');
console.log('• Diseño más compacto y profesional');
console.log('');
console.log('🔍 Verificación:');
console.log('• Abre el archivo HTML en tu navegador');
console.log('• Verifica que todo esté alineado a la izquierda');
console.log('• Confirma que las fuentes se vean más grandes');
console.log('• Verifica que "Pac:$500" se vea completo');
