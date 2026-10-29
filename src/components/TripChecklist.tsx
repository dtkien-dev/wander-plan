import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import type { ChecklistDraft, ChecklistItem, TripPerson } from '../types'
import styles from './TripChecklist.module.css'

export function TripChecklist({ items, people, busy, onSave, onDelete }: {
  items: ChecklistItem[]; people: TripPerson[]; busy: boolean
  onSave: (draft: ChecklistDraft, existing?: ChecklistItem) => Promise<unknown>
  onDelete: (item: ChecklistItem) => Promise<unknown>
}) {
  const [editing, setEditing] = useState<ChecklistItem | 'new' | null>(null)
  const [removing, setRemoving] = useState<ChecklistItem | null>(null)
  const [error, setError] = useState('')
  const members = people.filter((person) => person.status === 'active' && person.userId)
  const act = async (action: () => Promise<unknown>, done?: () => void) => {
    setError('')
    try { await action(); done?.() }
    catch (error) { setError(error instanceof Error ? error.message : 'Chưa thể cập nhật. Hãy thử lại.') }
  }
  return <section className={styles.section} aria-labelledby="checklist-title">
    <header className={styles.header}><div><h2 id="checklist-title">Checklist chuyến đi</h2>{items.length > 0 && <p>{items.filter((item) => item.completed).length}/{items.length} việc hoàn tất · Mọi thành viên đều có thể chỉnh sửa.</p>}</div><button type="button" className="button button--primary" disabled={busy} onClick={() => { setError(''); setEditing('new') }}>Thêm việc</button></header>
    {error && !editing && !removing && <p className="form-error-banner" role="alert">{error}</p>}
    {!items.length && <p className={styles.empty}>Chưa có việc chuẩn bị. Thêm đồ cần mang hoặc việc cần làm cho cả nhóm.</p>}
    <ul className={styles.list}>{items.map((item) => {
      const assignee = members.find((person) => person.userId === item.assignedTo)
      return <li key={item.id}>
        <label className={styles.item}><input type="checkbox" checked={item.completed} disabled={busy} onChange={() => void act(() => onSave({ title: item.title, assignedTo: item.assignedTo, completed: !item.completed }, item))} /><span><strong className={item.completed ? styles.done : undefined}>{item.title}</strong><small>{assignee ? `Phụ trách: ${assignee.displayName}` : 'Chưa phân công'}</small></span></label>
        <div className={styles.actions}><button type="button" className="icon-button" disabled={busy} aria-label={`Sửa ${item.title}`} onClick={() => { setError(''); setEditing(item) }}><Pencil size={18} /></button><button type="button" className="icon-button" disabled={busy} aria-label={`Xóa ${item.title}`} onClick={() => { setError(''); setRemoving(item) }}><Trash2 size={18} /></button></div>
      </li>
    })}</ul>
    <Modal open={editing !== null} title={editing === 'new' ? 'Thêm việc chuẩn bị' : 'Sửa việc chuẩn bị'} onClose={() => { if (!busy) { setEditing(null); setError('') } }}>
      {editing && <ChecklistForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} members={members} busy={busy} error={error} onSave={(draft) => act(() => onSave(draft, editing === 'new' ? undefined : editing), () => setEditing(null))} />}
    </Modal>
    <Modal open={removing !== null} title="Xóa việc chuẩn bị" onClose={() => { if (!busy) { setRemoving(null); setError('') } }}>
      <p className={styles.confirm}>Xóa “{removing?.title}” khỏi checklist của nhóm?</p>
      {error && <p className="form-error-banner" role="alert">{error}</p>}
      <div className="form__actions"><button type="button" className="button button--ghost" disabled={busy} onClick={() => setRemoving(null)}>Giữ lại</button><button type="button" className="button button--primary" disabled={busy} onClick={() => removing && void act(() => onDelete(removing), () => setRemoving(null))}>{busy ? 'Đang xóa…' : 'Xóa việc'}</button></div>
    </Modal>
  </section>
}

function ChecklistForm({ initial, members, busy, error, onSave }: {
  initial?: ChecklistItem; members: TripPerson[]; busy: boolean; error: string
  onSave: (draft: ChecklistDraft) => Promise<unknown>
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? '')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (title.trim()) void onSave({ title: title.trim(), assignedTo: assignedTo || null, completed: initial?.completed ?? false })
  }
  return <form className="form" onSubmit={submit}>
    <label className="field field--wide">Việc cần chuẩn bị<input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <label className="field field--wide">Người phụ trách (tùy chọn)<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}><option value="">Chưa phân công</option>{members.map((person) => <option key={person.userId} value={person.userId!}>{person.displayName}</option>)}</select></label>
    {error && <p className="form-error-banner field--wide" role="alert">{error}</p>}
    <div className="form__actions field--wide"><button type="submit" className="button button--primary" disabled={busy || !title.trim()}>{busy ? 'Đang lưu…' : 'Lưu việc'}</button></div>
  </form>
}
