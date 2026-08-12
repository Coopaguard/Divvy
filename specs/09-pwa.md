# PWA — installation et fonctionnement hors ligne

## Point de départ

L'essentiel était déjà acquis avant d'ajouter quoi que ce soit : l'application
est *local-first*. Les données vivent dans IndexedDB, il n'y a aucun backend et
aucun appel réseau à l'exécution. Il ne restait donc qu'à **mettre en cache la
coquille** (HTML, JS, CSS, icônes) et à déclarer l'installabilité.

## Manifeste

Déclaré dans `vite.config.ts` et généré au build. `start_url` et `scope` valent
`.`, donc relatifs à l'emplacement du manifeste : l'application fonctionne sous
`/Divvy/` sans que le chemin soit écrit nulle part, cohérent avec le `base: './'`
du build (voir `05-deploiement-github-pages.md`).

Trois icônes déclarées, dont une **maskable** : son fond va jusqu'aux bords — la
plate-forme découpe sa propre forme — et le motif tient dans le cercle de
sécurité (80 % de la largeur). C'est un dessin distinct, pas une copie.

`apple-touch-icon` est déclarée dans `index.html` : iOS ne lit pas les icônes du
manifeste.

## Service worker

Généré par `vite-plugin-pwa` (mode `generateSW`). Tout ce que produit le build
est précaché ; il n'y a aucune stratégie d'exécution à définir, faute de requêtes
réseau à intercepter.

Le plugin est préféré à un service worker écrit à la main — contrairement au
camembert, dessiné à la main lui. La différence est réelle : la **liste des
fichiers à précacher change à chaque build**, avec leurs empreintes. La produire
soi-même revient à écrire son propre morceau de chaîne de build.

## Mise à jour : proposée, jamais imposée

C'est le vrai risque d'une PWA. Un service worker mal réglé fige les utilisateurs
sur la version qu'ils ont visitée en premier : un correctif est publié, personne
ne le voit.

Le mode retenu est `prompt`, et non `autoUpdate`. Ce dernier recharge la page dès
qu'une version est prête, ce qui effacerait une dépense en cours de saisie. À la
place, `UpdatePrompt` affiche un bandeau et laisse choisir le moment.

Conséquence à connaître : en mode `prompt`, le service worker **ne prend pas le
contrôle au premier chargement**. Il s'installe, et ne pilote la page qu'à la
visite suivante. Ce n'est pas un défaut, c'est le cycle de vie normal.

## Vérifications

Testé dans Chromium sur le build de production servi sous `/Divvy/` :

- `start_url` et `scope` résolus sur `/Divvy/`, les quatre icônes servies en 200 ;
- service worker installé au premier chargement, contrôleur actif après
  rechargement, 12 entrées en précache ;
- **réseau coupé** : l'application démarre, la timeline s'affiche, les vacances
  enregistrées sont retrouvées et la navigation entre étapes fonctionne ;
- **cycle de mise à jour** : une seconde version déployée pendant que la page est
  ouverte déclenche le bandeau, la page reste sur l'ancienne version tant que
  l'utilisateur n'a pas cliqué, puis bascule sur la nouvelle.

## Hors périmètre

- Mise en cache de requêtes réseau (il n'y en a aucune)
- Notifications push
- Synchronisation en arrière-plan
