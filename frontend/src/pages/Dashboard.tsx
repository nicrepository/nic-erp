import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Ticket, Package, Laptop, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export function Dashboard() {
  const { user } = useAuth()

  const [tickets, setTickets] = useState<any[]>([])
  const [itAssets, setItAssets] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])

  const isAdmin = user?.roles?.includes('ROLE_ADMIN')
  const isTI = user?.roles?.includes('ROLE_TI')
  const isRH = user?.roles?.includes('ROLE_RH')

  useEffect(() => {
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

  // --- MATEMÁTICA E PREPARAÇÃO DOS DADOS ---
  
  // 1. Dados para o Gráfico de Chamados
  const pendingTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length
  
  const ticketChartData = [
    { name: 'Abertos', total: tickets.filter(t => t.status === 'OPEN').length, fill: '#ef4444' }, // red
    { name: 'Em Andamento', total: tickets.filter(t => t.status === 'IN_PROGRESS').length, fill: '#eab308' }, // yellow
    { name: 'Resolvidos', total: tickets.filter(t => t.status === 'RESOLVED').length, fill: '#22c55e' }, // green
    { name: 'Fechados', total: tickets.filter(t => t.status === 'CLOSED').length, fill: '#71717a' }, // zinc
  ]

  // 2. Dados para o Gráfico de Equipamentos
  const totalAssets = itAssets.length
  const inUseAssets = itAssets.filter(a => a.assignedTo !== null).length
  const availableAssets = totalAssets - inUseAssets

  const assetChartData = [
    { name: 'Em Uso', value: inUseAssets, color: '#3b82f6' }, // blue
    { name: 'Disponíveis', value: availableAssets, color: '#22c55e' } // green
  ]

  // 3. Dados para a Lista de Alerta de Estoque
  const lowStockItems = stockItems.filter(item => (item.quantity || 0) <= item.minimumStock)
  const lowStockCount = lowStockItems.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo(a) ao sistema. Aqui está o seu resumo operacional.
        </p>
      </div>

      {/* --- LINHA 1: CARTÕES DE MÉTRICAS RÁPIDAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chamados Pendentes</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pendingTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingTickets > 0 ? "Requerem atenção na fila" : "Fila zerada! Bom trabalho."}
            </p>
          </CardContent>
        </Card>

        {(isAdmin || isTI) && (
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Parque de Equipamentos</CardTitle>
              <Laptop className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ativos de TI registrados no sistema
              </p>
            </CardContent>
          </Card>
        )}

        {(isAdmin || isRH) && (
          <Card className={`bg-card shadow-sm ${lowStockCount > 0 ? "border-red-500/50" : "border-border"}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status do Estoque</CardTitle>
              {lowStockCount > 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-600 dark:text-red-500" : "text-foreground"}`}>
                {lowStockCount === 0 ? "OK" : lowStockCount}
              </div>
              <p className={`text-xs mt-1 ${lowStockCount > 0 ? "text-red-600/80 dark:text-red-400/80 font-medium" : "text-muted-foreground"}`}>
                {lowStockCount === 0 ? "Estoque adequado" : "Item(ns) requerem reposição"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* --- LINHA 2: GRÁFICOS E ALERTAS REAIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO 1: FUNIL DE CHAMADOS */}
        <Card className="bg-card border-border shadow-sm col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Status dos Chamados</CardTitle>
            <CardDescription>Distribuição de todos os chamados sob sua visão.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {ticketChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* COLUNA DA DIREITA: GRÁFICO DE PIZZA OU ALERTAS */}
        <div className="space-y-6 flex flex-col">
          
          {/* GRÁFICO 2: DONUT DE EQUIPAMENTOS */}
          {(isAdmin || isTI) && (
            <Card className="bg-card border-border shadow-sm flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground">Disponibilidade de Hardware</CardTitle>
              </CardHeader>
              <CardContent className="h-[180px]">
                {totalAssets === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Nenhum equipamento</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {assetChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Legenda Customizada */}
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-muted-foreground">Em Uso ({inUseAssets})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-muted-foreground">Disponível ({availableAssets})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LISTA DE AÇÃO: ITENS ACABANDO */}
          {(isAdmin || isRH) && (
            <Card className={`bg-card shadow-sm flex-1 ${lowStockCount > 0 ? "border-red-500/30" : "border-border"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  Itens para Reposição
                  {lowStockCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{lowStockCount}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockCount === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 italic">
                    Tudo certo no estoque administrativo.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">Estoque mínimo: {item.minimumStock}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-500">{item.quantity || 0}</span>
                          <ArrowRight className="h-3 w-3 text-red-500/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}