# Appui conseiller mobilité-carrière — plateforme locale

Application web locale d'aide à l'accompagnement pour les conseillers mobilité-carrière de la
fonction publique de l'État. Implémente les blocs fonctionnels du MVP décrits dans le
[cahier des charges](../docs/conseiller-mobilite-carriere/README.md).

> **Principe de fonctionnement** : l'application ne produit **aucune** information réglementaire
> qu'elle ne peut pas rattacher à un document ingéré. En l'absence de source pertinente, elle
> affiche le message institutionnel prévu plutôt qu'une réponse non vérifiable.

## Démarrage rapide

> **Sur Windows**, suivre plutôt le guide pas à pas : [DEMARRAGE-WINDOWS.md](./DEMARRAGE-WINDOWS.md)
> — ou double-cliquer sur `demarrer.bat`, qui vérifie Node, installe les dépendances, démarre le
> serveur et ouvre automatiquement le navigateur une fois prêt (`demarrer.ps1` fait de même depuis
> PowerShell, et corrige au passage, de façon durable, le blocage « exécution de scripts
> désactivée » si Windows l'affiche).

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

**Textes officiels livrés avec l'application** (`contenus/sources/`), ingérés automatiquement au
démarrage, et de nouveau à chaque nouvelle version d'un texte :

- la sixième partie du Code du travail (formation professionnelle : CEP, CPF, VAE, bilan de
  compétences), version en vigueur au 1er septembre 2026, tirée du fonds LEGI de la DILA. Le
  reste du Code, qui régit le contrat de travail de droit privé, n'est pas livré : il fausserait
  les réponses données à des agents publics ;
- 11 fiches pratiques de service-public.fr (DILA) sur la carrière et la formation des
  fonctionnaires : disponibilité, détachement, congé de formation professionnelle, congé de
  transition professionnelle, période de professionnalisation, formations statutaire et continue,
  entretien de formation, CPF, bilan de compétences, évaluation professionnelle. Une fiche = un
  document, avec son adresse et sa date de modification ; chaque extrait cité porte son versant
  (FPE, FPT, FPH) et son cas (« FPE › Convenances personnelles › Quelle est la durée… ? »).

`scripts/extraire-code-travail.mjs` et `scripts/extraire-fiches-service-public.mjs` régénèrent
ces fichiers depuis une version plus récente des données de la DILA. `npm run sources:importer`
force leur ré-ingestion. Un texte livré retiré depuis la base documentaire ne revient qu'avec une
version plus récente.

L'ingestion répare les mots coupés par la mise en page des PDF (« p arfois »), qui devenaient
introuvables. Les documents ingérés avec une version antérieure sont réparés automatiquement,
une seule fois, au démarrage suivant : pas besoin de les ré-ingérer.

## Recherche par le sens

La recherche combine deux méthodes, dont les classements sont fusionnés :

- **par les mots** (SQLite FTS5, BM25) : passages qui emploient les termes de la question, sigles
  et formes d'un mot compris ;
- **par le sens** : un modèle d'embeddings multilingue (`multilingual-e5-small`, quantifié en
  int8, ~135 Mo) tourne **sur le serveur même** — aucune donnée ne quitte la machine, aucun appel
  réseau à l'usage. Il rapproche une question de passages qui en traitent avec d'autres mots
  (« comment savoir si mon projet a des chances d'aboutir ? » → « Mon projet est-il faisable ? »).

Garde-fous, mesurés sur le jeu de référence (`scripts/questions-reference.json`) :

- le sens complète les mots dès qu'un passage est très proche (similarité ≥ 0,87) ; seul, il doit
  être net (≥ 0,88) ;
- une question dont les mots absents de la base portent le sujet (« congé de **maternité** ») ne
  reçoit aucune réponse par le sens : sa formulation privée de ces mots ne veut plus rien dire ;
- les passages « fourre-tout » (schémas, listes de verbes, sommaires), qui ressemblent un peu à
  toute question, sont pénalisés par rapport aux autres passages de leur document ;
- quand rien ne répond, les passages les plus proches par le sens sont proposés **à part**, comme
  *pistes de lecture*, avec la mention qu'ils ne constituent pas une réponse. Chaque passage
  trouvé par le seul sens porte l'étiquette « trouvé par le sens ».

**Installation du modèle** (une fois ; `demarrer.bat` et l'image Docker le font d'eux-mêmes) :

```bash
npm run semantique:installer                         # téléchargement depuis Hugging Face
npm run semantique:installer -- --depuis <dossier>   # installation hors ligne
```

Le modèle est vérifié (chargement et calcul d'un vecteur) avant d'être mis en place, et ses
empreintes SHA-256 sont notées dans `modeles/multilingual-e5-small/installation.json`. Au
démarrage, le serveur calcule en tâche de fond les vecteurs des passages qui n'en ont pas
(~25 s pour les 1 231 passages livrés) ; l'état est affiché sur les pages Recherche et Base
documentaire. Sans modèle, l'application fonctionne comme avant, par les mots seulement.

## Catalogue de dispositifs

Le catalogue distingue deux niveaux de fiabilité, visibles dans l'interface (badge vert / badge
ambre) :

- **Les 28 fiches sont vérifiées sur source** (`statutVerification: "verifie_source"`) : 20 depuis
  le guide DGAFP « Agir pour son projet de mobilité professionnelle », édition 2026, lu page par
  page (dont la mobilité géographique, critère du projet plutôt que dispositif, et le kiosque des
  référentiels métiers RIME, RMFP, ROME…) ; 2 (conseil en évolution professionnelle, VAE) depuis
  les articles du Code du travail en vigueur au 1er septembre 2026 ; 6 (disponibilité, congé de
  formation professionnelle, période de professionnalisation, formation statutaire et continue,
  entretien professionnel, congé de transition professionnelle) depuis les fiches service-public.fr
  livrées. Chaque fiche cite ses pages ou sa fiche officielle ; ce que les sources ne détaillent pas
  (par exemple la liste des priorités légales de mutation) porte la mention « Information à
  vérifier… ».

Le catalogue livré (`contenus/dispositifs.seed.json`) est appliqué automatiquement au démarrage
de chaque nouvelle version : fiches ajoutées, corrigées ou nouvellement vérifiées arrivent sans
commande (`npm run dispositifs:importer` le réapplique à la demande). **Une fiche vérifiée
modifiée dans l'installation n'est jamais écrasée** : le travail du conseiller prime sur le
contenu livré. L'application la reconnaît à ce qu'elle ne correspond plus à la dernière version
livrée, dont elle conserve l'empreinte.

## Fonctionnalités

Toutes les pages s'utilisent aussi sur téléphone : rubriques repliées derrière un bouton « Menu »,
en-tête réduit, champs de saisie sans zoom automatique sur iPhone, tableaux de la documentation
présentés en fiches.

| Page | Bloc MVP | Contenu |
|---|---|---|
| `/` | Tableau de bord | Indicateurs, dossiers récents, bilans, recherches, ressources |
| `/assistant` | Assistant mobilité-carrière | Trame Situation → Analyse sourcée → Pistes → Points à vérifier → Prochaines étapes → Sources |
| `/recherche` | Recherche documentaire | Recherche par les mots et par le sens dans les passages, avec citations ; pistes de lecture signalées comme telles |
| `/dispositifs` | Exploration des dispositifs | Catalogue filtrable + fiche détaillée + édition sourcée |
| `/dossiers` | Accompagnements | Statut (en cours / en attente / clos), prochain rendez-vous, historique des échanges ; diagnostic en 14 champs, bilan en 12 étapes, synthèses, plan éditable ; export des données (droit d'accès) |
| `/dossiers/[id]/restitution` | Document de restitution | Synthèse imprimable ou en PDF à remettre à l'agent, sources citées, notes internes exclues |
| `/entretien` | Préparation d'entretien | Trames de questions ouvertes par type d'entretien |
| `/base-documentaire` | Base documentaire | Ingestion, liste, retrait des documents sources |
| `/projet` | Documentation | Cahier des charges et roadmap rendus depuis le dépôt |
| `/installation` | Premier accès | Création du compte administrateur (une seule fois, tant qu'aucun compte n'existe) |
| `/connexion` | Authentification | Connexion par identifiant + mot de passe, tentatives limitées |
| `/mon-compte` | Compte | Changement du mot de passe (courant redemandé), déconnexion |
| `/administration` | Gestion des comptes | Réservée au rôle administrateur : création, activation/désactivation, réinitialisation |
| `/administration/donnees` | Conservation | Durées de conservation fixées avec le DPO, aperçu et purge confirmée |
| `/administration/journal` | Traçabilité | Journal des actions avec leur auteur, sans donnée sur les agents |

## Architecture

```
mobilite-carriere-app/
├── contenus/                   Contenus livrés : catalogue de dispositifs, textes officiels
├── modeles/                    Modèle de la recherche par le sens (non versionné, ~135 Mo)
├── data/
│   ├── app.db                  SQLite (non versionné)
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
        ├── search.ts           Recherche par les mots (FTS5), fusion avec le sens, citations
        ├── semantique.ts       Modèle d'embeddings local, vecteurs, indexation en tâche de fond
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

- **Next.js 16 (App Router) + React 19 + TypeScript** : rendu serveur, server actions (pas d'API séparée à
  maintenir pour le MVP), un seul processus à lancer en local.
- **SQLite + FTS5** (`better-sqlite3`) : aucune dépendance serveur externe, recherche plein texte
  native avec classement BM25 et extraits (`snippet`). Une bascule vers PostgreSQL + pgvector est
  possible sans changer la structure du code (l'accès aux données est isolé dans `src/lib`).
- **Tailwind CSS** : interface sobre, lisible, responsive.
- **Recherche par le sens locale** (`onnxruntime-node` + `@huggingface/tokenizers`, modèle
  `multilingual-e5-small`) : vecteurs stockés dans SQLite, calcul sur le processeur du serveur,
  sans service tiers.
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
- Le filtre d'accès (`src/proxy.ts`) ne fait que rediriger en l'absence de cookie ; chaque page
  et chaque action serveur revalident elles-mêmes la session et, pour les dossiers, la propriété.

**Sécurité technique** (revue du 28 septembre 2026) :

- Dépendances : Next.js 16.3.6 et React 19.3 — `npm audit` : aucune vulnérabilité. (Next.js 14,
  plus maintenu, en cumulait 23, dont deux exécutions de code à distance.) Aucun script
  d'installation exécuté (`.npmrc` : `ignore-scripts=true`).
- En-têtes HTTP : politique de sécurité du contenu (tout vient de l'application ; ni cadre, ni
  objet, ni formulaire vers l'extérieur), `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy: same-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` ;
  `X-Powered-By` retiré. HSTS posé par Caddy en déploiement. Vérifié : aucune erreur console sur
  les 15 pages de l'application.
- Connexion : calcul scrypt hors du fil principal (une rafale de tentatives ne bloque plus le
  serveur) ; identifiant et mot de passe plafonnés (100 et 256 caractères) avant tout calcul.
- Questions de recherche et de l'assistant plafonnées à 500 caractères (coût borné).
- PDF déposés : lus en mémoire, jamais écrits sur disque ; compilation des polices en JavaScript
  désactivée dans pdf.js (CVE-2024-4367), texte extrait inchangé (vérifié sur le guide DGAFP).
- Recherche par le sens : télémétrie d'onnxruntime coupée, vérifié par traçage système (aucune
  connexion à un service tiers) ; modèle vérifié à l'installation, jamais téléchargé à l'usage.
- Conteneur : utilisateur non root, aucun privilège système (`cap_drop: ALL`,
  `no-new-privileges`).

## Tests

```bash
npm run typecheck                     # vérification TypeScript
npm run dev                           # dans un terminal
PLAYWRIGHT_MODULE=<chemin playwright> node scripts/e2e.mjs   # dans un autre
```

**Pertinence de la recherche** — 38 questions de référence sur le guide DGAFP, 17 reformulations
en langage courant et 28 sujets qu'il ne traite pas (`scripts/questions-reference.json`), mots
seuls et mots + sens mesurés côte à côte :

```bash
npm run recherche:evaluer -- --fichier chemin/vers/GuideMobPro_2026.pdf
```

Résultats actuels (guide seul) :

| | mots seuls | mots + sens |
|---|---|---|
| questions — bonne page en 1re position | 33/38 | 34/38 |
| questions — dans les 3 premiers | 38/38 | 38/38 |
| reformulations — bonne page en 1re position | 4/17 | 6/17 |
| reformulations — dans les 3 premiers | 7/17 | 9/17 |
| sujets hors corpus sans faux résultat | 28/28 | 28/28 |

`--corpus-complet` y ajoute les textes livrés (reformulations dans les 5 premiers : 6 → 8/17 ;
les fiches service-public.fr répondent souvent elles-mêmes, par exemple sur le détachement).
Limite connue, mesurée à part : une question hors sujet dont seul un mot, absent de la base,
porte le sujet (« mon agent est en arrêt **maladie** depuis trois mois ») peut recevoir un passage
qui correspond au reste de la phrase (« délai de trois mois »), par les mots comme par le sens.

Le scénario de bout en bout (57 vérifications) couvre aussi la recherche par le sens (quand le
modèle est installé), l'usage sur téléphone (menu replié, création d'un accompagnement, passage
déplié, aucune des 12 pages principales plus large qu'un écran de 360 px), le suivi, la
restitution, l'export,
le journal, la conservation et le cloisonnement de chacun. Il couvre : création de dossier, diagnostic et synthèse, bilan et
synthèse, génération puis édition et persistance du plan, non-écrasement des saisies lors d'une
nouvelle proposition, référence de dossier en doublon, trame d'entretien, catalogue de
dispositifs, affichage de la trame de l'assistant et absence d'erreur JavaScript.

La taille maximale d'un document déposé par l'interface est fixée par
`experimental.serverActions.bodySizeLimit` dans `next.config.mjs` (50 Mo).

Si `playwright` est installé localement, `PLAYWRIGHT_MODULE` peut être omis.

## Déploiement

- **Mise en ligne gratuite pas à pas** (serveur Oracle Cloud « Always Free », adresse DuckDNS,
  HTTPS automatique) : [MISE-EN-LIGNE-GRATUITE.md](./MISE-EN-LIGNE-GRATUITE.md). Le script
  `installer-serveur.sh` installe et démarre tout en une commande.
- **Référence technique** (Docker, reverse proxy existant, sauvegardes, mise à jour) :
  [DEPLOIEMENT.md](./DEPLOIEMENT.md). L'image Docker est vérifiée : suite de bout en bout
  complète contre le conteneur de production.

Aucune dépendance n'est compilée à l'installation (`.npmrc` : `ignore-scripts=true`) : ni Python
ni outils C++ ne sont nécessaires, sous Windows comme sous Linux.

## Limites connues / suite

- Recherche par le sens assurée par un petit modèle (118 M paramètres) : utile sur les
  reformulations, sans comprendre finement une question ; ses propositions restent des extraits
  cités, à lire, jamais une réponse rédigée.
- Authentification par identifiant + mot de passe et cloisonnement des dossiers par conseiller
  sont implémentés (voir « Garde-fous implémentés »), mais aucune validation DPO/RSSI n'a été
  faite : à obtenir avant tout usage réel avec des données d'agents.
- Pas de chiffrement au repos de la base locale (au-delà des mots de passe, hachés, et des jetons
  de session, stockés sous forme de hachage).
- Pas d'alerte automatique en cas d'activité suspecte : le journal des actions se consulte depuis
  `/administration/journal`.
- 6 fiches du catalogue de dispositifs viennent d'une synthèse de recherche web non lue
  directement (`statutVerification: "non_verifie"`) : à vérifier auprès des textes de la fonction
  publique avant tout usage réel (voir « Catalogue de dispositifs » ci-dessus). Le Code général
  de la fonction publique n'a pas pu être intégré : aucune copie lisible depuis l'environnement
  de développement.
