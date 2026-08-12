# Répartition des dépenses et remboursements

Règles appliquées à l'étape **Remboursements**. Deux temps distincts : la
**quote-part** de chacun — ce qu'il aurait dû payer — puis les **transferts** — qui
rembourse qui.

> **Historique.** Ce document actait une règle unique : partage au prorata des parts,
> dates ignorées, le filtrage par dates de présence étant explicitement écarté.
> L'application propose désormais trois méthodes, dont deux tiennent compte des
> dates. La règle d'alors est conservée comme méthode « simple », et reste le défaut.

## Les trois méthodes

Le choix est enregistré **sur la vacance** (`Vacation.splitMethod`, champ optionnel :
les enregistrements antérieurs retombent sur le défaut, sans migration). Il est
déclaré dans `SPLIT_METHODS`, et implémenté dans `domains/settlement/settle.ts`.

### `shares` — simple (défaut)

`total ÷ parts`, puis × les parts de chacun. Les dates ne comptent pas.

Le levier d'ajustement est le champ **parts** : réduire les parts d'une personne
présente moins longtemps produit l'effet voulu, explicitement et sous le contrôle de
l'utilisateur.

### `shareDays` — prorata par jour

`total ÷ parts ÷ jours`. Chaque personne pèse ses parts multipliées par ses jours de
présence ; le total divisé par la somme de ces jours-parts donne le prix d'une part
pour une journée.

Simple et prévisible, mais **les dépenses sont étalées uniformément sur les
séjours** : quelqu'un reparti tôt porte encore une fraction de ce qui a été dépensé
après son départ. C'est le compromis assumé de cette méthode, et la raison d'être de
la suivante.

### `presence` — prorata par dépense

Chaque dépense est répartie **séparément**, entre les seules personnes présentes à sa
date, au prorata de leurs parts. Le calcul le plus fidèle aux faits, au prix d'une
exigence : les dates de dépense doivent être justes.

Un séjour couvre ses deux bornes — le jour du départ compte encore, le lendemain non.

## Cas limites tranchés

- **Aucun jour exploitable** (`shareDays`) : si personne n'a de jour de présence dans
  la fenêtre des vacances, on retombe sur les parts seules. Répartir sur une base
  imparfaite vaut mieux que conclure que personne ne doit rien.
- **Dépense sans témoin** (`presence`) : une dépense datée hors de tous les séjours,
  ou dont la date est illisible, retombe sur le groupe entier. L'écarter laisserait la
  somme des quotes-parts inférieure au total dépensé, et les virements ne pourraient
  plus solder à zéro.
- **Fuseaux horaires** : les dates sont interprétées à **minuit UTC**. Aucun décalage
  local ne peut faire basculer une dépense d'un côté ou de l'autre d'un départ.

## Arrondis

Les montants sont manipulés en **centimes entiers** (voir
`06-stockage-et-cascade.md`). Une division ne tombe pas toujours juste : 10 € entre
trois personnes donnent 333 + 333 + 333 et laissent un centime.

`domains/shared/allocation.ts` distribue ce reste par la **méthode du plus fort
reste** : les parts sont plafonnées à l'entier inférieur, puis les unités restantes
vont à ceux qui ont été le plus rognés, les égalités départagées par ordre d'entrée
pour que deux exécutions donnent le même résultat.

Conséquence : la somme des quotes-parts vaut **exactement** le total dépensé, la somme
des soldes vaut exactement zéro, et les transferts soldent au centime près. Le même
utilitaire sert aux pourcentages du camembert, qui totalisent donc 100.

## Transferts

À chaque tour, le plus gros débiteur paie le plus gros créancier. L'un des deux est
soldé à chaque virement, ce qui borne le résultat à **n − 1** transferts et donne à
chacun le moins d'interlocuteurs possible — personne ne fait trois petits virements
là où un seul suffit. Les égalités sont départagées par identifiant, pour que deux
exécutions sur les mêmes données produisent la même liste.

## Évolutions ouvertes

- **Participants cochés par dépense** — le plus flexible, mais alourdit la saisie de
  chaque dépense et le format `.divvy`.
- **Restriction des dépenses à partir d'une date** — se posera comme un filtre en
  amont de `computeBalances`, qui n'aura pas à changer.

## Référence

Voir `ROADMAP.md` phase 6 et `agent.md` (« calculs monétaires déterministes »).
