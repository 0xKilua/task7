# Démarrage sur Windows

Procédure complète, de zéro jusqu'au guide DGAFP ingéré. Comptez 10 à 15 minutes la première fois.

## 1. Installer Node.js

1. Télécharger la version **LTS** sur <https://nodejs.org> (Node 22 ou 24 — évitez la version « Current »).
2. Lancer l'installateur avec les options par défaut. La case « Tools for Native Modules » n'est
   pas nécessaire : la base de données locale (`better-sqlite3`) est livrée précompilée.
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
vérifie Node, installe les dépendances si besoin, démarre le serveur dans sa propre fenêtre puis
**ouvre automatiquement le navigateur** sur <http://localhost:3000> dès qu'il est prêt. Un `.bat`
n'est pas soumis à la politique d'exécution de PowerShell : ce chemin passe toujours. Il corrige
aussi, en passant, le blocage « l'exécution de scripts est désactivée sur ce système » pour votre
compte Windows — de façon durable, plus seulement pour la fenêtre en cours — afin que les prochaines
commandes `npm` lancées directement depuis PowerShell fonctionnent aussi.

**Depuis PowerShell** :
```powershell
.\demarrer.ps1
```
Même comportement (ouverture automatique du navigateur, correction durable de la politique
d'exécution).

Si Windows bloque avant même de pouvoir lancer `demarrer.ps1` (« l'exécution de scripts est
désactivée sur ce système »), autoriser les scripts pour cette fenêtre le temps de ce premier
lancement — `demarrer.ps1` corrige ensuite le réglage durablement, ce contournement ne sera plus
nécessaire ensuite :
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

## 4 bis. Mettre à jour le catalogue de dispositifs

Si l'application tournait déjà avant cette version, récupérer les fiches pré-documentées depuis le
guide DGAFP (arrêter le serveur avec `Ctrl+C`, puis) :

```powershell
git pull
npm run dispositifs:importer
```

Les fiches déjà documentées dans l'installation ne sont pas écrasées.

## 4 ter. Ajouter les textes officiels livrés

Le Code du travail (formation professionnelle, version au 1er septembre 2026) est fourni avec
l'application. Pour l'ajouter à la base documentaire, serveur arrêté ou non :

```powershell
npm run sources:importer
```

Après une mise à jour de l'application, **ré-ingérer aussi le guide DGAFP** (même titre, via
**Base documentaire**) : la nouvelle ingestion répare les mots coupés par la mise en page du PDF.

## 5. Vérifier que tout fonctionne

- Le bandeau orange « Base documentaire vide » a disparu du tableau de bord.
- Sur **Recherche documentaire**, un terme du guide renvoie des passages cités avec leur section et
  leur numéro de page.
- Sur **Assistant**, une question renvoie une analyse appuyée sur des extraits sourcés.

## Problèmes courants

| Symptôme | Cause | Solution |
|---|---|---|
| Le site affiche `TypeError: Failed to fetch` | Le serveur s'est arrêté (fenêtre fermée, ou plantage) | Regarder la fenêtre du serveur : si elle affiche une erreur, la recopier ; sinon fermer toutes les fenêtres serveur et relancer `demarrer.bat` |
| La fenêtre du serveur s'arrête sur `Assertion failed: (env) != nullptr` | Ancienne version de `better-sqlite3` (11.x) sous Node 24 | Fermer les fenêtres serveur, `git pull`, puis relancer `demarrer.bat` : il installe la version 13, qui n'est pas concernée |
| `npm install` échoue avec `EPERM` | Une fenêtre serveur tourne encore et verrouille des fichiers | Fermer toutes les fenêtres serveur, puis relancer `demarrer.bat` |
| « l'exécution de scripts est désactivée sur ce système » (sur `npm`, `npm.ps1` ou `demarrer.ps1`) | Politique d'exécution PowerShell trop restrictive | Double-cliquer sur `demarrer.bat` (jamais concerné, et corrige la politique durablement au passage) ; ou une fois, dans la fenêtre bloquée : `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` (permanent, contrairement à `-Scope Process` qu'il faudrait répéter à chaque fenêtre) |
| `Port 3000 is already in use` | Un autre programme occupe le port | `npm run dev -- -p 3001` puis ouvrir <http://localhost:3001> |
| `node : terme non reconnu` | Node absent du PATH | Fermer et rouvrir PowerShell après l'installation de Node |
| Le PDF est ingéré mais aucune recherche ne renvoie de résultat | PDF scanné, sans couche texte | Le fichier ne contient que des images : il faut d'abord le passer à l'OCR |
| Accents mal affichés dans la console | Encodage PowerShell | Sans conséquence sur l'application, qui s'affiche dans le navigateur |

## Où sont mes données ?

Tout reste sur votre machine : la base `data\app.db` (accompagnements, diagnostics, bilans, plans)
et les documents déposés dans `data\documents\`. Aucune donnée n'est envoyée à un service externe —
l'application ne fait aucun appel réseau sortant. Ces deux emplacements ne sont pas versionnés dans
Git. Pour repartir de zéro, fermer l'application et supprimer `data\app.db`.
