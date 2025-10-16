"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, FileText, Upload, Eye, Calendar, Loader2, Trash2, X, Edit } from 'lucide-react'
import { PaginatedPatientList } from '@/components/patients/paginated-patient-list'
import { usePatientsPagination } from '@/hooks/use-patients-pagination'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { calculateAge, getFormBirthDate, parseFormDate, formatAge } from "@/lib/age-utils"

const patientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  birthDate: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional().or(z.literal("")), // Teléfono opcional
  address: z.string().optional().or(z.literal("")),
  nationality: z.string().optional().or(z.literal("")), // Nacionalidad opcional
  cedula: z.string().optional().or(z.literal("")), // Cédula opcional
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
})

type PatientForm = z.infer<typeof patientSchema>

const medicalNoteSchema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  type: z.enum(["PRIMERA_CONSULTA", "SEGUIMIENTO", "CONTROL", "URGENCIA"]),
  notes: z.string().min(1, "Las notas son requeridas"),
  duration: z.string().min(1, "La duración es requerida"),
  treatment: z.string().optional(),
  nextAppointment: z.string().optional()
})

type MedicalNoteForm = z.infer<typeof medicalNoteSchema>

interface MedicalNote {
  id: string
  patientId: string
  doctorId: string
  date: string
  type: string
  notes: string
  duration: string
  treatment?: string
  nextAppointment?: string
  doctor?: {
    id: string
    name: string
    email: string
  }
  patient?: {
    id: string
    name: string
  }
}

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
  createdAt: string
  updatedAt: string
}

export default function PatientsPageWithPagination() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Hook de paginación
  const {
    patients,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    goToPage,
    refetch
  } = usePatientsPagination(20)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false)
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)

  // Selected patient
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])

  // Loading states
  const [isDeletingPatient, setIsDeletingPatient] = useState<string | null>(null)
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null)
  const [isUpdatingNote, setIsUpdatingNote] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors }
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema)
  })

  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    reset: resetNote,
    control: controlNote,
    formState: { errors: errorsNote }
  } = useForm<MedicalNoteForm>({
    resolver: zodResolver(medicalNoteSchema)
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    
    // Verificar permisos específicos para gestión de pacientes
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role
      
      // Solo ADMIN y DOCTOR pueden ver historial médico y editar/eliminar pacientes
      if (userRole === 'BILLING') {
        // FACTURACIÓN solo puede agregar pacientes, no ver historial ni editar/eliminar
        console.log("Usuario de facturación: acceso limitado a gestión de pacientes")
      }
    }
  }, [status, router, session])

  // Cargar notas médicas del paciente seleccionado
  const loadMedicalNotes = async (patientId: string) => {
    try {
      setIsLoadingNotes(true)
      const response = await fetch(`/api/medical-notes?patientId=${patientId}`)
      if (response.ok) {
      const notes = await response.json()
      setMedicalNotes(notes)
      }
    } catch (error) {
      console.error("Error al cargar notas médicas:", error)
    } finally {
      setIsLoadingNotes(false)
    }
  }

  // Handlers para acciones de pacientes
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    loadMedicalNotes(patient.id)
    setIsHistoryDialogOpen(true)
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    reset({
      name: patient.name,
      birthDate: getFormBirthDate(patient.birthDate, patient.age),
      gender: patient.gender as "MALE" | "FEMALE",
      phone: patient.phone || "",
      address: patient.address || "",
      nationality: patient.nationality || "",
      cedula: patient.cedula || "",
      status: patient.status as "ACTIVE" | "INACTIVE"
    })
    setIsEditDialogOpen(true)
  }

  const handleDeletePatient = async (patient: Patient) => {
    try {
      setIsDeletingPatient(patient.id)
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Paciente eliminado exitosamente")
        await refetch() // Recargar la lista
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al eliminar paciente")
      }
    } catch (error) {
      console.error("Error al eliminar paciente:", error)
      toast.error("Error al eliminar paciente")
    } finally {
      setIsDeletingPatient(null)
    }
  }

  const handleViewMedicalNotes = (patient: Patient) => {
    // Navegar a la página de historial del paciente
    router.push(`/dashboard/patients/${patient.id}/history`)
  }

  // Formulario de creación/edición
  const onSubmit = async (data: PatientForm) => {
    try {
      setIsSubmitting(true)
      
      // Convertir fecha de nacimiento a Date y calcular edad
      const birthDate = parseFormDate(data.birthDate)
      const age = calculateAge(birthDate)
      const isMinor = age < 18
      
      // Validar cédula para mayores de edad
      if (!selectedPatient && !isMinor && !data.cedula?.trim()) {
        toast.error("La cédula es obligatoria para pacientes mayores de 18 años")
        setIsSubmitting(false)
        return
      }
      
      const url = selectedPatient ? `/api/patients/${selectedPatient.id}` : '/api/patients'
      const method = selectedPatient ? 'PUT' : 'POST'
      
      const patientData = {
        ...data,
        birthDate: data.birthDate, // Enviar como string directamente
        age: age // Mantener compatibilidad con datos existentes
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      if (response.ok) {
        toast.success(selectedPatient ? "Paciente actualizado exitosamente" : "Paciente creado exitosamente")
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        reset()
        setSelectedPatient(null)
        await refetch() // Recargar la lista
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al procesar la solicitud")
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            {session?.user?.role === 'BILLING' 
              ? "Agrega nuevos pacientes al sistema (acceso limitado para facturación)"
              : "Gestiona la información de tus pacientes con búsqueda y paginación optimizada"
            }
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Paciente</DialogTitle>
            <DialogDescription>
                Agrega un nuevo paciente al sistema con toda su información.
            </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                  <Input 
                    id="name" 
                    {...register("name")}
                      placeholder="Ej: Juan Pérez"
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
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                  {errors.birthDate && (
                      <p className="text-sm text-red-600">{errors.birthDate.message}</p>
                  )}
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Género *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar género" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Masculino</SelectItem>
                            <SelectItem value="FEMALE">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  {errors.gender && (
                      <p className="text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                  <Input 
                    id="phone" 
                    {...register("phone")}
                      placeholder="Ej: 809-123-4567"
                  />
                </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address"
                    {...register("address")}
                    placeholder="Ej: Calle Principal #123, Santo Domingo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidad</Label>
                  <Input 
                    id="nationality" 
                    {...register("nationality")}
                      placeholder="Ej: Dominicana"
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="cedula">
                      Cédula {watch("birthDate") && calculateAge(parseFormDate(watch("birthDate"))) >= 18 ? '*' : ''}
                    </Label>
                  <Input 
                      id="cedula"
                      {...register("cedula")}
                      placeholder={
                        watch("birthDate") && calculateAge(parseFormDate(watch("birthDate"))) < 18
                          ? "Opcional para menores de edad"
                          : "Ej: 12345678901"
                      }
                    />
                    {watch("birthDate") && calculateAge(parseFormDate(watch("birthDate"))) < 18 && (
                      <p className="text-xs text-muted-foreground">
                        ℹ️ La cédula es opcional para menores de edad
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Paciente"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
                Modifica la información del paciente seleccionado.
            </DialogDescription>
          </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre Completo *</Label>
                <Input 
                  id="edit-name" 
                  {...register("name")}
                      placeholder="Ej: Juan Pérez"
                />
                {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-birthDate">Fecha de Nacimiento *</Label>
                <Input 
                  id="edit-birthDate" 
                  type="date" 
                  {...register("birthDate")}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.birthDate && (
                      <p className="text-sm text-red-600">{errors.birthDate.message}</p>
                )}
              </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender">Género *</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar género" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Masculino</SelectItem>
                          <SelectItem value="FEMALE">Femenino</SelectItem>
                          <SelectItem value="OTHER">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                {errors.gender && (
                      <p className="text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Teléfono</Label>
                <Input 
                  id="edit-phone" 
                  {...register("phone")}
                      placeholder="Ej: 809-123-4567"
                />
              </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-address">Dirección</Label>
                <Input 
                    id="edit-address"
                    {...register("address")}
                    placeholder="Ej: Calle Principal #123, Santo Domingo"
                  />
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nationality">Nacionalidad</Label>
                <Input 
                  id="edit-nationality" 
                  {...register("nationality")}
                      placeholder="Ej: Dominicana"
                />
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-cedula">Cédula</Label>
                <Input 
                      id="edit-cedula"
                      {...register("cedula")}
                      placeholder="Ej: 12345678901"
                />
              </div>
              </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Paciente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

        {/* Dialog de Historial Médico */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
              <DialogTitle>Historial Médico - {selectedPatient?.name}</DialogTitle>
            <DialogDescription>
                Registro completo de consultas y tratamientos del paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              {isLoadingNotes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Cargando historial...</span>
                </div>
              ) : medicalNotes.length > 0 ? (
                <div className="space-y-4">
                  {medicalNotes.map((note) => (
                    <Card key={note.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
              <div>
                            <CardTitle className="text-lg">
                              {note.type === "PRIMERA_CONSULTA" && "Primera Consulta"}
                              {note.type === "SEGUIMIENTO" && "Seguimiento"}
                              {note.type === "CONTROL" && "Control"}
                              {note.type === "URGENCIA" && "Urgencia"}
                            </CardTitle>
                            <CardDescription>
                              {new Date(note.date).toLocaleDateString('es-ES')} - {note.duration}
                            </CardDescription>
                </div>
                          <Badge variant="outline">
                            {note.doctor?.name || "Dr. Desconocido"}
                          </Badge>
              </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
              <div>
                            <Label className="text-sm font-medium">Notas:</Label>
                            <p className="text-sm text-muted-foreground">{note.notes}</p>
                </div>
                          {note.treatment && (
                        <div>
                              <Label className="text-sm font-medium">Tratamiento:</Label>
                              <p className="text-sm text-muted-foreground">{note.treatment}</p>
                      </div>
                          )}
                          {note.nextAppointment && (
                            <div>
                              <Label className="text-sm font-medium">Próxima Cita:</Label>
                              <p className="text-sm text-muted-foreground">
                                {new Date(note.nextAppointment).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                      )}
                    </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay notas médicas registradas para este paciente.</p>
              </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </div>

      {/* Lista Paginada de Pacientes */}
      <PaginatedPatientList
        patients={patients}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onPageChange={goToPage}
        onViewPatient={session?.user?.role !== 'BILLING' ? handleViewPatient : undefined}
        onEditPatient={session?.user?.role !== 'BILLING' ? handleEditPatient : undefined}
        onDeletePatient={session?.user?.role !== 'BILLING' ? handleDeletePatient : undefined}
        onViewMedicalNotes={session?.user?.role !== 'BILLING' ? handleViewMedicalNotes : undefined}
        onRefetch={refetch}
      />
    </div>
  )
}
