import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, Package, Settings, LogOut, Bell, Sun, Moon, Menu, Ticket, Briefcase, ChevronRight } from "lucide-react"
import { useTheme } from "../contexts/ThemeProvider"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useAuth } from "../contexts/AuthContext"

// Navigation item type
interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const navGroups = [
  {
    label: "Principal",
    items: [
      { label: "Visão Geral", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: "Operacional",
    items: [
      { label: "Helpdesk", path: "/helpdesk", icon: <Ticket className="h-4 w-4" /> },
      { label: "Inventário", path: "/inventario", icon: <Package className="h-4 w-4" /> },
      { label: "Recursos Humanos", path: "/recursoshumanos", icon: <Briefcase className="h-4 w-4" /> },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Usuários", path: "/usuarios", icon: <Users className="h-4 w-4" /> },
    ],
  },
]

export function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const isActive = (path: string) => location.pathname === path

  // Page title from current route
  const currentTitle = (() => {
    const all: NavItem[] = navGroups.flatMap(g => g.items)
    const found = all.find(i => i.path === location.pathname)
    return found?.label ?? "N-HUB"
  })()

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
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
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

  const NavItem = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.path)
    return (
      <button
        onClick={() => { navigate(item.path); onClick?.() }}
        className={`
          w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
          transition-colors duration-150 relative group
          ${active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r-full" />
        )}
        <span className={active ? "text-primary" : ""}>{item.icon}</span>
        <span>{item.label}</span>
        {active && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
      </button>
    )
  }

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="h-[44px] flex items-center gap-2.5 px-4 border-b border-border shrink-0">
        <img src="/logo.png" alt="N-HUB" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
        <span className="text-base font-bold tracking-tight text-foreground">N-HUB</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.path} item={item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3 space-y-0.5 shrink-0">
        <NavItem item={{ label: "Configurações", path: "/configuracoes", icon: <Settings className="h-4 w-4" /> }} onClick={onNavigate} />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">

      {/* ── Sidebar (desktop) ── */}
      <aside className="w-56 flex-col bg-card border-r border-border hidden md:flex shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Shell bar (Fiori-style top bar) ── */}
        <header className="shrink-0 bg-card border-b border-border sticky top-0 z-20">
          {/* Purple brand stripe at very top */}
          <div className="h-0.5 w-full bg-primary" />

          <div className="h-11 flex items-center justify-between px-4 md:px-6 gap-3">
            {/* Left: mobile menu + breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="md:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-56 bg-card border-border p-0">
                    <div className="sr-only">
                      <SheetTitle>Navegação</SheetTitle>
                      <SheetDescription>Menu principal do N-HUB</SheetDescription>
                    </div>
                    <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
                  </SheetContent>
                </Sheet>
              </div>

              <div className="flex items-center gap-1.5 text-sm min-w-0">
                <span className="font-semibold text-foreground truncate">{currentTitle}</span>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 shrink-0">

              {/* Theme toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Tema</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border text-foreground text-sm min-w-[120px]">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("light")}>☀️ Claro</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("dark")}>🌙 Escuro</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme("system")}>💻 Sistema</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-popover border-border text-foreground p-0 shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                    <span className="font-semibold text-sm">Notificações</span>
                    {notifications.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5">{notifications.length}</Badge>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                        <Bell className="h-7 w-7 opacity-25" />
                        Sem notificações
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm leading-snug">{notif.title}</p>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 shrink-0 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}>
                              Lida
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User avatar */}
              <div className="ml-1 h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary overflow-hidden border border-primary/20 cursor-pointer hover:border-primary/50 transition-colors shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  user?.name?.substring(0, 2).toUpperCase() || "US"
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}