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

**Premier accès** : tant qu'aucun compte n'existe, toute visite redirige vers `/installation`, qui
fait créer le compte administrateur (identifiant + mot de passe, 12 caractères minimum). Cet
administrateur peut ensuite ouvrir les comptes des conseillers depuis `/administration` — aucun
autre moyen de créer un compte n'existe. Un conseiller peut changer son mot de passe depuis
`/mon-compte` ; le mot de passe actuel est toujours redemandé, sauf lors du changement forcé imposé
à la première connexion d'un compte nouvellement créé.

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

## Catalogue de dispositifs

Le catalogue distingue deux niveaux de fiabilité, visibles dans l'interface (badge vert / badge
ambre) :

- **18 fiches** viennent du guide DGAFP « Agir pour son projet de mobilité professionnelle »,
  édition 2026, lu directement page par page : `statutVerification: "verifie_source"`, avec
  citation précise (section, page).
- **8 fiches** (disponibilité, VAE, congé de formation professionnelle, période de
  professionnalisation, formation statutaire, conseil en évolution professionnelle, entretien
  professionnel, accompagnement à la reconversion) documentent des dispositifs que ce guide ne
  couvre pas. Leur contenu vient d'une recherche web (Légifrance, portail de la fonction
  publique) dont les pages n'ont pas pu être lues directement dans l'environnement de
  développement — elles restent donc `statutVerification: "non_verifie"`, avec un encart
  explicite et les liens vers les textes primaires à vérifier avant tout usage auprès d'un agent.
- **2 fiches** (mobilité géographique, kiosque des référentiels métiers) restent volontairement
  peu renseignées : le guide les traite différemment (un critère plutôt qu'un dispositif ; une
  page à consulter directement dans le guide plutôt qu'à dupliquer ici).

Sur une installation où la base existe déjà :

```bash
npm run dispositifs:importer
```

L'import ajoute les fiches manquantes et met à jour celles qui n'ont pas été documentées
localement. **Une fiche déjà documentée dans l'installation n'est jamais écrasée** : le travail du
conseiller prime sur le contenu livré.

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
| `/installation` | Premier accès | Création du compte administrateur (une seule fois, tant qu'aucun compte n'existe) |
| `/connexion` | Authentification | Connexion par identifiant + mot de passe, tentatives limitées |
| `/mon-compte` | Compte | Changement du mot de passe (courant redemandé), déconnexion |
| `/administration` | Gestion des comptes | Réservée au rôle administrateur : création, activation/désactivation, réinitialisation |

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
        ├── auth.ts             Comptes, mots de passe (scrypt), sessions, contrôle d'accès
        ├── extract.ts          Extraction de texte (PDF / Markdown / texte)
        ├── ingest.ts           Découpage en passages + indexation
        ├── search.ts           Recherche FTS5 + citations
        ├── assistant.ts        Réponse ancrée sur les passages retrouvés
        ├── dispositifs.ts      Catalogue
        ├── dossiers.ts         Dossiers, diagnostics, bilans, plans (cloisonnés par conseiller)
        └── entretien.ts        Trames d'entretien
```

`src/middleware.ts` redirige vers `/connexion` en l'absence de cookie de session, mais ne
remplace pas le contrôle d'accès : n'ayant pas accès à la base, il ne peut vérifier qu'une session
existe, pas qu'elle est valide. Chaque page et chaque action serveur revalident donc elles-mêmes
la session (`exigerSession()` / `exigerAdministrateur()`) et, pour les dossiers, la propriété
(`conseiller_id`).

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
- Journalisation des actions importantes (table `journal`), sans identifiant saisi en clair lors
  d'un échec de connexion.
- Suppression d'un dossier en cascade (diagnostics, bilans, plans, entretiens).
- Mots de passe hachés (scrypt) ; jetons de session hachés (SHA-256) en base, jamais stockés en
  clair ; comparaison à temps constant et réponse identique face à un identifiant inconnu, pour ne
  pas laisser deviner les comptes existants ; tentatives de connexion limitées et fenêtrées.
- Dossiers et recherches cloisonnés par conseiller (`conseiller_id`) : un conseiller ne voit que
  ses propres dossiers, et l'administrateur n'a **pas** d'accès élargi à ceux des autres — un choix
  délibéré, cohérent avec le principe de confidentialité du cahier des charges.
- Le middleware ne fait que rediriger en l'absence de cookie ; chaque page et chaque action
  serveur revalident elles-mêmes la session et, pour les dossiers, la propriété.

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

## Déploiement

Guide complet : [DEPLOIEMENT.md](./DEPLOIEMENT.md) (Docker, reverse proxy HTTPS, sauvegardes,
mise à jour). **Le `docker build` n'a pas pu être testé dans l'environnement de développement**
(Docker Hub y était bloqué par la politique réseau) — à construire et vérifier avant tout usage
réel, voir le tableau en tête de ce guide.

## Limites connues / suite

- Recherche **lexicale** (FTS5) uniquement : la recherche sémantique (embeddings) reste à ajouter.
- Authentification par identifiant + mot de passe et cloisonnement des dossiers par conseiller
  sont implémentés (voir « Garde-fous implémentés »), mais aucune validation DPO/RSSI n'a été
  faite : à obtenir avant tout usage réel avec des données d'agents.
- Pas de chiffrement au repos de la base locale (au-delà des mots de passe, hachés, et des jetons
  de session, stockés sous forme de hachage).
- Pas de journal d'export ni d'alerte automatique en cas d'activité suspecte : la table `journal`
  trace les actions mais n'est consultée que manuellement.
- 8 fiches du catalogue de dispositifs viennent d'une synthèse de recherche web non lue
  directement (`statutVerification: "non_verifie"`) : à vérifier auprès des textes primaires avant
  tout usage réel (voir « Catalogue de dispositifs » ci-dessus).
