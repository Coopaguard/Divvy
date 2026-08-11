# Répartition des dépenses — règle retenue

Spécification de la règle de partage appliquée en **phase 6**. Elle ne décrit
pas encore l'algorithme de transferts, seulement *qui supporte quoi*.

## Décision

**Chaque dépense est partagée par toutes les personnes de la vacance, au prorata
de leurs parts.**

- Le **payeur** d'une dépense est la personne qui a avancé l'argent
  (`Expense.payerId`, saisi en phase 4).
- Les **participants** à une dépense sont **toutes** les personnes rattachées à
  la vacance, sans exception ni sélection manuelle.
- Le poids de chaque personne est son nombre de **parts** (`Person.shares`).

Autrement dit, pour une dépense de montant `M` et un total de parts `P`, une
personne détenant `p` parts en supporte `M × p / P`.

## Conséquence assumée

Les champs `arrivalDate` et `departureDate` d'une personne **n'entrent pas** dans
le calcul. Ils restent saisis et affichés à titre informatif, mais quelqu'un qui
ne reste que deux jours supporte la même quote-part qu'une personne présente tout
le séjour, à parts égales.

Le levier d'ajustement est le champ **parts** : réduire les parts d'une personne
présente moins longtemps produit l'effet voulu, explicitement et sous le contrôle
de l'utilisateur.

## Alternatives écartées

- **Filtrer sur les dates de présence** — une personne ne participerait qu'aux
  dépenses dont la date tombe dans son séjour. Plus juste automatiquement, mais
  rend la répartition implicite et difficile à expliquer à l'utilisateur.
- **Participants cochés par dépense** — le plus flexible, mais alourdit la
  saisie de chaque dépense et le format `.divvy`.

Ces deux options restent ouvertes comme évolutions futures : elles ajoutent de
l'information au modèle sans invalider la règle actuelle.

## Arrondis

Les montants sont manipulés en **centimes entiers** (voir
`specs/06-stockage-et-cascade.md`). Une division ne tombe pas toujours juste :
la somme des quotes-parts doit rester **exactement** égale au montant réparti.
Le reste en centimes est donc distribué de façon déterministe plutôt que perdu
par arrondi — la règle précise sera fixée à l'implémentation de la phase 6 et
couverte par des tests.

## Référence

Voir `ROADMAP.md` phase 6 et `agent.md` (« calculs monétaires déterministes »).
