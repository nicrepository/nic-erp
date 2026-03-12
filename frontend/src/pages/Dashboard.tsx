import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, Package, Laptop, AlertTriangle, CheckCircle2 } from "lucide-react"

export function Dashboard() {
  const { user } = useAuth()

  // Estados para armazenar os dados reais
  const [tickets, setTickets] = useState<any[]>([])
  const [itAssets, setItAssets] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])

  // Verifica permissões
  const isAdmin = user?.roles?.includes('ROLE_ADMIN')
  const isTI = user?.roles?.includes('ROLE_TI')
  const isRH = user?.roles?.includes('ROLE_RH')

  useEffect(() => {
    // 1. Busca Chamados (Lógica inteligente baseada no cargo)
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token")
        let endpoint = '/helpdesk/tickets/my'
        
        if (isAdmin) endpoint = '/helpdesk/tickets'
        else if (isTI) endpoint = '/helpdesk/tickets/department/IT'
        else if (isRH) endpoint = '/helpdesk/tickets/department/HR'

        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setTickets(data.content || [])
        }
      } catch (error) {
        console.error("Erro ao buscar chamados no dashboard:", error)
      }
    }

    // 2. Busca Ativos de TI (Apenas se tiver permissão)
    const fetchITAssets = async () => {
      if (!isAdmin && !isTI) return
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
        console.error("Erro ao buscar ativos:", error)
      }
    }

    // 3. Busca Estoque (Apenas se tiver permissão)
    const fetchStockItems = async () => {
      if (!isAdmin && !isRH) return
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

    fetchTickets()
    fetchITAssets()
    fetchStockItems()
  }, [isAdmin, isTI, isRH])

  // --- MATEMÁTICA DO DASHBOARD ---
  
  // Chamados Pendentes (Abertos ou Em Andamento)
  const pendingTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
  
  // Equipamentos (Em uso vs Disponíveis)
  const totalAssets = itAssets.length
  const inUseAssets = itAssets.filter(a => a.assignedTo !== null).length
  const availableAssets = totalAssets - inUseAssets

  // Estoque (Alertas de nível baixo)
  const lowStockCount = stockItems.filter(item => (item.quantity || 0) <= item.minimumStock).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Visão Geral</h1>
        <p className="text-sm text-zinc-500">
          Bem-vindo(a) ao sistema. Aqui está o seu resumo operacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: CHAMADOS (Visível para todos, mas os números mudam por cargo) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Chamados Pendentes</CardTitle>
            <Ticket className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{pendingTickets}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {pendingTickets > 0 ? "Requerem atenção" : "Fila zerada!"}
            </p>
          </CardContent>
        </Card>

        {/* CARD 2: ATIVOS DE TI (Visível apenas para ADMIN ou TI) */}
        {(isAdmin || isTI) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Parque de Equipamentos</CardTitle>
              <Laptop className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{totalAssets}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {inUseAssets} em uso
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {availableAssets} disponíveis
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CARD 3: ESTOQUE (Visível apenas para ADMIN ou RH) */}
        {(isAdmin || isRH) && (
          <Card className={lowStockCount > 0 ? "border-red-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">Alertas de Estoque</CardTitle>
              {lowStockCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-zinc-900"}`}>
                {lowStockCount}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {lowStockCount === 1 ? "Item abaixo do mínimo" : 
                 lowStockCount > 1 ? "Itens abaixo do mínimo" : 
                 "Estoque adequado"}
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}