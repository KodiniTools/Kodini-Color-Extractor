import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/kodini-color-extractor/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  }
})
