// Service worker: rede primeiro, cópia em cache como reserva (mesma estratégia do Nexus).
// Só guarda o código do app, as fontes e os módulos do Firebase. Nunca guarda dados financeiros:
// as chamadas ao Firestore e ao login não passam por aqui.
const CACHE = 'orcamento-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './firebase-config.js', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
function cacheable(url){
  if(url.origin === self.location.origin) return true;
  if(url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0) return true;
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return true;
  return false;
}
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(!cacheable(url)) return;
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
