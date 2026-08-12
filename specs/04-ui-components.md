# Composants UI — Divvy

## Objectif

Recenser les composants d'interface effectivement présents dans l'application, et ce
dont chacun a la charge.

> **Historique.** Ce document listait des composants prévus avant l'implémentation
> (`HeaderBar`, `BurgerMenu`, `SideFloatingNav`, `PayersPieChart`, `SettlementTable`,
> `EmptyState`…). La navigation par ancres ayant été remplacée par un parcours en
> étapes, plusieurs n'ont jamais existé sous ce nom : la liste ci-dessous décrit le
> code tel qu'il est.

## Structure

### `AppShell` (`ui/layouts/`)
En-tête collant (nom de l'application, menus devise et langue), timeline, contenu de
l'étape par le slot, navigation précédent/suivant. Charge les vacances au montage et
recharge personnes et dépenses à chaque changement de sélection — point unique qui
garantit qu'aucune étape n'affiche les données d'une autre vacance.

### `.section-card`
Classe partagée (`ui/assets/design-system.css`), et non un composant : conteneur
bordé standard de chaque bloc.

## Navigation

### `StepTimeline`
Les cinq étapes en haut. Une couleur par étape, portée par la pastille et jamais par
un mot — trois teintes de la palette passent sous 3:1 de contraste avec la page. Les
étapes verrouillées sont rendues en texte simple, ni cliquables ni tabulables.

### `StepNav`
Boutons précédent / suivant, désactivés aux extrémités et quand l'étape suivante est
verrouillée.

## Vues d'étape (`views/`)

`VacationsView`, `PeopleView`, `ExpensesView`, `ResultsView`, `SettlementView` — une
par route. Les trois du milieu ne font que rendre leur composant métier.

## Composants métier

### `VacationForm`
Édition de la vacance sélectionnée (titre, dates). La suppression vit dans la liste,
là où l'on choisit *laquelle* supprimer.

### `PeopleList` / `PersonForm`
Liste et saisie : nom, parts, dates d'arrivée et de départ, valeurs par défaut issues
des vacances.

### `ExpenseList` / `ExpenseForm`
Liste triée du plus récent au plus ancien, total en pied. Saisie : payeur, montant,
libellé, date du jour par défaut.

### `ExpensesSummary`
Total payé par personne, du plus élevé au plus faible. Les personnes n'ayant rien
payé apparaissent à zéro : c'est ce que les remboursements devront compenser.
Accueille le camembert par un slot.

### `ExpensesPieChart`
Part de chaque payeur, en SVG écrit à la main — pas de librairie de graphiques. Une
teinte par personne, choisie sur sa position dans la liste et non sur son rang, pour
qu'une dépense de plus ne repeigne pas tout le monde. Au-delà de six payeurs, la
queue est regroupée sous « Autres ».

## Composants utilitaires

### `ConfirmDialog`
Confirmation avant suppression.

### `RowActions`
Actions d'une ligne de tableau : en clair à partir de 768 px, repliées sous un
bouton « … » en dessous.

### `LanguageMenu` / `CurrencyMenu`
Langue active et devise de l'application, chacune sous un menu. Chaque entrée est
**nommée en toutes lettres** : un drapeau ou un symbole n'est jamais le seul indice.

## Composables (`ui/composables/`)

### `useDismissMenu`
Ouverture d'un menu, fermeture au clic extérieur et à Échap, écouteurs retirés au
démontage. Partagé par les trois menus.

### `useCurrency`
Devise active de l'application, partagée entre tous les composants.

## États d'interface

- Chargement initial
- Aucune donnée (état vide propre à chaque liste)
- Échec d'écriture : message affiché, saisie conservée
- Données invalides (validation de formulaire)
