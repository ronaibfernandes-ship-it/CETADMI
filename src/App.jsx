import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EventPage from './pages/public/EventPage'
import HomePage from './pages/public/HomePage'
import CertificatePage from './pages/public/CertificatePage'

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Portal Publico */}
          <Route path="/" element={<HomePage />} />
          <Route path="/evento" element={<Navigate to="/" replace />} />
          <Route path="/certificado" element={<CertificatePage />} />
          <Route path="/certificado/:code" element={<CertificatePage />} />

          {/* Rota Pública do Evento */}
          <Route path="/evento/:slug" element={<EventPage />} />
          
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
