import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Brand } from '../components/Brand'
import { useAuth } from '../providers/AuthProvider'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { authError, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const requestPending = useRef(false)

  useEffect(() => {
    if (!resendAt) return
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
      setRemaining(seconds)
      if (!seconds) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAt])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (requestPending.current || Date.now() < resendAt) return
    requestPending.current = true
    setPending(true)
    setMessage('')
    setError('')
    try {
      const normalizedEmail = email.trim().toLowerCase()
      await signInWithEmail(normalizedEmail)
      setSentEmail(normalizedEmail)
      setMessage(`Đã gửi liên kết đăng nhập đến ${normalizedEmail}. Hãy kiểm tra hộp thư và mục thư rác, rồi mở email mới nhất.`)
      setResendAt(Date.now() + 60_000)
      setRemaining(60)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Chưa thể gửi liên kết đăng nhập. Hãy thử lại.')
    } finally {
      requestPending.current = false
      setPending(false)
    }
  }
  return (
    <main className={styles.page} data-ai-id="login-page">
      <section className={styles.story}>
        <Brand />
        <p className={styles.eyebrow}>Mỗi chuyến đi · Một kế hoạch chung</p>
        <h1>Gom mọi kế hoạch chuyến đi vào một nơi.</h1>
        <p>Từ ly cà phê đầu tiên đến tổng chi phí cuối ngày — cả nhóm luôn nhìn cùng một kế hoạch.</p>
      </section>
      <section className={styles.card} aria-labelledby="login-title">
        <span className={styles.index}>ĐĂNG NHẬP</span>
        <h2 id="login-title">Chào bạn đồng hành.</h2>
        <p>Đăng nhập bằng liên kết gửi đến email, không cần mật khẩu. Sau khi đăng nhập, bạn có thể tạo chuyến đi hoặc chấp nhận lời mời trong ứng dụng để tham gia cùng nhóm.</p>
        <form className={styles.form} onSubmit={submit} aria-busy={pending}>
          <label htmlFor="login-email">Email của bạn</label>
          <input id="login-email" type="email" autoComplete="email" required placeholder="ban@example.com" value={email} disabled={pending} aria-describedby={error || authError ? 'login-error' : undefined} onChange={(event) => setEmail(event.target.value)} />
          <button className="button button--primary button--wide" type="submit" disabled={pending || remaining > 0}>
            <Mail size={20} aria-hidden="true" /> {pending ? 'Đang gửi…' : remaining > 0 ? `Gửi lại sau ${remaining}s` : sentEmail ? 'Gửi lại liên kết' : 'Gửi liên kết đăng nhập'}
          </button>
        </form>
        {message && <p className={styles.message} role="status">{message}</p>}
        {(error || authError) && <p id="login-error" className={styles.message} role="alert">{error || authError}</p>}
      </section>
    </main>
  )
}
