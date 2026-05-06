import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ACCESS_DENIED_EVENT, SESSION_EXPIRED_EVENT } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"

export function ApiSessionEvents() {
  const { logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleSessionExpired = () => {
      logout()
      toast.warning("Sessão expirada", "Entre novamente para continuar.")
      navigate("/login", { replace: true, state: { from: location.pathname } })
    }

    const handleAccessDenied = () => {
      toast.warning("Acesso negado", "Seu usuário não possui permissão para executar esta ação.")
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    window.addEventListener(ACCESS_DENIED_EVENT, handleAccessDenied)

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
      window.removeEventListener(ACCESS_DENIED_EVENT, handleAccessDenied)
    }
  }, [location.pathname, logout, navigate, toast])

  return null
}
