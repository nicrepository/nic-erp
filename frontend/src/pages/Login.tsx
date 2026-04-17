import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeProvider"
import { AlertCircle, Mail, Lock, ArrowRight, Shield, MailCheck, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuth() 
  const { setTheme } = useTheme() 

  // --- ESTADOS DO MODAL DE RECUPERAÇÃO DE SENHA ---
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotError, setForgotError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setLoading(true)

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        login(data.token) 
        navigate('/dashboard') 
      } else {
        setErro("Credenciais inválidas. Tente novamente.")
      }
    } catch (error) {
      setErro("Erro de conexão. O servidor back-end está rodando?")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError("")
    setForgotMessage("")
    setForgotLoading(true)

    try {
      const response = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })

      if (response.ok) {
        setForgotMessage("Se o e-mail existir em nossa base, um link de recuperação será enviado em instantes.")
        setForgotEmail("") 
      } else {
        setForgotError("Ocorreu um erro ao processar sua solicitação. Tente novamente.")
      }
    } catch (error) {
      setForgotError("Erro de conexão com o servidor.")
    } finally {
      setForgotLoading(false)
    }
  }

  const openForgotModal = (e: React.MouseEvent) => {
    e.preventDefault()
    setForgotMessage("")
    setForgotError("")
    setForgotEmail(email) 
    setIsForgotModalOpen(true)
  }

  return (
    /* Always-dark atmospheric shell */
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#14121f] text-[#e5e0f3]">

      {/* Purple radial glow */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-[0.12]">
        <div className="w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#7c3aed] to-transparent blur-[120px]" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.12]"
        style={{ backgroundImage: "radial-gradient(circle, #4a4455 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#958da1] hover:text-[#e5e0f3] hover:bg-white/5">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1c1a27] border-white/10 text-[#e5e0f3]">
            <DropdownMenuItem className="cursor-pointer focus:bg-white/5" onClick={() => setTheme("light")}>☀️ Claro</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-white/5" onClick={() => setTheme("dark")}>🌙 Escuro</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-white/5" onClick={() => setTheme("system")}>💻 Sistema</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4 p-8 md:p-12 bg-[#1c1a27] rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.55)] border border-white/[0.06] backdrop-blur-sm">

        {/* Brand header */}
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#201e2c] border border-white/10 flex items-center justify-center shadow-lg shadow-[#7c3aed]/10 overflow-hidden">
            <img
              src="/logo.png"
              alt="Nic-Labs"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
              }}
            />
            {/* fallback monogram */}
            <span className="hidden w-full h-full items-center justify-center text-xl font-bold text-[#d2bbff] select-none">N</span>
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-[#e5e0f3]">NIC-LABS</h1>
            <p className="text-sm text-[#958da1] mt-1 tracking-wide">N-HUB — Sistema Integrado</p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Error banner */}
          {erro && (
            <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-500/20 p-3 text-sm text-red-400 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{erro}</p>
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#958da1] pointer-events-none" />
            <input
              id="email"
              type="email"
              placeholder="Email corporativo"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0e0c19] text-[#e5e0f3] text-sm placeholder:text-[#4a4455] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#7c3aed]/60 focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#958da1] pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="Senha"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0e0c19] text-[#e5e0f3] text-sm placeholder:text-[#4a4455] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#7c3aed]/60 focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={openForgotModal}
              className="text-xs text-[#958da1] hover:text-[#d2bbff] transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7c3aed] text-white font-medium text-sm rounded-[10px] py-3.5 flex items-center justify-center gap-2 transition-all hover:bg-[#6d28d9] hover:shadow-[0_0_24px_rgba(124,58,237,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-t border-white/10"
          >
            {loading ? "Autenticando..." : (<>Acessar o N-HUB <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </form>

        {/* Divider */}
        <div className="my-7 flex items-center">
          <div className="flex-grow border-t border-white/[0.08]" />
          <span className="px-4 text-[#4a4455] text-[10px] uppercase tracking-widest font-medium">ou</span>
          <div className="flex-grow border-t border-white/[0.08]" />
        </div>

        {/* SSO placeholder */}
        <button
          type="button"
          disabled
          title="Integração Keycloak em breve"
          className="w-full bg-[#201e2c] text-[#ccc3d8] font-medium text-sm rounded-[10px] py-3.5 flex items-center justify-center gap-3 border border-white/[0.08] opacity-50 cursor-not-allowed transition-colors"
        >
          <div className="w-5 h-5 rounded bg-[#7c3aed]/20 text-[#d2bbff] flex items-center justify-center font-bold text-xs border border-[#7c3aed]/30">K</div>
          Entrar com Keycloak
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-[#4a4455] flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Acesso restrito a membros autorizados
          </p>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] bg-[#1c1a27] border-white/[0.08] text-[#e5e0f3]">
          <DialogHeader>
            <DialogTitle className="text-[#e5e0f3]">Recuperação de Senha</DialogTitle>
            <DialogDescription className="text-[#958da1]">
              Digite o e-mail associado à sua conta. Enviaremos as instruções de recuperação para ele.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword}>
            <div className="grid gap-4 py-4">

              {forgotMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-500/20 p-3 text-sm text-emerald-400 font-medium">
                  <MailCheck className="h-4 w-4 shrink-0" />
                  <p>{forgotMessage}</p>
                </div>
              )}

              {forgotError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-500/20 p-3 text-sm text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{forgotError}</p>
                </div>
              )}

              {!forgotMessage && (
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email" className="text-[#ccc3d8]">E-mail Corporativo</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="colaborador@niclabs.com.br"
                    className="bg-[#0e0c19] border-white/[0.08] text-[#e5e0f3] placeholder:text-[#4a4455] h-11 focus-visible:ring-[#7c3aed]/60"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10 border-white/10 bg-transparent text-[#ccc3d8] hover:bg-white/5" onClick={() => setIsForgotModalOpen(false)}>
                {forgotMessage ? "Fechar" : "Cancelar"}
              </Button>
              {!forgotMessage && (
                <Button type="submit" className="w-full sm:w-auto h-10 bg-[#7c3aed] hover:bg-[#6d28d9] text-white" disabled={forgotLoading}>
                  {forgotLoading ? "Enviando..." : "Enviar Link"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}