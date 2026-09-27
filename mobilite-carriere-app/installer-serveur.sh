#!/usr/bin/env bash
# Installe et démarre l'application sur un serveur Ubuntu neuf, en HTTPS.
# Prévu pour une VM Oracle Cloud « Always Free » ; fonctionne sur tout Ubuntu 22.04 ou 24.04.
#
# Usage, depuis le dossier mobilite-carriere-app du dépôt cloné sur le serveur :
#   sudo bash installer-serveur.sh mon-sous-domaine.duckdns.org
#
# Relancer le script après un « git pull » met l'application à jour ; les données
# (volume Docker « donnees ») et le jeton d'installation sont conservés.
set -euo pipefail

DOMAINE="${1:-}"
if [ -z "$DOMAINE" ]; then
  echo "Usage : sudo bash installer-serveur.sh mon-sous-domaine.duckdns.org"
  exit 1
fi
if [ "$(id -u)" -ne 0 ]; then
  echo "Ce script doit être lancé avec sudo."
  exit 1
fi
DOSSIER="$(cd "$(dirname "$0")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

echo "== 1/6 Docker"
if ! docker compose version >/dev/null 2>&1; then
  apt-get update -q
  apt-get install -y -q docker.io docker-compose-v2 \
    || { echo "Paquets Ubuntu indisponibles : installation par le script officiel de Docker."; curl -fsSL https://get.docker.com | sh; }
fi
systemctl enable --now docker

echo "== 2/6 Mémoire"
# La construction de l'application dépasse 1 Go de mémoire : sans fichier d'échange,
# elle échoue sur la VM gratuite AMD (1 Go).
if [ "$(awk '/MemTotal/ {print $2}' /proc/meminfo)" -lt 2000000 ] && ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Fichier d'échange de 2 Go créé."
fi

echo "== 3/6 Pare-feu du serveur (ports 80 et 443)"
# Les images Ubuntu d'Oracle bloquent tout sauf SSH. Les règles de la console Oracle
# (liste de sécurité du réseau) restent à ouvrir à la main : voir MISE-EN-LIGNE-GRATUITE.md.
for port in 80 443; do
  iptables -C INPUT -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 1 -p tcp --dport "$port" -m conntrack --ctstate NEW -j ACCEPT
done
if command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save >/dev/null
else
  apt-get install -y -q iptables-persistent >/dev/null && netfilter-persistent save >/dev/null
fi

echo "== 4/6 HTTPS pour $DOMAINE"
printf '%s {\n    reverse_proxy app:3000\n    encode gzip\n}\n' "$DOMAINE" > "$DOSSIER/Caddyfile"

echo "== 5/6 Jeton d'installation"
touch "$DOSSIER/.env"
chmod 600 "$DOSSIER/.env"
if ! grep -q '^MCC_JETON_INSTALLATION=' "$DOSSIER/.env"; then
  echo "MCC_JETON_INSTALLATION=$(openssl rand -hex 24)" >> "$DOSSIER/.env"
fi
JETON="$(grep '^MCC_JETON_INSTALLATION=' "$DOSSIER/.env" | cut -d= -f2)"

echo "== 6/6 Construction et démarrage (plusieurs minutes la première fois)"
cd "$DOSSIER"
docker compose up -d --build

cat <<FIN

Terminé. L'application démarre sur https://$DOMAINE
(le certificat HTTPS est obtenu automatiquement ; comptez une minute au premier accès).

Première connexion : la page d'installation demande ce jeton pour créer le compte
administrateur. Gardez-le pour vous.

    $JETON

FIN
