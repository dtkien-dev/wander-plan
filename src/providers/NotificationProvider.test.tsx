import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationBell } from '../components/NotificationBell'
import { NotificationProvider, useNotify } from './NotificationProvider'

function Trigger() {
  const notify = useNotify()
  return <>
    <button type="button" onClick={() => notify.success('Đã lưu lịch trình.')}>ok</button>
    <button type="button" onClick={() => notify.error('Không thể lưu.')}>fail</button>
  </>
}

const renderFor = (accountKey: string) => render(<NotificationProvider accountKey={accountKey}><Trigger /><NotificationBell /></NotificationProvider>)

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('NotificationProvider', () => {
  it('hides a success toast after 3 seconds, pausing while hovered', () => {
    renderFor('a')
    fireEvent.click(screen.getByText('ok'))
    const toast = screen.getByRole('status')
    fireEvent.mouseEnter(toast)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('status')).toHaveTextContent('Đã lưu lịch trình.')
    fireEvent.mouseLeave(toast)
    act(() => { vi.advanceTimersByTime(2900) })
    expect(screen.queryByRole('status')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps an error toast until it is closed', () => {
    renderFor('a')
    fireEvent.click(screen.getByText('fail'))
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể lưu.')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng thông báo' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps the newest 50 entries per account on this device and deletes one or all', () => {
    const first = renderFor('a')
    for (let index = 0; index < 52; index += 1) fireEvent.click(screen.getByText('ok'))
    fireEvent.click(screen.getByText('fail'))
    first.unmount()

    renderFor('b')
    expect(screen.getByRole('button', { name: 'Lịch sử thông báo (0)' })).toBeInTheDocument()
    cleanup()

    renderFor('a')
    fireEvent.click(screen.getByRole('button', { name: 'Lịch sử thông báo (50)' }))
    const panel = screen.getByRole('region', { name: 'Lịch sử thông báo' })
    expect(panel.querySelectorAll('li')).toHaveLength(50)
    expect(panel.querySelector('li')).toHaveTextContent('Không thể lưu.')
    fireEvent.click(screen.getByRole('button', { name: 'Xoá thông báo: Không thể lưu.' }))
    expect(panel.querySelectorAll('li')).toHaveLength(49)
    fireEvent.click(screen.getByRole('button', { name: 'Xoá tất cả' }))
    expect(screen.getByText('Chưa có thông báo nào trên thiết bị này.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('wander-plan-notifications:a')!)).toEqual([])
  })

  it('ignores unreadable stored history', () => {
    localStorage.setItem('wander-plan-notifications:a', '{not json')
    renderFor('a')
    expect(screen.getByRole('button', { name: 'Lịch sử thông báo (0)' })).toBeInTheDocument()
  })
})
