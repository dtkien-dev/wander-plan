import { useState, type FormEvent } from 'react'

export function DisplayNameForm({ initialName, fallback, saving, onSave }: {
  initialName: string; fallback: string; saving: boolean; onSave: (name: string) => Promise<unknown>
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setSaved(false)
    try { await onSave(name.trim()); setSaved(true) }
    catch (error) { setError(error instanceof Error ? error.message : 'Chưa thể lưu tên. Hãy thử lại.') }
  }
  return <form className="form" onSubmit={(event) => void submit(event)} aria-label="Hồ sơ của bạn">
    <label className="field field--wide">Tên hiển thị của bạn<input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} maxLength={80} placeholder={fallback} autoComplete="nickname" aria-describedby="display-name-hint" /></label>
    <p id="display-name-hint" className="field--wide">Dùng chung mọi chuyến. Để trống sẽ hiện {fallback}.</p>
    {error && <p className="form-error-banner field--wide" role="alert">{error}</p>}
    {saved && <p className="field--wide" role="status">Đã lưu tên hiển thị.</p>}
    <div className="form__actions field--wide"><button type="submit" className="button button--ghost" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu tên'}</button></div>
  </form>
}
