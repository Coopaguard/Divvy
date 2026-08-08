# Layout one-page — Divvy

## Objectif

Définir la structure de l’écran unique (SPA) pour gérer un count de vacances de bout en bout.

## Écran d’accueil (avant ouverture d’un count)

Actions disponibles :
1. Reprendre un count depuis le stockage local.
2. Importer un fichier `.divvy`.
3. Démarrer un nouveau count.

## Écran principal d’un count

## Navigation

- **Mobile** : bouton burger ouvrant un menu **full screen**.
- **Desktop** : menu latéral **flottant à gauche**.
- Section active surlignée.
- Clic menu => scroll vers la section correspondante (one-page).

### Entrées de menu (proposées)
- Accueil
- Trip
- Personnes
- Paiements
- Résultats
- Export `.divvy`

## Sections

1. **Trip**
   - Titre
   - Date de début
   - Date de fin

2. **Personnes**
   - Liste des participants
   - Nom
   - Nombre de parts (défaut : 1)
   - Date d’arrivée (défaut : début du trip)
   - Date de départ (défaut : fin du trip)

3. **Paiements**
   - Liste des paiements saisis
   - Qui paie
   - Montant
   - Libellé
   - Date (défaut : date de saisie)
   - Actions : éditer / supprimer

4. **Résultats**
   - Camembert de répartition des payeurs
   - Tableau “qui doit combien à qui”

## Responsive

### Mobile

- Sections empilées verticalement.
- Priorité à la saisie rapide.
- Menu plein écran pour navigation claire.

### Desktop

- Mise en page en grille simple.
- Nav flottante gauche persistante.
- Trip + Personnes en haut.
- Paiements et Résultats bien lisibles sur largeur.

## Navigation interne

- Pas de changement de page.
- Mise à jour en direct des résultats après chaque modification.
