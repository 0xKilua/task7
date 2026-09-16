# @relook/mobile

Application mobile (Expo / React Native, TypeScript) pour iOS et Android.

## Perimetre de cette version

C'est un **squelette fonctionnel**, pas encore a parite complete avec le
web : il demontre l'architecture (navigation, auth, upload photo, appel
au meme backend, polling de simulation) sur les deux modules qui
fonctionnent entierement sans cle API externe (**couleur** et
**silhouette**). Les ecrans coiffure/vetements/galerie enrichie/admin sont
a construire sur le meme modele (voir `src/screens`) — c'est un travail
d'UI repetitif, pas une limite d'architecture.

## Pourquoi npm ici et pnpm ailleurs

Le reste du monorepo utilise pnpm (workspaces + symlinks). Metro, le
bundler de React Native/Expo, gere mal les node_modules symlinkes par
pnpm sans configuration additionnelle complexe et fragile. Expo
recommande de garder les apps React Native dans leur propre
gestionnaire de paquets au sein d'un monorepo mixte. `apps/mobile` est
donc exclu du workspace pnpm (`pnpm-workspace.yaml`) et gere avec npm.

Consequence : `packages/types` n'est pas importe directement. Les types
necessaires a l'UI mobile sont dupliques (et documentes comme tels) dans
`src/lib/shared-types.ts`. Prochaine etape recommandee : configurer
Metro (`watchFolders` + `nodeModulesPaths`) pour resoudre `@relook/types`
depuis le workspace, ou publier ce paquet en interne.

## Lancement

```bash
cd apps/mobile
npm install
cp .env.example .env
npx expo start
```

Scanner le QR code avec l'app Expo Go (iOS/Android), ou lancer un
simulateur avec `npm run ios` / `npm run android`.

## Verification effectuee dans cet environnement

Cet environnement de developpement n'a ni simulateur iOS/Android ni
appareil physique connecte : l'app n'a donc **pas** pu etre testee en
conditions reelles ici. Ce qui a ete verifie :

- `npx tsc --noEmit` : aucune erreur de type.
- `npx expo export --platform android` : le bundle Metro se construit
  avec succes (836 modules), ce qui valide que toutes les dependances
  natives et JS se resolvent correctement.

A faire avant mise en production : tests sur simulateur/appareil reel,
tests End-to-End (Detox ou Maestro), gestion des permissions natives
(photothèque) sur les deux plateformes, build EAS.
