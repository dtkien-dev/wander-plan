import { demoWorkspace } from '../data/demoData'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { travelRepository } from './travelRepository'

const transport = vi.hoisted(() => ({ fetch: vi.fn() }))
vi.mock('../lib/supabase', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient('http://localhost:54321', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: transport.fetch },
  })
  vi.spyOn(client.auth, 'getSession').mockResolvedValue({
    data: { session: { user: { id: 'alice', email: 'alice@example.com' } } }, error: null,
  } as any)
  return { supabase: client }
})

const trip = { id: 'trip', name: 'Trip', destination: 'Huế', start_date: '2026-11-01', end_date: '2026-11-02', timezone: 'Asia/Ho_Chi_Minh', budget_vnd: 0, max_members: 4, version: 1 }
let records: Record<string, any[]>
let cap: number
let requests: URL[]
let failure: string | undefined
let changeCount: boolean
let siteAdmin: boolean

beforeEach(() => {
  cap = 1000
  siteAdmin = false
  requests = []
  failure = undefined
  changeCount = false
  records = {
    trips: [trip], profiles: [{ display_name: 'Alice' }],
    trip_members: [{ user_id: 'alice', role: 'owner' }],
    get_trip_people: [{ user_id: 'alice', email: 'alice@example.com', display_name: 'Alice', role: 'owner', status: 'active', joined_at: null }],
  }
  transport.fetch.mockImplementation(async (input: string, init: RequestInit) => {
    const url = new URL(input)
    requests.push(url)
    const name = url.pathname.split('/').at(-1)!
    if (name === 'get_my_site_admin_status') return new Response(JSON.stringify(siteAdmin), { status: 200 })
    const rows = records[name] ?? []
    if (name === 'profiles') return new Response(JSON.stringify(rows[0]), { status: 200 })
    const offset = Number(url.searchParams.get('offset') ?? 0)
    if (name === failure && offset > 0) return new Response(JSON.stringify({ message: 'Later page failed' }), { status: 403 })
    const limit = Math.min(Number(url.searchParams.get('limit') ?? cap), cap)
    const page = rows.slice(offset, offset + limit)
    const exact = new Headers(init.headers).get('Prefer')?.includes('count=exact')
    const count = rows.length + (changeCount && offset > 0 ? 1 : 0)
    return new Response(JSON.stringify(page), {
      status: 200,
      headers: { 'Content-Range': `${offset}-${offset + page.length - 1}/${exact ? count : '*'}` },
    })
  })
})

describe('Supabase repository pagination through the real SDK', () => {
  it('loads an admin workspace without inventing membership and maps its creator', async () => {
    siteAdmin = true
    records.trip_members = [{ user_id: 'someone-else', role: 'owner' }]
    records.trips = [{ ...trip, created_by: 'someone-else' }]
    const workspace = await travelRepository.loadWorkspace('trip')
    expect(workspace).toMatchObject({ isSiteAdmin: true, currentRole: 'owner', currentUserId: 'alice', memberCount: 1, trip: { createdByUserId: 'someone-else' } })
    siteAdmin = false
    await expect(travelRepository.loadWorkspace('trip')).rejects.toThrow('chưa thuộc chuyến')
  })

  it('sends role changes with the captured old role and propagates server denials', async () => {
    transport.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await travelRepository.setMemberRole('trip', 'bob', 'owner', 'editor')
    const [url, init] = transport.fetch.mock.calls.at(-1)!
    expect(String(url)).toContain('/rpc/set_trip_member_role')
    expect(JSON.parse(init.body)).toEqual({ target_trip_id: 'trip', target_user_id: 'bob', new_role: 'owner', expected_role: 'editor' })
    transport.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Only creator' }), { status: 403 }))
    await expect(travelRepository.setMemberRole('trip', 'bob', 'editor', 'owner')).rejects.toThrow('Only creator')
  })
  it('loads all workspace rows and counts undone payments beyond the API cap', async () => {
    for (const name of ['itinerary_items', 'expenses', 'checklist_items', 'settlement_payments', 'get_trip_former_people']) {
      records[name] = Array.from({ length: 1001 }, (_, index) => ({
        id: `${name}-${index}`, trip_id: trip.id, user_id: `former-${index}`, title: `Item ${index}`, version: 1,
        visit_date: trip.start_date, start_time: '08:00:00', end_time: '09:00:00', estimated_cost_vnd: 0,
        category: 'food', expense_date: trip.start_date, estimated_amount_vnd: 0, actual_amount_vnd: 100,
        paid_by: 'alice', split_method: 'equal', expense_participants: [{ user_id: 'alice' }],
        completed: false, assigned_to: null,
        from_user_id: 'bob', to_user_id: 'alice', amount_vnd: 100, created_at: '2026-10-17T00:00:00Z',
        deleted_at: index < 1000 ? '2026-10-17T01:00:00Z' : null,
        display_name: `Former ${index}`,
      }))
    }
    records.trip_members = [...Array.from({ length: 1000 }, (_, index) => ({ user_id: `member-${index}`, role: 'editor' })), { user_id: 'alice', role: 'owner' }]
    const workspace = (await travelRepository.loadWorkspace(trip.id))!
    expect(workspace).toMatchObject({ memberCount: 1001, currentUserId: 'alice', currentRole: 'owner' })
    expect(workspace.itinerary).toHaveLength(1001)
    expect(workspace.expenses).toHaveLength(1001)
    expect(workspace.checklist).toHaveLength(1001)
    expect(workspace.formerPeople).toHaveLength(1001)
    expect(workspace.settlementPaymentCount).toBe(1001)
    expect(workspace.settlementPayments).toEqual([expect.objectContaining({ id: 'settlement_payments-1000', amountVnd: 100 })])
    expect(workspace.expenses.at(-1)).toMatchObject({ id: 'expenses-1000', participantUserIds: ['alice'] })
    const profileIndex = requests.findIndex((url) => url.pathname.endsWith('/profiles'))
    const secondPageIndex = requests.findIndex((url) => url.searchParams.get('offset') === '1000')
    expect(profileIndex).toBeLessThan(secondPageIndex)
    expect(requests.findIndex((url) => url.pathname.endsWith('/get_trip_people'))).toBeLessThan(secondPageIndex)
    for (const url of requests.filter((url) => url.searchParams.has('offset'))) {
      expect(url.searchParams.get('trip_id') ?? url.pathname.startsWith('/rest/v1/rpc/')).toBeTruthy()
      expect(url.searchParams.get('order')).toBeTruthy()
    }
  })

  it('loads metadata and people even when the server cap is smaller than the requested page', async () => {
    cap = 2
    records.trips = Array.from({ length: 5 }, (_, index) => ({ ...trip, id: `trip-${index}` }))
    records.get_my_archived_trips = records.trips.map((row) => ({ ...row, archived_at: '2026-10-17T00:00:00Z' }))
    records.get_my_trip_invitations = records.trips.map((row) => ({ ...row, trip_id: row.id, trip_name: row.name }))
    records.get_trip_people = Array.from({ length: 5 }, (_, index) => ({ ...records.get_trip_people[0], user_id: `user-${index}`, email: `person${index}@example.com` }))
    expect((await travelRepository.listTrips()).map((row) => row.id)).toEqual(records.trips.map((row) => row.id))
    expect(await travelRepository.listArchivedTrips()).toHaveLength(5)
    expect(await travelRepository.loadInvitations()).toHaveLength(5)
    expect(await travelRepository.loadTripPeople(trip.id)).toHaveLength(5)
  })

  it.each(['trips', 'get_my_archived_trips'])('rejects later-page errors instead of returning partial %s', async (name) => {
    cap = 1
    records[name] = [trip, { ...trip, id: 'second-trip' }]
    failure = name
    const load = name === 'trips' ? () => travelRepository.listTrips() : () => travelRepository.listArchivedTrips()
    await expect(load()).rejects.toThrow('Later page failed')
  })

  it('rejects a changing row count instead of accepting a mixed partial list', async () => {
    cap = 1
    records.trips = [trip, { ...trip, id: 'second-trip' }]
    changeCount = true
    await expect(travelRepository.listTrips()).rejects.toThrow('Dữ liệu đã thay đổi')
  })

  it.each(['*/1', '*/*'])('rejects incomplete or uncounted responses (%s)', async (contentRange) => {
    transport.fetch.mockResolvedValueOnce(new Response('[]', { headers: { 'Content-Range': contentRange } }))
    await expect(travelRepository.listTrips()).rejects.toThrow('chưa tải đủ')
  })
})

 it('sends selected IDs and versions in one RPC and surfaces database rejection', async () => {
  const items = [{ id: 'first', version: 3 }, { id: 'second', version: 5 }] as import('../types').ItineraryItem[]
  transport.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
  await travelRepository.deleteItineraries('trip', items)
  const [url, init] = transport.fetch.mock.calls.at(-1)!
  expect(String(url)).toContain('/rpc/delete_trip_itinerary_items')
  expect(JSON.parse(init.body)).toEqual({ target_trip_id: 'trip', selected_items: [{ id: 'first', version: 3 }, { id: 'second', version: 5 }] })
  transport.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Lịch trình đã thay đổi.', code: '40001' }), { status: 400 }))
  await expect(travelRepository.deleteItineraries('trip', items)).rejects.toThrow('Lịch trình đã thay đổi.')
})

it('serializes planning and restore RPCs with version snapshots rather than financial payloads', async () => {
  const source = structuredClone(demoWorkspace)
  transport.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
  await travelRepository.rescheduleTrip(source, '2027-01-01', true)
  let [url, init] = transport.fetch.mock.calls.at(-1)!
  expect(String(url)).toContain('/rpc/reschedule_trip')
  let body = JSON.parse(init.body)
  expect(body).toMatchObject({ target_trip_id: source.trip.id, expected_version: source.trip.version, new_start_date: '2027-01-01', shift_expenses: true })
  expect(body.expected_expenses).toHaveLength(source.expenses.length)
  expect(body.expected_expenses[0]).toEqual({ id: expect.any(String), version: expect.any(Number) })
  transport.fetch.mockResolvedValueOnce(new Response(JSON.stringify('new-copy'), { status: 200 }))
  expect(await travelRepository.cloneTrip(source, ' Copy ', '2027-01-01', 'request')).toBe('new-copy')
  ;[url, init] = transport.fetch.mock.calls.at(-1)!
  expect(String(url)).toContain('/rpc/clone_trip_template')
  body = JSON.parse(init.body)
  expect(body).toMatchObject({ source_trip_id: source.trip.id, request_id: 'request', new_trip_name: 'Copy' })
  expect(body).not.toHaveProperty('expenses')
  const item = { ...source.itinerary[0], deletedAt: '', expiresAt: '' }
  transport.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
  await travelRepository.restoreItinerary(item)
  ;[url, init] = transport.fetch.mock.calls.at(-1)!
  expect(String(url)).toContain('/rpc/restore_trip_itinerary_item')
  expect(JSON.parse(init.body)).toEqual({ target_trip_id: item.tripId, target_item_id: item.id, expected_version: item.version, expected_deleted_at: item.deletedAt })
  const trashed = { ...source.expenses[0], deletedAt: '2026-10-29T10:00:00Z', expiresAt: '2026-11-05T10:00:00Z', deletedByUserId: 'demo-owner' }
  transport.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
  await travelRepository.restoreExpense(trashed)
  ;[url, init] = transport.fetch.mock.calls.at(-1)!
  expect(String(url)).toContain('/rpc/restore_trip_expense')
  expect(JSON.parse(init.body)).toEqual({ target_trip_id: trashed.tripId, target_expense_id: trashed.id, expected_version: trashed.version, expected_deleted_at: trashed.deletedAt })
})
