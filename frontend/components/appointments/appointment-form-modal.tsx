"use client"

import type React from "react"
import { useState } from "react"
import { X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Lista de serviços disponíveis
const availableServices = [
  "Manutenção Preventiva",
  "Instalação de Equipamento",
  "Suporte Técnico",
  "Consultoria",
  "Treinamento",
]

interface AppointmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: any) => void
  appointment?: {
    id?: string
    clientName: string
    date: string
    time: string
    phone: string
    email?: string
    service: string
    notes?: string
    status?: string
  }
}

export function AppointmentFormModal({ isOpen, onClose, onSave, appointment }: AppointmentFormModalProps) {
  const isEditing = !!appointment?.id

  const [formData, setFormData] = useState({
    clientName: appointment?.clientName || "",
    date: appointment?.date || "",
    time: appointment?.time || "",
    phone: appointment?.phone || "",
    email: appointment?.email || "",
    service: appointment?.service || "",
    notes: appointment?.notes || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Limpar erro quando o campo é alterado
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }))

    validateField(field, formData[field as keyof typeof formData])
  }

  const validateField = (field: string, value: string) => {
    let error = ""

    switch (field) {
      case "clientName":
        if (!value.trim()) error = "Nome do cliente é obrigatório"
        break
      case "date":
        if (!value) error = "Data é obrigatória"
        break
      case "time":
        if (!value) error = "Horário é obrigatório"
        break
      case "phone":
        if (!value.trim()) {
          error = "Telefone é obrigatório"
        } else if (!/^$$\d{2}$$\s\d{5}-\d{4}$/.test(value)) {
          error = "Formato inválido. Use (00) 00000-0000"
        }
        break
      case "email":
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Email inválido"
        }
        break
      case "service":
        if (!value) error = "Serviço é obrigatório"
        break
      default:
        break
    }

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }))
      return false
    }

    return true
  }

  const validateForm = () => {
    const requiredFields = ["clientName", "date", "time", "phone", "service"]
    let isValid = true

    // Marcar todos os campos obrigatórios como tocados
    const allTouched = requiredFields.reduce(
      (acc, key) => {
        acc[key] = true
        return acc
      },
      {} as Record<string, boolean>,
    )

    setTouched((prev) => ({ ...prev, ...allTouched }))

    // Validar cada campo obrigatório
    requiredFields.forEach((field) => {
      if (!validateField(field, formData[field as keyof typeof formData])) {
        isValid = false
      }
    })

    // Validar email se estiver preenchido
    if (formData.email && !validateField("email", formData.email)) {
      isValid = false
    }

    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Gerar ID aleatório para novos agendamentos
    const newAppointment = {
      ...formData,
      id: appointment?.id || `#${Math.floor(10000 + Math.random() * 90000)}`,
      status: appointment?.status || "Pendente",
    }

    onSave(newAppointment)
    onClose()
  }

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, "")

    // Aplica a formatação
    if (numbers.length <= 2) {
      return `(${numbers}`
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value)
    handleChange("phone", formattedValue)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clientName" className={errors.clientName && touched.clientName ? "text-red-500" : ""}>
                Nome do Cliente*
              </Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleChange("clientName", e.target.value)}
                onBlur={() => handleBlur("clientName")}
                placeholder="Digite o nome completo"
                className={cn(
                  errors.clientName && touched.clientName ? "border-red-500 focus-visible:ring-red-500" : "",
                )}
              />
              {errors.clientName && touched.clientName && <p className="text-xs text-red-500">{errors.clientName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className={errors.date && touched.date ? "text-red-500" : ""}>
                  Data*
                </Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange("date", e.target.value)}
                    onBlur={() => handleBlur("date")}
                    placeholder="dd/mm/aaaa"
                    className={cn(errors.date && touched.date ? "border-red-500 focus-visible:ring-red-500" : "")}
                  />
                </div>
                {errors.date && touched.date && <p className="text-xs text-red-500">{errors.date}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="time" className={errors.time && touched.time ? "text-red-500" : ""}>
                  Horário*
                </Label>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange("time", e.target.value)}
                    onBlur={() => handleBlur("time")}
                    placeholder="--:--"
                    className={cn(
                      errors.time && touched.time ? "border-red-500 focus-visible:ring-red-500" : "",
                      "pr-10",
                    )}
                  />
                  <Clock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
                {errors.time && touched.time && <p className="text-xs text-red-500">{errors.time}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className={errors.phone && touched.phone ? "text-red-500" : ""}>
                Telefone*
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur("phone")}
                placeholder="(00) 00000-0000"
                className={cn(errors.phone && touched.phone ? "border-red-500 focus-visible:ring-red-500" : "")}
              />
              {errors.phone && touched.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className={errors.email && touched.email ? "text-red-500" : ""}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="email@exemplo.com"
                className={cn(errors.email && touched.email ? "border-red-500 focus-visible:ring-red-500" : "")}
              />
              {errors.email && touched.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service" className={errors.service && touched.service ? "text-red-500" : ""}>
                Serviço*
              </Label>
              <Select
                value={formData.service}
                onValueChange={(value) => handleChange("service", value)}
                onOpenChange={() => handleBlur("service")}
              >
                <SelectTrigger
                  id="service"
                  className={cn(errors.service && touched.service ? "border-red-500 focus-visible:ring-red-500" : "")}
                >
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && touched.service && <p className="text-xs text-red-500">{errors.service}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Digite alguma observação importante"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
              Agendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
