import { useState } from 'react'

export interface PDFExportOptions {
  includePatientInfo: boolean
  includeVitalSigns: boolean
  includePrescriptions: boolean
  dateRange?: {
    start: string
    end: string
  }
  consultationIds?: string[]
}

export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToPDF = async (
    patientId: string,
    options: PDFExportOptions = {
      includePatientInfo: true,
      includeVitalSigns: true,
      includePrescriptions: true
    }
  ) => {
    try {
      setIsExporting(true)
      setError(null)

      // Crear el contenido HTML para el PDF
      const htmlContent = await generatePDFContent(patientId, options)
      
      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' })
      
      // Crear un enlace de descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `historial-paciente-${patientId}-${new Date().toISOString().split('T')[0]}.html`
      
      // Simular click para descargar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar el URL
      URL.revokeObjectURL(url)
      
      return true
    } catch (err) {
      console.error('Error exporting to PDF:', err)
      setError(err instanceof Error ? err.message : 'Error al exportar PDF')
      return false
    } finally {
      setIsExporting(false)
    }
  }

  const generatePDFContent = async (patientId: string, options: PDFExportOptions): Promise<string> => {
    // Obtener datos del historial
    const response = await fetch(`/api/patients/${patientId}/history`)
    if (!response.ok) {
      throw new Error('Error al obtener datos del historial')
    }
    
    const historyData = await response.json()
    const { patient, consultations } = historyData

    // Filtrar consultas si se especifica un rango de fechas
    let filteredConsultations = consultations
    if (options.dateRange) {
      filteredConsultations = consultations.filter((consultation: any) => {
        const consultationDate = new Date(consultation.date)
        const startDate = new Date(options.dateRange!.start)
        const endDate = new Date(options.dateRange!.end)
        return consultationDate >= startDate && consultationDate <= endDate
      })
    }

    // Filtrar por IDs específicos si se proporcionan
    if (options.consultationIds && options.consultationIds.length > 0) {
      filteredConsultations = filteredConsultations.filter((consultation: any) =>
        options.consultationIds!.includes(consultation.id)
      )
    }

    // Generar HTML
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Historial Médico - ${patient.name}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
          }
          .patient-info {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .patient-info h2 {
            color: #2563eb;
            margin-bottom: 20px;
            font-size: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          .info-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            margin-right: 10px;
            min-width: 120px;
          }
          .consultation {
            background: white;
            margin-bottom: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .consultation-header {
            background: #f8fafc;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
          }
          .consultation-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 5px 0;
          }
          .consultation-meta {
            color: #6b7280;
            font-size: 14px;
          }
          .consultation-content {
            padding: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            font-size: 16px;
          }
          .section-content {
            color: #6b7280;
            line-height: 1.5;
          }
          .vital-signs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
          }
          .vital-sign {
            background: #f0f9ff;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
          }
          .prescription {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #10b981;
          }
          .prescription-medication {
            font-weight: 600;
            color: #065f46;
            margin-bottom: 5px;
          }
          .prescription-details {
            color: #047857;
            font-size: 14px;
          }
          .no-data {
            text-align: center;
            color: #9ca3af;
            font-style: italic;
            padding: 20px;
          }
          @media print {
            body { background-color: white; }
            .header { background: #2563eb !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Historial Médico</h1>
          <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')}</div>
        </div>

        ${options.includePatientInfo ? `
        <div class="patient-info">
          <h2>Información del Paciente</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nombre:</span>
              <span>${patient.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Número:</span>
              <span>${patient.patientNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Edad:</span>
              <span>${patient.age} años</span>
            </div>
            <div class="info-item">
              <span class="info-label">Género:</span>
              <span>${patient.gender === 'MALE' ? 'Masculino' : 'Femenino'}</span>
            </div>
            ${patient.birthDate ? `
            <div class="info-item">
              <span class="info-label">Fecha de Nacimiento:</span>
              <span>${new Date(patient.birthDate).toLocaleDateString('es-ES')}</span>
            </div>
            ` : ''}
            ${patient.bloodType ? `
            <div class="info-item">
              <span class="info-label">Grupo Sanguíneo:</span>
              <span>${patient.bloodType}</span>
            </div>
            ` : ''}
            ${patient.phone ? `
            <div class="info-item">
              <span class="info-label">Teléfono:</span>
              <span>${patient.phone}</span>
            </div>
            ` : ''}
            ${patient.allergies ? `
            <div class="info-item">
              <span class="info-label">Alergias:</span>
              <span>${patient.allergies}</span>
            </div>
            ` : ''}
            ${patient.emergencyContact ? `
            <div class="info-item">
              <span class="info-label">Contacto de Emergencia:</span>
              <span>${patient.emergencyContact}</span>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <div class="consultations">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Consultas Médicas (${filteredConsultations.length})</h2>
          
          ${filteredConsultations.length === 0 ? `
          <div class="no-data">
            No hay consultas médicas registradas en el período seleccionado.
          </div>
          ` : filteredConsultations.map((consultation: any) => `
          <div class="consultation">
            <div class="consultation-header">
              <div class="consultation-title">
                ${consultation.type === 'PRIMERA_CONSULTA' ? 'Primera Consulta' :
                  consultation.type === 'SEGUIMIENTO' ? 'Seguimiento' :
                  consultation.type === 'CONTROL' ? 'Control' : 'Urgencia'}
              </div>
              <div class="consultation-meta">
                ${new Date(consultation.date).toLocaleDateString('es-ES')} - 
                ${consultation.duration} - 
                Dr. ${consultation.doctor?.name || 'Desconocido'}
              </div>
            </div>
            <div class="consultation-content">
              ${consultation.reason ? `
              <div class="section">
                <div class="section-title">Motivo de Consulta</div>
                <div class="section-content">${consultation.reason}</div>
              </div>
              ` : ''}
              
              ${consultation.diagnosis ? `
              <div class="section">
                <div class="section-title">Diagnóstico</div>
                <div class="section-content">${consultation.diagnosis}</div>
              </div>
              ` : ''}
              
              ${consultation.symptoms ? `
              <div class="section">
                <div class="section-title">Síntomas</div>
                <div class="section-content">${consultation.symptoms}</div>
              </div>
              ` : ''}
              
              ${options.includeVitalSigns && consultation.vitalSigns ? `
              <div class="section">
                <div class="section-title">Signos Vitales</div>
                <div class="vital-signs">
                  ${Object.entries(consultation.vitalSigns).map(([key, value]) => `
                    <div class="vital-sign">
                      <div style="font-weight: 600; color: #2563eb;">${getVitalSignLabel(key)}</div>
                      <div>${value}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <div class="section">
                <div class="section-title">Notas Médicas</div>
                <div class="section-content">${consultation.notes}</div>
              </div>
              
              ${consultation.treatment ? `
              <div class="section">
                <div class="section-title">Tratamiento</div>
                <div class="section-content">${consultation.treatment}</div>
              </div>
              ` : ''}
              
              ${options.includePrescriptions && consultation.prescriptions && consultation.prescriptions.length > 0 ? `
              <div class="section">
                <div class="section-title">Medicamentos Recetados</div>
                ${consultation.prescriptions.map((prescription: any) => `
                  <div class="prescription">
                    <div class="prescription-medication">${prescription.medication}</div>
                    <div class="prescription-details">
                      Dosificación: ${prescription.dosage} | 
                      Frecuencia: ${prescription.frequency}
                      ${prescription.duration ? ` | Duración: ${prescription.duration}` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              ${consultation.followUpDate ? `
              <div class="section">
                <div class="section-title">Próxima Cita</div>
                <div class="section-content">${new Date(consultation.followUpDate).toLocaleDateString('es-ES')}</div>
              </div>
              ` : ''}
            </div>
          </div>
          `).join('')}
        </div>
      </body>
      </html>
    `

    return html
  }

  const getVitalSignLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      bloodPressure: 'Presión Arterial',
      temperature: 'Temperatura',
      heartRate: 'Frecuencia Cardíaca',
      weight: 'Peso',
      height: 'Altura'
    }
    return labels[key] || key
  }

  return {
    exportToPDF,
    isExporting,
    error
  }
}
