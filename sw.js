const CACHE_NAME = "goalstats-shell-v1";
const SHELL = ["./","./index.html","./app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(SHELL)))});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith("goalstats-shell-")&&k!==CACHE_NAME).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener("fetch",event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=="GET"||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cached=await caches.match(req);
  const isNav=req.mode==="navigate";
  if(isNav){try{const fresh=await fetch(req);if(fresh.ok){const c=await caches.open(CACHE_NAME);c.put(req,fresh.clone())}return fresh}catch{return cached||caches.match("./index.html")}}
  if(cached)return cached;
  try{const response=await fetch(req);if(response.ok){const c=await caches.open(CACHE_NAME);c.put(req,response.clone())}return response}catch{return new Response("Offline: este recurso ainda não foi guardado.",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}})}
 })())
});
