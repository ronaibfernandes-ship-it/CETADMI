import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigError } from '../config/supabase'

const AuthContext = createContext({
  session: null,
  user: null,
  isAdmin: false,
  adminRole: null,
  loading: true,
  authError: null,
  signOut: () => {},
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminRole, setAdminRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(supabaseConfigError)

  const withTimeout = async (promise, timeoutMs = 8000) => {
    let timeoutId

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('AUTH_TIMEOUT'))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeoutPromise])
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const resolveAdminAccess = async (nextSession) => {
    if (!supabase || !nextSession?.user) {
      setIsAdmin(false)
      setAdminRole(null)
      return
    }

    const userId = nextSession.user.id

    const fetchAdminRole = async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return data?.role ?? null
    }

    try {
      const role = await fetchAdminRole()

      setIsAdmin(Boolean(role))
      setAdminRole(role)
      setAuthError(role ? null : 'Sua conta existe, mas ainda nao foi liberada pela administracao pastoral.')
    } catch (error) {
      setIsAdmin(false)
      setAdminRole(null)
      setAuthError(
        error.code === 'PGRST205'
          ? 'A tabela admin_users ainda nao existe no Supabase. Execute a migracao mais recente antes de usar o painel.'
          : (error.message || 'Nao foi possivel validar o acesso administrativo.')
      )
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    let isMounted = true

    const syncSession = async (nextSession) => {
      if (!isMounted) return

      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      try {
        await withTimeout(resolveAdminAccess(nextSession))
      } catch (error) {
        if (!isMounted) return

        setIsAdmin(false)
        setAdminRole(null)
        setAuthError(
          error.message === 'AUTH_TIMEOUT'
            ? 'A verificacao de acesso demorou demais. Atualize a pagina e tente novamente.'
            : (error.message || 'Nao foi possivel validar o acesso administrativo.')
        )
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Check active sessions and sets the user
    supabase.auth.getSession()
      .then(({ data: { session } }) => syncSession(session))
      .catch((error) => {
        if (!isMounted) return

        setAuthError(error.message || 'Falha ao recuperar a sessao atual.')
        setLoading(false)
      })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (!supabase) return

    await supabase.auth.signOut()
    setIsAdmin(false)
    setAdminRole(null)
  }

  const value = {
    session,
    user,
    isAdmin,
    adminRole,
    loading,
    authError,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
