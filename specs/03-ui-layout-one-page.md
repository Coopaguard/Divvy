# Layout one-page — Divvy

## Objectif

Définir la structure de l'écran unique (SPA) pour gérer des vacances de bout en bout.

## Écran d'accueil (avant ouverture)

Actions disponibles :
1. Reprendre depuis le stockage local
2. Importer un fichier `.divvy`
3. Démarrer de nouvelles vacances

## Écran principal

### Navigation

- **Mobile** : bouton burger ouvrant un menu **full screen**
- **Desktop** : menu latéral **flottant à gauche**
- Section active surlignée
- Clic menu → scroll vers la section correspondante (one-page)

### Entrées de menu

- Accueil
- Vacances
- Personnes
- Dépenses
- Résultats
- Export `.divvy`

## Sections

### 1. Vacances
- Titre
- Date de début
- Date de fin

### 2. Personnes
- Liste des personnes
- Nom
- Nombre de parts (défaut : 1)
- Date d'arrivée (défaut : début des vacances)
- Date de départ (défaut : fin des vacances)

### 3. Dépenses
- Liste des dépenses saisies
- Qui paie
- Montant
- Libellé
- Date (défaut : date de saisie)
- Actions : éditer / supprimer

### 4. Résultats
- Camembert de répartition des payeurs
- Tableau "qui doit combien à qui"

## Responsive

### Mobile
- Sections empilées verticalement
- Priorité à la saisie rapide
- Menu plein écran pour navigation claire

### Desktop
- Mise en page en grille simple
- Nav flottante gauche persistante
- Vacances + Personnes en haut
- Dépenses et Résultats bien lisibles sur largeur

## Navigation interne

- Pas de changement de page
- Mise à jour en direct des résultats après chaque modification
