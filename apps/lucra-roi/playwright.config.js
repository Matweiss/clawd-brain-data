import { defineConfig } from '@playwright/test';

const PORT = process.env.PW_PORT || 8766;

export default defineConfig({
  testDir: './tests',
  testMatch: ['smoke.spec.js', 'brand-arcade.spec.js', 'forecast-v2.spec.js', 'free-to-play.e2e.spec.js', 'tournament-payoff.e2e.spec.js'],
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `PW_PORT=${PORT} node tests/dev-server.mjs`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
