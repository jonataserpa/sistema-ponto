"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ClientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (client: any) => void
  client?: {
    id?: string
    name: string
    email: string
    phone: string
    status: string
    petName?: string
    notes?: string
    avatar?: string
  }
}

export function ClientFormModal({ isOpen, onClose, onSave, client }: ClientFormModalProps) {
  const isEditing = !!client?.id

  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    status: client?.status || "Ativo",
    petName: client?.petName || "",
    notes: client?.notes || "",
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
      case "name":
        if (!value.trim()) error = "Nome é obrigatório"
        break
      case "email":
        if (!value.trim()) {
          error = "Email é obrigatório"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Email inválido"
        }
        break
      case "phone":
        if (!value.trim()) {
          error = "Telefone é obrigatório"
        } else if (!/^$$\d{2}$$\s\d{4,5}-\d{4}$/.test(value)) {
          error = "Formato inválido. Use (00) 00000-0000"
        }
        break
      case "petName":
        if (!value.trim()) error = "Nome do pet é obrigatório"
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
    const requiredFields = ["name", "email", "phone", "petName"]
    let isValid = true

    // Marcar todos os campos obrigatórios como tocados
    const allTouched = requiredFields.reduce(
      (acc, key) => {
        acc[key] = true
        return acc
      },
      {} as Record<string, boolean>,
    )

    setTouched(allTouched)

    // Validar cada campo obrigatório
    requiredFields.forEach((field) => {
      if (!validateField(field, formData[field as keyof typeof formData])) {
        isValid = false
      }
    })

    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Gerar ID aleatório para novos clientes
    const newClient = {
      ...formData,
      id: client?.id || `#${Math.floor(10000 + Math.random() * 90000)}`,
      avatar: client?.avatar || "/placeholder.svg",
    }

    onSave(newClient)
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
          <DialogTitle>{isEditing ? "Editar Cliente" : "Cadastro de Cliente"}</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className={errors.name && touched.name ? "text-red-500" : ""}>
                Nome*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                className={cn(errors.name && touched.name ? "border-red-500 focus-visible:ring-red-500" : "")}
                required
              />
              {errors.name && touched.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className={errors.email && touched.email ? "text-red-500" : ""}>
                Email*
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={cn(errors.email && touched.email ? "border-red-500 focus-visible:ring-red-500" : "")}
                required
              />
              {errors.email && touched.email && <p className="text-xs text-red-500">{errors.email}</p>}
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
                required
              />
              {errors.phone && touched.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="petName" className={errors.petName && touched.petName ? "text-red-500" : ""}>
                Nome do Pet*
              </Label>
              <Input
                id="petName"
                value={formData.petName}
                onChange={(e) => handleChange("petName", e.target.value)}
                onBlur={() => handleBlur("petName")}
                className={cn(errors.petName && touched.petName ? "border-red-500 focus-visible:ring-red-500" : "")}
                required
              />
              {errors.petName && touched.petName && <p className="text-xs text-red-500">{errors.petName}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status*</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Informações adicionais sobre o cliente ou pet"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
