import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { formatDate } from '../lib/format'
import type { Trip } from '../types'
import styles from './TripManager.module.css'

type TripOption = Pick<Trip, 'id' | 'name' | 'destination' | 'startDate' | 'endDate'>

interface TripSelectProps {
  label: string
  trips: TripOption[]
  value: string | null | undefined
  disabled: boolean
  onChange: (tripId: string) => void
}

// A select-only combobox (WAI-ARIA APG) so the open list can follow the app's styling.
export function TripSelect({ label, trips, value, disabled, onChange }: TripSelectProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, trips.findIndex((trip) => trip.id === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selected = trips.find((trip) => trip.id === value) ?? trips[0]
  const optionId = (index: number) => `${id}-option-${index}`

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex])

  useEffect(() => { if (disabled) setOpen(false) }, [disabled])

  const openAt = (index: number) => { setActiveIndex(index); setOpen(true) }
  const choose = (index: number) => {
    setOpen(false)
    const trip = trips[index]
    if (trip && trip.id !== value) onChange(trip.id)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const last = trips.length - 1
    const keys: Record<string, () => void> = open
      ? {
          ArrowDown: () => setActiveIndex((index) => Math.min(index + 1, last)),
          ArrowUp: () => event.altKey ? choose(activeIndex) : setActiveIndex((index) => Math.max(index - 1, 0)),
          Home: () => setActiveIndex(0),
          End: () => setActiveIndex(last),
          Enter: () => choose(activeIndex),
          ' ': () => choose(activeIndex),
          Escape: () => setOpen(false),
        }
      : {
          ArrowDown: () => openAt(selectedIndex),
          ArrowUp: () => openAt(selectedIndex),
          Home: () => openAt(0),
          End: () => openAt(last),
          Enter: () => openAt(selectedIndex),
          ' ': () => openAt(selectedIndex),
        }
    if (event.key === 'Tab') { setOpen(false); return }
    const action = keys[event.key]
    if (action) { event.preventDefault(); action(); return }
    if (event.key.length === 1 && /\S/.test(event.key)) {
      const start = open ? activeIndex + 1 : selectedIndex + 1
      const match = [...trips.slice(start), ...trips.slice(0, start)].find((trip) => trip.name.toLocaleLowerCase('vi').startsWith(event.key.toLocaleLowerCase('vi')))
      if (match) openAt(trips.indexOf(match))
    }
  }

  return (
    <div className={styles.select} ref={rootRef}>
      <span id={`${id}-label`}>{label}</span>
      <div
        className={styles.selectControl}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        aria-disabled={disabled || undefined}
        data-open={open || undefined}
        onClick={() => { if (!disabled) { if (open) setOpen(false); else openAt(selectedIndex) } }}
        onKeyDown={onKeyDown}
      >
        <span className={styles.selectValue}>{selected?.name}</span>
        <ChevronDown className={styles.selectChevron} size={18} aria-hidden="true" />
      </div>
      <ul className={styles.selectList} id={`${id}-listbox`} role="listbox" aria-labelledby={`${id}-label`} ref={listRef} hidden={!open} onMouseDown={(event) => event.preventDefault()}>
        {trips.map((trip, index) => (
          <li
            key={trip.id}
            id={optionId(index)}
            role="option"
            aria-selected={trip.id === selected?.id}
            data-active={index === activeIndex || undefined}
            onPointerEnter={() => setActiveIndex(index)}
            onClick={() => choose(index)}
          >
            <span className={styles.optionText}>
              <strong>{trip.name}</strong>
              <small>{trip.destination} · {formatDate(trip.startDate)} — {formatDate(trip.endDate)}</small>
            </span>
            {trip.id === selected?.id && <Check className={styles.optionCheck} size={18} aria-hidden="true" />}
          </li>
        ))}
      </ul>
    </div>
  )
}
