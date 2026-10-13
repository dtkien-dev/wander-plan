import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { travelRepository } from '../services/travelRepository'
import type { Expense, ExpenseDraft, ItineraryDraft, ItineraryItem } from '../types'

const workspaceKey = ['workspace'] as const

export function useWorkspace() {
  return useQuery({ queryKey: workspaceKey, queryFn: () => travelRepository.loadWorkspace() })
}

export function useWorkspaceMutations() {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: workspaceKey })

  const itinerary = useMutation({
    mutationFn: ({ draft, existing }: { draft: ItineraryDraft; existing?: ItineraryItem }) =>
      travelRepository.saveItinerary(draft, existing),
    onSuccess: refresh,
  })

  const deleteItinerary = useMutation({
    mutationFn: (item: ItineraryItem) => travelRepository.deleteItinerary(item),
    onSuccess: refresh,
  })

  const expense = useMutation({
    mutationFn: ({ draft, existing }: { draft: ExpenseDraft; existing?: Expense }) =>
      travelRepository.saveExpense(draft, existing),
    onSuccess: refresh,
  })

  const deleteExpense = useMutation({
    mutationFn: (item: Expense) => travelRepository.deleteExpense(item),
    onSuccess: refresh,
  })

  const createTrip = useMutation({
    mutationFn: () => travelRepository.createDefaultTrip(),
    onSuccess: refresh,
  })

  return { itinerary, deleteItinerary, expense, deleteExpense, createTrip }
}
