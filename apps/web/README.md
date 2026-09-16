# @relook/web

Frontend web (Next.js 14, App Router, TypeScript, Tailwind CSS). Mobile-first,
parcours principal en 6 etapes : import photo -> choix du module -> choix de
l'option -> generation -> comparaison avant/apres -> sauvegarde/export.

## Lancement local

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000 pnpm --filter @relook/web dev
```

L'app tourne sur http://localhost:3000. Necessite `@relook/api` (port 4000)
et `services/vision` (port 8100) demarres.

## Tests de bout en bout (Playwright)

```bash
pnpm --filter @relook/web exec playwright test
```

Ces tests pilotent un vrai navigateur Chromium contre l'application complete
(Next.js + API + worker + service de vision + PostgreSQL + Redis) : ils
couvrent l'inscription, l'upload d'une vraie photo, la generation d'une
simulation de couleur reelle avec comparaison avant/apres, la simulation de
silhouette, et la verification que les modules necessitant un fournisseur
IA non configure l'indiquent clairement plutot que de simuler un resultat.

## Pages principales

- `/` — import de photo (etape 1)
- `/studio/[photoId]` — choix du module et de l'option, generation, comparaison
- `/gallery` — historique des simulations et favoris
- `/account` — profil, poids de reference, suppression de compte (RGPD)
- `/admin/catalog` — gestion du catalogue (reserve aux administrateurs)
