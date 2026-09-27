# Mise en ligne gratuite (Oracle Cloud « Always Free »)

Objectif : une adresse `https://…` accessible depuis n'importe quel poste, sans frais.
Compter une heure la première fois.

> **À lire avant de commencer.** Cette mise en ligne convient à une **démonstration ou à un
> pilote avec des données fictives**. Pour de vraies données d'agents, l'hébergement doit être
> validé par le DPO et le RSSI de l'administration : un cloud américain, même en région
> européenne, n'est en général pas conforme à la politique d'hébergement de l'État (doctrine
> « cloud au centre », qualification SecNumCloud).

## 1. Créer le serveur (console Oracle)

1. Créer un compte sur <https://www.oracle.com/cloud/free/>. Une carte bancaire est demandée
   pour vérifier l'identité ; rien n'est prélevé tant qu'on reste dans l'offre « Always Free ».
   Choisir une **région européenne** (Paris, Marseille, Francfort…) : elle ne pourra plus être
   changée.
2. Menu ☰ → **Compute → Instances → Create instance** :
   - **Image** : Canonical **Ubuntu 24.04** (ou 22.04) ;
   - **Shape** : onglet *Ampere* → **VM.Standard.A1.Flex**, 2 OCPU et 12 Go. Si la capacité
     manque, prendre **VM.Standard.E2.1.Micro** (AMD, 1 Go : le script ajoute la mémoire
     d'échange nécessaire) ;
   - **SSH keys** : *Generate a key pair for me*, puis **télécharger la clé privée**, proposée
     une seule fois ;
   - **Create**, puis noter l'**adresse IP publique** de l'instance.
3. Ouvrir les ports web dans le réseau Oracle. Depuis la page de l'instance : lien du
   **Virtual cloud network** → **Security Lists** → *Default Security List* → **Add Ingress
   Rules**, deux fois :
   - Source CIDR `0.0.0.0/0`, protocole TCP, port de destination `80` ;
   - Source CIDR `0.0.0.0/0`, protocole TCP, port de destination `443`.

## 2. Obtenir une adresse gratuite (DuckDNS)

Sur <https://www.duckdns.org>, se connecter (compte Google ou GitHub), choisir un
sous-domaine (ex. `mobilite-carriere`), saisir l'**IP publique** de la VM dans *current ip*,
puis **update ip**. L'adresse sera `mobilite-carriere.duckdns.org`.

## 3. Se connecter au serveur depuis Windows

Dans PowerShell, en adaptant le chemin de la clé et l'IP :

```powershell
ssh -i "$env:USERPROFILE\Downloads\ssh-key.key" ubuntu@IP_PUBLIQUE
```

Si SSH refuse la clé (« UNPROTECTED PRIVATE KEY FILE »), restreindre ses droits puis réessayer :

```powershell
icacls "$env:USERPROFILE\Downloads\ssh-key.key" /inheritance:r /grant:r "$($env:USERNAME):R"
```

## 4. Installer l'application (sur le serveur)

```bash
git clone -b claude/vigilant-edison-70mvm5 https://github.com/0xKilua/task7.git
cd task7/mobilite-carriere-app
sudo bash installer-serveur.sh mobilite-carriere.duckdns.org
```

Si le dépôt GitHub est privé, `git clone` demande un identifiant : utiliser son nom
d'utilisateur GitHub et, comme mot de passe, un jeton personnel (GitHub → Settings → Developer
settings → Personal access tokens, droit de lecture sur ce dépôt).

Le script installe Docker, ouvre les ports du pare-feu du serveur, configure le HTTPS
(certificat Let's Encrypt obtenu et renouvelé automatiquement), puis construit et démarre
l'application. Comptez 5 à 15 minutes. **À la fin, il affiche un jeton d'installation : le
noter.**

## 5. Première connexion

Ouvrir `https://mobilite-carriere.duckdns.org` : la page d'installation demande le **jeton**
affiché par le script, puis crée le compte administrateur. Sans ce jeton, personne d'autre ne
peut s'approprier l'application entre sa mise en ligne et votre première connexion.

Ensuite : créer les comptes conseillers depuis **Administration**, fixer la politique de
conservation des données avec le DPO (**Administration → Données et conservation**) et ingérer
le guide DGAFP (**Base documentaire**).

## 6. Au quotidien

| Besoin | Commande (sur le serveur, dans `task7/mobilite-carriere-app`) |
|---|---|
| Mettre à jour | `git pull && sudo bash installer-serveur.sh mobilite-carriere.duckdns.org` |
| Sauvegarder la base | `sudo docker compose exec app npm run sauvegarder` |
| Récupérer les sauvegardes | `sudo docker compose cp app:/app/data/sauvegardes ./sauvegardes` |
| Mot de passe administrateur perdu | `sudo docker compose exec app npm run comptes:lister`, puis `comptes:reinitialiser` |
| Voir les journaux | `sudo docker compose logs --tail 100 app` |

Pour une sauvegarde chaque nuit, ajouter cette ligne avec `sudo crontab -e` :

```cron
0 3 * * * cd /home/ubuntu/task7/mobilite-carriere-app && docker compose exec -T app npm run sauvegarder
```

## Limites à connaître

- **Oracle peut récupérer une VM gratuite inactive** : selon ses conditions, une instance
  « Always Free » qui reste très peu sollicitée pendant 7 jours peut être arrêtée et
  récupérée (conditions à vérifier sur le site d'Oracle). Copier régulièrement les
  sauvegardes hors du serveur. Passer le compte en « Pay As You Go » lève cette règle, sans
  frais tant qu'on reste dans les limites gratuites.
- **Un seul serveur** : pas de redondance. Si la VM disparaît, seules les sauvegardes copiées
  ailleurs permettent de restaurer.
- **Adresse DuckDNS** : service gratuit de particuliers, sans engagement de disponibilité.
  Pour un usage durable, un nom de domaine de l'administration est préférable.
