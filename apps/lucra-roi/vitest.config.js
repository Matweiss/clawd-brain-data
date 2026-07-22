import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/brand-arcade.spec.js',
      '**/smoke.spec.js',
      '**/forecast-v2.spec.js',
      '**/node_modules/**',
    ],
  },
});
