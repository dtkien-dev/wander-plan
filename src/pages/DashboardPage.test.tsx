import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { demoWorkspace } from '../data/demoData'
import { formatDate } from '../lib/format'

const mocks = vi.hoisted(() => ({ workspace: vi.fn() }))
vi.mock('../hooks/useWorkspace', () => ({ useWorkspace: mocks.workspace }))
let data: typeof demoWorkspace
beforeEach(() => {
  data = structuredClone(demoWorkspace)
  mocks.workspace.mockImplementation(() => ({ data }))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-27T09:00:00+07:00'))
})
afterEach(() => { cleanup(); vi.useRealTimers() })

it('opens the next activity, with complete multi-day details and a safe map action', () => {
  const item = data.itinerary[0]
  item.endDate = '2026-11-28'
  render(<MemoryRouter><DashboardPage /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: `Tiếp theo: ${item.title}` }))
  const dialog = screen.getByRole('dialog', { name: item.title })
  expect(within(dialog).getByText(`${formatDate(item.visitDate)} · ${item.startTime}`)).toBeInTheDocument()
  expect(within(dialog).getByText(`${formatDate(item.endDate)} · ${item.endTime}`)).toBeInTheDocument()
  expect(within(dialog).getByText(item.notes)).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: 'Mở Google Maps' })).toHaveAttribute('href', item.mapsUrl)
})

it.each(['', 'javascript:alert(1)', 'https://evil.example/maps'])('never exposes an unsafe or absent map URL (%s)', (url) => {
  data.itinerary[0].mapsUrl = url
  render(<MemoryRouter><DashboardPage /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: `Xem chi tiết ${data.itinerary[0].title}` }))
  expect(within(screen.getByRole('dialog')).queryByRole('link', { name: 'Mở Google Maps' })).not.toBeInTheDocument()
})
