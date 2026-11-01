import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { useState } from 'react'
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom'
import { afterEach, expect, it } from 'vitest'
import { NavigationGuard } from './NavigationGuard'
import { Modal } from './Modal'

afterEach(cleanup)

function setup(pending = false) {
  const router = createMemoryRouter([
    { path: '/edit', element: <NavigationGuard><form data-unsaved="true" data-pending={pending}><input aria-label="Draft" defaultValue="My draft" /></form></NavigationGuard> },
    { path: '/previous', element: <p>Previous page</p> },
  ], { initialEntries: ['/previous', '/edit'], initialIndex: 1 })
  render(<RouterProvider router={router} />)
  return router
}

it('cancels Back with input intact, then proceeds only after explicit discard', async () => {
  const router = setup()
  await act(() => router.navigate(-1))
  fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục chỉnh sửa' }))
  expect(screen.getByLabelText('Draft')).toHaveValue('My draft')
  expect(router.state.location.pathname).toBe('/edit')
  await act(() => router.navigate(-1))
  fireEvent.click(await screen.findByRole('button', { name: 'Bỏ thay đổi và rời trang' }))
  await waitFor(() => expect(screen.getByText('Previous page')).toBeInTheDocument())
  router.dispose()
})

it('warns on reload while editing and removes the unload handler after unmount', () => {
  const router = setup()
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  cleanup()
  const after = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(after)
  expect(after.defaultPrevented).toBe(false)
  router.dispose()
})

it('does not offer abandoning a pending save', async () => {
  const router = setup(true)
  await act(() => router.navigate('/previous'))
  expect(await screen.findByRole('dialog', { name: 'Đang lưu thay đổi' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Bỏ thay đổi và rời trang' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục chỉnh sửa' }))
  expect(router.state.location.pathname).toBe('/edit')
  router.dispose()
})

it('discards a shell editor that survives route changes and releases the scroll lock', async () => {
  function ShellEditor() {
    const [open, setOpen] = useState(true)
    return <Modal open={open} title="Persistent editor" onClose={() => setOpen(false)}><form data-unsaved="true"><input defaultValue="Draft" /></form></Modal>
  }
  const overflow = document.body.style.overflow
  const router = createMemoryRouter([{ element: <NavigationGuard><ShellEditor /><Outlet /></NavigationGuard>, children: [
    { path: '/edit', element: <p>Edit page</p> }, { path: '/previous', element: <p>Previous page</p> },
  ] }], { initialEntries: ['/previous', '/edit'], initialIndex: 1 })
  render(<RouterProvider router={router} />)
  await act(() => router.navigate(-1))
  fireEvent.click(await screen.findByRole('button', { name: 'Bỏ thay đổi và rời trang' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.getByText('Previous page')).toBeInTheDocument()
  expect(document.body.style.overflow).toBe(overflow)
  router.dispose()
})
