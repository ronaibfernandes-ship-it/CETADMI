import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'

const PublicEventPlaceholder = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Página do Evento</h1>
    <p>Inscrições abertas em breve.</p>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota Pública do Evento */}
          <Route path="/evento/:slug" element={<PublicEventPlaceholder />} />
          
          {/* Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Área Administrativa Protegida */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />

          {/* Redirecionamento Padrão */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
