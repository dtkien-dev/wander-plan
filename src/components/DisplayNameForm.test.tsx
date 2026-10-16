import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DisplayNameForm } from './DisplayNameForm'
afterEach(cleanup)

it('allows clearing the name and preserves input when a save fails so the user can retry', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValue(undefined)
  render(<DisplayNameForm initialName="An" fallback="owner" saving={false} onSave={save} />)
  fireEvent.change(screen.getByLabelText('Tên hiển thị của bạn'), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu tên' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
  expect(screen.getByLabelText('Tên hiển thị của bạn')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Lưu tên' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Đã lưu tên'))
  expect(save).toHaveBeenLastCalledWith('')
})
