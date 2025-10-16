"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { LogoUploadProps } from "../types"

export function LogoUpload({ currentLogoUrl, onLogoUpload }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PNG, JPG o SVG",
        variant: "destructive"
      })
      return
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 2MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('file', file)

      // Subir archivo al servidor
      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir archivo')
      }

      const result = await response.json()
      
      // Crear URL temporal para previsualización
      const tempUrl = URL.createObjectURL(file)
      setPreviewUrl(tempUrl)

      // Guardar la URL real del servidor
      onLogoUpload(result.url)
      
      setIsUploading(false)
      toast({
        title: "Éxito",
        description: "Logotipo subido correctamente"
      })

    } catch (error) {
      console.error("Error al subir logo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo subir el logotipo",
        variant: "destructive"
      })
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setPreviewUrl(null)
    onLogoUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "Logotipo removido",
      description: "El logotipo ha sido eliminado"
    })
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="h-12 w-12 object-contain border rounded"
                />
                <div>
                  <p className="text-sm font-medium">Logotipo cargado</p>
                  <p className="text-xs text-muted-foreground">
                    Haz clic para cambiar
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    "Subiendo..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Cambiar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    "Subiendo..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Logotipo
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                PNG, JPG o SVG hasta 2MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
