/// <reference lib="webworker" />
import { routeRequest } from './api/router';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(routeRequest(event.request));
  }
});
