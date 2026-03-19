import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, Package, Settings, LogOut, Bell, Sun, Moon, Menu, Ticket, Briefcase } from "lucide-react"
import { useTheme } from "../contexts/ThemeProvider"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useAuth } from "../contexts/AuthContext"

export function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const isActive = (path: string) => location.pathname === path

  const [notifications, setNotifications] = useState<any[]>([])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch('/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) setNotifications(await response.json())
    } catch (error) { console.error("Erro ao buscar notificações:", error) }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) { console.error("Erro ao marcar como lida:", error) }
  }

  // --- FUNÇÃO AUXILIAR PARA ESTILIZAR OS BOTÕES DO MENU ---
  const getLinkStyle = (path: string) => {
    const active = isActive(path);
    return `w-full justify-start gap-3 relative transition-all duration-200 h-10 ${
      active 
        ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold' 
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'
    }`;
  };

  // --- INDICADOR VISUAL PARA A ABA ATIVA ---
  const ActiveIndicator = ({ path }: { path: string }) => 
    isActive(path) ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" /> : null;

  // --- LINKS DO MENU ---
  const NavLinks = () => (
    <div className="space-y-6">
      
      {/* GRUPO 1: MENU PRINCIPAL */}
      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase mb-2">
          Menu Principal
        </h3>
        
        <Button variant="ghost" className={getLinkStyle('/dashboard')} onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}>
          <ActiveIndicator path="/dashboard" />
          <LayoutDashboard className="h-[18px] w-[18px]" /> Visão Geral
        </Button>

      </div>

      {/* GRUPO 2: OPERACIONAL */}
      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase mb-2">
          Operacional
        </h3>
        
        <Button variant="ghost" className={getLinkStyle('/helpdesk')} onClick={() => { navigate('/helpdesk'); setIsMobileMenuOpen(false); }}>
          <ActiveIndicator path="/helpdesk" />
          <Ticket className="h-[18px] w-[18px]" /> Helpdesk
        </Button>

        <Button variant="ghost" className={getLinkStyle('/inventario')} onClick={() => { navigate('/inventario'); setIsMobileMenuOpen(false); }}>
          <ActiveIndicator path="/inventario" />
          <Package className="h-[18px] w-[18px]" /> Inventário
        </Button>

        <Button variant="ghost" className={getLinkStyle('/recursoshumanos')} onClick={() => { navigate('/recursoshumanos'); setIsMobileMenuOpen(false); }}>
          <ActiveIndicator path="/recursoshumanos" />
          <Briefcase className="h-[18px] w-[18px]" /> Recursos Humanos
        </Button>

      </div>

      {/* GRUPO 3: ADMINISTRAÇÃO */}
      <div className="space-y-1">
        <h3 className="px-4 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase mb-2">
          Administração
        </h3>
        
        <Button variant="ghost" className={getLinkStyle('/usuarios')} onClick={() => { navigate('/usuarios'); setIsMobileMenuOpen(false); }}>
          <ActiveIndicator path="/usuarios" />
          <Users className="h-[18px] w-[18px]" /> Usuários
        </Button>
      </div>

    </div>
  )

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      
      {/* ========================================================= */}
      {/* 1. BARRA LATERAL (DESKTOP) */}
      {/* ========================================================= */}
      <aside className="w-64 flex-col border-r border-border bg-card hidden md:flex">
        
        {/* CABEÇALHO DO MENU (LOGO) */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50 shrink-0">
          <img src="/logo.png" alt="Logo N-HUB" className="h-7 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            N-HUB
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <NavLinks />
        </nav>

        {/* RODAPÉ DO MENU */}
        <div className="mt-auto border-t border-border/50 p-3 space-y-1">
          <Button variant="ghost" className={getLinkStyle('/configuracoes')} onClick={() => navigate('/configuracoes')}>
            <ActiveIndicator path="/configuracoes" />
            <Settings className="h-[18px] w-[18px]" /> Configurações
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-10 font-medium transition-colors text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/20 dark:hover:text-red-300" 
            onClick={handleLogout}
          >
            <LogOut className="h-[18px] w-[18px]" /> Sair
          </Button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. ÁREA PRINCIPAL */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden w-full bg-muted/10">
        
        {/* CABEÇALHO SUPERIOR */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 shrink-0 z-10 sticky top-0">
          
          <div className="flex items-center gap-3">
            {/* MENU HAMBÚRGUER (MOBILE) */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-card border-border p-0 flex flex-col">
                  {/* Necessário para acessibilidade do Modal do Sheet */}
                  <div className="sr-only">
                    <SheetTitle>Menu de Navegação</SheetTitle>
                    <SheetDescription>Acesse os módulos do sistema N-HUB.</SheetDescription>
                  </div>
                  
                  <div className="h-16 flex items-center gap-3 px-6 border-b border-border/50 shrink-0">
                    <img src="/logo.png" alt="Logo N-HUB" className="h-6 w-auto object-contain" />
                    <h1 className="text-xl font-bold tracking-tight text-foreground">N-HUB</h1>
                  </div>
                  
                  <nav className="flex-1 overflow-y-auto p-4">
                    <NavLinks />
                  </nav>
                  
                  {/* Rodapé do Menu Mobile */}
                  <div className="border-t border-border/50 p-4 space-y-2 mt-auto">
                    <Button variant="ghost" className={getLinkStyle('/configuracoes')} onClick={() => { navigate('/configuracoes'); setIsMobileMenuOpen(false); }}>
                      <ActiveIndicator path="/configuracoes" />
                      <Settings className="h-[18px] w-[18px]" /> Configurações
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                      <LogOut className="h-[18px] w-[18px]" /> Sair
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* TÍTULO DA PÁGINA NO HEADER */}
            <h2 className="text-lg font-semibold tracking-tight hidden sm:block text-foreground/90">Painel de Controle</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* BOTÃO DE TROCA DE TEMA */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Trocar tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border text-foreground">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* SINO DE NOTIFICAÇÕES */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-600 ring-2 ring-background"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-popover border-border text-foreground p-0 mt-1 shadow-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="font-semibold text-sm">Notificações</span>
                  <Badge variant="secondary" className="text-xs">{notifications.length} novas</Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 text-muted-foreground/30" />
                      Nenhuma notificação no momento.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 border-b border-border/50 hover:bg-muted/50 transition-colors flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm leading-tight">{notif.title}</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:bg-muted" onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}>
                            Marcar lida
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-1">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AVATAR DO USUÁRIO */}
            <div className="ml-2 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors shadow-sm">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.name?.substring(0, 2).toUpperCase() || "US"
              )}
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 3. CONTEÚDO DINÂMICO (OUTLET) */}
        {/* ========================================================= */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto relative">
          <Outlet /> 
        </div>
      </main>

    </div>
  )
}