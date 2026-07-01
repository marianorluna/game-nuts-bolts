/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/android/**', '**/dist/**', '**/node_modules/**'],
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
