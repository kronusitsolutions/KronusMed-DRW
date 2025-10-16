/**
 * Interfaces y tipos principales para el sistema de facturación
 */

export interface InvoiceItem {
  id: string
  serviceId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  service?: {
    name: string
    id: string
  }
}

export interface Invoice {
  id: string
  invoiceNumber: string
  patient?: {
    id?: string
    name: string
    phone?: string | null
    nationality?: string | null
    cedula?: string | null
    patientNumber?: string
    insurance?: { 
      name: string 
    }
  }
  items?: InvoiceItem[]
  services?: string[]
  totalAmount: number
  paidAmount?: number // Monto total pagado hasta el momento
  pendingAmount?: number // Monto pendiente (totalAmount - paidAmount)
  amount?: number
  status: string
  createdAt: string
  date?: string
  notes?: string
  dueDate?: string
  paidAt?: string
  payments?: InvoicePayment[] // Pagos individuales
  insuranceCalculation?: {
    items?: Array<{
      serviceId?: string
      serviceName?: string
      insuranceName?: string
      basePrice: number
      insuranceCovers: number
      patientPays: number
      coveragePercent: number
    }>
    totalBaseAmount?: number
    totalInsuranceCovers?: number
    totalPatientPays?: number
    isExonerated?: boolean
  }
  exoneration?: {
    reason: string
    authorizationCode?: string
    notes?: string
    originalAmount: number
    exoneratedAmount: number
    author?: {
      name: string
    }
  }
}

export interface InvoicePayment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod?: string
  notes?: string
  paidAt: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceDesignConfig {
  id?: string
  name: string
  logoUrl?: string
  logoPosition: "LEFT" | "CENTER" | "RIGHT"
  businessName: string
  address: string
  phone: string
  taxId: string
  customMessage: string
  format: "80MM" | "LETTER"
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Tipos para estilos de formato
 */
export interface FormatStyles {
  maxWidth: string
  fontSize: string
  padding: string
}

export interface PrintStyles {
  container: {
    maxWidth: string
    fontSize: string
    padding: string
    margin: string
  }
  header: {
    fontSize: string
    fontWeight: string
  }
  businessInfo: {
    fontSize: string
    color: string
  }
  serviceBlock: {
    fontSize: string
    padding: string
    border: string
    marginBottom: string
    borderRadius: string
  }
}
