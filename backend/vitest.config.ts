import 'dotenv/config'
import { defineConfig } from 'vitest/config'

const runIntegration = process.env.RUN_INTEGRATION === '1'

export default defineConfig({
  test: {
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: !runIntegration,
    hookTimeout: 120000,
    testTimeout: 120000,
    sequence: {
      concurrent: false,
    },
  },
})
