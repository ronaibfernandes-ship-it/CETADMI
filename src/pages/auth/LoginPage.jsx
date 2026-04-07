import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LogIn, Loader2, AlertCircle } from 'lucide-react'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [user, navigate, location])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      // Navigation will be handled by the useEffect above
    } catch (err) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cetadmi-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Institucional Dominante */}
        <div className="flex justify-center mb-10">
          <div className="brutalist-border bg-white p-4 shadow-[8px_8px_0px_0px_theme(colors.cetadmi.navy)]">
            <img 
              src="/logo-cetadmi.png" 
              alt="CETADMI Logo" 
              className="w-48 h-48 object-contain"
              onError={(e) => e.target.style.display = 'none'} // Fallback se o arquivo não existir ainda
            />
          </div>
        </div>

        {/* Header Institucional */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-bold text-cetadmi-navy mb-2 tracking-tight">
            CETADMI
          </h1>
          <div className="h-1 w-24 bg-cetadmi-red mx-auto mb-4" />
          <p className="font-sans text-cetadmi-navy/70 uppercase tracking-[0.4em] text-[10px] font-bold">
            Portal de Gestão de Eventos
          </p>
        </div>

        {/* Login Card */}
        <div className="brutalist-card bg-white">
          <div className="mb-6 flex items-center gap-3">
            <LogIn className="w-6 h-6 text-cetadmi-navy" />
            <h2 className="text-2xl font-serif font-bold text-cetadmi-navy">Identificação</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-cetadmi-red/10 border-l-4 border-cetadmi-red p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cetadmi-red shrink-0 mt-0.5" />
                <p className="text-sm text-cetadmi-red font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-cetadmi-navy uppercase tracking-widest">
                E-mail Acadêmico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cetadmi-cream/30 border-2 border-cetadmi-navy p-3 font-bold focus:bg-white focus:outline-none transition-colors rounded-none"
                placeholder="exemplo@cetadmi.com.br"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-cetadmi-navy uppercase tracking-widest">
                Credencial (Senha)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cetadmi-cream/30 border-2 border-cetadmi-navy p-3 font-bold focus:bg-white focus:outline-none transition-colors rounded-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full brutalist-button flex items-center justify-center py-4 text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'AUTENTICAR'
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-cetadmi-navy/10 text-center">
            <p className="text-[10px] text-cetadmi-navy/50 font-bold italic">
              "Procura apresentar-te a Deus aprovado..." — 2 Timóteo 2:15
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-cetadmi-navy/40 font-black uppercase tracking-widest leading-relaxed">
          &copy; {new Date().getFullYear()} CETADMI<br/>
          Centro Educacional Teológico da Assembleia de Deus de Missões
        </p>
      </div>
    </div>
  )
}

export default LoginPage
