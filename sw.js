// ===============================================
// SERVICE WORKER - CASOS DE PRUEBA PWA
// ===============================================

const CACHE_NAME = 'test-cases-pwa-v2.0.0'; // ← CAMBIÉ VERSIÓN PARA FORZAR LIMPIEZA
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
  console.log('🔧 PWA v2.0.0: Service Worker instalándose...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 PWA v2.0.0: Archivos agregados al cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Activar inmediatamente el nuevo service worker
        return self.skipWaiting();
      })
  );
});

// 🔄 ACTIVACIÓN - Limpiar caches antiguos AGRESIVAMENTE
self.addEventListener('activate', event => {
  console.log('✅ PWA v2.0.0: Service Worker activándose...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar TODOS los caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ PWA: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las pestañas inmediatamente
      return self.clients.claim();
    })
  );
});

// 📡 FETCH - Estrategia Network First para manifest.json, Cache First para resto
self.addEventListener('fetch', event => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requests a APIs externas no cacheables
  if (event.request.url.includes('chrome-extension://') || 
      event.request.url.includes('moz-extension://') ||
      event.request.url.includes('kaspersky-labs.com')) {
    return;
  }

  // ESTRATEGIA ESPECIAL PARA MANIFEST.JSON - siempre buscar versión fresca
  if (event.request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request).then(fetchResponse => {
        console.log('🌐 PWA: Manifest.json actualizado desde red');
        // Actualizar cache con nueva versión
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return fetchResponse;
      }).catch(() => {
        console.log('📦 PWA: Usando manifest.json desde cache (sin red)');
        return caches.match(event.request);
      })
    );
    return;
  }

  // Para el resto de archivos, estrategia Cache First normal
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ✅ CACHE HIT: Devolver desde cache
        if (response) {
          console.log('📦 PWA: Sirviendo desde cache:', event.request.url);
          return response;
        }

        // ❌ CACHE MISS: Buscar en red
        console.log('🌐 PWA: Buscando en red:', event.request.url);
        
        return fetch(event.request).then(fetchResponse => {
          // Verificar si es una respuesta válida
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clonar respuesta (solo se puede leer una vez)
          const responseToCache = fetchResponse.clone();

          // Agregar al cache para próximas veces
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return fetchResponse;
        }).catch(() => {
          // 🚫 SIN RED: Si es HTML, devolver página offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Para otros recursos, simplemente fallar
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
      version: CACHE_NAME
    });
  }
});

// 📱 NOTIFICACIÓN de actualización disponible
self.addEventListener('updatefound', () => {
  console.log('🆕 PWA: Nueva versión disponible');
});

// 🎯 MANEJO de errores
self.addEventListener('error', event => {
  console.error('❌ PWA: Error en Service Worker:', event.error);
});

// 📊 LOG de instalación exitosa
console.log('🚀 PWA v2.0.0: Service Worker cargado correctamente - ' + CACHE_NAME);