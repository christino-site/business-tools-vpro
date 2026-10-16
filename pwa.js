"use strict";

/* =====================================================================
   Business Tools Pro – installation de l'application (PWA)
   Sections : 1. Outils  2. Bouton « Installer » (Android, ordinateur, iPhone/iPad)
              3. Mises à jour  4. Démarrage
   Aucun cookie. Les statistiques envoyées à Google Analytics (si présent) ne
   contiennent aucune donnée personnelle : seulement le nom de l'événement.
   ===================================================================== */
(function () {

  /* ---------- 1. Outils ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);

  const track = (name, params) => {
    try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* sans effet */ }
  };

  const ua = navigator.userAgent || '';
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Navigateurs intégrés à Facebook, Instagram, WhatsApp, TikTok… : l'installation y est impossible.
  const isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|TikTok|musical_ly|Snapchat|MicroMessenger|Line\//i.test(ua);

  /** Petite fenêtre d'aide. Texte brut uniquement (textContent). */
  function showDialog(title, paragraphs, steps) {
    const previousFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'pwa-overlay no-print';

    const box = document.createElement('div');
    box.className = 'pwa-dialog';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'pwaDialogTitle');

    const heading = document.createElement('h2');
    heading.id = 'pwaDialogTitle';
    heading.textContent = title;
    box.append(heading);

    paragraphs.forEach((text) => { const p = document.createElement('p'); p.textContent = text; box.append(p); });
    if (steps && steps.length) {
      const list = document.createElement('ol');
      steps.forEach((text) => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
      box.append(list);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn btn-primary';
    close.textContent = 'Compris';
    box.append(close);
    overlay.append(box);
    document.body.append(overlay);
    close.focus();

    const dismiss = () => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      // Le bouton d'origine peut se trouver dans le menu mobile refermé : on redonne alors le focus au bouton du menu.
      const target = previousFocus && previousFocus.offsetParent !== null ? previousFocus : $('#navToggle');
      if (target && target.focus) target.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onKey);
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
  }

  /* ---------- 2. Bouton « Installer » ---------- */
  let installEvent = null; // proposé par Chrome / Edge / Android

  function setInstallButton(visible) {
    const button = $('#installBtn');
    if (button) button.hidden = !visible;
  }

  function showIosHelp() {
    if (isInAppBrowser) {
      showDialog(
        'Ouvrez d\'abord dans Safari',
        ['L\'installation est impossible depuis le navigateur intégré à cette application (Facebook, Instagram, WhatsApp…).'],
        ['Ouvrez le menu de la page (⋯ ou « Partager »).', 'Choisissez « Ouvrir dans Safari » ou « Ouvrir dans le navigateur ».', 'Dans Safari, touchez le bouton Partager, puis « Sur l\'écran d\'accueil ».']
      );
    } else {
      showDialog(
        'Installer sur iPhone ou iPad',
        ['L\'application s\'ouvrira ensuite en plein écran, comme une application ordinaire.'],
        ['Touchez le bouton Partager (le carré avec une flèche vers le haut), en bas ou en haut de l\'écran.', 'Faites défiler et choisissez « Sur l\'écran d\'accueil ».', 'Touchez « Ajouter ».']
      );
    }
  }

  async function onInstallClick() {
    if (typeof window.setNavOpen === 'function') window.setNavOpen(false); // referme le menu mobile (fonction de script.js)
    if (installEvent) {
      const promptEvent = installEvent;
      installEvent = null;
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        track('pwa_install_prompt', { outcome: choice && choice.outcome });
        if (choice && choice.outcome === 'accepted') setInstallButton(false);
        else setInstallButton(true);
      } catch (e) { /* le navigateur a refusé : on ne fait rien de plus */ }
      return;
    }
    if (isIOS) showIosHelp();
  }

  function initInstall() {
    const button = $('#installBtn');
    if (!button) return;
    if (isStandalone()) { // déjà installée : ouverte comme une application
      setInstallButton(false);
      try {
        if (!sessionStorage.getItem('btProOpen')) { sessionStorage.setItem('btProOpen', '1'); track('pwa_open', { display_mode: 'standalone' }); }
      } catch (e) { track('pwa_open', { display_mode: 'standalone' }); }
      return;
    }
    button.addEventListener('click', onInstallClick);
    if (isIOS) setInstallButton(true); // iOS ne propose pas d'invite : on montre le mode d'emploi
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // on garde l'invite pour notre propre bouton
      installEvent = e;
      setInstallButton(true);
    });
    window.addEventListener('appinstalled', () => {
      installEvent = null;
      setInstallButton(false);
      track('pwa_installed');
    });
  }

  /* ---------- 3. Mises à jour ---------- */
  let updateRequested = false; // la page ne se recharge que si l'utilisateur a cliqué sur « Mettre à jour »

  function offerUpdate(registration) {
    if ($('.pwa-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'pwa-banner no-print';
    banner.setAttribute('role', 'status');

    const text = document.createElement('p');
    text.textContent = 'Une nouvelle version est disponible. La page va se recharger : terminez d\'abord votre document en cours.';

    const update = document.createElement('button');
    update.type = 'button';
    update.className = 'btn btn-primary';
    update.textContent = 'Mettre à jour';
    update.addEventListener('click', () => {
      update.disabled = true;
      updateRequested = true;
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    });

    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'btn btn-ghost';
    later.textContent = 'Plus tard';
    later.addEventListener('click', () => banner.remove());

    banner.append(text, update, later);
    document.body.append(banner);
  }

  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!updateRequested || reloading) return; // jamais de rechargement surprise (ni à la première installation)
      reloading = true;
      location.reload();
    });

    navigator.serviceWorker.register('sw.js').then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(registration);
        });
      });
      // Quand l'application revient au premier plan, on vérifie s'il existe une nouvelle version.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    }).catch(() => { /* hors ligne ou non pris en charge : l'application fonctionne quand même */ });
  }

  /* ---------- 4. Démarrage ---------- */
  initInstall();
  initServiceWorker();
})();
