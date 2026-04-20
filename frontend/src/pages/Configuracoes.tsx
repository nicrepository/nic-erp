import { useState, useEffect, useRef } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, PlusCircle, UserCog, Settings, Key, Mail, Loader2, Tag, MoreHorizontal } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Configuracoes() {
  const { user, updateUser } = useAuth()
  const toast = useToast()
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
  const [isCreatingRole, setIsCreatingRole] = useState(false)

  // Category management
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  // Form fields for category create/edit
  const [catName, setCatName] = useState("")
  const [catDescription, setCatDescription] = useState("")
  const [catPriority, setCatPriority] = useState("")
  const [catDepartment, setCatDepartment] = useState("")
  const [catActive, setCatActive] = useState(true)

  // Dicionário amigável para traduzir o nome das permissões do back-end para o usuário
  const translatePermission = (perm: string) => {
    const dict: Record<string, string> = {
      'ACCESS_INVENTORY_ADMIN': 'Estoque (RH/Admin)',
      'ACCESS_INVENTORY_IT': 'Ativos de TI',
      'ACCESS_HELPDESK': 'Helpdesk',
      'ACCESS_USERS': 'Gestão de Usuários',
      'ACCESS_DASHBOARD': 'Visualizar Dashboard',
      'ACCESS_ANNOUNCEMENTS_MANAGE': 'Gerenciar Comunicados',
      'ACCESS_HR': 'Recursos Humanos'
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
    if (isAdmin) {
      fetchData()
      fetchCategories()
    }
  }, [isAdmin])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch('/helpdesk/categories/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setCategories(await res.json())
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingCategory(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch('/helpdesk/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: catName, description: catDescription, priority: catPriority, department: catDepartment, active: catActive })
      })
      if (res.ok) {
        setIsCreateCategoryOpen(false)
        resetCatForm()
        fetchCategories()
        toast.success("Categoria criada!", "A nova categoria já está disponível no Helpdesk.")
      } else {
        toast.error("Erro ao criar categoria", "Verifique se já existe uma categoria com esse nome.")
      }
    } catch (error) {
      toast.error("Erro de conexão", "Tente novamente.")
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    setIsSavingCategory(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/helpdesk/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: catName, description: catDescription, priority: catPriority, department: catDepartment, active: catActive })
      })
      if (res.ok) {
        setIsEditCategoryOpen(false)
        setEditingCategory(null)
        resetCatForm()
        fetchCategories()
        toast.success("Categoria atualizada!", "As alterações foram salvas.")
      } else {
        toast.error("Erro ao atualizar categoria", "Tente novamente.")
      }
    } catch (error) {
      toast.error("Erro de conexão", "Tente novamente.")
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/helpdesk/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchCategories()
        toast.success("Categoria removida!", "A categoria foi excluída do sistema.")
      } else {
        toast.error("Erro ao remover categoria", "Tente novamente.")
      }
    } catch (error) {
      toast.error("Erro de conexão", "Tente novamente.")
    }
  }

  const resetCatForm = () => {
    setCatName("")
    setCatDescription("")
    setCatPriority("")
    setCatDepartment("")
    setCatActive(true)
  }

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatDescription(cat.description || "")
    setCatPriority(cat.priority)
    setCatDepartment(cat.department)
    setCatActive(cat.active)
    setIsEditCategoryOpen(true)
  }

  const translatePriorityCat = (p: string) => {
    const map: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' }
    return map[p] || p
  }
  const translateDeptCat = (d: string) => {
    const map: Record<string, string> = { IT: 'TI', ADMIN: 'Administrativo', HR: 'RH', MAINTENANCE: 'Manutenção' }
    return map[d] || d
  }
  const priorityColor = (p: string) => {
    const map: Record<string, string> = {
      URGENT: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-500 border-yellow-500/30',
      LOW: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    }
    return map[p] || ''
  }

  // Função para criar um novo Cargo
  const handleCreateRole = async (e: React.FormEvent) => {e.preventDefault()
    setIsCreatingRole(true)
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
        toast.success("Cargo criado!", "O novo cargo foi adicionado ao sistema.")
      } else {
        toast.error("Erro ao criar cargo", "Este cargo já pode existir.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    } finally {
      setIsCreatingRole(false)
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
        toast.success("Permissões atualizadas!", "As permissões do cargo foram salvas.")
      } else {
        toast.error("Erro ao atualizar permissões", "Tente novamente.")
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
        toast.success("Foto atualizada!", "Sua foto de perfil foi atualizada.")
        
      } else {
        toast.error("Erro no upload", "Não foi possível enviar a foto. Tente novamente.")
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
      toast.warning("Senhas não conferem", "A nova senha e a confirmação devem ser iguais.")
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
        toast.success("Senha alterada!", "Sua senha foi atualizada com sucesso.")
        // Limpa os campos após o sucesso
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const errorMsg = await response.text()
        toast.error("Erro ao alterar senha", errorMsg)
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      toast.error("Erro de conexão", "Verifique sua rede e tente novamente.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Fiori page header */}
      <div className="fiori-page-header">
        <h1 className="text-lg font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas preferências e os acessos globais do sistema.</p>
      </div>

      <div className="p-4 md:p-6">
      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-3 max-w-[600px] mb-4 h-auto gap-1 sm:gap-0">
          <TabsTrigger value="perfil" className="gap-2 w-full">
            <UserCog className="h-4 w-4" /> Meu Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="sistema" className="gap-2 w-full">
              <Settings className="h-4 w-4" /> Sistema & Acessos
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="helpdesk" className="gap-2 w-full">
              <Tag className="h-4 w-4" /> Helpdesk
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
                <Button type="submit" disabled={isChangingPassword} className="gap-2">
                  {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isChangingPassword ? "Alterando..." : "Alterar Senha"}
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
                      <Button type="submit" disabled={isCreatingRole} className="gap-2">
                        {isCreatingRole && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isCreatingRole ? "Criando..." : "Salvar Cargo"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm w-full">
              <div className="overflow-x-auto">
                <Table className="w-full" aria-label="Cargos e permissões">
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

        {isAdmin && (
          <TabsContent value="helpdesk" className="mt-4">
            <div className="rounded-md border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Categorias do Helpdesk</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Gerencie as categorias disponíveis ao abrir chamados. A prioridade é definida automaticamente.</p>
                </div>
                <Dialog open={isCreateCategoryOpen} onOpenChange={(open) => { setIsCreateCategoryOpen(open); if (!open) resetCatForm() }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <PlusCircle className="h-4 w-4" /> Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px] bg-background border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>Nova Categoria</DialogTitle>
                      <DialogDescription className="text-muted-foreground">Defina o nome, área responsável e prioridade automática.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCategory}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cat-name">Nome</Label>
                          <Input id="cat-name" placeholder="Ex: Sistema fora do ar" value={catName} onChange={e => setCatName(e.target.value)} required className="bg-background" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cat-desc">Descrição (opcional)</Label>
                          <Textarea id="cat-desc" placeholder="Descreva quando usar esta categoria..." value={catDescription} onChange={e => setCatDescription(e.target.value)} className="bg-background min-h-[80px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Área Responsável</Label>
                            <Select value={catDepartment} onValueChange={setCatDepartment} required>
                              <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IT">TI</SelectItem>
                                <SelectItem value="ADMIN">Administrativo</SelectItem>
                                <SelectItem value="HR">RH</SelectItem>
                                <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Prioridade</Label>
                            <Select value={catPriority} onValueChange={setCatPriority} required>
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
                        <div className="flex items-center gap-2">
                          <Checkbox id="cat-active" checked={catActive} onCheckedChange={(v) => setCatActive(v === true)} />
                          <Label htmlFor="cat-active">Categoria ativa</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!catName || !catDepartment || !catPriority || isSavingCategory}>
                          {isSavingCategory ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Edit category dialog */}
              <Dialog open={isEditCategoryOpen} onOpenChange={(open) => { setIsEditCategoryOpen(open); if (!open) { setEditingCategory(null); resetCatForm() } }}>
                <DialogContent className="sm:max-w-[480px] bg-background border-border text-foreground">
                  <DialogHeader>
                    <DialogTitle>Editar Categoria</DialogTitle>
                    <DialogDescription className="text-muted-foreground">Atualize os dados da categoria.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateCategory}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-cat-name">Nome</Label>
                        <Input id="edit-cat-name" value={catName} onChange={e => setCatName(e.target.value)} required className="bg-background" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-cat-desc">Descrição (opcional)</Label>
                        <Textarea id="edit-cat-desc" value={catDescription} onChange={e => setCatDescription(e.target.value)} className="bg-background min-h-[80px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Área Responsável</Label>
                          <Select value={catDepartment} onValueChange={setCatDepartment} required>
                            <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IT">TI</SelectItem>
                              <SelectItem value="ADMIN">Administrativo</SelectItem>
                              <SelectItem value="HR">RH</SelectItem>
                              <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Prioridade</Label>
                          <Select value={catPriority} onValueChange={setCatPriority} required>
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
                      <div className="flex items-center gap-2">
                        <Checkbox id="edit-cat-active" checked={catActive} onCheckedChange={(v) => setCatActive(v === true)} />
                        <Label htmlFor="edit-cat-active">Categoria ativa</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditCategoryOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={!catName || !catDepartment || !catPriority || isSavingCategory}>
                        {isSavingCategory ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Table aria-label="Categorias do Helpdesk">
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="hidden sm:table-cell">Área</TableHead>
                    <TableHead className="hidden sm:table-cell">Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCategories ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma categoria cadastrada.</TableCell></TableRow>
                  ) : (
                    categories.map(cat => (
                      <TableRow key={cat.id} className={!cat.active ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="font-medium text-foreground text-sm">{cat.name}</div>
                          {cat.description && <div className="text-xs text-muted-foreground mt-0.5 hidden md:block">{cat.description}</div>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs">{translateDeptCat(cat.department)}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={`text-xs ${priorityColor(cat.priority)}`}>{translatePriorityCat(cat.priority)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cat.active ? "default" : "secondary"} className="text-xs">
                            {cat.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Mais opções">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditCategory(cat)}>Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(cat.id)}>Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}
      </Tabs>
      </div>
    </div>
  )
}