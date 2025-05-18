import { MainLayout } from "@/components/layout/main-layout"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { TrendingUp, Users, Calendar, AlertTriangle } from "lucide-react"

// Dados de exemplo
const recentSales = [
  {
    id: "12345",
    client: "João Silva",
    value: "R$ 850,00",
    avatar: "/placeholder.svg",
  },
  {
    id: "12344",
    client: "Maria Santos",
    value: "R$ 1.250,00",
    avatar: "/placeholder.svg",
  },
]

const upcomingAppointments = [
  {
    title: "Manutenção Preventiva",
    time: "Hoje - 14:00",
    status: "Confirmado",
  },
  {
    title: "Instalação de Equipamento",
    time: "Amanhã - 09:30",
    status: "Pendente",
  },
]

export default function Dashboard() {
  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Agendamentos Hoje" value="R$ 12.450" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Novos Clientes" value="24" icon={<Users className="h-5 w-5" />} />
        <StatCard title="Agendamentos" value="8" icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Pets Cadastrados" value="12" icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Últimas Agendamentos</h2>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                    <img src={sale.avatar || "/placeholder.svg"} alt={sale.client} />
                  </div>
                  <div>
                    <p className="font-medium">{sale.client}</p>
                    <p className="text-sm text-muted-foreground">Pedido #{sale.id}</p>
                  </div>
                </div>
                <p className="font-medium">{sale.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Próximos Agendamentos</h2>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{appointment.title}</p>
                    <p className="text-sm text-muted-foreground">{appointment.time}</p>
                  </div>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
