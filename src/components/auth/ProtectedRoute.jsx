import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured, supabaseConfigError } from '../../config/supabase'

const ProtectedRoute = ({ children }) => {
  const { user, isAdmin, loading, authError } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6">
        <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-10 text-center shadow-xl">
          <h1 className="text-2xl font-serif font-black text-brand-navy uppercase">Configuracao Incompleta</h1>
          <p className="mt-4 text-sm text-slate-600">{supabaseConfigError}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="text-brand-navy font-serif text-xl animate-pulse">
          VERIFICANDO CREDENCIAIS...
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-6">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white p-10 text-center shadow-xl">
          <h1 className="text-2xl font-serif font-black text-brand-navy uppercase">Acesso Administrativo Negado</h1>
          <p className="mt-4 text-sm text-slate-600">
            {authError || 'Sua conta esta autenticada, mas nao possui permissao administrativa para este painel.'}
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
