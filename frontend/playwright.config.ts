import { defineConfig, devices } from '@playwright/test'

process.env.VITE_BACKEND_URL ??= 'http://mock.api'
process.env.VITE_E2E_AUTH ??= 'true'
process.env.VITE_GEOAPIFY_KEY ??= 'test-geoapify-key'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    geolocation: {
      latitude: -36.8406,
      longitude: 174.7677,
    },
    permissions: ['geolocation'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: 'http://127.0.0.1:5173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
