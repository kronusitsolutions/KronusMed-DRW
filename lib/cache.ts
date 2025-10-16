/**
 * Sistema de caché optimizado para producción
 * Maneja caché en memoria con TTL y invalidación inteligente
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private maxSize = 1000 // Máximo 1000 items en caché
  private defaultTTL = 5 * 60 * 1000 // 5 minutos por defecto

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Limpiar caché si está lleno
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Limpiar items expirados
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Obtener estadísticas del caché
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize
    }
  }
}

// Instancia global del caché
export const cache = new CacheManager()

// Funciones de utilidad para caché específico de servicios
export const ServiceCache = {
  // Claves de caché
  KEYS: {
    ALL_SERVICES: 'services:all',
    ACTIVE_SERVICES: 'services:active',
    SERVICE_BY_ID: (id: string) => `service:${id}`,
    SERVICES_BY_CATEGORY: (category: string) => `services:category:${category}`,
    SERVICES_COUNT: 'services:count'
  },

  // TTL específicos
  TTL: {
    SERVICES: 10 * 60 * 1000, // 10 minutos
    SERVICE_DETAIL: 30 * 60 * 1000, // 30 minutos
    COUNT: 5 * 60 * 1000 // 5 minutos
  },

  // Invalidar caché relacionado con servicios
  invalidateServices(): void {
    const keys = [
      ServiceCache.KEYS.ALL_SERVICES,
      ServiceCache.KEYS.ACTIVE_SERVICES,
      ServiceCache.KEYS.SERVICES_COUNT
    ]
    
    keys.forEach(key => cache.delete(key))
  },

  // Invalidar caché de un servicio específico
  invalidateService(serviceId: string): void {
    cache.delete(ServiceCache.KEYS.SERVICE_BY_ID(serviceId))
    ServiceCache.invalidateServices()
  },

  // Invalidar caché por categoría
  invalidateCategory(category: string): void {
    cache.delete(ServiceCache.KEYS.SERVICES_BY_CATEGORY(category))
    ServiceCache.invalidateServices()
  }
}

// Caché específico para dashboard y estadísticas
export const DashboardCache = {
  KEYS: {
    STATS: 'dashboard:stats',
    RECENT_APPOINTMENTS: 'dashboard:recent_appointments',
    PATIENT_COUNT: 'dashboard:patient_count',
    INVOICE_COUNT: 'dashboard:invoice_count'
  },

  TTL: {
    STATS: 2 * 60 * 1000, // 2 minutos
    RECENT_APPOINTMENTS: 1 * 60 * 1000, // 1 minuto
    COUNTS: 5 * 60 * 1000 // 5 minutos
  },

  invalidateDashboard(): void {
    const keys = Object.values(DashboardCache.KEYS)
    keys.forEach(key => cache.delete(key))
  }
}

// Caché específico para pacientes
export const PatientCache = {
  KEYS: {
    ALL_PATIENTS: 'patients:all',
    ACTIVE_PATIENTS: 'patients:active',
    PATIENT_BY_ID: (id: string) => `patient:${id}`,
    PATIENTS_COUNT: 'patients:count'
  },

  TTL: {
    PATIENTS: 5 * 60 * 1000, // 5 minutos
    PATIENT_DETAIL: 15 * 60 * 1000, // 15 minutos
    COUNT: 2 * 60 * 1000 // 2 minutos
  },

  invalidatePatients(): void {
    const keys = [
      PatientCache.KEYS.ALL_PATIENTS,
      PatientCache.KEYS.ACTIVE_PATIENTS,
      PatientCache.KEYS.PATIENTS_COUNT
    ]
    keys.forEach(key => cache.delete(key))
  },

  invalidatePatient(patientId: string): void {
    cache.delete(PatientCache.KEYS.PATIENT_BY_ID(patientId))
    PatientCache.invalidatePatients()
  }
}

// Caché específico para facturas
export const InvoiceCache = {
  KEYS: {
    ALL_INVOICES: 'invoices:all',
    PENDING_INVOICES: 'invoices:pending',
    INVOICE_BY_ID: (id: string) => `invoice:${id}`,
    INVOICES_COUNT: 'invoices:count'
  },

  TTL: {
    INVOICES: 3 * 60 * 1000, // 3 minutos
    INVOICE_DETAIL: 10 * 60 * 1000, // 10 minutos
    COUNT: 1 * 60 * 1000 // 1 minuto
  },

  invalidateInvoices(): void {
    const keys = [
      InvoiceCache.KEYS.ALL_INVOICES,
      InvoiceCache.KEYS.PENDING_INVOICES,
      InvoiceCache.KEYS.INVOICES_COUNT
    ]
    keys.forEach(key => cache.delete(key))
  },

  invalidateInvoice(invoiceId: string): void {
    cache.delete(InvoiceCache.KEYS.INVOICE_BY_ID(invoiceId))
    InvoiceCache.invalidateInvoices()
  }
}

// Función para limpiar caché automáticamente
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = cache.getStats()
    if (stats.expired > 0) {
      console.log(`🧹 Limpiando caché: ${stats.expired} items expirados`)
    }
  }, 60000) // Cada minuto
}

export default cache
