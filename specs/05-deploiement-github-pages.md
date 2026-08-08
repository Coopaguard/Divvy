# Déploiement — GitHub Pages

## Objectif

Déployer automatiquement la dernière version de Divvy sur GitHub Pages après chaque merge/push sur `main`.

## Règles attendues

- Trigger CI/CD : `push` sur la branche `main`.
- Le pipeline doit :
  1. installer les dépendances,
  2. lancer le build,
  3. publier l’artefact sur GitHub Pages.
- La page publique doit toujours refléter la **dernière version buildée** de `main`.

## Paramétrage GitHub attendu

- Dans les settings du repository :
  - Source GitHub Pages = **GitHub Actions**.
- Workflow de déploiement dédié (ex: `.github/workflows/deploy-pages.yml`).

## URL de démo (exemple)

`https://coopaguard.github.io/divvy/`

> Note : cette URL est un exemple validé pour la doc et pourra être ajustée.

## README

Le `README.md` doit contenir un lien visible vers la GitHub Page.

## Critères de validation

- Un merge sur `main` déclenche bien le workflow.
- Le job de build passe.
- Le job de déploiement passe.
- La nouvelle version est visible sur l’URL Pages.
