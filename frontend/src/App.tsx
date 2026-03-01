import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

function App() {
  // 1. Variáveis de Estado (A memória do formulário)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  // 2. A função que fala com o Spring Boot
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Impede a página de recarregar
    setErro("")
    setLoading(true)

    try {
      // Graças ao Proxy do Vite, podemos chamar apenas '/auth/login'
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        // Sucesso! Guardamos a chave do cofre no navegador.
        localStorage.setItem("token", data.token) 
        alert("Vitória! Login realizado e Token JWT salvo com sucesso!")
        console.log("Token recebido:", data.token)
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Nic-ERP</CardTitle>
          <CardDescription>
            Insira seu e-mail e senha para acessar o sistema.
          </CardDescription>
        </CardHeader>
        
        {/* Transformamos o Content num formulário real */}
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            
            {/* Aviso de Erro em vermelho */}
            {erro && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 font-medium">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu.email@niclabs.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Atualiza o estado ao digitar
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline">
                  Esqueceu a senha?
                </a>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Atualiza o estado ao digitar
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

export default App