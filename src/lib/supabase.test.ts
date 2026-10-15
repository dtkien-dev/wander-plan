import { afterEach, describe, expect, it, vi } from 'vitest'

const localKey = 'sb_publishable_local-test-key'

async function loadConfig(env: Record<string, string | boolean>) {
  vi.resetModules()
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value)
  return import('./supabase')
}

describe('Supabase configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lets development builds target a local Supabase stack', async () => {
    const config = await loadConfig({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: localKey, VITE_DEMO_MODE: 'false' })
    expect(config.isSupabaseConfigured).toBe(true)
    expect(config.configurationError).toBeNull()
  })

  it('keeps production builds limited to hosted Supabase projects', async () => {
    const config = await loadConfig({ PROD: true, VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: localKey, VITE_DEMO_MODE: 'false' })
    expect(config.isSupabaseConfigured).toBe(false)
    expect(config.configurationError).not.toBeNull()
  })

  it('rejects non-loopback plain HTTP hosts in development', async () => {
    const config = await loadConfig({ VITE_SUPABASE_URL: 'http://example.com:54321', VITE_SUPABASE_PUBLISHABLE_KEY: localKey, VITE_DEMO_MODE: 'false' })
    expect(config.isSupabaseConfigured).toBe(false)
  })
})
