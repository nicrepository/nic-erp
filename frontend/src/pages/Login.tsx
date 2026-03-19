import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeProvider"
import { Sun, Moon, MailCheck, AlertCircle, ShieldCheck } from "lucide-react"
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
    <div className="flex min-h-screen w-full bg-background text-foreground">
      
      {/* ========================================================= */}
      {/* LADO ESQUERDO: BRANDING (Invisível em telas menores que LG) */}
      {/* ========================================================= */}
      <div className="relative hidden lg:flex flex-col w-1/2 bg-zinc-950 p-10 text-white overflow-hidden">
        {/* Efeito de Gradiente de Fundo (Ajustado para o tom roxo do N-HUB) */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-zinc-950 to-zinc-950 z-0"></div>
        
        {/* CABEÇALHO (Nome do Sistema no topo) */}
        <div className="relative z-10 flex items-center text-2xl font-bold tracking-tight">
          <span>N-HUB</span>
        </div>

        {/* CENTRO: LOGO GIGANTE OCUPANDO O ESPAÇO VAZIO */}
        {/* A classe flex-1 faz essa div empurrar o N-HUB pro topo e o texto pro rodapé, ocupando todo o meio */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
          <img 
            src="/logo.png" 
            alt="Logo Nic-Labs" 
            /* w-2/3 e max-w-[500px] garantem que a logo fique gigante, mas não estoure a tela. 
               O hover:scale-105 dá um efeitinho sutil 3D ao passar o mouse! */
            className="w-2/3 max-w-[450px] h-auto object-contain opacity-90 drop-shadow-2xl transition-all duration-500 hover:scale-105" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} 
          />
        </div>

        {/* RODAPÉ DO PAINEL ESQUERDO (A frase que estava no seu print) */}
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-4">
            <p className="text-lg font-medium text-zinc-300 leading-relaxed">
              "Revolucionamos a Experiência do Usuário SAP"
            </p>
            <footer className="text-sm text-zinc-500 font-semibold tracking-wide uppercase">
              NIC-LABS
            </footer>
          </blockquote>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LADO DIREITO: FORMULÁRIO DE LOGIN                           */}
      {/* ========================================================= */}
      <div className="flex flex-col w-full lg:w-1/2 items-center justify-center p-6 relative">
        
        {/* BOTÃO DE TEMA FLUTUANTE */}
        <div className="absolute top-6 right-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Trocar tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
              <DropdownMenuItem className="cursor-pointer focus:bg-muted" onClick={() => setTheme("light")}>Claro</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-muted" onClick={() => setTheme("dark")}>Escuro</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-muted" onClick={() => setTheme("system")}>Sistema</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CONTAINER CENTRAL DO FORMULÁRIO */}
        <div className="w-full max-w-[400px] flex flex-col justify-center space-y-6">
          
          {/* Logo Mobile (Só aparece no celular) */}
          <div className="flex flex-col lg:hidden items-center gap-2 mb-2">
            <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span>Nic-ERP</span>
            </div>
            <p className="text-sm text-muted-foreground">TLP Serviços & Nic-Labs</p>
          </div>

          <Card className="w-full shadow-xl bg-card border-border/50">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-muted-foreground">
                Insira seu e-mail corporativo e senha para continuar.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {erro && (
                  <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{erro}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu.email@nic-labs.com.br"
                    className="bg-background border-input text-foreground h-11"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Senha</Label>
                    <button 
                      type="button" 
                      onClick={openForgotModal} 
                      className="text-sm font-medium text-primary hover:text-primary/80 hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="bg-background border-input text-foreground h-11"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                  {loading ? "Autenticando..." : "Acessar"}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            Área restrita a colaboradores autorizados.
          </p>
        </div>
      </div>

      {/* --- MODAL DE ESQUECI A SENHA --- */}
      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95%] bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Recuperação de Senha</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Digite o e-mail associado à sua conta. Enviaremos as instruções de recuperação para ele.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotPassword}>
            <div className="grid gap-4 py-4">
              
              {forgotMessage && (
                <div className="flex items-center gap-2 rounded-md bg-green-500/15 border border-green-500/30 p-3 text-sm text-green-700 dark:text-green-400 font-medium">
                  <MailCheck className="h-4 w-4 shrink-0" />
                  <p>{forgotMessage}</p>
                </div>
              )}

              {forgotError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive dark:text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{forgotError}</p>
                </div>
              )}

              {!forgotMessage && (
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email">E-mail Corporativo</Label>
                  <Input 
                    id="forgot-email" 
                    type="email" 
                    className="bg-background border-input text-foreground h-11"
                    placeholder="ex: colaborador@niclabs.com.br"
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    required 
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto h-10" onClick={() => setIsForgotModalOpen(false)}>
                {forgotMessage ? "Fechar" : "Cancelar"}
              </Button>
              {!forgotMessage && (
                <Button type="submit" className="w-full sm:w-auto h-10" disabled={forgotLoading}>
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