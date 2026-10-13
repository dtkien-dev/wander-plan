import { demoWorkspace } from '../data/demoData'
import { supabase } from '../lib/supabase'
import type { Expense, ExpenseDraft, ItineraryDraft, ItineraryItem, Trip, TripDraft, TripImportDraft, TripImportResult, TripPerson, WorkspaceData } from '../types'

const STORAGE_KEY = 'wander-plan-demo-workspace-v1'
const PEOPLE_STORAGE_KEY = 'wander-plan-demo-people-v1'
const demoPeople = demoWorkspace.people

export interface TravelRepository {
  loadWorkspace(): Promise<WorkspaceData | null>
  createDefaultTrip(): Promise<WorkspaceData>
  updateTrip(draft: TripDraft, existing: Trip): Promise<void>
  loadTripPeople(tripId: string): Promise<TripPerson[]>
  inviteMember(tripId: string, email: string): Promise<void>
  saveItinerary(draft: ItineraryDraft, tripId: string, existing?: ItineraryItem): Promise<void>
  deleteItinerary(item: ItineraryItem): Promise<void>
  saveExpense(draft: ExpenseDraft, tripId: string, existing?: Expense): Promise<void>
  deleteExpense(expense: Expense): Promise<void>
  importTripData(draft: TripImportDraft, tripId: string): Promise<TripImportResult>
}

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 180))
const cloneDemo = (): WorkspaceData => JSON.parse(JSON.stringify(demoWorkspace)) as WorkspaceData

class DemoRepository implements TravelRepository {
  private read() {
    const saved = localStorage.getItem(STORAGE_KEY)
    const data = saved ? (JSON.parse(saved) as WorkspaceData) : cloneDemo()
    data.trip.maxMembers ??= 4
    data.currentUserId ??= 'demo-owner'
    data.people ??= [...demoPeople]
    data.expenses = data.expenses.map((expense) => ({
      ...expense,
      paidByUserId: expense.paidByUserId ?? 'demo-owner',
      participantUserIds: expense.participantUserIds?.length ? expense.participantUserIds : demoPeople.flatMap((person) => person.userId ? [person.userId] : []),
    }))
    return data
  }

  private write(data: WorkspaceData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async loadWorkspace() {
    await delay()
    const data = this.read()
    data.people = await this.loadTripPeople()
    data.memberCount = data.people.length
    return data
  }

  async createDefaultTrip() {
    const data = cloneDemo()
    this.write(data)
    return data
  }

  async updateTrip(draft: TripDraft) {
    const data = this.read()
    data.trip = { ...data.trip, ...draft, version: data.trip.version + 1 }
    this.write(data)
  }

  async loadTripPeople() {
    const saved = localStorage.getItem(PEOPLE_STORAGE_KEY)
    return saved ? (JSON.parse(saved) as TripPerson[]) : [...demoPeople]
  }

  async inviteMember(_tripId: string, email: string) {
    const people = await this.loadTripPeople()
    if (people.some((person) => person.email === email)) return
    if (people.length >= this.read().trip.maxMembers) throw new Error('Chuyến đi đã dùng hết số chỗ thành viên và lời mời.')
    people.push({ userId: null, email, displayName: email, role: 'editor', status: 'invited', joinedAt: null })
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people))
  }

  async saveItinerary(draft: ItineraryDraft, _tripId: string, existing?: ItineraryItem) {
    const data = this.read()
    if (existing) {
      data.itinerary = data.itinerary.map((item) =>
        item.id === existing.id ? { ...item, ...draft, version: item.version + 1 } : item,
      )
    } else {
      data.itinerary.push({
        ...draft,
        id: crypto.randomUUID(),
        tripId: data.trip.id,
        version: 1,
      })
    }
    this.write(data)
  }

  async deleteItinerary(item: ItineraryItem) {
    const data = this.read()
    data.itinerary = data.itinerary.filter((entry) => entry.id !== item.id)
    this.write(data)
  }

  async saveExpense(draft: ExpenseDraft, _tripId: string, existing?: Expense) {
    const data = this.read()
    if (existing) {
      data.expenses = data.expenses.map((expense) =>
        expense.id === existing.id ? { ...expense, ...draft, version: expense.version + 1 } : expense,
      )
    } else {
      data.expenses.push({
        ...draft,
        id: crypto.randomUUID(),
        tripId: data.trip.id,
        version: 1,
      })
    }
    this.write(data)
  }

  async deleteExpense(expense: Expense) {
    const data = this.read()
    data.expenses = data.expenses.filter((entry) => entry.id !== expense.id)
    this.write(data)
  }

  async importTripData(draft: TripImportDraft) {
    const data = this.read()
    const itineraryUpdates = draft.itinerary.filter((entry) => entry.id)
    const expenseUpdates = draft.expenses.filter((entry) => entry.id)
    for (const entry of itineraryUpdates) {
      const current = data.itinerary.find((item) => item.id === entry.id)
      if (!current || current.version !== entry.version) throw new Error('Lịch trình đã thay đổi. Hãy xuất file mới rồi thử lại.')
    }
    for (const entry of expenseUpdates) {
      const current = data.expenses.find((expense) => expense.id === entry.id)
      if (!current || current.version !== entry.version) throw new Error('Chi phí đã thay đổi. Hãy xuất file mới rồi thử lại.')
    }
    data.itinerary = data.itinerary.map((item) => {
      const entry = itineraryUpdates.find((candidate) => candidate.id === item.id)
      return entry ? { ...item, ...entry.draft, version: item.version + 1 } : item
    })
    data.expenses = data.expenses.map((expense) => {
      const entry = expenseUpdates.find((candidate) => candidate.id === expense.id)
      return entry ? { ...expense, ...entry.draft, version: expense.version + 1 } : expense
    })
    const itineraryCreates = draft.itinerary.filter((entry) => !entry.id)
    const expenseCreates = draft.expenses.filter((entry) => !entry.id)
    data.itinerary.push(...itineraryCreates.map((entry) => ({
      ...entry.draft, id: crypto.randomUUID(), tripId: data.trip.id, version: 1,
    })))
    data.expenses.push(...expenseCreates.map((entry) => ({
      ...entry.draft, id: crypto.randomUUID(), tripId: data.trip.id, version: 1,
    })))
    this.write(data)
    return { createdCount: itineraryCreates.length + expenseCreates.length, updatedCount: itineraryUpdates.length + expenseUpdates.length }
  }
}

const mapTrip = (row: any): Trip => ({
  id: row.id,
  name: row.name,
  destination: row.destination,
  startDate: row.start_date,
  endDate: row.end_date,
  timezone: row.timezone,
  budgetVnd: Number(row.budget_vnd),
  maxMembers: Number(row.max_members),
  version: row.version,
})

const mapItinerary = (row: any): ItineraryItem => ({
  id: row.id,
  tripId: row.trip_id,
  title: row.title,
  visitDate: row.visit_date,
  startTime: row.start_time.slice(0, 5),
  endTime: row.end_time.slice(0, 5),
  estimatedCostVnd: Number(row.estimated_cost_vnd),
  address: row.address ?? '',
  mapsUrl: row.maps_url ?? '',
  notes: row.notes ?? '',
  version: row.version,
})

const mapExpense = (row: any): Expense => ({
  id: row.id,
  tripId: row.trip_id,
  title: row.title,
  category: row.category,
  expenseDate: row.expense_date,
  estimatedAmountVnd: Number(row.estimated_amount_vnd),
  actualAmountVnd: row.actual_amount_vnd === null ? null : Number(row.actual_amount_vnd),
  paidByUserId: row.paid_by,
  participantUserIds: (row.expense_participants ?? []).map((participant: any) => participant.user_id),
  notes: row.notes ?? '',
  version: row.version,
})

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

class SupabaseRepository implements TravelRepository {
  async loadWorkspace() {
    if (!supabase) return null
    const { error: claimError } = await supabase.rpc('claim_trip_invitations')
    throwIfError(claimError)
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id,name,destination,start_date,end_date,timezone,budget_vnd,max_members,version')
      .order('start_date')
      .limit(1)
    throwIfError(error)
    if (!trips?.length) return null
    const trip = mapTrip(trips[0])
    const [itineraryResult, expenseResult, memberResult] = await Promise.all([
      supabase.from('itinerary_items').select('id,trip_id,title,visit_date,start_time,end_time,estimated_cost_vnd,address,maps_url,notes,version').eq('trip_id', trip.id).order('visit_date').order('start_time'),
      supabase.from('expenses').select('id,trip_id,title,category,expense_date,estimated_amount_vnd,actual_amount_vnd,paid_by,notes,version,expense_participants(user_id)').eq('trip_id', trip.id).order('expense_date'),
      supabase.from('trip_members').select('user_id,role').eq('trip_id', trip.id),
    ])
    throwIfError(itineraryResult.error)
    throwIfError(expenseResult.error)
    throwIfError(memberResult.error)
    const { data: authData } = await supabase.auth.getSession()
    const currentMembership = memberResult.data?.find((member) => member.user_id === authData.session?.user.id)
    if (!currentMembership) throw new Error('Tài khoản chưa thuộc chuyến đi này.')
    return {
      trip,
      itinerary: (itineraryResult.data ?? []).map(mapItinerary),
      expenses: (expenseResult.data ?? []).map(mapExpense),
      people: await this.loadTripPeople(trip.id),
      memberCount: memberResult.data?.length ?? 1,
      currentUserId: authData.session!.user.id,
      currentRole: currentMembership.role as WorkspaceData['currentRole'],
    }
  }

  async createDefaultTrip() {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.')
    const { data, error } = await supabase.rpc('create_default_trip')
    throwIfError(error)
    const workspace = await this.loadWorkspace()
    if (!workspace) throw new Error(`Không thể tải chuyến đi vừa tạo: ${String(data)}`)
    return workspace
  }

  async updateTrip(draft: TripDraft, existing: Trip) {
    if (!supabase) return
    const { data, error } = await supabase
      .from('trips')
      .update({
        name: draft.name,
        destination: draft.destination,
        start_date: draft.startDate,
        end_date: draft.endDate,
        budget_vnd: draft.budgetVnd,
        max_members: draft.maxMembers,
      })
      .eq('id', existing.id)
      .eq('version', existing.version)
      .select('id')
    throwIfError(error)
    if (!data?.length) throw new Error('Thông tin chuyến đi đã được cập nhật ở thiết bị khác. Hãy tải lại.')
  }

  async loadTripPeople(tripId: string) {
    if (!supabase) return []
    const { data, error } = await supabase.rpc('get_trip_people', { target_trip_id: tripId })
    throwIfError(error)
    return (data ?? []).map((person: any): TripPerson => ({
      userId: person.user_id,
      email: person.email,
      displayName: person.display_name || person.email,
      role: person.role,
      status: person.status,
      joinedAt: person.joined_at,
    }))
  }

  async inviteMember(tripId: string, email: string) {
    if (!supabase) return
    const { error } = await supabase.rpc('invite_trip_member', {
      target_trip_id: tripId,
      target_email: email,
    })
    throwIfError(error)
  }

  async saveItinerary(draft: ItineraryDraft, tripId: string, existing?: ItineraryItem) {
    if (!supabase) return
    const payload = {
      title: draft.title,
      visit_date: draft.visitDate,
      start_time: draft.startTime,
      end_time: draft.endTime,
      estimated_cost_vnd: draft.estimatedCostVnd,
      address: draft.address,
      maps_url: draft.mapsUrl || null,
      notes: draft.notes,
    }
    if (existing) {
      const { data, error } = await supabase
        .from('itinerary_items')
        .update(payload)
        .eq('id', existing.id)
        .eq('version', existing.version)
        .select('id')
      throwIfError(error)
      if (!data?.length) throw new Error('Lịch trình đã được người khác cập nhật. Hãy tải lại và thử lại.')
    } else {
      const { error } = await supabase.from('itinerary_items').insert({ ...payload, trip_id: tripId })
      throwIfError(error)
    }
  }

  async deleteItinerary(item: ItineraryItem) {
    if (!supabase) return
    const { data, error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', item.id)
      .eq('version', item.version)
      .select('id')
    throwIfError(error)
    if (!data?.length) throw new Error('Không thể xóa vì lịch trình đã thay đổi. Hãy tải lại.')
  }

  async saveExpense(draft: ExpenseDraft, tripId: string, existing?: Expense) {
    if (!supabase) return
    const { data, error } = await supabase.rpc('save_expense_with_participants', {
      target_trip_id: tripId,
      target_expense_id: existing?.id ?? null,
      expected_version: existing?.version ?? null,
      expense_title: draft.title,
      expense_category: draft.category,
      target_expense_date: draft.expenseDate,
      target_estimated_amount_vnd: draft.estimatedAmountVnd,
      target_actual_amount_vnd: draft.actualAmountVnd,
      payer_user_id: draft.paidByUserId,
      participant_user_ids: draft.participantUserIds,
      expense_notes: draft.notes,
    })
    throwIfError(error)
    if (!data) throw new Error('Không thể lưu chi phí.')
  }

  async deleteExpense(expense: Expense) {
    if (!supabase) return
    const { data, error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expense.id)
      .eq('version', expense.version)
      .select('id')
    throwIfError(error)
    if (!data?.length) throw new Error('Không thể xóa vì chi phí đã thay đổi. Hãy tải lại.')
  }

  async importTripData(draft: TripImportDraft, tripId: string) {
    if (!supabase) return { createdCount: 0, updatedCount: 0 }
    const { data, error } = await supabase.rpc('import_trip_data', {
      target_trip_id: tripId,
      itinerary_rows: draft.itinerary.map((entry) => ({
        id: entry.id ?? null,
        version: entry.version ?? null,
        title: entry.draft.title,
        visit_date: entry.draft.visitDate,
        start_time: entry.draft.startTime,
        end_time: entry.draft.endTime,
        estimated_cost_vnd: entry.draft.estimatedCostVnd,
        address: entry.draft.address,
        maps_url: entry.draft.mapsUrl || null,
        notes: entry.draft.notes,
      })),
      expense_rows: draft.expenses.map((entry) => ({
        id: entry.id ?? null,
        version: entry.version ?? null,
        title: entry.draft.title,
        category: entry.draft.category,
        expense_date: entry.draft.expenseDate,
        estimated_amount_vnd: entry.draft.estimatedAmountVnd,
        actual_amount_vnd: entry.draft.actualAmountVnd,
        paid_by: entry.draft.paidByUserId,
        participant_ids: entry.draft.participantUserIds,
        notes: entry.draft.notes,
      })),
    })
    throwIfError(error)
    return {
      createdCount: Number(data?.created_count ?? draft.itinerary.filter((entry) => !entry.id).length + draft.expenses.filter((entry) => !entry.id).length),
      updatedCount: Number(data?.updated_count ?? draft.itinerary.filter((entry) => entry.id).length + draft.expenses.filter((entry) => entry.id).length),
    }
  }
}

export const travelRepository: TravelRepository = supabase
  ? new SupabaseRepository()
  : new DemoRepository()
