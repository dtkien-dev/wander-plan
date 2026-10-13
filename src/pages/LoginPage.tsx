import { useState, type FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { Brand } from '../components/Brand'
import { useAuth } from '../providers/AuthProvider'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setMessage('')
    try {
      await signInWithEmail(email.trim())
      setMessage('Đã gửi magic link. Hãy kiểm tra hộp thư của bạn.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Chưa thể gửi magic link. Hãy thử lại.')
    } finally {
      setPending(false)
    }
  }
  return (
    <main className={styles.page} data-ai-id="login-page">
      <section className={styles.story}>
        <Brand />
        <p className={styles.eyebrow}>Một chuyến đi · Ba người bạn</p>
        <h1>Gom mọi kế hoạch Đà Lạt vào một nơi.</h1>
        <p>Từ ly cà phê đầu tiên đến tổng chi phí cuối ngày — cả nhóm luôn nhìn cùng một kế hoạch.</p>
      </section>
      <section className={styles.card} aria-labelledby="login-title">
        <span className={styles.index}>01 / ĐĂNG NHẬP</span>
        <h2 id="login-title">Chào bạn đồng hành.</h2>
        <p>Chỉ thành viên của chuyến đi mới có thể xem và chỉnh sửa kế hoạch. Bạn không cần nhớ thêm mật khẩu.</p>
        <form className={styles.form} onSubmit={submit}>
          <label htmlFor="login-email">Email của bạn</label>
          <input id="login-email" type="email" autoComplete="email" required placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <button className="button button--primary button--wide" type="submit" disabled={pending}>
            <Mail size={20} aria-hidden="true" /> {pending ? 'Đang gửi…' : 'Gửi magic link'}
          </button>
        </form>
        {message && <p className={styles.message} role="status">{message}</p>}
      </section>
    </main>
  )
}
