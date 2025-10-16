"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, Save, Eye } from "lucide-react"
import { InvoiceDesignPreview } from "./components/invoice-design-preview"
import { LogoUpload } from "./components/logo-upload"
import { InvoiceDesignConfig } from "@/types/invoice"

const defaultConfig: InvoiceDesignConfig = {
  name: "Configuración por defecto",
  logoUrl: "",
  logoPosition: "LEFT",
  businessName: "",
  address: "",
  phone: "",
  taxId: "",
  customMessage: "",
  format: "80MM",
  isActive: true
}

export default function FacturaDisenoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [config, setConfig] = useState<InvoiceDesignConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

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
      loadConfig()
    }
  }, [session, status, router])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/invoice-design")
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setConfig(data[0])
        }
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const method = config.id ? "PUT" : "POST"
      const url = config.id ? `/api/invoice-design/${config.id}` : "/api/invoice-design"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        const savedConfig = await response.json()
        setConfig(savedConfig)
        toast({
          title: "Éxito",
          description: "Configuración guardada correctamente"
        })
      } else {
        throw new Error("Error al guardar")
      }
    } catch (error) {
      console.error("Error al guardar configuración:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (logoUrl: string) => {
    setConfig(prev => ({ ...prev, logoUrl }))
  }

  const updateConfig = (field: keyof InvoiceDesignConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diseño de Facturas</h1>
        <p className="text-muted-foreground">
          Personaliza el diseño y contenido de tus facturas
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Configuración */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>
                    Configura los datos básicos de tu empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nombre Comercial</Label>
                    <Input
                      id="businessName"
                      value={config.businessName}
                      onChange={(e) => updateConfig("businessName", e.target.value)}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Textarea
                      id="address"
                      value={config.address}
                      onChange={(e) => updateConfig("address", e.target.value)}
                      placeholder="Dirección completa"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={config.phone}
                      onChange={(e) => updateConfig("phone", e.target.value)}
                      placeholder="Número de teléfono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">RNC</Label>
                    <Input
                      id="taxId"
                      value={config.taxId}
                      onChange={(e) => updateConfig("taxId", e.target.value)}
                      placeholder="Número de identificación fiscal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customMessage">Mensaje Personalizado</Label>
                    <Textarea
                      id="customMessage"
                      value={config.customMessage}
                      onChange={(e) => updateConfig("customMessage", e.target.value)}
                      placeholder="Mensaje que aparecerá en la factura"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logotipo</CardTitle>
                  <CardDescription>
                    Sube y configura la posición de tu logotipo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LogoUpload
                    currentLogoUrl={config.logoUrl}
                    onLogoUpload={handleLogoUpload}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="logoPosition">Posición del Logo</Label>
                    <Select
                      value={config.logoPosition}
                      onValueChange={(value: "LEFT" | "CENTER" | "RIGHT") => 
                        updateConfig("logoPosition", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEFT">Izquierda</SelectItem>
                        <SelectItem value="CENTER">Centro</SelectItem>
                        <SelectItem value="RIGHT">Derecha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Formato de Factura</CardTitle>
                  <CardDescription>
                    Selecciona el formato de impresión
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="format">Tipo de Formato</Label>
                    <Select
                      value={config.format}
                      onValueChange={(value: "80MM" | "LETTER") => 
                        updateConfig("format", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80MM">Formato 80mm (Terminal)</SelectItem>
                        <SelectItem value="LETTER">Formato Letter (A4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={saveConfig} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>

            {/* Vista Previa en Tiempo Real */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vista Previa en Tiempo Real
                  </CardTitle>
                  <CardDescription>
                    Visualiza cómo se verá tu factura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InvoiceDesignPreview config={config} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa Completa</CardTitle>
              <CardDescription>
                Visualización completa de ambos formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Formato 80mm</h3>
                  <InvoiceDesignPreview 
                    config={{ ...config, format: "80MM" }} 
                    showFullPreview={true}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Formato Letter</h3>
                  <InvoiceDesignPreview 
                    config={{ ...config, format: "LETTER" }} 
                    showFullPreview={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
