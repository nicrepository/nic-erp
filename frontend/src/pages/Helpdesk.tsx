import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, MoreHorizontal } from "lucide-react"
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

  // 2. A função que busca os chamados lá no Spring Boot
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token")
      
      // 2. A MÁGICA DO ROTEAMENTO DE FILAS:
      // O padrão é mostrar apenas os chamados abertos pelo próprio usuário
      let endpoint = '/helpdesk/tickets/my'

      // Se o usuário for Admin, vê TUDO
      if (user?.roles?.includes('ROLE_ADMIN')) {
        endpoint = '/helpdesk/tickets'
      } 
      // Se for da TI, vê a fila inteira de Infra/Sistemas/Hardware/Acessos
      else if (user?.roles?.includes('ROLE_TI')) {
        endpoint = '/helpdesk/tickets/department/IT'
      } 
      // Se for do RH, vê a fila do Recursos Humanos
      else if (user?.roles?.includes('ROLE_RH')) {
        endpoint = '/helpdesk/tickets/department/HR'
      }
      // Se tivermos Manutenção, Administrativo, basta adicionar os "else if" correspondentes!

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

  // Busca o histórico de comentários de um chamado específico
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

  // Envia um novo comentário
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
        // ATENÇÃO: Verifique se a sua classe TicketCommentRequestDTO no Java espera a chave "content" ou outro nome!
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        setNewComment("") // Limpa o campo de texto
        fetchComments(selectedTicket.id) // Atualiza a lista de comentários na hora!
      } else {
        alert("Erro ao enviar comentário.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Função que obriga a nota de resolução antes de fechar o chamado
  const handleResolveTicket = async () => {
    // Verifica se a caixa de texto está vazia
    if (!newComment.trim()) {
      alert("Atenção: É obrigatório detalhar o que foi feito na caixa de comentários antes de marcar como resolvido.");
      // Coloca o cursor piscando na caixa de texto para o usuário
      document.getElementById("nota-resolucao")?.focus();
      return; // Para a execução aqui, não deixa fechar!
    }

    // Se tem texto, a mágica acontece em duas etapas:
    // 1. Dispara a função que já temos de salvar o comentário
    await handleAddComment();
    
    // 2. Dispara a mudança de status para Resolvido
    await handleUpdateStatus(selectedTicket.id, 'RESOLVED');
  }

  // Assume o chamado para o usuário logado
  const handleAssignTicket = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/helpdesk/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchTickets() // Atualiza a tabela imediatamente
        // Opcional: alert("Chamado atribuído a você com sucesso!")
      } else {
        alert("Erro ao atribuir chamado. Verifique suas permissões.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Atualiza o status do chamado (Em Andamento, Resolvido, Fechado)
  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/helpdesk/tickets/${ticketId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        fetchTickets() // Atualiza a tabela
        
        // Se o modal estiver aberto, atualiza o status na tela do modal também sem precisar fechar
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

  // O gatilho: Toda vez que o usuário abrir o modal de detalhes, o React busca os comentários daquele chamado
  useEffect(() => {
    if (isDetailModalOpen && selectedTicket) {
      fetchComments(selectedTicket.id)
    } else {
      setComments([]) // Limpa a memória ao fechar o modal
    }
  }, [isDetailModalOpen, selectedTicket])

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

        {/* --- INÍCIO DO MODAL DE DETALHES --- */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Chamado</DialogTitle>
              <DialogDescription>
                Informações completas do ticket selecionado.
              </DialogDescription>
            </DialogHeader>

            {/* Só renderiza o conteúdo se tiver um chamado selecionado na memória */}
            {selectedTicket && (
              <div className="space-y-4 py-4">
                
                {/* Grid com as informações curtas */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">ID do Chamado</h4>
                    <p className="text-sm font-medium text-zinc-900 uppercase">
                      {selectedTicket.id ? selectedTicket.id.substring(0, 8) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status</h4>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Departamento</h4>
                    <p className="text-sm text-zinc-900">{translateDepartment(selectedTicket.department)}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Prioridade</h4>
                    <p className="text-sm text-zinc-900">{translatePriority(selectedTicket.priority)}</p>
                  </div>
                </div>

                {/* Título e Descrição */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-1">Título</h4>
                  <p className="text-base text-zinc-800">{selectedTicket.title}</p>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-2">Descrição do Problema</h4>
                  <div className="bg-white p-3 rounded-md border text-sm text-zinc-700 min-h-[120px] whitespace-pre-wrap">
                    {selectedTicket.description || "Nenhuma descrição fornecida no momento da abertura do chamado."}
                  </div>
                </div>

                {/* --- SEÇÃO DE COMENTÁRIOS (INTERAÇÕES) --- */}
                <div className="pt-4 border-t mt-4">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-4">Interações do Chamado</h4>
                  
                  {/* Lista de Comentários (Scrollável) */}
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic text-center py-4 bg-zinc-50 rounded-md border border-dashed">
                        Nenhum comentário registrado ainda.
                      </p>
                    ) : (
                      comments.map((comment, index) => (
                        <div key={index} className="bg-zinc-50 p-3 rounded-md border text-sm text-zinc-800">
                          {/* No futuro podemos colocar o nome de quem comentou e a data aqui! */}
                          <div className="font-semibold text-xs text-zinc-500 mb-1">Analista / Solicitante</div>
                          <div className="whitespace-pre-wrap">{comment.content}</div> 
                          {/* Lembrete: ajuste comment.content para o nome do campo de texto que o seu Java devolve */}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Campo para adicionar novo comentário */}
                  <div className="flex gap-2">
                    <Textarea 
                      id="nota-resolucao"
                      placeholder="Adicione um comentário ou atualização..." 
                      className="min-h-[60px] resize-none"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button 
                      className="h-auto bg-zinc-900 text-zinc-50" 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()} // Desabilita o botão se o campo estiver vazio
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
                {/* --- FIM DA SEÇÃO DE COMENTÁRIOS --- */}

              </div>
            )}

            <DialogFooter className="flex justify-between w-full sm:justify-between items-center mt-6">
              {/* Lado Esquerdo: Botões de Ação de Status */}
              <div className="flex gap-2">
                {selectedTicket?.status === 'OPEN' && (
                  <Button 
                    variant="secondary" 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')}
                  >
                    Iniciar Atendimento
                  </Button>
                )}
                
              {selectedTicket?.status === 'IN_PROGRESS' && (
                <Button 
                  className="bg-green-600 text-white hover:bg-green-700" 
                  onClick={handleResolveTicket}
                >
                  Marcar como Resolvido
                </Button>
              )}
              </div>
              
              {/* Lado Direito: Botão Fechar */}
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* --- FIM DO MODAL DE DETALHES --- */}
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
                        
                        <DropdownMenuItem 
                          className="cursor-pointer" 
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setIsDetailModalOpen(true)
                          }}
                        >
                          Ver detalhes
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="cursor-pointer"
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
  )
}