import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const validUrl = /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url ?? '')
const validKey = /^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(publishableKey ?? '')

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || (!import.meta.env.PROD && !url && !publishableKey)
export const isSupabaseConfigured = !isDemoMode && validUrl && validKey
export const configurationError = !isSupabaseConfigured && !isDemoMode
  ? 'WanderPlan chưa được kết nối đúng với Supabase. Vui lòng kiểm tra cấu hình triển khai.'
  : null

export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
