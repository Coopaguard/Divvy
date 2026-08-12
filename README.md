# Divvy

**Divvy** est une application web pour partager simplement les dépenses de vacances entre amis.

Ajoutez les personnes, saisissez les dépenses, et obtenez qui doit combien à qui.

**Démo** : https://coopaguard.github.io/Divvy/

## ✨ Fonctionnalités

Le parcours se déroule en **cinq étapes**, chacune sur son propre écran :

1. **Vacances** — choisir, créer ou supprimer une vacance (titre, dates début/fin)
2. **Personnes** — nom, parts, dates d'arrivée et de départ
3. **Dépenses** — payeur, montant, libellé, date
4. **Récapitulatif** — camembert des payeurs et total payé par personne
5. **Remboursements** — quote-part de chacun, puis les virements à effectuer

Les étapes 2 à 5 restent verrouillées tant qu'aucune vacance n'est choisie : tout ce
qui suit est rattaché à celle-là.

Également :

- **Trois méthodes de répartition** au choix — dépense par dépense selon les présents
  à sa date (par défaut, la plus fidèle aux faits), au prorata des jours
  (total ÷ parts ÷ jours), ou simple (total ÷ parts). La méthode est enregistrée sur
  la vacance.
- **Coût d'une part par jour**, affiché à titre indicatif : une valeur unique au
  prorata des jours, une par personne dépense par dépense — puisqu'elle dépend alors
  des journées vécues par chacun.
- **Virements optimisés** : le moins de paiements possible, et le moins
  d'interlocuteurs possible pour chacun.
- **Devise au choix** (générique, €, £, $, CHF), indépendante de la langue.
- **FR / EN**, avec préférence conservée.
- **Import / export** d'un fichier `.divvy` : exporter une vacance, la partager via
  la feuille d'envoi du téléphone, ou en réimporter une. Un import n'écrase jamais
  ce qui est déjà là — voir `specs/08-import-export.md`.
- **Installable et hors ligne** : l'application s'installe sur téléphone et
  fonctionne sans réseau. Une nouvelle version est *proposée*, jamais imposée —
  voir `specs/09-pwa.md`.
- Reprise depuis le stockage local : les vacances enregistrées sont retrouvées au
  démarrage. La *sélection*, elle, est volontairement remise à zéro — on rechoisit
  la vacance à éditer à chaque ouverture.

### À venir

- Restriction des dépenses à partir d'une date donnée

## 💶 Exactitude des montants

Les montants sont stockés en **centimes entiers**, jamais en flottants : `0.1 + 0.2`
ne vaut pas `0.3` en IEEE-754, et l'écart se propagerait aux totaux puis aux
remboursements. Les divisions qui ne tombent pas juste voient leur reste distribué
plutôt que perdu, de sorte que la somme des quotes-parts égale **exactement** le
total dépensé et que les virements soldent au centime près.

## 🧱 Stack technique

- **Vue 3** + **Vue Router** + **Pinia**
- **Vue I18n** (FR / EN)
- **IndexedDB** (stockage local, sans dépendance)
- **Vitest** + **Vue Test Utils**
- **PWA** : manifeste et service worker via `vite-plugin-pwa`

Aucune librairie de graphiques : le camembert est du SVG écrit à la main, pour ne pas
payer une dépendance plus lourde que la fonctionnalité.

## 🎨 Design

- Style **flat** et **light** (inspiration GitHub), fond de page **blanc**
- Boutons primaires : **ghost orange** (fond blanc, bordure/texte orange)
- Navigation : **timeline d'étapes** en haut, boutons précédent / suivant en bas
- Sur téléphone, la timeline se réduit aux pastilles numérotées et les actions des
  tableaux se replient sous un bouton « … »

## 🚀 Déploiement

Déploiement automatique sur **GitHub Pages** (build à chaque push sur `main`).

## 📚 Documentation

- **Spécifications** : `./specs/`
- **Roadmap** : voir `ROADMAP.md`
- **Règles de contribution** : voir `agent.md`
