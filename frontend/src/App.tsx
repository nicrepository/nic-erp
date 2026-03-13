import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { Helpdesk } from "./pages/Helpdesk"
import { Inventario } from "./pages/Inventario"
import { PrivateRoute } from "./components/PrivateRoute"
import { AppLayout } from "./components/AppLayout"
import { Usuarios } from "./pages/Usuarios"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* A Guarita de Segurança */}
        <Route element={<PrivateRoute />}>
          {/* O Molde Visual (Sidebar + Topbar) */}
          <Route element={<AppLayout />}>
            {/* Todas as telas do sistema entram aqui dentro! */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/helpdesk" element={<Helpdesk />} />
            <Route path="/inventario" element={<Inventario />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App