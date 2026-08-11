# Agent IA — Guide de contribution (Divvy)

Ce document définit comment les assistants IA doivent contribuer au projet **Divvy**.

## Source de vérité documentaire

**Documents de référence** (consulter AVANT toute contribution) :
- `README.md` : vue d'ensemble du projet
- `ROADMAP.md` : plan de développement en phases
- `specs/*.md` : spécifications détaillées par domaine

**Règle anti-duplication** :
- Ne PAS répéter dans ce fichier ce qui est déjà documenté dans `README.md` ou `specs/*.md`
- Faire référence explicite aux documents sources
- Ce fichier contient **uniquement** les règles de contribution et conventions de code

## Phase actuelle : Implémentation

La phase de préparation est **terminée**. Les assistants IA peuvent maintenant **créer et modifier tous types de fichiers** nécessaires à l'implémentation.

### Fichiers autorisés
- ✅ Code source : `.vue`, `.ts`, `.js`, `.css`, `.scss`
- ✅ Configuration : `package.json`, `vite.config.ts`, `tsconfig.json`, etc.
- ✅ Tests : `.spec.ts`, `.test.ts`
- ✅ Documentation : `.md`
- ✅ Workflows CI/CD : `.github/workflows/*.yml`
- ✅ Manifeste PWA : `manifest.json`, service worker

### Règles d'implémentation
- **Toujours consulter** `ROADMAP.md` pour respecter l'ordre des phases
- **Suivre les spécifications** définies dans `specs/*.md`
- **Ne pas dévier** des choix techniques actés (Vue 3, IndexedDB, design system)
- **Documenter** les décisions importantes dans le code ou dans `specs/`

## Objectifs d'implémentation

Suivre la roadmap en 6 phases :

1. **Phase 1** : MVP Vacances + Personnes (stockage local)
2. **Phase 2** : CI/CD + GitHub Pages
3. **Phase 3** : Internationalisation FR / EN
4. **Phase 4** : Saisie des dépenses
5. **Phase 5** : Vue récapitulative des dépenses
6. **Phase 6** : Calcul et répartition des dépenses

Voir `ROADMAP.md` pour les détails de chaque phase.

## Terminologie fonctionnelle (uniformisée)

Utiliser systématiquement ces termes dans toute la documentation :
- **Vacances** (pas "count", "trip", "voyage")
- **Personnes** (pas "participants", "utilisateurs")
- **Dépenses** (pas "paiements", "payments")

## Règles de contribution

### Documentation
- Écrire en **français** pour la documentation produit/projet
- Écrire le **code en anglais**
- Utiliser la terminologie uniformisée (Vacances, Personnes, Dépenses)
- Maintenir la cohérence entre tous les fichiers `specs/`
- Référencer explicitement les documents sources plutôt que dupliquer

### Code
- **Code en anglais** (noms de variables, fonctions, commentaires)
- **Documentation produit en français** (README, specs, commentaires utilisateur)
- Utiliser la terminologie uniformisée dans les commentaires : Vacances, Personnes, Dépenses
- Noms de fonctions **explicites** et orientés intention
- Découpage **par domaine métier** : vacations, people, expenses, settlements, storage, import-export
- Une responsabilité claire par fonction/module
- Noms lisibles > abréviations ambiguës
- Documenter les décisions importantes et hypothèses

## Règles de code propre

- **Single Responsibility** par composant/module
- **DRY pragmatique** : pas de duplication inutile
- **Gestion d'erreurs explicite** : import invalide, données manquantes, dates incohérentes
- **Validation d'entrée** côté UI avant calcul
- **Calculs monétaires déterministes** : arrondis cohérents et centralisés
- **Tests unitaires** ciblant surtout les règles de répartition
- **Lisibilité > astuce technique**
- **Aucun enregistrement orphelin** : tout ce qui est rattaché à une vacance est
  supprimé en cascade avec elle (voir `specs/06-stockage-et-cascade.md`)
- **État en mémoire mis à jour après confirmation de l'écriture** uniquement

## Convention de structure

Découpage par domaine (à respecter) :
```
src/
  domains/
    vacations/     # Gestion des vacances
    people/        # Gestion des personnes
    expenses/      # Gestion des dépenses
    settlement/    # Calculs de répartition
    storage/       # Persistance IndexedDB
    importExport/  # Import/export .divvy
    shared/        # Helpers transverses (ids, horodatages)
  stores/          # Stores Pinia
  ui/
    components/    # Composants Vue
    layouts/       # Layouts (AppShell, etc.)
    assets/        # CSS, images, fonts
  i18n/
    locales/       # Fichiers de traduction FR/EN
  App.vue          # Composant racine
  main.ts          # Point d'entrée
```

## Internationalisation (i18n)

Prise en charge **FR / EN** dès le départ :
- Utiliser **Vue I18n**
- Structure des clés : `<domaine>.<composant>.<clé>`
- Fichiers : `src/i18n/locales/fr.json` et `src/i18n/locales/en.json`
- Tous les textes UI doivent être internationalisés
- Déploiement progressif selon `ROADMAP.md` (phase 3)

## Processus de travail (implémentation)

1. **Identifier la phase** en cours dans `ROADMAP.md`
2. **Consulter les specs** pertinentes dans `specs/*.md`
3. **Proposer une structure** de fichiers si nécessaire
4. **Implémenter** en suivant les conventions de code
5. **Tester** localement (npm run dev, npm run build)
6. **Commit** avec messages clairs et référence à la phase
7. **Documenter** les décisions importantes dans le code ou `specs/`

### Workflow Git
- Branches : `feature/<phase>-<description>` (ex: `feature/phase1-vacation-form`)
- Commits : messages en anglais, clairs et atomiques
- Push régulier pour permettre la revue continue
