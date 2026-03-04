import { useState } from "react"
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

const tickets = [
  { id: "TCK-001", title: "AnyDesk não gera código de acesso", requester: "Setor de Vendas", status: "Aberto", priority: "Alta", date: "2026-03-03" },
  { id: "TCK-002", title: "Migração do servidor de impressão Scanservjs", requester: "Diretoria", status: "Em Andamento", priority: "Média", date: "2026-03-02" },
  { id: "TCK-003", title: "Montagem de nova estação de trabalho", requester: "RH", status: "Resolvido", priority: "Baixa", date: "2026-02-28" },
]

export function Helpdesk() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Estados para capturar os dados do formulário
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("")
  const [description, setDescription] = useState("")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aberto": return <Badge variant="destructive">Aberto</Badge>
      case "Em Andamento": return <Badge className="bg-yellow-500 hover:bg-yellow-600">Em Andamento</Badge>
      case "Resolvido": return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Resolvido</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  // 2. Função que empacota e "envia" os dados
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault() // Impede a página de recarregar
    
    const newTicketPayload = {
      title,
      category,
      priority,
      description
    }

    // Por enquanto, vamos apenas imprimir no console para provar que funciona
    console.log("🚀 Chamado pronto para a API:", newTicketPayload)
    alert("Chamado capturado com sucesso! Olhe o console (F12).")

    // 3. Limpar o formulário e fechar o modal
    setTitle("")
    setCategory("")
    setPriority("")
    setDescription("")
    setIsModalOpen(false)
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
            
            {/* --- ADICIONAMOS A TAG FORM AQUI --- */}
            <form onSubmit={handleCreateTicket}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título do Problema</Label>
                  <Input 
                    id="title" 
                    placeholder="Ex: Erro DXGI_ERROR_DEVICE_HUNG" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="infra">Infraestrutura</SelectItem>
                        <SelectItem value="software">Sistemas/Software</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="acesso">Acessos/Senha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição Detalhada</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descreva o que está acontecendo..." 
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                {/* O botão agora é do tipo submit para disparar o form */}
                <Button type="submit">Criar Chamado</Button>
              </DialogFooter>
            </form>

          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        {/* ... (A Tabela continua idêntica aqui, eu omiti no texto para focar no modal, mas o código acima tem tudo) */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium text-zinc-900">{ticket.id}</TableCell>
                <TableCell className="text-zinc-700">{ticket.title}</TableCell>
                <TableCell className="text-zinc-600">{ticket.requester}</TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell className="text-zinc-600">{ticket.priority}</TableCell>
                <TableCell className="text-zinc-500">{ticket.date}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}