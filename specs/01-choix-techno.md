# Choix technologique — Divvy

## Décision

Le projet **Divvy** sera développé en :

- **Vue 3** pour l’interface
- **Mode SPA** (Single Page Application)
- **Stockage local via IndexedDB**
- **i18n** (FR / EN) prévu dès le départ

## Pourquoi ce choix

### Vue 3

- Composants réutilisables pour structurer les 3 domaines principaux (**Vacances**, **Personnes**, **Dépenses**)
- Écosystème mature pour formulaires, état applicatif et dataviz
- Bon compromis entre simplicité de démarrage et maintenabilité
- Support natif de l'internationalisation (Vue I18n)

### SPA

- Usage centré sur une seule page avec interactions dynamiques
- Pas de besoin SSR pour le MVP (pas de contenu SEO public critique)
- Expérience fluide pour édition/suppression/calcul en direct

### IndexedDB

- Persistance locale robuste côté navigateur
- Plus adaptée que `localStorage` pour des données structurées et évolutives
- Compatible avec un usage offline / PWA-friendly

### i18n (FR / EN)

- Prise en charge multilingue dès la conception
- Déploiement progressif selon roadmap (phase 3)
- Fichiers de traduction séparés pour faciliter la maintenance

## PWA

Objectif : application **compatible PWA** (installable, offline-first) dans la suite du projet.

Cela implique à terme :
- manifeste web app,
- service worker,
- stratégie de cache.

## Hors périmètre de cette étape

- Implémentation des fichiers techniques (`.vue`, `.ts`, config build)
- Mise en place du service worker
- Choix détaillé des librairies secondaires

## Critères de validation de la décision

- La structure cible reste simple pour un MVP
- Le stockage local couvre : création, reprise, import/export de vacances
- Les futures specs UI et métier restent compatibles avec cette stack
- La structure i18n permet l'ajout facile de nouvelles langues
