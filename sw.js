// ===============================================
// SERVICE WORKER - CASOS DE PRUEBA PWA
// ===============================================

// VERSIÓN AUTOMÁTICA basada en timestamp
const CACHE_NAME = `test-cases-pwa-${Date.now()}`;

// MODO DE DESARROLLO - Cambiar a false para producción
const DEVELOPMENT_MODE = true;

// LISTA DE ARCHIVOS PRINCIPALES (para verificar cambios)
const CORE_FILES = [
  '/',
  '/index.html',
  '/styles.css', 
  '/script.js',
  '/manifest.json'
];

// URLs externas (cachear normalmente)
const EXTERNAL_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 🚀 INSTALACIÓN
self.addEventListener('install', event => {
  console.log(`🔧 PWA Auto-Update: Instalando... (Modo: ${DEVELOPMENT_MODE ? 'Desarrollo' : 'Producción'})`);
  
  if (DEVELOPMENT_MODE) {
    // En desarrollo: Activar inmediatamente, cache mínimo
    console.log('🔄 Modo desarrollo: Activación inmediata');
    self.skipWaiting();
    return;
  }
  
  // En producción: Cache completo
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cacheando archivos...');
        return cache.addAll([...CORE_FILES, ...EXTERNAL_URLS]);
      })
      .then(() => self.skipWaiting())
  );
});

// 🔄 ACTIVACIÓN - Limpiar caches antiguos
self.addEventListener('activate', event => {
  console.log('✅ PWA Auto-Update: Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 📡 FETCH - Estrategia inteligente
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Ignorar extensiones y URLs problemáticas
  if (event.request.url.includes('chrome-extension://') || 
      event.request.url.includes('moz-extension://') ||
      event.request.url.includes('kaspersky-labs.com')) {
    return;
  }

  const url = new URL(event.request.url);
  const isLocalFile = url.origin === self.location.origin;
  const isCoreFile = CORE_FILES.some(file => 
    url.pathname === file || url.pathname.endsWith(file)
  );

  // 🔥 MODO DESARROLLO: Core files SIEMPRE desde red
  if (DEVELOPMENT_MODE && isLocalFile && isCoreFile) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          console.log(`🌐 DEV: ${url.pathname} desde red`);
          return response;
        })
        .catch(() => {
          console.log(`📦 DEV: ${url.pathname} fallback a cache`);
          return caches.match(event.request);
        })
    );
    return;
  }

  // 📦 MODO PRODUCCIÓN O ARCHIVOS EXTERNOS: Cache first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log(`📦 Cache: ${url.pathname}`);
          return response;
        }

        return fetch(event.request)
          .then(fetchResponse => {
            console.log(`🌐 Red: ${url.pathname}`);
            
            // Cachear respuesta válida
            if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }

            return fetchResponse;
          })
          .catch(() => {
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

// 💬 MENSAJES
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('🔄 Forzando actualización...');
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME,
      mode: DEVELOPMENT_MODE ? 'desarrollo' : 'producción',
      timestamp: Date.now()
    });
  }
});

// 🎯 ERRORES
self.addEventListener('error', event => {
  console.error('❌ Error en Service Worker:', event.error);
});

// 🕐 AUTO-UPDATE: Verificar cambios periódicamente EN DESARROLLO
if (DEVELOPMENT_MODE) {
  // Verificar cambios cada 3 segundos en desarrollo
  setInterval(async () => {
    try {
      const clients = await self.clients.matchAll();
      if (clients.length === 0) return; // No hay clientes activos

      // Verificar si hay cambios en archivos principales
      const hasChanges = await checkForUpdates();
      if (hasChanges) {
        console.log('🆕 Cambios detectados, notificando clientes...');
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            timestamp: Date.now()
          });
        });
      }
    } catch (error) {
      console.log('🔄 Error verificando actualizaciones:', error);
    }
  }, 3000);
}

// Función para detectar cambios
async function checkForUpdates() {
  try {
    for (const file of CORE_FILES) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(file);
      
      if (!cachedResponse) continue;
      
      const networkResponse = await fetch(file, { cache: 'no-cache' });
      const cachedText = await cachedResponse.text();
      const networkText = await networkResponse.text();
      
      if (cachedText !== networkText) {
        console.log(`🔄 Archivo modificado: ${file}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log('❌ Error detectando cambios:', error);
    return false;
  }
}

console.log(`🚀 PWA Auto-Update cargado - ${DEVELOPMENT_MODE ? 'DESARROLLO' : 'PRODUCCIÓN'} - ${CACHE_NAME}`);