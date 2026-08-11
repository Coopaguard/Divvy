# Stockage local — modèle de propriété et suppression en cascade

## Décision

Le stockage IndexedDB (`src/domains/storage/db.ts`) suit un **modèle de propriété
à racine unique** :

- Le store `vacations` est la **racine**.
- Tout autre store contient des enregistrements **rattachés à exactement une
  vacance**, via un champ et un index `vacationId`.
- Supprimer une vacance supprime **en cascade** tout ce qui lui est rattaché.

## Garanties

- **Atomicité** : la cascade s'exécute dans **une seule transaction IndexedDB**
  couvrant tous les stores concernés. Soit tout est supprimé, soit rien ne l'est.
  Une écriture qui échoue en cours de route laisse le stockage inchangé.
- **Aucun orphelin** : aucun enregistrement ne peut survivre à la vacance qui le
  possède.
- **Rattrapage** : `pruneOrphanRecords()` supprime les enregistrements orphelins
  écrits avant la mise en place de la cascade. Appelé au chargement de
  l'application, en best effort (un échec ne bloque jamais le démarrage).

## Brancher un nouveau domaine

Les phases 4 à 6 ajoutent les Dépenses et la répartition. Pour qu'un nouveau
domaine soit couvert par la cascade, il suffit de :

1. Ajouter le nom du store à `VACATION_OWNED_STORES` dans `db.ts`.
2. Donner à ses enregistrements un champ `vacationId`.

Le schéma (création du store et de son index), la cascade et le nettoyage des
orphelins s'appliquent alors automatiquement — il n'y a pas de logique de
suppression à dupliquer par domaine.

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

## Référence

Voir `ROADMAP.md` (phases 1, 4, 5, 6) et `agent.md` pour les conventions de code.
