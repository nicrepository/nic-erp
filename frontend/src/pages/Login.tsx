import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeProvider"
import { Sun, Moon, MailCheck, AlertCircle } from "lucide-react"
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

  // --- FUNÇÃO PARA SOLICITAR RECUPERAÇÃO ---
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

      // Mesmo que o e-mail não exista, é boa prática de segurança retornar "OK" 
      // para não vazar quais e-mails estão cadastrados na base.
      if (response.ok) {
        setForgotMessage("Se o e-mail existir em nossa base, um link de recuperação será enviado em instantes.")
        setForgotEmail("") // Limpa o campo
      } else {
        setForgotError("Ocorreu um erro ao processar sua solicitação. Tente novamente.")
      }
    } catch (error) {
      setForgotError("Erro de conexão com o servidor.")
    } finally {
      setForgotLoading(false)
    }
  }

  // Função para abrir o modal e aproveitar o e-mail que o usuário já tinha digitado (UX)
  const openForgotModal = (e: React.MouseEvent) => {
    e.preventDefault()
    setForgotMessage("")
    setForgotError("")
    setForgotEmail(email) // Puxa o e-mail da tela de login pro modal
    setIsForgotModalOpen(true)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground p-4">
      
      {/* BOTÃO DE TEMA FLUTUANTE */}
      <div className="absolute top-4 right-6">
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

      <Card className="w-full max-w-[400px] shadow-lg bg-card border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Nic-ERP</CardTitle>
          <CardDescription className="text-muted-foreground">Insira seu e-mail e senha para acessar o sistema.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {erro && (
              <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive dark:text-red-400 font-medium">
                {erro}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                className="bg-background border-input text-foreground"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                {/* O LINK AGORA ABRE O MODAL */}
                <button 
                  type="button" 
                  onClick={openForgotModal} 
                  className="text-sm font-medium text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Input 
                id="password" 
                type="password" 
                className="bg-background border-input text-foreground"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Autenticando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
              
              {/* Alerta de Sucesso */}
              {forgotMessage && (
                <div className="flex items-center gap-2 rounded-md bg-green-500/15 border border-green-500/30 p-3 text-sm text-green-700 dark:text-green-400 font-medium">
                  <MailCheck className="h-4 w-4" />
                  <p>{forgotMessage}</p>
                </div>
              )}

              {/* Alerta de Erro */}
              {forgotError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive dark:text-red-400 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  <p>{forgotError}</p>
                </div>
              )}

              {!forgotMessage && (
                <div className="grid gap-2">
                  <Label htmlFor="forgot-email">E-mail Corporativo</Label>
                  <Input 
                    id="forgot-email" 
                    type="email" 
                    className="bg-background border-input text-foreground"
                    placeholder="ex: caio@niclabs.com.br"
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    required 
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsForgotModalOpen(false)}>
                {forgotMessage ? "Fechar" : "Cancelar"}
              </Button>
              {!forgotMessage && (
                <Button type="submit" className="w-full sm:w-auto" disabled={forgotLoading}>
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