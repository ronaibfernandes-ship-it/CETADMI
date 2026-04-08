import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { LogIn, Loader2, AlertCircle, ShieldCheck, LockKeyhole, ArrowRight, Eye, EyeOff } from 'lucide-react'

const LAST_LOGIN_EMAIL_KEY = 'cetadmi:last-login-email'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, authError } = useAuth()

  // If user is already logged in, redirect them
  useEffect(() => {
    if (!authLoading && user) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [authLoading, user, navigate, location])

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(LAST_LOGIN_EMAIL_KEY)
    if (savedEmail) {
      setEmail(savedEmail)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!supabase) {
      setError(authError || 'Supabase nao configurado.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email)
      
      // Navigation will be handled by the useEffect above
    } catch (err) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cetadmi-cream px-6 py-10 lg:px-10 lg:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_480px]">
        <section className="hidden rounded-[3rem] border border-cetadmi-navy/10 bg-gradient-to-br from-cetadmi-navy via-cetadmi-navy to-cetadmi-blue p-12 text-white shadow-[18px_18px_0px_0px_theme(colors.cetadmi.red)] lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="border border-white/20 bg-white p-3 shadow-[8px_8px_0px_0px_rgba(228,30,38,0.6)]">
                <img 
                  src="/logo-cetadmi.png" 
                  alt="CETADMI Logo" 
                  className="h-24 w-24 object-contain"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold">Portal Oficial</p>
                <h1 className="mt-3 text-6xl font-serif font-black tracking-tight">CETADMI</h1>
              </div>
            </div>

            <div className="mt-14 max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-brand-gold">Acesso pastoral controlado</p>
              <h2 className="mt-5 text-5xl font-serif font-black leading-[1.02] text-balance">Painel premium para gestao de eventos, inscricoes e acessos ministeriais.</h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/78">
                Somente perfis liberados pela administracao pastoral conseguem entrar no painel. Isso protege o sistema, os inscritos e a operacao ministerial.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 text-brand-gold" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-[0.2em]">Acesso liberado</h3>
              <p className="mt-2 text-sm text-white/70">Administradores entram somente com aprovacao pastoral.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <LockKeyhole className="h-6 w-6 text-brand-gold" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-[0.2em]">Seguranca real</h3>
              <p className="mt-2 text-sm text-white/70">Permissoes administrativas e registros protegidos no Supabase.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <ArrowRight className="h-6 w-6 text-brand-gold" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-[0.2em]">Fluxo organizado</h3>
              <p className="mt-2 text-sm text-white/70">Eventos, inscricoes e confirmacoes reunidos em um unico painel.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-8 flex justify-center">
              <div className="brutalist-border bg-white p-4 shadow-[8px_8px_0px_0px_theme(colors.cetadmi.navy)]">
                <img 
                  src="/logo-cetadmi.png" 
                  alt="CETADMI Logo" 
                  className="h-40 w-40 object-contain"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            </div>

            <h1 className="text-5xl font-serif font-bold text-cetadmi-navy tracking-tight">CETADMI</h1>
            <div className="mx-auto mt-3 h-1 w-24 bg-cetadmi-red" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.4em] text-cetadmi-navy/70">Portal de Gestao de Eventos</p>
          </div>

          <div className="brutalist-card bg-white">
            <div className="mb-6 flex items-center gap-3">
              <LogIn className="w-6 h-6 text-cetadmi-navy" aria-hidden="true" />
              <h2 className="text-2xl font-serif font-bold text-cetadmi-navy">Identificação</h2>
            </div>

            <div className="mb-6 rounded-2xl border border-cetadmi-navy/10 bg-cetadmi-cream/60 px-4 py-4 text-sm text-cetadmi-navy">
              <p className="font-black uppercase tracking-[0.25em] text-[10px] text-cetadmi-navy/60">Acesso restrito</p>
              <p className="mt-2 leading-relaxed">
                O cadastro administrativo nao e automatico. Somente pessoas liberadas pelo pastor ou owner conseguem entrar neste painel.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
             {error && (
               <div className="bg-cetadmi-red/10 border-l-4 border-cetadmi-red p-4 flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-cetadmi-red shrink-0 mt-0.5" />
                <p className="text-sm text-cetadmi-red font-bold">{error}</p>
              </div>
            )}

            {!error && authError && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-bold">{authError}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-cetadmi-navy uppercase tracking-widest">
                E-mail Acadêmico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  if (email.trim()) {
                    window.localStorage.setItem(LAST_LOGIN_EMAIL_KEY, email.trim())
                  }
                }}
                className="w-full rounded-none border-2 border-cetadmi-navy bg-cetadmi-cream/30 p-3 font-bold transition-colors focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20"
                placeholder="exemplo@cetadmi.com.br"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-cetadmi-navy uppercase tracking-widest">
                Credencial (Senha)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-none border-2 border-cetadmi-navy bg-cetadmi-cream/30 p-3 pr-14 font-bold transition-colors focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-cetadmi-navy/60 transition-colors hover:text-cetadmi-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

              <button
                type="submit"
                disabled={loading || !supabase}
                className="w-full brutalist-button flex items-center justify-center py-4 text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'AUTENTICAR'
              )}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-sm text-cetadmi-navy">
            Se uma nova pessoa precisar de acesso, o pastor/owner deve liberar primeiro na area <span className="font-black">Administradores</span> do painel.
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-[10px] font-black uppercase tracking-widest">
            <Link to="/" className="rounded-full border border-cetadmi-navy/10 px-4 py-3 text-cetadmi-navy transition-colors hover:bg-cetadmi-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20">
              Voltar ao portal
            </Link>
            <a href="https://cetadmi.eadplataforma.app/courses" target="_blank" rel="noreferrer" className="rounded-full border border-cetadmi-navy/10 px-4 py-3 text-cetadmi-navy transition-colors hover:bg-cetadmi-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cetadmi-red/20">
              Ver cursos
            </a>
          </div>
           
          <div className="mt-8 pt-6 border-t border-cetadmi-navy/10 text-center">
            <p className="text-[10px] text-cetadmi-navy/50 font-bold italic">
              "Procura apresentar-te a Deus aprovado..." — 2 Timóteo 2:15
            </p>
          </div>
        </div>
        
          <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest leading-relaxed text-cetadmi-navy/40">
            &copy; {new Date().getFullYear()} CETADMI<br/>
            Centro Educacional Teológico da Assembleia de Deus de Missões
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
