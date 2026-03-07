import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Ticket, Package, Settings, LogOut, Bell, Monitor } from "lucide-react"


export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-50">
      
      {/* 1. BARRA LATERAL (Fixa) */}
      <aside className="w-64 flex-col border-r bg-white px-4 py-6 flex hidden md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Monitor className="h-6 w-6 text-zinc-900" />
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Nic-ERP</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Button 
            variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} 
            className={`w-full justify-start gap-3 ${location.pathname === '/dashboard' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" /> Visão Geral
          </Button>

          <Button 
            variant={location.pathname === '/helpdesk' ? 'secondary' : 'ghost'} 
            className={`w-full justify-start gap-3 ${location.pathname === '/helpdesk' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
            onClick={() => navigate('/helpdesk')}
          >
            <Ticket className="h-4 w-4" /> Helpdesk
          </Button>

          <Button 
            variant={location.pathname === '/inventario' ? 'secondary' : 'ghost'} 
            className={`w-full justify-start gap-3 ${location.pathname === '/inventario' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
            onClick={() => navigate('/inventario')}
          >
            <Package className="h-4 w-4" /> Inventário
          </Button>
        </nav>

        <div className="mt-auto border-t pt-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 text-zinc-500 hover:text-zinc-900">
            <Settings className="h-4 w-4" /> Configurações
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col">
        
        {/* Cabeçalho (Fixo) */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8">
          {/* No futuro podemos deixar esse título dinâmico */}
          <h2 className="text-lg font-medium text-zinc-800">Painel</h2>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-zinc-500">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-sm font-medium text-zinc-50 cursor-pointer">
              CA
            </div>
          </div>
        </header>

        {/* 3. CONTEÚDO DINÂMICO (Onde a mágica acontece) */}
        <div className="p-8">
          {/* O Outlet é o buraco onde as páginas (Dashboard, Helpdesk, etc) vão ser injetadas! */}
          <Outlet /> 
        </div>
      </main>

    </div>
  )
}