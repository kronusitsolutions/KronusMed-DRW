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
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Shield, Users, UserCheck, Loader2 } from 'lucide-react'
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

const userSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "DOCTOR", "BILLING"])
})

type UserForm = z.infer<typeof userSchema>

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    email: "admin@clinic.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2024-01-15"
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    email: "doctor@clinic.com",
    role: "Doctor",
    status: "Active",
    lastLogin: "2024-01-14"
  },
  {
    id: 3,
    name: "Lisa Rodriguez",
    email: "billing@clinic.com",
    role: "Billing",
    status: "Active",
    lastLogin: "2024-01-13"
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    email: "james.wilson@clinic.com",
    role: "Doctor",
    status: "Inactive",
    lastLogin: "2024-01-10"
  },
]

export default function UsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema)
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: errorsEdit }
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema)
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session && session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    if (session) {
      fetchUsers()
    }
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error("Error al cargar usuarios")
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      toast.error("Error de conexión al cargar usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: UserForm) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success("Usuario creado exitosamente")
        setIsAddDialogOpen(false)
        reset()
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al crear usuario")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error al crear usuario")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitEdit = async (data: UserForm) => {
    if (!editingUser) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success("Usuario actualizado exitosamente")
        setIsEditDialogOpen(false)
        resetEdit()
        setEditingUser(null)
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al actualizar usuario")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error al actualizar usuario")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: any) => {
    setEditingUser(user)
    resetEdit({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "" // No mostrar contraseña actual
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Usuario eliminado exitosamente")
        fetchUsers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al eliminar usuario")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error al eliminar usuario")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "DOCTOR":
        return "bg-blue-100 text-blue-800"
      case "BILLING":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div>Acceso denegado. Solo los administradores pueden acceder a la gestión de usuarios.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios del sistema y sus permisos
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Crear una nueva cuenta de usuario con permisos apropiados.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nombre
                    </Label>
                    <div className="col-span-3">
                      <Input {...register("name")} className="col-span-3" />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <div className="col-span-3">
                      <Input {...register("email")} type="email" className="col-span-3" />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Contraseña
                    </Label>
                    <div className="col-span-3">
                      <Input {...register("password")} type="password" className="col-span-3" />
                      {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Rol
                    </Label>
                    <div className="col-span-3">
                      <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Administrador</SelectItem>
                              <SelectItem value="DOCTOR">Doctor</SelectItem>
                              <SelectItem value="BILLING">Facturación</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.role && (
                        <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
                      )}
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
                    "Agregar Usuario"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.role === "ADMIN").length} administradores
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === "ADMIN").length}
            </div>
            <p className="text-xs text-muted-foreground">Administradores del sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === "DOCTOR").length}</div>
            <p className="text-xs text-muted-foreground">Doctores registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Administra cuentas de usuario y sus permisos de acceso
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role === "ADMIN" ? "Administrador" :
                           user.role === "DOCTOR" ? "Doctor" :
                           user.role === "BILLING" ? "Facturación" : user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualizar información del usuario y permisos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <div className="col-span-3">
                  <Input
                    {...registerEdit("name")}
                    className="col-span-3"
                  />
                  {errorsEdit.name && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.name.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <div className="col-span-3">
                  <Input
                    {...registerEdit("email")}
                    type="email"
                    className="col-span-3"
                  />
                  {errorsEdit.email && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Nueva Contraseña
                </Label>
                <div className="col-span-3">
                  <Input
                    {...registerEdit("password")}
                    type="password"
                    className="col-span-3"
                    placeholder="Dejar vacío para mantener la actual"
                  />
                  {errorsEdit.password && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.password.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Rol
                </Label>
                <div className="col-span-3">
                  <Controller
                    name="role"
                    control={controlEdit}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="BILLING">Facturación</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errorsEdit.role && (
                    <p className="text-sm text-red-500 mt-1">{errorsEdit.role.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
