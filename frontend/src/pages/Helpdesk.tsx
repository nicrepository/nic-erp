import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, MoreHorizontal, Search } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
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
  const { user } = useAuth()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [priority, setPriority] = useState("")
  const [description, setDescription] = useState("")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [searchTicket, setSearchTicket] = useState("")

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token")
      
      let endpoint = '/helpdesk/tickets/my'

      if (user?.roles?.includes('ROLE_ADMIN')) {
        endpoint = '/helpdesk/tickets'
      } else if (user?.roles?.includes('ROLE_TI')) {
        endpoint = '/helpdesk/tickets/department/IT'
      } else if (user?.roles?.includes('ROLE_RH')) {
        endpoint = '/helpdesk/tickets/department/HR'
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTickets(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar chamados:", error)
    }
  }

  const fetchComments = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/helpdesk/tickets/${ticketId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Erro ao buscar comentários:", error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/helpdesk/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment("") 
        fetchComments(selectedTicket.id) 
      } else {
        alert("Erro ao enviar comentário.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleResolveTicket = async () => {
    if (!newComment.trim()) {
      alert("Atenção: É obrigatório detalhar o que foi feito na caixa de comentários antes de marcar como resolvido.");
      document.getElementById("nota-resolucao")?.focus();
      return; 
    }

    await handleAddComment();
    await handleUpdateStatus(selectedTicket.id, 'RESOLVED');
  }

  const handleAssignTicket = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/helpdesk/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchTickets() 
      } else {
        alert("Erro ao atribuir chamado. Verifique suas permissões.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/helpdesk/tickets/${ticketId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchTickets() 
        
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus })
        }
      } else {
        alert("Erro ao atualizar o status do chamado.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  useEffect(() => {
    if (isDetailModalOpen && selectedTicket) {
      fetchComments(selectedTicket.id)
    } else {
      setComments([]) 
    }
  }, [isDetailModalOpen, selectedTicket])

  useEffect(() => {
    fetchTickets()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return <Badge variant="destructive" className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/25">Aberto</Badge>
      case "IN_PROGRESS": return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/25">Em Andamento</Badge>
      case "RESOLVED": return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/25">Resolvido</Badge>
      case "CLOSED": return <Badge variant="outline" className="text-muted-foreground border-border">Fechado</Badge>
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
        setTitle("")
        setDepartment("")
        setPriority("")
        setDescription("")
        setIsModalOpen(false)
        fetchTickets()
      } else {
        alert("Erro ao criar chamado. Verifique se os dados estão corretos.")
      }
    } catch (error) {
      alert("Erro de conexão. O servidor Spring Boot está rodando?")
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const searchTerm = searchTicket.toLowerCase()
    const translatedDept = translateDepartment(ticket.department).toLowerCase()
    const translatedPriority = translatePriority(ticket.priority).toLowerCase()
    
    const statusText = ticket.status === 'OPEN' ? 'aberto' :
                       ticket.status === 'IN_PROGRESS' ? 'em andamento' :
                       ticket.status === 'RESOLVED' ? 'resolvido' :
                       ticket.status === 'CLOSED' ? 'fechado' : (ticket.status || "").toLowerCase();

    return (
      (ticket.title || "").toLowerCase().includes(searchTerm) ||
      (ticket.description || "").toLowerCase().includes(searchTerm) ||
      (ticket.id || "").toLowerCase().includes(searchTerm) ||
      translatedDept.includes(searchTerm) ||
      translatedPriority.includes(searchTerm) ||
      statusText.includes(searchTerm)
    )
  })

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO RESPONSIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Service Desk</h1>
          <p className="text-sm text-muted-foreground">Gerencie e acompanhe os chamados de suporte da empresa.</p>
        </div>

        {/* Barra de busca e botão se adaptam no mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar título, ID, status..."
              className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground"
              value={searchTicket}
              onChange={(e) => setSearchTicket(e.target.value)}
            />
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <PlusCircle className="h-4 w-4" /> Novo Chamado
              </Button>
            </DialogTrigger>
            {/* Modal de Criação: Ajuste de max-height e width no Mobile */}
            <DialogContent className="sm:max-w-[500px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
              <DialogHeader>
                <DialogTitle>Abrir Novo Chamado</DialogTitle>
                <DialogDescription className="text-muted-foreground">Descreva o problema detalhadamente. Um técnico será atribuído em breve.</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateTicket}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título do Problema</Label>
                    <Input id="title" placeholder="Ex: Erro no sistema" className="bg-background" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="department">Departamento</Label>
                        <Select value={department} onValueChange={setDepartment} required>
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                          <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                    <Textarea id="description" placeholder="Descreva o que está acontecendo..." className="min-h-[100px] bg-background" value={description} onChange={(e) => setDescription(e.target.value)} required />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" className="w-full sm:w-auto mb-2 sm:mb-0" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="w-full sm:w-auto">Criar Chamado</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        {/* Modal de Detalhes: Ajuste de max-height e width no Mobile */}
        <DialogContent className="sm:max-w-[600px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Detalhes do Chamado</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Informações completas do ticket selecionado.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-4">
              
              {/* O grid de informações curtas quebra em 2 colunas, mas no celular fica bem espremido, então coloquei grid-cols-2 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg border border-border">
                <div className="col-span-2 sm:col-span-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">ID</h4>
                  <p className="text-sm font-medium text-foreground uppercase">
                    {selectedTicket.id ? selectedTicket.id.substring(0, 8) : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Área</h4>
                  <p className="text-sm text-foreground">{translateDepartment(selectedTicket.department)}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prioridade</h4>
                  <p className="text-sm text-foreground">{translatePriority(selectedTicket.priority)}</p>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-foreground mb-1">Título</h4>
                <p className="text-base text-foreground">{selectedTicket.title}</p>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-foreground mb-2">Descrição do Problema</h4>
                <div className="bg-background p-3 rounded-md border border-border text-sm text-muted-foreground min-h-[120px] whitespace-pre-wrap">
                  {selectedTicket.description || "Nenhuma descrição fornecida no momento da abertura do chamado."}
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <h4 className="text-sm font-semibold text-foreground mb-4">Interações do Chamado</h4>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 mb-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/50 rounded-md border border-dashed border-border">
                      Nenhum comentário registrado ainda.
                    </p>
                  ) : (
                    comments.map((comment, index) => (
                      <div key={index} className="bg-muted/50 p-3 rounded-md border border-border text-sm text-foreground">
                        <div className="font-semibold text-xs text-muted-foreground mb-1">Analista / Solicitante</div>
                        <div className="whitespace-pre-wrap">{comment.content}</div> 
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Textarea 
                    id="nota-resolucao"
                    placeholder="Adicione um comentário ou atualização..." 
                    className="min-h-[60px] resize-none bg-background w-full"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button 
                    className="h-auto w-full sm:w-auto" 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Enviar
                  </Button>
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row justify-between w-full sm:justify-between items-stretch sm:items-center mt-6 gap-2">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {selectedTicket?.status === 'OPEN' && (
                <Button 
                  variant="secondary" 
                  className="w-full sm:w-auto"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')}
                >
                  Iniciar Atendimento
                </Button>
              )}
              
            {selectedTicket?.status === 'IN_PROGRESS' && (
              <Button 
                className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 w-full sm:w-auto" 
                onClick={handleResolveTicket}
              >
                Marcar como Resolvido
              </Button>
            )}
            </div>
            
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDetailModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-border bg-card shadow-sm w-full">
        {/* 2. SCROLL HORIZONTAL DA TABELA */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-muted/50 border-border">
                {/* Garantimos largura mínima nas colunas (min-w) para elas não se esmagarem no mobile */}
                <TableHead className="w-[100px] min-w-[100px] text-muted-foreground">ID</TableHead>
                <TableHead className="text-muted-foreground min-w-[200px]">Título</TableHead>
                <TableHead className="text-muted-foreground min-w-[150px]">Departamento</TableHead>
                <TableHead className="text-muted-foreground min-w-[130px]">Status</TableHead>
                <TableHead className="text-muted-foreground min-w-[100px]">Prioridade</TableHead>
                <TableHead className="text-right text-muted-foreground min-w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum chamado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50 border-border">
                    <TableCell className="font-medium text-foreground uppercase whitespace-nowrap">
                      {ticket.id ? ticket.id.substring(0, 8) : 'TCK-NEW'}
                    </TableCell>
                    {/* O título pode quebrar linha, mas as outras colunas usamos whitespace-nowrap */}
                    <TableCell className="text-foreground">{ticket.title}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{translateDepartment(ticket.department)}</TableCell>
                    <TableCell className="whitespace-nowrap">{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{translatePriority(ticket.priority)}</TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px] bg-popover text-popover-foreground border-border">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          
                          <DropdownMenuItem 
                            className="cursor-pointer focus:bg-muted focus:text-accent-foreground" 
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setIsDetailModalOpen(true)
                            }}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="cursor-pointer focus:bg-muted focus:text-accent-foreground"
                            onClick={() => handleAssignTicket(ticket.id)}
                          >
                            Atribuir a mim
                          </DropdownMenuItem>
                          
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
    </div>
  )
}