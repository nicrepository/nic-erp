import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { PrivateRoute } from "./components/PrivateRoute"
import { AppLayout } from "./components/AppLayout"
import { ThemeProvider } from "./contexts/ThemeProvider"
import { ToastProvider } from "./contexts/ToastContext"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Skeleton } from "@/components/ui/skeleton"

const Login        = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })))
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.ResetPassword })))
const Dashboard    = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })))
const Helpdesk     = lazy(() => import("./pages/Helpdesk").then(m => ({ default: m.Helpdesk })))
const Inventario   = lazy(() => import("./pages/Inventario").then(m => ({ default: m.Inventario })))
const Usuarios     = lazy(() => import("./pages/Usuarios").then(m => ({ default: m.Usuarios })))
const Configuracoes = lazy(() => import("./pages/Configuracoes").then(m => ({ default: m.Configuracoes })))
const RecursosHumanos = lazy(() => import("./pages/RecursosHumanos").then(m => ({ default: m.RecursosHumanos })))

function PageLoader() {
  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-80" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full mt-2 rounded-lg" />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="nic-erp-theme">
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* A Guarita de Segurança */}
            <Route element={<PrivateRoute />}>
              {/* O Molde Visual (Sidebar + Topbar) */}
              <Route element={<AppLayout />}>
                {/* Todas as telas do sistema entram aqui dentro! */}
                <Route path="/dashboard"        element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/usuarios"         element={<ErrorBoundary><Usuarios /></ErrorBoundary>} />
                <Route path="/helpdesk"         element={<ErrorBoundary><Helpdesk /></ErrorBoundary>} />
                <Route path="/inventario"       element={<ErrorBoundary><Inventario /></ErrorBoundary>} />
                <Route path="/configuracoes"    element={<ErrorBoundary><Configuracoes /></ErrorBoundary>} />
                <Route path="/recursoshumanos"  element={<ErrorBoundary><RecursosHumanos /></ErrorBoundary>} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
    </ThemeProvider>
  )
}

export default App