import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laptop, Package, PlusCircle, UserPlus, Info, Edit2 } from "lucide-react"
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
  // --- ESTADOS: ATIVOS DE TI ---
  const [itAssets, setItAssets] = useState<any[]>([])
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)

  // Estado para o campo de texto livre
  const [details, setDetails] = useState("")

  // Estado para controlar o modal de Detalhes
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  
  // NOVOS ESTADOS PARA A EDIÇÃO:
  const [isEditingAsset, setIsEditingAsset] = useState(false)
  const [editAssetData, setEditAssetData] = useState<any>({})
  
  // Campos do formulário (ITAssetDTO)
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [assetTag, setAssetTag] = useState("")

  // --- NOVOS ESTADOS: ATRIBUIÇÃO DE EQUIPAMENTOS ---
  const [users, setUsers] = useState<any[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState("")

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
      <Tabs defaultValue="it-assets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[500px] mb-4">
          <TabsTrigger value="it-assets" className="gap-2">
            <Laptop className="h-4 w-4" /> Ativos de TI
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Package className="h-4 w-4" /> Estoque Administrativo
          </TabsTrigger>
        </TabsList>
        
        {/* CONTEÚDO: ATIVOS DE TI */}
        <TabsContent value="it-assets" className="mt-4 space-y-4">
          
          {/* Cabeçalho da Aba com Botão de Novo */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-zinc-900">Equipamentos e Hardware</h3>
            
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
                {itAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      Nenhum equipamento cadastrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  itAssets.map((asset) => (
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
        
        {/* CONTEÚDO: ESTOQUE */}
        <TabsContent value="stock" className="mt-2">
          <div className="rounded-md border bg-white p-12 text-center shadow-sm">
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Estoque Administrativo</h3>
            <p className="text-sm text-zinc-500">
              A tabela de materiais consumíveis (Entradas e Saídas) será renderizada aqui.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}