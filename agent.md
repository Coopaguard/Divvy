# Agent IA — Guide de contribution (Divvy)

Ce document définit comment les assistants IA doivent contribuer au projet **Divvy** pendant la phase de préparation.

## Source de vérité documentaire

**Documents de référence** (consulter AVANT toute contribution) :
- `README.md` : vue d'ensemble du projet
- `ROADMAP.md` : plan de développement en phases
- `specs/*.md` : spécifications détaillées par domaine

**Règle anti-duplication** :
- Ne PAS répéter dans ce fichier ce qui est déjà documenté dans `README.md` ou `specs/*.md`
- Faire référence explicite aux documents sources
- Ce fichier contient **uniquement** les règles de contribution et conventions de code

## Portée de la phase actuelle

Pendant cette phase, les assistants IA **ne doivent créer ou modifier que des fichiers Markdown (`.md`)**.

- ✅ Autorisé : `README.md`, `agent.md`, `ROADMAP.md`, `specs/*.md`
- ❌ Interdit : tout autre type de fichier (`.vue`, `.ts`, `.js`, `.css`, config, etc.)

## Objectifs de cette phase

1. Clarifier les choix techniques → voir `specs/01-choix-techno.md`
2. Définir le design system → voir `specs/02-ui-design-system.md`
3. Spécifier la structure one-page → voir `specs/03-ui-layout-one-page.md`
4. Lister les composants UI → voir `specs/04-ui-components.md`
5. Documenter le déploiement → voir `specs/05-deploiement-github-pages.md`
6. Préparer un backlog exploitable → voir `ROADMAP.md`

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

### Code (future implémentation)
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

## Convention de structure (future implémentation)

Découpage par domaine :
```
domains/
  vacations/     # Gestion des vacances
  people/        # Gestion des personnes
  expenses/      # Gestion des dépenses
  settlement/    # Calculs de répartition
  storage/       # Persistance IndexedDB
  importExport/  # Import/export .divvy
ui/
  components/    # Composants Vue
```

## Internationalisation (i18n)

Prévoir dès le départ la prise en charge **FR / EN** :
- Structure i18n dans les specs
- Clés de traduction pour tous les textes UI
- Déploiement progressif selon `ROADMAP.md` (phase 3)

## Décisions actées

Voir `README.md` et `specs/01-choix-techno.md` pour les décisions techniques.

Voir `specs/02-ui-design-system.md` pour les décisions design.

## Processus de travail

1. Consulter `README.md` et `specs/*.md` pertinents
2. Proposer une structure de spec si nécessaire
3. Faire valider par l'utilisateur
4. Rédiger/modifier le(s) fichier(s) `.md`
5. Vérifier la cohérence avec les autres documents
6. Préparer l'implémentation seulement après validation des specs
