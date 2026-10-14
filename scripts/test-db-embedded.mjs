import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import console from 'node:console'
import process from 'node:process'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { pgtap } from '@electric-sql/pglite-pgtap'

// An ephemeral PostgreSQL fallback for SQL/RLS checks when Docker is unavailable.
// It does not exercise Supabase Auth/Realtime services or concurrent sessions.
const root = new URL('../', import.meta.url)
const database = new PGlite({ extensions: { pgcrypto, pgtap } })

try {
  await database.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create table auth.users (
      id uuid primary key,
      aud text,
      role text,
      email text,
      raw_app_meta_data jsonb,
      raw_user_meta_data jsonb,
      created_at timestamptz,
      updated_at timestamptz
    );
    create function auth.uid() returns uuid language sql stable as $$
      select coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
      )::uuid;
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
    $$;
    create publication supabase_realtime;
    create extension pgtap;
  `)

  const migrations = (await readdir(new URL('supabase/migrations/', root)))
    .filter((name) => name.endsWith('.sql')).sort()
  for (const name of migrations) {
    await database.exec(await readFile(new URL(`supabase/migrations/${name}`, root), 'utf8'))
  }
  console.log(`Applied ${migrations.length} unchanged migrations to ephemeral PostgreSQL.`)

  const tests = (await readdir(new URL('supabase/tests/database/', root)))
    .filter((name) => name.endsWith('.sql')).sort()
  let totalAssertions = 0
  for (const name of tests) {
    const results = await database.exec(await readFile(new URL(`supabase/tests/database/${name}`, root), 'utf8'))
    const lines = results.flatMap((result) => result.rows.flatMap((row) =>
      Object.values(row).filter((value) => typeof value === 'string').flatMap((value) => value.split('\n'))
    ))
    const plan = lines.find((line) => /^1\.\.\d+$/.test(line))
    const assertions = lines.filter((line) => /^(?:not )?ok \d+\b/.test(line))
    const failures = lines.filter((line) => /^(not ok\b|Bail out!|# (Looks like|No tests run))/.test(line))
    const expected = plan ? Number(plan.slice(3)) : 0
    if (!expected || assertions.length !== expected || failures.length) {
      console.error(lines.filter((line) => /^(1\.\.|(?:not )?ok\b|#|Bail out!)/.test(line)).join('\n'))
      throw new Error(`${name}: ${assertions.length}/${expected} assertions; ${failures.length} TAP failures`)
    }
    totalAssertions += assertions.length
    console.log(`${name}: ${assertions.length} assertions passed`)
  }
  if (!tests.length) throw new Error(`No database tests found in ${fileURLToPath(root)}`)
  console.log(`All ${totalAssertions} assertions passed across ${tests.length} database suites.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await database.close()
}
