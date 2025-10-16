"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, User } from "lucide-react"

interface Insurance {
  id: string
  name: string
  description?: string
  isActive: boolean
}

interface PatientInsuranceSelectorProps {
  patientId: string
  currentInsuranceId?: string | null
  onInsuranceChange: (insuranceId: string | null) => void
  disabled?: boolean
}

export function PatientInsuranceSelector({
  patientId,
  currentInsuranceId,
  onInsuranceChange,
  disabled = false
}: PatientInsuranceSelectorProps) {
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsurances()
  }, [])

  const fetchInsurances = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/insurances?isActive=true")
      if (response.ok) {
        const data = await response.json()
        setInsurances(data)
      } else {
        setError("Error al cargar seguros")
      }
    } catch (error) {
      console.error("Error al cargar seguros:", error)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInsuranceChange = (value: string) => {
    if (value === "none") {
      onInsuranceChange(null)
    } else {
      onInsuranceChange(value)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Seguro Médico
        </Label>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-pulse">Cargando seguros...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Seguro Médico
        </Label>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Seguro Médico
      </Label>
      <Select
        value={currentInsuranceId || "none"}
        onValueChange={handleInsuranceChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar seguro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Sin seguro</span>
            </div>
          </SelectItem>
          {insurances.map((insurance) => (
            <SelectItem key={insurance.id} value={insurance.id}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>{insurance.name}</span>
                {insurance.description && (
                  <Badge variant="outline" className="ml-2">
                    {insurance.description}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentInsuranceId && (
        <div className="text-sm text-gray-600">
          <Badge variant="outline">
            {insurances.find(i => i.id === currentInsuranceId)?.name}
          </Badge>
        </div>
      )}
    </div>
  )
}
