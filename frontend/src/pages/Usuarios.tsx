import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, ShieldAlert, PlusCircle, Search, Mail, Key, MoreHorizontal } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Usuarios() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')

  const [usersList, setUsersList] = useState<any[]>([])
  const [availableRoles, setAvailableRoles] = useState<any[]>([]) // <-- ESTADO NOVO PARA OS CARGOS DINÂMICOS
  const [searchUser, setSearchUser] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsersList(data)
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
      } else {
        const errorMsg = await response.text()
        alert(`Erro ao criar usuário: ${errorMsg}`)
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleToggleRole = async (userId: string, currentRoles: string[], toggledRole: string, isChecked: boolean) => {
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
      else alert("Erro ao alterar permissões. Tente novamente.")
    } catch (error) {
      console.error("Erro de conexão:", error)
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

  const filteredUsers = usersList.filter(u => {
    const search = searchUser.toLowerCase()
    const userRolesList = u.roles || (u.role ? [u.role] : ["ROLE_USER"])
    const translatedRolesText = userRolesList.map((r: string) => translateRole(r).label.toLowerCase()).join(" ")
    
    return (
      (u.name || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      translatedRolesText.includes(search)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Acessos</h1>
          <p className="text-sm text-muted-foreground">Administre os colaboradores e suas permissões no sistema.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuário..."
              className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
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
                        <Input id="name" className="pl-8 bg-background" placeholder="Ex: Caio Almeida" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail Corporativo</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" className="pl-8 bg-background" placeholder="caio@niclabs.com.br" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha Inicial</Label>
                      <div className="relative">
                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="password" type="password" className="pl-8 bg-background" placeholder="Defina uma senha segura" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Criar Conta</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm w-full">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="text-muted-foreground min-w-[150px]">Colaborador</TableHead>
                <TableHead className="text-muted-foreground min-w-[180px]">E-mail</TableHead>
                <TableHead className="text-muted-foreground min-w-[200px]">Cargos</TableHead>
                {isAdmin && <TableHead className="text-right text-muted-foreground w-[80px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-muted-foreground">
                    Nenhum colaborador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
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
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border">
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
    </div>
  )
}