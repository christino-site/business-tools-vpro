"use strict";

/* =====================================================================
   Business Tools Pro – service worker (fonctionnement hors ligne)
   - Met en cache les fichiers de l'application, et UNIQUEMENT ceux-là.
   - Ne touche jamais aux requêtes vers d'autres sites (Google Analytics,
     WhatsApp, et plus tard le serveur de licences) : elles passent normalement.

   POUR PUBLIER UNE MISE À JOUR : change VERSION ci-dessous (ex. '1' → '2'),
   et envoie CE FICHIER EN DERNIER sur GitHub, après tous les autres fichiers.
   ===================================================================== */
const VERSION = '1';
const CACHE = 'bt-pro-' + VERSION;

// Tous les fichiers nécessaires pour ouvrir l'application sans connexion.
const ASSETS = [
  './',
  'index.html',
  'style.min.css',
  'script.min.js',
  'pwa.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
];

// Installation : tout est téléchargé (en ignorant le cache du navigateur) ou rien.
// Si un seul fichier manque, l'installation échoue et l'ancienne version reste en place.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async (path) => {
      const response = await fetch(new Request(path, { cache: 'reload' }));
      if (!response.ok) throw new Error(path + ' : erreur ' + response.status);
      await cache.put(path, response);
    }));
  })());
});

// Activation : supprime les caches des anciennes versions.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('bt-pro-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Mise à jour : la page demande l'activation quand l'utilisateur clique sur « Mettre à jour ».
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Lecture : le cache d'abord (rapide, marche hors ligne), le réseau seulement si le fichier n'y est pas.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return; // autres sites : jamais interceptés
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    return fetch(request);
  })());
});
