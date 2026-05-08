import { afterAll, beforeAll } from 'vitest'
import { Client } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'

process.env.SUPABASE_URL ||= 'http://localhost:54321'
process.env.SUPABASE_PUBLISHABLE_KEY ||= 'test-supabase-key'

let setupClient: Client | undefined

const readSql = (relativePath: string) =>
  readFileSync(resolve(__dirname, relativePath), 'utf8')

beforeAll(async () => {
  if (!process.env.RUN_INTEGRATION) {
    return
  }

  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('RUN_INTEGRATION requires TEST_DATABASE_URL or DATABASE_URL')
  }

  if (process.env.ALLOW_DB_RESET !== '1') {
    throw new Error(
      'Integration setup runs schema.sql, which drops public schema. Set ALLOW_DB_RESET=1 for a dedicated test database.'
    )
  }

  process.env.DATABASE_URL = databaseUrl
  setupClient = new Client({ connectionString: databaseUrl })
  await setupClient.connect()

  await setupClient.query(readSql('../sql_scripts/schema.sql'))
  await setupClient.query(readSql('../sql_scripts/stat_trigger.sql'))
  await setupClient.query(readSql('../sql_scripts/badge_trigger.sql'))
})

afterAll(async () => {
  await setupClient?.end()
})
