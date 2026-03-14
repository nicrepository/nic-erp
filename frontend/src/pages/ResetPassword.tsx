import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "../contexts/ThemeProvider"
import { Sun, Moon, AlertCircle, CheckCircle2, Lock } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTheme } = useTheme()

  // Captura o "?token=..." da URL
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    if (password !== confirmPassword) {
      setErro("As senhas não coincidem. Tente novamente.")
      return
    }

    if (password.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.")
      return
    }

    setLoading(true)

    try {
      // Ajuste a rota e o formato (JSON ou Param) conforme o seu AuthController no Spring Boot
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })

      if (response.ok) {
        setSucesso(true)
      } else {
        const errorMsg = await response.text()
        setErro(errorMsg || "Erro ao redefinir a senha. O link pode ter expirado.")
      }
    } catch (error) {
      setErro("Erro de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  // Se o usuário acessar a tela direto sem o token na URL, barramos ele amigavelmente
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-[400px] shadow-lg bg-card border-border text-center py-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-xl mb-2 text-foreground">Link Inválido</CardTitle>
          <CardDescription className="text-muted-foreground px-4">
            O token de recuperação de senha não foi encontrado ou é inválido. Por favor, solicite um novo link na tela de login.
          </CardDescription>
          <Button className="mt-6" onClick={() => navigate('/login')}>
            Voltar para o Login
          </Button>
        </Card>
      </div>
    )
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
        {sucesso ? (
          // TELA DE SUCESSO
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <CardTitle className="text-2xl font-bold text-foreground">Senha Alterada!</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sua senha foi redefinida com sucesso. Você já pode acessar o sistema com suas novas credenciais.
            </p>
            <Button className="w-full mt-4" onClick={() => navigate('/login')}>
              Ir para o Login
            </Button>
          </div>
        ) : (
          // FORMULÁRIO DE NOVA SENHA
          <>
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground text-center">Criar Nova Senha</CardTitle>
              <CardDescription className="text-muted-foreground text-center">
                Digite sua nova senha de acesso abaixo.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                {erro && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/15 border border-destructive/30 p-3 text-sm text-destructive dark:text-red-400 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{erro}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Nova Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo de 6 caracteres"
                    className="bg-background border-input text-foreground"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    className="bg-background border-input text-foreground"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir Senha"}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}