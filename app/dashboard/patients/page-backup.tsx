"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { extractPatientsFromResponse } from "@/lib/api-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const patientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  age: z.number().min(0, "La edad debe ser mayor a 0"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional().or(z.literal("")), // Teléfono opcional
  address: z.string().optional().or(z.literal("")),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  cedula: z.string().min(1, "La cédula es requerida"),
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
  age: number
  gender: string
  phone: string
  address?: string
  nationality: string
  cedula: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function PatientsPage() {
  const { data: session, status } = useSession()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false)
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false)
  const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [isDeletingPatient, setIsDeletingPatient] = useState<string | null>(null)
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null)
  const [isUpdatingNote, setIsUpdatingNote] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    control,
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

    if (session && !["ADMIN", "DOCTOR"].includes(session.user.role)) {
      router.push("/dashboard")
      return
    }

    if (session) {
      fetchPatients()
    }
  }, [session, status, router])

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      if (response.ok) {
        const data = await response.json()
        const patients = extractPatientsFromResponse(data)
        setPatients(patients)
      } else {
        toast.error("Error al cargar pacientes")
      }
    } catch (error) {
      console.error("Error al cargar pacientes:", error)
      toast.error("Error al cargar pacientes")
    }
  }

  const onSubmit = async (data: PatientForm) => {
    try {
      setIsLoading(true)
      
      // Limpiar datos antes de enviar
      const cleanData = {
        ...data,
        phone: data.phone || "",
        address: data.address || ""
      }

      console.log("Enviando datos:", cleanData)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData)
      })

      if (response.ok) {
        const newPatient = await response.json()
        setPatients(prev => [newPatient, ...prev])
        setIsAddDialogOpen(false)
        reset()
        toast.success('Paciente agregado exitosamente')
      } else {
        const error = await response.json()
        console.error("Error del servidor:", error)
        toast.error(error.error || 'Error al crear paciente')
      }
    } catch (error) {
      console.error("Error al crear paciente:", error)
      toast.error('Error al crear paciente')
    } finally {
      setIsLoading(false)
    }
  }

  // Función mejorada de búsqueda de pacientes
  const searchPatients = (patients: Patient[], searchTerm: string) => {
    if (!searchTerm.trim()) {
      return patients
    }

    const searchLower = searchTerm.toLowerCase().trim()
    const searchUpper = searchTerm.toUpperCase().trim()
    
    return patients.filter(patient => {
      // Búsqueda por nombre (palabras parciales)
      const nameMatch = patient.name.toLowerCase().includes(searchLower)
      
      // Búsqueda por teléfono (con y sin espacios/guiones)
      const phoneMatch = patient.phone && (
        patient.phone.includes(searchTerm) ||
        patient.phone.replace(/[\s\-\(\)]/g, '').includes(searchTerm.replace(/[\s\-\(\)]/g, ''))
      )
      
      // Búsqueda por número de paciente (más flexible)
      const patientNumberMatch = patient.patientNumber.includes(searchUpper) ||
                                 patient.patientNumber.toLowerCase().includes(searchLower)
      
      // Búsqueda por dirección (opcional)
      const addressMatch = patient.address && patient.address.toLowerCase().includes(searchLower)
      
      // Búsqueda por nacionalidad
      const nationalityMatch = patient.nationality.toLowerCase().includes(searchLower)
      
      // Búsqueda por cédula
      const cedulaMatch = patient.cedula.includes(searchTerm) ||
                         patient.cedula.replace(/[\s\-]/g, '').includes(searchTerm.replace(/[\s\-]/g, ''))
      
      return nameMatch || phoneMatch || patientNumberMatch || addressMatch || nationalityMatch || cedulaMatch
    })
  }

  const filteredPatients = searchPatients(patients, searchTerm)

  // Actualizar contador de resultados
  useEffect(() => {
    setSearchResults(filteredPatients.length)
  }, [filteredPatients])

  // Cargar notas médicas del paciente seleccionado
  const loadMedicalNotes = async (patientId: string) => {
    try {
      setIsLoadingNotes(true)
      const response = await fetch(`/api/medical-notes-fixed?patientId=${patientId}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Error al cargar notas médicas')
      }
      
      const notes = await response.json()
      setMedicalNotes(notes)
    } catch (error) {
      console.error('Error al cargar notas:', error)
      toast.error('Error al cargar notas médicas')
    } finally {
      setIsLoadingNotes(false)
    }
  }

  // Funciones removidas - reemplazadas por funcionalidad de eliminar
  
  const viewMedicalNote = (noteId: string) => {
    const note = medicalNotes.find(n => n.id === noteId)
    if (note) {
      toast.info(`Nota del ${new Date(note.date).toLocaleDateString('es-ES')} - ${note.doctor?.name || 'Doctor'}`)
    }
  }

  const handleDeletePatient = async (patientId: string) => {
    try {
      setIsDeletingPatient(patientId)
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Paciente eliminado exitosamente")
        fetchPatients() // Recargar la lista de pacientes
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

  const handleDeleteMedicalNote = async (noteId: string) => {
    try {
      setIsDeletingNote(noteId)
      const response = await fetch(`/api/medical-notes-fixed/${noteId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Nota médica eliminada exitosamente")
        // Recargar las notas médicas del paciente actual
        if (selectedPatient) {
          await loadMedicalNotes(selectedPatient.id)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar nota médica")
      }
    } catch (error) {
      console.error("Error al eliminar nota médica:", error)
      toast.error("Error al eliminar nota médica")
    } finally {
      setIsDeletingNote(null)
    }
  }

  const editMedicalNote = (note: MedicalNote) => {
    // Prellenar el formulario con los datos de la nota
    resetNote({
      date: new Date(note.date).toISOString().split('T')[0],
      type: note.type as "PRIMERA_CONSULTA" | "SEGUIMIENTO" | "CONTROL" | "URGENCIA",
      notes: note.notes,
      duration: note.duration,
      treatment: note.treatment || "",
      nextAppointment: note.nextAppointment ? new Date(note.nextAppointment).toISOString().split('T')[0] : ""
    })
    
    // Buscar el paciente completo en la lista de pacientes
    const fullPatient = patients.find(p => p.id === note.patientId)
    setSelectedPatient(fullPatient || null)
    
    // Guardar el ID de la nota para la edición
    setSelectedNoteId(note.id)
    setIsEditNoteDialogOpen(true)
  }

  const onSubmitEditNote = async (data: MedicalNoteForm) => {
    try {
      if (!selectedNoteId) {
        toast.error("No se ha seleccionado una nota para editar")
        return
      }

      setIsUpdatingNote("updating")
      
      const noteData = {
        date: data.date,
        type: data.type,
        notes: data.notes,
        duration: data.duration,
        treatment: data.treatment || null,
        nextAppointment: data.nextAppointment || null
      }

      const response = await fetch(`/api/medical-notes-fixed/${selectedNoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      })

      if (response.ok) {
        const updatedNote = await response.json()
        toast.success("Nota médica actualizada exitosamente")
        setIsEditNoteDialogOpen(false)
        resetNote()
        setSelectedNoteId(null)
        
        // Recargar las notas médicas
        if (selectedPatient) {
          await loadMedicalNotes(selectedPatient.id)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar nota médica")
      }
    } catch (error) {
      console.error("Error al actualizar nota médica:", error)
      toast.error("Error al actualizar nota médica")
    } finally {
      setIsUpdatingNote(null)
    }
  }

  const editPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    // Prellenar el formulario con los datos del paciente
    reset({
      name: patient.name,
      age: patient.age,
      gender: patient.gender as "MALE" | "FEMALE",
      phone: patient.phone || "",
      address: patient.address || "",
      nationality: patient.nationality,
      cedula: patient.cedula,
      status: patient.status as "ACTIVE" | "INACTIVE"
    })
    setIsEditDialogOpen(true)
  }

  const onSubmitEdit = async (data: PatientForm) => {
    try {
      if (!selectedPatient) {
        toast.error("No se ha seleccionado un paciente")
        return
      }

      setIsLoading(true)
      
      // Limpiar datos antes de enviar
      const cleanData = {
        ...data,
        phone: data.phone || "",
        address: data.address || ""
      }

      console.log("Enviando datos de edición:", cleanData)

      const response = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData)
      })

      if (response.ok) {
        const updatedPatient = await response.json()
        setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p))
        setIsEditDialogOpen(false)
        setSelectedPatient(null)
        reset()
        toast.success('Paciente actualizado exitosamente')
      } else {
        const error = await response.json()
        console.error("Error del servidor:", error)
        toast.error(error.error || 'Error al actualizar paciente')
      }
    } catch (error) {
      console.error("Error al actualizar paciente:", error)
      toast.error('Error al actualizar paciente')
    } finally {
      setIsLoading(false)
    }
  }

  const saveMedicalHistory = () => {
    // TODO: Implementar guardado de historial médico
    toast.success("Cambios guardados exitosamente")
    setIsHistoryDialogOpen(false)
  }

  const handleAddMedicalNote = () => {
    if (!selectedPatient) {
      toast.error("Debe seleccionar un paciente")
      return
    }
    setIsAddNoteDialogOpen(true)
    resetNote()
  }

  const onSubmitNote = async (data: MedicalNoteForm) => {
    try {
      if (!selectedPatient || !session) {
        toast.error("Debe seleccionar un paciente")
        return
      }

      const noteData = {
        patientId: selectedPatient.id,
        doctorId: session.user.id, // Usar el ID del usuario actual como doctor
        date: data.date,
        type: data.type,
        notes: data.notes,
        duration: data.duration,
        treatment: data.treatment,
        nextAppointment: data.nextAppointment
      }

      const response = await fetch('/api/medical-notes-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear nota médica')
      }

      const newNote = await response.json()
      
      // Actualizar la lista de notas
      setMedicalNotes(prev => [newNote, ...prev])

      setIsAddNoteDialogOpen(false)
      resetNote()
      toast.success("Nota médica agregada exitosamente")
    } catch (error) {
      console.error("Error al agregar nota:", error)
      toast.error(error instanceof Error ? error.message : "Error al agregar nota médica")
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || !["ADMIN", "DOCTOR"].includes(session.user.role)) {
    return <div>Acceso denegado. Solo doctores pueden acceder a los registros de pacientes.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registros de Pacientes</h1>
          <p className="text-muted-foreground">
            Gestionar información de pacientes e historial médico
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                          <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
            <DialogDescription>
              Ingresa la información del paciente para crear un nuevo registro.
            </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="col-span-4 text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Edad
                  </Label>
                  <Input 
                    id="age" 
                    type="number" 
                    className="col-span-3" 
                    {...register("age", { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <p className="col-span-4 text-sm text-red-500">{errors.age.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right">
                    Género
                  </Label>
                  <div className="col-span-3">
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
                  </div>
                  {errors.gender && (
                    <p className="col-span-4 text-sm text-red-500">{errors.gender.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Teléfono (Opcional)
                  </Label>
                  <Input 
                    id="phone" 
                    className="col-span-3" 
                    placeholder="(555) 123-4567"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="col-span-4 text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cedula" className="text-right">
                    Cédula
                  </Label>
                  <Input 
                    id="cedula" 
                    className="col-span-3" 
                    placeholder="12345678901"
                    {...register("cedula")}
                  />
                  {errors.cedula && (
                    <p className="col-span-4 text-sm text-red-500">{errors.cedula.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nationality" className="text-right">
                    Nacionalidad
                  </Label>
                  <Input 
                    id="nationality" 
                    className="col-span-3" 
                    placeholder="Dominicana"
                    {...register("nationality")}
                  />
                  {errors.nationality && (
                    <p className="col-span-4 text-sm text-red-500">{errors.nationality.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Dirección (Opcional)
                  </Label>
                  <Input 
                    id="address" 
                    className="col-span-3" 
                    placeholder="Dirección del paciente"
                    {...register("address")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Agregar Paciente"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal para editar paciente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Modifica la información del paciente {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <Input 
                  id="edit-name" 
                  className="col-span-3" 
                  {...register("name")}
                />
                {errors.name && (
                  <p className="col-span-4 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-age" className="text-right">
                  Edad
                </Label>
                <Input 
                  id="edit-age" 
                  type="number" 
                  className="col-span-3" 
                  {...register("age", { valueAsNumber: true })}
                />
                {errors.age && (
                  <p className="col-span-4 text-sm text-red-500">{errors.age.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-gender" className="text-right">
                  Género
                </Label>
                <div className="col-span-3">
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
                </div>
                {errors.gender && (
                  <p className="col-span-4 text-sm text-red-500">{errors.gender.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Teléfono (Opcional)
                </Label>
                <Input 
                  id="edit-phone" 
                  className="col-span-3" 
                  placeholder="(555) 123-4567"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="col-span-4 text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cedula" className="text-right">
                  Cédula
                </Label>
                <Input 
                  id="edit-cedula" 
                  className="col-span-3" 
                  placeholder="12345678901"
                  {...register("cedula")}
                />
                {errors.cedula && (
                  <p className="col-span-4 text-sm text-red-500">{errors.cedula.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nationality" className="text-right">
                  Nacionalidad
                </Label>
                <Input 
                  id="edit-nationality" 
                  className="col-span-3" 
                  placeholder="Dominicana"
                  {...register("nationality")}
                />
                {errors.nationality && (
                  <p className="col-span-4 text-sm text-red-500">{errors.nationality.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">
                  Dirección (Opcional)
                </Label>
                <Input 
                  id="edit-address" 
                  className="col-span-3" 
                  placeholder="Dirección del paciente"
                  {...register("address")}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Estado
                </Label>
                <div className="col-span-3">
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Activo</SelectItem>
                          <SelectItem value="INACTIVE">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                {errors.status && (
                  <p className="col-span-4 text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
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

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, cédula, nacionalidad, número de paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        {searchTerm && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{searchResults} resultado{searchResults !== 1 ? 's' : ''} encontrado{searchResults !== 1 ? 's' : ''}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            {searchTerm ? (
              <span>
                Mostrando {searchResults} de {patients.length} pacientes
                {searchResults === 0 && " - No se encontraron resultados"}
              </span>
            ) : (
              "Todos los pacientes registrados y su información básica"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Nacionalidad</TableHead>
                <TableHead>Fecha de Ingreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono font-medium">{patient.patientNumber}</TableCell>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>
                    {patient.gender === "MALE" ? "Masculino" : 
                     patient.gender === "FEMALE" ? "Femenino" : "Otro"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{patient.phone || "N/A"}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{patient.cedula}</TableCell>
                  <TableCell className="text-sm">{patient.nationality}</TableCell>
                  <TableCell>
                    {new Date(patient.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"}>
                      {patient.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient)
                          loadMedicalNotes(patient.id)
                          setIsHistoryDialogOpen(true)
                        }}
                        title="Ver historial médico"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => editPatient(patient)}
                        title="Editar paciente"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {session?.user.role === 'ADMIN' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={isDeletingPatient === patient.id}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar paciente"
                            >
                              {isDeletingPatient === patient.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente
                                "{patient.name}" del sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePatient(patient.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? (
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <div className="text-lg font-medium">No se encontraron pacientes</div>
                        <div className="text-sm">
                          No hay pacientes que coincidan con "{searchTerm}"
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchTerm("")}
                          className="mt-2"
                        >
                          Limpiar búsqueda
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        <div className="text-lg font-medium">No hay pacientes registrados</div>
                        <div className="text-sm">
                          Comienza agregando tu primer paciente
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Medical History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Historial Médico - {selectedPatient?.patientNumber} {selectedPatient?.name}</DialogTitle>
            <DialogDescription>
              Historial médico completo y registros del paciente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Información del Paciente</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Edad:</strong> {selectedPatient?.age}</p>
                  <p><strong>Género:</strong> {selectedPatient?.gender === "MALE" ? "Masculino" : 
                     selectedPatient?.gender === "FEMALE" ? "Femenino" : "Otro"}</p>
                  <p><strong>Teléfono:</strong> {selectedPatient?.phone || "No especificado"}</p>
                  <p><strong>Cédula:</strong> {selectedPatient?.cedula}</p>
                  <p><strong>Nacionalidad:</strong> {selectedPatient?.nationality}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Condición Actual</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Fecha de Ingreso:</strong> {selectedPatient?.createdAt ? 
                     new Date(selectedPatient.createdAt).toLocaleDateString('es-ES') : "No registrada"}</p>
                  <p><strong>Estado:</strong> {selectedPatient?.status === "ACTIVE" ? "Activo" : "Inactivo"}</p>
                </div>
              </div>
            </div>
            

            
                        <div>
              <Label className="text-sm font-medium">Notas Médicas Registradas</Label>
              <div className="mt-2 space-y-3">
                {/* Notas médicas existentes */}
                {medicalNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{note.date}</span>
                        <Badge variant="secondary" className="text-xs">{note.doctor?.name || 'Doctor'}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {note.type === "PRIMERA_CONSULTA" ? "Primera consulta" :
                           note.type === "SEGUIMIENTO" ? "Seguimiento" :
                           note.type === "CONTROL" ? "Control" : "Urgencia"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => viewMedicalNote(note.id)}
                          title="Ver nota completa"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        {["ADMIN", "DOCTOR"].includes(session?.user.role || "") && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                            onClick={() => editMedicalNote(note)}
                            title="Editar nota médica"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {session?.user.role === 'ADMIN' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                disabled={isDeletingNote === note.id}
                                title="Eliminar nota médica"
                              >
                                {isDeletingNote === note.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente esta nota médica del sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMedicalNote(note.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {note.notes}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Duración: {note.duration}</span>
                      {note.treatment && (
                        <>
                          <span>•</span>
                          <span>Tratamiento: {note.treatment}</span>
                        </>
                      )}
                      {note.nextAppointment && (
                        <>
                          <span>•</span>
                          <span>Próxima cita: {note.nextAppointment}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Botón para agregar nueva nota */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <Button variant="outline" onClick={handleAddMedicalNote}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Nueva Nota
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    Registrar nueva nota médica
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={saveMedicalHistory}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar nueva nota médica */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Nota Médica</DialogTitle>
            <DialogDescription>
              Registrar una nueva consulta o nota médica para {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitNote(onSubmitNote)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-date">Fecha de Consulta</Label>
                  <Input
                    id="note-date"
                    type="date"
                    {...registerNote("date")}
                    className="mt-1"
                  />
                  {errorsNote.date && (
                    <p className="text-sm text-red-500 mt-1">{errorsNote.date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="note-type">Tipo de Consulta</Label>
                  <Controller
                    name="type"
                    control={controlNote}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRIMERA_CONSULTA">Primera Consulta</SelectItem>
                          <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                          <SelectItem value="CONTROL">Control</SelectItem>
                          <SelectItem value="URGENCIA">Urgencia</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsNote.type && (
                    <p className="text-sm text-red-500 mt-1">{errorsNote.type.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-duration">Duración</Label>
                  <Input
                    id="note-duration"
                    {...registerNote("duration")}
                    className="mt-1"
                    placeholder="30 min"
                  />
                  {errorsNote.duration && (
                    <p className="text-sm text-red-500 mt-1">{errorsNote.duration.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="note-treatment">Tratamiento (Opcional)</Label>
                  <Input
                    id="note-treatment"
                    {...registerNote("treatment")}
                    className="mt-1"
                    placeholder="Ibuprofeno 400mg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note-notes">Notas Médicas</Label>
                <Textarea
                  id="note-notes"
                  {...registerNote("notes")}
                  className="mt-1"
                  rows={4}
                  placeholder="Describir la consulta, síntomas, diagnóstico y recomendaciones..."
                />
                {errorsNote.notes && (
                  <p className="text-sm text-red-500 mt-1">{errorsNote.notes.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-next-appointment">Próxima Cita (Opcional)</Label>
                  <Input
                    id="note-next-appointment"
                    type="date"
                    {...registerNote("nextAppointment")}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddNoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Agregar Nota
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar nota médica */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Nota Médica</DialogTitle>
            <DialogDescription>
              Modificar la nota médica para {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitNote(onSubmitEditNote)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-note-date">Fecha de Consulta</Label>
                  <Input
                    id="edit-note-date"
                    type="date"
                    {...registerNote("date")}
                    className="mt-1"
                  />
                  {errorsNote.date && (
                    <p className="text-sm text-red-500 mt-1">{errorsNote.date.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-note-type">Tipo de Consulta</Label>
                  <Controller
                    name="type"
                    control={controlNote}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRIMERA_CONSULTA">Primera Consulta</SelectItem>
                          <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                          <SelectItem value="CONTROL">Control</SelectItem>
                          <SelectItem value="URGENCIA">Urgencia</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsNote.type && (
                    <p className="text-sm text-red-500 mt-1">{errorsNote.type.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-note-duration">Duración</Label>
                  <Input
                    id="edit-note-duration"
                    {...registerNote("duration")}
                    className="mt-1"
                    placeholder="30 min"
                  />
                  {errorsNote.duration && (
                    <p className="text-sm text-red-500 mt-1">{errorsNote.duration.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-note-treatment">Tratamiento (Opcional)</Label>
                  <Input
                    id="edit-note-treatment"
                    {...registerNote("treatment")}
                    className="mt-1"
                    placeholder="Ibuprofeno 400mg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-note-notes">Notas Médicas</Label>
                <Textarea
                  id="edit-note-notes"
                  {...registerNote("notes")}
                  className="mt-1"
                  rows={4}
                  placeholder="Describir la consulta, síntomas, diagnóstico y recomendaciones..."
                />
                {errorsNote.notes && (
                  <p className="text-sm text-red-500 mt-1">{errorsNote.notes.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-note-next-appointment">Próxima Cita (Opcional)</Label>
                  <Input
                    id="edit-note-next-appointment"
                    type="date"
                    {...registerNote("nextAppointment")}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdatingNote === "updating"}>
                {isUpdatingNote === "updating" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Nota"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

