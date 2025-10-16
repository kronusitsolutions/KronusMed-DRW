"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Calendar, Users, CreditCard, Settings, LogOut, Stethoscope, User, BarChart3, Loader2, CalendarCheck, FileText, Shield } from 'lucide-react'
import { Logo } from "@/components/ui/logo"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Calendar,
    roles: ["ADMIN", "DOCTOR", "BILLING"]
  },
  {
    title: "Registros de Pacientes",
    url: "/dashboard/patients",
    icon: Users,
    roles: ["ADMIN", "DOCTOR", "BILLING"]
  },
  {
    title: "Citas",
    url: "/dashboard/appointments",
    icon: CalendarCheck,
    roles: ["ADMIN", "DOCTOR", "BILLING"]
  },
  {
    title: "Facturación",
    url: "/dashboard/billing",
    icon: CreditCard,
    roles: ["ADMIN", "BILLING"]
  },
  {
    title: "Servicios",
    url: "/dashboard/services",
    icon: Stethoscope,
    roles: ["ADMIN"]
  },
  {
    title: "Doctores",
    url: "/dashboard/doctors",
    icon: User,
    roles: ["ADMIN"]
  },
  {
    title: "Gestión de Seguros",
    url: "/dashboard/insurance",
    icon: Shield,
    roles: ["ADMIN"]
  },
  {
    title: "Reportes",
    url: "/dashboard/reports",
    icon: BarChart3,
    roles: ["ADMIN"]
  },
  {
    title: "Gestión de Usuarios",
    url: "/dashboard/users",
    icon: Settings,
    roles: ["ADMIN"]
  },
  {
    title: "Diseño de Facturas",
    url: "/dashboard/factura-diseno",
    icon: FileText,
    roles: ["ADMIN"]
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Prefetch programático de rutas más usadas para transiciones instantáneas
  useEffect(() => {
    if (!session) return
    const routesToPrefetch = [
      "/dashboard",
      "/dashboard/appointments",
      "/dashboard/patients",
      "/dashboard/reports",
      "/dashboard/services",
    ]
    routesToPrefetch.forEach((r) => {
      try { router.prefetch(r) } catch {}
    })
  }, [session, router])

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(session.user.role)
  )

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo size="md" showText={false} logoPath="/uploads/logo_1754861971666.png" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold leading-tight">KronusMed</h2>
              <p className="text-sm text-muted-foreground leading-tight">Sistema Médico</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} prefetch>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {session.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{session.user.name}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Bienvenido, {session.user.name}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {session.user.role}
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
