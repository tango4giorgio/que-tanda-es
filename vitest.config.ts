import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 80 },
      exclude: [
        'src/main.tsx',
        'src/**/*.d.ts',
        'src/telemetry/**',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
        'tools/**',
        'tests/**',
        'dist/**'
      ]
    }
  }
});
