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

## Proposer l'installation

Rien dans une page web ne dit qu'elle peut s'installer. Le navigateur a bien son
propre bouton, mais il est enfoui dans un menu que personne n'ouvre. `InstallPrompt`
le dit donc lui-même, dans une bannière — sous trois conditions strictes.

### Ne rien proposer à qui l'a déjà fait

`isInstalled()` (`domains/pwa/install.ts`) lit **quatre** signaux, parce qu'aucun ne
couvre tout le parc :

| Signal | Terrain |
| --- | --- |
| `display-mode: standalone` / `fullscreen` | le cas courant |
| `display-mode: window-controls-overlay` | bureau |
| `navigator.standalone` | Safari iOS, qui n'a que celui-là |
| référent `android-app://` | une application Android qui nous embarque |

### Attendre que le navigateur le dise

L'événement `beforeinstallprompt` n'est émis que si le navigateur juge
l'application installable. On l'intercepte (`preventDefault`) pour garder la main
sur le moment et la place : sans cela, il affiche sa propre bannière par-dessus le
contenu, au moment qui l'arrange.

L'invite ne se rouvre pas : `prompt()` ne sert qu'une fois. Le navigateur en émettra
une nouvelle s'il le juge bon — nous ne décidons pas de cela.

**Safari iOS n'émet jamais cet événement** et n'expose aucune API : l'installation y
passe forcément par le menu de partage, à la main. On ne peut donc qu'expliquer le
geste, sans bouton — il n'y aurait rien derrière. D'où `isIos()`, qui doit aussi
reconnaître l'iPad récent : il se présente comme un Mac, et seul l'écran tactile
(`maxTouchPoints > 1`) le trahit.

### Se taire quand on a dit non

Une bannière qui revient à chaque visite est une nuisance. « Plus tard » — comme un
refus dans l'invite native — enregistre la date et fait taire la proposition **un
mois**. Assez long pour ne pas harceler, assez court pour laisser une seconde chance
à qui a fermé la bannière sans la lire. L'installation faite, le report est effacé.

Un stockage indisponible (mode privé, quota plein) vaut report : dans le doute, on
se tait plutôt que d'insister.

### Empilement

Bannière d'installation et bandeau de mise à jour peuvent coexister — application
non installée, nouvelle version prête. Le placement à l'écran appartient donc à une
pile unique dans `AppShell` (`.app-prompts`), et non à chaque bannière : deux
éléments fixés chacun de son côté se recouvriraient. La pile laisse passer les clics
(`pointer-events: none`), chaque bannière les reprend pour elle.

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
- **proposition d'installation** : absente tant que le navigateur n'a rien signalé,
  affichée dès l'événement, `prompt()` bien ouvert au clic ; « plus tard » la fait
  disparaître et elle ne revient pas au rechargement suivant ; rien du tout en mode
  `standalone` ; sur iPhone, la consigne du geste et aucun bouton ; les deux
  bannières côte à côte s'empilent sans se recouvrir et tiennent dans l'écran.

Chromium sans en-tête n'émet pas `beforeinstallprompt` : l'événement est fabriqué
dans la page pour la vérification. C'est la réaction de l'interface qui est testée,
pas le critère d'installabilité du navigateur.

## Hors périmètre

- Mise en cache de requêtes réseau (il n'y en a aucune)
- Notifications push
- Synchronisation en arrière-plan
