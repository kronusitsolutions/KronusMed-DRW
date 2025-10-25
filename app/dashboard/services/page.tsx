"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

// Icons
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  DollarSign, 
  Activity, 
  Tag,
  TrendingUp,
  Package,
  Settings
} from 'lucide-react'

// Custom Components
import { PaginatedServiceList } from '@/components/services/paginated-service-list'
import { useServicesPagination, Service } from '@/hooks/use-services-pagination'

// Form handling
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

const serviceSchema = z.object({
  name: z.string().min(1, "El nombre del servicio es requerido"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0"),
  priceType: z.enum(["FIXED", "DYNAMIC"]).default("FIXED"),
  category: z.string().optional(),
  isActive: z.boolean().default(true)
})

type ServiceForm = z.infer<typeof serviceSchema>

interface ServiceStats {
  totalServices: number
  activeServices: number
  inactiveServices: number
  categories: string[]
  priceStats: {
    average: number
    min: number
    max: number
  }
  mostUsedServices: Array<{
    name: string
    price: number
    category: string | null
    usageCount: number
  }>
  totalRevenue: number
}

export default function ServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Hook de paginación para servicios
  const {
    services,
    pagination,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    refetch,
    refetchAndGoToFirstPage
  } = useServicesPagination(20)

  // Estados para estadísticas globales
  const [globalStats, setGlobalStats] = useState<ServiceStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Estados para diálogos
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema)
  })

  // Función para obtener estadísticas globales
  const fetchGlobalStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetch('/api/services/stats')
      if (response.ok) {
        const stats = await response.json()
        setGlobalStats(stats)
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

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
      fetchGlobalStats()
    }
  }, [session, status, router])

  const handleCreateService = async (data: ServiceForm) => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success("Servicio creado exitosamente")
        setIsAddDialogOpen(false)
        reset()
        
        // Actualizar la lista de servicios y ir a la primera página
        // para mostrar el servicio recién creado
        await refetchAndGoToFirstPage()
        
        // Actualizar estadísticas globales
        await fetchGlobalStats()
        
        // Forzar una segunda actualización después de un breve delay
        // para asegurar que el caché se haya invalidado
        setTimeout(async () => {
          await refetchAndGoToFirstPage()
        }, 500)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al crear el servicio")
      }
    } catch (error) {
      console.error("Error al crear servicio:", error)
      toast.error("Error al crear el servicio")
    }
  }

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setValue('name', service.name)
    setValue('description', service.description || '')
    setValue('price', service.price)
    setValue('priceType', service.priceType || 'FIXED')
    setValue('category', service.category || '')
    setValue('isActive', service.isActive)
    setIsEditDialogOpen(true)
  }

  const handleUpdateService = async (data: ServiceForm) => {
    if (!selectedService) return

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success("Servicio actualizado exitosamente")
        setIsEditDialogOpen(false)
        setSelectedService(null)
        reset()
        
        // Actualizar la lista de servicios inmediatamente
        await refetch()
        
        // Actualizar estadísticas globales
        await fetchGlobalStats()
        
        // Forzar una segunda actualización después de un breve delay
        setTimeout(async () => {
          await refetch()
        }, 500)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al actualizar el servicio")
      }
    } catch (error) {
      console.error("Error al actualizar servicio:", error)
      toast.error("Error al actualizar el servicio")
    }
  }

  const handleDeleteService = async (service: Service) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Servicio eliminado exitosamente")
        
        // Actualizar la lista de servicios inmediatamente
        await refetch()
        
        // Actualizar estadísticas globales
        await fetchGlobalStats()
        
        // Forzar una segunda actualización después de un breve delay
        setTimeout(async () => {
          await refetch()
        }, 500)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al eliminar el servicio")
      }
    } catch (error) {
      console.error("Error al eliminar servicio:", error)
      toast.error("Error al eliminar el servicio")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMigrateIds = async () => {
    try {
      setIsMigrating(true)
      const response = await fetch('/api/services/migrate-ids', {
        method: 'POST'
      })

      if (response.ok) {
        toast.success("IDs migrados exitosamente")
        await refetch()
        await fetchGlobalStats()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al migrar IDs")
      }
    } catch (error) {
      toast.error("Error al migrar IDs")
    } finally {
      setIsMigrating(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Servicios</h1>
          <p className="text-muted-foreground">
            Administrar servicios médicos disponibles en la clínica
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleMigrateIds}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : (
              "Migrar IDs"
            )}
          </Button>
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Estadísticas Globales */}
      {globalStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                {globalStats.activeServices} activos, {globalStats.inactiveServices} inactivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{globalStats.activeServices}</div>
              <p className="text-xs text-muted-foreground">
                {((globalStats.activeServices / globalStats.totalServices) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(globalStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Generados por servicios
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Servicios Más Utilizados */}
      {globalStats && globalStats.mostUsedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Servicios Más Utilizados</CardTitle>
            <CardDescription>
              Los servicios con mayor demanda en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {globalStats.mostUsedServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.category && (
                        <p className="text-sm text-muted-foreground">{service.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(service.price)}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.usageCount} usos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            Gestiona todos los servicios médicos disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaginatedServiceList
            services={services}
            pagination={pagination}
            isLoading={isLoading}
            error={error}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onPageChange={(page) => {
              // El hook maneja la paginación automáticamente
            }}
            onLimitChange={(limit) => {
              // El hook maneja el cambio de límite automáticamente
            }}
            onEditService={handleEditService}
            onDeleteService={handleDeleteService}
            onRefetch={refetch}
          />
        </CardContent>
      </Card>

      {/* Diálogo para Agregar Servicio */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo Servicio</DialogTitle>
            <DialogDescription>
              Agrega un nuevo servicio médico al sistema
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateService)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Servicio</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej: Consulta General"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descripción del servicio..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceType">Tipo de Precio</Label>
              <select
                id="priceType"
                {...register('priceType')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FIXED">Precio Fijo</option>
                <option value="DYNAMIC">Precio Dinámico</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio {watch('priceType') === 'DYNAMIC' ? '(Referencial)' : ''}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { valueAsNumber: true })}
                  placeholder={watch('priceType') === 'DYNAMIC' ? "0.00 (opcional)" : "0.00"}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
                {watch('priceType') === 'DYNAMIC' && (
                  <p className="text-xs text-gray-500">
                    Para servicios dinámicos, el precio se establece al momento de facturar
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="Ej: Consulta"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="rounded"
              />
              <Label htmlFor="isActive">Servicio activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Servicio</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Servicio */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>
              Modifica la información del servicio seleccionado
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleUpdateService)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Servicio</Label>
              <Input
                id="edit-name"
                {...register('name')}
                placeholder="Ej: Consulta General"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción (Opcional)</Label>
              <Textarea
                id="edit-description"
                {...register('description')}
                placeholder="Descripción del servicio..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priceType">Tipo de Precio</Label>
              <select
                id="edit-priceType"
                {...register('priceType')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FIXED">Precio Fijo</option>
                <option value="DYNAMIC">Precio Dinámico</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">
                  Precio {watch('priceType') === 'DYNAMIC' ? '(Referencial)' : ''}
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { valueAsNumber: true })}
                  placeholder={watch('priceType') === 'DYNAMIC' ? "0.00 (opcional)" : "0.00"}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
                {watch('priceType') === 'DYNAMIC' && (
                  <p className="text-xs text-gray-500">
                    Para servicios dinámicos, el precio se establece al momento de facturar
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Input
                  id="edit-category"
                  {...register('category')}
                  placeholder="Ej: Consulta"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                {...register('isActive')}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Servicio activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar Servicio</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
