import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Simulates a browser in the terminal
    globals: true,        // Allows us to use 'describe' and 'it' without importing them
    setupFiles: './vitest.setup.ts',
  },
});