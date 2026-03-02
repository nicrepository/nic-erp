import { Navigate, Outlet } from "react-router-dom";

export function PrivateRoute() {
  // O guarda vai olhar na memória do navegador (localStorage) se o token existe
  const isAuthenticated = !!localStorage.getItem("token");

  // Se estiver autenticado, libera a passagem (<Outlet />). 
  // Se não estiver, redireciona pro login imediatamente.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}