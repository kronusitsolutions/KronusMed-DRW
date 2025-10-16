"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, TrendingUp, Clock, AlertCircle, Database, Search, Zap } from "lucide-react"
import { PaginatedPatientList } from "@/components/patients/paginated-patient-list"
import { usePatientsPagination } from "@/hooks/use-patients-pagination"
import { Patient } from "@/hooks/use-patients-pagination"
import { toast } from "sonner"

/**
 * Página de pacientes con paginación del servidor
 * Optimizada para producción con consultas eficientes a la base de datos
 */
export default function PaginatedPatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Estados para acciones
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(20)

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
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    refetch,
    clearFilters
  } = usePatientsPagination(itemsPerPage)

  // Redirigir si no está autenticado
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  // Handlers para acciones de pacientes
  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    toast.info(`Viendo detalles de ${patient.name}`)
    // Aquí puedes abrir un modal o navegar a una página de detalles
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    toast.info(`Editando ${patient.name}`)
    // Aquí puedes abrir un modal de edición o navegar a una página de edición
  }

  const handleDeletePatient = async (patient: Patient) => {
    try {
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
    }
  }

  const handleViewMedicalNotes = (patient: Patient) => {
    setSelectedPatient(patient)
    toast.info(`Viendo notas médicas de ${patient.name}`)
    // Aquí puedes abrir un modal o navegar a las notas médicas
  }

  // Calcular estadísticas
  const activePatients = patients.filter(p => p.status === 'ACTIVE').length
  const inactivePatients = patients.filter(p => p.status === 'INACTIVE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes Paginados</h1>
          <p className="text-muted-foreground">
            Lista optimizada con paginación del servidor para máximo rendimiento
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Paginación del servidor
          </Badge>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              En la base de datos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Página Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pagination.page}</div>
            <p className="text-xs text-muted-foreground">
              de {pagination.totalPages} páginas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mostrando</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{patients.length}</div>
            <p className="text-xs text-muted-foreground">
              de {pagination.total} pacientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Optimizado</div>
            <p className="text-xs text-muted-foreground">
              Consultas eficientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Paginada */}
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
        onLimitChange={setItemsPerPage}
        onViewPatient={handleViewPatient}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
        onViewMedicalNotes={handleViewMedicalNotes}
        onRefetch={refetch}
      />

      {/* Enlace a página de prueba */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-yellow-900">¿Problemas con la paginación?</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Visita la página de prueba para verificar que todos los controles funcionen correctamente
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open('/dashboard/test-pagination', '_blank')}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              Ir a Prueba
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información de optimización */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Database className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">Optimizaciones de Producción</h3>
              <div className="mt-2 text-sm text-green-800 space-y-1">
                <p>• <strong>Paginación del Servidor:</strong> Solo se cargan los registros necesarios</p>
                <p>• <strong>Búsqueda en Base de Datos:</strong> Filtrado eficiente con ILIKE</p>
                <p>• <strong>Consultas Optimizadas:</strong> LIMIT y OFFSET para máximo rendimiento</p>
                <p>• <strong>Memoria Eficiente:</strong> No se cargan todos los datos en memoria</p>
                <p>• <strong>Escalabilidad:</strong> Funciona con millones de registros</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparación de rendimiento */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Search className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Ventajas de la Paginación del Servidor</h3>
              <div className="mt-2 text-sm text-blue-800 space-y-1">
                <p>• <strong>Menos Transferencia de Datos:</strong> Solo se envían los registros de la página actual</p>
                <p>• <strong>Búsqueda Rápida:</strong> El filtrado se hace en la base de datos</p>
                <p>• <strong>Menor Uso de Memoria:</strong> No se almacenan todos los registros en el frontend</p>
                <p>• <strong>Mejor Experiencia:</strong> Carga más rápida y navegación fluida</p>
                <p>• <strong>Escalabilidad:</strong> Funciona igual de bien con 100 o 100,000 registros</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
