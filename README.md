# Divvy

**Divvy** est une application web **single-page** pour partager simplement les dépenses de vacances entre amis.

Ajoutez les participants, saisissez les paiements, et obtenez instantanément qui doit combien à qui.

## ✨ Fonctionnalités (MVP)

- Création d’un count de voyage
- Édition du trip (titre, date de début, date de fin)
- Gestion des participants (nom, parts, dates d’arrivée/départ)
- Saisie des paiements (payeur, montant, libellé, date)
- Édition/suppression des participants et paiements
- Vue de répartition des payeurs (camembert)
- Tableau de règlement « qui doit combien à qui »
- Reprise depuis stockage local
- Import / export d’un fichier `.divvy`

## 🧱 Choix techniques (actés)

- **Vue 3**
- **SPA** (Single Page Application)
- **IndexedDB** (stockage local)
- Objectif : **compatibilité PWA**

## 🎨 Direction design

- Simple, moderne, inspiration GitHub
- Design flat (sans ombres)
- Couleur primaire orange
- Bouton primaire ghost (fond blanc, bordure orange, texte orange)
- Navigation :
  - mobile : burger menu full screen
  - desktop : menu flottant à gauche

## 🚀 Déploiement

Le projet est prévu pour un déploiement sur **GitHub Pages**, avec build et publication automatiques sur `main`.

Lien de démo (exemple, à ajuster si besoin) :
**https://coopaguard.github.io/divvy/**

## 📚 Spécifications

Les documents de préparation sont disponibles dans `./specs`.
