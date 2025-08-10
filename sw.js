// ===============================================
// SERVICE WORKER - CASOS DE PRUEBA PWA
// ===============================================

// CAMBIAR SOLO CUANDO HAGAS CAMBIOS IMPORTANTES (nuevas funcionalidades principales)
const CACHE_NAME = 'test-cases-pwa-v3.0.0';

// MODO DE DESARROLLO - Cambiar a true durante desarrollo activo
const DEVELOPMENT_MODE = true; // ← Cambiar a false para producción

const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css', 
  '/script.js',
  '/manifest.json',
  // CDNs externos que usa tu app
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 🚀 INSTALACIÓN - Cache archivos importantes
self.addEventListener('install', event => {
  console.log(`🔧 PWA v3.0.0: Service Worker instalándose... (Modo: ${DEVELOPMENT_MODE ? 'Desarrollo' : 'Producción'})`);
  
  if (DEVELOPMENT_MODE) {
    // En desarrollo: Activar inmediatamente sin cachear mucho
    self.skipWaiting();
    return;
  }
  
  // En producción: Cachear todo
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 PWA v3.0.0: Archivos agregados al cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// 🔄 ACTIVACIÓN
self.addEventListener('activate', event => {
  console.log('✅ PWA v3.0.0: Service Worker activándose...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ PWA: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 📡 FETCH - Estrategia diferente según modo
self.addEventListener('fetch', event => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests externos problemáticos
  if (event.request.url.includes('chrome-extension://') || 
      event.request.url.includes('moz-extension://') ||
      event.request.url.includes('kaspersky-labs.com')) {
    return;
  }

  // MODO DESARROLLO: Siempre red primero para archivos principales
  if (DEVELOPMENT_MODE) {
    if (event.request.url.includes('index.html') || 
        event.request.url.includes('styles.css') ||
        event.request.url.includes('script.js') ||
        event.request.url.includes('manifest.json')) {
      
      event.respondWith(
        fetch(event.request).then(fetchResponse => {
          console.log('🔄 DEV: Siempre desde red:', event.request.url);
          return fetchResponse;
        }).catch(() => {
          console.log('📦 DEV: Fallback a cache:', event.request.url);
          return caches.match(event.request);
        })
      );
      return;
    }
  }

  // MODO PRODUCCIÓN O ARCHIVOS SECUNDARIOS: Cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('📦 PWA: Desde cache:', event.request.url);
          return response;
        }

        console.log('🌐 PWA: Desde red:', event.request.url);
        return fetch(event.request).then(fetchResponse => {
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return fetchResponse;
        }).catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          return new Response('Recurso no disponible offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// 💬 MENSAJES desde la app principal
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🔄 PWA: Forzando actualización...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME,
      mode: DEVELOPMENT_MODE ? 'desarrollo' : 'producción'
    });
  }
});

// 🎯 MANEJO de errores
self.addEventListener('error', event => {
  console.error('❌ PWA: Error en Service Worker:', event.error);
});

// 📊 LOG de instalación exitosa
console.log(`🚀 PWA v3.0.0: Service Worker cargado - Modo ${DEVELOPMENT_MODE ? 'DESARROLLO' : 'PRODUCCIÓN'} - ${CACHE_NAME}`);