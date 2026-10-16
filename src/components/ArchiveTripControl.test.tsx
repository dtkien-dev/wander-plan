import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ArchiveTripControl } from './ArchiveTripControl'
afterEach(cleanup)

it('explains hiding before archive, supports cancellation and preserves retry after failure', async () => {
  const archive = vi.fn().mockRejectedValueOnce(new Error('Chuyến đi đã thay đổi')).mockResolvedValue(undefined)
  render(<ArchiveTripControl name="Chuyến Huế" busy={false} onArchive={archive} />)
  fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ chuyến này' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('Lịch trình, chi phí và checklist sẽ bị ẩn')
  fireEvent.click(screen.getByRole('button', { name: 'Giữ chuyến đang hoạt động' }))
  expect(archive).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ chuyến này' }))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ chuyến đi', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Chuyến đi đã thay đổi')
  fireEvent.click(screen.getByRole('button', { name: 'Lưu trữ chuyến đi', exact: true }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})
