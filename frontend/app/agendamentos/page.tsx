"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { AppointmentFormModal } from "@/components/appointments/appointment-form-modal"
import { useToast } from "@/components/ui/use-toast"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

// Dados de exemplo
const initialAppointments = [
  {
    id: "#123",
    clientName: "João Silva",
    date: "2025-01-03",
    time: "09:00",
    phone: "(11) 98765-4321",
    email: "joao.silva@email.com",
    service: "Manutenção Preventiva",
    notes: "Cliente solicitou revisão completa",
    status: "Confirmado",
  },
  {
    id: "#124",
    clientName: "Maria Santos",
    date: "2025-01-05",
    time: "14:30",
    phone: "(11) 97654-3210",
    email: "maria.santos@email.com",
    service: "Instalação de Equipamento",
    notes: "",
    status: "Pendente",
  },
]

const calendarData = {
  month: "Janeiro 2025",
  days: [
    { day: 31, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
    { day: 4, isCurrentMonth: false },
  ],
}

export default function AgendamentosPage() {
  const [viewMode, setViewMode] = useState("Semana")
  const [appointments, setAppointments] = useState(initialAppointments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const { toast } = useToast()

  const handleOpenModal = () => {
    setSelectedAppointment(null)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
  }

  const handleSaveAppointment = (appointment: any) => {
    if (selectedAppointment) {
      // Editar agendamento existente
      setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? appointment : a)))
      toast({
        title: "Agendamento atualizado",
        description: `Agendamento para ${appointment.clientName} foi atualizado.`,
      })
    } else {
      // Adicionar novo agendamento
      setAppointments((prev) => [...prev, appointment])
      toast({
        title: "Agendamento criado",
        description: `Agendamento para ${appointment.clientName} foi criado com sucesso.`,
      })
    }
  }

  // Função para obter os agendamentos de um dia específico
  const getAppointmentsForDay = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return []

    // Formatar a data para comparação (YYYY-MM-DD)
    const year = 2025
    const month = 1 // Janeiro
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`

    return appointments.filter((appointment) => appointment.date === formattedDate)
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agendamento de Serviços</h1>
        <Button className="flex items-center gap-2" onClick={handleOpenModal}>
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Serviço</label>
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Técnico</label>
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="joao">João</SelectItem>
                  <SelectItem value="maria">Maria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-card rounded-lg border shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-medium">{calendarData.month}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant={viewMode === "Dia" ? "default" : "outline"} onClick={() => setViewMode("Dia")}>
                Dia
              </Button>
              <Button variant={viewMode === "Semana" ? "default" : "outline"} onClick={() => setViewMode("Semana")}>
                Semana
              </Button>
              <Button variant={viewMode === "Mês" ? "default" : "outline"} onClick={() => setViewMode("Mês")}>
                Mês
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center border-b">
            <div className="p-4 font-medium">Dom</div>
            <div className="p-4 font-medium">Seg</div>
            <div className="p-4 font-medium">Ter</div>
            <div className="p-4 font-medium">Qua</div>
            <div className="p-4 font-medium">Qui</div>
            <div className="p-4 font-medium">Sex</div>
            <div className="p-4 font-medium">Sáb</div>
          </div>

          <div className="grid grid-cols-7 text-center">
            {calendarData.days.map((day, index) => {
              const dayAppointments = getAppointmentsForDay(day.day, day.isCurrentMonth)

              return (
                <div key={index} className="border-r border-b min-h-24 p-2">
                  <div
                    className={cn("text-sm mb-1", !day.isCurrentMonth ? "text-muted-foreground" : "text-foreground")}
                  >
                    {day.day}
                  </div>

                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "p-1 rounded text-xs mb-1 cursor-pointer",
                        "bg-blue-100 text-blue-800 hover:bg-blue-200",
                        "dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800",
                      )}
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      <div className="font-medium truncate">
                        {appointment.time} - {appointment.clientName}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="truncate">{appointment.service}</span>
                        <StatusBadge status={appointment.status} className="text-[10px] px-1.5 py-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AppointmentFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAppointment}
        appointment={selectedAppointment}
      />
    </MainLayout>
  )
}
