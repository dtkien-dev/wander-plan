import { demoWorkspace } from '../data/demoData'
import { supabase } from '../lib/supabase'
import type { Expense, ExpenseDraft, ItineraryDraft, ItineraryItem, Trip, WorkspaceData } from '../types'

const STORAGE_KEY = 'wander-plan-demo-workspace-v1'

export interface TravelRepository {
  loadWorkspace(): Promise<WorkspaceData | null>
  createDefaultTrip(): Promise<WorkspaceData>
  saveItinerary(draft: ItineraryDraft, existing?: ItineraryItem): Promise<void>
  deleteItinerary(item: ItineraryItem): Promise<void>
  saveExpense(draft: ExpenseDraft, existing?: Expense): Promise<void>
  deleteExpense(expense: Expense): Promise<void>
}

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 180))
const cloneDemo = (): WorkspaceData => JSON.parse(JSON.stringify(demoWorkspace)) as WorkspaceData

class DemoRepository implements TravelRepository {
  private read() {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? (JSON.parse(saved) as WorkspaceData) : cloneDemo()
  }

  private write(data: WorkspaceData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async loadWorkspace() {
    await delay()
    return this.read()
  }

  async createDefaultTrip() {
    const data = cloneDemo()
    this.write(data)
    return data
  }

  async saveItinerary(draft: ItineraryDraft, existing?: ItineraryItem) {
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

  async saveExpense(draft: ExpenseDraft, existing?: Expense) {
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
}

const mapTrip = (row: any): Trip => ({
  id: row.id,
  name: row.name,
  destination: row.destination,
  startDate: row.start_date,
  endDate: row.end_date,
  timezone: row.timezone,
  budgetVnd: Number(row.budget_vnd),
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
  notes: row.notes ?? '',
  version: row.version,
})

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

class SupabaseRepository implements TravelRepository {
  async loadWorkspace() {
    if (!supabase) return null
    const { data: trips, error } = await supabase.from('trips').select('*').order('start_date').limit(1)
    throwIfError(error)
    if (!trips?.length) return null
    const trip = mapTrip(trips[0])
    const [itineraryResult, expenseResult, memberResult] = await Promise.all([
      supabase.from('itinerary_items').select('*').eq('trip_id', trip.id).order('visit_date').order('start_time'),
      supabase.from('expenses').select('*').eq('trip_id', trip.id).order('expense_date'),
      supabase.from('trip_members').select('*', { count: 'exact', head: true }).eq('trip_id', trip.id),
    ])
    throwIfError(itineraryResult.error)
    throwIfError(expenseResult.error)
    throwIfError(memberResult.error)
    return {
      trip,
      itinerary: (itineraryResult.data ?? []).map(mapItinerary),
      expenses: (expenseResult.data ?? []).map(mapExpense),
      memberCount: memberResult.count ?? 1,
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

  async saveItinerary(draft: ItineraryDraft, existing?: ItineraryItem) {
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
      const workspace = await this.loadWorkspace()
      if (!workspace) throw new Error('Không tìm thấy chuyến đi.')
      const { error } = await supabase.from('itinerary_items').insert({ ...payload, trip_id: workspace.trip.id })
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

  async saveExpense(draft: ExpenseDraft, existing?: Expense) {
    if (!supabase) return
    const payload = {
      title: draft.title,
      category: draft.category,
      expense_date: draft.expenseDate,
      estimated_amount_vnd: draft.estimatedAmountVnd,
      actual_amount_vnd: draft.actualAmountVnd,
      notes: draft.notes,
    }
    if (existing) {
      const { data, error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', existing.id)
        .eq('version', existing.version)
        .select('id')
      throwIfError(error)
      if (!data?.length) throw new Error('Chi phí đã được người khác cập nhật. Hãy tải lại và thử lại.')
    } else {
      const workspace = await this.loadWorkspace()
      if (!workspace) throw new Error('Không tìm thấy chuyến đi.')
      const { error } = await supabase.from('expenses').insert({ ...payload, trip_id: workspace.trip.id })
      throwIfError(error)
    }
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
}

export const travelRepository: TravelRepository = supabase ? new SupabaseRepository() : new DemoRepository()
