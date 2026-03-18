import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laptop, Package, PlusCircle, UserPlus, Info, Edit2, AlertTriangle, Settings, Search, History, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function Inventario() {
  const { user } = useAuth() 

  const isAdmin = user?.roles?.includes('ROLE_ADMIN')
  const isTI = user?.roles?.includes('ROLE_TI')
  const isRH = user?.roles?.includes('ROLE_RH')

  // --- ESTADOS: ATIVOS DE TI ---
  const [itAssets, setItAssets] = useState<any[]>([])
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [details, setDetails] = useState("")
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [editAssetData, setEditAssetData] = useState<any>({})
  
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [assetTag, setAssetTag] = useState("")

  // --- ESTADOS: BAIXA DE ATIVO ---
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false)
  const [writeOffConfirmText, setWriteOffConfirmText] = useState("")
  const [writeOffReason, setWriteOffReason] = useState("")

  // --- ESTADOS: ATRIBUIÇÃO DE EQUIPAMENTOS ---
  const [users, setUsers] = useState<any[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState("")

  // --- ESTADOS: ESTOQUE ADMINISTRATIVO ---
  const [stockItems, setStockItems] = useState<any[]>([])
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isManageStockModalOpen, setIsManageStockModalOpen] = useState(false)
  const [selectedStockItem, setSelectedStockItem] = useState<any>(null)
  const [editStockData, setEditStockData] = useState<any>({})
  const [movementQuantity, setMovementQuantity] = useState<number | "">("")
  
  const [itemName, setItemName] = useState("")
  const [itemCategory, setItemCategory] = useState("")
  const [itemMinStock, setItemMinStock] = useState<number | "">("")

  // ESTADOS: FILTROS DE BUSCA ---
  const [searchItAsset, setSearchItAsset] = useState("")
  const [searchStockItem, setSearchStockItem] = useState("")

  // ESTADO: AUDITORIA ---
  const [movements, setMovements] = useState<any[]>([])
  const [searchMovement, setSearchMovement] = useState("")
  
  // ESTADO DO HISTÓRICO DO EQUIPAMENTO ---
  const [assetHistory, setAssetHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // BUSCA O HISTÓRICO QUANDO O MODAL ABRE ---
  useEffect(() => {
    if (isDetailModalOpen && selectedAsset) {
      const fetchAssetHistory = async () => {
        setIsLoadingHistory(true)
        try {
          const token = localStorage.getItem("token")
          const response = await fetch(`/inventory/it/assets/${selectedAsset.id}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setAssetHistory(data)
          }
        } catch (error) {
          console.error("Erro ao buscar histórico do ativo:", error)
        } finally {
          setIsLoadingHistory(false)
        }
      }
      
      fetchAssetHistory()
    } else {
      setAssetHistory([])
    }
  }, [isDetailModalOpen, selectedAsset])

  const fetchITAssets = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/inventory/it/assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setItAssets(data)
      }
    } catch (error) {
      console.error("Erro ao buscar ativos de TI:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  useEffect(() => {
    fetchITAssets()
    fetchUsers()
  }, [])

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/inventory/it/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ brand, model, serialNumber, assetTag, details })
      })

      if (response.ok) {
        setBrand("")
        setModel("")
        setSerialNumber("")
        setAssetTag("")
        setDetails("") 
        setIsAssetModalOpen(false)
        fetchITAssets()
      } else {
        alert("Erro ao cadastrar equipamento.")
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  const handleUnassignAsset = async () => {
    if (!selectedAsset) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/it/assets/${selectedAsset.id}/unassign`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setIsDetailModalOpen(false) 
        fetchITAssets() 
      } else {
        alert("Erro ao desvincular equipamento.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleAssignAsset = async () => {
    if (!selectedAsset || !selectedUserId) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/it/assets/${selectedAsset.id}/assign?userId=${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setIsAssignModalOpen(false)
        setSelectedUserId("")
        fetchITAssets() 
      } else {
        alert("Erro ao atribuir equipamento.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleWriteOffAsset = async () => {
    if (!writeOffReason.trim()) {
      alert("É obrigatório informar o motivo da baixa.");
      return;
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/it/assets/${selectedAsset.id}/write-off`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ reason: writeOffReason })
      })

      if (response.ok) {
        setIsWriteOffModalOpen(false)
        setIsDetailModalOpen(false) 
        setWriteOffConfirmText("")
        setWriteOffReason("")
        fetchITAssets() 
      } else {
        const errorMsg = await response.text()
        alert(`Erro ao dar baixa: ${errorMsg}`)
      }
    } catch (error) { console.error("Erro de conexão:", error) }
  }

  const getAssignedUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : "Usuário Desconhecido"
  }

  const handleUpdateAsset = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/it/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brand: editAssetData.brand,
          model: editAssetData.model,
          serialNumber: editAssetData.serialNumber,
          assetTag: editAssetData.assetTag,
          details: editAssetData.details
        })
      })

      if (response.ok) {
        const updatedAsset = await response.json()
        setSelectedAsset(updatedAsset) 
        setIsEditingAsset(false) 
        fetchITAssets() 
      } else {
        alert("Erro ao atualizar o equipamento.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const fetchStockItems = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/inventory/administrative/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStockItems(data)
      }
    } catch (error) {
      console.error("Erro ao buscar estoque:", error)
    }
  }

  const fetchMovements = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/inventory/administrative/movements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const sortedData = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setMovements(sortedData)
      }
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error)
    }
  }

  useEffect(() => {
    fetchITAssets()
    fetchUsers()
    fetchStockItems()
    fetchMovements()
  }, [])

  const handleCreateStockItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/inventory/administrative/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: itemName, 
          category: itemCategory, 
          minimumStock: Number(itemMinStock) 
        })
      })

      if (response.ok) {
        setItemName("")
        setItemCategory("")
        setItemMinStock("")
        setIsStockModalOpen(false)
        fetchStockItems() 
      } else {
        alert("Erro ao cadastrar item de estoque.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleUpdateStockItem = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/administrative/items/${selectedStockItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editStockData.name,
          category: editStockData.category,
          minimumStock: Number(editStockData.minimumStock)
        })
      })

      if (response.ok) {
        fetchStockItems() 
        setIsManageStockModalOpen(false) 
      } else {
        alert("Erro ao atualizar o material.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const handleStockMovement = async (type: 'add' | 'remove') => {
    if (!movementQuantity || Number(movementQuantity) <= 0) {
      alert("Digite uma quantidade válida maior que zero.")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/administrative/items/${selectedStockItem.id}/${type}?quantity=${movementQuantity}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setMovementQuantity("") 
        fetchStockItems() 
        setIsManageStockModalOpen(false) 
      } else {
        const errorMsg = await response.text()
        alert(`Erro: ${errorMsg}`) 
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  const filteredItAssets = itAssets.filter(asset => {
    const searchTerm = searchItAsset.toLowerCase()
    const assignedUser = asset.assignedTo ? getAssignedUserName(asset.assignedTo).toLowerCase() : ""
    
    return (
      (asset.assetTag || "").toLowerCase().includes(searchTerm) ||
      (asset.serialNumber || "").toLowerCase().includes(searchTerm) ||
      (asset.brand || "").toLowerCase().includes(searchTerm) ||
      (asset.model || "").toLowerCase().includes(searchTerm) ||
      assignedUser.includes(searchTerm)
    )
  })

  const filteredStockItems = stockItems.filter(item => {
    const searchTerm = searchStockItem.toLowerCase()
    return (
      (item.name || "").toLowerCase().includes(searchTerm) ||
      (item.category || "").toLowerCase().includes(searchTerm)
    )
  })

  if (!isAdmin && !isTI && !isRH) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-foreground">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar o módulo de Inventário.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventário</h1>
          <p className="text-sm text-muted-foreground">
            Gestão do parque de equipamentos de TI e controle de materiais de consumo.
          </p>
        </div>
      </div>

      <Tabs defaultValue={(isAdmin || isTI) ? "it-assets" : "stock"} className="w-full">
        {/* Abas responsivas: empilham em telas pequenas */}
        <TabsList className="flex flex-col sm:grid w-full sm:grid-cols-3 max-w-[700px] mb-4 h-auto gap-1 sm:gap-0">
          
          {(isAdmin || isTI) && (
            <TabsTrigger value="it-assets" className="gap-2 w-full">
              <Laptop className="h-4 w-4" /> Ativos de TI
            </TabsTrigger>
          )}

          {(isAdmin || isRH) && (
            <TabsTrigger value="stock" className="gap-2 w-full">
              <Package className="h-4 w-4" /> Estoque Administrativo
            </TabsTrigger>
          )}

          {(isAdmin || isRH) && (
            <TabsTrigger value="audit" className="gap-2 w-full">
              <History className="h-4 w-4" /> Histórico
            </TabsTrigger>
          )}

        </TabsList>
        
        {/* ========================================================= */}
        {/* ABA: ATIVOS DE TI */}
        {/* ========================================================= */}
        {(isAdmin || isTI) && (
          <TabsContent value="it-assets" className="mt-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-foreground">Equipamentos e Hardware</h3>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar patrimônio, usuário..."
                    className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground"
                    value={searchItAsset}
                    onChange={(e) => setSearchItAsset(e.target.value)}
                  />
                </div>

                <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <PlusCircle className="h-4 w-4" /> Cadastrar Equipamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>Novo Ativo de TI</DialogTitle>
                      <DialogDescription>Insira os dados do equipamento para controle de patrimônio.</DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreateAsset}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="brand">Marca</Label>
                            <Input id="brand" placeholder="Ex: Dell, Ubiquiti" value={brand} onChange={(e) => setBrand(e.target.value)} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="model">Modelo</Label>
                            <Input id="model" placeholder="Ex: Latitude 5420" value={model} onChange={(e) => setModel(e.target.value)} required />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="serialNumber">Número de Série (S/N)</Label>
                          <Input id="serialNumber" placeholder="Ex: 5CD23498XX" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="assetTag">Etiqueta de Patrimônio</Label>
                          <Input id="assetTag" placeholder="Ex: TLP-001" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="details">Especificações / Observações</Label>
                          <Textarea 
                            id="details" 
                            placeholder="Ex: Processador i5, 16GB RAM, SSD 512GB..." 
                            className="min-h-[80px]"
                            value={details} 
                            onChange={(e) => setDetails(e.target.value)} 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" className="w-full sm:w-auto mb-2 sm:mb-0" onClick={() => setIsAssetModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="w-full sm:w-auto">Salvar Equipamento</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm w-full">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 border-border">
                      <TableHead className="text-muted-foreground min-w-[120px]">Patrimônio</TableHead>
                      <TableHead className="text-muted-foreground min-w-[180px]">Marca / Modelo</TableHead>
                      <TableHead className="text-muted-foreground min-w-[150px]">Número de Série</TableHead>
                      <TableHead className="text-muted-foreground min-w-[120px]">Status</TableHead>
                      <TableHead className="text-muted-foreground min-w-[150px]">Responsável</TableHead>
                      <TableHead className="text-right text-muted-foreground min-w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum equipamento cadastrado ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItAssets.map((asset) => (
                        <TableRow key={asset.id} className="hover:bg-muted/50 border-border">
                          <TableCell className="font-medium text-foreground whitespace-nowrap">{asset.assetTag}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{asset.brand} - {asset.model}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{asset.serialNumber}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {asset.status === 'WRITTEN_OFF' ? (
                              <Badge variant="outline" className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 border-neutral-500/30">Baixado</Badge>
                            ) : asset.assignedTo ? (
                              <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25">Em Uso</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">Disponível</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-muted-foreground font-medium whitespace-nowrap">
                            {asset.assignedTo ? (
                              <span className="text-foreground">{getAssignedUserName(asset.assignedTo)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => {
                                setSelectedAsset(asset)
                                setEditAssetData(asset)
                                setIsEditingAsset(false)
                                setIsDetailModalOpen(true)
                              }}
                            >
                              <Info className="h-4 w-4 mr-2" /> Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
              <DialogContent className="sm:max-w-[425px] w-[95%] bg-background border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Atribuir Equipamento</DialogTitle>
                  <DialogDescription>
                    Vincule o equipamento <strong>{selectedAsset?.assetTag}</strong> a um funcionário.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Selecione o Funcionário</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um usuário..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
                  <Button className="w-full sm:w-auto" onClick={handleAssignAsset} disabled={!selectedUserId}>
                    Confirmar Vínculo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
              <DialogContent className="sm:max-w-[600px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingAsset ? "Editar Equipamento" : "Detalhes do Equipamento"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditingAsset 
                      ? "Altere os dados de patrimônio e as especificações de hardware." 
                      : "Ficha técnica e status atual do ativo de TI."}
                  </DialogDescription>
                </DialogHeader>

                {selectedAsset && (
                  <div className="py-4">
                    {isEditingAsset ? (
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Marca</Label>
                            <Input value={editAssetData.brand} onChange={(e) => setEditAssetData({...editAssetData, brand: e.target.value})} />
                          </div>
                          <div className="grid gap-2">
                            <Label>Modelo</Label>
                            <Input value={editAssetData.model} onChange={(e) => setEditAssetData({...editAssetData, model: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Número de Série</Label>
                            <Input value={editAssetData.serialNumber} onChange={(e) => setEditAssetData({...editAssetData, serialNumber: e.target.value})} />
                          </div>
                          <div className="grid gap-2">
                            <Label>Patrimônio</Label>
                            <Input value={editAssetData.assetTag} onChange={(e) => setEditAssetData({...editAssetData, assetTag: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Especificações / Observações</Label>
                          <Textarea 
                            className="min-h-[80px]"
                            value={editAssetData.details || ""} 
                            onChange={(e) => setEditAssetData({...editAssetData, details: e.target.value})} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/50 p-4 rounded-lg border border-border">
                          <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Patrimônio</h4>
                            <p className="text-sm font-medium text-foreground">{selectedAsset.assetTag}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serial</h4>
                            <p className="text-sm font-medium text-foreground">{selectedAsset.serialNumber}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Marca/Modelo</h4>
                            <p className="text-sm text-foreground">{selectedAsset.brand} - {selectedAsset.model}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</h4>
                            {selectedAsset.status === 'WRITTEN_OFF' ? (
                              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Baixado / Descartado</p>
                            ) : selectedAsset.assignedTo ? (
                              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Em Uso ({getAssignedUserName(selectedAsset.assignedTo)})</p>
                            ) : (
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">Disponível</p>
                            )}
                          </div>
                        </div>
                        <div className="pt-2">
                          <h4 className="text-sm font-semibold text-foreground mb-2">Especificações de Hardware / Observações</h4>
                          <div className="bg-background p-3 rounded-md border border-border text-sm text-muted-foreground min-h-[80px] whitespace-pre-wrap">
                            {selectedAsset.details || "Nenhuma especificação cadastrada para este equipamento."}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border mt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold text-foreground">Histórico do Equipamento</h4>
                          </div>

                          <div className="space-y-4 max-h-[150px] overflow-y-auto pr-2">
                            {isLoadingHistory ? (
                              <p className="text-xs text-center text-muted-foreground py-2">Carregando histórico...</p>
                            ) : assetHistory.length === 0 ? (
                              <p className="text-xs text-center text-muted-foreground italic py-2">Nenhum evento registrado ainda.</p>
                            ) : (
                              assetHistory.map((historyEvent) => {
                                const date = new Date(historyEvent.createdAt)
                                const formattedDate = `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                const performedBy = getAssignedUserName(historyEvent.performedBy)
                                
                                let actionText = ""
                                let actionColor = ""
                                
                                switch(historyEvent.action) {
                                  case 'CREATED':
                                    actionText = "Cadastrado no sistema"
                                    actionColor = "text-emerald-700 dark:text-emerald-400 bg-emerald-500/15"
                                    break;
                                  case 'ASSIGNED':
                                    const assignedTo = getAssignedUserName(historyEvent.assignedToUser)
                                    actionText = `Entregue para: ${assignedTo}`
                                    actionColor = "text-blue-700 dark:text-blue-400 bg-blue-500/15"
                                    break;
                                  case 'UNASSIGNED':
                                    actionText = "Devolvido para a TI"
                                    actionColor = "text-amber-700 dark:text-amber-400 bg-amber-500/15"
                                    break;
                                  case 'UPDATED':
                                    actionText = "Especificações alteradas"
                                    actionColor = "text-foreground bg-muted"
                                    break;
                                  case 'WRITTEN_OFF':
                                    actionText = "Equipamento Baixado"
                                    actionColor = "text-orange-700 dark:text-orange-400 bg-orange-500/15"
                                    break;
                                }

                                return (
                                  <div key={historyEvent.id} className="relative pl-4 border-l-2 border-border pb-2 last:pb-0">
                                    <div className="absolute w-2 h-2 bg-muted-foreground rounded-full -left-[5px] top-1"></div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex justify-between items-start">
                                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${actionColor}`}>
                                          {actionText}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{formattedDate}</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        Por: <span className="font-medium text-foreground">{performedBy}</span>
                                      </span>
                                      {historyEvent.notes && (
                                        <span className="text-xs text-muted-foreground italic mt-1 bg-muted p-1 rounded">
                                          "{historyEvent.notes}"
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row w-full sm:justify-between items-stretch sm:items-center mt-2 gap-2">
                  {isEditingAsset ? (
                    <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
                      <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditingAsset(false)}>Cancelar</Button>
                      <Button className="w-full sm:w-auto" onClick={handleUpdateAsset}>Salvar Alterações</Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {!selectedAsset?.assignedTo && selectedAsset?.status !== 'WRITTEN_OFF' ? (
                          <Button className="gap-2 w-full sm:w-auto" onClick={() => {
                            setIsDetailModalOpen(false)
                            setIsAssignModalOpen(true)
                          }}>
                            <UserPlus className="h-4 w-4" /> Atribuir a Usuário
                          </Button>
                        ) : selectedAsset?.assignedTo ? (
                          <Button variant="destructive" className="w-full sm:w-auto" onClick={handleUnassignAsset}>
                            Desvincular Responsável
                          </Button>
                        ) : null}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-between items-center w-full">
                        <Button 
                          variant="destructive" 
                          className="w-full sm:w-auto bg-neutral-600 hover:bg-neutral-700 disabled:opacity-50"
                          disabled={!!selectedAsset?.assignedTo || selectedAsset?.status === 'WRITTEN_OFF'} 
                          title={selectedAsset?.assignedTo ? "Desvincule o usuário antes de dar baixa" : ""}
                          onClick={() => {
                            setIsWriteOffModalOpen(true)
                            setWriteOffConfirmText("")
                            setWriteOffReason("")
                          }}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" /> Dar Baixa (Descartar)
                        </Button>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          {selectedAsset?.status !== 'WRITTEN_OFF' && (
                            <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => setIsEditingAsset(true)}>
                              <Edit2 className="h-4 w-4" /> Editar
                            </Button>
                          )}
                          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
                        </div>
                      </div>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* MODAL DE BAIXA DE EQUIPAMENTO (Double Opt-in) */}
            <Dialog open={isWriteOffModalOpen} onOpenChange={setIsWriteOffModalOpen}>
              <DialogContent className="sm:max-w-[425px] w-[95%] bg-background border-border text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> Baixa de Equipamento
                  </DialogTitle>
                  <DialogDescription>
                    O equipamento deixará de contar como ativo disponível, mas seu histórico será mantido para auditoria.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="writeOffReason">Motivo da Baixa / Descarte *</Label>
                    <Textarea 
                      id="writeOffReason"
                      placeholder="Ex: Placa mãe queimada sem conserto, doado para instituição..." 
                      value={writeOffReason}
                      onChange={(e) => setWriteOffReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="bg-orange-500/10 p-3 rounded-md border border-orange-500/20 text-sm text-orange-600 dark:text-orange-400 mt-2">
                    Para confirmar a baixa, digite o patrimônio exato: <strong>{selectedAsset?.assetTag}</strong>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirmWriteOff">Confirmar Patrimônio *</Label>
                    <Input 
                      id="confirmWriteOff"
                      value={writeOffConfirmText} 
                      onChange={(e) => setWriteOffConfirmText(e.target.value)} 
                      placeholder={selectedAsset?.assetTag}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsWriteOffModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white" 
                    disabled={writeOffConfirmText !== selectedAsset?.assetTag || writeOffReason.trim() === ""} 
                    onClick={handleWriteOffAsset}
                  >
                    Confirmar Baixa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        
        {/* ========================================================= */}
        {/* ABA: ESTOQUE ADMINISTRATIVO */}
        {/* ========================================================= */}
        {(isAdmin || isRH) && (
          <TabsContent value="stock" className="mt-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-foreground">Materiais de Consumo</h3>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar material..."
                    className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground"
                    value={searchStockItem}
                    onChange={(e) => setSearchStockItem(e.target.value)}
                  />
                </div>

                <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 w-full sm:w-auto">
                      <PlusCircle className="h-4 w-4" /> Novo Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] w-[95%] bg-background border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>Cadastrar Material</DialogTitle>
                      <DialogDescription>Adicione um novo item de consumo para controle de quantidades.</DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreateStockItem}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="itemName">Nome do Item</Label>
                          <Input id="itemName" placeholder="Ex: Toner Brother TN-1060" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="itemCategory">Categoria</Label>
                            <Input id="itemCategory" placeholder="Ex: Impressão" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="itemMinStock">Estoque Mínimo</Label>
                            <Input id="itemMinStock" type="number" min="0" placeholder="Ex: 5" value={itemMinStock} onChange={(e) => setItemMinStock(Number(e.target.value))} required />
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsStockModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="w-full sm:w-auto">Salvar Item</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm w-full">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 border-border">
                      <TableHead className="text-muted-foreground min-w-[200px]">Item</TableHead>
                      <TableHead className="text-muted-foreground min-w-[150px]">Categoria</TableHead>
                      <TableHead className="text-center text-muted-foreground min-w-[100px]">Qtd. Atual</TableHead>
                      <TableHead className="text-center text-muted-foreground min-w-[120px]">Estoque Mínimo</TableHead>
                      <TableHead className="text-muted-foreground min-w-[130px]">Status</TableHead>
                      <TableHead className="text-right text-muted-foreground min-w-[120px]">Movimentação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum material cadastrado no estoque.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStockItems.map((item) => {
                        const isLowStock = (item.quantity || 0) <= item.minimumStock;
                        
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/50 border-border">
                            <TableCell className="font-medium text-foreground whitespace-nowrap">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">{item.category}</TableCell>
                            <TableCell className="text-center font-semibold text-foreground whitespace-nowrap">{item.quantity || 0}</TableCell>
                            <TableCell className="text-center text-muted-foreground whitespace-nowrap">{item.minimumStock}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {isLowStock ? (
                                <Badge variant="destructive" className="gap-1 bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/25">
                                  <AlertTriangle className="h-3 w-3" /> Estoque Baixo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
                                  Adequado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => {
                                  setSelectedStockItem(item)
                                  setEditStockData(item)
                                  setMovementQuantity("")
                                  setIsManageStockModalOpen(true)
                                }}
                              >
                                <Settings className="h-4 w-4 mr-2" /> Gerenciar
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <Dialog open={isManageStockModalOpen} onOpenChange={setIsManageStockModalOpen}>
              <DialogContent className="sm:max-w-[500px] w-[95%] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground">
                <DialogHeader>
                  <DialogTitle>Gerenciar Material</DialogTitle>
                  <DialogDescription>
                    Edite os dados do item ou registre entradas e saídas no estoque.
                  </DialogDescription>
                </DialogHeader>

                {selectedStockItem && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-4 bg-muted/50 p-4 rounded-lg border border-border">
                      <h4 className="text-sm font-semibold text-foreground">Dados Básicos</h4>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Nome do Item</Label>
                          <Input value={editStockData.name} onChange={(e) => setEditStockData({...editStockData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Input value={editStockData.category} onChange={(e) => setEditStockData({...editStockData, category: e.target.value})} />
                          </div>
                          <div className="grid gap-2">
                            <Label>Estoque Mínimo</Label>
                            <Input type="number" min="0" value={editStockData.minimumStock} onChange={(e) => setEditStockData({...editStockData, minimumStock: Number(e.target.value)})} />
                          </div>
                        </div>
                        <Button variant="secondary" className="w-full mt-2" onClick={handleUpdateStockItem}>
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-foreground">Movimentação de Estoque</h4>
                        <div className="text-sm text-muted-foreground">
                          Qtd. Atual: <span className="font-bold text-foreground">{selectedStockItem.quantity || 0}</span>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Quantidade para Movimentar</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Ex: 10" 
                          value={movementQuantity} 
                          onChange={(e) => setMovementQuantity(Number(e.target.value))} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <Button 
                          variant="outline" 
                          className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 w-full"
                          onClick={() => handleStockMovement('remove')}
                        >
                          Registrar Saída (-)
                        </Button>
                        <Button 
                          variant="outline"
                          className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20 w-full"
                          onClick={() => handleStockMovement('add')}
                        >
                          Registrar Entrada (+)
                        </Button>
                      </div>
                    </div>

                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        
        {/* ========================================================= */}
        {/* ABA: AUDITORIA DE MOVIMENTAÇÕES */}
        {/* ========================================================= */}
        {(isAdmin || isRH) && (
          <TabsContent value="audit" className="mt-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-foreground">Trilha de Auditoria</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar material ou usuário..."
                  className="pl-8 w-full md:w-[280px] bg-background border-input text-foreground"
                  value={searchMovement}
                  onChange={(e) => setSearchMovement(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm w-full">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 border-border">
                      <TableHead className="text-muted-foreground min-w-[150px]">Data e Hora</TableHead>
                      <TableHead className="text-muted-foreground min-w-[180px]">Material</TableHead>
                      <TableHead className="text-muted-foreground min-w-[120px]">Tipo de Ação</TableHead>
                      <TableHead className="text-center text-muted-foreground min-w-[100px]">Quantidade</TableHead>
                      <TableHead className="text-muted-foreground min-w-[150px]">Usuário Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma movimentação registrada no sistema ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.filter(mov => {
                        const itemName = stockItems.find(i => i.id === mov.itemId)?.name || ""
                        const userName = getAssignedUserName(mov.performedBy) || ""
                        const search = searchMovement.toLowerCase()
                        return itemName.toLowerCase().includes(search) || userName.toLowerCase().includes(search)
                      }).map((mov) => {
                        
                        const isEntry = mov.type === 'IN'
                        const itemName = stockItems.find(i => i.id === mov.itemId)?.name || "Item Excluído"
                        const userName = getAssignedUserName(mov.performedBy)
                        
                        const formattedDate = mov.createdAt 
                          ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(mov.createdAt))
                          : "Data indisponível"

                        return (
                          <TableRow key={mov.id} className="hover:bg-muted/50 border-border">
                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formattedDate}</TableCell>
                            <TableCell className="font-medium text-foreground whitespace-nowrap">{itemName}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {isEntry ? (
                                <Badge variant="outline" className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
                                  <ArrowDownRight className="h-3 w-3" /> Entrada
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 gap-1">
                                  <ArrowUpRight className="h-3 w-3" /> Saída
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-bold text-foreground whitespace-nowrap">
                              {isEntry ? '+' : '-'}{mov.quantity}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-medium whitespace-nowrap">
                              {userName}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}