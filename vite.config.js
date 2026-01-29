import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/kodini-color-extractor/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
