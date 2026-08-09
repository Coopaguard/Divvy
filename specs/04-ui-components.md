# Composants UI — Divvy

## Objectif

Lister les composants d’interface nécessaires au MVP.

## Composants globaux

### `AppShell`
- Structure générale de la page
- Contient header + contenu principal

### `HeaderBar`
- Nom des vacances (ou "Nouvelles vacances")
- Actions globales : exporter / importer / nouveau

### `SectionCard`
- Conteneur standard pour chaque bloc (Vacances, Personnes, Dépenses, Résultats)
- Style flat avec bordure

## Navigation

### `BurgerMenu` (mobile)
- Bouton burger
- Ouvre un panneau de navigation full screen
- Ferme le menu au clic sur un item

### `SideFloatingNav` (desktop)
- Navigation flottante à gauche
- Liens d'ancrage vers les sections
- Mise en évidence de la section active

## Composants métier

### `VacationForm`
- Champs : titre, date début, date fin
- Validation minimale des dates

### `PeopleList`
- Liste des personnes
- Bouton ajout
- Actions ligne : éditer / supprimer

### `PersonForm`
- Champs : nom, parts, date arrivée, date départ
- Valeurs par défaut issues des vacances

### `ExpenseList`
- Liste des dépenses
- Tri par date
- Actions ligne : éditer / supprimer

### `ExpenseForm`
- Champs : payeur, montant, libellé, date
- Date pré-remplie avec la date du jour

### `PayersPieChart`
- Camembert de la répartition des montants payés

### `SettlementTable`
- Tableau des transferts "qui doit combien à qui"

## Composants utilitaires

### `PrimaryGhostButton`
- Bouton principal orange ghost (voir design system)

### `ConfirmDialog`
- Confirmation avant suppression

### `EmptyState`
- État vide pour listes sans données

### `LanguageSwitcher`
- Sélecteur de langue FR / EN (phase 3 roadmap)

## États d'interface

- Chargement initial
- Aucune donnée
- Erreur d'import
- Données invalides (formulaires)
