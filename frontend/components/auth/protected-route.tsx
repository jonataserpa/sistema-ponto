"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, isLoading, router, pathname])

  // Mostrar nada enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Se estiver na página de login e já estiver autenticado, redirecionar para a home
  if (!isLoading && user && pathname === "/login") {
    router.push("/")
    return null
  }

  // Se estiver na página de login e não estiver autenticado, mostrar a página de login
  if (pathname === "/login") {
    return <>{children}</>
  }

  // Se não estiver autenticado, não mostrar nada (será redirecionado no useEffect)
  if (!user) {
    return null
  }

  // Se estiver autenticado e não estiver na página de login, mostrar o conteúdo
  return <>{children}</>
}
