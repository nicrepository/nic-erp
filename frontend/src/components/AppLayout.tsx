import { useState } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Package, Settings, LogOut, Bell, Monitor, Sun, Moon, Menu, Ticket } from "lucide-react"
import { useTheme } from "../contexts/ThemeProvider"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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

  // Links principais do meio do menu
  const NavLinks = () => (
    <>
      <Button 
        variant={isActive('/dashboard') ? 'secondary' : 'ghost'} 
        className={`w-full justify-start gap-3 ${isActive('/dashboard') ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
      >
        <LayoutDashboard className="h-4 w-4" /> Visão Geral
      </Button>

      <Button 
        variant={isActive('/usuarios') ? 'secondary' : 'ghost'} 
        className={`w-full justify-start gap-3 ${isActive('/usuarios') ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => { navigate('/usuarios'); setIsMobileMenuOpen(false); }}
      >
        <Users className="h-4 w-4" /> Usuários
      </Button>

      <Button 
        variant={isActive('/helpdesk') ? 'secondary' : 'ghost'} 
        className={`w-full justify-start gap-3 ${isActive('/helpdesk') ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => { navigate('/helpdesk'); setIsMobileMenuOpen(false); }}
      >
        <Ticket className="h-4 w-4" /> Helpdesk
      </Button>

      <Button 
        variant={isActive('/inventario') ? 'secondary' : 'ghost'} 
        className={`w-full justify-start gap-3 ${isActive('/inventario') ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => { navigate('/inventario'); setIsMobileMenuOpen(false); }}
      >
        <Package className="h-4 w-4" /> Inventário
      </Button>
    </>
  )

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      
      {/* 1. BARRA LATERAL (DESKTOP) */}
      <aside className="w-64 flex-col border-r border-border bg-card px-4 py-6 hidden md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Monitor className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Nic-ERP</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavLinks />
        </nav>

        {/* Rodapé do Menu Desktop */}
        <div className="mt-auto border-t border-border pt-4 space-y-2">
          <Button 
            variant={isActive('/configuracoes') ? 'secondary' : 'ghost'} 
            className={`w-full justify-start gap-3 ${isActive('/configuracoes') ? 'text-foreground' : 'text-muted-foreground'}`}
            onClick={() => navigate('/configuracoes')}
          >
            <Settings className="h-4 w-4" /> Configurações
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        
        {/* Cabeçalho */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-8 shrink-0">
          
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
                  <div className="p-6 pb-2 flex items-center gap-2">
                    <Monitor className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Nic-ERP</h1>
                  </div>
                  <nav className="flex-1 space-y-2 p-4">
                    <NavLinks />
                  </nav>
                  
                  {/* Rodapé do Menu Mobile */}
                  <div className="border-t border-border p-4 space-y-2 mt-auto">
                    <Button 
                      variant={isActive('/configuracoes') ? 'secondary' : 'ghost'} 
                      className={`w-full justify-start gap-3 ${isActive('/configuracoes') ? 'text-foreground' : 'text-muted-foreground'}`}
                      onClick={() => { navigate('/configuracoes'); setIsMobileMenuOpen(false); }}
                    >
                      <Settings className="h-4 w-4" /> Configurações
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" /> Sair
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            <h2 className="text-lg font-medium hidden sm:block">Painel</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* BOTÃO DE TROCA DE TEMA */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Trocar tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border text-foreground">
                <DropdownMenuItem className="cursor-pointer focus:bg-muted" onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer focus:bg-muted" onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer focus:bg-muted" onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground overflow-hidden border border-border cursor-pointer">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                // Pega as duas primeiras letras do nome do usuário de forma dinâmica
                user?.name?.substring(0, 2).toUpperCase() || "US"
              )}
            </div>
          </div>
        </header>

        {/* 3. CONTEÚDO DINÂMICO */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-muted/20">
          <Outlet /> 
        </div>
      </main>

    </div>
  )
}