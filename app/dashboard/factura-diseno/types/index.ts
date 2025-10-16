// Importar y re-exportar tipos centralizados para mantener compatibilidad
import type { InvoiceDesignConfig } from "@/types/invoice"
export type { InvoiceDesignConfig } from "@/types/invoice"

export interface LogoUploadResponse {
  success: boolean
  url?: string
  error?: string
}

export interface InvoiceDesignPreviewProps {
  config: InvoiceDesignConfig
  showFullPreview?: boolean
}

export interface LogoUploadProps {
  currentLogoUrl?: string
  onLogoUpload: (logoUrl: string) => void
}
