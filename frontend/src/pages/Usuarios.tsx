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

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newUserName, 
          email: newUserEmail, 
          password: newUserPassword 
        })
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

  // --- NOVA FUNÇÃO PARA ATUALIZAR MÚLTIPLAS ROLES ---
  const handleToggleRole = async (userId: string, currentRoles: string[], toggledRole: string, isChecked: boolean) => {
    try {
      const token = localStorage.getItem("token")
      
      // Cria a nova lista de permissões baseada no clique
      let updatedRoles = [...currentRoles]
      if (isChecked) {
        // Se marcou, adiciona na lista
        if (!updatedRoles.includes(toggledRole)) updatedRoles.push(toggledRole)
      } else {
        // Se desmarcou, remove da lista
        updatedRoles = updatedRoles.filter(role => role !== toggledRole)
      }

      // Evita deixar o usuário sem nenhuma permissão (Segurança)
      if (updatedRoles.length === 0) {
          updatedRoles.push("ROLE_USER")
      }

      // Chama o novo endpoint /roles enviando a lista
      const response = await fetch(`/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updatedRoles)
      })

      if (response.ok) {
        fetchUsers() 
      } else {
        alert("Erro ao alterar permissões. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const translateRole = (role: string) => {
    switch(role) {
      case 'ROLE_ADMIN': return { label: 'Admin', color: 'bg-red-100 text-red-800 border-red-200' }
      case 'ROLE_TI': return { label: 'TI', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      case 'ROLE_RH': return { label: 'RH', color: 'bg-green-100 text-green-800 border-green-200' }
      case 'ROLE_USER': return { label: 'Usuário', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' }
      default: return { label: role, color: 'bg-zinc-100 text-zinc-800' }
    }
  }

  const filteredUsers = usersList.filter(u => {
    const search = searchUser.toLowerCase()
    // Como agora são várias roles, juntamos os labels para buscar
    const userRolesList = u.roles || (u.role ? [u.role] : ["ROLE_USER"])
    const translatedRolesText = userRolesList.map((r: string) => translateRole(r).label.toLowerCase()).join(" ")
    
    return (
      (u.name || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      translatedRolesText.includes(search)
    )
  })

  // Lista de cargos disponíveis no sistema para gerar os Checkboxes
  const ALL_SYSTEM_ROLES = [
    { id: 'ROLE_USER', label: 'Usuário Padrão' },
    { id: 'ROLE_RH', label: 'Recursos Humanos' },
    { id: 'ROLE_TI', label: 'Equipe de TI' },
    { id: 'ROLE_ADMIN', label: 'Administrador' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestão de Acessos</h1>
          <p className="text-sm text-zinc-500">Administre os colaboradores e suas permissões no sistema.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Buscar por nome, email ou cargo..."
              className="pl-8 w-[280px]"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
                  <PlusCircle className="h-4 w-4" /> Novo Colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Cadastrar Colaborador</DialogTitle>
                  <DialogDescription>
                    Crie uma conta de acesso. Novos usuários recebem o cargo padrão de "Usuário Padrão".
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateUser}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input id="name" className="pl-8" placeholder="Ex: Caio Almeida" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail Corporativo</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input id="email" type="email" className="pl-8" placeholder="caio@niclabs.com.br" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha Inicial</Label>
                      <div className="relative">
                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                        <Input id="password" type="password" className="pl-8" placeholder="Defina uma senha segura" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required minLength={6} />
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

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cargos (Nível de Acesso)</TableHead>
              {isAdmin && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-8 text-zinc-500">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                // Previne erros garantindo que sempre será um array
                const userRolesList = u.roles || (u.role ? [u.role] : ["ROLE_USER"])
                
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-zinc-900">{u.name}</TableCell>
                    <TableCell className="text-zinc-600">{u.email}</TableCell>
                    <TableCell>
                      {/* RENDERIZA VÁRIOS BADGES LADO A LADO */}
                      <div className="flex flex-wrap gap-1.5">
                        {userRolesList.map((r: string) => {
                            const config = translateRole(r)
                            return (
                                <Badge key={r} variant="outline" className={`text-[10px] ${config.color}`}>
                                    {r === 'ROLE_ADMIN' ? <ShieldAlert className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                                    {config.label}
                                </Badge>
                            )
                        })}
                      </div>
                    </TableCell>

                    {/* BOTÃO DE EDITAR PERMISSÕES (Dropdown Menu) */}
                    {isAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Permissões do Sistema</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {ALL_SYSTEM_ROLES.map((sysRole) => (
                                <DropdownMenuCheckboxItem 
                                    key={sysRole.id}
                                    checked={userRolesList.includes(sysRole.id)}
                                    onCheckedChange={(isChecked) => handleToggleRole(u.id, userRolesList, sysRole.id, isChecked)}
                                >
                                    {sysRole.label}
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
  )
}