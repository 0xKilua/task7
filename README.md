# Relook — relooking virtuel

Application permettant de simuler, a partir d'une photo, un changement de
coiffure, de couleur de cheveux, de vetements et de silhouette — en
conservant le visage, l'identite et les proportions de la personne.

➡️ Pour l'architecture detaillee, les choix techniques et leurs
justifications, voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Structure du monorepo

```
apps/
  web/        Next.js 14 (App Router) — application web, mobile-first
  api/        Fastify + TypeScript — backend, auth, orchestration des simulations
  mobile/     Expo / React Native — squelette iOS/Android (voir apps/mobile/README.md)
services/
  vision/     Python/FastAPI/MediaPipe — analyse photo, recoloration, silhouette (100% local, CPU)
packages/
  types/          Schemas Zod partages (web/api)
  catalog-data/   Catalogue de depart (coiffures, couleurs, vetements)
  db/             Schema Prisma + client + seed
  ai-engine/      Abstraction fournisseur IA generatif (Replicate) pour coiffure/vetements
infra/
  docker/         docker-compose (Postgres, Redis, MinIO, vision, api, web)
```

## Ce qui est reellement fonctionnel des maintenant (sans aucune cle API)

- Upload et validation de photo (format, taille, resolution, compression, EXIF).
- Analyse reelle de la photo : detection visage/corps, classification du
  cadrage (portrait / buste / demi-corps / pied-a-tete), score de nettete
  (MediaPipe Face Landmarker + Pose Landmarker, en local sur CPU).
- **Recoloration des cheveux** : segmentation reelle des cheveux
  (MediaPipe Hair Segmenter) + transfert de couleur en espace LAB qui
  preserve texture/volume/reflets. 14 couleurs de base + 6 techniques
  (meches, balayage, ombre, degrade, racines differentes, bicolore).
- **Simulation de silhouette** par palier de 2kg : warp guide par la
  pose (MediaPipe Pose Landmarker) et borne par la silhouette reelle
  (Selfie Segmenter), limite aux epaules -> haut des cuisses pour ne
  jamais toucher au visage ni deformer les membres.
- Comptes utilisateurs (JWT), catalogue (coiffures/couleurs/vetements),
  administration du catalogue avec journal d'audit, galerie/historique,
  favoris, suppression de compte conforme RGPD (effacement immediat des
  fichiers et donnees).

## Ce qui necessite une configuration supplementaire

Le **changement de forme de coiffure** (longueur/coupe) et l'**essayage
virtuel de vetements** necessitent un modele de diffusion generatif que ce
CPU ne peut pas faire tourner de maniere realiste. Ces deux modules sont
integres pour de vrai contre l'API Replicate (`packages/ai-engine`), mais
**necessitent `REPLICATE_API_TOKEN`**. Sans cette cle, l'application ne
simule jamais un faux resultat : le statut de la simulation est
explicitement `provider_not_configured`, affiche clairement dans
l'interface (voir `apps/web/src/components/SimulationPanel.tsx`).

## Demarrage rapide (developpement local)

Prerequis : Node.js 20+, pnpm 9+, Python 3.11+, PostgreSQL 16, Redis 7.
(Une configuration docker-compose alternative est fournie dans
`infra/docker/`, avec MinIO pour le stockage S3-compatible.)

```bash
# 1. Dependances Node
pnpm install

# 2. Service de vision (Python)
cd services/vision
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./scripts/download_models.sh
uvicorn app.main:app --port 8100 &
cd ../..

# 3. Base de donnees
cp .env.example .env   # completer DATABASE_URL, JWT secrets, etc.
pnpm --filter @relook/db migrate
pnpm --filter @relook/db seed

# 4. Backend
pnpm --filter @relook/api dev          # API sur :4000
pnpm --filter @relook/api worker:dev   # worker de simulations (processus separe)

# 5. Frontend web
NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter @relook/web dev   # :3000
```

Voir [`.env.example`](./.env.example) pour la liste complete des variables
d'environnement, et le README de chaque app/service pour le detail.

## Tests

| Perimetre | Commande | Couverture |
| --- | --- | --- |
| `packages/types`, `catalog-data`, `ai-engine` | `pnpm --filter <pkg> test` | logique metier, validation catalogue, integration Replicate mockee |
| `services/vision` | `cd services/vision && pytest` | 25 tests sur photos reelles (analyse, recoloration, silhouette, API) |
| `apps/api` | `pnpm --filter @relook/api test` | 30 tests d'integration (vraie base Postgres, Redis, service de vision) |
| `apps/web` | `pnpm --filter @relook/web exec playwright test` | 3 parcours de bout en bout, vrai navigateur, pile complete |
| `apps/mobile` | `cd apps/mobile && npx tsc --noEmit` + `npx expo export` | typage + bundling Metro (pas de simulateur dans cet environnement) |

**109 tests automatises** passent contre de vrais services (pas de mocks
pour la logique de vision/couleur/silhouette), plus 3 tests de bout en
bout en navigateur reel couvrant l'inscription, l'upload d'une vraie
photo, une simulation couleur complete avec comparaison avant/apres, une
simulation de silhouette, et la verification que les modules non
configures l'indiquent clairement.

## Confidentialite et RGPD

- Photos et resultats stockes de maniere isolee par utilisateur
  (`STORAGE_PROVIDER=s3` en production, chiffrement en transit via HTTPS).
- Suppression de compte = suppression immediate et definitive des photos,
  simulations et favoris (`DELETE /account`).
- Suppression individuelle d'une photo ou d'une simulation a tout moment.
- Politique de retention configurable (`DATA_RETENTION_DAYS`).
- Aucune photo n'est utilisee pour entrainer un modele.
- Voir `ARCHITECTURE.md` pour le detail des mesures de securite.

## Licence

MIT — voir [`LICENSE`](./LICENSE).
