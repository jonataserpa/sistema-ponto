"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Mock de autenticação
  const login = async (email: string, password: string) => {
    setIsLoading(true)

    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verificar credenciais (mock)
    if ((email === "admin" && password === "admin") || (email === "admin@admin.com" && password === "admin")) {
      const userData: User = {
        id: "1",
        name: "Administrador",
        email: email,
        role: "admin",
      }

      // Salvar usuário no localStorage
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      setIsLoading(false)

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userData.name}!`,
      })

      return true
    } else {
      setIsLoading(false)

      toast({
        title: "Erro de autenticação",
        description: "Email ou senha incorretos",
        variant: "destructive",
      })

      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    })
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
