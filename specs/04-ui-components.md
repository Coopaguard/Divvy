# Composants UI — Divvy

## Objectif

Lister les composants d’interface nécessaires au MVP.

## Composants globaux

### `AppShell`
- Structure générale de la page.
- Contient header + contenu principal.

### `HeaderBar`
- Nom du trip (ou “Nouveau count”).
- Actions globales : exporter / importer / nouveau.

### `SectionCard`
- Conteneur standard pour chaque bloc (Trip, Personnes, Paiements, Résultats).
- Style flat avec bordure.

## Navigation

### `BurgerMenu` (mobile)
- Bouton burger.
- Ouvre un panneau de navigation full screen.
- Ferme le menu au clic sur un item.

### `SideFloatingNav` (desktop)
- Navigation flottante à gauche.
- Liens d’ancrage vers les sections.
- Mise en évidence de la section active.

## Composants métier

### `TripForm`
- Champs : titre, date début, date fin.
- Validation minimale des dates.

### `PeopleList`
- Liste des personnes.
- Bouton ajout.
- Actions ligne : éditer / supprimer.

### `PersonForm`
- Champs : nom, parts, date arrivée, date départ.
- Valeurs par défaut issues du trip.

### `PaymentList`
- Liste des paiements.
- Tri par date (à préciser dans specs fonctionnelles).
- Actions ligne : éditer / supprimer.

### `PaymentForm`
- Champs : payeur, montant, libellé, date.
- Date pré-remplie avec la date du jour.

### `PayersPieChart`
- Camembert de la répartition des montants payés.

### `SettlementTable`
- Tableau des transferts “qui doit combien à qui”.

## Composants utilitaires

### `PrimaryGhostButton`
- Bouton principal orange ghost.

### `ConfirmDialog`
- Confirmation avant suppression.

### `EmptyState`
- État vide pour listes sans données.

## États d’interface

- Chargement initial.
- Aucune donnée.
- Erreur d’import.
- Données invalides (formulaires).
