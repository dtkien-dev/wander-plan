import { demoWorkspace } from '../data/demoData'
import { supabase } from '../lib/supabase'
import type { ChecklistDraft, ChecklistItem, Expense, ExpenseDraft, ItineraryDraft, ItineraryItem, Trip, TripDraft, TripImportDraft, TripImportResult, TripPerson, TripInvitation, WorkspaceData } from '../types'

const STORAGE_KEY = 'wander-plan-demo-workspace-v1'
const PEOPLE_STORAGE_KEY = 'wander-plan-demo-people-v1'
const demoPeople = demoWorkspace.people

export interface TravelRepository {
  loadWorkspace(tripId?: string): Promise<WorkspaceData | null>
  saveDisplayName(name: string): Promise<void>
  saveChecklist(draft: ChecklistDraft, tripId: string, existing?: ChecklistItem): Promise<void>
  deleteChecklist(item: ChecklistItem): Promise<void>
  listTrips(): Promise<Trip[]>
  createTrip(draft: TripDraft, requestId: string): Promise<string>
  loadInvitations(): Promise<TripInvitation[]>
  respondInvitation(tripId: string, accept: boolean): Promise<void>
  revokeInvitation(tripId: string, email: string): Promise<void>
  updateTrip(draft: TripDraft, existing: Trip): Promise<void>
  loadTripPeople(tripId: string): Promise<TripPerson[]>
  inviteMember(tripId: string, email: string): Promise<void>
  removeMember(tripId: string, userId: string): Promise<void>
  saveItinerary(draft: ItineraryDraft, tripId: string, existing?: ItineraryItem): Promise<void>
  deleteItinerary(item: ItineraryItem): Promise<void>
  saveExpense(draft: ExpenseDraft, tripId: string, existing?: Expense): Promise<void>
  deleteExpense(expense: Expense): Promise<void>
  importTripData(draft: TripImportDraft, tripId: string): Promise<TripImportResult>
}

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 180))
const cloneDemo = (): WorkspaceData => JSON.parse(JSON.stringify(demoWorkspace)) as WorkspaceData

class DemoRepository implements TravelRepository {
  private readAll(): WorkspaceData[] {
    const all = localStorage.getItem('wander-plan-demo-trips-v2')
    if (all) return (JSON.parse(all) as WorkspaceData[]).map((data) => ({
      ...data,
      checklist: data.checklist ?? [],
      expenses: data.expenses.map((expense) => ({ ...expense, endDate: expense.endDate ?? null })),
    }))
    const saved = localStorage.getItem(STORAGE_KEY)
    const data = saved ? (JSON.parse(saved) as WorkspaceData) : cloneDemo()
    const people = localStorage.getItem(PEOPLE_STORAGE_KEY)
    data.people = people ? JSON.parse(people) as TripPerson[] : data.people ?? [...demoPeople]
    data.trip.maxMembers ??= 4
    data.checklist ??= []
    data.currentUserId ??= 'demo-owner'
    data.expenses = data.expenses.map((expense) => ({
      ...expense,
      endDate: expense.endDate ?? null,
      paidByUserId: expense.paidByUserId ?? 'demo-owner',
      participantUserIds: expense.participantUserIds?.length ? expense.participantUserIds : demoPeople.flatMap((person) => person.userId ? [person.userId] : []),
    }))
    data.memberCount = data.people.filter((person) => person.status === 'active').length
    return [data]
  }

  private read(tripId?: string) {
    const data = this.readAll().find((entry) => !tripId || entry.trip.id === tripId)
    if (!data) throw new Error('Không tìm thấy chuyến đi.')
    return data
  }

  private write(data: WorkspaceData) {
    const all = this.readAll()
    const index = all.findIndex((entry) => entry.trip.id === data.trip.id)
    if (index >= 0) all[index] = data
    else all.push(data)
    localStorage.setItem('wander-plan-demo-trips-v2', JSON.stringify(all))
  }

  async listTrips() { return this.readAll().map((data) => data.trip) }

  async loadWorkspace(tripId?: string) {
    await delay()
    const data = this.read(tripId)
    data.memberCount = data.people.filter((person) => person.status === 'active').length
    return data
  }

  async createTrip(draft: TripDraft, requestId: string) {
    const previous = this.readAll().find((data) => data.trip.id === requestId)
    if (previous) return previous.trip.id
    const owner = { ...(this.readAll()[0]?.people.find((person) => person.userId === 'demo-owner') ?? demoPeople[0]), userId: 'demo-owner', role: 'owner' as const, status: 'active' as const }
    this.write({ trip: { ...draft, id: requestId, timezone: 'Asia/Ho_Chi_Minh', version: 1 }, people: [owner], memberCount: 1, currentUserId: 'demo-owner', currentRole: 'owner', itinerary: [], expenses: [] })
    return requestId
  }

  async loadInvitations(): Promise<TripInvitation[]> { return [] }
  async respondInvitation(): Promise<void> { throw new Error('Lời mời cần chế độ cộng tác để xác nhận.') }

  async updateTrip(draft: TripDraft, existing: Trip) {
    const data = this.read(existing.id)
    if (draft.maxMembers < data.people.length) throw new Error('Giới hạn không thể thấp hơn số thành viên và chỗ đang giữ.')
    if (data.itinerary.some((item) => item.visitDate < draft.startDate || item.visitDate > draft.endDate) || data.expenses.some((item) => item.expenseDate < draft.startDate || (item.endDate ?? item.expenseDate) > draft.endDate)) throw new Error('Ngày chuyến đi phải bao gồm lịch trình và chi phí hiện có.')
    if (data.trip.version !== existing.version) throw new Error('Thông tin chuyến đi đã thay đổi. Hãy tải lại.')
    data.trip = { ...data.trip, ...draft, version: data.trip.version + 1 }
    this.write(data)
  }

  async loadTripPeople(tripId: string) { return this.read(tripId).people }

  async saveChecklist(draft: ChecklistDraft, tripId: string, existing?: ChecklistItem) {
    const data = this.read(tripId)
    const title = draft.title.trim()
    if (!title || [...title].length > 150) throw new Error('Nội dung cần từ 1 đến 150 ký tự.')
    if (draft.assignedTo && !data.people.some((person) => person.userId === draft.assignedTo && person.status === 'active')) throw new Error('Người phụ trách phải là thành viên của chuyến đi.')
    if (existing) {
      const item = data.checklist?.find((item) => item.id === existing.id)
      if (!item || item.version !== existing.version) throw new Error('Mục chuẩn bị đã thay đổi. Đóng cửa sổ rồi mở lại mục để dùng bản mới nhất.')
      Object.assign(item, draft, { title, version: item.version + 1 })
    } else {
      (data.checklist ??= []).push({ ...draft, title, id: crypto.randomUUID(), tripId, version: 1 })
    }
    this.write(data)
  }

  async deleteChecklist(item: ChecklistItem) {
    const data = this.read(item.tripId)
    const current = data.checklist?.find((entry) => entry.id === item.id)
    if (!current || current.version !== item.version) throw new Error('Mục chuẩn bị đã thay đổi. Đóng cửa sổ rồi mở lại mục để dùng bản mới nhất.')
    data.checklist = data.checklist?.filter((entry) => entry.id !== item.id)
    this.write(data)
  }

  async saveDisplayName(name: string) {
    const trimmed = name.trim()
    if ([...trimmed].length > 80) throw new Error('Tên hiển thị tối đa 80 ký tự.')
    const all = this.readAll()
    for (const data of all) {
      data.ownDisplayName = trimmed || null
      data.people = data.people.map((person) => person.userId === 'demo-owner'
        ? { ...person, displayName: trimmed || person.email.split('@')[0] } : person)
    }
    localStorage.setItem('wander-plan-demo-trips-v2', JSON.stringify(all))
  }

  async inviteMember(tripId: string, email: string) {
    const data = this.read(tripId)
    const normalized = email.trim().toLowerCase()
    if (data.people.some((person) => person.email.toLowerCase() === normalized)) return
    if (data.people.length >= data.trip.maxMembers) throw new Error('Chuyến đi đã dùng hết số chỗ thành viên và lời mời.')
    data.people.push({ userId: null, email: normalized, displayName: normalized.split('@')[0], role: 'editor', status: 'invited', joinedAt: null })
    this.write(data)
  }

  async revokeInvitation(tripId: string, email: string) {
    const data = this.read(tripId)
    data.people = data.people.filter((person) => person.status !== 'invited' || person.email !== email)
    this.write(data)
  }

  async removeMember(tripId: string, userId: string) {
    const data = this.read(tripId)
    const member = data.people.find((person) => person.userId === userId)
    if (!member) throw new Error('Không tìm thấy thành viên trong chuyến đi.')
    if (member.role === 'owner') throw new Error('Không thể loại chủ nhóm khỏi chuyến đi.')
    data.people = data.people.filter((person) => person.userId !== userId)
    data.checklist = data.checklist?.map((item) => item.assignedTo === userId ? { ...item, assignedTo: null, version: item.version + 1 } : item)
    this.write(data)
  }

  async saveItinerary(draft: ItineraryDraft, tripId: string, existing?: ItineraryItem) {
    const data = this.read(tripId)
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
    const data = this.read(item.tripId)
    data.itinerary = data.itinerary.filter((entry) => entry.id !== item.id)
    this.write(data)
  }

  async saveExpense(draft: ExpenseDraft, tripId: string, existing?: Expense) {
    const data = this.read(tripId)
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
    const data = this.read(expense.tripId)
    data.expenses = data.expenses.filter((entry) => entry.id !== expense.id)
    this.write(data)
  }

  async importTripData(draft: TripImportDraft, tripId: string) {
    const data = this.read(tripId)
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
  endDate: row.end_date ?? null,
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
  async saveChecklist(draft: ChecklistDraft, tripId: string, existing?: ChecklistItem) {
    if (!supabase) return
    const { error } = await supabase.rpc('save_trip_checklist', {
      target_trip_id: tripId, target_item_id: existing?.id ?? null, expected_version: existing?.version ?? null,
      item_title: draft.title.trim(), assignee_user_id: draft.assignedTo, item_completed: draft.completed,
    })
    throwIfError(error)
  }

  async deleteChecklist(item: ChecklistItem) {
    if (!supabase) return
    const { error } = await supabase.rpc('remove_trip_checklist', { target_trip_id: item.tripId, target_item_id: item.id, expected_version: item.version })
    throwIfError(error)
  }
  async saveDisplayName(name: string) {
    if (!supabase) return
    const { error } = await supabase.rpc('save_my_display_name', { target_name: name })
    throwIfError(error)
  }
  async listTrips() {
    if (!supabase) return []
    const { data, error } = await supabase.from('trips').select('id,name,destination,start_date,end_date,timezone,budget_vnd,max_members,version').order('start_date')
    throwIfError(error)
    return (data ?? []).map(mapTrip)
  }

  async loadInvitations() {
    if (!supabase) return []
    const { data, error } = await supabase.rpc('get_my_trip_invitations')
    throwIfError(error)
    return (data ?? []).map((row: any): TripInvitation => ({ tripId: row.trip_id, tripName: row.trip_name, destination: row.destination, startDate: row.start_date, endDate: row.end_date }))
  }

  async respondInvitation(tripId: string, accept: boolean) {
    if (!supabase) return
    const { error } = await supabase.rpc('respond_trip_invitation', { target_trip_id: tripId, accept_invitation: accept })
    throwIfError(error)
  }

  async revokeInvitation(tripId: string, email: string) {
    if (!supabase) return
    const { error } = await supabase.rpc('revoke_trip_invitation', { target_trip_id: tripId, target_email: email })
    throwIfError(error)
  }

  async loadWorkspace(tripId?: string) {
    if (!supabase || !tripId) return null
    const { data: trips, error } = await supabase.from('trips').select('id,name,destination,start_date,end_date,timezone,budget_vnd,max_members,version').eq('id', tripId).limit(1)
    throwIfError(error)
    if (!trips?.length) return null
    const trip = mapTrip(trips[0])
    const [itineraryResult, expenseResult, memberResult, checklistResult] = await Promise.all([
      supabase.from('itinerary_items').select('id,trip_id,title,visit_date,start_time,end_time,estimated_cost_vnd,address,maps_url,notes,version').eq('trip_id', trip.id).order('visit_date').order('start_time'),
      supabase.from('expenses').select('id,trip_id,title,category,expense_date,end_date,estimated_amount_vnd,actual_amount_vnd,paid_by,notes,version,expense_participants(user_id)').eq('trip_id', trip.id).order('expense_date'),
      supabase.from('trip_members').select('user_id,role').eq('trip_id', trip.id),
      supabase.from('checklist_items').select('id,trip_id,title,assigned_to,completed,version').eq('trip_id', trip.id).is('deleted_at', null).order('created_at').order('id'),
    ])
    throwIfError(itineraryResult.error)
    throwIfError(expenseResult.error)
    throwIfError(memberResult.error)
    throwIfError(checklistResult.error)
    const { data: authData } = await supabase.auth.getSession()
    const currentMembership = memberResult.data?.find((member) => member.user_id === authData.session?.user.id)
    if (!currentMembership) throw new Error('Tài khoản chưa thuộc chuyến đi này.')
    const profile = await supabase.from('profiles').select('display_name').eq('id', authData.session!.user.id).single()
    throwIfError(profile.error)
    const rawName = profile.data?.display_name
    return {
      ownDisplayName: rawName === authData.session!.user.email ? null : rawName,
      checklist: (checklistResult.data ?? []).map((row): ChecklistItem => ({ id: row.id, tripId: row.trip_id, title: row.title, assignedTo: row.assigned_to, completed: row.completed, version: row.version })),
      trip,
      itinerary: (itineraryResult.data ?? []).map(mapItinerary),
      expenses: (expenseResult.data ?? []).map(mapExpense),
      people: await this.loadTripPeople(trip.id),
      memberCount: memberResult.data?.length ?? 1,
      currentUserId: authData.session!.user.id,
      currentRole: currentMembership.role as WorkspaceData['currentRole'],
    }
  }

  async createTrip(draft: TripDraft, requestId: string) {
    if (!supabase) throw new Error('Supabase chưa được cấu hình.')
    const { data, error } = await supabase.rpc('create_trip', {
      trip_name: draft.name, trip_destination: draft.destination,
      trip_start_date: draft.startDate, trip_end_date: draft.endDate,
      trip_budget_vnd: draft.budgetVnd, trip_max_members: draft.maxMembers, request_id: requestId,
    })
    throwIfError(error)
    if (!data) throw new Error('Không thể tạo chuyến đi.')
    return String(data)
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
      displayName: person.display_name || person.email.split('@')[0],
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

  async removeMember(tripId: string, userId: string) {
    if (!supabase) return
    const { error } = await supabase.rpc('remove_trip_member', {
      target_trip_id: tripId,
      target_user_id: userId,
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
      target_end_date: draft.endDate,
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
        end_date: entry.draft.endDate,
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
