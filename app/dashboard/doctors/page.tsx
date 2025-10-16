"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, User, Stethoscope, UserPlus } from 'lucide-react'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

const doctorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
})

const convertDoctorSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  generatePassword: z.boolean().optional().default(false)
})

type DoctorForm = z.infer<typeof doctorSchema>
type ConvertDoctorForm = z.infer<typeof convertDoctorSchema>

export default function DoctorsPage() {
  const { data: session } = useSession()
  const [doctors, setDoctors] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema)
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit
  } = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema)
  })

  const {
    register: registerConvert,
    handleSubmit: handleSubmitConvert,
    control: controlConvert,
    formState: { errors: errorsConvert },
    reset: resetConvert,
    watch: watchConvert
  } = useForm<ConvertDoctorForm>({
    resolver: zodResolver(convertDoctorSchema)
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors")
      const data = await response.json()
      setDoctors(data)
    } catch (error) {
      console.error("Error al cargar doctores:", error)
      toast.error("Error al cargar la lista de doctores")
    }
  }

  const onCreateSubmit = async (data: DoctorForm) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error()

      toast.success("Doctor creado exitosamente")
      setIsCreateDialogOpen(false)
      reset()
      fetchDoctors()
    } catch (error) {
      toast.error("Error al crear el doctor")
    } finally {
      setIsLoading(false)
    }
  }

  const onEditSubmit = async (data: DoctorForm) => {
    if (!selectedDoctor) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/doctors/${selectedDoctor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error()

      toast.success("Doctor actualizado exitosamente")
      setIsEditDialogOpen(false)
      setSelectedDoctor(null)
      resetEdit()
      fetchDoctors()
    } catch (error) {
      toast.error("Error al actualizar el doctor")
    } finally {
      setIsLoading(false)
    }
  }

  const onConvertSubmit = async (data: ConvertDoctorForm) => {
    if (!selectedDoctor) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/doctors/${selectedDoctor.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        setIsConvertDialogOpen(false)
        setSelectedDoctor(null)
        resetConvert()
        fetchDoctors()
      } else {
        toast.error(result.error || "Error al convertir doctor")
      }
    } catch (error) {
      toast.error("Error al convertir doctor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (doctor: any) => {
    setSelectedDoctor(doctor)
    resetEdit({
      name: doctor.name,
      specialization: doctor.specialization || "",
      phone: doctor.phone || "",
      email: doctor.email || "",
      notes: doctor.notes || "",
      status: doctor.status
    })
    setIsEditDialogOpen(true)
  }

  const handleConvert = (doctor: any) => {
    setSelectedDoctor(doctor)
    resetConvert({
      email: doctor.email || "",
      password: "",
      generatePassword: false
    })
    setIsConvertDialogOpen(true)
  }

  const handleDelete = async (doctorId: string) => {
    if (!confirm("¿Está seguro de eliminar este doctor?")) return

    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success("Doctor eliminado exitosamente")
      fetchDoctors()
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el doctor")
    }
  }

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p>No tiene permisos para acceder a esta sección</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Doctores</h1>
          <p className="text-muted-foreground">
            Administre los doctores de la clínica (con y sin cuenta de usuario)
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Doctor</DialogTitle>
              <DialogDescription>
                Complete la información del doctor. No es necesario crear una cuenta de usuario.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Especialidad</Label>
                <Input id="specialization" {...register("specialization")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register("phone")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" {...register("notes")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Controller
                  name="status"
                  control={control}
                  defaultValue="ACTIVE"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar Doctor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doctores Registrados</CardTitle>
          <CardDescription>
            Lista de todos los doctores, incluyendo aquellos con y sin cuenta de usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialization || "-"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {doctor.email && <div>{doctor.email}</div>}
                      {doctor.phone && <div>{doctor.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doctor.type === "user" ? (
                      <Badge variant="secondary">
                        <User className="mr-1 h-3 w-3" />
                        Con Cuenta
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Stethoscope className="mr-1 h-3 w-3" />
                        Virtual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={doctor.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {doctor.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doctor.type === "virtual" && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConvert(doctor)}
                          title="Convertir a usuario con cuenta"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doctor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Doctor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input id="edit-name" {...registerEdit("name")} />
              {errorsEdit.name && (
                <p className="text-sm text-red-500">{errorsEdit.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-specialization">Especialidad</Label>
              <Input id="edit-specialization" {...registerEdit("specialization")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" {...registerEdit("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...registerEdit("email")} />
              {errorsEdit.email && (
                <p className="text-sm text-red-500">{errorsEdit.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea id="edit-notes" {...registerEdit("notes")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado</Label>
              <Controller
                name="status"
                control={controlEdit}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Actualizar Doctor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de conversión */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir Doctor Virtual a Usuario</DialogTitle>
            <DialogDescription>
              Crear una cuenta de usuario para {selectedDoctor?.name} con rol DOCTOR.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitConvert(onConvertSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="convert-email">Email *</Label>
              <Input
                id="convert-email"
                type="email"
                {...registerConvert("email")}
                placeholder="email@ejemplo.com"
              />
              {errorsConvert.email && (
                <p className="text-sm text-red-500">{errorsConvert.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-password"
                  {...registerConvert("generatePassword")}
                />
                <Label htmlFor="generate-password">
                  Generar contraseña automáticamente
                </Label>
              </div>
            </div>

            {!watchConvert("generatePassword") && (
              <div className="space-y-2">
                <Label htmlFor="convert-password">Contraseña *</Label>
                <Input
                  id="convert-password"
                  type="password"
                  {...registerConvert("password")}
                  placeholder="Mínimo 6 caracteres"
                />
                {errorsConvert.password && (
                  <p className="text-sm text-red-500">{errorsConvert.password.message}</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Convirtiendo..." : "Convertir a Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
