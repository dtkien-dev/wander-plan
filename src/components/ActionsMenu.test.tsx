import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ActionsMenu } from './ActionsMenu'

afterEach(cleanup)

it('closes on Escape (returning focus), outside press and after choosing an item', () => {
  const choose = vi.fn()
  render(<><ActionsMenu><button type="button" onClick={choose}>Xuất Excel</button></ActionsMenu><p>Bên ngoài</p></>)
  const menu = screen.getByText('Thêm').closest('details')!
  menu.open = true
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(menu.open).toBe(false)
  expect(document.activeElement).toBe(menu.querySelector('summary'))
  menu.open = true
  fireEvent.pointerDown(screen.getByText('Bên ngoài'))
  expect(menu.open).toBe(false)
  menu.open = true
  fireEvent.click(screen.getByRole('button', { name: 'Xuất Excel' }))
  expect(choose).toHaveBeenCalled()
  expect(menu.open).toBe(false)
})
