# Architecture

## 1. Analyse du besoin et difficultes techniques principales

1. **Realisme sans fausses promesses.** Le cahier des charges interdit
   explicitement de simuler un resultat IA avec un filtre ou un
   placeholder. Cela exclut d'emblee toute "solution facile" (overlay CSS,
   teinte plate) pour la coloration, et impose une vraie strategie pour les
   modules qui necessitent un modele generatif (coiffure, vetements) quand
   aucune cle API/GPU n'est disponible.
2. **Conservation de l'identite.** Toute transformation doit preserver le
   visage, les yeux, les proportions. Cela oriente vers des approches
   *localisees* (masques de segmentation, zones d'effet bornees) plutot que
   des re-generations d'image entiere.
3. **Absence de GPU dans l'environnement de developpement/build fourni.**
   Les modeles de diffusion (inpainting, virtual try-on) necessitent un GPU
   pour un temps de reponse raisonnable. Deux modules (coiffure "forme",
   vetements) en dependent intrinsequement ; les quatre autres capacites
   (analyse, cadrage, recoloration, silhouette) ne le necessitent pas si on
   choisit les bons algorithmes.
4. **Extensibilite du catalogue sans redeploiement.** Coiffures, couleurs
   et vetements doivent pouvoir etre ajoutes par un non-developpeur.
5. **Coherence web/mobile** avec un seul backend, sans dupliquer la logique
   metier ni les regles de validation (palier de 2kg, formats de fichiers,
   etc.).
6. **RGPD** : donnees sensibles (photos de personnes), droit a l'effacement,
   minimisation de la conservation.

## 2. Architecture generale

```
                          +-------------------+
                          |     apps/web       |  Next.js 14 (App Router)
                          |  (navigateur)       |  Tailwind, mobile-first
                          +----------+----------+
                                     |  HTTPS / REST + JWT
                          +----------v----------+          +-------------------+
                          |      apps/api        |<-------->|   apps/mobile      |
                          |  Fastify + TS          |  REST   |  Expo / RN squelette|
                          +----+---------+---------+          +-------------------+
                               |         |
          +--------------------+         +---------------------+
          |                                                     |
+---------v----------+                               +----------v-----------+
| PostgreSQL (Prisma) |                               | Redis + BullMQ        |
| users/photos/        |                               | (file d'attente des   |
| simulations/catalog  |                               |  jobs de generation)  |
+----------------------+                               +----------+-----------+
                                                                    |
                                                         +----------v-----------+
                                                         |  apps/api worker       |
                                                         |  (processus separe)    |
                                                         +----+--------------+----+
                                                              |              |
                                          +-------------------v--+     +----v------------------+
                                          | services/vision       |     | packages/ai-engine      |
                                          | Python/FastAPI          |     | Provider Replicate       |
                                          | MediaPipe (CPU, local)  |     | (coiffure "forme",        |
                                          | analyse / cadrage /     |     |  essayage vetements)      |
                                          | recoloration / silhouette|     | necessite cle API         |
                                          +--------------------------+     +---------------------------+
                                                              |
                                                   +----------v-----------+
                                                   | Stockage objet (S3/    |
                                                   | MinIO ou disque local) |
                                                   +------------------------+
```

Separation stricte : le frontend ne parle jamais directement a
`services/vision` ni a Replicate — tout passe par `apps/api`, seul point
d'entree authentifie, qui orchestre et persiste l'etat (`Simulation.status`
suit explicitement `queued -> analyzing -> preparing -> generating ->
finalizing -> completed|failed|provider_not_configured`, ce qui alimente
les messages de progression cote UI).

## 3. Stack technique — choix et justification

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Monorepo | pnpm + Turborepo | Partage de types (`@relook/types`) entre web et API sans dupliquer la validation metier ; builds incrementaux caches. |
| Backend | Fastify + TypeScript | Plus leger et plus rapide que Nest/Express pour ce perimetre ; schema-first, bon ecosysteme plugins (multipart, cors). |
| ORM / DB | Prisma + PostgreSQL | Migrations versionnees, types generes, `Json` pour les champs flexibles du catalogue (tags, parametres de transformation) sans sacrifier les index sur les champs de filtrage. |
| Jobs asynchrones | BullMQ + Redis, worker dans un **processus separe** | La generation (surtout via un provider externe) peut prendre plusieurs secondes a minutes : ne jamais bloquer l'event loop HTTP. Permet aussi de scaler le worker independamment de l'API. |
| Stockage | Interface `StorageProvider` avec deux implementations (S3-compatible et disque local) | Demarrage sans dependance externe en dev (`STORAGE_PROVIDER=local`), meme code en production contre S3/R2/MinIO (`STORAGE_PROVIDER=s3`). |
| Vision par ordinateur | Python + FastAPI + MediaPipe (modeles officiels Google, Apache-2.0) | Seule stack permettant une segmentation/pose/visage fiable et **rapide sur CPU** ; evite une dependance a un GPU ou une API tierce pour des taches qui n'en ont pas structurellement besoin. |
| Frontend web | Next.js 14 (App Router) + Tailwind | SSR/SSG ou l'on veut, composants serveur pour le contenu statique, mobile-first par defaut avec Tailwind. |
| Mobile | Expo / React Native | Un seul code source iOS + Android ; `expo-image-picker` pour l'upload natif ; ecosysteme mature. Gere avec npm (voir `apps/mobile/README.md`) pour eviter les problemes connus de Metro avec les node_modules symlinkes par pnpm. |
| IA generative (coiffure/forme, vetements) | Abstraction `packages/ai-engine` + implementation Replicate | Pas de GPU disponible ici : plutot que de faire tourner un mauvais modele local ou de simuler un resultat, le systeme delegue a un fournisseur hebergeur reel, **de maniere pluggable** (ajouter un fournisseur = implementer une interface + un cas dans `factory.ts`). |

### Pourquoi ne pas tout faire "a l'ancienne" avec un seul gros modele ?

Le sujet impose une architecture **hybride** par construction : aucune
famille de modele unique ne couvre a la fois la segmentation de precision
(cheveux), l'estimation de pose, et la generation photorealiste
(inpainting coiffure, virtual try-on). Utiliser MediaPipe pour tout ce qui
est deterministe/discriminatif et reserver la generation a un modele de
diffusion externe est le compromis qui maximise realisme + cout + rapidite
+ confidentialite (aucune photo n'est envoyee a un tiers pour l'analyse,
la couleur ou la silhouette — seuls les deux modules generatifs, s'ils
sont configures, envoient l'image a Replicate).

## 4. Modeles IA utilises

### Reellement executes en local (aucune cle API)

- **Face Landmarker** (MediaPipe) — 478 points de reperes du visage.
  Utilise pour `faceDetected`/`faceCount` et comme entree potentielle des
  futurs providers coiffure.
- **Pose Landmarker** (MediaPipe, variante *lite*) — 33 points de repere du
  corps. Utilise pour la classification du cadrage
  (`portrait|buste|demi_corps|pied_a_tete`) et pour ancrer le warp de
  silhouette sur l'axe reel du corps.
- **Hair Segmenter** (MediaPipe) — masque de segmentation des cheveux au
  pixel pres. Base de la recoloration : sans detection fiable, l'API
  renvoie une erreur explicite plutot que de recolorer au hasard.
- **Selfie/Image Segmenter** (MediaPipe) — masque de la silhouette
  complete de la personne, utilise pour borner le warp de silhouette a la
  personne (et ne jamais deformer l'arriere-plan).

Tous ces modeles sont publies par Google sous licence Apache-2.0,
telecharges par `services/vision/scripts/download_models.sh`, et tournent
sur CPU en quelques centaines de millisecondes par image.

### Algorithmes classiques (pas de reseau de neurones), reels et testes

- **Transfert de couleur en espace LAB** (type Reinhard) pour la
  recoloration : recentre la moyenne (teinte/luminance) des pixels du
  masque de cheveux sur la couleur cible, sans toucher a la variance
  -> la texture et les reflets d'origine restent visibles. Gradient
  racines/pointes pour les techniques bi-ton (balayage, ombre, etc.).
- **Mise a l'echelle horizontale guidee par la pose** pour la silhouette :
  chaque ligne du buste/taille/hanches est etiree ou compressee
  proportionnellement a sa distance a l'axe du corps, avec un facteur
  d'echelle derive lineairement du delta en kg, attenue (taper) en haut et
  en bas de la zone d'effet, et borne par la silhouette reelle
  (segmentation). Limitation connue et documentee dans
  `services/vision/app/silhouette.py` : la zone revelee lors d'un
  agrandissement est remplie par etirement plutot que par un inpainting
  genere — piste d'amelioration citee plus bas.

### Generatifs, via fournisseur externe (necessitent `REPLICATE_API_TOKEN`)

- **Changement de forme de coiffure** : inpainting guide par un masque de
  cheveux et un prompt derive du catalogue (modele par defaut :
  `stability-ai/stable-diffusion-inpainting`, configurable).
- **Essayage virtuel de vetements** : modele de virtual try-on (par defaut
  `cuuupid/idm-vton`, configurable), applique piece par piece pour les
  ensembles multi-couches.

**Sans cle configuree, ces deux modules renvoient explicitement le statut
`provider_not_configured`** (jamais un resultat invente) — voir
`packages/ai-engine/src/providers/not-configured-provider.ts` et les tests
associes dans `apps/api/test/simulations.test.ts`.

## 5. Modele de donnees (extrait)

`User`, `Photo`, `Simulation`, `Favorite`, `CatalogHairstyle`,
`CatalogHairColor`, `CatalogClothing`, `AdminAuditLog`, `RefreshToken` —
schema complet dans `packages/db/prisma/schema.prisma`. Le catalogue est
en base (pas en dur dans le code) pour permettre son administration sans
redeploiement.

## 6. Securite et confidentialite

- Mots de passe haches (bcrypt, 12 rounds) ; jamais stockes en clair.
- JWT access (courte duree) + refresh (rotation a chaque utilisation,
  revocation stockee en base) ; **chaque requete authentifiee revalide
  que l'utilisateur existe toujours** (protection contre un jeton valide
  apres suppression de compte).
- Validation stricte des uploads (format reel via `sharp`, pas seulement
  l'extension ; taille ; resolution minimale) avant tout traitement.
- Chaque photo/simulation est explicitement liee a son proprietaire ; toute
  route verifie l'appartenance avant de servir une ressource (404, pas 403,
  pour ne pas confirmer l'existence d'une ressource d'un autre utilisateur).
- Suppression de compte = suppression immediate des fichiers stockes puis
  du compte (cascade Prisma pour les lignes associees).
- CORS restreint a l'origine configuree ; toutes les communications
  prevues en HTTPS en production (TLS termine par l'infrastructure de
  deploiement).
- Journal d'audit (`AdminAuditLog`) sur toute modification du catalogue par
  un administrateur.
- Aucune photo n'est envoyee a un tiers sauf pour les deux modules
  generatifs explicitement configures par l'operateur (et seulement pour
  la photo activement soumise a ce module).

## 7. Deploiement recommande (progressif)

**Phase 1 (cout minimal / demarrage)**
- `apps/web` -> Vercel (ou tout hebergeur Next.js).
- `apps/api` + worker -> un service conteneurise (Railway/Render/Fly.io),
  deux process a partir de la meme image (`Dockerfile` fourni).
- PostgreSQL et Redis manages (Neon/Supabase + Upstash, ou l'offre managee
  du meme hebergeur).
- `services/vision` -> conteneur CPU (pas de GPU necessaire), 1-2 vCPU
  suffisent pour un usage naissant.
- Stockage -> Cloudflare R2 ou S3 (compatible `S3StorageProvider`).
- IA generative -> Replicate (paiement a l'usage, pas d'infra a gerer).

**Phase 2 (montee en charge)**
- `services/vision` : plusieurs replicas derriere un load balancer (stateless).
- Worker BullMQ : plusieurs replicas (`concurrency` deja parametrable).
- CDN devant les resultats d'images (cache des `resultStorageKey`).
- Observabilite : logs structures deja en place (pino), a brancher sur un
  agregateur (Grafana Loki, Datadog...) ; ajouter des metriques (temps de
  generation par module, taux d'echec par provider).
- Sauvegardes automatiques PostgreSQL + politique de purge conforme a
  `DATA_RETENTION_DAYS`.

**Secrets a gerer** : `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`DATABASE_URL`, `REDIS_URL`, `S3_*`, `REPLICATE_API_TOKEN` — jamais commit,
geres via les secrets manager de l'hebergeur choisi.

## 8. Points restant a ameliorer

- **Providers generatifs** : les schemas d'entree exacts des modeles
  Replicate par defaut doivent etre revalides avant mise en production
  (ils peuvent evoluer independamment de ce depot) ; ajouter un fournisseur
  alternatif (fal.ai, Stability AI direct, ComfyUI auto-heberge) pour la
  resilience.
- **Silhouette** : passer d'un warp par mise a l'echelle horizontale a un
  vrai thin-plate-spline (opencv-contrib est deja disponible) et etendre
  la zone d'effet aux jambes avec un modele par membre, pour un rendu plus
  fin sur les photos non parfaitement de face.
- **Mobile** : ecrans coiffure/vetements/admin manquants (memes API,
  travail d'UI repetitif) ; partage reel de `@relook/types` via
  configuration Metro monorepo ; tests sur simulateur/appareil reel et
  build EAS.
- **Evaluation qualite automatisee** : le sujet demande une methode
  d'evaluation du realisme (visage, cheveux, vetements, coherence
  lumiere/ombres). Aujourd'hui la garantie est structurelle (masques,
  zones d'effet bornees, tests de non-regression sur les pixels hors
  masque) ; un score automatique (ex: similarite de visage avant/apres via
  un modele d'embedding facial, pour detecter une derive d'identite) serait
  la prochaine etape.
- **Modele economique** : le schema de donnees et l'architecture des jobs
  permettent d'ajouter facilement un compteur de credits/quotas par
  utilisateur (champ sur `User` + verification dans
  `simulations.service.ts`) ; non implemente dans cette version.
- **Accessibilite et i18n** : labels ARIA de base en place ; pas encore de
  passage WCAG complet ni de traduction (l'app est en francais uniquement).
- **Authentification** : email + mot de passe uniquement pour l'instant.
  Les variables `GOOGLE_OAUTH_*`/`APPLE_OAUTH_*` sont reservees dans
  `.env.example` mais aucune strategie OAuth n'est encore implementee.

## 9. Prochaines etapes vers un produit commercial

1. Configurer `REPLICATE_API_TOKEN` (ou un fournisseur equivalent) et
   valider en conditions reelles le rendu des modules coiffure/vetements.
2. Etoffer le catalogue (photos de reference reelles, plus de styles) et
   faire remplir les champs `trend` par une equipe contenu avec sources
   verifiables.
3. Completer l'app mobile (parite fonctionnelle) et passer en revue
   App Store / Play Store (permissions, confidentialite).
4. Mettre en place facturation/abonnement (Stripe) au-dessus du modele de
   quotas.
5. Audit de securite externe et tests de charge avant ouverture publique.
