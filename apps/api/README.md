# @relook/api

API backend (Fastify + TypeScript + Prisma) : authentification, upload et
validation de photos, catalogue, orchestration des simulations, favoris,
gestion de compte (RGPD).

## Lancement local

Prerequis : PostgreSQL, Redis, et `services/vision` demarre (voir sa
propre documentation).

```bash
cp ../../.env.example ../../.env   # a la racine du repo
pnpm --filter @relook/db migrate
pnpm --filter @relook/db seed
pnpm --filter @relook/api dev        # serveur HTTP (port 4000)
pnpm --filter @relook/api worker:dev # worker de simulations (processus separe)
```

Par defaut `STORAGE_PROVIDER=local` : les photos sont stockees sur disque
dans `.data/uploads` sans dependance a MinIO/S3, pratique pour developper
sans Docker. Passez `STORAGE_PROVIDER=s3` (et les variables `S3_*`) pour
utiliser MinIO (docker-compose) ou un vrai bucket S3/R2 en production.

## Architecture des simulations

`POST /simulations` valide la demande et cree une ligne `Simulation`
(statut `queued`), puis empile un job BullMQ. Un **processus worker
separe** (`src/worker.ts`) consomme la queue et execute le pipeline reel
(`src/modules/simulations/simulations.processor.ts`) :

- `couleur` / `silhouette` -> appellent `services/vision` (local, CPU, pas
  de cle API).
- `coiffure` / `vetements` -> appellent `packages/ai-engine`. Si
  `REPLICATE_API_TOKEN` n'est pas configure, le statut final est
  `provider_not_configured` (jamais un faux succes).

Le frontend fait un polling sur `GET /simulations/:id` pour suivre la
progression (`queued` -> `analyzing` -> `preparing` -> `generating` ->
`finalizing` -> `completed`/`failed`/`provider_not_configured`).

## Tests

Necessite une base Postgres de test, Redis, et `services/vision` demarre :

```bash
DATABASE_URL=postgresql://relook:relook@localhost:5432/relook_test \
REDIS_URL=redis://localhost:6379 \
JWT_ACCESS_SECRET=test-access-secret-please-change \
JWT_REFRESH_SECRET=test-refresh-secret-please-change \
STORAGE_PROVIDER=local \
LOCAL_STORAGE_DIR=.data/test-uploads \
VISION_SERVICE_URL=http://127.0.0.1:8100 \
NODE_ENV=test \
pnpm --filter @relook/api test
```

Les tests d'integration utilisent de vraies photos (`services/vision/tests/fixtures`),
une vraie base de donnees et le vrai service de vision : ils verifient
notamment que les modules `coiffure`/`vetements` renvoient explicitement
`provider_not_configured` (et jamais un resultat simule) tant qu'aucune
cle Replicate n'est fournie.
