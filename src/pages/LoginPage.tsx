import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Brand } from '../components/Brand'
import { accessConfig } from '../lib/accessConfig'
import { useAuth } from '../providers/AuthProvider'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { authError, signInWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const requestPending = useRef(false)
  const [googlePending, setGooglePending] = useState(false)

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
  const continueWithGoogle = async () => {
    if (googlePending) return
    setGooglePending(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Chưa thể mở đăng nhập Google. Hãy thử lại.')
      setGooglePending(false)
    }
  }
  return (
    <main className={styles.page} data-ai-id="login-page">
      <section className={styles.story}>
        <Brand />
        <h1>Gom mọi kế hoạch chuyến đi vào một nơi.</h1>
        <p>Từ ly cà phê đầu tiên đến tổng chi phí cuối ngày — cả nhóm luôn nhìn cùng một kế hoạch.</p>
        <figure className={styles.sample} aria-label="Ví dụ bảng lịch trong ngày">
          <figcaption>Ví dụ</figcaption>
          <ol aria-hidden="true">
            <li><time>07:00</time><span>Bánh căn Nhà Chung</span><em>Xong</em></li>
            <li className={styles.sampleNow}><time>09:30</time><span>Đồi chè Cầu Đất</span><em>Đang diễn ra</em></li>
            <li><time>15:30</time><span>Cà phê Tùng</span><em>Sắp tới</em></li>
          </ol>
        </figure>
      </section>
      <section className={styles.card} aria-labelledby="login-title">
        <h2 id="login-title">Chào bạn đồng hành.</h2>
        <p>{accessConfig.googleSignIn ? 'Đăng nhập bằng Google hoặc liên kết gửi đến email, không cần mật khẩu.' : 'Đăng nhập bằng liên kết gửi đến email, không cần mật khẩu.'} Sau khi đăng nhập, bạn có thể tạo chuyến đi hoặc chấp nhận lời mời trong ứng dụng để tham gia cùng nhóm.</p>
        {!accessConfig.allowNewAccounts && <p className={styles.note}>Tài khoản mới cần được chủ nhóm mời bằng email trước khi đăng nhập lần đầu.</p>}
        {accessConfig.googleSignIn && <>
          <button className={`button button--wide ${styles.google}`} type="button" disabled={googlePending || pending} onClick={() => void continueWithGoogle()}>
            <GoogleMark /> {googlePending ? 'Đang mở Google…' : 'Đăng nhập với Google'}
          </button>
          <p className={styles.divider}><span>hoặc dùng email</span></p>
        </>}
        <form className={styles.form} onSubmit={submit} aria-busy={pending}>
          <label htmlFor="login-email">Email của bạn</label>
          <input id="login-email" type="email" autoComplete="email" required placeholder="ban@example.com" value={email} disabled={pending} aria-describedby={error || authError ? 'login-error' : undefined} onChange={(event) => setEmail(event.target.value)} />
          <button className="button button--primary button--wide" type="submit" disabled={pending || remaining > 0}>
            <Mail size={20} aria-hidden="true" /> {pending ? 'Đang gửi…' : remaining > 0 ? `Gửi lại sau ${remaining}s` : sentEmail ? 'Gửi lại liên kết' : 'Gửi liên kết đăng nhập'}
          </button>
        </form>
        {message && <p className={styles.message} role="status">{message}</p>}
        {(error || authError) && <p id="login-error" className={styles.error} role="alert">{error || authError}</p>}
      </section>
    </main>
  )
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
