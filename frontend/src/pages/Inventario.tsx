import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laptop, Package, PlusCircle, UserPlus, Info, Edit2, AlertTriangle, Settings, Search } from "lucide-react"
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
  const { user } = useAuth() // Pega o usuário logado

  // Verifica os cargos do usuário logado
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')
  const isTI = user?.roles?.includes('ROLE_TI')
  const isRH = user?.roles?.includes('ROLE_RH')

  // --- ESTADOS: ATIVOS DE TI ---
  const [itAssets, setItAssets] = useState<any[]>([])
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)

  // Estado para o campo de texto livre
  const [details, setDetails] = useState("")

  // Estado para controlar o modal de Detalhes
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // ESTADOS PARA A EDIÇÃO:
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [editAssetData, setEditAssetData] = useState<any>({})
  
  // Campos do formulário (ITAssetDTO)
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [assetTag, setAssetTag] = useState("")

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
  
  // Campos do formulário (StockItemDTO)
  const [itemName, setItemName] = useState("")
  const [itemCategory, setItemCategory] = useState("")
  const [itemMinStock, setItemMinStock] = useState<number | "">("")

  // --- NOVOS ESTADOS: FILTROS DE BUSCA ---
  const [searchItAsset, setSearchItAsset] = useState("")
  const [searchStockItem, setSearchStockItem] = useState("")

  // Busca a lista de equipamentos cadastrados
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

  // Dispara a busca assim que a tela abre
  useEffect(() => {
    fetchITAssets()
    fetchUsers()
  }, [])

  // Salva um novo equipamento no banco
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
        body: JSON.stringify({ brand, model, serialNumber, assetTag, details }) // <-- 'details' adicionado aqui!
      })

      if (response.ok) {
        setBrand("")
        setModel("")
        setSerialNumber("")
        setAssetTag("")
        setDetails("") // Limpa o campo
        setIsAssetModalOpen(false)
        fetchITAssets()
      } else {
        alert("Erro ao cadastrar equipamento.")
      }
    } catch (error) {
      console.error("Erro:", error)
    }
  }

  // FUNÇÃO: Desvincular equipamento
  const handleUnassignAsset = async () => {
    if (!selectedAsset) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/inventory/it/assets/${selectedAsset.id}/unassign`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setIsDetailModalOpen(false) // Fecha o modal de detalhes
        fetchITAssets() // Atualiza a tabela imediatamente
      } else {
        alert("Erro ao desvincular equipamento.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Função que envia a atribuição para o back-end
  const handleAssignAsset = async () => {
    if (!selectedAsset || !selectedUserId) return

    try {
      const token = localStorage.getItem("token")
      // Usa a rota PUT do seu InventoryController
      const response = await fetch(`/inventory/it/assets/${selectedAsset.id}/assign?userId=${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setIsAssignModalOpen(false)
        setSelectedUserId("")
        fetchITAssets() // Atualiza a tabela para mostrar o badge "Em Uso"
      } else {
        alert("Erro ao atribuir equipamento.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Procura o nome do usuário na lista usando o ID
  const getAssignedUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : "Usuário Desconhecido"
  }

  // Função que envia as alterações para o back-end
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
        setSelectedAsset(updatedAsset) // Atualiza o modal com os dados novos
        setIsEditingAsset(false) // Sai do modo de edição
        fetchITAssets() // Atualiza a tabela lá atrás
      } else {
        alert("Erro ao atualizar o equipamento.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Busca a lista de itens de estoque
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

  // ATUALIZE O SEU USEEFFECT! Adicione a chamada do estoque nele:
  useEffect(() => {
    fetchITAssets()
    fetchUsers()
    fetchStockItems() // <-- Adicione esta linha!
  }, [])

  // Salva um novo item de estoque no banco
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
        fetchStockItems() // Atualiza a tabela
      } else {
        alert("Erro ao cadastrar item de estoque.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Função para salvar edições (Nome, Categoria, Estoque Mínimo)
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
        fetchStockItems() // Atualiza a tabela no fundo
        setIsManageStockModalOpen(false) // Opcional: fechar o modal após editar
      } else {
        alert("Erro ao atualizar o material.")
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // Função central para Entrada e Saída de Estoque
  const handleStockMovement = async (type: 'add' | 'remove') => {
    if (!movementQuantity || Number(movementQuantity) <= 0) {
      alert("Digite uma quantidade válida maior que zero.")
      return
    }

    try {
      const token = localStorage.getItem("token")
      // Usa a rota POST que você criou no InventoryController passando a 'quantity'
      const response = await fetch(`/inventory/administrative/items/${selectedStockItem.id}/${type}?quantity=${movementQuantity}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setMovementQuantity("") // Limpa o campo numérico
        fetchStockItems() // Atualiza a tabela
        setIsManageStockModalOpen(false) // Fecha o modal
      } else {
        const errorMsg = await response.text()
        alert(`Erro: ${errorMsg}`) // Exibe o erro do seu back-end (ex: Estoque insuficiente)
      }
    } catch (error) {
      console.error("Erro de conexão:", error)
    }
  }

  // --- LÓGICA DE FILTRAGEM (Executa em tempo real) ---
  
  // Filtra Ativos de TI (Busca por Patrimônio, Serial, Marca, Modelo ou Nome do Responsável)
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

  // Filtra Estoque Administrativo
  const filteredStockItems = stockItems.filter(item => {
    const searchTerm = searchStockItem.toLowerCase()
    return (
      (item.name || "").toLowerCase().includes(searchTerm) ||
      (item.category || "").toLowerCase().includes(searchTerm)
    )
  })

  // Se não for nenhum dos 3, mostra tela de acesso negado
  if (!isAdmin && !isTI && !isRH) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-zinc-900">Acesso Negado</h2>
        <p className="text-zinc-500">Você não tem permissão para acessar o módulo de Inventário.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Inventário</h1>
          <p className="text-sm text-zinc-500">
            Gestão do parque de equipamentos de TI e controle de materiais de consumo.
          </p>
        </div>
      </div>

      {/* Estrutura de Abas */}
      <Tabs defaultValue={(isAdmin || isTI) ? "it-assets" : "stock"} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[500px] mb-4">
          
          {/* Só renderiza o botão de TI se for TI ou ADMIN */}
          {(isAdmin || isTI) && (
            <TabsTrigger value="it-assets" className="gap-2">
              <Laptop className="h-4 w-4" /> Ativos de TI
            </TabsTrigger>
          )}

          {/* Só renderiza o botão de Estoque se for RH ou ADMIN */}
          {(isAdmin || isRH) && (
            <TabsTrigger value="stock" className="gap-2">
              <Package className="h-4 w-4" /> Estoque Administrativo
            </TabsTrigger>
          )}

        </TabsList>
        
        {(isAdmin || isTI) && (
          <TabsContent value="it-assets" className="mt-4 space-y-4">
            {/* Cabeçalho da Aba de TI com Busca e Botão Novo */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-zinc-900">Equipamentos e Hardware</h3>
              
              <div className="flex items-center gap-3">
                {/* BARRA DE BUSCA DE TI */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Buscar patrimônio, usuário..."
                    className="pl-8 w-[280px]"
                    value={searchItAsset}
                    onChange={(e) => setSearchItAsset(e.target.value)}
                  />
                </div>

                <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
                      <PlusCircle className="h-4 w-4" /> Cadastrar Equipamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Novo Ativo de TI</DialogTitle>
                      <DialogDescription>Insira os dados do equipamento para controle de patrimônio.</DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreateAsset}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
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
                            placeholder="Ex: Processador i5, 16GB RAM, SSD 512GB, com capa protetora..." 
                            className="min-h-[80px]"
                            value={details} 
                            onChange={(e) => setDetails(e.target.value)} 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAssetModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Equipamento</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tabela de Listagem */}
            <div className="rounded-md border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patrimônio</TableHead>
                    <TableHead>Marca / Modelo</TableHead>
                    <TableHead>Número de Série</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                        Nenhum equipamento cadastrado ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium text-zinc-900">{asset.assetTag}</TableCell>
                        <TableCell className="text-zinc-700">{asset.brand} - {asset.model}</TableCell>
                        <TableCell className="text-zinc-600">{asset.serialNumber}</TableCell>
                        <TableCell>
                          {asset.assignedTo ? (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">Em Uso</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Disponível</Badge>
                          )}
                        </TableCell>
                        
                        {/* Célula 2: Apenas o Nome do Responsável */}
                        <TableCell className="text-zinc-700 font-medium">
                          {asset.assignedTo ? (
                            getAssignedUserName(asset.assignedTo)
                          ) : (
                            <span className="text-zinc-400">-</span> /* Um tracinho elegante quando não tem ninguém */
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-500 hover:text-zinc-900"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setEditAssetData(asset) // Clona os dados para o rascunho de edição
                              setIsEditingAsset(false) // Garante que abre no modo Leitura
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

            {/* --- MODAL DE ATRIBUIÇÃO DE USUÁRIO --- */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
              <DialogContent className="sm:max-w-[425px]">
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
                          // Aqui assumimos que seu UserResponseDTO tem 'id' e 'name'
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAssignAsset} disabled={!selectedUserId}>
                    Confirmar Vínculo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* --- MODAL DE DETALHES DO EQUIPAMENTO --- */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
              <DialogContent className="sm:max-w-[550px]">
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
                    {/* ALTERNÂNCIA: MODO EDIÇÃO VS MODO LEITURA */}
                    {isEditingAsset ? (
                      // --- MODO EDIÇÃO ---
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Marca</Label>
                            <Input value={editAssetData.brand} onChange={(e) => setEditAssetData({...editAssetData, brand: e.target.value})} />
                          </div>
                          <div className="grid gap-2">
                            <Label>Modelo</Label>
                            <Input value={editAssetData.model} onChange={(e) => setEditAssetData({...editAssetData, model: e.target.value})} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                      // --- MODO LEITURA (O grid que você já tinha) ---
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Patrimônio</h4>
                            <p className="text-sm font-medium text-zinc-900">{selectedAsset.assetTag}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Número de Série</h4>
                            <p className="text-sm font-medium text-zinc-900">{selectedAsset.serialNumber}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Marca / Modelo</h4>
                            <p className="text-sm text-zinc-900">{selectedAsset.brand} - {selectedAsset.model}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status Atual</h4>
                            {selectedAsset.assignedTo ? (
                              <p className="text-sm font-medium text-blue-700">Em Uso ({getAssignedUserName(selectedAsset.assignedTo)})</p>
                            ) : (
                              <p className="text-sm font-medium text-green-700">Disponível</p>
                            )}
                          </div>
                        </div>
                        <div className="pt-2">
                          <h4 className="text-sm font-semibold text-zinc-900 mb-2">Especificações de Hardware / Observações</h4>
                          <div className="bg-white p-3 rounded-md border text-sm text-zinc-700 min-h-[80px] whitespace-pre-wrap">
                            {selectedAsset.details || "Nenhuma especificação cadastrada para este equipamento."}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RODAPÉ DO MODAL DINÂMICO */}
                <DialogFooter className="flex w-full sm:justify-between items-center mt-2">
                  {isEditingAsset ? (
                    // Botões do Modo Edição
                    <div className="flex justify-end gap-2 w-full">
                      <Button variant="outline" onClick={() => setIsEditingAsset(false)}>Cancelar</Button>
                      <Button onClick={handleUpdateAsset}>Salvar Alterações</Button>
                    </div>
                  ) : (
                    // Botões do Modo Leitura
                    <>
                      <div className="flex gap-2">
                        {!selectedAsset?.assignedTo ? (
                          <Button className="gap-2" onClick={() => {
                            setIsDetailModalOpen(false)
                            setIsAssignModalOpen(true)
                          }}>
                            <UserPlus className="h-4 w-4" /> Atribuir a Usuário
                          </Button>
                        ) : (
                          <Button variant="destructive" onClick={handleUnassignAsset}>
                            Desvincular Responsável
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => setIsEditingAsset(true)}>
                          <Edit2 className="h-4 w-4" /> Editar
                        </Button>
                        <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Fechar</Button>
                      </div>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        
        {/* CONTEÚDO: ESTOQUE */}
        {(isAdmin || isRH) && (
          <TabsContent value="stock" className="mt-4 space-y-4">
            
            {/* Cabeçalho da Aba de Estoque com Busca e Botão Novo */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-zinc-900">Materiais de Consumo</h3>
              
              <div className="flex items-center gap-3">
                {/* BARRA DE BUSCA DO ESTOQUE */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="text"
                    placeholder="Buscar material ou categoria..."
                    className="pl-8 w-[280px]"
                    value={searchStockItem}
                    onChange={(e) => setSearchStockItem(e.target.value)}
                  />
                </div>

                <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
                      <PlusCircle className="h-4 w-4" /> Novo Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="itemCategory">Categoria</Label>
                            <Input id="itemCategory" placeholder="Ex: Impressão, Cabeamento" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="itemMinStock">Estoque Mínimo</Label>
                            <Input id="itemMinStock" type="number" min="0" placeholder="Ex: 5" value={itemMinStock} onChange={(e) => setItemMinStock(Number(e.target.value))} required />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsStockModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Item</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tabela de Estoque */}
            <div className="rounded-md border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Qtd. Atual</TableHead>
                    <TableHead className="text-center">Estoque Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Movimentação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                        Nenhum material cadastrado no estoque.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStockItems.map((item) => {
                      // Lógica para saber se o estoque está baixo
                      const isLowStock = (item.quantity || 0) <= item.minimumStock;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-zinc-900">{item.name}</TableCell>
                          <TableCell className="text-zinc-600">{item.category}</TableCell>
                          <TableCell className="text-center font-semibold text-zinc-900">{item.quantity || 0}</TableCell>
                          <TableCell className="text-center text-zinc-500">{item.minimumStock}</TableCell>
                          <TableCell>
                            {isLowStock ? (
                              <Badge variant="destructive" className="gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                                <AlertTriangle className="h-3 w-3" /> Estoque Baixo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Adequado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-zinc-500 hover:text-zinc-900"
                              onClick={() => {
                                setSelectedStockItem(item)
                                setEditStockData(item) // Carrega os dados para o rascunho
                                setMovementQuantity("") // Zera o campo de movimentação
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
            {/* --- MODAL DE GERENCIAMENTO DE ESTOQUE --- */}
            <Dialog open={isManageStockModalOpen} onOpenChange={setIsManageStockModalOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Gerenciar Material</DialogTitle>
                  <DialogDescription>
                    Edite os dados do item ou registre entradas e saídas no estoque.
                  </DialogDescription>
                </DialogHeader>

                {selectedStockItem && (
                  <div className="space-y-6 py-4">
                    
                    {/* SESSÃO 1: EDIÇÃO DE DADOS */}
                    <div className="space-y-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                      <h4 className="text-sm font-semibold text-zinc-900">Dados Básicos</h4>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Nome do Item</Label>
                          <Input value={editStockData.name} onChange={(e) => setEditStockData({...editStockData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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

                    {/* SESSÃO 2: MOVIMENTAÇÃO DE ESTOQUE */}
                    <div className="space-y-4 p-4 rounded-lg border border-zinc-200">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-zinc-900">Movimentação de Estoque</h4>
                        <div className="text-sm text-zinc-500">
                          Qtd. Atual: <span className="font-bold text-zinc-900">{selectedStockItem.quantity || 0}</span>
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
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button 
                          variant="outline" 
                          className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleStockMovement('remove')}
                        >
                          Registrar Saída (-)
                        </Button>
                        <Button 
                          variant="outline"
                          className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
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
      </Tabs>
    </div>
  )
}