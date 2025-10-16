const fs = require('fs');
const path = require('path');

// Datos de prueba para factura con seguros
const testInvoice = {
  invoiceNumber: 'INV-00000001',
  createdAt: new Date(),
  patient: {
    name: 'Juan Pérez',
    insurance: true
  },
  insuranceCalculation: {
    totalBaseAmount: 1000.00,
    totalInsuranceCovers: 0.00,
    totalPatientPays: 1000.00,
    items: [
      {
        serviceId: '1',
        serviceName: 'Consulta General',
        basePrice: 1000.00,
        coveragePercent: 0.0,
        insuranceCovers: 0.00,
        patientPays: 1000.00
      }
    ]
  },
  items: [
    {
      service: { id: '1', name: 'Consulta General' },
      quantity: 1,
      unitPrice: 1000.00,
      totalPrice: 1000.00
    }
  ]
};

// Generar HTML de prueba con el nuevo formato compacto
const generateCompactTestHTML = (invoice) => {
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
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      margin-bottom: 8px;
      padding: 8px;
      background: #fafafa;
    }
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }
    .service-name {
      font-weight: bold;
      font-size: 12px;
      color: #333;
      flex: 1;
    }
    .service-quantity {
      font-size: 10px;
      color: #666;
      background: #e5e5e5;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
    .service-details {
      margin-top: 4px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
      font-size: 10px;
    }
    .detail-label {
      color: #666;
      font-weight: 500;
    }
    .detail-value {
      font-weight: bold;
      font-family: monospace;
    }
    .insurance-amount {
      color: #22c55e;
    }
    .patient-amount {
      color: #dc2626;
      font-size: 11px;
    }
    .total-row {
      border-top: 1px solid #ddd;
      padding-top: 4px;
      margin-top: 4px;
      font-weight: bold;
    }
    .total { 
      text-align: right; 
      font-weight: bold; 
      font-size: 14px; 
      margin-top: 15px; 
      border-top: 2px solid #333;
      padding-top: 10px;
    }
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
    </div>
    
    <div class="separator"></div>
    
    <!-- Nuevo diseño compacto para 80mm -->
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
            <div class="service-header">
              <span class="service-name">${item.service.name}</span>
              <span class="service-quantity">x${item.quantity}</span>
            </div>
            <div class="service-details">
              <div class="detail-row">
                <span class="detail-label">Precio Unit:</span>
                <span class="detail-value">$${basePrice.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cobertura:</span>
                <span class="detail-value">${coveragePercent.toFixed(1)}%</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Seguro Cubre:</span>
                <span class="detail-value insurance-amount">$${insuranceCovers.toFixed(2)}</span>
              </div>
              <div class="detail-row total-row">
                <span class="detail-label">Paciente Paga:</span>
                <span class="detail-value patient-amount">$${patientPays.toFixed(2)}</span>
              </div>
            </div>
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
const htmlContent = generateCompactTestHTML(testInvoice);
const outputPath = path.join(__dirname, 'test-80mm-compact.html');

fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Archivo de prueba generado exitosamente:');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('🔍 Abre el archivo en tu navegador para ver el nuevo formato compacto');
console.log('📱 El diseño está optimizado para terminales de 80mm');
console.log('');
console.log('Características del nuevo diseño:');
console.log('• Información organizada en tarjetas verticales');
console.log('• Cada servicio muestra claramente:');
console.log('  - Nombre del servicio y cantidad');
console.log('  - Precio unitario');
console.log('  - Porcentaje de cobertura');
console.log('  - Monto que cubre el seguro');
console.log('  - Monto que paga el paciente');
console.log('• Colores distintivos para mejor legibilidad');
console.log('• Diseño responsivo para impresoras térmicas de 80mm');
