import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 120000,
    sequence: {
      concurrent: false,
    },
  },
})
