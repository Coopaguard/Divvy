# Stockage local — modèle de propriété et suppression en cascade

## Décision

Le stockage IndexedDB (`src/domains/storage/db.ts`) suit un **modèle de propriété
à racine unique** :

- Le store `vacations` est la **racine**.
- Tout autre store contient des enregistrements **rattachés à exactement une
  vacance**, via un champ et un index `vacationId`.
- Supprimer une vacance supprime **en cascade** tout ce qui lui est rattaché.

Un **second niveau de rattachement** existe depuis la phase 4 : une Dépense
pointe aussi vers la Personne qui l'a payée (`payerId`, indexé). Supprimer une
personne supprime ses dépenses — sans quoi le calcul de répartition (phase 6)
travaillerait sur un payeur inexistant. L'interface annonce le nombre de
dépenses concernées avant de confirmer.

## Garanties

- **Atomicité** : la cascade s'exécute dans **une seule transaction IndexedDB**
  couvrant tous les stores concernés. Soit tout est supprimé, soit rien ne l'est.
  Une écriture qui échoue en cours de route laisse le stockage inchangé.
- **Aucun orphelin** : aucun enregistrement ne peut survivre à la vacance qui le
  possède.
- **Rattrapage** : `pruneOrphanRecords()` supprime les enregistrements orphelins
  écrits avant la mise en place de la cascade — vacance inexistante, puis payeur
  inexistant. Les deux passes sont ordonnées : les dépenses d'une personne
  elle-même supprimée comme orpheline ne survivent pas à la même passe. Appelé
  au chargement de l'application, en best effort (un échec ne bloque jamais le
  démarrage).

## Brancher un nouveau domaine

Pour qu'un nouveau domaine soit couvert par la cascade, il suffit de :

1. Le déclarer dans `SCHEMA` (nom du store et index) dans `db.ts`.
2. L'ajouter à `VACATION_OWNED_STORES`, et à `PERSON_OWNED_STORES` s'il est
   aussi rattaché à une personne.
3. Donner à ses enregistrements un champ `vacationId`.
4. **Incrémenter `DB_VERSION`.**

Le schéma, les cascades et le nettoyage des orphelins s'appliquent alors
automatiquement — il n'y a pas de logique de suppression à dupliquer par
domaine.

### Migration de schéma

`DB_VERSION` **doit** être incrémenté à chaque évolution du schéma :
`onupgradeneeded` ne se déclenche que sur changement de version, donc sans cela
les utilisateurs disposant déjà d'une base ne verraient jamais le nouveau store.
`applySchema()` est idempotent — il ne crée que ce qui manque — et sert donc à
la fois à l'initialisation et à la migration, sans perte de données existantes.

Versions : **v1** vacances + personnes (phase 1) ; **v2** ajout des dépenses
(phase 4).

## Connexion

Une **connexion unique** à la base est partagée par toutes les opérations.
Elle est libérée automatiquement si le navigateur ou un autre onglet la ferme
(`onclose`, `onversionchange`), et rouverte à la demande suivante.

## Gestion d'erreurs

La couche stockage **remonte** ses erreurs ; ce sont les stores Pinia qui les
capturent (voir `src/stores/asyncState.ts`) :

- L'état en mémoire n'est mis à jour **qu'après** confirmation de l'écriture.
- Une opération échouée renseigne `error` et retourne `null` / `false` au lieu
  de propager une exception non gérée.
- L'UI affiche le message correspondant et conserve la saisie de l'utilisateur.

## Montants monétaires

Les montants sont stockés en **centimes entiers** (`amountCents`), jamais en
flottants : `0.1 + 0.2 !== 0.3` en IEEE-754, et l'écart se propagerait aux
totaux puis à la répartition. La conversion n'a lieu qu'aux frontières — saisie
et affichage — via `domains/shared/money.ts`.

## Référence

Voir `ROADMAP.md` (phases 1, 4, 5, 6) et `agent.md` pour les conventions de code.
