import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import console from 'node:console'
import process from 'node:process'
import { URL } from 'node:url'

// Applies config/access.json to private.access_settings through the Supabase CLI.
// Usage: npm run access:apply -- --local | --project-ref <ref>
const args = process.argv.slice(2)
const refIndex = args.indexOf('--project-ref')
const target = args.includes('--local')
  ? ['--local']
  : refIndex !== -1 && /^[a-z0-9]{20}$/.test(args[refIndex + 1] ?? '')
    ? ['--project-ref', args[refIndex + 1]]
    : null
if (!target) {
  console.error('Chọn đích: --local hoặc --project-ref <project-ref>.')
  process.exit(1)
}

const config = JSON.parse(readFileSync(new URL('../config/access.json', import.meta.url), 'utf8'))
if (typeof config.allowNewAccounts !== 'boolean') {
  console.error('config/access.json: allowNewAccounts phải là true hoặc false.')
  process.exit(1)
}

const directory = mkdtempSync(join(tmpdir(), 'wander-plan-access-'))
const sqlFile = join(directory, 'apply.sql')
writeFileSync(sqlFile, `insert into private.access_settings (singleton, allow_new_accounts, updated_at)
values (true, ${config.allowNewAccounts}, now())
on conflict (singleton) do update set allow_new_accounts = excluded.allow_new_accounts, updated_at = now()
returning allow_new_accounts;
`)

try {
  const result = spawnSync('npx', ['supabase', 'db', 'query', ...target, '--file', `"${sqlFile}"`], {
    encoding: 'utf8',
    shell: true,
  })
  process.stdout.write(result.stdout ?? '')
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? '')
    process.exit(result.status ?? 1)
  }
  if (!new RegExp(`\\b${config.allowNewAccounts}\\b`).test(result.stdout ?? '')) {
    console.error('Không xác nhận được giá trị đã áp dụng; hãy kiểm tra private.access_settings.')
    process.exit(1)
  }
  console.log(`Đã áp dụng allowNewAccounts=${config.allowNewAccounts} (${target.join(' ')}).`)
} finally {
  rmSync(directory, { recursive: true, force: true })
}
