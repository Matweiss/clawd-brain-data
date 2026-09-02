import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The site password is checked inside each function. Off for the suite;
    // tests/site-auth.spec.js turns it on to test the gate itself.
    env: { SITE_AUTH: 'off' },
    exclude: [
      '**/brand-arcade.spec.js',
      '**/smoke.spec.js',
      '**/forecast-v2.spec.js',
      '**/free-to-play.e2e.spec.js',
      '**/tournament-payoff.e2e.spec.js',
      '**/node_modules/**',
    ],
  },
});
