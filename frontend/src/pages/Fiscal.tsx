import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { getAuthorities } from "../lib/auth"
import { useToast } from "../contexts/ToastContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { AlertTriangle, FileUp, InboxIcon, Loader2, PlusCircle, ReceiptText, Search, Send, Store, Trash2 } from "lucide-react"

const ITEMS_PER_PAGE = 10
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const emptySupplier = {
  legalName: "", tradeName: "", document: "", stateRegistration: "", municipalRegistration: "",
  fiscalEmail: "", phone: "", contactName: "", category: "", street: "", number: "", complement: "",
  district: "", city: "", state: "", zipCode: "", notes: "", active: true,
}

const emptyInvoice = {
  supplierId: "", purchaseOrderId: "", number: "", series: "", accessKey: "", invoiceType: "CONSUMABLE", status: "RECEIVED",
  issueDate: new Date().toISOString().slice(0, 10), receivedDate: new Date().toISOString().slice(0, 10),
  productValue: 0, freightValue: 0, discountValue: 0, taxValue: 0, totalValue: 0,
  costCenter: "", purchaseOrderReference: "", notes: "", divergenceNotes: "",
  items: [] as any[],
}

const emptyItem = {
  stockItemId: "", description: "", category: "", quantity: 1, unitValue: 0, ncm: "", cfop: "",
  entersStock: false, patrimony: false,
}

export function Fiscal() {
  const { user } = useAuth()
  const toast = useToast()
  const authorities = getAuthorities(user)
  const canAccessFiscal = authorities.includes("ROLE_ADMIN") || authorities.includes("ACCESS_FISCAL")

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierTotalPages, setSupplierTotalPages] = useState(1)
  const [supplierTotalItems, setSupplierTotalItems] = useState(0)
  const [supplierSearch, setSupplierSearch] = useState("")
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)

  const [invoices, setInvoices] = useState<any[]>([])
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1)
  const [invoiceTotalItems, setInvoiceTotalItems] = useState(0)
  const [invoiceSearch, setInvoiceSearch] = useState("")
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL")
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)

  const [supplierForm, setSupplierForm] = useState<any>(emptySupplier)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)

  const [invoiceForm, setInvoiceForm] = useState<any>(emptyInvoice)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [attachmentType, setAttachmentType] = useState("DANFE")
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [stockItems, setStockItems] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])

  const invoiceTotal = useMemo(
    () => Number(invoiceForm.productValue || 0) + Number(invoiceForm.freightValue || 0) + Number(invoiceForm.taxValue || 0) - Number(invoiceForm.discountValue || 0),
    [invoiceForm.productValue, invoiceForm.freightValue, invoiceForm.taxValue, invoiceForm.discountValue]
  )

  const visibleTotalValue = useMemo(
    () => invoices.reduce((total, invoice) => total + Number(invoice.totalValue || 0), 0),
    [invoices]
  )

  const fetchSuppliers = async () => {
    if (!canAccessFiscal) return
    try {
      setIsLoadingSuppliers(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: String(Math.max(0, supplierPage - 1)),
        size: String(ITEMS_PER_PAGE),
        sort: "legalName,asc",
      })
      if (supplierSearch.trim()) params.set("search", supplierSearch.trim().slice(0, 100))
      const response = await fetch(`/fiscal/suppliers?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.content || [])
        setSupplierTotalPages(Math.max(1, data.totalPages || 1))
        setSupplierTotalItems(data.totalElements || 0)
      }
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error)
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  const fetchInvoices = async () => {
    if (!canAccessFiscal) return
    try {
      setIsLoadingInvoices(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: String(Math.max(0, invoicePage - 1)),
        size: String(ITEMS_PER_PAGE),
        sort: "issueDate,desc",
      })
      if (invoiceSearch.trim()) params.set("search", invoiceSearch.trim().slice(0, 100))
      if (invoiceStatusFilter !== "ALL") params.set("status", invoiceStatusFilter)
      const response = await fetch(`/fiscal/invoices?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.content || [])
        setInvoiceTotalPages(Math.max(1, data.totalPages || 1))
        setInvoiceTotalItems(data.totalElements || 0)
      }
    } catch (error) {
      console.error("Erro ao buscar notas fiscais:", error)
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  const fetchStockItems = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/inventory/administrative/items?page=0&size=100&sort=name,asc", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStockItems(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar itens de estoque:", error)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/purchasing/orders?page=0&size=100&sort=number,asc", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPurchaseOrders(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos de compra:", error)
    }
  }

  useEffect(() => { fetchSuppliers() }, [canAccessFiscal, supplierPage])
  useEffect(() => { fetchInvoices() }, [canAccessFiscal, invoicePage, invoiceStatusFilter])
  useEffect(() => {
    if (canAccessFiscal) {
      fetchStockItems()
      fetchPurchaseOrders()
    }
  }, [canAccessFiscal])

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const url = editingSupplier ? `/fiscal/suppliers/${editingSupplier.id}` : "/fiscal/suppliers"
      const response = await fetch(url, {
        method: editingSupplier ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(supplierForm),
      })
      if (response.ok) {
        setIsSupplierModalOpen(false)
        setSupplierForm(emptySupplier)
        setEditingSupplier(null)
        fetchSuppliers()
        toast.success(editingSupplier ? "Fornecedor atualizado!" : "Fornecedor cadastrado!")
      } else {
        toast.error("Erro ao salvar fornecedor", await response.text())
      }
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error)
    }
  }

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const url = editingInvoice ? `/fiscal/invoices/${editingInvoice.id}` : "/fiscal/invoices"
      const payload = {
        ...invoiceForm,
        purchaseOrderId: invoiceForm.purchaseOrderId || null,
        totalValue: invoiceTotal,
        items: invoiceForm.items.map(normalizeItemPayload),
      }
      const response = await fetch(url, {
        method: editingInvoice ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setIsInvoiceModalOpen(false)
        setInvoiceForm(emptyInvoice)
        setEditingInvoice(null)
        fetchInvoices()
        toast.success(editingInvoice ? "Nota atualizada!" : "Nota recebida cadastrada!")
      } else {
        toast.error("Erro ao salvar nota fiscal", await response.text())
      }
    } catch (error) {
      console.error("Erro ao salvar nota fiscal:", error)
    }
  }

  const normalizeItemPayload = (item: any) => ({
    ...item,
    stockItemId: item.entersStock ? item.stockItemId || null : null,
    quantity: Number(item.quantity || 0),
    unitValue: Number(item.unitValue || 0),
  })

  const openSupplierModal = (supplier?: any) => {
    setEditingSupplier(supplier || null)
    setSupplierForm(supplier || emptySupplier)
    setIsSupplierModalOpen(true)
  }

  const openInvoiceModal = (invoice?: any) => {
    setEditingInvoice(invoice || null)
    setInvoiceForm(invoice ? {
      supplierId: invoice.supplier.id,
      purchaseOrderId: invoice.purchaseOrderId || "",
      number: invoice.number,
      series: invoice.series || "",
      accessKey: invoice.accessKey || "",
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      issueDate: invoice.issueDate,
      receivedDate: invoice.receivedDate || "",
      productValue: Number(invoice.productValue || 0),
      freightValue: Number(invoice.freightValue || 0),
      discountValue: Number(invoice.discountValue || 0),
      taxValue: Number(invoice.taxValue || 0),
      totalValue: Number(invoice.totalValue || 0),
      costCenter: invoice.costCenter || "",
      purchaseOrderReference: invoice.purchaseOrderReference || "",
      notes: invoice.notes || "",
      divergenceNotes: invoice.divergenceNotes || "",
      items: invoice.items || [],
    } : emptyInvoice)
    setIsInvoiceModalOpen(true)
  }

  const addInvoiceItem = () => setInvoiceForm((prev: any) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  const updateInvoiceItem = (index: number, patch: any) => setInvoiceForm((prev: any) => ({
    ...prev,
    items: prev.items.map((item: any, i: number) => i === index ? { ...item, ...patch } : item),
  }))
  const removeInvoiceItem = (index: number) => setInvoiceForm((prev: any) => ({
    ...prev,
    items: prev.items.filter((_: any, i: number) => i !== index),
  }))

  const updateInvoiceStatus = async (invoice: any, status: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/fiscal/invoices/${invoice.id}/status?status=${status}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        fetchInvoices()
        setSelectedInvoice(await response.json())
        toast.success("Status atualizado!")
      } else {
        toast.error("Erro ao atualizar status", await response.text())
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const launchInvoice = async (invoice: any) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/fiscal/invoices/${invoice.id}/launch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        fetchInvoices()
        setSelectedInvoice(await response.json())
        toast.success("Nota lançada!", "Entradas vinculadas foram registradas no estoque.")
      } else {
        toast.error("Erro ao lançar nota", await response.text())
      }
    } catch (error) {
      console.error("Erro ao lançar nota:", error)
    }
  }

  const uploadAttachment = async () => {
    if (!selectedInvoice || !attachmentFile) return
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", attachmentFile)
      const response = await fetch(`/fiscal/invoices/${selectedInvoice.id}/attachments?type=${attachmentType}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (response.ok) {
        const attachment = await response.json()
        setSelectedInvoice({ ...selectedInvoice, attachments: [...(selectedInvoice.attachments || []), attachment] })
        setAttachmentFile(null)
        toast.success("Anexo enviado!")
      } else {
        toast.error("Erro ao enviar anexo", await response.text())
      }
    } catch (error) {
      console.error("Erro ao enviar anexo:", error)
    }
  }

  const openDetails = (invoice: any) => {
    setSelectedInvoice(invoice)
    setIsDetailsOpen(true)
  }

  if (!canAccessFiscal) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar o módulo Fiscal.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="fiori-page-header">
        <h1 className="text-lg font-semibold text-foreground">Fiscal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Notas fiscais recebidas, fornecedores e vínculo com estoque.</p>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Summary label="Notas Listadas" value={invoiceTotalItems} />
          <Summary label="Valor no Filtro" value={currencyFormatter.format(visibleTotalValue)} />
          <Summary label="Fornecedores" value={supplierTotalItems} />
        </div>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 max-w-[360px] h-auto gap-1 sm:gap-0">
            <TabsTrigger value="invoices" className="gap-2"><ReceiptText className="h-4 w-4" /> Notas Recebidas</TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2"><Store className="h-4 w-4" /> Fornecedores</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8 w-full sm:w-[300px]" placeholder="Buscar nota, chave ou fornecedor..." value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} />
                </div>
                <Select value={invoiceStatusFilter} onValueChange={(v) => { setInvoiceStatusFilter(v); setInvoicePage(1) }}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os status</SelectItem>
                    {["RECEIVED","UNDER_REVIEW","DIVERGENT","VALIDATED","LAUNCHED","CANCELLED"].map(status => (
                      <SelectItem key={status} value={status}>{statusLabel(status)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setInvoicePage(1); fetchInvoices() }}>Filtrar</Button>
              </div>
              <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => openInvoiceModal()}><PlusCircle className="h-4 w-4" /> Nova Nota</Button>
                </DialogTrigger>
                <InvoiceDialog
                  invoiceForm={invoiceForm}
                  setInvoiceForm={setInvoiceForm}
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  stockItems={stockItems}
                  invoiceTotal={invoiceTotal}
                  editingInvoice={editingInvoice}
                  onSubmit={handleInvoiceSubmit}
                  onAddItem={addInvoiceItem}
                  onUpdateItem={updateInvoiceItem}
                  onRemoveItem={removeInvoiceItem}
                />
              </Dialog>
            </div>

            <DataTable loading={isLoadingInvoices} empty="Nenhuma nota fiscal encontrada" colSpan={8}>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conciliação</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <InboxIcon className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Nenhuma nota fiscal encontrada</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : invoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}{invoice.series ? `/${invoice.series}` : ""}</TableCell>
                    <TableCell>{invoice.supplier?.tradeName || invoice.supplier?.legalName}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{typeLabel(invoice.invoiceType)}</TableCell>
                    <TableCell><StatusBadge status={invoice.status} /></TableCell>
                    <TableCell><ReconciliationBadge status={invoice.reconciliation?.status} /></TableCell>
                    <TableCell className="text-right font-medium">{currencyFormatter.format(Number(invoice.totalValue || 0))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(invoice)}>Detalhes</Button>
                      {invoice.status !== "LAUNCHED" && invoice.status !== "CANCELLED" && (
                        <Button variant="ghost" size="sm" onClick={() => openInvoiceModal(invoice)}>Editar</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            <Pagination currentPage={invoicePage} totalPages={invoiceTotalPages} totalItems={invoiceTotalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setInvoicePage} />
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8 w-full sm:w-[300px]" placeholder="Buscar fornecedor..." value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} />
                </div>
                <Button variant="outline" onClick={() => { setSupplierPage(1); fetchSuppliers() }}>Filtrar</Button>
              </div>
              <Dialog open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => openSupplierModal()}><PlusCircle className="h-4 w-4" /> Novo Fornecedor</Button>
                </DialogTrigger>
                <SupplierDialog supplierForm={supplierForm} setSupplierForm={setSupplierForm} editingSupplier={editingSupplier} onSubmit={handleSupplierSubmit} />
              </Dialog>
            </div>

            <DataTable loading={isLoadingSuppliers} empty="Nenhum fornecedor encontrado" colSpan={6}>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <InboxIcon className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-medium">Nenhum fornecedor encontrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : suppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <p className="font-medium">{supplier.legalName}</p>
                      {supplier.tradeName && <p className="text-xs text-muted-foreground">{supplier.tradeName}</p>}
                    </TableCell>
                    <TableCell>{supplier.document}</TableCell>
                    <TableCell>{supplier.category || "-"}</TableCell>
                    <TableCell>{supplier.fiscalEmail || supplier.phone || "-"}</TableCell>
                    <TableCell>{supplier.active ? <Badge variant="outline">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openSupplierModal(supplier)}>Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            <Pagination currentPage={supplierPage} totalPages={supplierTotalPages} totalItems={supplierTotalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setSupplierPage} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl w-[95%] max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Nota Fiscal {selectedInvoice.number}</DialogTitle>
                <DialogDescription>{selectedInvoice.supplier?.legalName} - {currencyFormatter.format(Number(selectedInvoice.totalValue || 0))}</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedInvoice.status} />
                  <ReconciliationBadge status={selectedInvoice.reconciliation?.status} />
                  {selectedInvoice.status !== "LAUNCHED" && selectedInvoice.status !== "CANCELLED" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => updateInvoiceStatus(selectedInvoice, "UNDER_REVIEW")}>Em conferência</Button>
                      <Button variant="outline" size="sm" onClick={() => updateInvoiceStatus(selectedInvoice, "DIVERGENT")}>Divergente</Button>
                      <Button variant="outline" size="sm" onClick={() => updateInvoiceStatus(selectedInvoice, "VALIDATED")}>Validar</Button>
                    </>
                  )}
                  {selectedInvoice.status === "VALIDATED" && (
                    <Button size="sm" className="gap-2" onClick={() => launchInvoice(selectedInvoice)}><Send className="h-4 w-4" /> Lançar</Button>
                  )}
                </div>

                <ReconciliationPanel reconciliation={selectedInvoice.reconciliation} />

                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedInvoice.items || []).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.entersStock ? stockItems.find(s => s.id === item.stockItemId)?.name || "Vinculado" : "-"}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(Number(item.unitValue || 0))}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(Number(item.totalValue || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-md border border-border p-3 space-y-3">
                  <h3 className="text-sm font-semibold">Anexos</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={attachmentType} onValueChange={setAttachmentType}>
                      <SelectTrigger className="sm:w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DANFE">DANFE/PDF</SelectItem>
                        <SelectItem value="XML">XML</SelectItem>
                        <SelectItem value="OTHER">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="file" accept=".pdf,.xml,application/pdf,application/xml,text/xml" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} />
                    <Button className="gap-2" onClick={uploadAttachment} disabled={!attachmentFile}><FileUp className="h-4 w-4" /> Enviar</Button>
                  </div>
                  <div className="space-y-1">
                    {(selectedInvoice.attachments || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum anexo enviado.</p>
                    ) : (
                      selectedInvoice.attachments.map((attachment: any) => (
                        <a key={attachment.id} className="block text-sm text-primary hover:underline" href={attachment.url} target="_blank" rel="noreferrer">
                          {attachment.attachmentType} - {attachment.originalName}
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SupplierDialog({ supplierForm, setSupplierForm, editingSupplier, onSubmit }: any) {
  return (
    <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        <DialogDescription>Dados fiscais e de contato do fornecedor.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Razão Social" value={supplierForm.legalName} onChange={(v: string) => setSupplierForm({ ...supplierForm, legalName: v })} required />
          <Field label="Nome Fantasia" value={supplierForm.tradeName} onChange={(v: string) => setSupplierForm({ ...supplierForm, tradeName: v })} />
          <Field label="CNPJ/CPF" value={supplierForm.document} onChange={(v: string) => setSupplierForm({ ...supplierForm, document: v })} required />
          <Field label="Categoria" value={supplierForm.category} onChange={(v: string) => setSupplierForm({ ...supplierForm, category: v })} placeholder="Materiais, serviços, TI..." />
          <Field label="E-mail Fiscal" type="email" value={supplierForm.fiscalEmail} onChange={(v: string) => setSupplierForm({ ...supplierForm, fiscalEmail: v })} />
          <Field label="Telefone" value={supplierForm.phone} onChange={(v: string) => setSupplierForm({ ...supplierForm, phone: v })} />
          <Field label="Inscrição Estadual" value={supplierForm.stateRegistration} onChange={(v: string) => setSupplierForm({ ...supplierForm, stateRegistration: v })} />
          <Field label="Inscrição Municipal" value={supplierForm.municipalRegistration} onChange={(v: string) => setSupplierForm({ ...supplierForm, municipalRegistration: v })} />
          <Field label="Cidade" value={supplierForm.city} onChange={(v: string) => setSupplierForm({ ...supplierForm, city: v })} />
          <Field label="UF" value={supplierForm.state} onChange={(v: string) => setSupplierForm({ ...supplierForm, state: v.toUpperCase().slice(0, 2) })} />
        </div>
        <div className="grid gap-2">
          <Label>Observações</Label>
          <Textarea value={supplierForm.notes || ""} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="submit">{editingSupplier ? "Salvar" : "Cadastrar"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function InvoiceDialog({ invoiceForm, setInvoiceForm, suppliers, purchaseOrders, stockItems, invoiceTotal, editingInvoice, onSubmit, onAddItem, onUpdateItem, onRemoveItem }: any) {
  return (
    <DialogContent className="max-w-6xl w-[95%] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingInvoice ? "Editar Nota Recebida" : "Nova Nota Recebida"}</DialogTitle>
        <DialogDescription>Registre os dados da NF recebida e os itens vinculados à compra.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="grid gap-2 md:col-span-2">
            <Label>Fornecedor</Label>
            <Select value={invoiceForm.supplierId} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, supplierId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.tradeName || supplier.legalName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Número" value={invoiceForm.number} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, number: v })} required />
          <Field label="Série" value={invoiceForm.series} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, series: v })} />
          <Field label="Emissão" type="date" value={invoiceForm.issueDate} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, issueDate: v })} required />
          <Field label="Recebimento" type="date" value={invoiceForm.receivedDate} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, receivedDate: v })} />
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={invoiceForm.invoiceType} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, invoiceType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCT">Produto</SelectItem>
                <SelectItem value="SERVICE">Serviço</SelectItem>
                <SelectItem value="CONSUMABLE">Consumo</SelectItem>
                <SelectItem value="FIXED_ASSET">Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Centro de Custo" value={invoiceForm.costCenter} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, costCenter: v })} />
          <div className="grid gap-2">
            <Label>Pedido de Compra</Label>
            <div className="flex gap-2">
              <Select value={invoiceForm.purchaseOrderId || undefined} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, purchaseOrderId: v })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((order: any) => (
                    <SelectItem key={order.id} value={order.id}>{order.number} - {order.supplier?.tradeName || order.supplier?.legalName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {invoiceForm.purchaseOrderId && (
                <Button type="button" variant="outline" onClick={() => setInvoiceForm({ ...invoiceForm, purchaseOrderId: "" })}>Limpar</Button>
              )}
            </div>
          </div>
          <Field label="Chave de Acesso" value={invoiceForm.accessKey} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, accessKey: v })} />
          <Field label="Pedido/Referência" value={invoiceForm.purchaseOrderReference} onChange={(v: string) => setInvoiceForm({ ...invoiceForm, purchaseOrderReference: v })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <NumberField label="Produtos" value={invoiceForm.productValue} onChange={(v: number) => setInvoiceForm({ ...invoiceForm, productValue: v })} />
          <NumberField label="Frete" value={invoiceForm.freightValue} onChange={(v: number) => setInvoiceForm({ ...invoiceForm, freightValue: v })} />
          <NumberField label="Impostos" value={invoiceForm.taxValue} onChange={(v: number) => setInvoiceForm({ ...invoiceForm, taxValue: v })} />
          <NumberField label="Desconto" value={invoiceForm.discountValue} onChange={(v: number) => setInvoiceForm({ ...invoiceForm, discountValue: v })} />
          <div className="rounded-md border border-border px-3 py-2">
            <p className="text-xs text-muted-foreground">Total Calculado</p>
            <p className="text-lg font-semibold">{currencyFormatter.format(invoiceTotal)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Itens da Nota</h3>
            <Button type="button" variant="outline" size="sm" onClick={onAddItem}>Adicionar item</Button>
          </div>
          {invoiceForm.items.length === 0 ? (
            <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Nenhum item informado.</div>
          ) : (
            <div className="space-y-3">
              {invoiceForm.items.map((item: any, index: number) => (
                <div key={index} className="rounded-md border border-border p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-3">
                    <Field label="Descrição" value={item.description} onChange={(v: string) => onUpdateItem(index, { description: v })} required />
                  </div>
                  <div className="lg:col-span-2">
                    <Field label="Categoria" value={item.category || ""} onChange={(v: string) => onUpdateItem(index, { category: v })} />
                  </div>
                  <div className="lg:col-span-1">
                    <NumberField label="Qtd." value={item.quantity} onChange={(v: number) => onUpdateItem(index, { quantity: v })} />
                  </div>
                  <div className="lg:col-span-2">
                    <NumberField label="Valor Unit." value={item.unitValue} onChange={(v: number) => onUpdateItem(index, { unitValue: v })} />
                  </div>
                  <div className="lg:col-span-2 grid gap-2">
                    <Label>Item de Estoque</Label>
                    <Select value={item.stockItemId || ""} onValueChange={(v) => onUpdateItem(index, { stockItemId: v, entersStock: true })}>
                      <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>
                        {stockItems.map((stock: any) => <SelectItem key={stock.id} value={stock.id}>{stock.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="lg:col-span-1 flex items-end gap-2">
                    <Checkbox checked={item.entersStock} onCheckedChange={(checked) => onUpdateItem(index, { entersStock: !!checked })} />
                    <span className="text-xs">Estoque</span>
                  </div>
                  <div className="lg:col-span-1 flex items-end justify-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveItem(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Observações</Label>
          <Textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="submit">{editingInvoice ? "Salvar" : "Cadastrar Nota"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ReconciliationPanel({ reconciliation }: { reconciliation?: any }) {
  if (!reconciliation) return null
  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Conciliação</h3>
          <p className="text-xs text-muted-foreground">Pedido de compra, recebimento físico e nota fiscal.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">Diferença total</p>
          <p className="text-sm font-semibold">{currencyFormatter.format(Number(reconciliation.totalDifference || 0))}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {(reconciliation.messages || []).map((message: string, index: number) => (
          <Badge key={index} variant="outline" className={reconciliation.status === "DIVERGENT" ? "border-red-500/30 text-red-700 bg-red-500/10" : ""}>
            {message}
          </Badge>
        ))}
      </div>
      {(reconciliation.items || []).length > 0 && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pedido</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Nota</TableHead>
                <TableHead className="text-right">Unit. Pedido</TableHead>
                <TableHead className="text-right">Unit. Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliation.items.map((item: any, index: number) => (
                <TableRow key={item.orderItemId || item.invoiceItemId || index}>
                  <TableCell>
                    <p className="font-medium">{item.description}</p>
                    {(item.messages || []).length > 0 && <p className="text-xs text-muted-foreground">{item.messages.join(" ")}</p>}
                  </TableCell>
                  <TableCell><ReconciliationBadge status={item.status} /></TableCell>
                  <TableCell className="text-right">{formatQuantity(item.orderedQuantity)}</TableCell>
                  <TableCell className="text-right">{formatQuantity(item.receivedQuantity)}</TableCell>
                  <TableCell className="text-right">{formatQuantity(item.invoiceQuantity)}</TableCell>
                  <TableCell className="text-right">{currencyFormatter.format(Number(item.orderedUnitValue || 0))}</TableCell>
                  <TableCell className="text-right">{currencyFormatter.format(Number(item.invoiceUnitValue || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function DataTable({ loading, empty, colSpan, children }: any) {
  return (
    <div className="rounded-md border border-border bg-card shadow-sm overflow-x-auto">
      <Table>
        {loading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={colSpan} className="py-16 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Carregando...
              </TableCell>
            </TableRow>
          </TableBody>
        ) : children?.props?.children?.length === 0 ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={colSpan} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <InboxIcon className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-medium">{empty}</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        ) : children}
      </Table>
    </div>
  )
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }: any) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  )
}

function NumberField({ label, value, onChange }: any) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type="number" min="0" step="0.01" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RECEIVED: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    UNDER_REVIEW: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
    DIVERGENT: "bg-red-500/15 text-red-700 border-red-500/30",
    VALIDATED: "bg-green-500/15 text-green-700 border-green-500/30",
    LAUNCHED: "bg-primary/15 text-primary border-primary/30",
    CANCELLED: "bg-muted text-muted-foreground",
  }
  return <Badge variant="outline" className={styles[status] || ""}>{statusLabel(status)}</Badge>
}

function ReconciliationBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    NOT_LINKED: "bg-muted text-muted-foreground",
    MATCHED: "bg-green-500/15 text-green-700 border-green-500/30",
    DIVERGENT: "bg-red-500/15 text-red-700 border-red-500/30",
    MISSING_IN_INVOICE: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
    NOT_IN_ORDER: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  }
  return <Badge variant="outline" className={styles[status || "NOT_LINKED"] || ""}>{reconciliationLabel(status || "NOT_LINKED")}</Badge>
}

function statusLabel(status: string) {
  return ({
    RECEIVED: "Recebida",
    UNDER_REVIEW: "Em conferência",
    DIVERGENT: "Divergente",
    VALIDATED: "Validada",
    LAUNCHED: "Lançada",
    CANCELLED: "Cancelada",
  } as Record<string, string>)[status] || status
}

function typeLabel(type: string) {
  return ({
    PRODUCT: "Produto",
    SERVICE: "Serviço",
    CONSUMABLE: "Consumo",
    FIXED_ASSET: "Ativo",
  } as Record<string, string>)[type] || type
}

function reconciliationLabel(status: string) {
  return ({
    NOT_LINKED: "Sem vínculo",
    MATCHED: "Conciliada",
    DIVERGENT: "Divergente",
    MISSING_IN_INVOICE: "Falta na NF",
    NOT_IN_ORDER: "Fora do pedido",
  } as Record<string, string>)[status] || status
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`))
}

function formatQuantity(value?: number | string) {
  return Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })
}
