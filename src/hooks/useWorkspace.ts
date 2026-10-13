import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { travelRepository } from '../services/travelRepository'
import type { Expense, ExpenseDraft, ItineraryDraft, ItineraryItem, Trip, TripDraft, TripImportDraft } from '../types'

const workspaceKey = (identity: string) => ['workspace', identity] as const
const peopleKey = (tripId: string) => ['trip-people', tripId] as const

export function useWorkspace() {
  const client = useQueryClient()
  const { isDemo, session } = useAuth()
  const identity = session?.user.id ?? (isDemo ? 'demo' : 'anonymous')
  const query = useQuery({
    queryKey: workspaceKey(identity),
    queryFn: () => travelRepository.loadWorkspace(),
    enabled: isDemo || Boolean(session),
  })

  useEffect(() => {
    if (!supabase || !session) return
    const realtimeClient = supabase
    const refresh = () => void client.invalidateQueries({ queryKey: workspaceKey(identity) })
    const channel = realtimeClient
      .channel(`workspace-${identity}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary_items' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_participants' }, refresh)
      .subscribe()
    return () => { void realtimeClient.removeChannel(channel) }
  }, [client, identity, session])

  return query
}

export function useTripPeople(tripId?: string) {
  return useQuery({
    queryKey: peopleKey(tripId ?? 'none'),
    queryFn: () => travelRepository.loadTripPeople(tripId!),
    enabled: Boolean(tripId),
  })
}

export function useWorkspaceMutations() {
  const client = useQueryClient()
  const { isDemo, session } = useAuth()
  const identity = session?.user.id ?? (isDemo ? 'demo' : 'anonymous')
  const refresh = () => client.invalidateQueries({ queryKey: workspaceKey(identity) })

  const itinerary = useMutation({
    mutationFn: ({ draft, tripId, existing }: { draft: ItineraryDraft; tripId: string; existing?: ItineraryItem }) =>
      travelRepository.saveItinerary(draft, tripId, existing),
    onSuccess: refresh,
  })

  const deleteItinerary = useMutation({
    mutationFn: (item: ItineraryItem) => travelRepository.deleteItinerary(item),
    onSuccess: refresh,
  })

  const expense = useMutation({
    mutationFn: ({ draft, tripId, existing }: { draft: ExpenseDraft; tripId: string; existing?: Expense }) =>
      travelRepository.saveExpense(draft, tripId, existing),
    onSuccess: refresh,
  })

  const deleteExpense = useMutation({
    mutationFn: (item: Expense) => travelRepository.deleteExpense(item),
    onSuccess: refresh,
  })

  const importTripData = useMutation({
    mutationFn: ({ draft, tripId }: { draft: TripImportDraft; tripId: string }) =>
      travelRepository.importTripData(draft, tripId),
    onSuccess: refresh,
  })

  const createTrip = useMutation({
    mutationFn: () => travelRepository.createDefaultTrip(),
    onSuccess: refresh,
  })

  const updateTrip = useMutation({
    mutationFn: ({ draft, existing }: { draft: TripDraft; existing: Trip }) => travelRepository.updateTrip(draft, existing),
    onSuccess: refresh,
  })

  const inviteMember = useMutation({
    mutationFn: ({ tripId, email }: { tripId: string; email: string }) => travelRepository.inviteMember(tripId, email),
    onSuccess: (_, variables) => Promise.all([
      client.invalidateQueries({ queryKey: workspaceKey(identity) }),
      client.invalidateQueries({ queryKey: peopleKey(variables.tripId) }),
    ]),
  })

  const removeMember = useMutation({
    mutationFn: ({ tripId, userId }: { tripId: string; userId: string }) => travelRepository.removeMember(tripId, userId),
    onSuccess: (_, variables) => Promise.all([
      client.invalidateQueries({ queryKey: workspaceKey(identity) }),
      client.invalidateQueries({ queryKey: peopleKey(variables.tripId) }),
    ]),
  })

  return { itinerary, deleteItinerary, expense, deleteExpense, importTripData, createTrip, updateTrip, inviteMember, removeMember }
}
