/**
 * Utilidades para formato profesional de Excel
 * Compatible con Excel 2010
 */

// Helper para convertir colores hex a formato ARGB de Excel
function hexToArgb(hex: string): { argb: string } {
  // Remover # si está presente
  hex = hex.replace('#', '')
  
  // Si es formato corto (3 caracteres), expandir
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Agregar FF para opacidad completa
  return { argb: 'FF' + hex.toUpperCase() }
}

// Usar el tipo Style de ExcelJS directamente
import { Style } from 'exceljs'

export type ExcelStyle = Partial<Style>

/**
 * Estilo para encabezados principales
 */
export function createHeaderStyle(): ExcelStyle {
  return {
    font: {
      bold: true,
      size: 14,
      color: hexToArgb('FFFFFF')
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle'
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('366092') // Azul corporativo
    },
    border: {
      top: { style: 'thin', color: hexToArgb('000000') },
      bottom: { style: 'thin', color: hexToArgb('000000') },
      left: { style: 'thin', color: hexToArgb('000000') },
      right: { style: 'thin', color: hexToArgb('000000') }
    }
  }
}

/**
 * Estilo para subtítulos
 */
export function createSubtitleStyle(): ExcelStyle {
  return {
    font: {
      bold: true,
      size: 12,
      color: hexToArgb('000000')
    },
    alignment: {
      horizontal: 'left',
      vertical: 'middle'
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('D9D9D9') // Gris claro
    },
    border: {
      top: { style: 'thin', color: hexToArgb('000000') },
      bottom: { style: 'thin', color: hexToArgb('000000') },
      left: { style: 'thin', color: hexToArgb('000000') },
      right: { style: 'thin', color: hexToArgb('000000') }
    }
  }
}

/**
 * Estilo para datos normales
 */
export function createDataStyle(): ExcelStyle {
  return {
    font: {
      size: 10,
      color: hexToArgb('000000')
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle'
    },
    border: {
      top: { style: 'thin', color: hexToArgb('CCCCCC') },
      bottom: { style: 'thin', color: hexToArgb('CCCCCC') },
      left: { style: 'thin', color: hexToArgb('CCCCCC') },
      right: { style: 'thin', color: hexToArgb('CCCCCC') }
    }
  }
}

/**
 * Estilo para valores de moneda
 */
export function createCurrencyStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    numFmt: '"$"#,##0.00'
  }
}

/**
 * Estilo para porcentajes
 */
export function createPercentStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    numFmt: '0.0%"'
  }
}

/**
 * Estilo para fechas
 */
export function createDateStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    numFmt: 'dd/mm/yyyy'
  }
}

/**
 * Estilo para números enteros
 */
export function createNumberStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    numFmt: '#,##0'
  }
}

/**
 * Estilo para valores positivos (verde)
 */
export function createPositiveStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    font: {
      size: 10,
      color: hexToArgb('FFFFFF'),
      bold: true
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('00B050') // Verde
    }
  }
}

/**
 * Estilo para valores negativos (rojo)
 */
export function createNegativeStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    font: {
      size: 10,
      color: hexToArgb('FFFFFF'),
      bold: true
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('FF0000') // Rojo
    }
  }
}

/**
 * Estilo para valores de advertencia (amarillo)
 */
export function createWarningStyle(): ExcelStyle {
  return {
    ...createDataStyle(),
    font: {
      size: 10,
      color: hexToArgb('000000'),
      bold: true
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('FFFF00') // Amarillo
    }
  }
}

/**
 * Aplica bordes a una celda
 */
export function applyCellBorders(style: ExcelStyle, color: string = '000000'): ExcelStyle {
  return {
    ...style,
    border: {
      top: { style: 'thin', color: hexToArgb(color) },
      bottom: { style: 'thin', color: hexToArgb(color) },
      left: { style: 'thin', color: hexToArgb(color) },
      right: { style: 'thin', color: hexToArgb(color) }
    }
  }
}

/**
 * Aplica formato condicional basado en el valor
 */
export function applyConditionalFormatting(
  value: number, 
  baseStyle: ExcelStyle = createDataStyle()
): ExcelStyle {
  if (value > 0) {
    return createPositiveStyle()
  } else if (value < 0) {
    return createNegativeStyle()
  } else {
    return baseStyle
  }
}

/**
 * Aplica formato condicional para porcentajes
 */
export function applyPercentConditionalFormatting(
  value: number,
  threshold: number = 0
): ExcelStyle {
  if (value > threshold) {
    return createPositiveStyle()
  } else if (value < threshold) {
    return createNegativeStyle()
  } else {
    return createWarningStyle()
  }
}

/**
 * Aplica formato condicional para tasas de cobro
 */
export function applyCollectionRateFormatting(rate: number): ExcelStyle {
  if (rate >= 90) {
    return createPositiveStyle()
  } else if (rate >= 70) {
    return createWarningStyle()
  } else {
    return createNegativeStyle()
  }
}

/**
 * Aplica formato condicional para crecimiento
 */
export function applyGrowthFormatting(growth: number): ExcelStyle {
  if (growth > 5) {
    return createPositiveStyle()
  } else if (growth > 0) {
    return createWarningStyle()
  } else {
    return createNegativeStyle()
  }
}

/**
 * Aplica formato condicional para aging report
 */
export function applyAgingFormatting(days: number, amount: number): ExcelStyle {
  if (days <= 30) {
    return createPositiveStyle()
  } else if (days <= 60) {
    return createWarningStyle()
  } else {
    return createNegativeStyle()
  }
}

/**
 * Crea estilo para títulos de sección
 */
export function createSectionTitleStyle(): ExcelStyle {
  return {
    font: {
      bold: true,
      size: 16,
      color: hexToArgb('000000')
    },
    alignment: {
      horizontal: 'left',
      vertical: 'middle'
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('F2F2F2') // Gris muy claro
    }
  }
}

/**
 * Crea estilo para totales
 */
export function createTotalStyle(): ExcelStyle {
  return {
    font: {
      bold: true,
      size: 11,
      color: hexToArgb('000000')
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle'
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: hexToArgb('E6E6E6') // Gris medio
    },
    border: {
      top: { style: 'medium', color: hexToArgb('000000') },
      bottom: { style: 'medium', color: hexToArgb('000000') },
      left: { style: 'thin', color: hexToArgb('000000') },
      right: { style: 'thin', color: hexToArgb('000000') }
    }
  }
}

/**
 * Crea estilo para notas y comentarios
 */
export function createNoteStyle(): ExcelStyle {
  return {
    font: {
      size: 9,
      color: hexToArgb('666666'),
      italic: true
    },
    alignment: {
      horizontal: 'left',
      vertical: 'top'
    }
  }
}

/**
 * Aplica formato condicional para métricas de pacientes
 */
export function applyPatientMetricFormatting(metric: string, value: number): ExcelStyle {
  switch (metric) {
    case 'retentionRate':
      if (value >= 80) return createPositiveStyle()
      if (value >= 60) return createWarningStyle()
      return createNegativeStyle()
    
    case 'noShowRate':
      if (value <= 10) return createPositiveStyle()
      if (value <= 20) return createWarningStyle()
      return createNegativeStyle()
    
    case 'conversionRate':
      if (value >= 70) return createPositiveStyle()
      if (value >= 50) return createWarningStyle()
      return createNegativeStyle()
    
    default:
      return createDataStyle()
  }
}

/**
 * Configuración de ancho de columnas para diferentes tipos de datos
 */
export const COLUMN_WIDTHS = {
  narrow: 8,
  normal: 12,
  wide: 18,
  extraWide: 25,
  date: 12,
  currency: 15,
  percentage: 12,
  number: 10
}

/**
 * Aplica ancho de columna basado en el tipo de dato
 */
export function getColumnWidth(dataType: 'narrow' | 'normal' | 'wide' | 'extraWide' | 'date' | 'currency' | 'percentage' | 'number'): number {
  return COLUMN_WIDTHS[dataType]
}

/**
 * Crea configuración de columna con ancho automático
 */
export function createAutoWidthColumn(): { width: number } {
  return { width: 15 } // Ancho por defecto para Excel 2010
}

/**
 * Crea configuración de columna con ancho específico
 */
export function createFixedWidthColumn(width: number): { width: number } {
  return { width: Math.min(width, 50) } // Máximo 50 para compatibilidad
}

/**
 * Aplica formato de número basado en el tipo
 */
export function getNumberFormat(dataType: 'currency' | 'percentage' | 'number' | 'date'): string {
  switch (dataType) {
    case 'currency':
      return '"$"#,##0.00'
    case 'percentage':
      return '0.0%"'
    case 'number':
      return '#,##0'
    case 'date':
      return 'dd/mm/yyyy'
    default:
      return 'General'
  }
}
