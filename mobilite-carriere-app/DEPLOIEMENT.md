# Déploiement en production

> **Préalable non technique** : avant toute mise en ligne accessible au-delà de ton poste,
> ce projet doit passer par le DPO et le RSSI de l'administration concernée (inscription au
> registre des traitements, choix d'un hébergement conforme à leur politique). Ce document
> prépare le déploiement technique ; il ne remplace pas cette validation.

## Ce qui est vérifié, et ce qui ne l'est pas

| Élément | Statut |
|---|---|
| **`docker build` de l'image** | ✅ vérifié : image construite, puis suite de bout en bout complète (52/52) contre le conteneur de production, sans erreur dans ses journaux |
| `docker compose` avec Caddy en HTTPS | ✅ vérifié en local (certificat interne de Caddy, redirection HTTP → HTTPS). L'obtention d'un certificat Let's Encrypt pour un vrai domaine n'a pas pu l'être : elle exige un serveur joignable depuis Internet |
| Commandes d'administration dans le conteneur (`sauvegarder`, `comptes:*`, `dispositifs:importer`) | ✅ vérifié |
| Build de production (`npm run build`) sous Node 24 | ✅ vérifié |
| Module `better-sqlite3` 13 (binaires précompilés Node-API, sans compilation) sous Node 22 et 24 | ✅ vérifié : suite de bout en bout 32/32 sur chacune |
| Script de sauvegarde (`npm run sauvegarder`) | ✅ vérifié : sauvegarde à chaud identique à la source, contrôle d'intégrité `ok` |

**Serveur neuf, exposé à Internet :** le script `installer-serveur.sh` fait tout (Docker, pare-feu,
HTTPS, jeton d'installation) — voir [MISE-EN-LIGNE-GRATUITE.md](./MISE-EN-LIGNE-GRATUITE.md).

## 1. Construire l'image

```bash
docker build -t mobilite-carriere-app .
```

L'image installe les dépendances (`better-sqlite3` fournit son binaire précompilé : aucun outil
de compilation n'est nécessaire) puis construit l'application. Le résultat tourne sous un utilisateur non
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

**Serveur joignable depuis Internet : définir un jeton d'installation.** Sans lui, le premier
visiteur arrivé sur `/installation` pourrait créer le compte administrateur. Mettre
`MCC_JETON_INSTALLATION=<valeur aléatoire>` dans le fichier `.env` à côté de
`docker-compose.yml` (`installer-serveur.sh` le fait) : la page exige alors ce jeton.

## 5. Sauvegardes

```bash
docker compose exec app npm run sauvegarder
```

Écrit une copie cohérente de la base dans `data/sauvegardes/`, horodatée, et purge
automatiquement celles de plus de 30 jours (réglable via `MCC_BACKUP_RETENTION_JOURS`). La
sauvegarde se fait à chaud (l'application peut continuer de tourner pendant l'opération).

Planifier son exécution régulière, par exemple via une tâche cron sur l'hôte :

```cron
0 3 * * * cd /chemin/vers/mobilite-carriere-app && docker compose exec -T app npm run sauvegarder >> /var/log/mcc-sauvegarde.log 2>&1
```

Les sauvegardes sont écrites dans le volume, sous `/app/data/sauvegardes`. Pour les copier sur
la machine hôte : `docker compose cp app:/app/data/sauvegardes ./sauvegardes`.

Autres commandes d'administration disponibles sur le serveur : `docker compose exec app npm run
comptes:lister` (et `comptes:reinitialiser`, `comptes:renommer`). Les textes officiels et le
catalogue de dispositifs livrés sont hors du volume de données (`/app/contenus`) : une nouvelle
image les applique d'elle-même au démarrage ; `dispositifs:importer` et `sources:importer` les
réappliquent à la demande.

**Sortir également ces sauvegardes du volume Docker vers un stockage distinct** (autre
machine, stockage réseau de l'administration) : une sauvegarde qui reste sur le même disque que
la base ne protège pas d'une panne matérielle.

Pour restaurer : arrêter le conteneur, remplacer `data/app.db` par le fichier de sauvegarde
choisi, relancer.

## 6. Mettre à jour l'application

```bash
git pull
docker compose up -d --build   # ou : sudo bash installer-serveur.sh <domaine>
```

Le schéma de base est migré automatiquement au démarrage (voir les fonctions `migrer*` dans
`src/lib/db.ts`) : les données existantes sont conservées. **Sauvegarder avant toute mise à
jour** (étape 5) : la migration modifie le schéma en place et n'est pas conçue pour être
réversible.

## 7. Ce que ce déploiement ne couvre pas

- **Journalisation centralisée** : `docker compose logs app` donne les journaux
  applicatifs ; les relier à un système de supervision relève de l'infrastructure d'accueil.
- **Sauvegarde automatique hors machine** : le cron ci-dessus écrit localement, son transfert
  vers un stockage distinct est à mettre en place.
- **Haute disponibilité** : SQLite suppose un seul processus écrivain. Cette application est
  dimensionnée pour quelques dizaines de conseillers sur une seule instance, pas pour un
  déploiement multi-instances.
- **Rotation des secrets** : il n'y a pas de secret applicatif à gérer (les jetons de session
  sont générés aléatoirement et stockés hachés, sans clé de signature) — rien à roter de ce
  côté. Les secrets réels sont le mot de passe de chaque compte, gérable depuis
  `/administration`, et le jeton d'installation, qui ne sert plus une fois le premier compte
  créé.
