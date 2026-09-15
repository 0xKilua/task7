# Démarrage sur Windows

Procédure complète, de zéro jusqu'au guide DGAFP ingéré. Comptez 10 à 15 minutes la première fois.

## 1. Installer Node.js

1. Télécharger la version **LTS** sur <https://nodejs.org> (Node 20 ou 22 — évitez la version « Current »).
2. Lancer l'installateur, **cocher la case « Tools for Native Modules »** quand elle est proposée.
   Cette case installe les outils de compilation C++ dont a besoin la base de données locale
   (`better-sqlite3`). Sans elle, l'installation des dépendances peut échouer.
3. Vérifier dans PowerShell :
   ```powershell
   node --version
   npm --version
   ```

## 2. Récupérer le projet

**Option A — avec Git** (si Git est installé) :
```powershell
cd $HOME\Documents
git clone -b claude/vigilant-edison-70mvm5 https://github.com/0xKilua/task7.git
cd task7\mobilite-carriere-app
```

**Option B — sans Git, en ZIP** :
1. Ouvrir <https://github.com/0xKilua/task7/tree/claude/vigilant-edison-70mvm5>
2. Bouton vert **Code** → **Download ZIP**
3. Clic droit sur le ZIP → **Extraire tout…** (par exemple vers `Documents`)
4. Dans PowerShell, se placer dans le dossier extrait :
   ```powershell
   cd $HOME\Documents\task7-claude-vigilant-edison-70mvm5\mobilite-carriere-app
   ```

## 3. Lancer l'application

**Le plus simple** — **double-cliquer sur `demarrer.bat`** dans l'explorateur de fichiers. Il
vérifie Node, installe les dépendances si besoin et démarre le serveur. Un `.bat` n'est pas soumis
à la politique d'exécution de PowerShell : ce chemin passe toujours.

**Depuis PowerShell** :
```powershell
.\demarrer.ps1
```

Si Windows bloque (« l'exécution de scripts est désactivée sur ce système »), autoriser les scripts
pour cette fenêtre uniquement — rien n'est modifié durablement sur le poste :
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\demarrer.ps1
```

**Ou manuellement** :
```powershell
npm install
npm run dev
```

Quand `Ready` s'affiche, ouvrir <http://localhost:3000>. Pour arrêter : `Ctrl+C`.

## 4. Ajouter le guide DGAFP

1. Télécharger le PDF :
   <https://www.fonction-publique.gouv.fr/files/files/publications/publications-dgafp/GuideMobPro_2026.pdf>
2. Dans l'application, aller sur **Base documentaire**.
3. Bloc « Ingérer un document officiel » : sélectionner le PDF, puis renseigner
   - Titre : `Guide de la mobilité professionnelle 2026`
   - Source : `DGAFP`
   - Date de publication : `2026`
   - URL : l'adresse ci-dessus
   - Statut : `Document officiel`
4. Cliquer sur **Ingérer le document**. Le document apparaît dans la liste avec son nombre de
   passages indexés.

**Variante en ligne de commande** — placer le PDF dans `data\documents\`, puis :
```powershell
npm run ingest -- --fichier data\documents\GuideMobPro_2026.pdf --titre "Guide de la mobilité professionnelle 2026" --source "DGAFP" --url "https://www.fonction-publique.gouv.fr/files/files/publications/publications-dgafp/GuideMobPro_2026.pdf" --date "2026" --statut officiel
```

## 5. Vérifier que tout fonctionne

- Le bandeau orange « Base documentaire vide » a disparu du tableau de bord.
- Sur **Recherche documentaire**, un terme du guide renvoie des passages cités avec leur section et
  leur numéro de page.
- Sur **Assistant**, une question renvoie une analyse appuyée sur des extraits sourcés.

## Problèmes courants

| Symptôme | Cause | Solution |
|---|---|---|
| `npm install` échoue sur `better-sqlite3` / `node-gyp` | Outils de compilation C++ absents | Relancer l'installateur Node.js en cochant « Tools for Native Modules », ou installer Visual Studio Build Tools (charge de travail « Desktop development with C++ »), puis `npm install` à nouveau |
| « l'exécution de scripts est désactivée sur ce système » | Politique d'exécution PowerShell | Double-cliquer sur `demarrer.bat`, ou lancer `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` dans la **même** fenêtre avant de relancer le script |
| Le même message apparaît sur `npm` (`npm.ps1`) | Même cause : PowerShell retient le script `.ps1` de npm | Utiliser l'Invite de commandes (`cmd`) plutôt que PowerShell, ou appliquer la commande ci-dessus |
| `Port 3000 is already in use` | Un autre programme occupe le port | `npm run dev -- -p 3001` puis ouvrir <http://localhost:3001> |
| `node : terme non reconnu` | Node absent du PATH | Fermer et rouvrir PowerShell après l'installation de Node |
| Le PDF est ingéré mais aucune recherche ne renvoie de résultat | PDF scanné, sans couche texte | Le fichier ne contient que des images : il faut d'abord le passer à l'OCR |
| Accents mal affichés dans la console | Encodage PowerShell | Sans conséquence sur l'application, qui s'affiche dans le navigateur |

## Où sont mes données ?

Tout reste sur votre machine : la base `data\app.db` (accompagnements, diagnostics, bilans, plans)
et les documents déposés dans `data\documents\`. Aucune donnée n'est envoyée à un service externe —
l'application ne fait aucun appel réseau sortant. Ces deux emplacements ne sont pas versionnés dans
Git. Pour repartir de zéro, fermer l'application et supprimer `data\app.db`.
