"use client"

import { useState, useEffect } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useFormDateTime } from "@/hooks/use-date-utils"

const consultationSchema = z.object({
  date: z.string().min(1, "La fecha es requerida"),
  type: z.enum(["PRIMERA_CONSULTA", "SEGUIMIENTO", "CONTROL", "URGENCIA"], {
    required_error: "El tipo de consulta es requerido"
  }),
  reason: z.string().min(1, "El motivo de consulta es requerido"),
  diagnosis: z.string().min(1, "El diagnóstico es requerido"),
  symptoms: z.string().optional(),
  notes: z.string().min(1, "Las notas son requeridas"),
  duration: z.string().min(1, "La duración es requerida"),
  treatment: z.string().optional(),
  vitalSigns: z.object({
    bloodPressure: z.string().optional(),
    temperature: z.string().optional(),
    heartRate: z.string().optional(),
    weight: z.string().optional(),
    height: z.string().optional()
  }).optional(),
  prescriptions: z.array(z.object({
    medication: z.string().min(1, "El medicamento es requerido"),
    dosage: z.string().min(1, "La dosificación es requerida"),
    frequency: z.string().min(1, "La frecuencia es requerida"),
    duration: z.string().optional()
  })).optional(),
  nextAppointment: z.string().optional(),
  followUpDate: z.string().optional()
})

type ConsultationForm = z.infer<typeof consultationSchema>

interface NewConsultationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ConsultationForm) => Promise<boolean>
  patientId: string
  doctorId: string
}

export function NewConsultationDialog({
  isOpen,
  onClose,
  onSubmit,
  patientId,
  doctorId
}: NewConsultationDialogProps) {
  const { dateTimeValue, setDateTimeValue, getDateTimeObject } = useFormDateTime()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    watch,
    setValue
  } = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      type: "PRIMERA_CONSULTA",
      prescriptions: []
    }
  })

  const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = useFieldArray({
    control,
    name: "prescriptions"
  })

  const watchedVitalSigns = watch("vitalSigns")

  useEffect(() => {
    if (isOpen) {
      reset({
        date: new Date().toISOString().slice(0, 16),
        type: "PRIMERA_CONSULTA",
        prescriptions: []
      })
      setCurrentStep(1)
    }
  }, [isOpen, reset])

  const handleFormSubmit = async (data: ConsultationForm) => {
    try {
      setIsSubmitting(true)
      const success = await onSubmit({
        ...data,
        patientId,
        doctorId
      } as any)
      
      if (success) {
        toast.success("Consulta médica creada exitosamente")
        onClose()
        reset()
        setCurrentStep(1)
      }
    } catch (error) {
      console.error("Error creating consultation:", error)
      toast.error("Error al crear la consulta médica")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addPrescription = () => {
    appendPrescription({
      medication: "",
      dosage: "",
      frequency: "",
      duration: ""
    })
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha y Hora *</Label>
          <Input
            id="date"
            type="datetime-local"
            value={dateTimeValue}
            onChange={(e) => setDateTimeValue(e.target.value)}
            className={errors.date ? "border-red-500" : ""}
          />
          {errors.date && (
            <p className="text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Consulta *</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMERA_CONSULTA">Primera Consulta</SelectItem>
                  <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                  <SelectItem value="CONTROL">Control</SelectItem>
                  <SelectItem value="URGENCIA">Urgencia</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo de Consulta *</Label>
        <Textarea
          id="reason"
          {...register("reason")}
          placeholder="Describa el motivo de la consulta..."
          className={errors.reason ? "border-red-500" : ""}
          rows={3}
        />
        {errors.reason && (
          <p className="text-sm text-red-600">{errors.reason.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnóstico *</Label>
        <Textarea
          id="diagnosis"
          {...register("diagnosis")}
          placeholder="Diagnóstico principal..."
          className={errors.diagnosis ? "border-red-500" : ""}
          rows={3}
        />
        {errors.diagnosis && (
          <p className="text-sm text-red-600">{errors.diagnosis.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="symptoms">Síntomas Reportados</Label>
        <Textarea
          id="symptoms"
          {...register("symptoms")}
          placeholder="Síntomas que reporta el paciente..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Signos Vitales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodPressure">Presión Arterial</Label>
              <Input
                id="bloodPressure"
                {...register("vitalSigns.bloodPressure")}
                placeholder="Ej: 120/80 mmHg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura</Label>
              <Input
                id="temperature"
                {...register("vitalSigns.temperature")}
                placeholder="Ej: 36.5°C"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heartRate">Frecuencia Cardíaca</Label>
              <Input
                id="heartRate"
                {...register("vitalSigns.heartRate")}
                placeholder="Ej: 72 bpm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso</Label>
              <Input
                id="weight"
                {...register("vitalSigns.weight")}
                placeholder="Ej: 70 kg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura</Label>
              <Input
                id="height"
                {...register("vitalSigns.height")}
                placeholder="Ej: 170 cm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notes">Notas Médicas *</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Observaciones y notas del médico..."
          className={errors.notes ? "border-red-500" : ""}
          rows={6}
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Tratamiento</Label>
        <Textarea
          id="treatment"
          {...register("treatment")}
          placeholder="Tratamiento recomendado..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duración de la Consulta *</Label>
          <Input
            id="duration"
            {...register("duration")}
            placeholder="Ej: 30 minutos"
            className={errors.duration ? "border-red-500" : ""}
          />
          {errors.duration && (
            <p className="text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="followUpDate">Fecha de Seguimiento</Label>
          <Input
            id="followUpDate"
            type="datetime-local"
            {...register("followUpDate")}
          />
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Medicamentos Recetados</h3>
        <Button
          type="button"
          onClick={addPrescription}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Medicamento
        </Button>
      </div>

      {prescriptionFields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay medicamentos recetados</p>
          <p className="text-sm">Haz clic en "Agregar Medicamento" para añadir uno</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptionFields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Medicamento {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removePrescription(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`prescriptions.${index}.medication`}>
                      Medicamento *
                    </Label>
                    <Input
                      {...register(`prescriptions.${index}.medication`)}
                      placeholder="Nombre del medicamento"
                      className={errors.prescriptions?.[index]?.medication ? "border-red-500" : ""}
                    />
                    {errors.prescriptions?.[index]?.medication && (
                      <p className="text-sm text-red-600">
                        {errors.prescriptions[index]?.medication?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`prescriptions.${index}.dosage`}>
                      Dosificación *
                    </Label>
                    <Input
                      {...register(`prescriptions.${index}.dosage`)}
                      placeholder="Ej: 500mg"
                      className={errors.prescriptions?.[index]?.dosage ? "border-red-500" : ""}
                    />
                    {errors.prescriptions?.[index]?.dosage && (
                      <p className="text-sm text-red-600">
                        {errors.prescriptions[index]?.dosage?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`prescriptions.${index}.frequency`}>
                      Frecuencia *
                    </Label>
                    <Input
                      {...register(`prescriptions.${index}.frequency`)}
                      placeholder="Ej: Cada 8 horas"
                      className={errors.prescriptions?.[index]?.frequency ? "border-red-500" : ""}
                    />
                    {errors.prescriptions?.[index]?.frequency && (
                      <p className="text-sm text-red-600">
                        {errors.prescriptions[index]?.frequency?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`prescriptions.${index}.duration`}>
                      Duración
                    </Label>
                    <Input
                      {...register(`prescriptions.${index}.duration`)}
                      placeholder="Ej: 7 días"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return renderStep1()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Nueva Consulta Médica
            <div className="ml-auto text-sm text-gray-500">
              Paso {currentStep} de {totalSteps}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>

            {renderCurrentStep()}
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                >
                  Anterior
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Consulta"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
