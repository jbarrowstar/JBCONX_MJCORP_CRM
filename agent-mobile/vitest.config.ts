import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Component + integration tests: real React screens, real Redux store, real HTTP to a running CRM backend.
// They need VITE_API_BASE_URL pointing at a TEST backend (see docs/FRONTEND_TESTING.md).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    environment: 'happy-dom',
    environmentOptions: { happyDOM: { url: 'http://localhost:3000' } },
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.tsx'],
    testTimeout: 30000,
    hookTimeout: 90000,
    fileParallelism: false,
  },
});
