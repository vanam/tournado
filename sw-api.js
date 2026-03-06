const i=self;i.addEventListener("install",()=>{i.skipWaiting()});i.addEventListener("activate",t=>{t.waitUntil(i.clients.claim())});
