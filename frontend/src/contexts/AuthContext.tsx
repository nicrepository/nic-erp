import { createContext, useContext, useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  roles?: string[];
  exp: number;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: DecodedToken | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (newData: Partial<DecodedToken>) => void; // <-- FUNÇÃO NOVA AQUI
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  
  // A MÁGICA 1: Lemos o token IMEDIATAMENTE quando o estado nasce. 
  // Isso impede o PrivateRoute de te chutar pro login ao recarregar a página!
  const [user, setUser] = useState<DecodedToken | null>(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          return decoded;
        } else {
          localStorage.removeItem("token"); // Token venceu
        }
      } catch (error) {
        localStorage.removeItem("token"); // Token inválido
      }
    }
    return null;
  });

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode<DecodedToken>(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // A MÁGICA 2: Função para atualizar apenas a foto na tela sem precisar fazer login de novo
  const updateUser = (newData: Partial<DecodedToken>) => {
    if (user) {
      setUser({ ...user, ...newData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}