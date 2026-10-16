# Business Tools Pro

Version Pro de Business Tools : application web installable (PWA) qui fonctionne aussi hors ligne.
Basée uniquement sur les fichiers de la version gratuite (`index.html`, `style.css`, `script.js`).

## État du projet
- **Étape 1 terminée : socle Pro + PWA.** Tous les outils de la version gratuite sont conservés, avec les mêmes calculs.
- **La facture & devis est encore libre dans cette étape** : le filigrane et la licence Chariow arrivent aux étapes suivantes.
  Ne pas mettre ce dépôt en vente avant la fin de l'étape « mode démonstration ».

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html` | La page (accueil + les 5 outils). Facture & devis en première position. |
| `style.min.css`, `script.min.js` | Fichiers chargés par la page. |
| `src/style.css`, `src/script.js` | Sources lisibles correspondantes (à modifier ici, puis reporter dans les `.min`). |
| `pwa.js` | Bouton « Installer l'application », aide iPhone, bannière de mise à jour. |
| `sw.js` | Service worker : mémorise l'application pour l'ouvrir sans connexion. |
| `manifest.webmanifest` | Nom, couleurs et icônes de l'application installée. |
| `icons/` | Icônes de l'application (logo « BT »). |

## Publier une mise à jour
1. Envoie d'abord tous les fichiers modifiés sur GitHub.
2. Change ensuite `VERSION` dans `sw.js` (`'1'` → `'2'`, etc.) et envoie **`sw.js` en dernier**.
   Les utilisateurs voient alors la bannière « Une nouvelle version est disponible ».

Il n'y a plus de `?v=N` à incrémenter dans `index.html` : c'est `VERSION` dans `sw.js` qui s'en charge.

## Hébergement
GitHub Pages (HTTPS obligatoire pour l'installation et le mode hors ligne). Tous les chemins sont relatifs :
le nom du dépôt n'a pas d'importance.

## Google Analytics
Inchangé : l'identifiant reste dans `script.js` (`GA_MEASUREMENT_ID`). La PWA envoie seulement trois événements,
sans aucune donnée personnelle : `pwa_install_prompt`, `pwa_installed` et `pwa_open` (ouverture depuis l'application installée).
