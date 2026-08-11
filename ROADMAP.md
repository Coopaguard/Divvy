# Roadmap — Divvy

Plan de développement en **6 phases** pour le projet Divvy.

## Phase 1 : MVP Vacances + Personnes (stockage local)

### Objectif
Permettre la création de vacances et la gestion des personnes, avec persistance locale.

### Périmètre
- Création et édition des **vacances** (titre, dates début/fin)
- Ajout, édition, suppression des **personnes** (nom, parts, dates arrivée/départ)
- Stockage dans **IndexedDB**
- Reprise automatique depuis le stockage local
- Interface one-page basique avec navigation

### Livrables
- Composants Vue : `VacationForm`, `PeopleList`, `PersonForm`
- Domaines métier : `vacations/`, `people/`, `storage/`
- Structure de navigation (mobile/desktop)

### Critères de validation
- Création d'une session de vacances fonctionnelle
- Ajout de plusieurs personnes avec dates personnalisées
- Données persistées et récupérées après rechargement

---

## Phase 2 : CI/CD + GitHub Pages

### Objectif
Automatiser le déploiement sur GitHub Pages.

### Périmètre
- Workflow GitHub Actions pour build automatique
- Publication sur GitHub Pages à chaque push sur `main`
- Configuration Pages dans les settings du repository

### Livrables
- Fichier `.github/workflows/deploy-pages.yml`
- Documentation de déploiement actualisée

### Critères de validation
- Push sur `main` → build automatique
- Application accessible sur `https://coopaguard.github.io/Divvy/`
- Nouvelle version visible après chaque merge

---

## Phase 3 : Internationalisation FR / EN

### Objectif
Ajouter la prise en charge de plusieurs langues (français et anglais).

### Périmètre
- Mise en place d'un système i18n (ex : Vue I18n)
- Traduction de tous les textes UI en FR et EN
- Sélecteur de langue dans l'interface
- Stockage de la préférence utilisateur

### Livrables
- Fichiers de traduction : `locales/fr.json`, `locales/en.json`
- Composant `LanguageSwitcher`
- Documentation i18n

### Critères de validation
- Basculement fluide entre FR et EN
- Tous les textes UI traduits
- Préférence langue conservée après rechargement

---

## Phase 4 : Saisie des dépenses

### Objectif
Permettre l'ajout, l'édition et la suppression des dépenses.

### Périmètre
- Formulaire de saisie dépense (payeur, montant, libellé, date)
- Liste des dépenses avec actions (éditer/supprimer)
- Validation des montants et dates
- Persistance dans IndexedDB

### Livrables
- Composants Vue : `ExpenseForm`, `ExpenseList`
- Domaine métier : `expenses/`
- Tests unitaires pour validation

### Critères de validation
- Ajout d'une dépense fonctionnel
- Édition/suppression sans perte de données
- Validation côté client des entrées

---

## Phase 5 : Vue récapitulative des dépenses

### Objectif
Afficher une vue synthétique des dépenses saisies.

### Périmètre
- Vue en liste/tableau des dépenses
- Filtres par personne, date, etc.
- Total des dépenses par personne
- Dataviz simple (camembert de répartition des payeurs)

### Livrables
- Composant `ExpensesSummary`
- Composant `PayersPieChart`
- Logique d'agrégation des montants

### Critères de validation
- Affichage correct des totaux par personne
- Camembert lisible et cohérent
- Mise à jour en temps réel après modification

---

## Phase 6 : Calcul et répartition des dépenses

### Objectif
Calculer automatiquement qui doit combien à qui et afficher le tableau de règlement.

### Périmètre
- Algorithme de répartition équitable **au prorata des parts** (voir
  `specs/07-repartition.md` pour la règle retenue)
- Calcul des transferts optimisés
- Tableau « qui doit combien à qui »
- Export des résultats

### Livrables
- Domaine métier : `settlement/`
- Composant `SettlementTable`
- Algorithme de calcul documenté
- Tests unitaires pour la répartition

### Critères de validation
- Calcul correct pour plusieurs scénarios (parts différentes, montants indivisibles)
- Tableau de règlement lisible et cohérent
- Transferts optimisés (minimum de transactions)
- Export `.divvy` fonctionnel incluant les calculs

---

## Import / Export (transverse)

### Objectif
Permettre l'import et l'export d'une session complète.

### Périmètre
- Export d'un fichier `.divvy` (JSON)
- Import d'un fichier `.divvy`
- Validation du format à l'import
- Gestion des erreurs (fichier invalide, version incompatible)

### Livrables
- Domaine métier : `importExport/`
- Composants `ExportButton`, `ImportButton`
- Schéma de validation du format `.divvy`

### Critères de validation
- Export/import sans perte de données
- Gestion d'erreur robuste (fichier corrompu, mauvaise version)

---

## Évolutions futures (hors MVP)

- Mode PWA complet (installable, offline-first)
- Synchronisation cloud optionnelle
- Notifications de rappel
- Partage de session entre utilisateurs
- Multi-devises
- Catégories de dépenses
- Historique des modifications
