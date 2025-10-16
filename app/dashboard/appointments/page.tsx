"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { extractAppointmentsFromResponse } from "@/lib/api-utils"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, Clock, User, Search, Edit, Trash2, Eye, CalendarCheck, UserCheck, AlertCircle, CheckCircle, XCircle, Loader2, X } from 'lucide-react'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { OptimizedPatientSearchModal } from "@/components/billing/optimized-patient-search-modal"

const appointmentSchema = z.object({
  patientId: z.string().min(1, "El paciente es requerido"),
  doctorId: z.string().optional(),           // Para usuarios con rol DOCTOR (legacy)
  doctorProfileId: z.string().optional(),    // Para doctores virtuales (nuevo)
  serviceId: z.string().optional().or(z.literal("")).or(z.literal("none")),
  date: z.string().min(1, "La fecha es requerida"),
  reason: z.string().min(1, "El motivo de la cita es requerido"),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).default("SCHEDULED")
}).refine(data => data.doctorId || data.doctorProfileId, {
  message: "Debe seleccionar un doctor",
  path: ["doctorId"]
})

type AppointmentForm = z.infer<typeof appointmentSchema>

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const [appointments, setAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para búsqueda simple de pacientes
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const [showPatientResults, setShowPatientResults] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema)
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    setValue: setValueEdit
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema)
  })

  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    control: controlStatus,
    formState: { errors: errorsStatus },
    reset: resetStatus,
    setValue: setValueStatus
  } = useForm<{ status: string }>({
    resolver: zodResolver(z.object({
      status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    }))
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchAppointments()
      fetchPatients()
      fetchDoctors()
      fetchServices()
    }
  }, [session, status, router])

  const fetchAppointments = async () => {
    try {
      setIsLoading(true)
      let url = "/api/appointments"
      const params = new URLSearchParams()
      
      if (dateFilter) params.append("date", dateFilter)
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter)
      
      if (params.toString()) {
        url += "?" + params.toString()
      }

      const response = await fetch(url, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        const appointments = extractAppointmentsFromResponse(data)
        setAppointments(appointments)
      }
    } catch (error) {
      console.error("Error al cargar citas:", error)
      toast.error("Error al cargar citas")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      if (response.ok) {
        const data = await response.json()
        setPatients(data.filter((p: any) => p.status === "ACTIVE"))
      }
    } catch (error) {
      console.error("Error al cargar pacientes:", error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors")
      if (response.ok) {
        const data = await response.json()
        setDoctors(data)
      }
    } catch (error) {
      console.error("Error al cargar doctores:", error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services?limit=250")
      if (response.ok) {
        const data = await response.json()
        const services = data.services || data // Compatibilidad con formato anterior
        setServices(services.filter((s: any) => s.isActive))
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    }
  }

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient)
    setValue("patientId", patient.id)
    setIsPatientSearchOpen(false)
  }

  const handleOpenPatientSearch = () => {
    setIsPatientSearchOpen(true)
  }

  // Búsqueda simple de pacientes
  const searchPatients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPatientSearchResults([])
      setShowPatientResults(false)
      return
    }

    try {
      setIsSearchingPatients(true)
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const patientsData = data.patients || data
        setPatientSearchResults(patientsData)
        setShowPatientResults(true)
      }
    } catch (error) {
      console.error("Error al buscar pacientes:", error)
      setPatientSearchResults([])
    } finally {
      setIsSearchingPatients(false)
    }
  }

  // Debounce para búsqueda de pacientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(patientSearchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [patientSearchTerm])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.patient-search-container')) {
        setShowPatientResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPatientFromSearch = (patient: any) => {
    setSelectedPatient(patient)
    setValue("patientId", patient.id)
    setPatientSearchTerm("")
    setShowPatientResults(false)
  }

  const handleClearPatient = () => {
    setSelectedPatient(null)
    setValue("patientId", "")
    setPatientSearchTerm("")
    setShowPatientResults(false)
  }

  // Filtrar citas
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = searchTerm === "" || 
      appointment.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointment.doctorProfile?.name || appointment.doctor?.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const onSubmit = async (data: AppointmentForm) => {
    setIsLoading(true)
    try {
      // Limpiar serviceId vacío
      const cleanData = {
        ...data,
        serviceId: data.serviceId === "" || data.serviceId === "none" ? undefined : data.serviceId
      }
      
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData)
      })

      if (response.ok) {
        toast.success("Cita creada exitosamente")
        setIsCreateDialogOpen(false)
        reset()
        fetchAppointments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear cita")
      }
    } catch (error) {
      toast.error("Error al crear cita")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitEdit = async (data: AppointmentForm) => {
    if (!selectedAppointment) return
    
    setIsLoading(true)
    try {
      // Limpiar serviceId vacío
      const cleanData = {
        ...data,
        serviceId: data.serviceId === "" || data.serviceId === "none" ? undefined : data.serviceId
      }
      
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData)
      })

      if (response.ok) {
        toast.success("Cita actualizada exitosamente")
        setIsEditDialogOpen(false)
        resetEdit()
        fetchAppointments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar cita")
      }
    } catch (error) {
      toast.error("Error al actualizar cita")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (appointment: any) => {
    setSelectedAppointment(appointment)
    setValueEdit("patientId", appointment.patientId)
    setValueEdit("doctorId", appointment.doctorId)
    setValueEdit("serviceId", appointment.serviceId || "none")
    setValueEdit("date", appointment.date.split('T')[0])
    setValueEdit("reason", appointment.reason)
    setValueEdit("notes", appointment.notes || "")
    setValueEdit("status", appointment.status)
    setIsEditDialogOpen(true)
  }

  const handleView = (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async (appointmentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta cita?")) return

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Cita eliminada exitosamente")
        fetchAppointments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar cita")
      }
    } catch (error) {
      toast.error("Error al eliminar cita")
    }
  }

  const handleStatusChange = (appointment: any) => {
    setSelectedAppointment(appointment)
    setValueStatus("status", appointment.status)
    setIsStatusDialogOpen(true)
  }

  const onSubmitStatus = async (data: { status: string }) => {
    if (!selectedAppointment) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status })
      })

      if (response.ok) {
        toast.success("Estado de cita actualizado exitosamente")
        setIsStatusDialogOpen(false)
        resetStatus()
        fetchAppointments()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al actualizar estado")
      }
    } catch (error) {
      toast.error("Error al actualizar estado")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "CONFIRMED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "Programada"
      case "CONFIRMED":
        return "Confirmada"
      case "IN_PROGRESS":
        return "En Progreso"
      case "COMPLETED":
        return "Completada"
      case "CANCELLED":
        return "Cancelada"
      case "NO_SHOW":
        return "No Asistió"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Calendar className="h-4 w-4" />
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />
      case "COMPLETED":
        return <CalendarCheck className="h-4 w-4" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />
      case "NO_SHOW":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  // Estadísticas rápidas
  const todaysAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0]
    return apt.date.split('T')[0] === today
  })

  const confirmedToday = todaysAppointments.filter(apt => apt.status === "CONFIRMED")
  const pendingToday = todaysAppointments.filter(apt => apt.status === "SCHEDULED")

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
          <p className="text-muted-foreground">
            Programa y gestiona las citas médicas
          </p>
        </div>
        {["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cita</DialogTitle>
              <DialogDescription>
                Programa una nueva cita médica para un paciente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">Paciente</Label>
                  <div className="col-span-3 space-y-3">
                    <Controller
                      name="patientId"
                      control={control}
                      render={({ field }) => (
                        <div className="relative patient-search-container">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar paciente por nombre, teléfono o cédula..."
                              value={patientSearchTerm}
                              onChange={(e) => setPatientSearchTerm(e.target.value)}
                              className="pl-10 pr-4"
                            />
                            {isSearchingPatients && (
                              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Resultados de búsqueda */}
                          {showPatientResults && patientSearchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {patientSearchResults.map((patient) => (
                                <div
                                  key={patient.id}
                                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                  onClick={() => handleSelectPatientFromSearch(patient)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">{patient.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {patient.patientNumber && `#${patient.patientNumber}`}
                                        {patient.phone && ` • ${patient.phone}`}
                                        {patient.cedula && ` • Cédula: ${patient.cedula}`}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Paciente seleccionado */}
                          {selectedPatient && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm text-blue-900">Paciente seleccionado:</div>
                                  <div className="text-sm text-blue-700">
                                    {selectedPatient.name}
                                    {selectedPatient.patientNumber && ` (${selectedPatient.patientNumber})`}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleClearPatient}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Sin resultados */}
                          {showPatientResults && patientSearchResults.length === 0 && patientSearchTerm.trim() && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                              <div className="text-sm text-gray-500 text-center">
                                No se encontraron pacientes
                              </div>
                            </div>
                          )}
                          
                          <input
                            type="hidden"
                            {...field}
                          />
                        </div>
                      )}
                    />
                    {errors.patientId && (
                      <p className="text-sm text-red-500 mt-1">{errors.patientId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="doctorId" className="text-right">
                    Doctor *
                  </Label>
                  <div className="col-span-3">
                    <Controller
                      name="doctorId"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={(value) => {
                            const [type, id] = value.split(":")
                            if (type === "user") {
                              setValue("doctorId", id)
                              setValue("doctorProfileId", undefined)
                            } else {
                              setValue("doctorProfileId", id)
                              setValue("doctorId", undefined)
                            }
                            field.onChange(value)
                          }} 
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem 
                                key={`${doctor.type}:${doctor.id}`} 
                                value={`${doctor.type}:${doctor.id}`}
                              >
                                {doctor.name}
                                {doctor.specialization && ` - ${doctor.specialization}`}
                                {doctor.type === "user" && " (Con cuenta)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.doctorId && (
                      <p className="text-sm text-red-500 mt-1">{errors.doctorId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serviceId" className="text-right">
                    Servicio
                  </Label>
                  <div className="col-span-3">
                    <Controller
                      name="serviceId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un servicio (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin servicio específico</SelectItem>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - ${service.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Fecha
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="date"
                      type="date"
                      {...register("date")}
                      className={errors.date ? "border-red-500" : ""}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
                    )}
                  </div>
                </div>


                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reason" className="text-right">
                    Motivo
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="reason"
                      placeholder="Motivo de la cita"
                      {...register("reason")}
                      className={errors.reason ? "border-red-500" : ""}
                    />
                    {errors.reason && (
                      <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notas
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="notes"
                      placeholder="Notas adicionales (opcional)"
                      {...register("notes")}
                    />
                  </div>
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
                    "Crear Cita"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas de Hoy</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedToday.length} confirmadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedToday.length}</div>
            <p className="text-xs text-muted-foreground">
              de {todaysAppointments.length} programadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingToday.length}</div>
            <p className="text-xs text-muted-foreground">
              esperando confirmación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por paciente, doctor o motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SCHEDULED">Programada</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="NO_SHOW">No Asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchAppointments} 
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Citas</CardTitle>
          <CardDescription>
            Gestiona todas las citas médicas programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha & Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {new Date(appointment.date).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{appointment.patient?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.patient?.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.doctorProfile?.name || appointment.doctor?.name}
                      {appointment.doctorProfile?.specialization && (
                        <div className="text-xs text-muted-foreground">
                          {appointment.doctorProfile.specialization}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {appointment.reason}
                    </TableCell>
                    <TableCell>
                      {appointment.service?.name || "Sin servicio"}
                    </TableCell>
                    <TableCell>
                      {["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role) ? (
                        <Button
                          variant="ghost"
                          className={`p-0 h-auto ${getStatusColor(appointment.status)} hover:opacity-80`}
                          onClick={() => handleStatusChange(appointment)}
                          title="Cambiar estado"
                        >
                          <Badge className={`${getStatusColor(appointment.status)} cursor-pointer`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(appointment.status)}
                              {getStatusText(appointment.status)}
                            </div>
                          </Badge>
                        </Button>
                      ) : (
                        <Badge className={`${getStatusColor(appointment.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(appointment.status)}
                            {getStatusText(appointment.status)}
                          </div>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(appointment)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {["ADMIN", "DOCTOR", "BILLING"].includes(session.user.role) && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(appointment)}
                              title="Editar cita"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(appointment.id)}
                              title="Eliminar cita"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAppointments.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter || dateFilter ? 
                        'No se encontraron citas que coincidan con los filtros' : 
                        'No hay citas registradas'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Cita</DialogTitle>
            <DialogDescription>
              Cambiar el estado de la cita para {selectedAppointment?.patient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStatus(onSubmitStatus)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Estado
                </Label>
                <div className="col-span-3">
                  <Controller
                    name="status"
                    control={controlStatus}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Programada
                            </div>
                          </SelectItem>
                          <SelectItem value="CONFIRMED">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Confirmada
                            </div>
                          </SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              En Progreso
                            </div>
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            <div className="flex items-center gap-2">
                              <CalendarCheck className="h-4 w-4" />
                              Completada
                            </div>
                          </SelectItem>
                          <SelectItem value="CANCELLED">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              Cancelada
                            </div>
                          </SelectItem>
                          <SelectItem value="NO_SHOW">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              No Asistió
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsStatus.status && (
                    <p className="text-sm text-red-500 mt-1">{errorsStatus.status.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Estado"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la cita médica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-patientId" className="text-right">
                  Paciente
                </Label>
                <div className="col-span-3">
                  <Controller
                    name="patientId"
                    control={controlEdit}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un paciente" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} - {patient.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsEdit.patientId && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.patientId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-doctorId" className="text-right">
                  Doctor
                </Label>
                <div className="col-span-3">
                  <Controller
                    name="doctorId"
                    control={controlEdit}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsEdit.doctorId && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.doctorId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-serviceId" className="text-right">
                  Servicio
                </Label>
                <div className="col-span-3">
                  <Controller
                    name="serviceId"
                    control={controlEdit}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un servicio (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin servicio específico</SelectItem>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date" className="text-right">
                  Fecha
                </Label>
                <div className="col-span-3">
                  <Input
                    id="edit-date"
                    type="date"
                    {...registerEdit("date")}
                    className={errorsEdit.date ? "border-red-500" : ""}
                  />
                  {errorsEdit.date && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.date.message}</p>
                  )}
                </div>
              </div>


              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-reason" className="text-right">
                  Motivo
                </Label>
                <div className="col-span-3">
                  <Input
                    id="edit-reason"
                    placeholder="Motivo de la cita"
                    {...registerEdit("reason")}
                    className={errorsEdit.reason ? "border-red-500" : ""}
                  />
                  {errorsEdit.reason && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.reason.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Notas
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="edit-notes"
                    placeholder="Notas adicionales (opcional)"
                    {...registerEdit("notes")}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Cita"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la cita médica
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Paciente</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.patient?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.patient?.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Doctor</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.doctor?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Fecha</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.date).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Motivo</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.reason}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Servicio</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.service?.name || "Sin servicio específico"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Estado</Label>
                <Badge className={getStatusColor(selectedAppointment.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedAppointment.status)}
                    {getStatusText(selectedAppointment.status)}
                  </div>
                </Badge>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium">Notas</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de búsqueda de pacientes */}
      <OptimizedPatientSearchModal
        isOpen={isPatientSearchOpen}
        onClose={() => setIsPatientSearchOpen(false)}
        onSelectPatient={handleSelectPatient}
        selectedPatientId={selectedPatient?.id}
      />
    </div>
  )
}
