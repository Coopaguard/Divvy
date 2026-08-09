# Déploiement — GitHub Pages

## Objectif

Déployer automatiquement la dernière version de Divvy sur GitHub Pages après chaque merge/push sur `main`.

## Configuration

### Trigger CI/CD
- Push sur la branche `main`

### Pipeline
1. Installer les dépendances
2. Lancer le build
3. Publier l'artefact sur GitHub Pages

### Paramétrage GitHub
- Settings du repository → Source GitHub Pages = **GitHub Actions**
- Workflow : `.github/workflows/deploy-pages.yml`

## URL de démo

`https://coopaguard.github.io/divvy/`

## Critères de validation

- Merge sur `main` déclenche bien le workflow
- Job de build passe
- Job de déploiement passe
- Nouvelle version visible sur l'URL Pages

## Référence

Voir `ROADMAP.md` phase 2 pour le détail de cette étape.
