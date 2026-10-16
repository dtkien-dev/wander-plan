import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TripChecklist } from './TripChecklist'
import { demoWorkspace } from '../data/demoData'
import type { ChecklistItem } from '../types'
afterEach(cleanup)
const item: ChecklistItem = { id: 'item', tripId: 'trip', title: 'Áo mưa', assignedTo: 'demo-owner', completed: false, version: 1 }

it('adds with an optional assignee, preserves failed input and retries', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValue(undefined)
  render(<TripChecklist items={[]} people={demoWorkspace.people} busy={false} onSave={save} onDelete={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Thêm việc' }))
  fireEvent.change(screen.getByLabelText('Việc cần chuẩn bị'), { target: { value: '  Giấy tờ  ' } })
  fireEvent.change(screen.getByLabelText('Người phụ trách (tùy chọn)'), { target: { value: 'demo-owner' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu việc' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
  expect(screen.getByLabelText('Việc cần chuẩn bị')).toHaveValue('  Giấy tờ  ')
  fireEvent.click(screen.getByRole('button', { name: 'Lưu việc' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(save).toHaveBeenLastCalledWith({ title: 'Giấy tờ', assignedTo: 'demo-owner', completed: false }, undefined)
})

it('toggles, edits while preserving status, and requires confirmation to delete', async () => {
  const save = vi.fn().mockResolvedValue(undefined)
  const remove = vi.fn().mockResolvedValue(undefined)
  render(<TripChecklist items={[item]} people={demoWorkspace.people} busy={false} onSave={save} onDelete={remove} />)
  fireEvent.click(screen.getByRole('checkbox'))
  expect(save).toHaveBeenCalledWith({ title: 'Áo mưa', assignedTo: 'demo-owner', completed: true }, item)
  fireEvent.click(screen.getByRole('button', { name: 'Sửa Áo mưa' }))
  fireEvent.change(screen.getByLabelText('Việc cần chuẩn bị'), { target: { value: 'Áo khoác' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu việc' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(save).toHaveBeenLastCalledWith({ title: 'Áo khoác', assignedTo: 'demo-owner', completed: false }, item)
  fireEvent.click(screen.getByRole('button', { name: 'Xóa Áo mưa' }))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Xóa việc', exact: true }))
  await waitFor(() => expect(remove).toHaveBeenCalledWith(item))
})
