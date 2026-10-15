import rawAccessConfig from '../../config/access.json'

export interface AccessConfig {
  /** Server-enforced by the before-user-created hook once `npm run access:apply` runs. */
  allowNewAccounts: boolean
  /** Shows the Google button; the provider itself is enabled in the Supabase dashboard. */
  googleSignIn: boolean
}

export function parseAccessConfig(value: unknown): AccessConfig {
  const config = value as Partial<Record<keyof AccessConfig, unknown>> | null
  if (!config || typeof config.allowNewAccounts !== 'boolean' || typeof config.googleSignIn !== 'boolean') {
    throw new Error('config/access.json cần allowNewAccounts và googleSignIn kiểu true/false.')
  }
  return { allowNewAccounts: config.allowNewAccounts, googleSignIn: config.googleSignIn }
}

export const accessConfig = parseAccessConfig(rawAccessConfig)

// Must match the message returned by public.hook_before_user_created.
export const newAccountsClosedMessage = 'WanderPlan đang tạm dừng nhận tài khoản mới. Hãy nhờ chủ nhóm gửi lời mời đến email của bạn rồi thử lại.'
