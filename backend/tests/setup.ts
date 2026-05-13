import { beforeAll } from 'vitest'
import { execFileSync } from 'child_process'
import { resolve } from 'path'

/**
 * Shared test setup.
 *
 * Default unit and contract tests use this file only to provide safe dummy
 * Supabase environment values. Integration setup runs only when
 * RUN_INTEGRATION=1 is present, and it is additionally guarded by
 * ALLOW_DB_RESET=1 because Prisma resets and rebuilds the public schema
 * from migrations.
 */
process.env.SUPABASE_URL ||= 'http://localhost:54321'
process.env.SUPABASE_PUBLISHABLE_KEY ||= 'test-supabase-key'

const runIntegration = process.env.RUN_INTEGRATION === '1'
const testDatabaseUrl = process.env.TEST_DATABASE_URL
const testDirectDatabaseUrl = process.env.TEST_DIRECT_DATABASE_URL

// Some integration modules create Prisma clients at import time. Put the test
// database URL into DATABASE_URL before those modules are imported so they
// cannot accidentally bind to a developer/shared database from DATABASE_URL.
if (runIntegration && testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl
}

type ExecFileError = Error & {
  stdout?: Buffer | string
  stderr?: Buffer | string
}

const backendRoot = resolve(__dirname, '..')

const assertDirectSetupUrl = (databaseUrl: string) => {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(databaseUrl)
  } catch {
    throw new Error('TEST_DIRECT_DATABASE_URL must be a valid PostgreSQL connection URL.')
  }

  if (parsedUrl.searchParams.get('pgbouncer') === 'true' || parsedUrl.port === '6543') {
    throw new Error(
      'TEST_DIRECT_DATABASE_URL must be a direct/non-pgbouncer test database URL so Prisma can reset schema safely.'
    )
  }
}

const runPrismaCommand = (
  args: string[],
  clientDatabaseUrl: string,
  setupDatabaseUrl: string
) => {
  const prismaCli = resolve(__dirname, '../node_modules/prisma/build/index.js')

  try {
    execFileSync(process.execPath, [prismaCli, ...args], {
      cwd: backendRoot,
      env: {
        ...process.env,
        DATABASE_URL: clientDatabaseUrl,
        DIRECT_URL: setupDatabaseUrl,
      },
      encoding: 'utf8',
      stdio: 'pipe',
    })
  } catch (error) {
    const execError = error as ExecFileError
    const output = [execError.stdout, execError.stderr]
      .map((stream) => stream?.toString().trim())
      .filter(Boolean)
      .join('\n')

    throw new Error(
      `Prisma command failed: prisma ${args.join(' ')}\n${output || execError.message}`
    )
  }
}

beforeAll(async () => {
  if (!runIntegration) {
    return
  }

  // Integration tests are destructive by design: Prisma resets and rebuilds the
  // public schema from migrations. Keep this gated behind both
  // RUN_INTEGRATION and ALLOW_DB_RESET so the default unit test path cannot
  // accidentally reset a developer or shared database.
  if (!testDatabaseUrl) {
    throw new Error(
      'RUN_INTEGRATION=1 requires TEST_DATABASE_URL. DATABASE_URL is not accepted for destructive integration tests.'
    )
  }

  if (!testDirectDatabaseUrl) {
    throw new Error(
      'RUN_INTEGRATION=1 requires TEST_DIRECT_DATABASE_URL for Prisma schema reset and trigger setup.'
    )
  }

  if (process.env.ALLOW_DB_RESET !== '1') {
    throw new Error(
      'Integration setup resets the database with Prisma. Set ALLOW_DB_RESET=1 only for a dedicated test database.'
    )
  }

  assertDirectSetupUrl(testDirectDatabaseUrl)

  process.env.DATABASE_URL = testDatabaseUrl
  process.env.DIRECT_URL = testDirectDatabaseUrl

  runPrismaCommand(
    [
      'migrate',
      'reset',
      '--force',
      '--skip-generate',
      '--skip-seed',
    ],
    testDatabaseUrl,
    testDirectDatabaseUrl
  )
})
