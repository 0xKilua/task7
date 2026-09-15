# Base documentaire locale

Ce dossier reçoit les **documents sources officiels** à partir desquels l'application construit ses réponses.
Il est **vide par défaut** : tant qu'aucun document n'est ingéré, l'assistant et la recherche
répondent systématiquement par le message institutionnel prévu, sans produire d'information non sourcée.

## Ajouter le guide DGAFP

1. Déposer le fichier dans ce dossier, par exemple :
   `data/documents/GuideMobPro_2026.pdf`
2. Lancer l'ingestion :
   ```bash
   npm run ingest -- --fichier data/documents/GuideMobPro_2026.pdf \
     --titre "Guide de la mobilité professionnelle 2026" \
     --source "DGAFP" \
     --url "https://www.fonction-publique.gouv.fr/files/files/publications/publications-dgafp/GuideMobPro_2026.pdf" \
     --date "2026" \
     --statut officiel
   ```
3. L'ingestion extrait le texte, le découpe en passages, les indexe et enregistre les métadonnées
   (source, date de publication, date d'ingestion) utilisées pour citer les sources.
4. Vérifier : la page « Base documentaire » doit afficher le document et son nombre de passages,
   et une recherche sur un terme du guide doit renvoyer des passages cités avec leur section et
   leur page.

Formats acceptés : `.pdf`, `.md`, `.txt`.

Pour un PDF, les titres de section sont détectés à partir de la taille de police (une ligne
composée plus grand que le corps de texte est traitée comme un titre) et le numéro de page est
conservé pour la citation.

## Mise à jour d'un document

Relancer la même commande avec le même `--titre` : l'ancien document et ses passages sont remplacés,
la date d'ingestion est actualisée.

## Rappel

Les documents déposés ici ne sont pas versionnés dans git (voir `.gitignore`) : ils peuvent être
volumineux et leur diffusion relève de leur éditeur.
