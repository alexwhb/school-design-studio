import { defineConfig, devices } from '@playwright/test'

export const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5273'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Each test gets its own context, so they do not share a design; the limit is
  // how many copies of the dev server one machine will answer for at once.
  workers: 4,
  reporter: [['list']],
  // The slowest cases open a picker of forty-four preset covers.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'e2e', testMatch: /e2e\/.*\.spec\.ts/ }],
})
