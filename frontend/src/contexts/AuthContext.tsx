import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

// 1. Definimos o formato das informações que vêm dentro do seu Token JWT
// ATENÇÃO: Os nomes aqui (sub, role) dependem de como você configurou o Spring Security!
interface DecodedToken {
  sub: string;
  roles?: string[]; // Mudamos para 'roles' no plural e definimos como Array!
  exp: number;
}

interface AuthContextType {
  user: DecodedToken | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// 2. Criamos o contexto vazio
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Criamos o "Provedor" que vai abraçar todo o seu aplicativo
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DecodedToken | null>(null);

  // Assim que o React liga, ele verifica se já existe um token salvo (ex: usuário deu F5 na página)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Verifica se o token não está expirado
        if (decoded.exp * 1000 > Date.now()) {
          setUser(decoded);
        } else {
          logout(); // Token venceu, expulsa o usuário
        }
      } catch (error) {
        logout(); // Token inválido
      }
    }
  }, []);

  // Função para a tela de Login usar quando o Spring Boot devolver o Token
  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode<DecodedToken>(token);
    setUser(decoded);
  };

  // Função para o botão "Sair" usar
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Um Hook customizado para facilitar a nossa vida nas outras telas
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}