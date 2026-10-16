import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { travelRepository } from '../services/travelRepository'
import { useAuth } from './AuthProvider'

export const workspaceKey = (identity: string, tripId?: string) => ['workspace', identity, tripId ?? 'none'] as const
export const tripsKey = (identity: string) => ['trips', identity] as const
export const invitationsKey = (identity: string) => ['invitations', identity] as const
export const archivedTripsKey = (identity: string) => ['archived-trips', identity] as const

function readSelection(key: string) {
  try { return localStorage.getItem(key) }
  catch { return null }
}

function useWorkspaceState() {
  const { session, isDemo } = useAuth()
  const identity = session?.user.id ?? (isDemo ? 'demo' : 'anonymous')
  const enabled = isDemo || Boolean(session)
  const client = useQueryClient()
  const storageKey = `wander-plan:active-trip:${identity}`
  const [selection, setSelection] = useState<{ identity: string; id: string | null }>(() => ({ identity, id: readSelection(storageKey) }))
  const trips = useQuery({ queryKey: tripsKey(identity), queryFn: () => travelRepository.listTrips(), enabled })
  // Hidden invitation rows cannot deliver archive events to pending recipients.
  const invitations = useQuery({ queryKey: invitationsKey(identity), queryFn: () => travelRepository.loadInvitations(), enabled, refetchInterval: 15_000 })
  const archivedTrips = useQuery({ queryKey: archivedTripsKey(identity), queryFn: () => travelRepository.listArchivedTrips(), enabled })
  const requestedId = selection.identity === identity ? selection.id : readSelection(storageKey)
  const tripId = trips.data?.find((trip) => trip.id === requestedId)?.id ?? trips.data?.[0]?.id
  const workspace = useQuery({
    queryKey: workspaceKey(identity, tripId),
    queryFn: () => travelRepository.loadWorkspace(tripId),
    enabled: enabled && Boolean(tripId),
  })

  const selectTrip = (id: string) => {
    try { localStorage.setItem(storageKey, id) }
    catch { /* Selection still works for this session if storage is blocked. */ }
    setSelection({ identity, id })
  }

  useEffect(() => {
    if (!supabase || !session) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let metadataDirty = false
    const refresh = (metadataChanged = true) => {
      metadataDirty ||= metadataChanged
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (metadataDirty) {
          void client.invalidateQueries({ queryKey: tripsKey(identity) })
          void client.invalidateQueries({ queryKey: invitationsKey(identity) })
          void client.invalidateQueries({ queryKey: archivedTripsKey(identity) })
          void client.invalidateQueries({ queryKey: ['workspace', identity] })
        } else {
          void client.invalidateQueries({ queryKey: workspaceKey(identity, tripId) })
        }
        metadataDirty = false
      }, 100)
    }
    const channel = supabase.channel(`workspace-${identity}-${tripId ?? 'none'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `user_id=eq.${identity}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_invitations' }, () => refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        void client.invalidateQueries({ queryKey: ['workspace', identity] })
      })
    if (tripId) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, () => refresh())
      for (const table of ['trip_members', 'itinerary_items', 'expenses', 'checklist_items']) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `trip_id=eq.${tripId}` }, () => refresh(table === 'trip_members'))
      }
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'expense_participants' }, () => refresh(false))
    }
    channel.subscribe()
    return () => { clearTimeout(timer); void supabase?.removeChannel(channel) }
  }, [client, identity, session?.user.id, tripId])

  return { identity, tripId, selectTrip, trips, invitations, archivedTrips, workspace }
}

const WorkspaceContext = createContext<ReturnType<typeof useWorkspaceState> | null>(null)

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const value = useWorkspaceState()
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspaceContext() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('WorkspaceProvider is required')
  return value
}
