import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeProvider" // <-- Importamos o controle de tema
import { Sun, Moon } from "lucide-react" // <-- Importamos os ícones
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // <-- Importamos o menu

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuth() 
  const { setTheme } = useTheme() // <-- Pegamos a função de trocar o tema

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

  return (
    // Adicionamos "relative" na div principal para podermos flutuar o botão
    <div className="relative flex min-h-screen items-center justify-center bg-background text-foreground">
      
      {/* BOTÃO DE TEMA FLUTUANTE NO CANTO SUPERIOR DIREITO */}
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

      <Card className="w-[400px] shadow-lg bg-card border-border">
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
                <a href="#" className="text-sm font-medium text-primary hover:underline">Esqueceu a senha?</a>
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
    </div>
  )
}