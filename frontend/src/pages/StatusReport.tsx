import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  ClipboardList,
  Edit2,
  InboxIcon,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { getAuthorities } from "../lib/auth"

type CompanyType = "SAP_PARTNER" | "FINAL_CUSTOMER" | "DIRECT_CUSTOMER" | "OTHER"
type StrategicLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "PENDING"
type DifficultyLevel = "HIGH" | "MEDIUM" | "LOW" | "NOT_INFORMED" | "NOT_APPLICABLE"
type StatusSituation =
  | "IN_PROGRESS"
  | "IN_PROGRESS_ATTENTION"
  | "BLOCKED"
  | "WAITING_CUSTOMER"
  | "WAITING_PARTNER"
  | "IN_VALIDATION"
  | "DONE"
  | "PAUSED"
  | "NOT_INFORMED"
  | "NOT_APPLICABLE"

type SelectAll = "ALL"

interface StatusReportCompany {
  id: string
  name: string
  type: CompanyType
  active: boolean
  notes?: string | null
  createdBy?: string | null
  createdAt?: string | null
  updatedBy?: string | null
  updatedAt?: string | null
}

interface StatusReportItem {
  id: string
  strategicLevel: StrategicLevel
  sapPartnerId: string
  sapPartnerName: string
  finalCustomerId: string
  finalCustomerName: string
  reportDate: string
  involvedPeople: string
  activity: string
  dailyStatus: string
  difficultyLevel: DifficultyLevel
  situation: StatusSituation
  active: boolean
  createdBy?: string | null
  createdAt?: string | null
  updatedBy?: string | null
  updatedAt?: string | null
}

interface StatusReportFormState {
  sapPartnerId: string
  finalCustomerId: string
  reportDate: string
  involvedPeople: string
  activity: string
  dailyStatus: string
  difficultyLevel: DifficultyLevel | ""
  situation: StatusSituation | ""
}

interface CompanyFormState {
  name: string
  type: CompanyType
  notes: string
}

interface ReportFilters {
  reportDate: string
  sapPartnerId: string | SelectAll
  finalCustomerId: string | SelectAll
  strategicLevel: StrategicLevel | SelectAll
  difficultyLevel: DifficultyLevel | SelectAll
  situation: StatusSituation | SelectAll
}

const API_BASE = "/api"

const todayIso = () => new Date().toISOString().slice(0, 10)

const companyTypeLabels: Record<CompanyType, string> = {
  SAP_PARTNER: "Parceiro SAP",
  FINAL_CUSTOMER: "Cliente Final",
  DIRECT_CUSTOMER: "Cliente Direto",
  OTHER: "Outro",
}

const strategicLevelLabels: Record<StrategicLevel, string> = {
  CRITICAL: "Crítico",
  HIGH: "Alto",
  MEDIUM: "Médio",
  LOW: "Baixo",
  PENDING: "Pendente",
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
  NOT_INFORMED: "Não informado",
  NOT_APPLICABLE: "Não se aplica",
}

const situationLabels: Record<StatusSituation, string> = {
  IN_PROGRESS: "Em andamento",
  IN_PROGRESS_ATTENTION: "Com atenção",
  BLOCKED: "Bloqueado",
  WAITING_CUSTOMER: "Aguardando cliente",
  WAITING_PARTNER: "Aguardando parceiro",
  IN_VALIDATION: "Em validação",
  DONE: "Concluído",
  PAUSED: "Pausado",
  NOT_INFORMED: "Não informado",
  NOT_APPLICABLE: "Não se aplica",
}

const initialReportForm: StatusReportFormState = {
  sapPartnerId: "",
  finalCustomerId: "",
  reportDate: todayIso(),
  involvedPeople: "",
  activity: "",
  dailyStatus: "",
  difficultyLevel: "",
  situation: "",
}

const initialCompanyForm: CompanyFormState = {
  name: "",
  type: "SAP_PARTNER",
  notes: "",
}

const initialFilters: ReportFilters = {
  reportDate: "",
  sapPartnerId: "ALL",
  finalCustomerId: "ALL",
  strategicLevel: "ALL",
  difficultyLevel: "ALL",
  situation: "ALL",
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Erro inesperado ao processar a solicitação."
}

function normalizeArrayResponse<T>(data: T[] | { content?: T[] }) {
  return Array.isArray(data) ? data : data.content ?? []
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token")
  const headers = new Headers(options.headers)

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erro ao processar a requisição.")
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}


function formatDate(date: string) {
  if (!date) return "-"
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date
  return `${day}/${month}/${year}`
}

function strategicBadgeVariant(level: StrategicLevel) {
  if (level === "CRITICAL") return "destructive" as const
  if (level === "PENDING") return "outline" as const
  return "secondary" as const
}

function situationBadgeVariant(situation: StatusSituation) {
  if (situation === "BLOCKED") return "destructive" as const
  if (situation === "DONE") return "secondary" as const
  return "outline" as const
}

function hasAnyAuthority(authorities: string[], allowed: string[]) {
  return allowed.some((authority) => authorities.includes(authority))
}

function isLocalhost() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
}

export function StatusReport() {
  const { user } = useAuth()
  const toast = useToast()
  const authorities = getAuthorities(user)

  const isAdmin = hasAnyAuthority(authorities, ["ROLE_ADMIN", "ADMIN", "ACCESS_USERS"])
  const isGestaoProjetos = hasAnyAuthority(authorities, [
    "GESTAO DE PROJETOS",
    "GESTAO_DE_PROJETOS",
    "ROLE_GESTAO_DE_PROJETOS",
    "ACCESS_GESTAO_DE_PROJETOS",
    "ROLE_TI",
  ])

  const canManage = isLocalhost() || isAdmin || isGestaoProjetos

  const [reports, setReports] = useState<StatusReportItem[]>([])
  const [companies, setCompanies] = useState<StatusReportCompany[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [isSavingReport, setIsSavingReport] = useState(false)
  const [isSavingCompany, setIsSavingCompany] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false)
  const [isStrategicDialogOpen, setIsStrategicDialogOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<StatusReportItem | null>(null)
  const [editingCompany, setEditingCompany] = useState<StatusReportCompany | null>(null)
  const [selectedStrategicReport, setSelectedStrategicReport] = useState<StatusReportItem | null>(null)
  const [selectedStrategicLevel, setSelectedStrategicLevel] = useState<StrategicLevel>("PENDING")
  const [reportForm, setReportForm] = useState<StatusReportFormState>(initialReportForm)
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(initialCompanyForm)
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const [companyTypeFilter, setCompanyTypeFilter] = useState<CompanyType | SelectAll>("ALL")
  const [companySearch, setCompanySearch] = useState("")

  const sapPartnerOptions = useMemo(
    () => companies.filter((company) => company.active && ["SAP_PARTNER", "DIRECT_CUSTOMER"].includes(company.type)),
    [companies],
  )

  const finalCustomerOptions = useMemo(
    () => companies.filter((company) => company.active && ["FINAL_CUSTOMER", "DIRECT_CUSTOMER"].includes(company.type)),
    [companies],
  )

  const reportCounters = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((report) => report.strategicLevel === "PENDING").length,
      high: reports.filter((report) => report.difficultyLevel === "HIGH").length,
      blocked: reports.filter((report) => report.situation === "BLOCKED").length,
      done: reports.filter((report) => report.situation === "DONE").length,
    }
  }, [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesDate = !filters.reportDate || report.reportDate === filters.reportDate
      const matchesPartner = filters.sapPartnerId === "ALL" || report.sapPartnerId === filters.sapPartnerId
      const matchesCustomer = filters.finalCustomerId === "ALL" || report.finalCustomerId === filters.finalCustomerId
      const matchesStrategic = filters.strategicLevel === "ALL" || report.strategicLevel === filters.strategicLevel
      const matchesDifficulty = filters.difficultyLevel === "ALL" || report.difficultyLevel === filters.difficultyLevel
      const matchesSituation = filters.situation === "ALL" || report.situation === filters.situation

      return (
        matchesDate &&
        matchesPartner &&
        matchesCustomer &&
        matchesStrategic &&
        matchesDifficulty &&
        matchesSituation
      )
    })
  }, [reports, filters])

  const filteredCompanies = useMemo(() => {
    const search = companySearch.trim().toLowerCase()

    return companies.filter((company) => {
      const matchesType = companyTypeFilter === "ALL" || company.type === companyTypeFilter
      const matchesSearch = !search || company.name.toLowerCase().includes(search)

      return matchesType && matchesSearch
    })
  }, [companies, companyTypeFilter, companySearch])

  async function fetchCompanies() {
    setIsLoadingCompanies(true)

    try {
      const data = await requestJson<StatusReportCompany[] | { content?: StatusReportCompany[] }>(
        "/status-report-companies",
      )

      setCompanies(normalizeArrayResponse(data))
    } catch (error) {
      console.error("Erro ao buscar empresas:", error)
      toast.error("Erro ao buscar empresas", getErrorMessage(error))
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  async function fetchReports() {
    setIsLoadingReports(true)

    try {
      const data = await requestJson<StatusReportItem[] | { content?: StatusReportItem[] }>(
        "/status-reports",
      )

      setReports(normalizeArrayResponse(data))
    } catch (error) {
      console.error("Erro ao buscar status reports:", error)
      toast.error("Erro ao buscar Status Report", getErrorMessage(error))
    } finally {
      setIsLoadingReports(false)
    }
  }

  useEffect(() => {
    void fetchCompanies()
    void fetchReports()
    // Carga inicial intencional. Atualizações posteriores via botões e ações da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreateReport() {
    setEditingReport(null)
    setReportForm({ ...initialReportForm, reportDate: todayIso() })
    setIsReportDialogOpen(true)
  }

  function openEditReport(report: StatusReportItem) {
    setEditingReport(report)
    setReportForm({
      sapPartnerId: report.sapPartnerId,
      finalCustomerId: report.finalCustomerId,
      reportDate: report.reportDate,
      involvedPeople: report.involvedPeople,
      activity: report.activity,
      dailyStatus: report.dailyStatus,
      difficultyLevel: report.difficultyLevel,
      situation: report.situation,
    })
    setIsReportDialogOpen(true)
  }

  function openCreateCompany() {
    setEditingCompany(null)
    setCompanyForm(initialCompanyForm)
    setIsCompanyDialogOpen(true)
  }

  function openEditCompany(company: StatusReportCompany) {
    setEditingCompany(company)
    setCompanyForm({
      name: company.name,
      type: company.type,
      notes: company.notes ?? "",
    })
    setIsCompanyDialogOpen(true)
  }

  function openStrategicDialog(report: StatusReportItem) {
    setSelectedStrategicReport(report)
    setSelectedStrategicLevel(report.strategicLevel)
    setIsStrategicDialogOpen(true)
  }

  async function handleSaveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!companyForm.name.trim()) {
      toast.warning("Nome obrigatório", "Informe o nome da empresa.")
      return
    }

    setIsSavingCompany(true)

    try {
      const payload = {
        name: companyForm.name.trim(),
        type: companyForm.type,
        notes: companyForm.notes.trim() || null,
      }

      if (editingCompany) {
        const updatedCompany = await requestJson<StatusReportCompany>(`/status-report-companies/${editingCompany.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })

        setCompanies((prev) => prev.map((company) => (company.id === updatedCompany.id ? updatedCompany : company)))
        toast.success("Empresa atualizada", "Cadastro atualizado com sucesso.")
      } else {
        const createdCompany = await requestJson<StatusReportCompany>("/status-report-companies", {
          method: "POST",
          body: JSON.stringify(payload),
        })

        setCompanies((prev) => [createdCompany, ...prev.filter((company) => company.id !== createdCompany.id)])
        setCompanySearch("")
        setCompanyTypeFilter("ALL")
        toast.success("Empresa cadastrada", "Cadastro criado com sucesso.")
      }

      setIsCompanyDialogOpen(false)
      setEditingCompany(null)
      setCompanyForm(initialCompanyForm)
    } catch (error) {
      console.error("Erro ao salvar empresa:", error)
      toast.error("Erro ao salvar empresa", getErrorMessage(error))
    } finally {
      setIsSavingCompany(false)
    }
  }

  async function handleSaveReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const isMissingRequiredField =
      !reportForm.sapPartnerId ||
      !reportForm.finalCustomerId ||
      !reportForm.reportDate ||
      !reportForm.involvedPeople.trim() ||
      !reportForm.activity.trim() ||
      !reportForm.dailyStatus.trim() ||
      !reportForm.difficultyLevel ||
      !reportForm.situation

    if (isMissingRequiredField) {
      toast.warning("Campos obrigatórios", "Preencha todos os campos para criar o Status Report.")
      return
    }

    setIsSavingReport(true)

    try {
      const payload = {
        sapPartnerId: reportForm.sapPartnerId,
        finalCustomerId: reportForm.finalCustomerId,
        reportDate: reportForm.reportDate,
        involvedPeople: reportForm.involvedPeople.trim(),
        activity: reportForm.activity.trim(),
        dailyStatus: reportForm.dailyStatus.trim(),
        difficultyLevel: reportForm.difficultyLevel,
        situation: reportForm.situation,
      }

      if (editingReport) {
        const updatedReport = await requestJson<StatusReportItem>(`/status-reports/${editingReport.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })

        setReports((prev) => prev.map((report) => (report.id === updatedReport.id ? updatedReport : report)))
        toast.success("Status atualizado", "Registro atualizado com sucesso.")
      } else {
        const createdReport = await requestJson<StatusReportItem>("/status-reports", {
          method: "POST",
          body: JSON.stringify(payload),
        })

        setReports((prev) => [createdReport, ...prev])
        setFilters(initialFilters)
        toast.success("Status cadastrado", "Registro criado com sucesso.")
      }

      setIsReportDialogOpen(false)
      setEditingReport(null)
      setReportForm({ ...initialReportForm, reportDate: todayIso() })
    } catch (error) {
      console.error("Erro ao salvar status report:", error)
      toast.error("Erro ao salvar Status Report", getErrorMessage(error))
    } finally {
      setIsSavingReport(false)
    }
  }

  async function handleUpdateStrategicLevel() {
    if (!selectedStrategicReport) return

    setIsSavingReport(true)

    try {
      const updatedReport = await requestJson<StatusReportItem>(
        `/status-reports/${selectedStrategicReport.id}/strategic-level`,
        {
          method: "PATCH",
          body: JSON.stringify({ strategicLevel: selectedStrategicLevel }),
        },
      )

      setReports((prev) => prev.map((report) => (report.id === updatedReport.id ? updatedReport : report)))
      setIsStrategicDialogOpen(false)
      setSelectedStrategicReport(null)
      toast.success("Grau estratégico atualizado", "Classificação atualizada com sucesso.")
    } catch (error) {
      console.error("Erro ao atualizar grau estratégico:", error)
      toast.error("Erro ao atualizar Grau Estratégico", getErrorMessage(error))
    } finally {
      setIsSavingReport(false)
    }
  }

  async function handleDeleteReport(report: StatusReportItem) {
    const confirmed = window.confirm(`Deseja excluir o status "${report.activity}"?`)
    if (!confirmed) return

    try {
      await requestJson<void>(`/status-reports/${report.id}`, { method: "DELETE" })
      setReports((prev) => prev.filter((item) => item.id !== report.id))
      toast.success("Status excluído", "Registro removido da listagem.")
    } catch (error) {
      console.error("Erro ao excluir status report:", error)
      toast.error("Erro ao excluir Status Report", getErrorMessage(error))
    }
  }

  async function handleDeleteCompany(company: StatusReportCompany) {
    const confirmed = window.confirm(`Deseja excluir a empresa "${company.name}"?`)
    if (!confirmed) return

    try {
      await requestJson<void>(`/status-report-companies/${company.id}`, { method: "DELETE" })
      setCompanies((prev) => prev.filter((item) => item.id !== company.id))
      toast.success("Empresa excluída", "Cadastro removido da listagem.")
    } catch (error) {
      console.error("Erro ao excluir empresa:", error)
      toast.error("Erro ao excluir empresa", getErrorMessage(error))
    }
  }

  function clearFilters() {
    setFilters(initialFilters)
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="fiori-page-header">
        <h1 className="text-lg font-semibold text-foreground">Status Report</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Central de acompanhamento dos status diários das demandas.
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className={`flex flex-col sm:grid w-full ${canManage ? "sm:grid-cols-2" : "sm:grid-cols-1"} max-w-[400px] mb-4 h-auto gap-1 sm:gap-0`}>
            <TabsTrigger value="reports">Status Reports</TabsTrigger>
            {canManage && <TabsTrigger value="companies">Empresas</TabsTrigger>}
          </TabsList>

          <TabsContent value="reports" className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="mt-1 text-2xl font-semibold">{reportCounters.total}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="mt-1 text-2xl font-semibold">{reportCounters.pending}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Alta dificuldade</p>
                <p className="mt-1 text-2xl font-semibold">{reportCounters.high}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Bloqueados</p>
                <p className="mt-1 text-2xl font-semibold">{reportCounters.blocked}</p>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="mt-1 text-2xl font-semibold">{reportCounters.done}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={filters.reportDate}
                    onChange={(event) => setFilters((prev) => ({ ...prev, reportDate: event.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Parceiro SAP</Label>
                  <Select
                    value={filters.sapPartnerId}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sapPartnerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {sapPartnerOptions.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Cliente Final</Label>
                  <Select
                    value={filters.finalCustomerId}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, finalCustomerId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {finalCustomerOptions.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Grau Estratégico</Label>
                  <Select
                    value={filters.strategicLevel}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, strategicLevel: value as StrategicLevel | SelectAll }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {Object.entries(strategicLevelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Dificuldade</Label>
                  <Select
                    value={filters.difficultyLevel}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, difficultyLevel: value as DifficultyLevel | SelectAll }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {Object.entries(difficultyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Situação</Label>
                  <Select
                    value={filters.situation}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, situation: value as StatusSituation | SelectAll }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      {Object.entries(situationLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
                <Button variant="outline" onClick={() => void fetchReports()} disabled={isLoadingReports}>
                  {isLoadingReports && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Atualizar
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Registros de Status</h2>
                  <p className="text-sm text-muted-foreground">Status lançados pelos desenvolvedores e consultores.</p>
                </div>
                <Button onClick={openCreateReport}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Status
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grau Estratégico</TableHead>
                      <TableHead>Parceiro SAP</TableHead>
                      <TableHead>Cliente Final</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Envolvidos</TableHead>
                      <TableHead>Atividade</TableHead>
                      <TableHead>Status Diário</TableHead>
                      <TableHead>Dificuldade</TableHead>
                      <TableHead>Situação</TableHead>
                      {canManage && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingReports ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 10 : 9} className="h-28 text-center text-muted-foreground">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                          Carregando registros...
                        </TableCell>
                      </TableRow>
                    ) : filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canManage ? 10 : 9} className="h-32 text-center text-muted-foreground">
                          <InboxIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                          Nenhum Status Report encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant={strategicBadgeVariant(report.strategicLevel)}>
                              {strategicLevelLabels[report.strategicLevel]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{report.sapPartnerName}</TableCell>
                          <TableCell>{report.finalCustomerName}</TableCell>
                          <TableCell>{formatDate(report.reportDate)}</TableCell>
                          <TableCell className="max-w-[180px] whitespace-normal">{report.involvedPeople}</TableCell>
                          <TableCell className="max-w-[220px] whitespace-normal font-medium">{report.activity}</TableCell>
                          <TableCell className="max-w-[320px] whitespace-normal text-muted-foreground">{report.dailyStatus}</TableCell>
                          <TableCell>{difficultyLabels[report.difficultyLevel]}</TableCell>
                          <TableCell>
                            <Badge variant={situationBadgeVariant(report.situation)}>
                              {situationLabels[report.situation]}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openStrategicDialog(report)} aria-label="Alterar grau estratégico">
                                  <ClipboardList className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditReport(report)} aria-label="Editar status">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => void handleDeleteReport(report)} aria-label="Excluir status">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {canManage && (
            <TabsContent value="companies" className="mt-4 space-y-4">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="grid flex-1 gap-3 md:grid-cols-[240px_1fr]">
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <Select value={companyTypeFilter} onValueChange={(value) => setCompanyTypeFilter(value as CompanyType | SelectAll)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos</SelectItem>
                          {Object.entries(companyTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Buscar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={companySearch}
                          onChange={(event) => setCompanySearch(event.target.value)}
                          className="pl-9"
                          placeholder="Buscar empresa"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => void fetchCompanies()} disabled={isLoadingCompanies}>
                      {isLoadingCompanies && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Buscar
                    </Button>
                    <Button onClick={openCreateCompany}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Nova Empresa
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card shadow-sm">
                <div className="border-b px-4 py-4">
                  <h2 className="text-base font-semibold">Empresas</h2>
                  <p className="text-sm text-muted-foreground">Cadastro de parceiros SAP, clientes finais e clientes diretos.</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingCompanies ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                            Carregando empresas...
                          </TableCell>
                        </TableRow>
                      ) : filteredCompanies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            <InboxIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                            Nenhuma empresa cadastrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{companyTypeLabels[company.type]}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[420px] whitespace-normal text-muted-foreground">{company.notes || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditCompany(company)} aria-label="Editar empresa">
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => void handleDeleteCompany(company)} aria-label="Excluir empresa">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReport ? "Editar Status Report" : "Novo Status Report"}</DialogTitle>
            <DialogDescription>
              Informe todos os campos do status. O Grau Estratégico será classificado pela gestão.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveReport} className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Grau Estratégico: <span className="font-medium text-foreground">Pendente de classificação pela gestão</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Parceiro SAP *</Label>
                <Select value={reportForm.sapPartnerId} onValueChange={(value) => setReportForm((prev) => ({ ...prev, sapPartnerId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {sapPartnerOptions.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Cliente Final *</Label>
                <Select value={reportForm.finalCustomerId} onValueChange={(value) => setReportForm((prev) => ({ ...prev, finalCustomerId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {finalCustomerOptions.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={reportForm.reportDate}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, reportDate: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Envolvidos *</Label>
                <Input
                  value={reportForm.involvedPeople}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, involvedPeople: event.target.value }))}
                  placeholder="Rodolfo, Hybson, Walter"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>O quê? (atividade) *</Label>
                <Input
                  value={reportForm.activity}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, activity: event.target.value }))}
                  placeholder="Integração SAP x EUST"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Status Diário *</Label>
                <Textarea
                  value={reportForm.dailyStatus}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, dailyStatus: event.target.value }))}
                  rows={5}
                  placeholder="Descreva o avanço, bloqueio, dependência e próximo passo."
                />
              </div>

              <div className="space-y-1.5">
                <Label>° de dificuldade da atividade *</Label>
                <Select value={reportForm.difficultyLevel} onValueChange={(value) => setReportForm((prev) => ({ ...prev, difficultyLevel: value as DifficultyLevel }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(difficultyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Situação *</Label>
                <Select value={reportForm.situation} onValueChange={(value) => setReportForm((prev) => ({ ...prev, situation: value as StatusSituation }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(situationLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingReport}>
                {isSavingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>Cadastre parceiros SAP, clientes finais ou clientes diretos.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={companyForm.name}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="INCLUSION CLOUD"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={companyForm.type} onValueChange={(value) => setCompanyForm((prev) => ({ ...prev, type: value as CompanyType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(companyTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={companyForm.notes}
                onChange={(event) => setCompanyForm((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingCompany}>
                {isSavingCompany && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStrategicDialogOpen} onOpenChange={setIsStrategicDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Alterar Grau Estratégico</DialogTitle>
            <DialogDescription>Classificação de gestão para o Status Report selecionado.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Grau Estratégico</Label>
            <Select value={selectedStrategicLevel} onValueChange={(value) => setSelectedStrategicLevel(value as StrategicLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(strategicLevelLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsStrategicDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleUpdateStrategicLevel()} disabled={isSavingReport}>
              {isSavingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
