import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@zv/db': path.resolve(__dirname, './packages/db/src'),
      '@zv/contracts': path.resolve(__dirname, './packages/contracts/src'),
      '@zv/utils': path.resolve(__dirname, './packages/utils/src'),
    },
  },
});
