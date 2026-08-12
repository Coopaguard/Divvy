# Parcours en étapes — Divvy

## Objectif

Définir la structure de navigation de l'application.

> **Historique.** Cette spécification décrivait à l'origine un écran unique à
> sections empilées, parcouru par ancres. L'application est passée à un parcours
> en étapes, chacune sur sa propre route : le document suit ce changement.

## Principe

Cinq étapes, dans l'ordre, chacune une **route à part entière** :

| # | Étape | Route | Dépend d'une vacance |
|---|---|---|---|
| 1 | Vacances | `/vacations` | non |
| 2 | Personnes | `/people` | oui |
| 3 | Dépenses | `/expenses` | oui |
| 4 | Récapitulatif | `/results` | oui |
| 5 | Remboursements | `/settlement` | oui |

L'ordre et la dépendance sont déclarés **à un seul endroit**,
`src/domains/navigation/steps.ts`. La timeline, les boutons précédent/suivant et la
garde du routeur lisent tous cette liste ; ajouter une étape se fait donc là, plus la
route correspondante.

## Verrouillage

Tout ce qui suit l'étape 1 est rattaché à une vacance. Tant qu'aucune n'est
sélectionnée, les étapes 2 à 5 sont **grisées et non cliquables**.

Une **garde de routeur** double cet affichage : griser un lien ne protège que
l'interface, l'URL restant saisissable à la main. `#/expenses` tapé directement
renvoie donc au choix des vacances.

## Navigation

- **Timeline** en haut, collante au défilement : une pastille numérotée par étape,
  chacune avec sa propre couleur (voir `02-ui-design-system.md`). L'étape courante
  est remplie et cerclée — la position ne repose jamais sur la couleur seule.
- **Précédent / Suivant** en bas de chaque étape, désactivés aux deux extrémités du
  parcours et tant que l'étape suivante est verrouillée.
- **Menus** en en-tête : devise et langue.

L'historique du navigateur est en mode **hash** (`#/expenses`) : les liens profonds
fonctionnent sur un hébergement statique, sans règle de réécriture côté serveur.

## Contenu des étapes

### 1. Vacances
Liste des vacances enregistrées, la plus récemment modifiée en tête. Choisir, créer,
supprimer (en cascade — voir `06-stockage-et-cascade.md`). Éditer celle qui est
sélectionnée.

### 2. Personnes
Nom, nombre de parts (défaut : 1), dates d'arrivée et de départ (défaut : bornes des
vacances). Supprimer une personne supprime aussi ses dépenses.

### 3. Dépenses
Payeur, montant, libellé, date (défaut : date de saisie). Tri du plus récent au plus
ancien. L'ajout n'est proposé qu'une fois au moins une personne saisie — une dépense
a besoin d'un payeur.

### 4. Récapitulatif
Camembert des payeurs et total payé par personne.

### 5. Remboursements
Choix de la méthode de répartition et son explication, quote-part de chacun, puis les
virements à effectuer. Voir `07-repartition.md`.

## Responsive

### Téléphone (< 768 px)
- La timeline se réduit aux pastilles numérotées ; l'étape courante est nommée en
  toutes lettres dessous. Cinq libellés longs sur une ligne ne pourraient être que
  coupés en plein mot.
- Les actions des tableaux se replient sous un bouton « … ».
- Les tableaux larges défilent dans leur propre boîte, jamais la page.

### Desktop
- Libellés affichés sous chaque pastille.
- Actions des tableaux en clair.
- Contenu centré, largeur maximale de 800 px.

## Mise à jour

Pas de rechargement : les totaux, le camembert et les remboursements se recalculent à
chaque modification.
