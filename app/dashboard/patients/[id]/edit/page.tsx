"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  User,
  Calendar,
  Phone,
  MapPin,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { calculateAge, getFormBirthDate, parseFormDate } from "@/lib/age-utils"

const patientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
  age: z.number().min(0, "La edad debe ser mayor a 0").optional(),
  gender: z.enum(["MALE", "FEMALE"], {
    required_error: "El género es requerido"
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  cedula: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"], {
    required_error: "El estado es requerido"
  }),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalHistory: z.string().optional()
})

type PatientForm = z.infer<typeof patientSchema>

interface Patient {
  id: string
  patientNumber: string
  name: string
  age?: number | null
  birthDate?: string | null
  gender: string
  phone?: string | null
  address?: string | null
  nationality?: string | null
  cedula?: string | null
  status: string
  bloodType?: string | null
  allergies?: string | null
  emergencyContact?: string | null
  medicalHistory?: string | null
  createdAt: string
  updatedAt: string
}

export default function EditPatientPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      status: "ACTIVE"
    }
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    
    // Verificar que el usuario tenga permisos de ADMIN o DOCTOR
    if (status === "authenticated" && session?.user?.role && !['ADMIN', 'DOCTOR'].includes(session.user.role)) {
      toast.error("No tienes permisos para editar pacientes")
      router.push("/dashboard/patients")
      return
    }
    
    // Verificación específica para rol de FACTURACIÓN
    if (status === "authenticated" && session?.user?.role === 'BILLING') {
      toast.error("El rol de Facturación no tiene permisos para editar pacientes")
      router.push("/dashboard/patients")
      return
    }
  }, [status, router, session])

  useEffect(() => {
    if (patientId && status === "authenticated") {
      fetchPatient()
    }
  }, [patientId, status])

  const fetchPatient = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Paciente no encontrado")
        } else {
          setError("Error al cargar el paciente")
        }
        return
      }

      const data = await response.json()
      setPatient(data)

      // Llenar el formulario con los datos del paciente
      reset({
        name: data.name,
        birthDate: getFormBirthDate(data.birthDate, data.age),
        gender: data.gender as "MALE" | "FEMALE",
        phone: data.phone || "",
        address: data.address || "",
        nationality: data.nationality || "",
        cedula: data.cedula || "",
        status: data.status as "ACTIVE" | "INACTIVE",
        bloodType: data.bloodType || "",
        allergies: data.allergies || "",
        emergencyContact: data.emergencyContact || "",
        medicalHistory: data.medicalHistory || ""
      })
    } catch (err) {
      console.error("Error fetching patient:", err)
      setError("Error al cargar el paciente")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: PatientForm) => {
    try {
      setIsSubmitting(true)

      // Convertir fecha de nacimiento a Date y calcular edad
      const birthDate = parseFormDate(data.birthDate)
      const age = calculateAge(birthDate)

      const patientData = {
        ...data,
        birthDate: birthDate.toISOString(),
        age: age // Mantener compatibilidad con datos existentes
      }

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el paciente')
      }

      toast.success("Paciente actualizado exitosamente")
      router.push(`/dashboard/patients/${patientId}/history`)
    } catch (err) {
      console.error("Error updating patient:", err)
      toast.error(err instanceof Error ? err.message : "Error al actualizar el paciente")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando paciente...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar el paciente
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => fetchPatient()} variant="outline">
              Reintentar
            </Button>
            <Button onClick={() => router.back()} variant="outline">
              Volver
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Paciente no encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            El paciente solicitado no existe o no tienes permisos para verlo.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Editar Paciente
            </h1>
            <p className="text-muted-foreground">
              Modificar información del paciente {patient.name}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input 
                  id="name" 
                  {...register("name")}
                  placeholder="Nombre completo del paciente"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                <Input 
                  id="birthDate" 
                  type="date" 
                  {...register("birthDate")}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthDate && (
                  <p className="text-sm text-red-600">{errors.birthDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Género *</Label>
                <Select {...register("gender")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Masculino</SelectItem>
                    <SelectItem value="FEMALE">Femenino</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select {...register("status")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    {...register("phone")}
                    placeholder="Número de teléfono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                  <Input 
                    id="emergencyContact" 
                    {...register("emergencyContact")}
                    placeholder="Contacto de emergencia"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea 
                    id="address" 
                    {...register("address")}
                    placeholder="Dirección completa"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Información personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidad</Label>
                  <Input 
                    id="nationality" 
                    {...register("nationality")}
                    placeholder="Nacionalidad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input 
                    id="cedula" 
                    {...register("cedula")}
                    placeholder="Número de cédula"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Grupo Sanguíneo</Label>
                  <Input 
                    id="bloodType" 
                    {...register("bloodType")}
                    placeholder="Ej: O+, A-, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Alergias</Label>
                  <Input 
                    id="allergies" 
                    {...register("allergies")}
                    placeholder="Alergias conocidas"
                  />
                </div>
              </div>
            </div>

            {/* Antecedentes médicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Antecedentes Médicos
              </h3>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Historial Médico</Label>
                <Textarea 
                  id="medicalHistory" 
                  {...register("medicalHistory")}
                  placeholder="Antecedentes médicos, cirugías, enfermedades crónicas, etc."
                  rows={4}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
