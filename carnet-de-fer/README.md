# Carnet de Fer

Programme de musculation débutant (haltères 5/10 kg, barre EZ 20 kg) avec journal
de séances et courbes de progression, en Next.js.

## Lancer en local

**Windows** : double-clique sur `lancer-le-site.bat`. Il récupère la dernière
version, installe ce qu'il faut la première fois, démarre le serveur et ouvre
le navigateur. Garde la fenêtre noire ouverte pendant l'utilisation ; la fermer
arrête le site.

**En ligne de commande** (tous systèmes) :

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

## Déployer sur Vercel (gratuit)

Ce projet vit dans un sous-dossier (`carnet-de-fer/`) d'un dépôt qui contient
aussi d'autres projets, et le code est sur une branche qui n'est pas la
branche par défaut du dépôt — il faut donc régler deux options précises à
l'import, sinon le premier déploiement échoue en cherchant le projet à la
racine du dépôt sur la mauvaise branche.

1. Va sur [vercel.com/new](https://vercel.com/new) et connecte-toi avec ton
   compte GitHub.
2. Si demandé, installe/autorise l'app Vercel sur GitHub pour ton compte, en
   lui donnant accès au dépôt `0xKilua/task7` (ou à tous tes dépôts).
3. Clique **Import** sur `0xKilua/task7`.
4. Sur l'écran de configuration, avant de cliquer sur Deploy :
   - **Root Directory** → clique *Edit* → sélectionne `carnet-de-fer`
   - Le *Framework Preset* doit se détecter automatiquement sur **Next.js**
     (build/output par défaut, rien à changer)
5. Clique **Deploy**. Ce premier déploiement va probablement échouer ou
   déployer une mauvaise version, car par défaut Vercel prend la branche
   par défaut du dépôt (`master`), qui ne contient pas ce projet.
6. Une fois le projet créé, va dans **Settings → Git** de ce projet Vercel,
   et change **Production Branch** pour `claude/workout-program-new-dumbbells-r0xll8`.
7. Va dans l'onglet **Deployments**, ouvre le menu `···` du dernier
   déploiement et choisis **Redeploy** (ou repousse un commit sur cette
   branche) — cette fois ça doit build et donner une vraie URL du style
   `carnet-de-fer.vercel.app`.

Une fois en place, chaque nouveau `git push` sur cette branche redéploie
automatiquement.

## Structure

- `src/data/program.ts` — tout le contenu du programme (jours, exercices, vidéos, lexique)
- `src/lib/journalStore.ts` — stockage du journal (localStorage, par navigateur)
- `src/components/` — cartes d'exercice, formulaire de journal, graphique, navigation
- `src/app/` — une route par écran : `/` (accueil), `/jour/[day]`, `/journal`, `/progression`, `/lexique`

Le journal est stocké dans le `localStorage` du navigateur — il n'est donc pas
partagé entre appareils. Il n'y a pas de backend.
