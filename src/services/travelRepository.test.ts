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
  it('rejects exact-amount splits that do not match the expense', async () => {
    const draft = { title: 'Ăn tối', category: 'food' as const, expenseDate: '2026-11-27', endDate: null, estimatedAmountVnd: 0, actualAmountVnd: 150000,
      paidByUserId: 'demo-owner', participantUserIds: ['demo-owner', 'demo-editor'], splitMethod: 'amounts' as const,
      splitValues: { 'demo-owner': 50000, 'demo-editor': 90000 }, notes: '' }
    const workspace = await travelRepository.loadWorkspace('demo-trip')
    await expect(travelRepository.saveExpense({ ...draft, expenseDate: workspace!.trip.startDate }, 'demo-trip')).rejects.toThrow('thiếu')
  })
  it('records a payment for the recipient only once per seen state and lets the recipient undo it', async () => {
    const before = await travelRepository.loadWorkspace('demo-trip')
    expect(before!.settlementPayments).toEqual([])
    await travelRepository.recordSettlementPayment('demo-trip', 'demo-editor', 50_000, 0)
    await expect(travelRepository.recordSettlementPayment('demo-trip', 'demo-editor', 50_000, 0)).rejects.toThrow('vừa được cập nhật')
    await expect(travelRepository.recordSettlementPayment('demo-trip', 'demo-owner', 1_000, 1)).rejects.toThrow('người đã trả')
    const recorded = await travelRepository.loadWorkspace('demo-trip')
    expect(recorded!.settlementPayments).toEqual([expect.objectContaining({ fromUserId: 'demo-editor', toUserId: 'demo-owner', amountVnd: 50_000 })])
    await travelRepository.undoSettlementPayment(recorded!.settlementPayments![0])
    const undone = await travelRepository.loadWorkspace('demo-trip')
    expect(undone!.settlementPayments).toEqual([])
    expect(undone!.settlementPaymentCount).toBe(1)
  })
  it('hides an archived trip, preserves its data and requires a current owner version to restore', async () => {
    const before = await travelRepository.loadWorkspace('demo-trip')
    await travelRepository.saveChecklist({ title: 'Giấy tờ', assignedTo: 'demo-editor', completed: false }, 'demo-trip')
    await travelRepository.setTripArchived('demo-trip', true, before.trip.version)
    expect(await travelRepository.listTrips()).toEqual([])
    const archived = (await travelRepository.listArchivedTrips())[0]
    expect(archived).toMatchObject({ id: 'demo-trip', name: before.trip.name, version: before.trip.version + 1 })
    await expect(travelRepository.loadWorkspace('demo-trip')).rejects.toThrow('đã được lưu trữ')
    await expect(travelRepository.setTripArchived('demo-trip', false, before.trip.version)).rejects.toThrow('đã thay đổi')
    await travelRepository.setTripArchived('demo-trip', false, archived.version)
    const restored = await travelRepository.loadWorkspace('demo-trip')
    expect(restored.itinerary).toEqual(before.itinerary)
    expect(restored.expenses).toEqual(before.expenses)
    expect(restored.people).toEqual(before.people)
    expect(restored.checklist).toEqual([expect.objectContaining({ title: 'Giấy tờ', assignedTo: 'demo-editor' })])
    expect(await travelRepository.listArchivedTrips()).toEqual([])
  })
  it('keeps checklist per trip, rejects stale edits and unassigns a removed member', async () => {
    await travelRepository.createTrip(draft('Other trip'), 'other-trip')
    const newItem = { title: 'Áo mưa', assignedTo: 'demo-editor', completed: false }
    await travelRepository.saveChecklist(newItem, 'demo-trip')
    const original = (await travelRepository.loadWorkspace('demo-trip')).checklist![0]
    expect((await travelRepository.loadWorkspace('other-trip')).checklist).toEqual([])
    await travelRepository.saveChecklist({ ...newItem, completed: true }, 'demo-trip', original)
    await expect(travelRepository.deleteChecklist(original)).rejects.toThrow('đã thay đổi')
    for (const expense of (await travelRepository.loadWorkspace('demo-trip'))!.expenses) await travelRepository.deleteExpense(expense)
    await travelRepository.removeMember('demo-trip', 'demo-editor')
    const current = (await travelRepository.loadWorkspace('demo-trip')).checklist![0]
    expect(current).toMatchObject({ title: 'Áo mưa', completed: true, assignedTo: null })
    await travelRepository.deleteChecklist(current)
    expect((await travelRepository.loadWorkspace('demo-trip')).checklist).toEqual([])
  })
  it('blocks removing a member until their money is settled and then keeps their name for old expenses', async () => {
    await expect(travelRepository.removeMember('demo-trip', 'demo-editor')).rejects.toThrow('chưa có số Thực tế')
    const workspace = (await travelRepository.loadWorkspace('demo-trip'))!
    for (const expense of workspace.expenses.filter((entry) => entry.actualAmountVnd === null)) await travelRepository.deleteExpense(expense)
    await expect(travelRepository.removeMember('demo-trip', 'demo-editor')).rejects.toThrow('còn nợ 1.125.000 đ')
    await travelRepository.recordSettlementPayment('demo-trip', 'demo-editor', 1_125_000, 0)
    await travelRepository.removeMember('demo-trip', 'demo-editor')
    expect((await travelRepository.loadWorkspace('demo-trip'))!.formerPeople).toEqual([{ userId: 'demo-editor', displayName: 'Người bạn đồng hành' }])
    const after = (await travelRepository.loadWorkspace('demo-trip'))!
    const locked = after.expenses[0]
    await expect(travelRepository.deleteExpense(locked)).rejects.toThrow('không thể xóa')
    await expect(travelRepository.saveExpense({ ...locked, actualAmountVnd: (locked.actualAmountVnd ?? 0) + 1000 }, 'demo-trip', locked)).rejects.toThrow('không thể đổi số tiền')
    await travelRepository.saveExpense({ ...locked, title: 'Đã đổi tên' }, 'demo-trip', locked)
    await expect(travelRepository.undoSettlementPayment(after.settlementPayments![0])).rejects.toThrow('giữ nguyên')
  })
  it('persists an optional own name across existing and newly created trips', async () => {
    await travelRepository.createTrip(draft('Other trip'), 'other-trip')
    await travelRepository.saveDisplayName('  An  ')
    await travelRepository.createTrip(draft('Third trip'), 'third-trip')
    for (const trip of await travelRepository.listTrips()) {
      expect((await travelRepository.loadTripPeople(trip.id)).find((person) => person.userId === 'demo-owner')?.displayName).toBe('An')
    }
    await travelRepository.saveDisplayName('')
    expect((await travelRepository.loadTripPeople('third-trip'))[0].displayName).toBe('ban')
    expect((await travelRepository.loadTripPeople('demo-trip'))[1].displayName).toBe('Người bạn đồng hành')
  })
  it('reads saved demo expenses from before date ranges as single-day expenses', async () => {
    const saved = structuredClone(demoWorkspace)
    saved.expenses.forEach((expense) => { delete (expense as Partial<typeof expense>).endDate })
    localStorage.setItem('wander-plan-demo-trips-v2', JSON.stringify([saved]))

    const workspace = await travelRepository.loadWorkspace(saved.trip.id)

    expect(workspace.expenses.every((expense) => expense.endDate === null)).toBe(true)
  })

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
