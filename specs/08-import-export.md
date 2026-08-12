# Import / export — fichier `.divvy`

## Objectif

Sortir une vacance de l'application et l'y remettre, sur le même appareil ou sur
un autre.

## Unité d'échange

Un fichier contient **une vacance et tout ce qui lui est rattaché** : ses
personnes et ses dépenses. C'est la même unité que la cascade de suppression
(`06-stockage-et-cascade.md`) — ce qui part ensemble voyage ensemble.

## Format

JSON, extension `.divvy`, type MIME `application/json`.

```json
{
  "format": "divvy",
  "version": 1,
  "exportedAt": "2026-08-12T06:00:00.000Z",
  "vacation": { "...": "titre, dates, méthode de répartition" },
  "people":   [ "..." ],
  "expenses": [ "..." ]
}
```

`version` est **comparée, pas ignorée** : un fichier écrit par une version plus
récente est refusé plutôt que lu de travers. Un fichier plus ancien reste
acceptable.

## Sorties

- **Exporter** — téléchargement du fichier, nommé d'après le titre de la vacance
  (accents et ponctuation retirés ; un titre vide retombe sur `vacances.divvy`).
- **Partager** — feuille de partage du système, vers les applications de
  messagerie. Refermer la feuille sans envoyer n'est pas une erreur et ne dit
  rien à l'utilisateur.

  **Proposé uniquement là où il fonctionne** : le partage de fichiers demande un
  contexte sécurisé et n'existe pas sur la plupart des navigateurs de bureau.

  Les navigateurs n'acceptent par ailleurs de partager qu'une **liste de types de
  fichiers**, et `.divvy` n'y figure pas. Sans repli, l'action serait donc
  invisible partout, y compris sur téléphone. Le même contenu est présenté sous
  des habillages successifs — `.divvy`, puis `.divvy.json`, puis `.divvy.txt` en
  `text/plain` — et le premier accepté est envoyé. Seuls le nom et le type
  annoncés changent ; les octets sont identiques.

  La lecture validant le **contenu et non l'extension**, un fichier revenu d'un
  partage se réimporte sans rien perdre. Le sélecteur de fichier accepte donc
  aussi `.json` et `.txt`.

Les deux partent du même contenu sérialisé, et fonctionnent depuis la **liste**,
sans avoir à ouvrir la vacance au préalable.

## Lecture

La lecture est **défensive** — le fichier vient de l'extérieur. Chaque échec
porte une raison distincte, pour que l'utilisateur sache s'il s'est trompé de
fichier ou si le nôtre est abîmé :

| Raison | Cas |
| --- | --- |
| `notJson` | ce n'est pas du JSON (image, téléchargement tronqué) |
| `notDivvy` | du JSON, mais pas un de nos fichiers |
| `unsupportedVersion` | un des nôtres, écrit par une version plus récente |
| `invalidData` | lisible, mais le contenu ne tient pas debout |

Sont vérifiés : les champs obligatoires, le format des dates, des parts positives,
et des montants en **centimes entiers** — un flottant ou un négatif contaminerait
tous les totaux. Enfin, **l'intégrité référentielle** : une dépense dont le payeur
ne figure pas dans le fichier fait rejeter l'ensemble, car elle rendrait la
répartition incalculable.

## Un import n'écrase jamais

Le contenu importé reçoit des **identifiants neufs**, les liens internes (dépense
→ payeur) étant réattribués en conséquence. Importer deux fois le même fichier
donne donc deux vacances distinctes.

C'est délibéré : un doublon se supprime, un écrasement silencieux ne se répare
pas. La vacance importée est sélectionnée, le parcours peut reprendre aussitôt.

L'écriture se fait en **une seule transaction** couvrant les trois stores : même
exigence que la cascade, dans l'autre sens — un import interrompu ne doit pas
laisser une vacance sans ses dépenses.

## Hors périmètre

- Fusionner un fichier avec une vacance existante
- Exporter plusieurs vacances à la fois
