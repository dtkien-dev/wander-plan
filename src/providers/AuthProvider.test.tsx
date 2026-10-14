import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, useLocation } from 'react-router-dom'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'

const auth = vi.hoisted(() => ({ initialize: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(), signInWithOtp: vi.fn(), signOut: vi.fn() }))
vi.mock('../lib/supabase', () => ({ supabase: { auth }, isSupabaseConfigured: true, isDemoMode: false, configurationError: null }))

let notify: (event: AuthChangeEvent, session: Session | null) => void
const sessionFor = (id: string) => ({ user: { id }, access_token: `${id}-token` }) as Session

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => { resolve = resolvePromise; reject = rejectPromise })
  return { promise, resolve, reject }
}

function Consumer() {
  const { session, loading, authError, signInWithEmail, signOut } = useAuth()
  const location = useLocation()
  return <>
    <output aria-label="identity">{loading ? 'loading' : session?.user.id ?? 'anonymous'}</output>
    <output aria-label="route">{location.pathname}</output>
    {authError && <p role="alert">{authError}</p>}
    <button onClick={() => void signInWithEmail('  FRIEND@Example.COM ').catch(() => {})}>Send</button>
    <button onClick={() => void signOut()}>Logout</button>
  </>
}

function mount(client = new QueryClient()) {
  render(<QueryClientProvider client={client}><AuthProvider><HashRouter><Consumer /></HashRouter></AuthProvider></QueryClientProvider>)
  return client
}

beforeEach(() => {
  vi.resetAllMocks()
  window.history.replaceState(null, '', '/wander-plan/#/expenses')
  window.sessionStorage.clear()
  auth.initialize.mockResolvedValue({ error: null })
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
  auth.signInWithOtp.mockResolvedValue({ error: null })
  auth.signOut.mockResolvedValue({ error: null })
  auth.onAuthStateChange.mockImplementation((callback) => { notify = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } })
})
afterEach(cleanup)

describe('AuthProvider', () => {
  it.each(['resolved', 'rejected'])('ends boot loading after a %s getSession error', async (mode) => {
    const error = new Error('private backend failure')
    if (mode === 'resolved') auth.getSession.mockResolvedValue({ data: { session: null }, error })
    else auth.getSession.mockRejectedValue(error)
    mount()
    await waitFor(() => expect(screen.getByLabelText('identity')).toHaveTextContent('anonymous'))
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa thể khôi phục phiên đăng nhập')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private backend failure')
  })

  it('explains expired callback links even when getSession returns no error', async () => {
    window.history.replaceState(null, '', '/wander-plan/#error=access_denied&error_code=otp_expired&error_description=private')
    mount()
    await waitFor(() => expect(screen.getByLabelText('identity')).toHaveTextContent('anonymous'))
    expect(screen.getByRole('alert')).toHaveTextContent('hết hạn hoặc không còn hợp lệ')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private')
  })

  it('surfaces a failed callback token exchange from initialization', async () => {
    auth.initialize.mockResolvedValue({ error: { code: 'otp_expired' } })
    mount()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('hết hạn hoặc không còn hợp lệ'))
    expect(screen.getByLabelText('identity')).toHaveTextContent('anonymous')
  })

  it('isolates cached data on account changes and logout, while retaining same-account refresh data', async () => {
    auth.getSession.mockResolvedValue({ data: { session: sessionFor('alice') }, error: null })
    const client = mount()
    await waitFor(() => expect(screen.getByLabelText('identity')).toHaveTextContent('alice'))
    client.setQueryData(['trip-people', 'private-trip'], ['alice-only'])
    act(() => notify('TOKEN_REFRESHED', sessionFor('alice')))
    act(() => notify('TOKEN_REFRESHED', null))
    expect(screen.getByLabelText('identity')).toHaveTextContent('alice')
    expect(client.getQueryData(['trip-people', 'private-trip'])).toEqual(['alice-only'])

    const oldRequest = deferred<string[]>()
    const request = client.fetchQuery({ queryKey: ['late-alice-data'], queryFn: () => oldRequest.promise }).catch(() => {})
    act(() => notify('SIGNED_IN', sessionFor('bob')))
    expect(screen.getByLabelText('identity')).toHaveTextContent('bob')
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    oldRequest.resolve(['alice-only'])
    await request
    expect(client.getQueryData(['late-alice-data'])).toBeUndefined()

    client.setQueryData(['trip-people', 'private-trip'], ['bob-only'])
    act(() => notify('SIGNED_OUT', null))
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.getByLabelText('identity')).toHaveTextContent('anonymous')
    expect(screen.getByRole('alert')).toHaveTextContent('Phiên đăng nhập đã hết hạn')
    expect(auth.getSession).toHaveBeenCalledTimes(1)
  })

  it('does not replace a newer auth event with an older boot snapshot', async () => {
    const read = deferred<{ data: { session: Session | null }; error: null }>()
    auth.getSession.mockReturnValue(read.promise)
    mount()
    await waitFor(() => expect(auth.getSession).toHaveBeenCalled())
    act(() => notify('SIGNED_IN', sessionFor('bob')))
    await act(async () => read.resolve({ data: { session: null }, error: null }))
    expect(screen.getByLabelText('identity')).toHaveTextContent('bob')
  })

  it('guards concurrent sends and restores the safe route on the same deployed base', async () => {
    const send = deferred<{ error: null }>()
    auth.signInWithOtp.mockReturnValue(send.promise)
    mount()
    await waitFor(() => expect(screen.getByLabelText('identity')).toHaveTextContent('anonymous'))
    fireEvent.click(screen.getByText('Send'))
    fireEvent.click(screen.getByText('Send'))
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1)
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'friend@example.com', options: { emailRedirectTo: `${window.location.origin}/wander-plan/` } })
    await act(async () => send.resolve({ error: null }))
    window.history.replaceState(null, '', '/wander-plan/')
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    act(() => notify('SIGNED_IN', sessionFor('alice')))
    expect(window.location.hash).toBe('#/expenses')
    expect(screen.getByLabelText('route')).toHaveTextContent('/expenses')
    expect(window.sessionStorage.getItem('wander-plan:auth-return-route')).toBeNull()
  })

  it.each([
    [{ status: 429, message: 'private limits' }, 'quá nhiều yêu cầu'],
    [new TypeError('Failed to fetch secret endpoint'), 'kiểm tra mạng'],
  ])('waits for server failure and gives a friendly request error', async (serverError, expected) => {
    const send = deferred<{ error: unknown }>()
    auth.signInWithOtp.mockReturnValue(send.promise)
    let result: Promise<void> | undefined
    function RequestConsumer() { const { signInWithEmail } = useAuth(); return <button onClick={() => { result = signInWithEmail('friend@example.com'); void result.catch(() => {}) }}>Request</button> }
    render(<QueryClientProvider client={new QueryClient()}><AuthProvider><RequestConsumer /></AuthProvider></QueryClientProvider>)
    fireEvent.click(screen.getByText('Request'))
    send.resolve({ error: serverError })
    await expect(result).rejects.toThrow(expected)
    await expect(result).rejects.not.toThrow(/private|secret/)
  })

  it('clears account data after explicit logout even if no auth event arrives', async () => {
    auth.getSession.mockResolvedValue({ data: { session: sessionFor('alice') }, error: null })
    const client = mount()
    await waitFor(() => expect(screen.getByLabelText('identity')).toHaveTextContent('alice'))
    client.setQueryData(['private'], ['alice-only'])
    fireEvent.click(screen.getByText('Logout'))
    await waitFor(() => expect(screen.getByLabelText('identity')).toHaveTextContent('anonymous'))
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
