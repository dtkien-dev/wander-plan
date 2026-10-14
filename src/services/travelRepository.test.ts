import { beforeEach, describe, expect, it, vi } from 'vitest'
import { demoWorkspace } from '../data/demoData'
import { travelRepository } from './travelRepository'
import type { TripDraft, WorkspaceData } from '../types'

vi.mock('../lib/supabase', () => ({ supabase: null }))

const draft = (name: string, maxMembers = 4): TripDraft => ({
  name, destination: 'Huế', startDate: '2027-02-10', endDate: '2027-02-12', budgetVnd: 2_000_000, maxMembers,
})

const savedTrips = () => JSON.parse(localStorage.getItem('wander-plan-demo-trips-v2') ?? '[]') as WorkspaceData[]

beforeEach(() => {
  localStorage.clear()
})

describe('demo travel repository', () => {
  it('preserves the legacy saved trip when creating a trip in the new multi-trip store', async () => {
    const legacy = structuredClone(demoWorkspace)
    legacy.trip.name = 'Legacy plan'
    legacy.trip.id = 'legacy-trip'
    localStorage.setItem('wander-plan-demo-workspace-v1', JSON.stringify(legacy))

    await travelRepository.createTrip(draft('New plan'), 'new-trip')

    const trips = await travelRepository.listTrips()
    expect(trips.map(({ id, name }) => [id, name])).toEqual([
      ['legacy-trip', 'Legacy plan'],
      ['new-trip', 'New plan'],
    ])
    const storedLegacy = savedTrips().find((entry) => entry.trip.id === 'legacy-trip')
    expect(storedLegacy?.itinerary).toEqual(legacy.itinerary)
    expect(storedLegacy?.expenses).toEqual(legacy.expenses)
  })

  it('isolates members and invitation capacity between trips, then supports revoke and reinvite', async () => {
    await travelRepository.createTrip(draft('Small group', 3), 'small-trip')
    await travelRepository.createTrip(draft('Other group', 4), 'other-trip')

    await travelRepository.inviteMember('small-trip', ' first@example.com ')
    await travelRepository.inviteMember('small-trip', 'second@example.com')
    await expect(travelRepository.inviteMember('small-trip', 'third@example.com')).rejects.toThrow('hết số chỗ')
    await travelRepository.inviteMember('other-trip', 'third@example.com')

    let smallGroup = await travelRepository.loadTripPeople('small-trip')
    expect(smallGroup.filter((person) => person.status === 'invited')).toHaveLength(2)
    expect(smallGroup.map((person) => person.email)).toContain('first@example.com')
    expect((await travelRepository.loadTripPeople('other-trip')).map((person) => person.email)).toContain('third@example.com')

    await travelRepository.revokeInvitation('small-trip', 'first@example.com')
    await travelRepository.inviteMember('small-trip', ' FIRST@example.com ')
    smallGroup = await travelRepository.loadTripPeople('small-trip')
    expect(smallGroup.filter((person) => person.status === 'invited')).toHaveLength(2)
    expect(smallGroup.filter((person) => person.email === 'first@example.com')).toHaveLength(1)

    vi.useFakeTimers()
    try {
      const workspace = travelRepository.loadWorkspace('small-trip')
      await vi.advanceTimersByTimeAsync(180)
      expect((await workspace).memberCount).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns the same trip for repeated creation request ids', async () => {
    const id = await travelRepository.createTrip(draft('First payload'), 'request-once')
    const repeatedId = await travelRepository.createTrip(draft('Different retry payload'), 'request-once')

    expect(repeatedId).toBe(id)
    expect((await travelRepository.listTrips()).filter((trip) => trip.id === id)).toHaveLength(1)
    expect((await travelRepository.loadTripPeople(id))).toHaveLength(1)
  })
})
