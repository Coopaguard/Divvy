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

`https://coopaguard.github.io/Divvy/`

GitHub Pages sert un site de projet sous le nom du repository **avec sa casse
exacte**, et les chemins sont sensibles à la casse. `vite.config.ts` utilise donc
un `base: './'` relatif : les assets sont résolus par rapport au document, ce qui
rend le build indépendant du chemin de publication (et résistant à un renommage
du repository). Un `base` absolu codé en dur produirait une page blanche à la
moindre différence de casse.

## Critères de validation

- Merge sur `main` déclenche bien le workflow
- Job de build passe
- Job de déploiement passe
- Nouvelle version visible sur l'URL Pages

## Référence

Voir `ROADMAP.md` phase 2 pour le détail de cette étape.
