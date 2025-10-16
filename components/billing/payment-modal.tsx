"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, DollarSign, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Invoice } from '@/types/invoice'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  onPaymentSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, invoice, onPaymentSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invoice) return

    const paymentAmount = parseFloat(amount)
    const maxAmount = invoice.pendingAmount || invoice.totalAmount

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    if (paymentAmount > maxAmount) {
      toast.error(`El monto no puede exceder el monto pendiente ($${maxAmount.toFixed(2)})`)
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod: paymentMethod || undefined,
          notes: notes || undefined
        })
      })

      if (response.ok) {
        toast.success("Pago registrado exitosamente")
        onPaymentSuccess()
        handleClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al registrar el pago")
      }
    } catch (error) {
      console.error("Error al registrar pago:", error)
      toast.error("Error al registrar el pago")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setPaymentMethod('')
    setNotes('')
    onClose()
  }

  const pendingAmount = invoice?.pendingAmount || invoice?.totalAmount || 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            Registra un pago para la factura {invoice?.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información de la factura */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total de la factura:</span>
              <span className="font-medium">${invoice?.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monto pagado:</span>
              <span className="font-medium">${(invoice?.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium text-gray-700">Monto pendiente:</span>
              <span className="font-bold text-orange-600">${pendingAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Monto del pago */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto del pago *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={pendingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Máximo: $${pendingAmount.toFixed(2)}`}
              required
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(pendingAmount.toString())}
                className="text-xs"
              >
                Pago completo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((pendingAmount / 2).toFixed(2))}
                className="text-xs"
              >
                Mitad
              </Button>
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el pago..."
              rows={3}
            />
          </div>

          {/* Advertencia si el pago es parcial */}
          {amount && parseFloat(amount) < pendingAmount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este será un pago parcial. Quedarán ${(pendingAmount - parseFloat(amount)).toFixed(2)} pendientes.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Pago'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
