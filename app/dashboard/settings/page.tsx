"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Settings, Shield, Loader2, Save } from "lucide-react"

interface FeatureFlag {
  id: string
  name: string
  isEnabled: boolean
  description?: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

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
      fetchFeatureFlags()
    }
  }, [session, status, router])

  const fetchFeatureFlags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/feature-flags")
      if (response.ok) {
        const data = await response.json()
        setFeatureFlags(data)
      }
    } catch (error) {
      console.error("Error al cargar feature flags:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFeature = async (name: string, isEnabled: boolean) => {
    try {
      setIsSaving(true)
      const response = await fetch("/api/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isEnabled })
      })

      if (response.ok) {
        setFeatureFlags(prev => 
          prev.map(flag => 
            flag.name === name ? { ...flag, isEnabled } : flag
          )
        )
      } else {
        console.error("Error al actualizar feature flag")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
    } finally {
      setIsSaving(false)
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
          <p className="text-muted-foreground">
            Gestionar funcionalidades y configuraciones del sistema
          </p>
        </div>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Funcionalidades del Sistema
          </CardTitle>
          <CardDescription>
            Activar o desactivar funcionalidades específicas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{flag.name}</h3>
                      <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                        {flag.isEnabled ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={(checked) => handleToggleFeature(flag.name, checked)}
                      disabled={isSaving}
                    />
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Estado del Sistema de Seguros
          </CardTitle>
          <CardDescription>
            Información sobre el estado actual del sistema de seguros médicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium">Sistema de Seguros</h3>
                <p className="text-sm text-muted-foreground">
                  {featureFlags.find(f => f.name === "insurance_system")?.isEnabled ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium">Facturación con Seguros</h3>
                <p className="text-sm text-muted-foreground">
                  {featureFlags.find(f => f.name === "insurance_billing")?.isEnabled ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium">PDFs con Seguros</h3>
                <p className="text-sm text-muted-foreground">
                  {featureFlags.find(f => f.name === "insurance_pdf")?.isEnabled ? "Activo" : "Inactivo"}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instrucciones de Activación</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Activar "Sistema de Seguros" para habilitar la gestión de seguros médicos</li>
                <li>Activar "Facturación con Seguros" para integrar seguros en la facturación</li>
                <li>Activar "PDFs con Seguros" para incluir información de seguros en los PDFs</li>
                <li>Configurar seguros médicos en la página de Gestión de Seguros</li>
                <li>Asignar seguros a los pacientes en sus perfiles</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
