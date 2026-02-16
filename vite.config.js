import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      injectRegister: null,
      registerType: 'prompt',
      manifest: false,
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  base: "/"
})
