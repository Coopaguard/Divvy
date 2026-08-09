# Design system — Divvy

## Intentions

Créer une interface :
- simple,
- moderne,
- lisible,
- inspirée de la sobriété GitHub,
- avec quelques touches de couleur.

## Principes visuels

- Design **flat** : **aucune ombre**.
- Bordures fines pour structurer les blocs.
- Espacements réguliers et hiérarchie claire.
- Couleur utilisée pour guider l’action, pas pour surcharger.

## Palette (proposition)

- `--bg`: `#f6f8fa`
- `--surface`: `#ffffff`
- `--text`: `#1f2328`
- `--muted`: `#57606a`
- `--border`: `#d0d7de`

Couleur primaire :
- `--primary`: `#f57c00`
- `--primary-soft`: `#fff3e8`

Couleurs d’accent (dataviz / catégories) :
- `--accent-green`: `#1a7f37`
- `--accent-purple`: `#8250df`
- `--accent-blue`: `#0969da`
- `--accent-orange`: `#fb8f44`

## Typographie

- Police système sans-serif.
- Priorité à la lisibilité des montants et tableaux.
- Échelle simple (ex. 12/14/16/20/24).

## Boutons

### Bouton primaire (décision actée)

Style **ghost orange** :
- fond blanc,
- texte orange,
- bordure orange,
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

- Fond blanc, bordure neutre.
- Focus : contour accentué (orange).
- États d’erreur : texte + bordure rouge.

## Accessibilité

- Contrastes suffisants texte/fond.
- États focus visibles clavier.
- Cibles tactiles confortables en mobile.
