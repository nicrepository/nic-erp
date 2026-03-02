import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { PrivateRoute } from "@/components/PrivateRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas (Qualquer um acessa) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas (O Leão de Chácara toma conta) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* No futuro, as rotas do Helpdesk, Inventário e Mural entrarão todas aqui dentro! */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App