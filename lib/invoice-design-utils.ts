import { InvoiceDesignConfig, FormatStyles, PrintStyles } from '@/types/invoice'

/**
 * Función para obtener el diseño de factura activo
 */
export const getActiveInvoiceDesign = async (): Promise<InvoiceDesignConfig | null> => {
  try {
    const response = await fetch('/api/invoice-design?isActive=true')
    if (response.ok) {
      const designs = await response.json()
      return designs.length > 0 ? designs[0] : null
    }
  } catch (error) {
    console.error('Error al obtener diseño de factura:', error)
  }
  return null
}

/**
 * Función para generar estilos CSS basados en el formato
 */
export const getFormatStyles = (format: string): FormatStyles => {
  if (format === '80MM') {
    return {
      maxWidth: '80mm',
      fontSize: '12px',
      padding: '10px'
    }
  } else {
    return {
      maxWidth: '210mm',
      fontSize: '14px',
      padding: '20px'
    }
  }
}

/**
 * Función para obtener la clase de posición del logo
 */
export const getLogoPositionClass = (position: string) => {
  switch (position) {
    case 'LEFT': return 'justify-start'
    case 'CENTER': return 'justify-center'
    case 'RIGHT': return 'justify-end'
    default: return 'justify-start'
  }
}

/**
 * Función para obtener estilos de impresión basados en el formato
 */
export const getPrintStyles = (format: string): PrintStyles => {
  if (format === '80MM') {
    return {
      container: {
        maxWidth: '80mm',
        fontSize: '10px',
        padding: '2mm',
        margin: '0 auto'
      },
      header: {
        fontSize: '14px',
        fontWeight: 'bold'
      },
      businessInfo: {
        fontSize: '9px',
        color: '#666'
      },
      serviceBlock: {
        fontSize: '9px',
        padding: '4px',
        border: '1px solid #ddd',
        marginBottom: '4px',
        borderRadius: '2px'
      }
    }
  } else {
    return {
      container: {
        maxWidth: '210mm',
        fontSize: '14px',
        padding: '20px',
        margin: '0 auto'
      },
      header: {
        fontSize: '18px',
        fontWeight: 'bold'
      },
      businessInfo: {
        fontSize: '12px',
        color: '#666'
      },
      serviceBlock: {
        fontSize: '12px',
        padding: '8px',
        border: '1px solid #ddd',
        marginBottom: '8px',
        borderRadius: '4px'
      }
    }
  }
}
