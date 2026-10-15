import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { newAccountsClosedMessage } from '../lib/accessConfig'
import { configurationError, isDemoMode, isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isDemo: boolean
  configurationError: string | null
  authError: string | null
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const returnRouteKey = 'wander-plan:auth-return-route'

function authenticationMessage(error: unknown, fallback: string) {
  const details = error && typeof error === 'object' ? error as { code?: string; status?: number; message?: string } : {}
  // The sign-up hook message is shown only when it matches exactly, never arbitrary callback text.
  if (details.message?.includes(newAccountsClosedMessage)) return newAccountsClosedMessage
  const description = `${details.code ?? ''} ${details.message ?? ''}`.toLowerCase()
  if (/otp_expired|invalid.*(token|link|code)|expired|access_denied/.test(description)) {
    return 'Liên kết đăng nhập đã hết hạn hoặc không còn hợp lệ. Hãy gửi một liên kết mới và mở email mới nhất.'
  }
  if (details.status === 429 || /rate_limit|too many|rate limit/.test(description)) {
    return 'Bạn đã gửi quá nhiều yêu cầu. Hãy chờ một chút trước khi thử lại.'
  }
  if (/fetch|network|connection|timeout/.test(description) || (details.status !== undefined && details.status >= 500)) {
    return 'Chưa thể kết nối để đăng nhập. Hãy kiểm tra mạng và thử lại.'
  }
  return fallback
}

function callbackError() {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  for (const params of [url.searchParams, hash]) {
    if (params.has('error') || params.has('error_code') || params.has('error_description')) {
      return authenticationMessage({ code: params.get('error_code') ?? params.get('error') ?? '', message: params.get('error_description') ?? '' }, 'Liên kết đăng nhập không còn hợp lệ. Hãy gửi một liên kết mới.')
    }
  }
  return null
}

function rememberReturnRoute() {
  try {
    const route = window.location.hash
    if (route.startsWith('#/') && !route.startsWith('#//')) window.sessionStorage.setItem(returnRouteKey, route)
  } catch { /* Storage may be blocked by browser privacy settings. */ }
}

function restoreReturnRoute() {
  try {
    const route = window.sessionStorage.getItem(returnRouteKey)
    window.sessionStorage.removeItem(returnRouteKey)
    if (route?.startsWith('#/') && !route.startsWith('#//') && !/[\r\n]/.test(route)) {
      const url = new URL(window.location.href)
      url.hash = route
      window.history.replaceState(window.history.state, '', url)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  } catch { /* Sign-in still works when browser storage is unavailable. */ }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState<string | null>(callbackError)
  const sessionRef = useRef<Session | null>(null)
  const emailRequest = useRef<Promise<void> | null>(null)
  const signingOut = useRef(false)

  useEffect(() => {
    if (!supabase) return
    let active = true
    let revision = 0
    const updateSession = (nextSession: Session | null, clear = false) => {
      if (clear || sessionRef.current?.user.id !== nextSession?.user.id) queryClient.clear()
      sessionRef.current = nextSession
      if (nextSession) {
        restoreReturnRoute()
        setAuthError(null)
      }
      setSession(nextSession)
    }
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      revision += 1
      // A refresh is not a logout; only SIGNED_OUT removes an existing session.
      if (event === 'TOKEN_REFRESHED' && !nextSession) return
      if (event === 'SIGNED_OUT') {
        setAuthError(sessionRef.current && !signingOut.current ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại bằng một liên kết mới.' : null)
      }
      updateSession(nextSession, event === 'SIGNED_OUT')
      setLoading(false)
    })
    void (async () => {
      try {
        // initialize exposes callback errors that getSession alone does not return.
        const initialization = await supabase.auth.initialize()
        const beforeRead = revision
        const { data: current, error } = await supabase.auth.getSession()
        if (!active) return
        if (!error && revision === beforeRead) updateSession(current.session)
        if ((error || initialization.error) && !sessionRef.current) {
          setAuthError(authenticationMessage(error ?? initialization.error, 'Chưa thể khôi phục phiên đăng nhập. Hãy đăng nhập lại bằng email.'))
        }
      } catch (error) {
        if (active && !sessionRef.current) setAuthError(authenticationMessage(error, 'Chưa thể khôi phục phiên đăng nhập. Hãy đăng nhập lại bằng email.'))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [queryClient])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    isDemo: isDemoMode,
    configurationError,
    authError,
    signInWithEmail: (email: string) => {
      if (emailRequest.current) return emailRequest.current
      emailRequest.current = (async () => {
        if (!supabase) throw new Error(configurationError ?? 'Supabase chưa được cấu hình.')
        rememberReturnRoute()
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
          })
          if (error) throw error
          setAuthError(null)
        } catch (error) {
          throw new Error(authenticationMessage(error, 'Chưa thể gửi liên kết đăng nhập. Hãy thử lại sau.'))
        }
      })().finally(() => { emailRequest.current = null })
      return emailRequest.current
    },
    signInWithGoogle: async () => {
      if (!supabase) throw new Error(configurationError ?? 'Supabase chưa được cấu hình.')
      rememberReturnRoute()
      // Success leaves the page for Google; the callback is handled like the email link.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
      })
      if (error) throw new Error(authenticationMessage(error, 'Chưa thể mở đăng nhập Google. Hãy thử lại hoặc dùng liên kết email.'))
    },
    signOut: async () => {
      if (!supabase) return
      signingOut.current = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        queryClient.clear()
        sessionRef.current = null
        setSession(null)
        setAuthError(null)
      } finally { signingOut.current = false }
    },
  }), [authError, loading, queryClient, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
