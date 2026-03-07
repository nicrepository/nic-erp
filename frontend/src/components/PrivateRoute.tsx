import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute() {
  // Puxamos a informação em tempo real do nosso cérebro de autenticação
  const { isAuthenticated } = useAuth();

  // Se estiver autenticado, o <Outlet /> permite que o React Router renderize as rotas filhas (Dashboard, Helpdesk, etc.)
  // Se não estiver (ex: token expirou ou usuário deslogou), redireciona na mesma hora para o /login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}