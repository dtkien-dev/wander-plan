import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

afterEach(cleanup)

function Editor({ pending = false }: { pending?: boolean }) {
  const [open, setOpen] = useState(true)
  const [title, setTitle] = useState('Original')
  return <Modal open={open} title="Edit" onClose={() => setOpen(false)}>
    <form data-unsaved={title !== 'Original'} data-pending={pending}>
      <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <button type="button" data-dismiss onClick={() => setOpen(false)}>Cancel</button>
    </form>
  </Modal>
}

it.each(['Cancel', 'Đóng', 'Escape', 'backdrop'])('protects changes on %s and preserves input when continuing', async (action) => {
  const { container } = render(<Editor />)
  const input = screen.getByLabelText('Title')
  input.focus()
  fireEvent.change(input, { target: { value: 'Unsaved' } })
  if (action === 'Escape') fireEvent.keyDown(document, { key: 'Escape' })
  else if (action === 'backdrop') fireEvent.mouseDown(container.querySelector('.modal-backdrop')!)
  else fireEvent.click(screen.getByRole('button', { name: action }))
  expect(screen.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tiếp tục chỉnh sửa' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục chỉnh sửa' }))
  expect(screen.getByLabelText('Title')).toHaveValue('Unsaved')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  fireEvent.click(screen.getByRole('button', { name: 'Bỏ thay đổi', exact: true }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('closes unchanged input directly, including after reverting an edit', () => {
  render(<Editor />)
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Changed' } })
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Original' } })
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('refuses closing a pending write through every dismissal path', () => {
  const { container } = render(<Editor pending />)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))
  fireEvent.keyDown(document, { key: 'Escape' })
  fireEvent.mouseDown(container.querySelector('.modal-backdrop')!)
  expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument()
  expect(screen.queryByText('Bỏ thay đổi chưa lưu?')).not.toBeInTheDocument()
})

it('Escape closes only the top dialog and restores body scrolling when all dialogs close', () => {
  const overflow = document.body.style.overflow
  const lower = vi.fn()
  const upper = vi.fn()
  const { unmount } = render(<><Modal open title="Lower" onClose={lower} /><Modal open title="Upper" onClose={upper} /></>)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(lower).not.toHaveBeenCalled()
  expect(upper).toHaveBeenCalledOnce()
  expect(screen.getByRole('dialog', { name: 'Lower' }).getAttribute('aria-labelledby')).not.toBe(screen.getByRole('dialog', { name: 'Upper' }).getAttribute('aria-labelledby'))
  unmount()
  expect(document.body.style.overflow).toBe(overflow)
})
