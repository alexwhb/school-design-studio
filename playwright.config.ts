import { defineConfig, devices } from '@playwright/test'

export const VUE_URL = process.env.VUE_URL || 'http://127.0.0.1:5174'
export const REACT_URL = process.env.REACT_URL || 'http://127.0.0.1:5273'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  // Every parity case drives two apps in series, and the slowest opens a picker
  // of forty-four preset covers in each.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    baseURL: REACT_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'parity', testMatch: /parity\/.*\.spec\.ts/ },
    { name: 'e2e', testMatch: /e2e\/.*\.spec\.ts/ },
  ],
})
