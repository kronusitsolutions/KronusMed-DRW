"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, DollarSign, Plus, CalendarCheck, UserCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

interface DashboardAppointment {
  id: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  patient?: { name?: string } | null
  doctor?: { name?: string } | null
  reason?: string | null
}

interface DashboardStats {
  todayAppointments: number
  activePatients: number
  pendingInvoices: number
  pendingAmount: number
}

interface DashboardData {
  appointments: DashboardAppointment[]
  stats: DashboardStats
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    appointments: [],
    stats: {
      todayAppointments: 0,
      activePatients: 0,
      pendingInvoices: 0,
      pendingAmount: 0
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // ✅ Una sola consulta optimizada con agregaciones
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setDashboardData({
          appointments: data.appointments,
          stats: data.stats
        })
      } else {
        console.error("Error al cargar estadísticas del dashboard")
      }
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800"
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmada"
      case "SCHEDULED":
        return "Programada"
      case "IN_PROGRESS":
        return "En Progreso"
      case "COMPLETED":
        return "Completada"
      case "CANCELLED":
        return "Cancelada"
      default:
        return status
    }
  }

  const stats = [
    {
      title: "Citas de Hoy",
      value: dashboardData.stats.todayAppointments.toString(),
      description: `${dashboardData.appointments.filter(apt => apt.status === "CONFIRMED").length} confirmadas`,
      icon: CalendarCheck,
    },
    {
      title: "Pacientes Activos",
      value: dashboardData.stats.activePatients.toString(),
      description: "pacientes registrados",
      icon: Users,
    },
    // Solo mostrar Facturas por Cobrar para BILLING y ADMIN
    ...(session?.user?.role === "BILLING" || session?.user?.role === "ADMIN" ? [{
      title: "Facturas por Cobrar",
      value: `$${dashboardData.stats.pendingAmount.toFixed(2)}`,
      description: `${dashboardData.stats.pendingInvoices} facturas por cobrar`,
      icon: DollarSign,
    }] : []),
  ]

  if (status === "loading" || isLoading) {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de actividades y citas de hoy
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Appointments - Simplified */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Citas de Hoy</CardTitle>
              <CardDescription>
                Próximas citas programadas para hoy
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Link href="/dashboard/appointments">
                <Button variant="outline" size="sm">
                  Ver Todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/appointments">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Cita
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData.appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay citas programadas para hoy</p>
              <Link href="/dashboard/appointments">
                <Button variant="outline" className="mt-2">
                  Programar Primera Cita
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600 mb-1" />
                      <span className="text-xs font-medium text-blue-600">
                        {appointment.startTime}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-sm">{appointment.patient?.name}</h3>
                        <Badge className={getStatusColor(appointment.status)} variant="secondary">
                          {getStatusText(appointment.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{appointment.doctor?.name}</span>
                        <span>•</span>
                        <span>{appointment.reason}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.startTime} - {appointment.endTime}
                  </div>
                </div>
              ))}
              
              {dashboardData.appointments.length >= 4 && (
                <div className="text-center pt-3 border-t">
                  <Link href="/dashboard/appointments">
                    <Button variant="ghost" size="sm">
                      Ver todas las citas de hoy
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accesos directos a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/appointments">
              <Button variant="outline" className="w-full justify-start">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Gestionar Citas
              </Button>
            </Link>
            <Link href="/dashboard/patients">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Ver Pacientes
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Facturación
              </Button>
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/dashboard/services">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Gestionar Servicios
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}