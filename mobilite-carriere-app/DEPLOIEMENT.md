# Déploiement en production

> **Préalable non technique** : avant toute mise en ligne accessible au-delà de ton poste,
> ce projet doit passer par le DPO et le RSSI de l'administration concernée (inscription au
> registre des traitements, choix d'un hébergement conforme à leur politique). Ce document
> prépare le déploiement technique ; il ne remplace pas cette validation.

## Ce qui est vérifié, et ce qui ne l'est pas

| Élément | Statut |
|---|---|
| Build de production (`npm run build`) | ✅ vérifié dans cette session |
| Compilation du module natif `better-sqlite3` sur Debian/Node 20-22 | ✅ vérifié (installation réussie dans cet environnement) |
| Script de sauvegarde (`npm run sauvegarder`) | ✅ vérifié : sauvegarde à chaud produite et restaurée avec succès |
| **`docker build` de l'image ci-dessous** | ❌ **non vérifié** — Docker Hub est bloqué par la politique réseau de l'environnement où ce projet a été développé. Le Dockerfile suit le schéma standard documenté pour `better-sqlite3` (étape de compilation séparée, image finale sans outils de build), mais n'a pas pu être construit ni lancé ici. **À construire et tester avant tout déploiement réel :** `docker build -t mobilite-carriere-app .` puis `docker run --rm -p 3000:3000 -v donnees:/app/data mobilite-carriere-app` et vérifier que la page d'installation s'affiche sur `http://localhost:3000`. |

## 1. Construire l'image

```bash
docker build -t mobilite-carriere-app .
```

L'image compile `better-sqlite3` dans une étape jetable (outils de compilation non conservés
dans l'image finale) puis construit l'application. Le résultat tourne sous un utilisateur non
root et attend ses données dans `/app/data`.

## 2. Lancer avec reverse proxy HTTPS (exemple autonome)

Si l'hébergement ne fournit pas déjà de reverse proxy, `docker-compose.yml` en propose un
avec Caddy, qui obtient et renouvelle automatiquement un certificat Let's Encrypt.

```bash
cp Caddyfile.example Caddyfile
# éditer Caddyfile : remplacer le nom de domaine par le vrai
docker compose up -d
```

Prérequis pour que la validation Let's Encrypt aboutisse : le domaine doit pointer vers ce
serveur, et le port 443 doit être joignable depuis Internet (ou depuis le réseau interne, pour
une autorité de certification interne à l'administration — dans ce cas, remplacer Caddy par le
reverse proxy déjà en place, voir ci-dessous).

## 3. Lancer derrière un reverse proxy déjà existant

C'est le cas le plus probable pour un hébergement interne à une administration (reverse proxy
ou load balancer déjà géré par l'équipe infrastructure, avec ses propres certificats).

Ne démarrer que le service `app`, publié en interne :

```bash
docker run -d \
  --name mobilite-carriere-app \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v mcc-donnees:/app/data \
  mobilite-carriere-app
```

Configurer le reverse proxy existant pour terminer le HTTPS et relayer vers
`http://127.0.0.1:3000`. **Le cookie de session n'est marqué `Secure` qu'en production** (voir
`src/app/auth-actions.ts`, `NODE_ENV=production` — déjà positionné dans le Dockerfile) : sans
HTTPS en frontal, le cookie circulerait en clair et l'authentification serait comprise comme
inopérante par les navigateurs modernes qui appliquent HSTS. Ne jamais exposer le port 3000
directement sur Internet sans TLS devant.

## 4. Première connexion

Ouvrir l'URL publique : la page `/installation` s'affiche tant qu'aucun compte n'existe, et
demande de créer le compte administrateur. Ensuite, créer les comptes conseillers depuis
`/administration`.

## 5. Sauvegardes

```bash
docker exec mobilite-carriere-app npm run sauvegarder
```

Écrit une copie cohérente de la base dans `data/sauvegardes/`, horodatée, et purge
automatiquement celles de plus de 30 jours (réglable via `MCC_BACKUP_RETENTION_JOURS`). La
sauvegarde se fait à chaud (l'application peut continuer de tourner pendant l'opération).

Planifier son exécution régulière, par exemple via une tâche cron sur l'hôte :

```cron
0 3 * * * docker exec mobilite-carriere-app npm run sauvegarder >> /var/log/mcc-sauvegarde.log 2>&1
```

**Sortir également ces sauvegardes du volume Docker vers un stockage distinct** (autre
machine, stockage réseau de l'administration) : une sauvegarde qui reste sur le même disque que
la base ne protège pas d'une panne matérielle.

Pour restaurer : arrêter le conteneur, remplacer `data/app.db` par le fichier de sauvegarde
choisi, relancer.

## 6. Mettre à jour l'application

```bash
git pull
docker build -t mobilite-carriere-app .
docker compose up -d   # ou docker run ... comme à l'étape 3
```

Le schéma de base est migré automatiquement au démarrage (voir les fonctions `migrer*` dans
`src/lib/db.ts`) : les données existantes sont conservées. **Sauvegarder avant toute mise à
jour** (étape 5) : la migration modifie le schéma en place et n'est pas conçue pour être
réversible.

## 7. Ce que ce déploiement ne couvre pas

- **Journalisation centralisée** : `docker logs mobilite-carriere-app` donne les journaux
  applicatifs ; les relier à un système de supervision relève de l'infrastructure d'accueil.
- **Sauvegarde automatique hors machine** : le cron ci-dessus écrit localement, son transfert
  vers un stockage distinct est à mettre en place.
- **Haute disponibilité** : SQLite suppose un seul processus écrivain. Cette application est
  dimensionnée pour quelques dizaines de conseillers sur une seule instance, pas pour un
  déploiement multi-instances.
- **Rotation des secrets** : il n'y a pas de secret applicatif à gérer (les jetons de session
  sont générés aléatoirement et stockés hachés, sans clé de signature) — rien à roter de ce
  côté. Le seul secret réel est le mot de passe de chaque compte, gérable depuis
  `/administration`.
