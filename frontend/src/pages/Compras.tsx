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
import { AlertTriangle, CheckCircle2, ClipboardList, FilePlus2, InboxIcon, Loader2, PlusCircle, Search, Send, ShoppingCart, Trash2, XCircle } from "lucide-react"

const ITEMS_PER_PAGE = 10
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const emptyPurchaseItem = {
  stockItemId: "", description: "", category: "", quantity: 1, unitValue: 0,
}

const emptyRequest = {
  title: "", justification: "", costCenter: "", items: [] as any[],
}

const emptyOrder = {
  requestId: "", supplierId: "", number: "", issueDate: new Date().toISOString().slice(0, 10),
  expectedDeliveryDate: "", notes: "", items: [] as any[],
}

export function Compras() {
  const { user } = useAuth()
  const toast = useToast()
  const authorities = getAuthorities(user)
  const canAccessPurchases = authorities.includes("ROLE_ADMIN") || authorities.includes("ACCESS_PURCHASES")

  const [requests, setRequests] = useState<any[]>([])
  const [requestPage, setRequestPage] = useState(1)
  const [requestTotalPages, setRequestTotalPages] = useState(1)
  const [requestTotalItems, setRequestTotalItems] = useState(0)
  const [requestSearch, setRequestSearch] = useState("")
  const [requestStatusFilter, setRequestStatusFilter] = useState("ALL")
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  const [orders, setOrders] = useState<any[]>([])
  const [orderPage, setOrderPage] = useState(1)
  const [orderTotalPages, setOrderTotalPages] = useState(1)
  const [orderTotalItems, setOrderTotalItems] = useState(0)
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL")
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  const [requestForm, setRequestForm] = useState<any>(emptyRequest)
  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const [orderForm, setOrderForm] = useState<any>(emptyOrder)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [receivingOrder, setReceivingOrder] = useState<any>(null)
  const [receiptItems, setReceiptItems] = useState<Record<string, number>>({})
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])

  const visibleOrderValue = useMemo(
    () => orders.reduce((total, order) => total + Number(order.totalEstimatedValue || 0), 0),
    [orders]
  )

  const approvedRequests = useMemo(
    () => requests.filter(request => request.status === "APPROVED"),
    [requests]
  )

  const fetchRequests = async () => {
    if (!canAccessPurchases) return
    try {
      setIsLoadingRequests(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: String(Math.max(0, requestPage - 1)),
        size: String(ITEMS_PER_PAGE),
        sort: "createdAt,desc",
      })
      if (requestSearch.trim()) params.set("search", requestSearch.trim().slice(0, 100))
      if (requestStatusFilter !== "ALL") params.set("status", requestStatusFilter)
      const response = await fetch(`/purchasing/requests?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.content || [])
        setRequestTotalPages(Math.max(1, data.totalPages || 1))
        setRequestTotalItems(data.totalElements || 0)
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações de compra:", error)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const fetchOrders = async () => {
    if (!canAccessPurchases) return
    try {
      setIsLoadingOrders(true)
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({
        page: String(Math.max(0, orderPage - 1)),
        size: String(ITEMS_PER_PAGE),
        sort: "createdAt,desc",
      })
      if (orderSearch.trim()) params.set("search", orderSearch.trim().slice(0, 100))
      if (orderStatusFilter !== "ALL") params.set("status", orderStatusFilter)
      const response = await fetch(`/purchasing/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.content || [])
        setOrderTotalPages(Math.max(1, data.totalPages || 1))
        setOrderTotalItems(data.totalElements || 0)
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos de compra:", error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const fetchSupportData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [suppliersResponse, stockResponse] = await Promise.all([
        fetch("/fiscal/suppliers?page=0&size=100&sort=legalName,asc", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/inventory/administrative/items?page=0&size=100&sort=name,asc", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (suppliersResponse.ok) {
        const data = await suppliersResponse.json()
        setSuppliers(data.content || [])
      }
      if (stockResponse.ok) {
        const data = await stockResponse.json()
        setStockItems(data.content || [])
      }
    } catch (error) {
      console.error("Erro ao buscar dados de apoio de compras:", error)
    }
  }

  useEffect(() => { fetchRequests() }, [canAccessPurchases, requestPage, requestStatusFilter])
  useEffect(() => { fetchOrders() }, [canAccessPurchases, orderPage, orderStatusFilter])
  useEffect(() => { if (canAccessPurchases) fetchSupportData() }, [canAccessPurchases])

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const url = editingRequest ? `/purchasing/requests/${editingRequest.id}` : "/purchasing/requests"
      const response = await fetch(url, {
        method: editingRequest ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...requestForm, items: requestForm.items.map(normalizePurchaseItem) }),
      })
      if (response.ok) {
        setIsRequestModalOpen(false)
        setRequestForm(emptyRequest)
        setEditingRequest(null)
        fetchRequests()
        toast.success(editingRequest ? "Solicitação atualizada!" : "Solicitação cadastrada!")
      } else {
        toast.error("Erro ao salvar solicitação", await response.text())
      }
    } catch (error) {
      console.error("Erro ao salvar solicitação:", error)
    }
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const url = editingOrder ? `/purchasing/orders/${editingOrder.id}` : "/purchasing/orders"
      const payload = {
        ...orderForm,
        requestId: orderForm.requestId || null,
        items: orderForm.items.map(normalizePurchaseItem),
      }
      const response = await fetch(url, {
        method: editingOrder ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setIsOrderModalOpen(false)
        setOrderForm(emptyOrder)
        setEditingOrder(null)
        fetchOrders()
        fetchRequests()
        toast.success(editingOrder ? "Pedido atualizado!" : "Pedido de compra cadastrado!")
      } else {
        toast.error("Erro ao salvar pedido", await response.text())
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error)
    }
  }

  const normalizePurchaseItem = (item: any) => ({
    ...item,
    stockItemId: item.stockItemId || null,
    quantity: Number(item.quantity || 0),
    unitValue: Number(item.unitValue || 0),
  })

  const updateRequestStatus = async (request: any, status: string) => {
    const reason = status === "REJECTED" ? window.prompt("Motivo da reprovação") : null
    if (status === "REJECTED" && !reason?.trim()) return
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams({ status })
      if (reason) params.set("rejectionReason", reason)
      const response = await fetch(`/purchasing/requests/${request.id}/status?${params}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        fetchRequests()
        toast.success("Status da solicitação atualizado!")
      } else {
        toast.error("Erro ao atualizar solicitação", await response.text())
      }
    } catch (error) {
      console.error("Erro ao atualizar solicitação:", error)
    }
  }

  const updateOrderStatus = async (order: any, status: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/purchasing/orders/${order.id}/status?status=${status}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        fetchOrders()
        toast.success("Status do pedido atualizado!")
      } else {
        toast.error("Erro ao atualizar pedido", await response.text())
      }
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error)
    }
  }

  const handleReceiveOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivingOrder) return
    const items = Object.entries(receiptItems)
      .filter(([, quantity]) => Number(quantity || 0) > 0)
      .map(([orderItemId, receivedQuantity]) => ({ orderItemId, receivedQuantity: Number(receivedQuantity) }))
    if (items.length === 0) {
      toast.error("Informe uma quantidade recebida")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/purchasing/orders/${receivingOrder.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
      })
      if (response.ok) {
        setIsReceiptModalOpen(false)
        setReceivingOrder(null)
        setReceiptItems({})
        fetchOrders()
        toast.success("Recebimento registrado!")
      } else {
        toast.error("Erro ao registrar recebimento", await response.text())
      }
    } catch (error) {
      console.error("Erro ao registrar recebimento:", error)
    }
  }

  const openRequestModal = (request?: any) => {
    setEditingRequest(request || null)
    setRequestForm(request ? {
      title: request.title,
      justification: request.justification || "",
      costCenter: request.costCenter || "",
      items: request.items || [],
    } : emptyRequest)
    setIsRequestModalOpen(true)
  }

  const openOrderModal = (order?: any) => {
    setEditingOrder(order || null)
    setOrderForm(order ? {
      requestId: order.requestId || "",
      supplierId: order.supplier?.id || "",
      number: order.number,
      issueDate: order.issueDate,
      expectedDeliveryDate: order.expectedDeliveryDate || "",
      notes: order.notes || "",
      items: order.items || [],
    } : emptyOrder)
    setIsOrderModalOpen(true)
  }

  const openReceiptModal = (order: any) => {
    setReceivingOrder(order)
    setReceiptItems({})
    setIsReceiptModalOpen(true)
  }

  const addRequestItem = () => setRequestForm((prev: any) => ({ ...prev, items: [...prev.items, { ...emptyPurchaseItem }] }))
  const updateRequestItem = (index: number, patch: any) => setRequestForm((prev: any) => ({
    ...prev,
    items: prev.items.map((item: any, i: number) => i === index ? { ...item, ...patch } : item),
  }))
  const removeRequestItem = (index: number) => setRequestForm((prev: any) => ({
    ...prev,
    items: prev.items.filter((_: any, i: number) => i !== index),
  }))

  const addOrderItem = () => setOrderForm((prev: any) => ({ ...prev, items: [...prev.items, { ...emptyPurchaseItem }] }))
  const updateOrderItem = (index: number, patch: any) => setOrderForm((prev: any) => ({
    ...prev,
    items: prev.items.map((item: any, i: number) => i === index ? { ...item, ...patch } : item),
  }))
  const removeOrderItem = (index: number) => setOrderForm((prev: any) => ({
    ...prev,
    items: prev.items.filter((_: any, i: number) => i !== index),
  }))

  if (!canAccessPurchases) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar o módulo de Compras.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="fiori-page-header">
        <h1 className="text-lg font-semibold text-foreground">Compras</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Solicitações internas, pedidos de compra e acompanhamento de recebimento.</p>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Summary label="Solicitações" value={requestTotalItems} />
          <Summary label="Pedidos" value={orderTotalItems} />
          <Summary label="Valor no Filtro" value={currencyFormatter.format(visibleOrderValue)} />
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-2 max-w-[360px] h-auto gap-1 sm:gap-0">
            <TabsTrigger value="requests" className="gap-2"><ClipboardList className="h-4 w-4" /> Solicitações</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2"><ShoppingCart className="h-4 w-4" /> Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <SearchBox value={requestSearch} onChange={setRequestSearch} placeholder="Buscar solicitação..." />
                <StatusSelect value={requestStatusFilter} onChange={(v: string) => { setRequestStatusFilter(v); setRequestPage(1) }} statuses={requestStatuses} label={requestStatusLabel} />
                <Button variant="outline" onClick={() => { setRequestPage(1); fetchRequests() }}>Filtrar</Button>
              </div>
              <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => openRequestModal()}><PlusCircle className="h-4 w-4" /> Nova Solicitação</Button>
                </DialogTrigger>
                <RequestDialog
                  requestForm={requestForm}
                  setRequestForm={setRequestForm}
                  stockItems={stockItems}
                  editingRequest={editingRequest}
                  onSubmit={handleRequestSubmit}
                  onAddItem={addRequestItem}
                  onUpdateItem={updateRequestItem}
                  onRemoveItem={removeRequestItem}
                />
              </Dialog>
            </div>

            <DataTable loading={isLoadingRequests} colSpan={7}>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Valor Est.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <EmptyRow colSpan={6} label="Nenhuma solicitação encontrada" />
                ) : requests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <p className="font-medium">{request.title}</p>
                      {request.justification && <p className="text-xs text-muted-foreground line-clamp-1">{request.justification}</p>}
                    </TableCell>
                    <TableCell>{request.costCenter || "-"}</TableCell>
                    <TableCell><RequestStatusBadge status={request.status} /></TableCell>
                    <TableCell className="text-right">{request.items?.length || 0}</TableCell>
                    <TableCell className="text-right font-medium">{currencyFormatter.format(Number(request.estimatedTotalValue || 0))}</TableCell>
                    <TableCell className="text-right">
                      {(request.status === "DRAFT" || request.status === "REJECTED") && (
                        <Button variant="ghost" size="sm" onClick={() => openRequestModal(request)}>Editar</Button>
                      )}
                      {request.status === "DRAFT" && (
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => updateRequestStatus(request, "SUBMITTED")}><Send className="h-3.5 w-3.5" /> Enviar</Button>
                      )}
                      {request.status === "SUBMITTED" && (
                        <>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => updateRequestStatus(request, "APPROVED")}><CheckCircle2 className="h-3.5 w-3.5" /> Aprovar</Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={() => updateRequestStatus(request, "REJECTED")}><XCircle className="h-3.5 w-3.5" /> Reprovar</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            <Pagination currentPage={requestPage} totalPages={requestTotalPages} totalItems={requestTotalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setRequestPage} />
          </TabsContent>

          <TabsContent value="orders" className="mt-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <SearchBox value={orderSearch} onChange={setOrderSearch} placeholder="Buscar pedido..." />
                <StatusSelect value={orderStatusFilter} onChange={(v: string) => { setOrderStatusFilter(v); setOrderPage(1) }} statuses={orderStatuses} label={orderStatusLabel} />
                <Button variant="outline" onClick={() => { setOrderPage(1); fetchOrders() }}>Filtrar</Button>
              </div>
              <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => openOrderModal()}><FilePlus2 className="h-4 w-4" /> Novo Pedido</Button>
                </DialogTrigger>
                <OrderDialog
                  orderForm={orderForm}
                  setOrderForm={setOrderForm}
                  suppliers={suppliers}
                  approvedRequests={approvedRequests}
                  stockItems={stockItems}
                  editingOrder={editingOrder}
                  onSubmit={handleOrderSubmit}
                  onAddItem={addOrderItem}
                  onUpdateItem={updateOrderItem}
                  onRemoveItem={removeOrderItem}
                />
              </Dialog>
            </div>

            <DataTable loading={isLoadingOrders} colSpan={7}>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <EmptyRow colSpan={6} label="Nenhum pedido encontrado" />
                ) : orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.number}</TableCell>
                    <TableCell>{order.supplier?.tradeName || order.supplier?.legalName}</TableCell>
                    <TableCell>{formatDate(order.issueDate)}</TableCell>
                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right font-medium">{currencyFormatter.format(Number(order.totalEstimatedValue || 0))}</TableCell>
                    <TableCell className="text-right">
                      {order.status !== "CLOSED" && order.status !== "CANCELLED" && (
                        <Button variant="ghost" size="sm" onClick={() => openOrderModal(order)}>Editar</Button>
                      )}
                      {order.status === "OPEN" && (
                        <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order, "SENT_TO_SUPPLIER")}>Enviar</Button>
                      )}
                      {["OPEN", "SENT_TO_SUPPLIER", "PARTIALLY_RECEIVED"].includes(order.status) && (
                        <Button variant="ghost" size="sm" onClick={() => openReceiptModal(order)}>Receber</Button>
                      )}
                      {["OPEN", "SENT_TO_SUPPLIER", "PARTIALLY_RECEIVED", "RECEIVED", "LINKED_TO_INVOICE"].includes(order.status) && (
                        <Button variant="ghost" size="sm" onClick={() => updateOrderStatus(order, "CLOSED")}>Encerrar</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
            <Pagination currentPage={orderPage} totalPages={orderTotalPages} totalItems={orderTotalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setOrderPage} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <ReceiptDialog
          order={receivingOrder}
          receiptItems={receiptItems}
          setReceiptItems={setReceiptItems}
          onSubmit={handleReceiveOrder}
        />
      </Dialog>
    </div>
  )
}

function RequestDialog({ requestForm, setRequestForm, stockItems, editingRequest, onSubmit, onAddItem, onUpdateItem, onRemoveItem }: any) {
  return (
    <DialogContent className="max-w-5xl w-[95%] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingRequest ? "Editar Solicitação" : "Nova Solicitação"}</DialogTitle>
        <DialogDescription>Pedido interno para aprovação antes da compra.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Field label="Título" value={requestForm.title} onChange={(v: string) => setRequestForm({ ...requestForm, title: v })} required />
          </div>
          <Field label="Centro de Custo" value={requestForm.costCenter} onChange={(v: string) => setRequestForm({ ...requestForm, costCenter: v })} />
        </div>
        <div className="grid gap-2">
          <Label>Justificativa</Label>
          <Textarea value={requestForm.justification || ""} onChange={(e) => setRequestForm({ ...requestForm, justification: e.target.value })} />
        </div>
        <PurchaseItems items={requestForm.items} stockItems={stockItems} onAdd={onAddItem} onUpdate={onUpdateItem} onRemove={onRemoveItem} />
        <DialogFooter>
          <Button type="submit">{editingRequest ? "Salvar" : "Cadastrar Solicitação"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function OrderDialog({ orderForm, setOrderForm, suppliers, approvedRequests, stockItems, editingOrder, onSubmit, onAddItem, onUpdateItem, onRemoveItem }: any) {
  return (
    <DialogContent className="max-w-6xl w-[95%] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingOrder ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
        <DialogDescription>Pedido formal ao fornecedor, com itens e previsão de entrega.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="grid gap-2 md:col-span-2">
            <Label>Fornecedor</Label>
            <Select value={orderForm.supplierId} onValueChange={(v) => setOrderForm({ ...orderForm, supplierId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier: any) => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.tradeName || supplier.legalName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Número" value={orderForm.number} onChange={(v: string) => setOrderForm({ ...orderForm, number: v })} required />
          <Field label="Emissão" type="date" value={orderForm.issueDate} onChange={(v: string) => setOrderForm({ ...orderForm, issueDate: v })} required />
          <Field label="Previsão" type="date" value={orderForm.expectedDeliveryDate} onChange={(v: string) => setOrderForm({ ...orderForm, expectedDeliveryDate: v })} />
          <div className="grid gap-2 md:col-span-3">
            <Label>Solicitação Aprovada</Label>
            <div className="flex gap-2">
              <Select value={orderForm.requestId || undefined} onValueChange={(v) => setOrderForm({ ...orderForm, requestId: v })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {approvedRequests.map((request: any) => (
                    <SelectItem key={request.id} value={request.id}>{request.title} - {currencyFormatter.format(Number(request.estimatedTotalValue || 0))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {orderForm.requestId && (
                <Button type="button" variant="outline" onClick={() => setOrderForm({ ...orderForm, requestId: "" })}>Limpar</Button>
              )}
            </div>
          </div>
        </div>
        <PurchaseItems items={orderForm.items} stockItems={stockItems} onAdd={onAddItem} onUpdate={onUpdateItem} onRemove={onRemoveItem} />
        <div className="grid gap-2">
          <Label>Observações</Label>
          <Textarea value={orderForm.notes || ""} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="submit">{editingOrder ? "Salvar" : "Cadastrar Pedido"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function ReceiptDialog({ order, receiptItems, setReceiptItems, onSubmit }: any) {
  const items = order?.items || []
  const totalPending = items.reduce((total: number, item: any) => total + Number(item.pendingQuantity ?? item.quantity ?? 0), 0)

  return (
    <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Receber Pedido {order?.number}</DialogTitle>
        <DialogDescription>Registre as quantidades recebidas fisicamente para atualizar o status do pedido.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Pedido</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Receber agora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => {
                const pending = Number(item.pendingQuantity ?? 0)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.description}</p>
                      {item.category && <p className="text-xs text-muted-foreground">{item.category}</p>}
                    </TableCell>
                    <TableCell className="text-right">{formatQuantity(item.quantity)}</TableCell>
                    <TableCell className="text-right">{formatQuantity(item.receivedQuantity)}</TableCell>
                    <TableCell className="text-right">{formatQuantity(pending)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="ml-auto w-28 text-right"
                        type="number"
                        min="0"
                        max={pending}
                        step="0.001"
                        value={receiptItems[item.id] ?? ""}
                        onChange={(e) => setReceiptItems({ ...receiptItems, [item.id]: Number(e.target.value) })}
                        disabled={pending <= 0}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <div className="rounded-md border border-border px-3 py-2 bg-muted/30">
          <p className="text-xs text-muted-foreground">Saldo pendente total</p>
          <p className="text-lg font-semibold">{formatQuantity(totalPending)}</p>
        </div>
        <DialogFooter>
          <Button type="submit">Registrar Recebimento</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function PurchaseItems({ items, stockItems, onAdd, onUpdate, onRemove }: any) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Itens</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>Adicionar item</Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Nenhum item informado.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="rounded-md border border-border p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-3">
                <Field label="Descrição" value={item.description} onChange={(v: string) => onUpdate(index, { description: v })} required />
              </div>
              <div className="lg:col-span-2">
                <Field label="Categoria" value={item.category || ""} onChange={(v: string) => onUpdate(index, { category: v })} />
              </div>
              <div className="lg:col-span-1">
                <NumberField label="Qtd." value={item.quantity} onChange={(v: number) => onUpdate(index, { quantity: v })} />
              </div>
              <div className="lg:col-span-2">
                <NumberField label="Valor Unit." value={item.unitValue} onChange={(v: number) => onUpdate(index, { unitValue: v })} />
              </div>
              <div className="lg:col-span-3 grid gap-2">
                <Label>Item de Estoque</Label>
                <div className="flex gap-2">
                  <Select value={item.stockItemId || undefined} onValueChange={(v) => onUpdate(index, { stockItemId: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      {stockItems.map((stock: any) => <SelectItem key={stock.id} value={stock.id}>{stock.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {item.stockItemId && (
                    <Button type="button" variant="outline" onClick={() => onUpdate(index, { stockItemId: "" })}>Limpar</Button>
                  )}
                </div>
              </div>
              <div className="lg:col-span-1 flex items-end justify-end">
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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

function DataTable({ loading, colSpan, children }: any) {
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
        ) : children}
      </Table>
    </div>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <InboxIcon className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">{label}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

function SearchBox({ value, onChange, placeholder }: any) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input className="pl-8 w-full sm:w-[280px]" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function StatusSelect({ value, onChange, statuses, label }: any) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[190px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todos os status</SelectItem>
        {statuses.map((status: string) => <SelectItem key={status} value={status}>{label(status)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function Field({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} required={required} />
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

function RequestStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    SUBMITTED: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    APPROVED: "bg-green-500/15 text-green-700 border-green-500/30",
    REJECTED: "bg-red-500/15 text-red-700 border-red-500/30",
    ORDERED: "bg-primary/15 text-primary border-primary/30",
    CANCELLED: "bg-muted text-muted-foreground",
  }
  return <Badge variant="outline" className={styles[status] || ""}>{requestStatusLabel(status)}</Badge>
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    SENT_TO_SUPPLIER: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
    PARTIALLY_RECEIVED: "bg-orange-500/15 text-orange-700 border-orange-500/30",
    RECEIVED: "bg-green-500/15 text-green-700 border-green-500/30",
    LINKED_TO_INVOICE: "bg-primary/15 text-primary border-primary/30",
    CLOSED: "bg-muted text-muted-foreground",
    CANCELLED: "bg-red-500/15 text-red-700 border-red-500/30",
  }
  return <Badge variant="outline" className={styles[status] || ""}>{orderStatusLabel(status)}</Badge>
}

const requestStatuses = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "ORDERED", "CANCELLED"]
const orderStatuses = ["OPEN", "SENT_TO_SUPPLIER", "PARTIALLY_RECEIVED", "RECEIVED", "LINKED_TO_INVOICE", "CLOSED", "CANCELLED"]

function requestStatusLabel(status: string) {
  return ({
    DRAFT: "Rascunho",
    SUBMITTED: "Enviada",
    APPROVED: "Aprovada",
    REJECTED: "Reprovada",
    ORDERED: "Pedido gerado",
    CANCELLED: "Cancelada",
  } as Record<string, string>)[status] || status
}

function orderStatusLabel(status: string) {
  return ({
    OPEN: "Aberto",
    SENT_TO_SUPPLIER: "Enviado",
    PARTIALLY_RECEIVED: "Parcial",
    RECEIVED: "Recebido",
    LINKED_TO_INVOICE: "Vinculado à NF",
    CLOSED: "Encerrado",
    CANCELLED: "Cancelado",
  } as Record<string, string>)[status] || status
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T00:00:00`))
}

function formatQuantity(value?: number | string) {
  return Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })
}
