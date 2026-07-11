import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/brand-arcade.spec.js',
      '**/smoke.spec.js',
      '**/node_modules/**',
    ],
  },
});
