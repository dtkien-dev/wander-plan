export type MemberRole = 'owner' | 'editor'
export type ExpenseCategory = 'food' | 'transport' | 'stay' | 'ticket' | 'other'

export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  budgetVnd: number
  version: number
}

export type TripDraft = Pick<Trip, 'name' | 'destination' | 'startDate' | 'endDate' | 'budgetVnd'>

export interface TripPerson {
  userId: string | null
  email: string
  displayName: string
  role: MemberRole
  status: 'active' | 'invited'
  joinedAt: string | null
}

export interface ItineraryItem {
  id: string
  tripId: string
  title: string
  visitDate: string
  startTime: string
  endTime: string
  estimatedCostVnd: number
  address: string
  mapsUrl: string
  notes: string
  version: number
}

export interface Expense {
  id: string
  tripId: string
  title: string
  category: ExpenseCategory
  expenseDate: string
  estimatedAmountVnd: number
  actualAmountVnd: number | null
  notes: string
  version: number
}

export interface WorkspaceData {
  trip: Trip
  itinerary: ItineraryItem[]
  expenses: Expense[]
  memberCount: number
  currentRole: MemberRole
}

export type ItineraryDraft = Omit<ItineraryItem, 'id' | 'tripId' | 'version'>
export type ExpenseDraft = Omit<Expense, 'id' | 'tripId' | 'version'>
