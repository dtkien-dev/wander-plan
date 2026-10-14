import { Suspense, lazy, type ComponentType } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageErrorBoundary } from './PageErrorBoundary'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('PageErrorBoundary', () => {
  it('recovers a rejected lazy page import with a friendly error and a working reload action', async () => {
    let rejectImport!: (error: Error) => void
    const Page = lazy(() => new Promise<{ default: ComponentType }>((_resolve, reject) => { rejectImport = reject }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<PageErrorBoundary><Suspense fallback={<p role="status">Đang mở trang</p>}><Page /></Suspense></PageErrorBoundary>)
    expect(screen.getByRole('status')).toHaveTextContent('Đang mở trang')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await act(async () => rejectImport(new Error('Failed to fetch private hashed bundle')))
    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('Chưa thể mở trang')
    expect(error).toHaveTextContent('Kiểm tra kết nối rồi tải lại trang')
    expect(error).not.toHaveTextContent('private hashed bundle')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // jsdom makes Location methods immutable; replace only the browser window's
    // navigation boundary while retaining its actual DOM/event constructors.
    const reload = vi.fn()
    vi.stubGlobal('window', new Proxy(window, {
      get: (target, property) => property === 'location' ? { reload } : Reflect.get(target, property),
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Tải lại trang' }))
    expect(reload).toHaveBeenCalledOnce()
  })
})
