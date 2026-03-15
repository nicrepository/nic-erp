import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, PlusCircle, Briefcase, UserCheck, UserX, AlertTriangle, MoreHorizontal, Edit } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RecursosHumanos() {
  const { user } = useAuth()
  const isRHOrAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ACCESS_HR')

  // --- ESTADOS ---
  const [employees, setEmployees] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [systemUsers, setSystemUsers] = useState<any[]>([])

  // Modal e Formulário
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null) // <-- NOVO: Controla se é Edição

  const initialFormState = {
    fullName: "", cpf: "", rg: "", birthDate: "", phone: "",
    registrationNumber: "", admissionDate: "", jobTitle: "",
    department: "", baseSalary: "", status: "ATIVO", userId: ""
  }
  const [formData, setFormData] = useState(initialFormState)

  // --- BARREIRA DE ACESSO NEGADO ---
  if (!isRHOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4 animate-in fade-in duration-500">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão para acessar o módulo de Recursos Humanos. 
          Solicite o acesso ao administrador do sistema caso necessário.
        </p>
      </div>
    )
  }

  // --- BUSCAS DE DADOS ---
  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/hr/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setEmployees(await response.json())
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error)
    }
  }

  const fetchSystemUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setSystemUsers(await response.json())
    } catch (error) {
      console.error("Erro ao buscar usuários do sistema:", error)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchSystemUsers()
  }, [])

  // --- FUNÇÕES DE MÁSCARA ---
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1")
  }

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1")
  }

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target
    if (name === "cpf") value = maskCPF(value)
    if (name === "phone") value = maskPhone(value)
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Abre o modal para CRIAR
  const openCreateModal = () => {
    setFormData(initialFormState)
    setEditingEmployeeId(null)
    setIsModalOpen(true)
  }

  // Abre o modal para EDITAR
  const openEditModal = (emp: any) => {
    setFormData({
      fullName: emp.fullName,
      cpf: emp.cpf,
      rg: emp.rg || "",
      birthDate: emp.birthDate || "",
      phone: emp.phone || "",
      registrationNumber: emp.registrationNumber,
      admissionDate: emp.admissionDate,
      jobTitle: emp.jobTitle,
      department: emp.department,
      baseSalary: emp.baseSalary ? emp.baseSalary.toString() : "",
      status: emp.status,
      userId: emp.userId || ""
    })
    setEditingEmployeeId(emp.id)
    setIsModalOpen(true)
  }

  // Função única que decide se vai fazer POST ou PUT
  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const payload = {
        ...formData,
        userId: formData.userId === "" ? null : formData.userId,
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null
      }

      // Se tiver ID editando, faz PUT na rota com ID. Senão, faz POST na raiz.
      const url = editingEmployeeId ? `/hr/employees/${editingEmployeeId}` : '/hr/employees'
      const method = editingEmployeeId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchEmployees()
        setFormData(initialFormState)
      } else {
        const errorMsg = await response.text()
        alert(`Erro: ${errorMsg}`)
      }
    } catch (error) {
      console.error("Erro na operação:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- RENDERS AUXILIARES ---
  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ATIVO': return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/30"><UserCheck className="w-3 h-3 mr-1"/> Ativo</Badge>
      case 'DESLIGADO': return <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/30"><UserX className="w-3 h-3 mr-1"/> Desligado</Badge>
      case 'FERIAS': return <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-500/30"><Briefcase className="w-3 h-3 mr-1"/> Férias</Badge>
      case 'AFASTADO': return <Badge className="bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 border-orange-500/30">Afastado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Diretório de Pessoas</h1>
          <p className="text-sm text-muted-foreground">Gestão de colaboradores, cargos e admissões.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar colaborador..."
              className="pl-8 w-full md:w-[280px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" /> Registrar Admissão
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="min-w-[200px]">Colaborador</TableHead>
              <TableHead className="min-w-[150px]">Cargo / Depto</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium whitespace-nowrap">
                    {emp.fullName}
                    {emp.userEmail && <span className="block text-xs text-muted-foreground font-normal">{emp.userEmail}</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {emp.jobTitle}
                    <span className="block text-xs text-muted-foreground">{emp.department}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.registrationNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {emp.admissionDate ? format(parseISO(emp.admissionDate), "dd 'de' MMMM, yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(emp.status)}</TableCell>
                  
                  {/* --- MENU DE AÇÕES (EDITAR) --- */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEditModal(emp)}>
                          <Edit className="h-4 w-4 mr-2" /> Editar Ficha
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

      {/* MODAL INTELIGENTE (CRIAR / EDITAR) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>
              {editingEmployeeId ? "Editar Ficha do Colaborador" : "Nova Admissão de Colaborador"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingEmployeeId 
                ? "Atualize os dados corporativos e pessoais abaixo." 
                : "Preencha a ficha cadastral do novo funcionário."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEmployee} className="space-y-6 py-4">
            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input id="cpf" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleInputChange} required maxLength={14} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input id="rg" name="rg" value={formData.rg} onChange={handleInputChange} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" name="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleInputChange} maxLength={15} />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DADOS CORPORATIVOS */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Dados Corporativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Matrícula *</Label>
                  <Input id="registrationNumber" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Data de Admissão *</Label>
                  <Input id="admissionDate" name="admissionDate" type="date" value={formData.admissionDate} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" className={selectClassName} value={formData.status} onChange={handleInputChange}>
                    <option value="ATIVO">Ativo</option>
                    <option value="FERIAS">Em Férias</option>
                    <option value="AFASTADO">Afastado</option>
                    <option value="DESLIGADO">Desligado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Cargo *</Label>
                  <Input id="jobTitle" name="jobTitle" placeholder="Ex: Analista Financeiro" value={formData.jobTitle} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Input id="department" name="department" placeholder="Ex: Financeiro" value={formData.department} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Salário Base (R$)</Label>
                  <Input id="baseSalary" name="baseSalary" type="number" step="0.01" min="0" placeholder="0.00" value={formData.baseSalary} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: ACESSO AO SISTEMA */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Vínculo de Acesso (Opcional)</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">Vincular a uma conta de usuário existente</Label>
                  <select id="userId" name="userId" className={selectClassName} value={formData.userId} onChange={handleInputChange}>
                    <option value="">-- Sem acesso ao sistema ERP --</option>
                    {systemUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Vincule apenas se este colaborador for acessar o sistema. O acesso deve ser criado previamente na tela de Gestão de Acessos.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : (editingEmployeeId ? "Salvar Alterações" : "Registrar Admissão")}
              </Button>
            </DialogFooter>
          </form>

        </DialogContent>
      </Dialog>
    </div>
  )
}