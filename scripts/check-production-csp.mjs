import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Serve built files through Playwright routing, with the real HTML CSP and an isolated browser database.
const directory = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'http://localhost:4179';
const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ locale: 'en-US', serviceWorkers: 'block' });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    const file = path.resolve(directory, `.${url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(directory)) return route.abort();
    try {
      await route.fulfill({ body: await readFile(file), contentType: mimeTypes[path.extname(file)] ?? 'application/octet-stream' });
    } catch { await route.fulfill({ status: 404 }); }
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole('heading', { name: 'Tournaments', exact: true }).waitFor();
  assert.deepEqual(errors, [], 'Production startup must not throw, including CSP/Trusted Types errors');
  console.log('Production application starts in Chromium with its original CSP and Trusted Types policy.');
} finally {
  await browser.close();
}
