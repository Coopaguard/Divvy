# Agent IA — Guide de préparation (Divvy)

Ce document définit comment les assistants IA doivent contribuer au projet **Divvy** pendant la phase de préparation.

## Portée de la phase actuelle

Pendant cette phase, les assistants IA **ne doivent créer ou modifier que des fichiers Markdown (`.md`)**, y compris `README.md`.

- Autorisé : `README.md`, `agent.md`, `specs/*.md`
- Interdit : tout autre type de fichier (`.vue`, `.ts`, `.js`, `.css`, config, etc.)

## Objectifs

1. Clarifier les choix techniques.
2. Documenter précisément les fonctionnalités.
3. Définir les règles de calcul métier.
4. Spécifier UX/UI et structure d'écran.
5. Préparer un backlog exploitable pour l’implémentation.

## Règles de contribution

- Écrire en **français** pour la documentation produit/projet.
- Écrire le **code en anglais**.
- Utiliser des **noms de fonctions explicites** et orientés intention.
- Découper les fichiers **par domaine métier** (trip, people, payments, settlements, storage, import-export).
- Éviter les fonctions longues : une responsabilité claire par fonction/module.
- Préférer des noms lisibles à des abréviations ambiguës.
- Documenter les décisions importantes et hypothèses.
- Maintenir la cohérence entre les fichiers `specs/`.

## Règles de code propre (base)

- **Single Responsibility** par composant/module.
- Pas de duplication inutile (DRY pragmatique).
- Gestion d’erreurs explicite (import invalide, données manquantes, dates incohérentes).
- Validation d’entrée côté UI avant calcul.
- Calculs monétaires déterministes (arrondis cohérents et centralisés).
- Tests unitaires ciblant surtout les règles de répartition.
- Lisibilité > astuce technique.

## Convention de structure (future implémentation)

Exemple de découpage par domaine :
- `domains/trip/*`
- `domains/people/*`
- `domains/payments/*`
- `domains/settlement/*`
- `domains/storage/*`
- `domains/importExport/*`
- `ui/components/*`

## Convention de fichiers `specs/`

- `01-choix-techno.md`
- `02-ui-design-system.md`
- `03-ui-layout-one-page.md`
- `04-ui-components.md`
- `05-deploiement-github-pages.md`
- (à venir) specs fonctionnelles détaillées, règles de calcul, roadmap

## Décisions déjà actées

- Stack front : **Vue 3 (SPA)**.
- Stockage local : **IndexedDB**.
- Design : simple, moderne, inspiration GitHub.
- Style visuel : **flat** (pas d’ombres).
- Couleur primaire : **orange**.
- Bouton primaire : **ghost** (fond blanc, bordure orange, texte orange).
- Navigation :
  - mobile : burger menu **full screen**,
  - desktop : menu latéral **flottant à gauche**.
- Déploiement : GitHub Pages, build à chaque merge/push sur `main`.

## Processus de travail

1. Proposer une structure de spec.
2. Faire valider par l’utilisateur.
3. Rédiger le(s) fichier(s) `.md` correspondant(s).
4. Réviser par itération courte.
5. Préparer l’implémentation seulement après validation des specs.
