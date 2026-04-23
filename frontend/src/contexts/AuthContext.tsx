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
  mustChangePassword: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (newData: Partial<DecodedToken>) => void;
  setMustChangePassword: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  
  const [user, setUser] = useState<DecodedToken | null>(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          return decoded;
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    return null;
  });

  const [mustChangePassword, setMustChangePasswordState] = useState<boolean>(() => {
    return localStorage.getItem("mustChangePassword") === "true";
  });

  const setMustChangePassword = (value: boolean) => {
    if (value) {
      localStorage.setItem("mustChangePassword", "true");
    } else {
      localStorage.removeItem("mustChangePassword");
    }
    setMustChangePasswordState(value);
  };

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode<DecodedToken>(token);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("mustChangePassword");
    setUser(null);
    setMustChangePasswordState(false);
  };

  // A MÁGICA 2: Função para atualizar apenas a foto na tela sem precisar fazer login de novo
  const updateUser = (newData: Partial<DecodedToken>) => {
    if (user) {
      setUser({ ...user, ...newData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, mustChangePassword, login, logout, updateUser, setMustChangePassword }}>
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