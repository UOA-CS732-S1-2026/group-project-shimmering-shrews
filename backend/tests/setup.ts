import { afterAll, beforeAll } from 'vitest'
import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Shared test setup.
 *
 * Default unit and contract tests use this file only to provide safe dummy
 * Supabase environment values. Integration setup runs only when
 * RUN_INTEGRATION=1 is present, and it is additionally guarded by
 * ALLOW_DB_RESET=1 because it rebuilds the public schema.
 */
process.env.SUPABASE_URL ||= 'http://localhost:54321'
process.env.SUPABASE_PUBLISHABLE_KEY ||= 'test-supabase-key'

const runIntegration = process.env.RUN_INTEGRATION === '1'
const testDatabaseUrl = process.env.TEST_DATABASE_URL

// Some integration modules create Prisma clients at import time. Put the test
// database URL into DATABASE_URL before those modules are imported so they
// cannot accidentally bind to a developer/shared database from DATABASE_URL.
if (runIntegration && testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl
}

let setupClient: Client | undefined

const readSql = (relativePath: string) =>
  readFileSync(resolve(__dirname, relativePath), 'utf8')

const closeSetupClient = async () => {
  if (!setupClient) {
    return
  }

  const client = setupClient
  setupClient = undefined
  await client.end()
}

beforeAll(async () => {
  if (!runIntegration) {
    return
  }

  // Integration tests are destructive by design: schema.sql drops and recreates
  // the public schema, then trigger SQL is applied. Keep this gated behind both
  // RUN_INTEGRATION and ALLOW_DB_RESET so the default unit test path cannot
  // accidentally reset a developer or shared database.
  if (!testDatabaseUrl) {
    throw new Error(
      'RUN_INTEGRATION=1 requires TEST_DATABASE_URL. DATABASE_URL is not accepted for destructive integration tests.'
    )
  }

  if (process.env.ALLOW_DB_RESET !== '1') {
    throw new Error(
      'Integration setup runs schema.sql, which drops public schema. Set ALLOW_DB_RESET=1 for a dedicated test database.'
    )
  }

  process.env.DATABASE_URL = testDatabaseUrl
  setupClient = new Client({ connectionString: testDatabaseUrl })

  try {
    await setupClient.connect()

    await setupClient.query(readSql('../sql_scripts/schema.sql'))
    await setupClient.query(readSql('../sql_scripts/stat_trigger.sql'))
    await setupClient.query(readSql('../sql_scripts/badge_trigger.sql'))
  } catch (error) {
    await closeSetupClient()
    throw error
  }
})

afterAll(async () => {
  await closeSetupClient()
})
