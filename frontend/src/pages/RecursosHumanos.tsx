import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, PlusCircle, Briefcase, UserCheck, UserX, AlertTriangle, MoreHorizontal, Edit, CalendarDays, Stethoscope, Cake, Plane } from "lucide-react"
import { format, parseISO } from "date-fns"
// ptBR removido daqui, pois não estava em uso no momento
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog" // DialogTrigger removido daqui
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function RecursosHumanos() {
  const { user } = useAuth()
  const isRHOrAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ACCESS_HR')

  // --- ESTADOS: DIRETÓRIO ---
  const [employees, setEmployees] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  // systemUsers e fetchSystemUsers removidos temporariamente para o build passar limpo

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)

  // Estado para saber qual ausência estamos editando:
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null)

  const initialFormState = {
    fullName: "", cpf: "", rg: "", birthDate: "", phone: "",
    registrationNumber: "", admissionDate: "", terminationDate: "", jobTitle: "",
    department: "", baseSalary: "", status: "ATIVO", userId: ""
  }
  const [formData, setFormData] = useState(initialFormState)

  // --- ESTADOS: AUSÊNCIAS ---
  const [absences, setAbsences] = useState<any[]>([])
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false)
  const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false)
  
  const initialAbsenceState = {
    employeeId: "", type: "FERIAS", startDate: "", endDate: "", description: ""
  }
  const [absenceData, setAbsenceData] = useState(initialAbsenceState)

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
      const response = await fetch('/hr/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      if (response.ok) { const d = await response.json(); setEmployees(d.content || []) }
    } catch (error) { console.error("Erro ao buscar colaboradores:", error) }
  }

  const fetchAbsences = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/hr/absences', { headers: { 'Authorization': `Bearer ${token}` } })
      if (response.ok) { const d = await response.json(); setAbsences(d.content || []) }
    } catch (error) { console.error("Erro ao buscar ausências:", error) }
  }

  useEffect(() => {
    fetchEmployees()
    fetchAbsences()
  }, [])

  // --- FUNÇÕES DE MÁSCARA E HANDLERS DO DIRETÓRIO ---
  const maskCPF = (value: string) => value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1")
  const maskPhone = (value: string) => value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4,5})(\d{4})/, "$1-$2").replace(/(-\d{4})\d+?$/, "$1")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target
    if (name === "cpf") value = maskCPF(value)
    if (name === "phone") value = maskPhone(value)
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openCreateModal = () => { setFormData(initialFormState); setEditingEmployeeId(null); setIsModalOpen(true); }

  const openEditModal = (emp: any) => {
    setFormData({
      fullName: emp.fullName, cpf: emp.cpf, rg: emp.rg || "", birthDate: emp.birthDate || "",
      phone: emp.phone || "", registrationNumber: emp.registrationNumber, admissionDate: emp.admissionDate,
      terminationDate: emp.terminationDate || "",
      jobTitle: emp.jobTitle, department: emp.department, baseSalary: emp.baseSalary ? emp.baseSalary.toString() : "",
      status: emp.status, userId: emp.userId || ""
    })
    setEditingEmployeeId(emp.id)
    setIsModalOpen(true)
  }

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const payload = { 
        ...formData, 
        userId: formData.userId === "" ? null : formData.userId, 
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary) : null,
        terminationDate: formData.status === 'DESLIGADO' ? formData.terminationDate : null 
      }
      const url = editingEmployeeId ? `/hr/employees/${editingEmployeeId}` : '/hr/employees'
      const method = editingEmployeeId ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (response.ok) { setIsModalOpen(false); fetchEmployees(); setFormData(initialFormState); } 
      else { const errorMsg = await response.text(); alert(`Erro: ${errorMsg}`); }
    } catch (error) { console.error("Erro na operação:", error) } 
    finally { setIsSubmitting(false) }
  }

  // --- HANDLERS DE AUSÊNCIAS ---
  const handleAbsenceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setAbsenceData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingAbsence(true)
    try {
      const token = localStorage.getItem("token")
      
      const url = editingAbsenceId ? `/hr/absences/${editingAbsenceId}` : '/hr/absences'
      const method = editingAbsenceId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(absenceData)
      })

      if (response.ok) {
        setIsAbsenceModalOpen(false)
        fetchAbsences() 
        fetchEmployees() 
        setAbsenceData(initialAbsenceState)
        setEditingAbsenceId(null) 
      } else {
        const errorMsg = await response.text()
        alert(`Erro ao registrar/editar ausência: ${errorMsg}`)
      }
    } catch (error) { console.error("Erro na operação:", error) } 
    finally { setIsSubmittingAbsence(false) }
  }

  const openEditAbsenceModal = (abs: any) => {
    setAbsenceData({
      employeeId: abs.employeeId,
      type: abs.type,
      startDate: abs.startDate, 
      endDate: abs.endDate, 
      description: abs.description || ""
    })
    setEditingAbsenceId(abs.id)
    setIsAbsenceModalOpen(true)
  }

  const handleDeleteAbsence = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta ausência?")) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/hr/absences/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchAbsences()
        fetchEmployees() 
      } else { alert("Erro ao cancelar ausência.") }
    } catch (error) { console.error(error) }
  }

  // --- RENDERS AUXILIARES ---
  const filteredEmployees = employees.filter(emp => emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || emp.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ATIVO': return <Badge className="bg-green-500/15 text-green-700 border-green-500/30"><UserCheck className="w-3 h-3 mr-1"/> Ativo</Badge>
      case 'DESLIGADO': return <Badge className="bg-red-500/15 text-red-700 border-red-500/30"><UserX className="w-3 h-3 mr-1"/> Desligado</Badge>
      case 'FERIAS': return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30"><Plane className="w-3 h-3 mr-1"/> Férias</Badge>
      case 'ATESTADO': return <Badge className="bg-red-500/15 text-red-700 border-red-500/30"><Stethoscope className="w-3 h-3 mr-1"/> Atestado</Badge>
      case 'DAY_OFF': return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30"><Cake className="w-3 h-3 mr-1"/> Day Off</Badge>
      case 'LICENCA': return <Badge className="bg-purple-500/15 text-purple-700 border-purple-500/30"><Briefcase className="w-3 h-3 mr-1"/> Licença</Badge>
      case 'AFASTADO': return <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30">Afastado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getAbsenceTypeBadge = (type: string) => {
    switch(type) {
      case 'FERIAS': return <span className="flex items-center text-yellow-600 dark:text-yellow-400 font-medium"><Plane className="w-4 h-4 mr-2"/> Férias</span>
      case 'ATESTADO': return <span className="flex items-center text-red-600 dark:text-red-400 font-medium"><Stethoscope className="w-4 h-4 mr-2"/> Atestado Médico</span>
      case 'DAY_OFF': return <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium"><Cake className="w-4 h-4 mr-2"/> Day Off</span>
      case 'LICENCA': return <span className="flex items-center text-purple-600 dark:text-purple-400 font-medium"><Briefcase className="w-4 h-4 mr-2"/> Licença</span>
      default: return type
    }
  }

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="flex flex-col min-h-full">
      {/* Fiori page header */}
      <div className="fiori-page-header">
        <h1 className="text-lg font-semibold text-foreground">Recursos Humanos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestão de colaboradores, admissões e controle de ausências.</p>
      </div>

      <div className="p-4 md:p-6 space-y-4">
      <Tabs defaultValue="diretorio" className="w-full">
        <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 max-w-[400px] mb-4 h-auto gap-1 sm:gap-0">
          <TabsTrigger value="diretorio" className="gap-2 w-full">
            <UserCheck className="h-4 w-4" /> Diretório de Pessoas
          </TabsTrigger>
          <TabsTrigger value="ausencias" className="gap-2 w-full">
            <CalendarDays className="h-4 w-4" /> Gestão de Ausências
          </TabsTrigger>
        </TabsList>

        {/* DIRETÓRIO DE PESSOAS */}
        <TabsContent value="diretorio" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Buscar colaborador..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button onClick={openCreateModal} className="gap-2">
              <PlusCircle className="h-4 w-4" /> Registrar Admissão
            </Button>
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
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado.</TableCell></TableRow>
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
                        {emp.admissionDate ? format(parseISO(emp.admissionDate), "dd/MM/yyyy") : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></Button>
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
        </TabsContent>

        {/* GESTÃO DE AUSÊNCIAS */}
        <TabsContent value="ausencias" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-foreground">Histórico e Lançamentos</h2>
            <Button onClick={() => { setAbsenceData(initialAbsenceState); setEditingAbsenceId(null); setIsAbsenceModalOpen(true); }} className="gap-2">
              <CalendarDays className="h-4 w-4" /> Nova Ausência
            </Button>
          </div>

          <div className="rounded-md border border-border bg-card shadow-sm w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Data de Fim</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absences.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ausência registrada no sistema.</TableCell></TableRow>
                ) : (
                  absences.map((abs) => (
                    <TableRow key={abs.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium">{abs.employeeName}</TableCell>
                      <TableCell>{getAbsenceTypeBadge(abs.type)}</TableCell>
                      <TableCell>{format(parseISO(abs.startDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(parseISO(abs.endDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={abs.description}>
                        {abs.description || '-'}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEditAbsenceModal(abs)}>
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-500/10" onClick={() => handleDeleteAbsence(abs.id)}>
                              <UserX className="h-4 w-4 mr-2" /> Cancelar Ausência
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
        </TabsContent>
      </Tabs>

      {/* MODAL DO DIRETÓRIO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingEmployeeId ? "Editar Ficha do Colaborador" : "Nova Admissão"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEmployee} className="space-y-6 py-4">
            {/* DADOS PESSOAIS */}
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

            {/* DADOS CORPORATIVOS */}
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
                    <option value="ATESTADO">Atestado Médico</option>
                    <option value="DAY_OFF">Day Off</option>
                    <option value="LICENCA">Licença</option>
                    <option value="AFASTADO">Afastado (Outros)</option>
                    <option value="DESLIGADO">Desligado</option>
                  </select>
                </div>
                {formData.status === 'DESLIGADO' && (
                  <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                    <Label htmlFor="terminationDate">Data de Desligamento *</Label>
                    <Input 
                      id="terminationDate" 
                      name="terminationDate" 
                      type="date" 
                      value={formData.terminationDate} 
                      onChange={handleInputChange} 
                      required={formData.status === 'DESLIGADO'} 
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Cargo *</Label>
                  <Input id="jobTitle" name="jobTitle" placeholder="Ex: Analista" value={formData.jobTitle} onChange={handleInputChange} required />
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

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REGISTRAR AUSÊNCIA */}
      <Dialog open={isAbsenceModalOpen} onOpenChange={setIsAbsenceModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95%] bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Registrar Nova Ausência</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Programe férias, atestados ou dias de folga para um colaborador.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAbsence} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Colaborador *</Label>
              <select id="employeeId" name="employeeId" className={selectClassName} value={absenceData.employeeId} onChange={handleAbsenceInputChange} required>
                <option value="">Selecione o colaborador...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Ausência *</Label>
              <select id="type" name="type" className={selectClassName} value={absenceData.type} onChange={handleAbsenceInputChange} required>
                <option value="FERIAS">Férias</option>
                <option value="ATESTADO">Atestado Médico</option>
                <option value="DAY_OFF">Day Off (Folga / Aniversário)</option>
                <option value="LICENCA">Licença (Maternidade, etc)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input id="startDate" name="startDate" type="date" value={absenceData.startDate} onChange={handleAbsenceInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Data de Retorno *</Label>
                <Input id="endDate" name="endDate" type="date" value={absenceData.endDate} onChange={handleAbsenceInputChange} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Detalhes / Observações</Label>
              <Input id="description" name="description" placeholder="Ex: Viagem de fim de ano" value={absenceData.description} onChange={handleAbsenceInputChange} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAbsenceModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmittingAbsence}>{isSubmittingAbsence ? "Salvando..." : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}