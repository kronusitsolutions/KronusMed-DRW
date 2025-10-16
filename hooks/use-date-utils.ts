/**
 * Hook para manejar fechas con zona horaria correcta
 * Soluciona el problema de hora adelantada 4 horas
 */

import { useState, useEffect } from 'react'
import { 
  getCurrentDate, 
  formatDateForDisplay, 
  formatDateOnly, 
  formatTimeOnly,
  getCurrentDateInputValue,
  getCurrentDateTimeInputValue,
  toDateInputValue,
  toDateTimeInputValue,
  parseFormDate,
  parseFormDateTime,
  isToday,
  getDayName,
  getMonthName
} from '@/lib/date-utils'

export function useDateUtils() {
  const [currentDate, setCurrentDate] = useState<Date>(getCurrentDate())
  const [currentDateInput, setCurrentDateInput] = useState<string>(getCurrentDateInputValue())
  const [currentDateTimeInput, setCurrentDateTimeInput] = useState<string>(getCurrentDateTimeInputValue())

  // Actualizar fecha actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getCurrentDate()
      setCurrentDate(now)
      setCurrentDateInput(getCurrentDateInputValue())
      setCurrentDateTimeInput(getCurrentDateTimeInputValue())
    }, 60000) // Cada minuto

    return () => clearInterval(interval)
  }, [])

  return {
    // Fecha actual
    currentDate,
    currentDateInput,
    currentDateTimeInput,
    
    // Utilidades de formato
    formatDate: formatDateForDisplay,
    formatDateOnly,
    formatTimeOnly,
    
    // Utilidades de conversión
    toDateInputValue,
    toDateTimeInputValue,
    parseFormDate,
    parseFormDateTime,
    
    // Utilidades de verificación
    isToday,
    getDayName,
    getMonthName
  }
}

/**
 * Hook específico para formularios de fecha
 */
export function useFormDate(defaultValue?: string) {
  const { currentDateInput, parseFormDate, toDateInputValue } = useDateUtils()
  
  const [dateValue, setDateValue] = useState<string>(
    defaultValue || currentDateInput
  )

  const handleDateChange = (value: string) => {
    setDateValue(value)
  }

  const getDateObject = () => {
    return parseFormDate(dateValue)
  }

  const resetToToday = () => {
    setDateValue(currentDateInput)
  }

  return {
    dateValue,
    setDateValue: handleDateChange,
    getDateObject,
    resetToToday,
    isToday: isToday(parseFormDate(dateValue))
  }
}

/**
 * Hook específico para formularios de fecha y hora
 */
export function useFormDateTime(defaultValue?: string) {
  const { currentDateTimeInput, parseFormDateTime, toDateTimeInputValue } = useDateUtils()
  
  const [dateTimeValue, setDateTimeValue] = useState<string>(
    defaultValue || currentDateTimeInput
  )

  const handleDateTimeChange = (value: string) => {
    setDateTimeValue(value)
  }

  const getDateTimeObject = () => {
    return parseFormDateTime(dateTimeValue)
  }

  const resetToNow = () => {
    setDateTimeValue(currentDateTimeInput)
  }

  return {
    dateTimeValue,
    setDateTimeValue: handleDateTimeChange,
    getDateTimeObject,
    resetToNow,
    isToday: isToday(parseFormDateTime(dateTimeValue))
  }
}
