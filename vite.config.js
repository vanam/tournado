import { defineConfig, build } from 'vite'
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
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'sw-api': path.resolve(__dirname, 'src/swApi.ts'),
      },
      output: {
        entryFileNames(chunkInfo) {
          if (chunkInfo.name === 'sw-api') return 'sw-api.js';
          return 'assets/[name]-[hash].js';
        },
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/react-hook-form')) {
            return 'forms';
          }
          if (id.includes('node_modules/sonner')) {
            return 'notifications';
          }
        }
      }
    }
  },
  plugins: [
    {
      name: 'sw-api-dev',
      apply: 'serve',
      configureServer(server) {
        let cache = null

        server.watcher.on('change', () => { cache = null })

        server.middlewares.use('/sw-api.js', async (_req, res) => {
          try {
            if (!cache) {
              const result = await build({
                configFile: false,
                resolve: {
                  alias: { '@': path.resolve(__dirname, './src') },
                },
                define: {
                  'process.env.NODE_ENV': JSON.stringify('development'),
                },
                build: {
                  write: false,
                  lib: {
                    entry: path.resolve(__dirname, 'src/swApi.ts'),
                    formats: ['iife'],
                    name: 'SwApi',
                  },
                  rollupOptions: {
                    output: { inlineDynamicImports: true },
                  },
                },
              })
              const output = Array.isArray(result) ? result[0] : result
              cache = output.output[0].code
            }
            res.setHeader('Content-Type', 'application/javascript')
            res.end(cache)
          } catch (err) {
            console.error('[sw-api-dev]', err)
            res.statusCode = 500
            res.end('// build error — see terminal')
          }
        })
      },
    },
    react(),
    tailwindcss(),
    {
      name: 'font-preload',
      transformIndexHtml: {
        order: 'post',
        handler(html, ctx) {
          if (!ctx.bundle) return html;
          const keys = Object.keys(ctx.bundle);
          const fontKeys = [
            keys.find(key => key.includes('inter-latin-ext-wght-normal') && key.endsWith('.woff2')),
            keys.find(key => key.includes('inter-latin-wght-normal') && key.endsWith('.woff2')),
          ].filter(Boolean);
          if (!fontKeys.length) return html;
          const preloads = fontKeys
            .map(k => `    <link rel="preload" as="font" type="font/woff2" crossorigin href="/${k}">`)
            .join('\n') + '\n';
          return html.replace('  </head>', preloads + '  </head>');
        }
      }
    },
    VitePWA({
      injectRegister: null,
      registerType: 'prompt',
      manifest: false,
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googletagmanager\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gtm-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/(www\.google-analytics\.com|region1\.google-analytics\.com|analytics\.google\.com)\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ga-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  base: "/"
})
