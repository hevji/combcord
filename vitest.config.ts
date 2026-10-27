import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './vencord-plugin/combcord'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['vencord-plugin/combcord/**/*.test.ts'],
  },
});