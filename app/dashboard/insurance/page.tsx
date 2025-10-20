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
import { Plus, Shield, Settings, Loader2, Edit, Trash2, Copy, Percent, Search } from "lucide-react"
import { toast } from "sonner"

interface Insurance {
  id: string
  name: string
  description?: string
  isActive: boolean
  coverageRules: Array<{
    id: string
    serviceId: string
    coveragePercent: number
    isActive: boolean
    service: {
      id: string
      name: string
      price: number
    }
  }>
  _count: {
    patients: number
  }
}

interface Service {
  id: string
  name: string
  price: number
  priceType?: 'FIXED' | 'DYNAMIC'
  category?: string
}

export default function InsurancePage() {
  const { data: session, status } = useSession()
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCoverageDialogOpen, setIsCoverageDialogOpen] = useState(false)
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceSearchTerm, setServiceSearchTerm] = useState("")
  const router = useRouter()

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true
  })

  // Coverage form states
  const [coverageFormData, setCoverageFormData] = useState({
    selectedServices: [] as Array<{
      serviceId: string
      serviceName: string
      servicePrice: number
      discountAmount: number
      coveragePercent: number
    }>,
    isActive: true
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
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        fetchInsurances(),
        fetchServices()
      ])
    } catch (error) {
      console.error("Error al cargar datos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInsurances = async () => {
    try {
      const response = await fetch("/api/insurances")
      if (response.ok) {
        const data = await response.json()
        setInsurances(data)
      }
    } catch (error) {
      console.error("Error al cargar seguros:", error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services?limit=250")
      if (response.ok) {
        const data = await response.json()
        const services = data.services || data // Compatibilidad con formato anterior
        setServices(services.filter((service: any) => service.isActive))
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    }
  }

  const handleCreateInsurance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/insurances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Seguro creado exitosamente")
        setIsCreateDialogOpen(false)
        setFormData({ name: "", description: "", isActive: true })
        fetchInsurances()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al crear seguro")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error de conexión")
    }
  }

  const handleCreateCoverage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedInsurance) return
    
    if (coverageFormData.selectedServices.length === 0) {
      toast.error("Debe seleccionar al menos un servicio")
      return
    }

    try {
      // Crear reglas de cobertura para cada servicio
      const coveragePromises = coverageFormData.selectedServices.map(service => 
        fetch("/api/insurance-coverage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            insuranceId: selectedInsurance.id,
            serviceId: service.serviceId,
            coveragePercent: service.coveragePercent,
            isActive: true
          })
        })
      )

      const responses = await Promise.all(coveragePromises)
      const failedResponses = responses.filter(response => !response.ok)
      
      if (failedResponses.length === 0) {
        toast.success(`${coverageFormData.selectedServices.length} reglas de cobertura creadas exitosamente`)
        setIsCoverageDialogOpen(false)
        setCoverageFormData({
          selectedServices: [],
          isActive: true
        })
        fetchInsurances()
      } else {
        toast.error(`Error al crear ${failedResponses.length} reglas de cobertura`)
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error de conexión")
    }
  }

  const handleDeleteCoverage = async (ruleId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta regla de cobertura?")) {
      return
    }

    try {
      const response = await fetch(`/api/insurance-coverage/${ruleId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Regla de cobertura eliminada exitosamente")
        fetchInsurances()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar regla de cobertura")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error de conexión")
    }
  }

  const handleDeleteInsurance = async (insuranceId: string, insuranceName: string) => {
    const confirmMessage = `¿Está seguro de que desea eliminar el seguro "${insuranceName}"?\n\nEsta acción eliminará:\n- El seguro médico\n- Todas las reglas de cobertura asociadas\n\nEsta acción no se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/insurances/${insuranceId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message || "Seguro eliminado exitosamente")
        fetchInsurances()
      } else {
        const error = await response.json()
        toast.error(error.error || "Error al eliminar seguro")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      toast.error("Error de conexión")
    }
  }

  const addServiceToForm = (service: Service) => {
    const isAlreadySelected = coverageFormData.selectedServices.some(s => s.serviceId === service.id)
    if (!isAlreadySelected) {
      setCoverageFormData(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, {
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          discountAmount: 0,
          coveragePercent: 0
        }]
      }))
    }
  }

  const removeServiceFromForm = (serviceId: string) => {
    setCoverageFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.serviceId !== serviceId)
    }))
  }

  const updateServiceDiscount = (serviceId: string, discountAmount: number) => {
    setCoverageFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => {
        if (s.serviceId === serviceId) {
          const coveragePercent = s.servicePrice > 0 ? (discountAmount / s.servicePrice) * 100 : 0
          return { ...s, discountAmount, coveragePercent: Math.min(coveragePercent, 100) }
        }
        return s
      })
    }))
  }

  const filteredInsurances = insurances.filter(insurance =>
    insurance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (insurance.description && insurance.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Filtrar servicios para el modal de cobertura
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(serviceSearchTerm.toLowerCase())) ||
    service.id.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  )

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div>Acceso denegado. Solo los administradores pueden acceder a esta página.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Seguros</h1>
          <p className="text-muted-foreground">
            Administrar seguros médicos y configurar descuentos por cobertura
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Seguro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Seguro</DialogTitle>
              <DialogDescription>
                Agregar una nueva compañía de seguros médicos al sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInsurance}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Seguro</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Seguro Popular"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del seguro"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit">Crear Seguro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="w-80">
        <Input
          placeholder="Buscar seguros..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Insurance List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          filteredInsurances.map((insurance) => (
            <Card key={insurance.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <CardTitle>{insurance.name}</CardTitle>
                    <Badge variant={insurance.isActive ? "default" : "secondary"}>
                      {insurance.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedInsurance(insurance)
                        setCoverageFormData({
                          selectedServices: [],
                          isActive: true
                        })
                        setServiceSearchTerm("") // Limpiar búsqueda al abrir
                        setIsCoverageDialogOpen(true)
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Cobertura
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInsurance(insurance.id, insurance.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
                {insurance.description && (
                  <CardDescription>{insurance.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{insurance._count.patients} pacientes</span>
                    <span>{insurance.coverageRules.length} servicios con cobertura</span>
                  </div>
                  
                  {insurance.coverageRules.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Reglas de Cobertura:</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Servicio</TableHead>
                            <TableHead className="text-right">Precio Base</TableHead>
                            <TableHead className="text-right">Descuento</TableHead>
                            <TableHead className="text-right">Cobertura</TableHead>
                            <TableHead className="text-right">Paciente Paga</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {insurance.coverageRules.map((rule) => (
                            <TableRow key={rule.id}>
                              <TableCell>{rule.service.name}</TableCell>
                              <TableCell className="text-right">
                                ${rule.service.price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">
                                -${((rule.service.price * rule.coveragePercent) / 100).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className="text-green-600">
                                  {rule.coveragePercent}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-blue-600 font-semibold">
                                ${(rule.service.price - (rule.service.price * rule.coveragePercent) / 100).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCoverage(rule.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Coverage Configuration Dialog */}
      <Dialog open={isCoverageDialogOpen} onOpenChange={setIsCoverageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Descuentos de Cobertura</DialogTitle>
            <DialogDescription>
              Configurar descuentos en dinero para {selectedInsurance?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCoverage}>
            <div className="space-y-6">
              {/* Selección de Servicios */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Servicios y Descuentos</h3>
                
                {/* Lista de servicios disponibles */}
                <div className="space-y-2">
                  <Label>Servicios Disponibles</Label>
                  
                  {/* Buscador de servicios */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Buscar servicios por nombre, categoría o ID..."
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                        className="pr-8"
                      />
                      <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    {serviceSearchTerm && (
                      <div className="text-sm text-gray-600">
                        {filteredServices.length} de {services.length} servicios encontrados
                      </div>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {filteredServices.length > 0 ? (
                      filteredServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={coverageFormData.selectedServices.some(s => s.serviceId === service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addServiceToForm(service)
                              } else {
                                removeServiceFromForm(service.id)
                              }
                            }}
                            className="rounded"
                          />
                          <span className="font-medium">{service.name}</span>
                          <span className="text-sm text-gray-500">({service.category || "Sin categoría"})</span>
                          <span className="text-sm font-semibold text-blue-600">${service.price.toFixed(2)}</span>
                        </div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {service.id}
                        </code>
                      </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {serviceSearchTerm ? 'No se encontraron servicios con ese criterio' : 'No hay servicios disponibles'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Servicios seleccionados con descuentos */}
                {coverageFormData.selectedServices.length > 0 && (
                  <div className="space-y-2">
                    <Label>Servicios Seleccionados - Configurar Descuento</Label>
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                      {coverageFormData.selectedServices.map((service) => (
                        <div key={service.serviceId} className="p-4 border rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-medium text-lg">{service.serviceName}</div>
                              <div className="text-sm text-gray-600">Precio base: ${service.servicePrice.toFixed(2)}</div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeServiceFromForm(service.serviceId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Descuento en dinero */}
                            <div className="space-y-2">
                              <Label htmlFor={`discount-${service.serviceId}`} className="text-sm font-medium">
                                Descuento en Dinero:
                              </Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">$</span>
                                <Input
                                  id={`discount-${service.serviceId}`}
                                  type="number"
                                  min="0"
                                  max={service.servicePrice}
                                  step="0.01"
                                  value={service.discountAmount}
                                  onChange={(e) => updateServiceDiscount(service.serviceId, Number(e.target.value))}
                                  className="w-24"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            
                            {/* Porcentaje calculado */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Porcentaje Calculado:
                              </Label>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-10 flex items-center justify-center bg-white border rounded px-3 text-sm font-medium">
                                  {service.coveragePercent.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Resumen del cálculo */}
                          <div className="mt-3 p-3 bg-white rounded border">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Precio base:</span>
                                <div className="font-semibold">${service.servicePrice.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Descuento:</span>
                                <div className="font-semibold text-green-600">-${service.discountAmount.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Paciente paga:</span>
                                <div className="font-semibold text-blue-600">${(service.servicePrice - service.discountAmount).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={coverageFormData.selectedServices.length === 0}>
                Crear {coverageFormData.selectedServices.length} Regla{coverageFormData.selectedServices.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}