import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  base: '/lazgo/', // ← TAMBAH INI untuk XAMPP
  server: {
    port: 3000,
    open: true
  }
})