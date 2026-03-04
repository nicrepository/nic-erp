import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function Helpdesk() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Nosso novo estado que guarda a lista real do banco de dados
  const [tickets, setTickets] = useState<any[]>([])

  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [priority, setPriority] = useState("")
  const [description, setDescription] = useState("")

  // 2. A função que busca os chamados lá no Spring Boot
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token")
      // Vamos usar a rota /my que está mapeada no seu TicketController
      const response = await fetch('/helpdesk/tickets/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // O Spring Boot Page coloca a lista dentro do atributo "content"
        setTickets(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar chamados:", error)
    }
  }

  // 3. O useEffect dispara a busca assim que você entra na tela do Helpdesk
  useEffect(() => {
    fetchTickets()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return <Badge variant="destructive">Aberto</Badge>
      case "IN_PROGRESS": return <Badge className="bg-yellow-500 hover:bg-yellow-600">Em Andamento</Badge>
      case "RESOLVED": return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Resolvido</Badge>
      case "CLOSED": return <Badge variant="outline" className="text-zinc-500">Fechado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const translatePriority = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "LOW": return "Baixa"
      case "MEDIUM": return "Média"
      case "HIGH": return "Alta"
      case "URGENT": return "Urgente"
      default: return priority
    }
  }

  const translateDepartment = (dept: string) => {
    switch (dept?.toUpperCase()) {
      case "IT": return "TI"
      case "ADMIN": return "Administrativo"
      case "HR": return "RH"
      case "MAINTENANCE": return "Manutenção"
      default: return dept
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newTicketPayload = { title, description, priority, department }
    const token = localStorage.getItem("token")

    try {
      const response = await fetch('/helpdesk/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTicketPayload)
      })

      if (response.ok) {
        // Removemos o alert() para ficar uma experiência mais fluida
        setTitle("")
        setDepartment("")
        setPriority("")
        setDescription("")
        setIsModalOpen(false)
        
        // 4. A MÁGICA: Assim que salva no banco, manda o React buscar a lista atualizada!
        fetchTickets()
      } else {
        alert("Erro ao criar chamado. Verifique se os dados estão corretos.")
      }
    } catch (error) {
      alert("Erro de conexão. O servidor Spring Boot está rodando?")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Service Desk</h1>
          <p className="text-sm text-zinc-500">Gerencie e acompanhe os chamados de suporte da empresa.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
              <PlusCircle className="h-4 w-4" /> Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Abrir Novo Chamado</DialogTitle>
              <DialogDescription>Descreva o problema detalhadamente. Um técnico será atribuído em breve.</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateTicket}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título do Problema</Label>
                  <Input id="title" placeholder="Ex: Erro no sistema" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="department">Departamento</Label>
                      <Select value={department} onValueChange={setDepartment} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">Tecnologia da Informação (TI)</SelectItem>
                          <SelectItem value="ADMIN">Administrativo / Financeiro</SelectItem>
                          <SelectItem value="HR">Recursos Humanos</SelectItem>
                          <SelectItem value="MAINTENANCE">Manutenção Predial</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                      <Select value={priority} onValueChange={setPriority} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Baixa</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição Detalhada</Label>
                  <Textarea id="description" placeholder="Descreva o que está acontecendo..." className="min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Criar Chamado</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 5. Fazemos o loop na lista real que veio do banco */}
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  Nenhum chamado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  {/* Como o seu ID é um UUID gigante, vamos mostrar só os 8 primeiros caracteres para ficar elegante */}
                  <TableCell className="font-medium text-zinc-900 uppercase">
                    {ticket.id ? ticket.id.substring(0, 8) : 'TCK-NEW'}
                  </TableCell>
                  <TableCell className="text-zinc-700">{ticket.title}</TableCell>
                  
                  {/* Aplicando o tradutor de Departamento */}
                  <TableCell className="text-zinc-600">{translateDepartment(ticket.department)}</TableCell>
                  
                  {/* Aplicando as cores do Status */}
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  
                  {/* Aplicando o tradutor de Prioridade */}
                  <TableCell className="text-zinc-600">{translatePriority(ticket.priority)}</TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100">
                          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer">Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Atribuir a mim</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">Encerrar chamado</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}