import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceProvider, useWorkspaceContext } from './WorkspaceProvider'
import { App } from '../App'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import type { Trip, TripInvitation, WorkspaceData } from '../types'

const authState = vi.hoisted(() => ({ session: { user: { id: 'alice' } } as Session, isDemo: false }))
const repository = vi.hoisted(() => ({ listTrips: vi.fn(), loadInvitations: vi.fn(), loadWorkspace: vi.fn(), respondInvitation: vi.fn(), updateTrip: vi.fn() }))
const realtime = vi.hoisted(() => ({ channel: vi.fn(), removeChannel: vi.fn() }))
vi.mock('./AuthProvider', () => ({ useAuth: () => authState }))
vi.mock('../services/travelRepository', () => ({ travelRepository: repository }))
vi.mock('../lib/supabase', () => ({ supabase: realtime }))
vi.mock('../components/AppShell', () => ({ AppShell: () => <><Consumer name="first" /><Consumer name="second" /></> }))

type Handler = { table: string; filter?: string; callback: () => void }
type Channel = { handlers: Handler[]; on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> }
let channels: Channel[]
let activeChannels: Set<Channel>
let response: Promise<void> | undefined

const trip = (id: string): Trip => ({ id, name: id, destination: 'Test destination', startDate: '2026-11-01', endDate: '2026-11-02', timezone: 'Asia/Ho_Chi_Minh', budgetVnd: 0, maxMembers: 4, version: 1 })
const workspace = (id: string): WorkspaceData => ({ trip: trip(id), people: [], itinerary: [], expenses: [], memberCount: 1, currentRole: 'owner', currentUserId: authState.session.user.id })
const invitation: TripInvitation = { tripId: 'trip-b', tripName: 'Trip B', destination: 'Test destination', startDate: '2026-11-01', endDate: '2026-11-02' }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((finish) => { resolve = finish })
  return { promise, resolve }
}

function Consumer({ name }: { name: string }) {
  const query = useWorkspace()
  const { identity, tripId, selectTrip, invitations } = useWorkspaceContext()
  const { respondInvitation } = useWorkspaceMutations()
  return <>
    <output aria-label={`identity-${name}`}>{identity}</output>
    <output aria-label={`trip-${name}`}>{tripId ?? 'none'}</output>
    <output aria-label={`data-${name}`}>{query.data?.trip.id ?? 'empty'}</output>
    <output aria-label={`invitations-${name}`}>{invitations.data?.length ?? 0}</output>
    <input aria-label={`draft-${name}`} defaultValue="" />
    <button onClick={() => selectTrip('trip-b')}>B-{name}</button>
    <button onClick={() => selectTrip('trip-c')}>C-{name}</button>
    <button onClick={() => { response = respondInvitation.mutateAsync({ tripId: 'trip-b', accept: true }); void response.catch(() => {}) }}>Accept-{name}</button>
  </>
}

function tree(client: QueryClient) {
  return <QueryClientProvider client={client}><WorkspaceProvider><Consumer name="first" /><Consumer name="second" /></WorkspaceProvider></QueryClientProvider>
}
function appTree(client: QueryClient) {
  return <QueryClientProvider client={client}><HashRouter><App /></HashRouter></QueryClientProvider>
}
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } })
  client.setQueryData(['trips', 'alice'], [trip('trip-a'), trip('trip-b'), trip('trip-c')])
  return { client, ...render(tree(client)) }
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  authState.session = { user: { id: 'alice' } } as Session
  channels = []
  activeChannels = new Set()
  response = undefined
  repository.listTrips.mockResolvedValue([trip('trip-a'), trip('trip-b'), trip('trip-c')])
  repository.loadInvitations.mockResolvedValue([invitation])
  repository.loadWorkspace.mockImplementation(async (id: string) => workspace(id))
  repository.respondInvitation.mockResolvedValue(undefined)
  realtime.channel.mockImplementation(() => {
    const channel: Channel = { handlers: [], on: vi.fn(), subscribe: vi.fn() }
    channel.on.mockImplementation((_event, options, callback) => { channel.handlers.push({ ...options, callback }); return channel })
    channel.subscribe.mockImplementation(() => { activeChannels.add(channel); return channel })
    channels.push(channel)
    return channel
  })
  realtime.removeChannel.mockImplementation(async (channel) => { activeChannels.delete(channel) })
})
afterEach(cleanup)

describe('WorkspaceProvider integration', () => {
  it('shares one scoped realtime channel across callers and refreshes incoming invitations', async () => {
    const { client, rerender, unmount } = mount()
    await waitFor(() => expect(screen.getByLabelText('data-second')).toHaveTextContent('trip-a'))
    await waitFor(() => expect(screen.getByLabelText('invitations-first')).toHaveTextContent('1'))
    expect(repository.loadWorkspace).toHaveBeenCalledOnce()
    expect(activeChannels.size).toBe(1)
    expect(realtime.channel).toHaveBeenCalledOnce()
    const channel = channels[0]
    expect(channel.handlers).toEqual(expect.arrayContaining([
      expect.objectContaining({ table: 'trip_members', filter: 'user_id=eq.alice' }),
      expect.objectContaining({ table: 'itinerary_items', filter: 'trip_id=eq.trip-a' }),
      expect.objectContaining({ table: 'expenses', filter: 'trip_id=eq.trip-a' }),
    ]))
    authState.session = { user: { id: 'alice' }, access_token: 'new-token' } as Session
    rerender(tree(client))
    expect(realtime.channel).toHaveBeenCalledOnce()
    repository.loadInvitations.mockResolvedValue([])
    act(() => {
      channel.handlers.find((handler) => handler.table === 'trip_invitations')!.callback()
      channel.handlers.find((handler) => handler.table === 'expenses')!.callback()
    })
    await waitFor(() => expect(screen.getByLabelText('invitations-second')).toHaveTextContent('0'))
    expect(repository.loadInvitations).toHaveBeenCalledTimes(2)
    expect(repository.listTrips).toHaveBeenCalledOnce()
    await waitFor(() => expect(repository.loadWorkspace).toHaveBeenCalledTimes(2))
    act(() => channel.handlers.find((handler) => handler.table === 'expenses')!.callback())
    await waitFor(() => expect(repository.loadWorkspace).toHaveBeenCalledTimes(3))
    expect(repository.listTrips).toHaveBeenCalledOnce()
    expect(repository.loadInvitations).toHaveBeenCalledTimes(2)
    unmount()
    expect(activeChannels.size).toBe(0)
  })

  it('keeps rapid trip switches isolated when an earlier workspace request finishes last', async () => {
    const pendingB = deferred<WorkspaceData>()
    const pendingC = deferred<WorkspaceData>()
    repository.loadWorkspace.mockImplementation((id: string) => id === 'trip-b' ? pendingB.promise : id === 'trip-c' ? pendingC.promise : Promise.resolve(workspace(id)))
    const { client } = mount()
    await waitFor(() => expect(screen.getByLabelText('data-first')).toHaveTextContent('trip-a'))
    fireEvent.click(screen.getByText('B-first'))
    expect(screen.getByLabelText('data-first')).toHaveTextContent('empty')
    fireEvent.click(screen.getByText('C-first'))
    expect(screen.getByLabelText('trip-second')).toHaveTextContent('trip-c')
    await act(async () => pendingC.resolve(workspace('trip-c')))
    await waitFor(() => expect(screen.getByLabelText('data-first')).toHaveTextContent('trip-c'))
    await act(async () => pendingB.resolve(workspace('trip-b')))
    expect(screen.getByLabelText('data-second')).toHaveTextContent('trip-c')
    expect(client.getQueryData<WorkspaceData>(['workspace', 'alice', 'trip-b'])?.trip.id).toBe('trip-b')
    expect(client.getQueryData<WorkspaceData>(['workspace', 'alice', 'trip-c'])?.trip.id).toBe('trip-c')
    expect(activeChannels.size).toBe(1)
  })

  it('falls back from a removed selected trip and removes its data when no trips remain', async () => {
    localStorage.setItem('wander-plan:active-trip:alice', 'trip-b')
    const { client } = mount()
    await waitFor(() => expect(screen.getByLabelText('data-first')).toHaveTextContent('trip-b'))
    act(() => client.setQueryData(['trips', 'alice'], [trip('trip-a')]))
    await waitFor(() => expect(screen.getByLabelText('data-second')).toHaveTextContent('trip-a'))
    act(() => client.setQueryData(['trips', 'alice'], []))
    await waitFor(() => expect(screen.getByLabelText('trip-first')).toHaveTextContent('none'))
    expect(screen.getByLabelText('data-second')).toHaveTextContent('empty')
  })

  it('does not let an invitation response from the previous account change the new account selection', async () => {
    const pendingResponse = deferred<void>()
    repository.respondInvitation.mockReturnValue(pendingResponse.promise)
    const { client, rerender } = mount()
    await waitFor(() => expect(screen.getByLabelText('data-first')).toHaveTextContent('trip-a'))
    fireEvent.click(screen.getByText('Accept-first'))
    await waitFor(() => expect(repository.respondInvitation).toHaveBeenCalledWith('trip-b', true))
    localStorage.setItem('wander-plan:active-trip:bob', 'trip-a')
    client.setQueryData(['trips', 'bob'], [trip('trip-a'), trip('trip-b')])
    authState.session = { user: { id: 'bob' } } as Session
    rerender(tree(client))
    await waitFor(() => expect(screen.getByLabelText('identity-first')).toHaveTextContent('bob'))
    await act(async () => { pendingResponse.resolve(); await response })
    expect(localStorage.getItem('wander-plan:active-trip:bob')).toBe('trip-a')
    expect(screen.getByLabelText('trip-first')).toHaveTextContent('trip-a')
  })

  it('remounts account-owned UI through the real App when the authenticated account changes', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } })
    client.setQueryData(['trips', 'alice'], [trip('trip-a')])
    client.setQueryData(['trips', 'bob'], [trip('trip-b')])
    const { rerender } = render(appTree(client))
    await waitFor(() => expect(screen.getByLabelText('identity-first')).toHaveTextContent('alice'))
    fireEvent.change(screen.getByLabelText('draft-first'), { target: { value: 'Alice private draft' } })
    authState.session = { user: { id: 'bob' } } as Session
    rerender(appTree(client))
    await waitFor(() => expect(screen.getByLabelText('identity-first')).toHaveTextContent('bob'))
    expect(screen.getByLabelText('draft-first')).toHaveValue('')
    expect(screen.getByLabelText('trip-first')).toHaveTextContent('trip-b')
    expect(activeChannels.size).toBe(1)
  })

  it('refreshes a completed save after its trip editor unmounts during a trip switch', async () => {
    const pendingSave = deferred<void>()
    let saved = false
    let save: Promise<void> | undefined
    repository.updateTrip.mockReturnValue(pendingSave.promise)
    repository.loadWorkspace.mockImplementation(async (id: string) => {
      const data = workspace(id)
      if (id === 'trip-a' && saved) data.trip.name = 'Saved trip A'
      return data
    })
    function Editor() {
      const query = useWorkspace()
      const { updateTrip } = useWorkspaceMutations()
      return <><output aria-label="saved-trip-name">{query.data?.trip.name ?? 'empty'}</output>
        <button onClick={() => {
          const current = query.data!.trip
          save = updateTrip.mutateAsync({ existing: current, draft: { name: 'Saved trip A', destination: current.destination, startDate: current.startDate, endDate: current.endDate, budgetVnd: current.budgetVnd, maxMembers: current.maxMembers } })
          void save.catch(() => {})
        }}>Save current trip</button></>
    }
    function Selection() {
      const { tripId, selectTrip } = useWorkspaceContext()
      return <><button onClick={() => selectTrip('trip-a')}>Select A</button><button onClick={() => selectTrip('trip-b')}>Select B</button><Editor key={tripId} /></>
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } })
    client.setQueryData(['trips', 'alice'], [trip('trip-a'), trip('trip-b')])
    render(<QueryClientProvider client={client}><WorkspaceProvider><Selection /></WorkspaceProvider></QueryClientProvider>)
    await waitFor(() => expect(screen.getByLabelText('saved-trip-name')).toHaveTextContent('trip-a'))
    fireEvent.click(screen.getByText('Save current trip'))
    await waitFor(() => expect(repository.updateTrip).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByText('Select B'))
    await waitFor(() => expect(screen.getByLabelText('saved-trip-name')).toHaveTextContent('trip-b'))
    await act(async () => { saved = true; pendingSave.resolve(); await save })
    fireEvent.click(screen.getByText('Select A'))
    await waitFor(() => expect(screen.getByLabelText('saved-trip-name')).toHaveTextContent('Saved trip A'))
    expect(repository.loadWorkspace.mock.calls.filter(([id]) => id === 'trip-a')).toHaveLength(2)
  })
})
