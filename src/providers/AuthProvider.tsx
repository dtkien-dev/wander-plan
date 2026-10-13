import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configurationError, isDemoMode, isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isDemo: boolean
  configurationError: string | null
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    isDemo: isDemoMode,
    configurationError,
    signInWithEmail: async (email: string) => {
      if (!supabase) throw new Error(configurationError ?? 'Supabase chưa được cấu hình.')
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href.split('#')[0] },
      })
      if (error) throw error
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
