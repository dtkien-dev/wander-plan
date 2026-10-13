import { LogIn } from 'lucide-react'
import { Brand } from '../components/Brand'
import { useAuth } from '../providers/AuthProvider'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()
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
        <p>Chỉ thành viên của chuyến đi mới có thể xem và chỉnh sửa kế hoạch.</p>
        <button className="button button--primary button--wide" type="button" onClick={() => void signInWithGoogle()}>
          <LogIn size={20} aria-hidden="true" /> Tiếp tục với Google
        </button>
      </section>
    </main>
  )
}
