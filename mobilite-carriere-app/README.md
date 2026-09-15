# Appui conseiller mobilité-carrière — plateforme locale

Application web locale d'aide à l'accompagnement pour les conseillers mobilité-carrière de la
fonction publique de l'État. Implémente les blocs fonctionnels du MVP décrits dans le
[cahier des charges](../docs/conseiller-mobilite-carriere/README.md).

> **Principe de fonctionnement** : l'application ne produit **aucune** information réglementaire
> qu'elle ne peut pas rattacher à un document ingéré. En l'absence de source pertinente, elle
> affiche le message institutionnel prévu plutôt qu'une réponse non vérifiable.

## Démarrage rapide

> **Sur Windows**, suivre plutôt le guide pas à pas : [DEMARRAGE-WINDOWS.md](./DEMARRAGE-WINDOWS.md)
> — ou double-cliquer sur `demarrer.bat`, qui vérifie Node, installe les dépendances et démarre le
> serveur (`demarrer.ps1` fait de même depuis PowerShell).

```bash
cd mobilite-carriere-app
npm install
npm run dev
```

L'application est disponible sur <http://localhost:3000>. La base SQLite (`data/app.db`) est créée
automatiquement au premier lancement et le catalogue de dispositifs est initialisé.

## Alimenter la base documentaire

La base est **vide au premier lancement** : tant qu'aucun document n'est ingéré, l'assistant et la
recherche signalent l'absence de source.

**Par l'interface** : page « Base documentaire » → déposer un fichier `.pdf`, `.md` ou `.txt`,
renseigner titre, source, date et URL, puis ingérer.

**En ligne de commande** :

```bash
npm run ingest -- --fichier data/documents/GuideMobPro_2026.pdf \
  --titre "Guide de la mobilité professionnelle 2026" \
  --source "DGAFP" \
  --url "https://www.fonction-publique.gouv.fr/files/files/publications/publications-dgafp/GuideMobPro_2026.pdf" \
  --date "2026" \
  --statut officiel
```

Réutiliser le même `--titre` remplace la version précédente du document (mise à jour incrémentale).

## Fonctionnalités

| Page | Bloc MVP | Contenu |
|---|---|---|
| `/` | Tableau de bord | Indicateurs, dossiers récents, bilans, recherches, ressources |
| `/assistant` | Assistant mobilité-carrière | Trame Situation → Analyse sourcée → Pistes → Points à vérifier → Prochaines étapes → Sources |
| `/recherche` | Recherche documentaire | Recherche plein texte dans les passages, avec citations |
| `/dispositifs` | Exploration des dispositifs | Catalogue filtrable + fiche détaillée + édition sourcée |
| `/dossiers` | Fiche de situation, bilan, plan | Diagnostic en 14 champs, bilan en 12 étapes, synthèses, plan éditable |
| `/entretien` | Préparation d'entretien | Trames de questions ouvertes par type d'entretien |
| `/base-documentaire` | Base documentaire | Ingestion, liste, retrait des documents sources |
| `/projet` | Documentation | Cahier des charges et roadmap rendus depuis le dépôt |

## Architecture

```
mobilite-carriere-app/
├── data/
│   ├── app.db                  SQLite (non versionné)
│   ├── dispositifs.seed.json   Catalogue initial (noms seuls, champs à documenter)
│   └── documents/              Documents sources déposés (non versionnés)
├── scripts/
│   ├── ingest-cli.ts           Ingestion en ligne de commande
│   └── e2e.mjs                 Tests de bout en bout (Playwright)
└── src/
    ├── app/                    Pages (App Router) + server actions
    ├── components/ui.tsx       Composants partagés
    └── lib/
        ├── db.ts               Schéma SQLite, journalisation
        ├── extract.ts          Extraction de texte (PDF / Markdown / texte)
        ├── ingest.ts           Découpage en passages + indexation
        ├── search.ts           Recherche FTS5 + citations
        ├── assistant.ts        Réponse ancrée sur les passages retrouvés
        ├── dispositifs.ts      Catalogue
        ├── dossiers.ts         Dossiers, diagnostics, bilans, plans
        └── entretien.ts        Trames d'entretien
```

**Choix techniques** (proposition par défaut, à valider — cf. Phase 0 de la roadmap) :

- **Next.js 14 (App Router) + TypeScript** : rendu serveur, server actions (pas d'API séparée à
  maintenir pour le MVP), un seul processus à lancer en local.
- **SQLite + FTS5** (`better-sqlite3`) : aucune dépendance serveur externe, recherche plein texte
  native avec classement BM25 et extraits (`snippet`). Une bascule vers PostgreSQL + pgvector est
  possible sans changer la structure du code (l'accès aux données est isolé dans `src/lib`).
- **Tailwind CSS** : interface sobre, lisible, responsive.
- **Aucun appel à un LLM externe** dans cette version : l'assistant restitue les passages
  réellement retrouvés. Ce choix garantit qu'aucune règle ne peut être inventée et rend
  l'application utilisable sans clé d'API ni transfert de données vers un tiers. L'ajout d'une
  couche de génération reste possible, à condition de conserver le contrat d'ancrage
  (toute affirmation doit provenir d'un passage cité).

## Garde-fous implémentés

- Message institutionnel systématique en l'absence de source pertinente (`MESSAGE_A_VERIFIER`).
- Aucune analyse produite quand aucun passage n'est retrouvé.
- Distinction visuelle entre information officielle (vert) et suggestion générée (ambre).
- Fiches dispositif non documentées explicitement signalées ; une fiche n'est marquée comme
  documentée que si une source est renseignée.
- Minimisation des données : aucun nom, prénom ou identifiant d'agent n'est demandé — un dossier
  est identifié par une référence choisie par le conseiller.
- Une nouvelle proposition de plan complète le plan existant sans écraser les lignes saisies par
  le conseiller.
- Journalisation des actions importantes (table `journal`).
- Suppression d'un dossier en cascade (diagnostics, bilans, plans, entretiens).

## Tests

```bash
npm run typecheck                     # vérification TypeScript
npm run dev                           # dans un terminal
PLAYWRIGHT_MODULE=<chemin playwright> node scripts/e2e.mjs   # dans un autre
```

Le scénario de bout en bout couvre : création de dossier, diagnostic et synthèse, bilan et
synthèse, génération puis édition et persistance du plan, non-écrasement des saisies lors d'une
nouvelle proposition, référence de dossier en doublon, trame d'entretien, catalogue de
dispositifs, affichage de la trame de l'assistant, rendu mobile et absence d'erreur JavaScript.

La taille maximale d'un document déposé par l'interface est fixée par
`experimental.serverActions.bodySizeLimit` dans `next.config.mjs` (50 Mo).

Si `playwright` est installé localement, `PLAYWRIGHT_MODULE` peut être omis.

## Limites connues / suite

- Recherche **lexicale** (FTS5) uniquement : la recherche sémantique (embeddings) reste à ajouter.
- Pas d'authentification ni de gestion des droits : à implémenter avant tout usage réel avec des
  données d'agents (Lot 0 de la roadmap).
- Pas de chiffrement au repos de la base locale.
- Catalogue de dispositifs livré avec les intitulés seuls : chaque fiche doit être documentée
  depuis le guide DGAFP avant d'être considérée comme fiable.
