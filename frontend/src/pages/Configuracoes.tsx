import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, PlusCircle, UserCog, Settings, Key, Mail } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

export function Configuracoes() {
  const { user, updateUser } = useAuth()
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')

  // Estados para os dados da API
  const [roles, setRoles] = useState<any[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([])

  // Estados para o Modal de CRIAR Cargo
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([])

  // Estados para o Modal de EDITAR Cargo
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [editingPermissions, setEditingPermissions] = useState<string[]>([])

  // ESTADOS PARA O PERFIL
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- ESTADOS PARA ALTERAR SENHA ---
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Dicionário amigável para traduzir o nome das permissões do back-end para o usuário
  const translatePermission = (perm: string) => {
    const dict: Record<string, string> = {
      'ACCESS_INVENTORY_ADMIN': 'Estoque (RH/Admin)',
      'ACCESS_INVENTORY_IT': 'Ativos de TI',
      'ACCESS_HELPDESK': 'Helpdesk',
      'ACCESS_USERS': 'Gestão de Usuários',
      'ACCESS_DASHBOARD': 'Visualizar Dashboard',
      'ACCESS_ANNOUNCEMENTS_MANAGE': 'Gerenciar Comunicados'
    }
    return dict[perm] || perm
  }

  // Busca inicial dos dados
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      
      // Busca os Cargos (Roles)
      const resRoles = await fetch('/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resRoles.ok) setRoles(await resRoles.json())

      // Busca as Permissões cadastradas no banco
      const resPerms = await fetch('/roles/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resPerms.ok) setAvailablePermissions(await resPerms.json())

    } catch (error) {
      console.error("Erro ao buscar dados de configuração:", error)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchData()
  }, [isAdmin])

  // Função para criar um novo Cargo
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      // Garante que o nome comece com ROLE_ para seguir o padrão do Spring
      const finalRoleName = newRoleName.startsWith("ROLE_") ? newRoleName.toUpperCase() : `ROLE_${newRoleName.toUpperCase()}`

      const response = await fetch('/roles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: finalRoleName, permissions: newRolePermissions })
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setNewRoleName("")
        setNewRolePermissions([])
        fetchData()
      } else {
        alert("Erro ao criar cargo. Ele já pode existir.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Função para atualizar as permissões de um cargo existente
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRole) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/roles/${editingRole.id}/permissions`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editingPermissions)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setEditingRole(null)
        fetchData()
      } else {
        alert("Erro ao atualizar permissões.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Toggle para adicionar/remover permissão do array temporário (usado no Create e no Edit)
  const togglePermission = (permName: string, isEditing: boolean) => {
    if (isEditing) {
      setEditingPermissions(prev => 
        prev.includes(permName) ? prev.filter(p => p !== permName) : [...prev, permName]
      )
    } else {
      setNewRolePermissions(prev => 
        prev.includes(permName) ? prev.filter(p => p !== permName) : [...prev, permName]
      )
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setIsUploading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users/me/avatar', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
          // ⚠️ ATENÇÃO: NÃO coloque 'Content-Type': 'multipart/form-data' aqui!
          // O navegador precisa gerar o cabeçalho sozinho com o "boundary" correto do arquivo.
        },
        body: formData
      })

      if (response.ok) {
        // O back-end devolve os dados do usuário atualizados (com a nova avatarUrl)
        const updatedUserData = await response.json() 
        
        // Injetamos a URL da foto direto no contexto do React (atualiza o cabeçalho e o perfil na hora!)
        updateUser({ avatarUrl: updatedUserData.avatarUrl }) 
        
      } else {
        alert("Erro ao enviar a foto de perfil.")
      }
    } catch (error) {
      console.error("Erro no upload:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      alert("As novas senhas não coincidem!")
      return
    }

    setIsChangingPassword(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users/me/password', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (response.ok) {
        alert("Senha alterada com sucesso!")
        // Limpa os campos após o sucesso
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const errorMsg = await response.text()
        alert(`Erro: ${errorMsg}`)
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      alert("Erro de conexão ao alterar a senha.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências e os acessos globais do sistema.</p>
        </div>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 max-w-[400px] mb-4 h-auto gap-1 sm:gap-0">
          <TabsTrigger value="perfil" className="gap-2 w-full">
            <UserCog className="h-4 w-4" /> Meu Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="sistema" className="gap-2 w-full">
              <Settings className="h-4 w-4" /> Sistema & Acessos
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* ABA: MEU PERFIL */}
        <TabsContent value="perfil" className="mt-4 space-y-6">
          
          {/* BLOCO 1: DADOS DO USUÁRIO */}
          <div className="rounded-md border border-border bg-card shadow-sm p-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
              
              {/* ÁREA DA FOTO */}
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="h-24 w-24 rounded-full border-4 border-background shadow-md overflow-hidden bg-muted flex items-center justify-center relative">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground uppercase">
                      {user?.name?.substring(0, 2)}
                    </span>
                  )}
                  {/* Overlay escuro que aparece no Hover */}
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                    <span className="text-white text-xs font-medium">Trocar</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </div>

              {/* DADOS DO USUÁRIO */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-xl font-bold text-foreground">{user?.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-4 w-4" /> {user?.email}
                </p>
                <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-1">
                  {user?.roles?.map((r: string) => (
                    <Badge key={r} variant="secondary" className="text-[10px]">
                      {r.replace('ROLE_', '')}
                    </Badge>
                  ))}
                </div>
              </div>

            </div>

            {isUploading && (
              <div className="mt-4 text-center text-sm text-primary animate-pulse">
                Enviando arquivo, aguarde...
              </div>
            )}
          </div>

          {/* BLOCO 2: CARD DE SEGURANÇA (ALTERAR SENHA) */}
          <div className="rounded-md border border-border bg-card shadow-sm p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Segurança</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Atualize sua senha de acesso periodicamente para manter sua conta segura.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  className="bg-background"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    className="bg-background"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    className="bg-background"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? "Salvando..." : "Atualizar Senha"}
                </Button>
              </div>
            </form>
          </div>

        </TabsContent>

        {/* ABA: SISTEMA & ACESSOS (RBAC DINÂMICO) */}
        {isAdmin && (
          <TabsContent value="sistema" className="mt-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">Cargos e Permissões (RBAC)</h3>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Novo Cargo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] w-[95%] bg-background border-border text-foreground">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Cargo</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Defina um nome para o cargo e selecione a quais módulos ele terá acesso.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRole}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Identificador do Cargo</Label>
                        <Input 
                          id="name" 
                          placeholder="Ex: FINANCEIRO, RH, DIRETORIA" 
                          className="bg-background border-input text-foreground uppercase"
                          value={newRoleName} 
                          onChange={(e) => setNewRoleName(e.target.value)} 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-3 pt-2 border-t border-border mt-2">
                        <Label>Permissões de Acesso</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-1">
                          {availablePermissions.map(perm => (
                            <div key={perm.id} className="flex items-start space-x-2 bg-muted/30 p-2 rounded-md border border-border">
                              <Checkbox 
                                id={`new-${perm.id}`} 
                                checked={newRolePermissions.includes(perm.name)}
                                onCheckedChange={() => togglePermission(perm.name, false)}
                              />
                              <Label htmlFor={`new-${perm.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                {translatePermission(perm.name)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                      <Button type="submit">Salvar Cargo</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm w-full">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 border-border">
                      <TableHead className="text-muted-foreground min-w-[150px]">Cargo (Role)</TableHead>
                      <TableHead className="text-muted-foreground min-w-[300px]">Módulos Liberados</TableHead>
                      <TableHead className="text-right text-muted-foreground min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhum cargo cadastrado no sistema.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id} className="hover:bg-muted/50 border-border">
                          <TableCell className="font-medium text-foreground whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {role.name === 'ROLE_ADMIN' ? <Shield className="h-4 w-4 text-red-500" /> : <Key className="h-4 w-4 text-primary" />}
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {role.name === 'ROLE_ADMIN' ? (
                                <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">Acesso Total Irrestrito</Badge>
                              ) : (
                                role.permissions?.length === 0 ? (
                                  <span className="text-xs text-muted-foreground italic">Nenhum acesso</span>
                                ) : (
                                  role.permissions.map((p: string) => (
                                    <Badge key={p} variant="secondary" className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">
                                      {translatePermission(p)}
                                    </Badge>
                                  ))
                                )
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {role.name !== 'ROLE_ADMIN' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setEditingRole(role)
                                  setEditingPermissions(role.permissions || [])
                                  setIsEditModalOpen(true)
                                }}
                              >
                                Editar Acessos
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* MODAL DE EDITAR PERMISSÕES */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-[500px] w-[95%] bg-background border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Editar Acessos: {editingRole?.name}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Marque os módulos que os usuários com este cargo poderão acessar.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateRole}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                      {availablePermissions.map(perm => (
                        <div key={perm.id} className="flex items-start space-x-2 bg-muted/30 p-2 rounded-md border border-border">
                          <Checkbox 
                            id={`edit-${perm.id}`} 
                            checked={editingPermissions.includes(perm.name)}
                            onCheckedChange={() => togglePermission(perm.name, true)}
                          />
                          <Label htmlFor={`edit-${perm.id}`} className="text-sm font-medium leading-none cursor-pointer">
                            {translatePermission(perm.name)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                    <Button type="submit">Atualizar Permissões</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}