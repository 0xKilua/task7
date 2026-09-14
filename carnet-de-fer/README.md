# Carnet de Fer

Programme de musculation débutant (haltères 5/10 kg, barre EZ 20 kg) avec journal
de séances et courbes de progression, en Next.js.

## Lancer en local

```bash
cd carnet-de-fer
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Build de production

```bash
npm run build
npm run start
```

## Structure

- `src/data/program.ts` — tout le contenu du programme (jours, exercices, vidéos, lexique)
- `src/lib/journalStore.ts` — stockage du journal (localStorage, par navigateur)
- `src/components/` — cartes d'exercice, formulaire de journal, graphique, navigation
- `src/app/` — une route par écran : `/` (accueil), `/jour/[day]`, `/journal`, `/progression`, `/lexique`

Le journal est stocké dans le `localStorage` du navigateur — il n'est donc pas
partagé entre appareils. Il n'y a pas de backend.
