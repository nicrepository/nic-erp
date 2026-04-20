import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, ShieldAlert, PlusCircle, Search, Mail, Key, MoreHorizontal, AlertTriangle, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pagination, usePagination } from "@/components/ui/pagination"

const ITEMS_PER_PAGE = 10

type SortField = "name" | "email"
type SortDir = "asc" | "desc"

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50 inline" />
  return sortDir === "asc"
    ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary inline" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary inline" />
}

export function Usuarios() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')

  // --- BARREIRA DE ACESSO NEGADO ---
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4 animate-in fade-in duration-500">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-md">
          Apenas administradores podem acessar o painel de Gestão de Usuários.
        </p>
      </div>
    )
  }

  const [usersList, setUsersList] = useState<any[]>([])
  const [availableRoles, setAvailableRoles] = useState<any[]>([])
  const [searchUser, setSearchUser] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Validação em tempo real — novo usuário
  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Ordenação da tabela
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // Indicador de salvando permissões
  const [savingRoleForUserId, setSavingRoleForUserId] = useState<string | null>(null)

  // ESTADOS DO MODAL DE EDIÇÃO
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserName, setEditUserName] = useState("")
  const [editUserEmail, setEditUserEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsersList(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  // <-- NOVA FUNÇÃO PARA BUSCAR OS CARGOS REAIS DO BANCO
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableRoles(data)
      }
    } catch (error) {
      console.error("Erro ao buscar cargos:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    if (isAdmin) {
      fetchRoles() // Só busca os cargos se o cara for Admin e puder ver o menu
    }
  }, [isAdmin])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword })
      })

      if (response.ok) {
        setIsModalOpen(false)
        setNewUserName("")
        setNewUserEmail("")
        setNewUserPassword("")
        fetchUsers()
        toast.success("Colaborador criado!", "A conta foi criada com sucesso.")
      } else {
        const errorMsg = await response.text()
        toast.error("Erro ao criar usuário", errorMsg)
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
      toast.error("Erro de conexão", "Verifique sua rede e tente novamente.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleRole = async (userId: string, currentRoles: string[], toggledRole: string, isChecked: boolean) => {
    setSavingRoleForUserId(userId)
    try {
      const token = localStorage.getItem("token")
      let updatedRoles = [...currentRoles]
      
      if (isChecked) {
        if (!updatedRoles.includes(toggledRole)) updatedRoles.push(toggledRole)
      } else {
        updatedRoles = updatedRoles.filter(role => role !== toggledRole)
      }

      if (updatedRoles.length === 0) updatedRoles.push("ROLE_USER")

      const response = await fetch(`/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updatedRoles)
      })

      if (response.ok) fetchUsers()
      else toast.error("Erro ao alterar permissões", "Tente novamente.")
    } catch (error) {
      console.error("Erro de conexão:", error)
    } finally {
      setSavingRoleForUserId(null)
    }
  }

  // <-- FUNÇÃO ATUALIZADA PARA LIDAR COM CARGOS DESCONHECIDOS (CUSTOMIZADOS)
  const translateRole = (role: string) => {
    switch(role) {
      case 'ROLE_ADMIN': return { label: 'Admin', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' }
      case 'ROLE_TI': return { label: 'TI', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' }
      case 'ROLE_RH': return { label: 'RH', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' }
      case 'ROLE_USER': return { label: 'Usuário Padrão', color: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30' }
      default: 
        // Se for um cargo novo (ex: ROLE_FINANCEIRO), tira o "ROLE_" e pinta de roxo
        const niceLabel = role.replace('ROLE_', '')
        return { label: niceLabel, color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' }
    }
  }

  const validateName = (v: string) => {
    if (!v.trim()) return "Nome é obrigatório"
    if (v.trim().length < 3) return "Nome deve ter ao menos 3 caracteres"
    return ""
  }
  const validateEmail = (v: string) => {
    if (!v.trim()) return "E-mail é obrigatório"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Informe um e-mail válido"
    return ""
  }
  const validatePassword = (v: string) => {
    if (!v) return "Senha é obrigatória"
    if (v.length < 6) return "A senha deve ter ao menos 6 caracteres"
    return ""
  }
  const isNewUserFormValid = !nameError && !emailError && !passwordError &&
    newUserName.trim() !== "" && newUserEmail.trim() !== "" && newUserPassword !== ""

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
    setCurrentPage(1)
  }

  const filteredUsers = useMemo(() => usersList.filter(u => {
    const search = searchUser.toLowerCase()
    const userRolesList = u.roles || (u.role ? [u.role] : ["ROLE_USER"])
    const translatedRolesText = userRolesList.map((r: string) => translateRole(r).label.toLowerCase()).join(" ")
    return (
      (u.name || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      translatedRolesText.includes(search)
    )
  }), [usersList, searchUser])

  const sortedUsers = useMemo(() => [...filteredUsers].sort((a, b) => {
    const av = (a[sortField] || "").toLowerCase()
    const bv = (b[sortField] || "").toLowerCase()
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
  }), [filteredUsers, sortField, sortDir])
  const { totalPages, paginate } = usePagination(sortedUsers, ITEMS_PER_PAGE)
  const paginatedUsers = paginate(currentPage)

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: editUserName, email: editUserEmail })
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        fetchUsers()
        toast.success("Dados atualizados!", "As informações do colaborador foram salvas.")
      } else {
        const errorMsg = await response.text()
        toast.error("Erro ao editar", errorMsg)
      }
    } catch (error) {
      console.error("Erro na edição:", error)
      toast.error("Erro de conexão", "Verifique sua rede e tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  // Função auxiliar para abrir o modal já com os dados preenchidos
  const openEditModal = (u: any) => {
    setEditingUser(u)
    setEditUserName(u.name)
    setEditUserEmail(u.email)
    setIsEditModalOpen(true)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Fiori page header */}
      <div className="fiori-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gestão de Acessos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Administre os colaboradores e suas permissões no sistema.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuário..."
              className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground h-9"
              value={searchUser}
              onChange={(e) => { setSearchUser(e.target.value); setCurrentPage(1) }}
            />
          </div>

          {isAdmin && (
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              setIsModalOpen(open)
              if (!open) { setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNameError(""); setEmailError(""); setPasswordError("") }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto h-9">
                  <PlusCircle className="h-4 w-4" /> Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] w-[95%] bg-background border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Cadastrar Colaborador</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Crie uma conta de acesso. Novos usuários recebem o cargo padrão de "Usuário Padrão".
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          className={`pl-8 bg-background ${nameError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          placeholder="Ex: Caio Almeida"
                          value={newUserName}
                          onChange={(e) => { setNewUserName(e.target.value); setNameError(validateName(e.target.value)) }}
                          onBlur={(e) => setNameError(validateName(e.target.value))}
                          required
                        />
                      </div>
                      {nameError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{nameError}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail Corporativo</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className={`pl-8 bg-background ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          placeholder="caio@niclabs.com.br"
                          value={newUserEmail}
                          onChange={(e) => { setNewUserEmail(e.target.value); setEmailError(validateEmail(e.target.value)) }}
                          onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                          required
                        />
                      </div>
                      {emailError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{emailError}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha Inicial</Label>
                      <div className="relative">
                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          className={`pl-8 bg-background ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          placeholder="Mínimo 6 caracteres"
                          value={newUserPassword}
                          onChange={(e) => { setNewUserPassword(e.target.value); setPasswordError(validatePassword(e.target.value)) }}
                          onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
                          required
                          minLength={6}
                        />
                      </div>
                      {passwordError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{passwordError}</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isCreating || !isNewUserFormValid} className="gap-2">
                      {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isCreating ? "Criando..." : "Criar Conta"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
      <div className="rounded-md border border-border bg-card shadow-sm w-full">
        <div className="overflow-x-auto">
          <Table className="w-full" aria-label="Lista de colaboradores">
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="text-muted-foreground min-w-[150px]">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Colaborador <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground min-w-[180px]">
                  <button
                    onClick={() => toggleSort("email")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    E-mail <SortIcon field="email" sortField={sortField} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-muted-foreground min-w-[200px]">Cargos</TableHead>
                {isAdmin && <TableHead className="text-right text-muted-foreground w-[80px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-12 text-muted-foreground">
                    {searchUser ? "Nenhum colaborador encontrado para esta busca." : "Nenhum colaborador cadastrado."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => {
                  const userRolesList = u.roles || (u.role ? [u.role] : ["ROLE_USER"])
                  
                  return (
                    <TableRow key={u.id} className="hover:bg-muted/50 border-border">
                      <TableCell className="font-medium text-foreground whitespace-nowrap">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {userRolesList.map((r: string) => {
                              const config = translateRole(r)
                              return (
                                  <Badge key={r} variant="outline" className={`text-[10px] whitespace-nowrap ${config.color}`}>
                                      {r === 'ROLE_ADMIN' ? <ShieldAlert className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                                      {config.label}
                                  </Badge>
                              )
                          })}
                        </div>
                      </TableCell>

                      {isAdmin && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted" disabled={savingRoleForUserId === u.id}>
                                <span className="sr-only">Abrir menu</span>
                                {savingRoleForUserId === u.id
                                  ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  : <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                }
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border">
                              {/* --- BOTÃO DE EDITAR --- */}
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuCheckboxItem 
                                className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
                                onClick={(e) => {
                                  e.preventDefault() // Impede o menu de fechar instantaneamente bizarramente
                                  openEditModal(u)
                                }}
                              >
                                Editar Dados Pessoais
                              </DropdownMenuCheckboxItem>

                              <DropdownMenuSeparator className="bg-border" />
                              {/* --- FIM DO BOTÃO DE EDITAR --- */}
                              <DropdownMenuLabel>Permissões do Sistema</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-border" />
                              
                              {/* <-- AGORA MAPEAMOS OS CARGOS REAIS DO BANCO --> */}
                              {availableRoles.map((sysRole) => (
                                  <DropdownMenuCheckboxItem 
                                      key={sysRole.id}
                                      checked={userRolesList.includes(sysRole.name)}
                                      onCheckedChange={(isChecked) => handleToggleRole(u.id, userRolesList, sysRole.name, isChecked)}
                                      className="focus:bg-muted focus:text-accent-foreground"
                                  >
                                      {translateRole(sysRole.name).label}
                                  </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* MODAL DE EDIÇÃO DE USUÁRIO (SÓ ADMIN VÊ) */}
      {isAdmin && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] w-[95%] bg-background border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Altere os dados de identificação corporativa deste usuário.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Nome Completo</Label>
                  <div className="relative">
                    <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="editName" className="pl-8 bg-background" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEmail">E-mail Corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="editEmail" type="email" className="pl-8 bg-background" value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
      </div>
    </div>
  )
}