"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Building, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const validateForm = () => {
    if (!email) {
      setError("Email é obrigatório")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Email inválido")
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)

    toast({
      title: "Email enviado",
      description: "Verifique sua caixa de entrada para redefinir sua senha",
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gray-900 dark:bg-gray-700 p-3 rounded-lg mb-4">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-center">Gestão Total</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isSubmitted ? "Email enviado" : "Recuperação de senha"}
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Enviamos um email com instruções para redefinir sua senha. Por favor, verifique sua caixa de entrada.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className={`pl-10 ${error ? "border-red-500" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar instruções"}
            </Button>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
