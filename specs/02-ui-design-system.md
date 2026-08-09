# Design system — Divvy

## Intentions

Créer une interface :
- simple,
- moderne,
- lisible,
- inspirée de la sobriété GitHub,
- avec quelques touches de couleur.

## Principes visuels

- Design **flat** et **light** : **aucune ombre**
- Style **ghost** pour les boutons primaires
- Bordures fines pour structurer les blocs
- Espacements réguliers et hiérarchie claire
- Couleur utilisée pour guider l'action, pas pour surcharger

## Palette (proposition)

### Couleurs de base
- `--bg-page`: `#ffffff` (fond de page **blanc**)
- `--surface`: `#ffffff` (blocs/cartes)
- `--text`: `#1f2328` (texte principal **noir**)
- `--muted`: `#57606a` (texte secondaire)
- `--border`: `#d0d7de` (bordures)

### Couleur primaire
- `--primary`: `#f57c00` (orange)
- `--primary-soft`: `#fff3e8` (fond orange très léger)

### Couleurs d'accent (dataviz / catégories)
- `--accent-green`: `#1a7f37`
- `--accent-purple`: `#8250df`
- `--accent-blue`: `#0969da`
- `--accent-orange`: `#fb8f44`

## Typographie

- Police système sans-serif
- Priorité à la lisibilité des montants et tableaux
- Échelle simple (ex. 12/14/16/20/24)
- Texte noir pour la cohérence visuelle avec le site

## Boutons

### Bouton primaire (style ghost/light)

Style **ghost orange** :
- fond **blanc**,
- texte **orange**,
- bordure **orange**,
- hover : fond orange très léger (`--primary-soft`),
- focus visible accessible.

### Bouton secondaire

- fond blanc,
- texte neutre,
- bordure neutre.

### Bouton danger

- fond blanc,
- texte rouge,
- bordure rouge clair.

## Champs de formulaire

- Fond blanc, bordure neutre
- Focus : contour accentué (orange)
- États d'erreur : texte + bordure rouge

## Accessibilité

- Contrastes suffisants texte/fond (noir sur blanc)
- États focus visibles clavier
- Cibles tactiles confortables en mobile

## Cohérence visuelle

Le style **flat**, **light** et **ghost** avec fond de page **blanc** et texte **noir** assure la cohérence avec le site web global.
