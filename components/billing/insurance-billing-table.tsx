"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, DollarSign, User } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/insurance-calculator"

interface InsuranceCalculation {
  serviceId: string
  serviceName: string
  basePrice: number
  coveragePercent: number
  insuranceCovers: number
  patientPays: number
  insuranceName?: string
}

interface InsuranceBillingTableProps {
  patientId: string
  services: Array<{ serviceId: string; quantity: number; unitPrice: number }>
  onCalculationChange?: (calculation: any) => void
  selectedInsuranceId?: string | null
}

export function InsuranceBillingTable({ 
  patientId, 
  services, 
  onCalculationChange,
  selectedInsuranceId
}: InsuranceBillingTableProps) {
  const [calculation, setCalculation] = useState<InsuranceCalculation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [patientInsurance, setPatientInsurance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (patientId && services.length > 0 && selectedInsuranceId) {
      // Debounce para evitar demasiadas peticiones
      const timeoutId = setTimeout(() => {
        calculateInsuranceCoverage()
      }, 1000) // Aumentado a 1 segundo

      return () => clearTimeout(timeoutId)
    } else if (patientId && services.length > 0 && !selectedInsuranceId) {
      // Si no hay seguro seleccionado, limpiar cálculos
      setCalculation([])
      setPatientInsurance(null)
      onCalculationChange?.(null)
    }
  }, [patientId, JSON.stringify(services), selectedInsuranceId]) // Usar JSON.stringify para comparación profunda

  const calculateInsuranceCoverage = async () => {
    // Evitar llamadas si ya está cargando
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/insurance/calculate-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          services,
          insuranceId: selectedInsuranceId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCalculation(data.items || [])
        setPatientInsurance(data.items?.[0]?.insuranceName || null)
        onCalculationChange?.(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Error al calcular cobertura")
      }
    } catch (error) {
      console.error("Error al calcular cobertura:", error)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const totalBaseAmount = calculation.reduce((sum, item) => sum + item.basePrice, 0)
  const totalInsuranceCovers = calculation.reduce((sum, item) => sum + item.insuranceCovers, 0)
  const totalPatientPays = calculation.reduce((sum, item) => sum + item.patientPays, 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Calculando cobertura de seguros...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error en cálculo de seguros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!patientInsurance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sin cobertura de seguro
          </CardTitle>
          <CardDescription>
            El paciente no tiene seguro médico asignado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600">
              Los servicios se cobrarán al precio completo
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-h-96 overflow-y-auto">
      <CardHeader className="sticky top-0 bg-white z-10 border-b">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Cálculo de Seguro Médico
        </CardTitle>
        <CardDescription>
          Seguro: <Badge variant="outline">{patientInsurance}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Servicio</TableHead>
                  <TableHead className="text-right min-w-[120px]">Precio Base</TableHead>
                  <TableHead className="text-right min-w-[120px]">Descuento</TableHead>
                  <TableHead className="text-right min-w-[100px]">Cobertura</TableHead>
                  <TableHead className="text-right min-w-[120px]">Seguro Cubre</TableHead>
                  <TableHead className="text-right min-w-[120px]">Paciente Paga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculation.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium min-w-[200px]">
                      {item.serviceName}
                    </TableCell>
                    <TableCell className="text-right min-w-[120px]">
                      {formatCurrency(item.basePrice)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold min-w-[120px]">
                      -{formatCurrency(item.insuranceCovers)}
                    </TableCell>
                    <TableCell className="text-right min-w-[100px]">
                      <Badge variant={item.coveragePercent > 0 ? "default" : "secondary"}>
                        {formatPercentage(item.coveragePercent)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-green-600 min-w-[120px]">
                      {formatCurrency(item.insuranceCovers)}
                    </TableCell>
                    <TableCell className="text-right font-semibold min-w-[120px]">
                      {formatCurrency(item.patientPays)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Base:</span>
                  <span className="font-medium">{formatCurrency(totalBaseAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Descuento Total:</span>
                  <span className="font-medium">-{formatCurrency(totalInsuranceCovers)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Seguro Cubre:</span>
                  <span className="font-medium">{formatCurrency(totalInsuranceCovers)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total a Pagar:</span>
                  <span className="text-blue-600">{formatCurrency(totalPatientPays)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Ahorro:</span>
                  <span className="text-green-600">
                    {formatCurrency(totalBaseAmount - totalPatientPays)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
