import type React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header title={title} subtitle={subtitle} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  )
}
