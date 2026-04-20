import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, MoreHorizontal, Search, ListFilter, AlertCircle, AlertTriangle, UserSquare, CheckCircle2, RefreshCw, Loader2, InboxIcon } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, usePagination } from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 10

export function Helpdesk() {
  const { user } = useAuth()
  const toast = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [description, setDescription] = useState("")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [searchTicket, setSearchTicket] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [isSendingComment, setIsSendingComment] = useState(false)

  // ESTADOS: VALIDAÇÃO DO FORMULÁRIO ---
  const [titleError, setTitleError] = useState("")
  const [descError, setDescError] = useState("")
  
  const [activeTab, setActiveTab] = useState("all")

  // NOVO ESTADO: Lista de Usuários para traduzir os IDs em Nomes
  const [users, setUsers] = useState<any[]>([])
  // UUID do usuário logado (obtido via /users/me — acessível a todos)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // NOVA FUNÇÃO: Busca os usuários (Igual ao que fizemos no Inventário)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  // Busca o UUID do usuário logado — funciona para qualquer role
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const me = await response.json()
        setCurrentUserId(me.id)
      }
    } catch (error) {
      console.error("Erro ao buscar usuário atual:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/helpdesk/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setCategories(await response.json())
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    }
  }

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
    setIsSendingComment(true)
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
        toast.error("Erro ao enviar comentário", "Tente novamente.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      toast.error("Erro de conexão", "Verifique sua rede e tente novamente.")
    } finally {
      setIsSendingComment(false)
    }
  }

  const handleResolveTicket = async () => {
    if (!newComment.trim()) {
      toast.warning("Comentário obrigatório", "Descreva o que foi feito antes de marcar como resolvido.");
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
        const updated = await response.json()
        fetchTickets()
        // Atualiza o modal com o novo status e assigneeId retornados pelo backend
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: updated.status, assigneeId: updated.assigneeId })
        }
      } else {
        toast.error("Erro ao atribuir chamado", "Verifique suas permissões.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      toast.error("Erro de conexão", "Verifique sua rede e tente novamente.")
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
        toast.error("Erro ao atualizar status", "Tente novamente.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      toast.error("Erro de conexão", "Verifique sua rede e tente novamente.")
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
    // 1. Busca os dados imediatamente quando a tela é aberta
    fetchUsers()
    fetchCurrentUser()
    fetchTickets()
    fetchCategories()

    // 2. Inicia o relógio (Polling): A cada 30 segundos, atualiza apenas a fila de chamados
    const intervalId = setInterval(() => {
      fetchTickets()
    }, 30000) // 30000 milissegundos = 30 segundos

    // 3. Limpeza (Muito Importante): Destrói o relógio se o usuário mudar de tela
    // Isso evita que o sistema fique buscando chamados se o cara for pra tela de Inventário, economizando internet e memória.
    return () => clearInterval(intervalId)
  }, [])

  // NOVA FUNÇÃO: Traduz o ID do usuário para o Nome
  const getUserName = (userId: string) => {
    if (!userId) return "Usuário Desconhecido"
    const foundUser = users.find(u => u.id === userId)
    // Se achar, retorna o nome, se não, avisa que desconhece
    return foundUser ? foundUser.name : "Usuário Desconhecido"
  }

  const getStatusBadge = (status: string) => {    switch (status?.toUpperCase()) {
      case "OPEN": return <Badge variant="destructive" className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/25">Aberto</Badge>
      case "IN_PROGRESS": return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/25">Em Andamento</Badge>
      case "RESOLVED": return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/25">Resolvido</Badge>
      case "CLOSED": return <Badge variant="outline" className="text-muted-foreground border-border">Fechado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT": return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">Urgente</Badge>
      case "HIGH":   return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30">Alta</Badge>
      case "MEDIUM": return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-500 border-yellow-500/30">Média</Badge>
      case "LOW":    return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Baixa</Badge>
      default:       return <Badge variant="outline">{priority}</Badge>
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

  const validateTitle = (v: string) => {
    if (!v.trim()) return "Título é obrigatório"
    if (v.trim().length < 5) return "Título deve ter ao menos 5 caracteres"
    return ""
  }
  const validateDesc = (v: string) => {
    if (!v.trim()) return "Descrição é obrigatória"
    if (v.trim().length < 10) return "Descrição deve ter ao menos 10 caracteres"
    return ""
  }
  const isTicketFormValid = !titleError && !descError && title.trim() !== "" && description.trim() !== "" && categoryId !== ""

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingTicket(true)
    const newTicketPayload = { title, description, categoryId }
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
        setCategoryId("")
        setSelectedCategory(null)
        setDescription("")
        setIsModalOpen(false)
        fetchTickets()
        toast.success("Chamado criado!", "Seu chamado foi registrado e será atendido em breve.")
      } else {
        toast.error("Erro ao criar chamado", "Verifique se todos os campos estão preenchidos corretamente.")
      }
    } catch (error) {
      toast.error("Erro de conexão", "O servidor não está respondendo. Tente novamente.")
    } finally {
      setIsCreatingTicket(false)
    }
  }

  const searchFilteredTickets = tickets.filter(ticket => {
    const searchTerm = searchTicket.toLowerCase()
    const translatedDept = translateDepartment(ticket.department).toLowerCase()
    const translatedPriority = translatePriority(ticket.priority).toLowerCase()
    
    // Pega o nome do solicitante para também permitir a busca pelo nome!
    const requesterName = getUserName(ticket.requesterId).toLowerCase()
    
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
      statusText.includes(searchTerm) ||
      requesterName.includes(searchTerm) // Agora a busca funciona por nome da pessoa!
    )
  })

  // 2. SEGUNDO: Aplica o filtro das Abas (Segmentação)
  const displayTickets = searchFilteredTickets.filter(ticket => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return ticket.status === 'OPEN';
    
    if (activeTab === "mine") {
      const responsavelId = ticket.assigneeId || ticket.assignee?.id || ticket.assignedTo || ticket.technicianId;
      const isActiveStatus = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS';
      return String(responsavelId) === currentUserId && isActiveStatus;
    }
    
    if (activeTab === "closed") return ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
    
    return true;
  });

  const { totalPages, paginate } = usePagination(displayTickets, ITEMS_PER_PAGE)
  const paginatedTickets = paginate(currentPage)

  return (
    <div className="flex flex-col min-h-full">
      {/* Fiori page header */}
      <div className="fiori-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Service Desk</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie e acompanhe os chamados de suporte da empresa.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar título, status, pessoa..."
              className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground h-9"
              value={searchTicket}
              onChange={(e) => { setSearchTicket(e.target.value); setCurrentPage(1) }}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchTickets} className="hidden sm:flex h-9 w-9" title="Atualizar fila" aria-label="Atualizar fila">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) { setTitleError(""); setDescError("") } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto h-9">
                <PlusCircle className="h-4 w-4" /> Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
              <DialogHeader>
                <DialogTitle>Abrir Novo Chamado</DialogTitle>
                <DialogDescription className="text-muted-foreground">Descreva o problema detalhadamente. Um técnico será atribuído em breve.</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateTicket}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título do Problema</Label>
                    <Input id="title" placeholder="Ex: Erro no sistema" className="bg-background" value={title} onChange={(e) => { setTitle(e.target.value); setTitleError(validateTitle(e.target.value)) }} onBlur={(e) => setTitleError(validateTitle(e.target.value))} />
                    {titleError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{titleError}</p>}
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={categoryId}
                      onValueChange={(val) => {
                        setCategoryId(val)
                        setSelectedCategory(categories.find(c => c.id === val) || null)
                      }}
                      required
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione a categoria do problema" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCategory && (
                      <div className="flex items-center gap-2 mt-1 p-2 rounded-md bg-muted/50 border border-border">
                        <span className="text-xs text-muted-foreground">Prioridade atribuída automaticamente:</span>
                        {getPriorityBadge(selectedCategory.priority)}
                        <span className="text-xs text-muted-foreground ml-auto">
                          Área: {translateDepartment(selectedCategory.department)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição Detalhada</Label>
                    <Textarea id="description" placeholder="Descreva o que está acontecendo..." className="min-h-[100px] bg-background" value={description} onChange={(e) => { setDescription(e.target.value); setDescError(validateDesc(e.target.value)) }} onBlur={(e) => setDescError(validateDesc(e.target.value))} />
                    {descError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{descError}</p>}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" className="w-full sm:w-auto mb-2 sm:mb-0" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={!isTicketFormValid || isCreatingTicket}>
                    {isCreatingTicket ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : "Criar Chamado"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      <div className="p-4 md:p-6 space-y-4">
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Detalhes do Chamado</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Informações completas do ticket selecionado.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-4">
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
                  <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
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
                        
                        {/* AQUI MOSTRAMOS O NOME DE QUEM COMENTOU */}
                        {/* Se o seu back-end usar outro nome, troque comment.authorId para o correto (ex: comment.userId) */}
                        <div className="font-semibold text-xs text-primary mb-1">
                          {getUserName(comment.authorId || comment.userId || comment.createdBy)}
                        </div>
                        
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
                    disabled={!newComment.trim() || isSendingComment}
                  >
                    {isSendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
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
                  onClick={() => handleAssignTicket(selectedTicket.id)}
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

      {/* --- SISTEMA DE ABAS (FILTROS) --- */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1) }} className="w-full">
        
        <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-4 lg:w-[600px] mb-4 h-auto gap-1 sm:gap-0">
          <TabsTrigger value="all" className="gap-2 w-full">
            <ListFilter className="h-4 w-4" /> Todos
          </TabsTrigger>
          <TabsTrigger value="open" className="gap-2 w-full">
            <AlertCircle className="h-4 w-4" /> Em Aberto
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-2 w-full">
            <UserSquare className="h-4 w-4" /> Meus Chamados
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2 w-full">
            <CheckCircle2 className="h-4 w-4" /> Finalizados
          </TabsTrigger>
        </TabsList>

        <div className="rounded-md border border-border bg-card shadow-sm w-full">
          <div className="overflow-x-auto">
            <Table className="w-full" aria-label="Lista de chamados">
              <TableHeader>
                <TableRow className="hover:bg-muted/50 border-border">
                  <TableHead className="w-[100px] min-w-[100px] text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground min-w-[150px]">Solicitante</TableHead>
                  <TableHead className="text-muted-foreground min-w-[200px]">Título</TableHead>
                  <TableHead className="text-muted-foreground min-w-[150px]">Departamento</TableHead>
                  <TableHead className="text-muted-foreground min-w-[130px]">Status</TableHead>
                  <TableHead className="text-muted-foreground min-w-[100px]">Prioridade</TableHead>
                  <TableHead className="text-right text-muted-foreground min-w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <InboxIcon className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Nenhum chamado encontrado</p>
                        <p className="text-xs opacity-70">
                          {searchTicket ? "Tente buscar com outros termos." : "Nenhum chamado nesta categoria."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50 border-border">
                      <TableCell className="font-medium text-foreground uppercase whitespace-nowrap">
                        {ticket.id ? ticket.id.substring(0, 8) : 'TCK-NEW'}
                      </TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {getUserName(ticket.requesterId)}
                      </TableCell>
                      <TableCell className="text-foreground">{ticket.title}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{translateDepartment(ticket.department)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted" aria-label="Mais opções">
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
                            {ticket.status === 'OPEN' && (
                              <DropdownMenuItem 
                                className="cursor-pointer focus:bg-muted focus:text-accent-foreground"
                                onClick={() => handleAssignTicket(ticket.id)}
                              >
                                Atribuir a mim
                              </DropdownMenuItem>
                            )}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayTickets.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </Tabs>
      </div>
    </div>
  )
}