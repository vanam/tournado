import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    {
      name: 'storybook-isolated-database',
      enforce: 'pre',
      resolveId(source, importer) {
        if (
          source === './database' &&
          importer?.replaceAll('\\', '/').endsWith('/src/db/index.ts')
        )
          return fileURLToPath(new URL('./database.ts', import.meta.url));
      },
    },
    react(),
    tailwindcss(),
  ],
  build: {
    // Documentation includes the lazy-loaded axe and Storybook runtimes. The app keeps Vite's normal budget.
    chunkSizeWarningLimit: 1600,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      'virtual:pwa-register': fileURLToPath(
        new URL('./pwa.js', import.meta.url),
      ),
    },
  },
});
