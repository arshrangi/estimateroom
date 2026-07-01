// ABOUTME: Playwright config for Pointr's multi-client end-to-end tests.
// ABOUTME: Boots both Workers via `dev:all` and drives the app at http://localhost:3000.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev:all',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
