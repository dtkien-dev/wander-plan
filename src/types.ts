export type MemberRole = 'owner' | 'editor'
export type ExpenseCategory = 'food' | 'transport' | 'stay' | 'ticket' | 'other'
export type SplitMethod = 'equal' | 'shares' | 'amounts'

export interface Trip {
  createdByUserId?: string
  archivedAt?: string | null
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  budgetVnd: number
  maxMembers: number
  version: number
}

export interface ArchivedTrip {
  id: string
  name: string
  archivedAt: string
  version: number
}

export type TripDraft = Pick<Trip, 'name' | 'destination' | 'startDate' | 'endDate' | 'budgetVnd' | 'maxMembers'>

export interface TripInvitation {
  tripId: string
  tripName: string
  destination: string
  startDate: string
  endDate: string
}

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
  /** Last day of a multi-day activity; null for a single-day activity. */
  endDate: string | null
  startTime: string
  endTime: string
  estimatedCostVnd: number
  address: string
  mapsUrl: string
  notes: string
  version: number
}

export interface TrashedItineraryItem extends ItineraryItem {
  deletedAt: string
  expiresAt: string
}

export interface Expense {
  id: string
  tripId: string
  title: string
  category: ExpenseCategory
  expenseDate: string
  endDate: string | null
  estimatedAmountVnd: number
  actualAmountVnd: number | null
  paidByUserId: string
  participantUserIds: string[]
  /** Missing means equal (legacy data). */
  splitMethod?: SplitMethod
  /** Participant userId → share units ('shares') or đồng ('amounts'); empty for equal. */
  splitValues?: Record<string, number>
  notes: string
  version: number
}

export interface TrashedExpense extends Expense {
  deletedAt: string
  expiresAt: string
  deletedByUserId: string
}

export interface SettlementPayment {
  id: string
  tripId: string
  fromUserId: string
  toUserId: string
  amountVnd: number
  createdAt: string
}

/** Someone who left the trip but still appears on its expenses or payments. */
export interface FormerPerson {
  userId: string
  displayName: string
}

export interface WorkspaceData {
  isSiteAdmin?: boolean
  itineraryTrash?: TrashedItineraryItem[]
  /** Only entries the current user may restore: their own deletions, or all for owners. */
  expenseTrash?: TrashedExpense[]
  checklist?: ChecklistItem[]
  formerPeople?: FormerPerson[]
  settlementPayments?: SettlementPayment[]
  /** Payment rows ever recorded for the trip, including undone ones; guards duplicate records. */
  settlementPaymentCount?: number
  ownDisplayName?: string | null
  trip: Trip
  itinerary: ItineraryItem[]
  expenses: Expense[]
  people: TripPerson[]
  memberCount: number
  currentUserId: string
  currentRole: MemberRole
}

export interface ChecklistItem {
  id: string
  tripId: string
  title: string
  assignedTo: string | null
  completed: boolean
  version: number
}
export type ChecklistDraft = Pick<ChecklistItem, 'title' | 'assignedTo' | 'completed'>

export type ItineraryDraft = Omit<ItineraryItem, 'id' | 'tripId' | 'version'>
export type ExpenseDraft = Omit<Expense, 'id' | 'tripId' | 'version'>

export interface TripImportEntry<T> {
  draft: T
  id?: string
  version?: number
}

export interface TripImportDraft {
  itinerary: TripImportEntry<ItineraryDraft>[]
  expenses: TripImportEntry<ExpenseDraft>[]
}

export interface TripImportResult {
  createdCount: number
  updatedCount: number
}
