import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const state = vi.hoisted(() => ({ signInWithEmail: vi.fn(), authError: null as string | null }))
vi.mock('../providers/AuthProvider', () => ({ useAuth: () => state }))

beforeEach(() => { vi.resetAllMocks(); state.authError = null })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('LoginPage', () => {
  it('locks the input and guards repeated form submissions until the server confirms success', async () => {
    let finish!: () => void
    state.signInWithEmail.mockReturnValue(new Promise<void>((resolve) => { finish = resolve }))
    render(<LoginPage />)
    const input = screen.getByLabelText('Email của bạn')
    fireEvent.change(input, { target: { value: '  FRIEND@Example.COM ' } })
    const form = input.closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(state.signInWithEmail).toHaveBeenCalledOnce()
    expect(state.signInWithEmail).toHaveBeenCalledWith('friend@example.com')
    expect(input).toBeDisabled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await act(async () => finish())
    expect(input).not.toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('friend@example.com')
    expect(screen.getByRole('button', { name: 'Gửi lại sau 60s' })).toBeDisabled()
  })

  it('allows resend only after the 60 second successful-send cooldown', async () => {
    vi.useFakeTimers()
    state.signInWithEmail.mockResolvedValue(undefined)
    render(<LoginPage />)
    const input = screen.getByLabelText('Email của bạn')
    fireEvent.change(input, { target: { value: 'friend@example.com' } })
    await act(async () => fireEvent.submit(input.closest('form')!))
    act(() => vi.advanceTimersByTime(59_000))
    expect(screen.getByRole('button', { name: 'Gửi lại sau 1s' })).toBeDisabled()
    fireEvent.submit(input.closest('form')!)
    expect(state.signInWithEmail).toHaveBeenCalledOnce()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByRole('button', { name: 'Gửi lại liên kết' })).toBeEnabled()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Gửi lại liên kết' })))
    expect(state.signInWithEmail).toHaveBeenCalledTimes(2)
  })

  it('keeps failures separate from success and permits immediate retry after a failed send', async () => {
    state.authError = 'Liên kết đã hết hạn. Hãy gửi liên kết mới.'
    state.signInWithEmail.mockRejectedValueOnce(new Error('Chưa thể kết nối để đăng nhập. Hãy kiểm tra mạng và thử lại.')).mockResolvedValueOnce(undefined)
    render(<LoginPage />)
    expect(screen.getByRole('alert')).toHaveTextContent('hết hạn')
    const input = screen.getByLabelText('Email của bạn')
    fireEvent.change(input, { target: { value: 'friend@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi liên kết đăng nhập' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('kiểm tra mạng'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(input).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi liên kết đăng nhập' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã gửi liên kết đăng nhập')
    expect(state.signInWithEmail).toHaveBeenCalledTimes(2)
  })
})
