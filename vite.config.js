import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { macosVolumePlugin } from './scripts/macosVolumePlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), macosVolumePlugin()],
  base: './',
  server: {
    host: true, // 0.0.0.0 — reachable from Simple Browser, LAN, tunnels
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
