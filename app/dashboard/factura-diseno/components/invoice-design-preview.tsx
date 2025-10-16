"use client"

import { Card } from "@/components/ui/card"
import { InvoiceDesignConfig } from "@/types/invoice"
import { getLogoPositionClass, getPrintStyles } from "@/lib/invoice-design-utils"

interface InvoiceDesignPreviewProps {
  config: InvoiceDesignConfig
  showFullPreview?: boolean
}

export function InvoiceDesignPreview({ config, showFullPreview = false }: InvoiceDesignPreviewProps) {
  const logoPositionClass = getLogoPositionClass(config.logoPosition)
  const printStyles = getPrintStyles(config.format)
  
  const formatStyles = {
    width: config.format === "80MM" ? "80mm" : "210mm",
    maxWidth: config.format === "80MM" ? "80mm" : "210mm",
    minHeight: config.format === "80MM" ? "200px" : "297mm",
    fontSize: printStyles.container.fontSize,
    lineHeight: config.format === "80MM" ? "1.2" : "1.4"
  }

  return (
    <div className="flex justify-center">
      <Card 
        className="border-2 border-dashed border-gray-300 bg-white shadow-sm"
        style={formatStyles}
      >
        <div className="p-4 space-y-3">
          {/* Header con Logo */}
          <div className={`flex items-center ${logoPositionClass} gap-3`}>
            {config.logoUrl && (
              <div className="flex-shrink-0">
                <img 
                  src={config.logoUrl} 
                  alt="Logo" 
                  className="max-h-12 max-w-24 object-contain"
                />
              </div>
            )}
            <div className="text-center">
              <h2 className="font-bold text-lg" style={{ fontSize: config.format === "80MM" ? "14px" : "18px" }}>
                {config.businessName || "Nombre de la Empresa"}
              </h2>
            </div>
          </div>

          {/* Información de la empresa */}
          <div className="text-center space-y-1">
            {config.address && (
              <p className="text-gray-600" style={{ fontSize: config.format === "80MM" ? "8px" : "10px" }}>
                {config.address}
              </p>
            )}
            {config.phone && (
              <p className="text-gray-600" style={{ fontSize: config.format === "80MM" ? "8px" : "10px" }}>
                Tel: {config.phone}
              </p>
            )}
            {config.taxId && (
              <p className="text-gray-600" style={{ fontSize: config.format === "80MM" ? "8px" : "10px" }}>
                RNC: {config.taxId}
              </p>
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-300 my-3"></div>

          {/* Información de la factura */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ fontSize: config.format === "80MM" ? "9px" : "11px" }}>FACTURA #</span>
              <span style={{ fontSize: config.format === "80MM" ? "9px" : "11px" }}>INV-00000001</span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: config.format === "80MM" ? "9px" : "11px" }}>FECHA:</span>
              <span style={{ fontSize: config.format === "80MM" ? "9px" : "11px" }}>
                {new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: config.format === "80MM" ? "9px" : "11px" }}>PACIENTE:</span>
              <span style={{ fontSize: config.format === "80MM" ? "9px" : "11px" }}>Juan Pérez</span>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-300 my-3"></div>

          {/* Detalles de servicios */}
          <div className="space-y-2">
          <div className="text-left font-semibold" style={{ fontSize: config.format === "80MM" ? "11px" : "12px" }}>
            DETALLES DE SERVICIOS
          </div>
            
            {/* Diseño vertical ultra-compacto para 80mm */}
            {config.format === "80MM" ? (
              <div className="space-y-1">
                {/* Servicio 1 - Con seguro */}
                <div className="border border-gray-300 p-1.5 bg-gray-50 rounded text-base">
                  <div className="font-bold text-base border-b border-gray-400 pb-1 mb-1">
                    Consulta General
                  </div>
                  <div className="flex justify-between text-base text-gray-600 mb-1">
                    <span>Cant:1</span>
                    <span>Precio:$50</span>
                    <span>Cob:80%</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-gray-400 pt-1">
                    <span>Seg:$40</span>
                    <span className="text-red-600">Pac:$10</span>
                  </div>
                </div>

                {/* Servicio 2 - Sin seguro */}
                <div className="border border-gray-300 p-1.5 bg-gray-50 rounded text-base">
                  <div className="font-bold text-base border-b border-gray-400 pb-1 mb-1">
                    Análisis de Sangre
                  </div>
                  <div className="flex justify-between text-base text-gray-600 mb-1">
                    <span>Cant:1</span>
                    <span>Precio:$30</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-gray-400 pt-1">
                    <span>Total:</span>
                    <span className="text-red-600">$30</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Consulta General</span>
                  <span>$50.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Análisis de Sangre</span>
                  <span>$30.00</span>
                </div>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-300 my-3"></div>

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold">
              <span style={{ fontSize: config.format === "80MM" ? "10px" : "12px" }}>TOTAL:</span>
              <span style={{ fontSize: config.format === "80MM" ? "10px" : "12px" }}>$80.00</span>
            </div>
          </div>

          {/* Mensaje personalizado */}
          {config.customMessage && (
            <>
              <div className="border-t border-gray-300 my-3"></div>
              <div className="text-center">
                <p 
                  className="text-gray-600 italic"
                  style={{ fontSize: config.format === "80MM" ? "8px" : "10px" }}
                >
                  {config.customMessage}
                </p>
              </div>
            </>
          )}

          {/* Pie de página */}
          <div className="border-t border-gray-300 my-3"></div>
          <div className="text-center">
            <p 
              className="text-gray-500"
              style={{ fontSize: config.format === "80MM" ? "7px" : "9px" }}
            >
              Gracias por su preferencia
            </p>
            <p 
              className="text-gray-500"
              style={{ fontSize: config.format === "80MM" ? "7px" : "9px" }}
            >
              {new Date().toLocaleDateString('es-ES')} - {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
