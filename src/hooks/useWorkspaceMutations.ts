import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { travelRepository } from '../services/travelRepository'
import { singleFlight } from '../lib/singleFlight'
import { archivedTripsKey, invitationsKey, tripsKey, useWorkspaceContext, workspaceKey } from '../providers/WorkspaceProvider'
import type { ChecklistDraft, ChecklistItem, Expense, ExpenseDraft, ItineraryDraft, ItineraryItem, SettlementPayment, Trip, TripDraft, TripImportDraft, WorkspaceData, TrashedItineraryItem } from '../types'

export function useWorkspaceMutations() {
  const client = useQueryClient()
  const { identity, tripId, selectTrip } = useWorkspaceContext()
  const currentIdentity = useRef(identity)
  currentIdentity.current = identity
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const isCurrent = (origin: string) => mounted.current && currentIdentity.current === origin
  const write = <T,>(key: string, action: () => Promise<T>) => singleFlight(`${identity}:${key}`, () => {
    if (!isCurrent(identity)) throw new Error('Phiên đăng nhập đã thay đổi. Hãy thử lại.')
    return action()
  })
  const refresh = async (id = tripId, includeTrips = false) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: workspaceKey(identity, id) }),
      ...(includeTrips ? [client.invalidateQueries({ queryKey: tripsKey(identity) }), client.invalidateQueries({ queryKey: archivedTripsKey(identity) })] : []),
    ])
  }
  const capture = () => ({ identity, refresh, selectTrip })
  const itinerary = useMutation({
    onMutate: capture,
    mutationFn: ({ draft, tripId: id, existing }: { draft: ItineraryDraft; tripId: string; existing?: ItineraryItem }) => write(`itinerary:${id}:${existing?.id ?? 'new'}`, () => travelRepository.saveItinerary(draft, id, existing)),
    onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId),
  })
  const deleteItinerary = useMutation({ onMutate: capture, mutationFn: (item: ItineraryItem) => write(`delete-itinerary:${item.id}`, () => travelRepository.deleteItinerary(item)), onSuccess: (_, item, origin) => origin?.refresh(item.tripId, true) })
  const deleteItineraries = useMutation({ onMutate: capture,
    mutationFn: ({ tripId: id, items }: { tripId: string; items: ItineraryItem[] }) => write(`delete-itineraries:${id}`, () => travelRepository.deleteItineraries(id, items)),
    onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId, true),
    onError: (_, variables, origin) => origin?.refresh(variables.tripId, true),
  })
  const restoreItinerary = useMutation({ onMutate: capture,
    mutationFn: (item: TrashedItineraryItem) => write(`restore-itinerary:${item.tripId}:${item.id}`, () => travelRepository.restoreItinerary(item)),
    onSuccess: (_, item, origin) => origin?.refresh(item.tripId, true),
    onError: (_, item, origin) => origin?.refresh(item.tripId, true),
  })
  const rescheduleTrip = useMutation({ onMutate: capture,
    mutationFn: ({ source, startDate, shiftExpenses }: { source: WorkspaceData; startDate: string; shiftExpenses: boolean }) => write(`reschedule:${source.trip.id}`, () => travelRepository.rescheduleTrip(source, startDate, shiftExpenses)),
    onSuccess: (_, variables, origin) => origin?.refresh(variables.source.trip.id, true),
    onError: (_, variables, origin) => origin?.refresh(variables.source.trip.id, true),
  })
  const cloneTrip = useMutation({ onMutate: capture,
    mutationFn: ({ source, name, startDate, requestId }: { source: WorkspaceData; name: string; startDate: string; requestId: string }) => write(`clone:${requestId}`, () => travelRepository.cloneTrip(source, name, startDate, requestId)),
    onSuccess: async (id, _, origin) => { if (!origin) return; await origin.refresh(id, true); if (isCurrent(origin.identity)) origin.selectTrip(id) },
    onError: (_, variables, origin) => origin?.refresh(variables.source.trip.id, true),
  })
  const expense = useMutation({ onMutate: capture,
    mutationFn: ({ draft, tripId: id, existing }: { draft: ExpenseDraft; tripId: string; existing?: Expense }) => write(`expense:${id}:${existing?.id ?? 'new'}`, () => travelRepository.saveExpense(draft, id, existing)),
    onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId),
  })
  const deleteExpense = useMutation({ onMutate: capture, mutationFn: (item: Expense) => write(`delete-expense:${item.id}`, () => travelRepository.deleteExpense(item)), onSuccess: (_, item, origin) => origin?.refresh(item.tripId) })
  const importTripData = useMutation({ onMutate: capture, mutationFn: ({ draft, tripId: id }: { draft: TripImportDraft; tripId: string }) => write(`import:${id}`, () => travelRepository.importTripData(draft, id)), onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId) })
  const createTrip = useMutation({ onMutate: capture,
    mutationFn: ({ draft, requestId }: { draft: TripDraft; requestId: string }) => write(`create:${requestId}`, () => travelRepository.createTrip(draft, requestId)),
    onSuccess: async (id, _, origin) => { if (!origin) return; await origin.refresh(id, true); if (isCurrent(origin.identity)) origin.selectTrip(id) },
  })
  const updateTrip = useMutation({ onMutate: capture, mutationFn: ({ draft, existing }: { draft: TripDraft; existing: Trip }) => write(`trip:${existing.id}`, () => travelRepository.updateTrip(draft, existing)), onSuccess: (_, variables, origin) => origin?.refresh(variables.existing.id, true) })
  const inviteMember = useMutation({ onMutate: capture, mutationFn: ({ tripId: id, email }: { tripId: string; email: string }) => write(`invite:${id}:${email.trim().toLowerCase()}`, () => travelRepository.inviteMember(id, email)), onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId) })
  const revokeInvitation = useMutation({ onMutate: capture, mutationFn: ({ tripId: id, email }: { tripId: string; email: string }) => write(`revoke:${id}:${email}`, () => travelRepository.revokeInvitation(id, email)), onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId) })
  const removeMember = useMutation({ onMutate: capture, mutationFn: ({ tripId: id, userId }: { tripId: string; userId: string }) => write(`remove:${id}:${userId}`, () => travelRepository.removeMember(id, userId)), onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId) })
  const respondInvitation = useMutation({ onMutate: capture,
    mutationFn: ({ tripId: id, accept }: { tripId: string; accept: boolean }) => write(`respond:${id}`, () => travelRepository.respondInvitation(id, accept)),
    onSuccess: async (_, variables, origin) => { if (!origin) return; await Promise.all([origin.refresh(variables.tripId, true), client.invalidateQueries({ queryKey: invitationsKey(origin.identity) })]); if (variables.accept && isCurrent(origin.identity)) origin.selectTrip(variables.tripId) },
    onError: (_, __, origin) => { if (origin) void client.invalidateQueries({ queryKey: invitationsKey(origin.identity) }) },
  })
  const displayName = useMutation({ onMutate: capture,
    mutationFn: (name: string) => write('profile-name', () => travelRepository.saveDisplayName(name)),
    onSuccess: (_, __, origin) => client.invalidateQueries({ queryKey: ['workspace', origin?.identity ?? identity] }),
  })
  const checklist = useMutation({ onMutate: capture,
    mutationFn: ({ draft, tripId: id, existing }: { draft: ChecklistDraft; tripId: string; existing?: ChecklistItem }) => write(`checklist:${id}:${existing?.id ?? 'new'}`, () => travelRepository.saveChecklist(draft, id, existing)),
    onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId),
    onError: (_, variables, origin) => origin?.refresh(variables.tripId),
  })
  const deleteChecklist = useMutation({ onMutate: capture,
    mutationFn: (item: ChecklistItem) => write(`checklist:${item.tripId}:${item.id}`, () => travelRepository.deleteChecklist(item)),
    onSuccess: (_, item, origin) => origin?.refresh(item.tripId),
    onError: (_, item, origin) => origin?.refresh(item.tripId),
  })
  const recordPayment = useMutation({ onMutate: capture,
    mutationFn: ({ tripId: id, fromUserId, amountVnd, expectedCount }: { tripId: string; fromUserId: string; amountVnd: number; expectedCount: number }) => write(`payment:${id}`, () => travelRepository.recordSettlementPayment(id, fromUserId, amountVnd, expectedCount)),
    onSuccess: (_, variables, origin) => origin?.refresh(variables.tripId),
    onError: (_, variables, origin) => origin?.refresh(variables.tripId),
  })
  const undoPayment = useMutation({ onMutate: capture,
    mutationFn: (payment: SettlementPayment) => write(`undo-payment:${payment.id}`, () => travelRepository.undoSettlementPayment(payment)),
    onSuccess: (_, payment, origin) => origin?.refresh(payment.tripId),
    onError: (_, payment, origin) => origin?.refresh(payment.tripId),
  })
  const archiveTrip = useMutation({ onMutate: capture,
    mutationFn: ({ tripId: id, archived, version }: { tripId: string; archived: boolean; version: number }) => write(`archive:${id}`, () => travelRepository.setTripArchived(id, archived, version)),
    onSuccess: async (_, variables, origin) => {
      if (!origin) return
      await client.cancelQueries({ queryKey: workspaceKey(origin.identity, variables.tripId) })
      client.setQueryData(workspaceKey(origin.identity, variables.tripId), null)
      await Promise.all([origin.refresh(variables.tripId, true), client.invalidateQueries({ queryKey: invitationsKey(origin.identity) })])
      if (!variables.archived && isCurrent(origin.identity)) origin.selectTrip(variables.tripId)
    },
    onError: (_, variables, origin) => origin?.refresh(variables.tripId, true),
  })
  return { restoreItinerary, rescheduleTrip, cloneTrip, deleteItineraries, archiveTrip, checklist, recordPayment, undoPayment, deleteChecklist, displayName, itinerary, deleteItinerary, expense, deleteExpense, importTripData, createTrip, updateTrip, inviteMember, revokeInvitation, removeMember, respondInvitation }
}
