import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Función para obtener la configuración de diseño activa
async function getActiveInvoiceDesign() {
  try {
    const design = await prisma.invoiceDesign.findFirst({
      where: { isActive: true }
    })
    return design || {
      businessName: "KRONUSMED",
      address: "",
      phone: "",
      taxId: "",
      customMessage: ""
    }
  } catch (error) {
    console.error("Error al obtener configuración de diseño:", error)
    return {
      businessName: "KRONUSMED",
      address: "",
      phone: "",
      taxId: "",
      customMessage: ""
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "BILLING"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, data, options = {} } = body

    // Obtener la configuración de diseño activa
    const designConfig = await getActiveInvoiceDesign()

    // Generar PDF según el tipo de reporte
    let pdfContent = ""
    
    switch (reportType) {
      case 'daily-sales':
        pdfContent = generateDailySalesPDF(data, options, designConfig)
        break
      case 'demographics':
        pdfContent = generateDemographicsPDF(data, options, designConfig)
        break
      case 'insurance':
        pdfContent = generateInsurancePDF(data, options, designConfig)
        break
      default:
        return NextResponse.json({ error: "Tipo de reporte no válido" }, { status: 400 })
    }

    // En un entorno real, aquí usarías una librería como puppeteer o jsPDF
    // Por ahora retornamos el contenido HTML que se puede convertir a PDF
    return NextResponse.json({
      success: true,
      htmlContent: pdfContent,
      message: "Contenido PDF generado exitosamente"
    })

  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

function generateDailySalesPDF(data: any, options: any, designConfig: any) {
  const { date, summary, invoices, exonerations, serviceBreakdown } = data
  const businessName = designConfig.businessName || "KRONUSMED"
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Ventas del Día - ${date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2E5BBA; margin: 0; }
        .header h2 { color: #666; margin: 5px 0; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-card { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center;
          min-width: 150px;
        }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .amount { font-size: 24px; font-weight: bold; color: #2E5BBA; }
        .section { margin: 30px 0; }
        .section h3 { color: #2E5BBA; border-bottom: 2px solid #2E5BBA; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .status-paid { color: #28a745; font-weight: bold; }
        .status-pending { color: #ffc107; font-weight: bold; }
        .status-exonerated { color: #dc3545; font-weight: bold; }
        .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${businessName}</h1>
        <h2>Reporte de Ventas del Día</h2>
        <p>Fecha: ${new Date(date).toLocaleDateString('es-ES')}</p>
        <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Facturado</h3>
          <div class="amount">$${summary.totalFacturado.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Facturas Pagadas</h3>
          <div class="amount">${summary.facturasPagadas}</div>
          <div>$${summary.totalPagado.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Facturas por Cobrar</h3>
          <div class="amount">${summary.facturasPendientes + summary.facturasParciales}</div>
          <div>$${summary.totalPendiente.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Exoneraciones</h3>
          <div class="amount">${summary.facturasExoneradas}</div>
          <div>$${summary.totalExonerado.toLocaleString()}</div>
        </div>
      </div>

      <div class="section">
        <h3>Resumen por Servicios</h3>
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Facturas</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${serviceBreakdown.map(service => `
              <tr>
                <td>${service.name}</td>
                <td>${service.category || 'N/A'}</td>
                <td class="text-center">${service.totalQuantity}</td>
                <td class="text-center">${service.invoiceCount}</td>
                <td class="text-right">$${service.totalRevenue.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>Facturas del Día (${invoices.length})</h3>
        <table>
          <thead>
            <tr>
              <th># Factura</th>
              <th>Paciente</th>
              <th>Responsable</th>
              <th>Servicios</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.map(invoice => `
              <tr>
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.patientName} (${invoice.patientNumber})</td>
                <td>${invoice.doctorName}</td>
                <td>${invoice.mainServices || 'N/A'}</td>
                <td class="text-right">$${invoice.totalAmount.toLocaleString()}</td>
                <td class="status-${invoice.status.toLowerCase()}">${invoice.status}</td>
                <td class="text-center">${new Date(invoice.createdAt).toLocaleTimeString('es-ES')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${exonerations.length > 0 ? `
      <div class="section">
        <h3>Exoneraciones del Día (${exonerations.length})</h3>
        <table>
          <thead>
            <tr>
              <th># Factura</th>
              <th>Paciente</th>
              <th>Razón</th>
              <th>Monto Original</th>
              <th>Monto Exonerado</th>
              <th>Autorizado por</th>
            </tr>
          </thead>
          <tbody>
            ${exonerations.map(ex => `
              <tr>
                <td>${ex.invoiceNumber}</td>
                <td>${ex.patientName} (${ex.patientNumber})</td>
                <td>${ex.reason}</td>
                <td class="text-right">$${ex.originalAmount.toLocaleString()}</td>
                <td class="text-right">$${ex.exoneratedAmount.toLocaleString()}</td>
                <td>${ex.authorizedBy}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div class="footer">
        <p>Reporte generado automáticamente por KronusMed</p>
        <p>© ${new Date().getFullYear()} KronusMed - Sistema de Gestión Médica</p>
      </div>
    </body>
    </html>
  `
}

function generateDemographicsPDF(data: any, options: any, designConfig: any) {
  const { period, summary, chartData } = data
  const businessName = designConfig.businessName || "KRONUSMED"
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte Demográfico - ${period.groupBy}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2E5BBA; margin: 0; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-card { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center;
          min-width: 150px;
        }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .amount { font-size: 24px; font-weight: bold; color: #2E5BBA; }
        .section { margin: 30px 0; }
        .section h3 { color: #2E5BBA; border-bottom: 2px solid #2E5BBA; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${businessName}</h1>
        <h2>Reporte Demográfico</h2>
        <p>Agrupado por: ${period.groupBy}</p>
        <p>Período: ${period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'Todo el tiempo'} - ${period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'Actual'}</p>
        <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Pacientes</h3>
          <div class="amount">${summary.totalPatients}</div>
        </div>
        <div class="summary-card">
          <h3>Total Citas</h3>
          <div class="amount">${summary.totalAppointments}</div>
        </div>
        <div class="summary-card">
          <h3>Total Ingresos</h3>
          <div class="amount">$${summary.totalRevenue.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Promedio Citas/Paciente</h3>
          <div class="amount">${summary.avgAppointmentsPerPatient}</div>
        </div>
      </div>

      <div class="section">
        <h3>Distribución por ${period.groupBy}</h3>
        <table>
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Pacientes</th>
              <th>Citas</th>
              <th>Ingresos</th>
              <th>Promedio Citas/Paciente</th>
              <th>Promedio Ingresos/Paciente</th>
            </tr>
          </thead>
          <tbody>
            ${chartData.map(item => `
              <tr>
                <td>${item.group}</td>
                <td class="text-center">${item.count}</td>
                <td class="text-center">${item.appointments}</td>
                <td class="text-right">$${item.revenue.toLocaleString()}</td>
                <td class="text-center">${item.avgAppointmentsPerPatient}</td>
                <td class="text-right">$${item.avgRevenuePerPatient}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Reporte generado automáticamente por KronusMed</p>
        <p>© ${new Date().getFullYear()} KronusMed - Sistema de Gestión Médica</p>
      </div>
    </body>
    </html>
  `
}

function generateInsurancePDF(data: any, options: any, designConfig: any) {
  const { period, summary, insuranceReports } = data
  const businessName = designConfig.businessName || "KRONUSMED"
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Seguros Médicos</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2E5BBA; margin: 0; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-card { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center;
          min-width: 150px;
        }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .amount { font-size: 24px; font-weight: bold; color: #2E5BBA; }
        .section { margin: 30px 0; }
        .section h3 { color: #2E5BBA; border-bottom: 2px solid #2E5BBA; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .insurance-section { margin: 40px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${businessName}</h1>
        <h2>Reporte de Seguros Médicos</h2>
        <p>Período: ${period.startDate ? new Date(period.startDate).toLocaleDateString('es-ES') : 'Todo el tiempo'} - ${period.endDate ? new Date(period.endDate).toLocaleDateString('es-ES') : 'Actual'}</p>
        <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total Aseguradoras</h3>
          <div class="amount">${summary.totalInsurances}</div>
        </div>
        <div class="summary-card">
          <h3>Pacientes Asegurados</h3>
          <div class="amount">${summary.totalInsuredPatients}</div>
        </div>
        <div class="summary-card">
          <h3>Facturas con Seguro</h3>
          <div class="amount">${summary.totalInvoicesWithInsurance}</div>
        </div>
        <div class="summary-card">
          <h3>Total Descuentos</h3>
          <div class="amount">$${summary.totalDiscounts.toLocaleString()}</div>
        </div>
      </div>

      ${insuranceReports.map(insurance => `
        <div class="insurance-section">
          <h3>${insurance.insurance.name}</h3>
          <p><strong>Pacientes:</strong> ${insurance.insurance.patientCount} | <strong>Facturas:</strong> ${insurance.summary.totalInvoices}</p>
          
          <div class="summary">
            <div class="summary-card">
              <h4>Monto Original</h4>
              <div class="amount">$${insurance.summary.totalOriginalAmount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h4>Paga Paciente</h4>
              <div class="amount">$${insurance.summary.totalPatientPays.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h4>Cubre Seguro</h4>
              <div class="amount">$${insurance.summary.totalInsuranceCovers.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <h4>Descuentos</h4>
              <div class="amount">$${insurance.summary.totalDiscounts.toLocaleString()}</div>
            </div>
          </div>

          <h4>Servicios Más Utilizados</h4>
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Monto Original</th>
                <th>Descuentos</th>
                <th>% Cobertura</th>
              </tr>
            </thead>
            <tbody>
              ${insurance.serviceUsage.slice(0, 10).map(service => `
                <tr>
                  <td>${service.serviceName}</td>
                  <td>${service.serviceCategory || 'N/A'}</td>
                  <td class="text-center">${service.totalQuantity}</td>
                  <td class="text-right">$${service.totalOriginalAmount.toLocaleString()}</td>
                  <td class="text-right">$${service.totalDiscounts.toLocaleString()}</td>
                  <td class="text-center">${service.coveragePercent}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div class="footer">
        <p>Reporte generado automáticamente por KronusMed</p>
        <p>© ${new Date().getFullYear()} KronusMed - Sistema de Gestión Médica</p>
      </div>
    </body>
    </html>
  `
}
