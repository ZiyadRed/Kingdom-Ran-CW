import { defineConfig } from '@playwright/test'

const baseURL = `http://127.0.0.1:${process.env.RANHQ_TEST_PORT || 4188}`
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: ['en', 'ja', 'ar', 'fr'].map(locale => ({ name: locale })),
  webServer: {
    command: 'node scripts/serve-built.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 10000,
  },
})
