import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, ShieldAlert, PlusCircle, Search, Mail, Key } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function Usuarios() {
  const { user } = useAuth()
  
  // Verifica se é Admin (único que pode editar/criar)
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')

  const [usersList, setUsersList] = useState<any[]>([])
  const [searchUser, setSearchUser] = useState("")
  
  // Estados para o Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")

  // Busca a lista de usuários no back-end
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

  // Cria um novo usuário chamando a rota do AuthController
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Como o /auth/register é aberto, não precisa de token obrigatório, 
      // mas se o seu AuthContext exigir, enviamos por garantia
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Verifique se o seu RegisterDTO espera "name" ou "nome". Assumi name, email e password.
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
        fetchUsers() // Atualiza a tabela na hora
      } else {
        const errorMsg = await response.text()
        alert(`Erro ao criar usuário: ${errorMsg}`)
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Atualiza o cargo (Role) de um usuário chamando a rota do UserController
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/users/${userId}/role?roleName=${newRole}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchUsers() // Atualiza a tabela com o novo cargo
      } else {
        alert("Erro ao alterar permissão. Verifique se você tem acesso de Administrador.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Tradutor de Cargos para a tela ficar elegante
  const translateRole = (role: string) => {
    switch(role) {
      case 'ROLE_ADMIN': return { label: 'Administrador', color: 'bg-red-100 text-red-800 border-red-200' }
      case 'ROLE_TI': return { label: 'Equipe de TI', color: 'bg-blue-100 text-blue-800 border-blue-200' }
      case 'ROLE_RH': return { label: 'Recursos Humanos', color: 'bg-green-100 text-green-800 border-green-200' }
      case 'ROLE_USER': return { label: 'Usuário Padrão', color: 'bg-zinc-100 text-zinc-800 border-zinc-200' }
      default: return { label: role, color: 'bg-zinc-100 text-zinc-800' }
    }
  }

  // Filtro de Busca em tempo real (BLINDADO)
  const filteredUsers = usersList.filter(u => {
    const search = searchUser.toLowerCase()
    
    // Tenta pegar o cargo de várias formas seguras
    const userRole = u.role || (u.roles && u.roles.length > 0 ? u.roles[0] : "") || "UNKNOWN"
    const translatedRole = (translateRole(userRole).label || "").toLowerCase()
    
    return (
      (u.name || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search) ||
      translatedRole.includes(search)
    )
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gestão de Acessos</h1>
          <p className="text-sm text-zinc-500">Administre os colaboradores e suas permissões no sistema.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Barra de Busca */}
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

          {/* Botão de Novo Usuário - Apenas ADMIN vê */}
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

      {/* Tabela de Usuários */}
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Nível de Acesso (Cargo)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                // A mesma proteção aqui dentro do desenho da tabela
                const userRole = u.role || (u.roles && u.roles.length > 0 ? u.roles[0] : "") || "UNKNOWN"
                const roleConfig = translateRole(userRole)
                
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-zinc-900">{u.name}</TableCell>
                    <TableCell className="text-zinc-600">{u.email}</TableCell>
                    <TableCell>
                      
                      {isAdmin ? (
                        <Select 
                          defaultValue={userRole} 
                          onValueChange={(val) => handleUpdateRole(u.id, val)}
                        >
                          <SelectTrigger className={`w-[200px] h-8 text-xs font-semibold ${roleConfig.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ROLE_USER">Usuário Padrão</SelectItem>
                            <SelectItem value="ROLE_RH">Recursos Humanos</SelectItem>
                            <SelectItem value="ROLE_TI">Equipe de TI</SelectItem>
                            <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`gap-1 ${roleConfig.color}`}>
                          {userRole === 'ROLE_ADMIN' ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {roleConfig.label}
                        </Badge>
                      )}

                    </TableCell>
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