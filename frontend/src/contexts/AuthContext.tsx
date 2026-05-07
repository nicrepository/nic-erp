import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  roles?: string[];
  authorities?: string[];
  exp: number;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface CurrentUserResponse {
  name?: string;
  email?: string;
  avatarUrl?: string;
  roles?: string[];
  authorities?: string[];
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

  useEffect(() => {
    if (!user) return;

    const refreshCurrentUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const currentUser = await response.json() as CurrentUserResponse;
        setUser(prev => prev ? {
          ...prev,
          name: currentUser.name ?? prev.name,
          email: currentUser.email ?? prev.email,
          avatarUrl: currentUser.avatarUrl ?? prev.avatarUrl,
          roles: currentUser.authorities || currentUser.roles || prev.roles,
          authorities: currentUser.authorities || prev.authorities,
        } : prev);
      } catch (error) {
        console.error("Erro ao atualizar permissões do usuário:", error);
      }
    };

    refreshCurrentUser();
  }, [user?.sub]);

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
