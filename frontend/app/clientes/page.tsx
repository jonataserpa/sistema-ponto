"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import { ClientFormModal } from "@/components/clients/client-form-modal"
import { Plus, Search, Filter, Pencil, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Dados iniciais de exemplo
const initialClients = [
  {
    id: "#12345",
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 98765-4321",
    status: "Ativo",
    petName: "Rex",
    notes: "Cliente frequente, prefere atendimento pela manhã",
    avatar: "/placeholder.svg",
  },
  {
    id: "#12346",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    phone: "(21) 97654-3210",
    status: "Ativo",
    petName: "Luna",
    notes: "Pet com histórico de alergias",
    avatar: "/placeholder.svg",
  },
  {
    id: "#12347",
    name: "Carlos Oliveira",
    email: "carlos.oliveira@email.com",
    phone: "(31) 96543-2109",
    status: "Inativo",
    petName: "Thor",
    notes: "",
    avatar: "/placeholder.svg",
  },
  {
    id: "#12348",
    name: "Ana Pereira",
    email: "ana.pereira@email.com",
    phone: "(41) 95432-1098",
    status: "Pendente",
    petName: "Mia",
    notes: "Primeira consulta agendada",
    avatar: "/placeholder.svg",
  },
]

export default function ClientesPage() {
  const [clients, setClients] = useState(initialClients)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const handleOpenModal = () => {
    setSelectedClient(null)
    setIsModalOpen(true)
  }

  const handleEditClient = (client: any) => {
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClient(null)
  }

  const handleSaveClient = (client: any) => {
    if (selectedClient) {
      // Editar cliente existente
      setClients((prevClients) => prevClients.map((c) => (c.id === client.id ? client : c)))
      toast({
        title: "Cliente atualizado",
        description: `${client.name} foi atualizado com sucesso.`,
      })
    } else {
      // Adicionar novo cliente
      setClients((prevClients) => [...prevClients, client])
      toast({
        title: "Cliente cadastrado",
        description: `${client.name} foi adicionado com sucesso.`,
      })
    }

    // Fechar a modal após salvar
    handleCloseModal()
  }

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      setClients((prevClients) => prevClients.filter((c) => c.id !== clientId))
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
        variant: "destructive",
      })
    }
  }

  // Filtrar clientes com base no termo de pesquisa
  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchTerm) ||
      client.petName.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      key: "name",
      header: "Nome",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
            <img src={item.avatar || "/placeholder.svg"} alt={item.name} />
          </div>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">ID: {item.id}</p>
          </div>
        </div>
      ),
    },
    { key: "petName", header: "Pet" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Telefone" },
    {
      key: "status",
      header: "Status",
      cell: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Ações",
      cell: (item: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEditClient(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteClient(item.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cadastro de Clientes</h1>
        <Button className="flex items-center gap-2" onClick={handleOpenModal}>
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes ou pets..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <DataTable columns={columns} data={filteredClients} emptyMessage="Nenhum cliente encontrado" />

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
        <Pagination currentPage={1} totalPages={1} />
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveClient}
        client={selectedClient}
      />
    </MainLayout>
  )
}
