# Divvy

**Divvy** est une application web **single-page** pour partager simplement les dépenses de vacances entre amis.

Ajoutez les personnes, saisissez les dépenses, et obtenez instantanément qui doit combien à qui.

## ✨ Fonctionnalités (MVP)

- Création et édition des **vacances** (titre, dates début/fin)
- Gestion des **personnes** (nom, parts, dates arrivée/départ)
- Saisie des **dépenses** (payeur, montant, libellé, date)
- Édition et suppression des personnes et dépenses
- Vue récapitulative : camembert de répartition + tableau de règlement
- Reprise depuis stockage local
- Import / export d'un fichier `.divvy`

## 🧱 Stack technique

- **Vue 3** (SPA)
- **IndexedDB** (stockage local)
- Objectif : **compatibilité PWA**

## 🎨 Design

- Style **flat** et **light** (inspiration GitHub)
- Fond de page : **blanc**
- Boutons primaires : **ghost orange** (fond blanc, bordure/texte orange)
- Navigation : burger menu full screen (mobile), menu flottant gauche (desktop)

## 🌍 i18n

Prise en charge **FR / EN** prévue dès le départ (déploiement progressif selon roadmap).

## 🚀 Déploiement

Déploiement automatique sur **GitHub Pages** (build à chaque push sur `main`).

**Démo** : https://coopaguard.github.io/Divvy/

## 📚 Documentation

- **Spécifications** : `./specs/`
- **Roadmap** : voir `ROADMAP.md`
- **Règles de contribution** : voir `agent.md`
