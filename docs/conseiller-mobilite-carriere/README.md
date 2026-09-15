# Cahier des charges — Application d'aide à l'accompagnement mobilité-carrière

> Document de référence pour la conception et le développement de l'application.
> Destiné à être utilisé comme prompt/brief pour Claude Code (ou toute équipe de développement).
> **Statut : v1 — en attente de 3 précisions bloquantes pour la v2** (voir §13).

## Sommaire

1. [Mission](#1-mission)
2. [Rôle et finalité de l'application](#2-rôle-et-finalité-de-lapplication)
3. [Source de connaissance de référence](#3-source-de-connaissance-de-référence)
4. [Utilisateurs cibles](#4-utilisateurs-cibles)
5. [Fonctionnalités principales attendues](#5-fonctionnalités-principales-attendues)
6. [Interface utilisateur](#6-interface-utilisateur)
7. [Sécurité et confidentialité](#7-sécurité-et-confidentialité)
8. [Architecture technique](#8-architecture-technique)
9. [Approche RAG / base documentaire](#9-approche-rag--base-documentaire)
10. [Méthode de travail](#10-méthode-de-travail)
11. [Principes de comportement de l'IA](#11-principes-de-comportement-de-lia)
12. [Qualité attendue](#12-qualité-attendue)
13. [Livrables finaux](#13-livrables-finaux)
14. [Éléments à préciser avant la v2](#14-éléments-à-préciser-avant-la-v2)

---

## 1. Mission

Concevoir puis développer une application web destinée à accompagner les **conseillers mobilité-carrière** dans leur activité auprès des agents de la fonction publique de l'État.

**Principe cardinal :** l'application est un outil d'**aide à l'accompagnement**, jamais un outil qui se substitue au conseiller mobilité-carrière.

Profil requis pour la conduite du projet : architecture logicielle senior, développement full-stack, conception d'outils d'aide à la décision, avec une sensibilité aux enjeux de la fonction publique de l'État.

## 2. Rôle et finalité de l'application

Permettre à un conseiller mobilité-carrière de répondre plus rapidement et plus précisément aux demandes des agents portant notamment sur :

- les dispositifs de mobilité dans la fonction publique de l'État ;
- les différentes possibilités et dispositifs de mobilité professionnelle ;
- les dispositifs de formation professionnelle tout au long de la vie ;
- les bilans et diagnostics de parcours professionnel ;
- l'identification des compétences ;
- la construction d'un projet professionnel ;
- la préparation d'un entretien de carrière ;
- l'identification des dispositifs ou ressources pertinents pour accompagner un agent ;
- l'orientation vers les ressources et dispositifs officiels appropriés.

L'application doit être **pédagogique, fiable, neutre, accessible** et orientée vers l'accompagnement humain.

## 3. Source de connaissance de référence

La **Direction générale de l'administration et de la fonction publique (DGAFP)** constitue la source institutionnelle de référence. Ordre de priorité des sources :

1. les guides et documents officiels de la DGAFP fournis au projet ;
2. les ressources officielles publiées par la DGAFP ;
3. les textes et ressources institutionnelles nécessaires pour compléter les informations, lorsque cela est explicitement prévu.

### Règle impérative

> Ne jamais inventer un dispositif, une condition d'accès, une procédure, un droit, une durée, un montant ou une règle réglementaire.

Lorsqu'une information n'est pas présente ou suffisamment vérifiable dans les sources de référence, l'application doit répondre :

> « Information à vérifier auprès de la source institutionnelle compétente ou du conseiller mobilité-carrière. »

Exigences complémentaires :
- chaque réponse produite doit, lorsque cela est possible, **indiquer sa source** ;
- prévoir un système permettant de **mettre à jour facilement la base documentaire** lorsque de nouveaux guides DGAFP ou textes officiels sont publiés.

## 4. Utilisateurs cibles

**Utilisateur principal : le conseiller mobilité-carrière** de la fonction publique de l'État, qui reçoit de nombreuses demandes et doit pouvoir :

- comprendre rapidement la situation d'un agent ;
- identifier les dispositifs pertinents ;
- préparer un entretien ;
- disposer d'une synthèse fiable ;
- explorer différentes hypothèses ;
- retrouver rapidement les informations institutionnelles ;
- conserver une trace structurée des éléments utiles à l'accompagnement.

**Évolution future (non prioritaire pour le MVP) :** une expérience adaptable à un usage direct par les agents.

## 5. Fonctionnalités principales attendues

### A. Assistant conversationnel spécialisé

Assistant spécialisé « Conseiller mobilité-carrière » capable de répondre à des questions telles que :

- « Quelles possibilités de mobilité peuvent être envisagées dans ma situation ? »
- « Je souhaite changer de métier dans la fonction publique, quelles pistes explorer ? »
- « Quels dispositifs de formation pourraient correspondre à mon projet ? »
- « Comment préparer un bilan de parcours professionnel ? »
- « Quelles questions poser à un agent qui souhaite évoluer professionnellement ? »
- « Quels éléments faut-il analyser avant d'envisager une mobilité ? »

L'assistant doit raisonner à partir de la situation décrite, **poser des questions de clarification** lorsque nécessaire, et **proposer plusieurs pistes** plutôt qu'une réponse unique lorsqu'une situation peut relever de plusieurs dispositifs.

### B. Diagnostic de situation

Parcours guidé permettant au conseiller de renseigner notamment :

- situation professionnelle ;
- corps / grade / emploi, lorsque pertinent ;
- administration ou environnement professionnel ;
- ancienneté ;
- compétences ;
- expériences ;
- souhaits d'évolution ;
- contraintes exprimées ;
- motivations ;
- besoins de formation ;
- mobilité géographique éventuelle ;
- mobilité fonctionnelle éventuelle ;
- projet professionnel ;
- échéance ou horizon du projet.

→ Génération d'une **synthèse structurée** de la situation.

### C. Bilan de parcours professionnel

Module de conduite progressive d'un bilan explorant :

1. le parcours ;
2. les expériences significatives ;
3. les compétences ;
4. les réalisations ;
5. les motivations ;
6. les centres d'intérêt professionnels ;
7. les points d'appui ;
8. les difficultés ou freins ;
9. les souhaits d'évolution ;
10. les pistes professionnelles envisageables ;
11. les besoins éventuels de développement des compétences ;
12. les prochaines étapes.

→ Résultat : une **synthèse exploitable pour un entretien**, sans produire de diagnostic psychologique ou médical.

### D. Exploration des dispositifs

Base de dispositifs consultable et filtrable, couvrant notamment :

- la mobilité ;
- la formation professionnelle tout au long de la vie ;
- le développement des compétences ;
- l'accompagnement des parcours professionnels.

Pour chaque dispositif, afficher **si l'information est disponible** :

- nom du dispositif ;
- objectif ;
- public concerné ;
- conditions ou critères d'accès ;
- démarches ;
- acteurs compétents ;
- points de vigilance ;
- ressources officielles ;
- date ou niveau de fraîcheur de l'information ;
- source.

### E. Générateur de préparation d'entretien

Génération d'une trame d'entretien adaptée à la situation de l'agent, par exemple :

- entretien de première demande ;
- projet de mobilité ;
- évolution professionnelle ;
- besoin de formation ;
- reconversion ;
- bilan de parcours ;
- préparation d'un projet professionnel.

Les questions générées doivent être **ouvertes, professionnelles et non directives**.

### F. Plan d'accompagnement

À partir des informations saisies, proposition d'un plan comprenant :

- constats ;
- objectifs de l'agent ;
- pistes à explorer ;
- dispositifs potentiellement pertinents ;
- informations restant à vérifier ;
- actions à réaliser ;
- ressources à consulter ;
- échéances ;
- prochaines étapes.

Le conseiller doit pouvoir **modifier, compléter ou supprimer** les propositions générées.

## 6. Interface utilisateur

Interface **professionnelle, sobre et accessible**, privilégiant :

- la simplicité ;
- la lisibilité ;
- la rapidité d'accès à l'information ;
- la navigation intuitive ;
- la traçabilité des sources ;
- la distinction claire entre **information officielle** et **suggestion générée par l'IA**.

Tableau de bord donnant un accès rapide à :

- nouveaux accompagnements ;
- dossiers récents ;
- recherches ;
- bilans en cours ;
- ressources fréquemment utilisées ;
- dispositifs ;
- assistant IA.

## 7. Sécurité et confidentialité

Les informations concernant les agents peuvent être **sensibles**. Principe directeur : **minimisation des données** (ne collecter que ce qui est réellement nécessaire).

Architecture devant prévoir notamment :

- authentification ;
- gestion des droits ;
- séparation des données entre utilisateurs lorsque nécessaire ;
- chiffrement des données sensibles ;
- journalisation des actions importantes ;
- suppression / export des données ;
- gestion de la durée de conservation ;
- absence d'utilisation des données personnelles à des fins d'entraînement sans cadre explicite.

> Ne jamais présenter une recommandation générée par l'IA comme une décision administrative ou réglementaire.

## 8. Architecture technique

Avant de coder, la démarche attendue est :

1. analyser le besoin ;
2. identifier les fonctionnalités du MVP ;
3. proposer une architecture technique cohérente ;
4. identifier les dépendances ;
5. définir le modèle de données ;
6. définir l'architecture de la base documentaire ;
7. définir le fonctionnement du moteur de recherche documentaire / RAG si nécessaire ;
8. définir les mécanismes de citation des sources ;
9. définir les tests nécessaires.

Si aucune stack technique n'est imposée : choisir une stack **moderne, robuste, maintenable**, adaptée à une application web professionnelle, et **justifier brièvement les choix** avant l'implémentation.

## 9. Approche RAG / base documentaire

L'application doit privilégier une architecture répondant **à partir des documents institutionnels**. Prévoir, si pertinent :

- ingestion des documents ;
- extraction du texte ;
- découpage en passages ;
- indexation ;
- recherche sémantique et/ou hybride ;
- récupération des passages pertinents ;
- génération de réponse ;
- citation des sources ;
- mécanisme d'identification de la date de mise à jour du document.

La réponse de l'IA doit être **liée aux documents retrouvés**. Si aucune source suffisamment pertinente n'est retrouvée, l'application doit **le signaler clairement** au conseiller.

## 10. Méthode de travail

Voir la [roadmap détaillée](./ROADMAP.md), qui décline les 5 phases suivantes en tâches concrètes :

- **Phase 1 — Analyse** : besoin, utilisateurs, parcours, fonctionnalités, risques, données, sources documentaires.
- **Phase 2 — Conception** : architecture fonctionnelle et technique, modèle de données, parcours utilisateurs, architecture documentaire, stratégie RAG, sécurité, stratégie de tests.
- **Phase 3 — MVP** : tableau de bord, assistant mobilité-carrière, recherche documentaire, affichage des sources, fiche de situation agent, bilan de parcours, génération d'une synthèse, préparation d'entretien, plan d'accompagnement.
- **Phase 4 — Tests** : fonctionnalités, navigation, responsive, recherche documentaire, qualité des citations, cas sans information disponible, erreurs, sécurité, cohérence des réponses.
- **Phase 5 — Documentation** : installation, architecture, lancement, alimentation de la base documentaire, modification des fonctionnalités, tests, déploiement.

## 11. Principes de comportement de l'IA

L'assistant doit :

- être professionnel et pédagogique ;
- utiliser un vocabulaire compréhensible ;
- poser des questions lorsque des informations manquent ;
- distinguer faits, hypothèses et suggestions ;
- citer les sources ;
- éviter les réponses trop affirmatives lorsque le contexte est incomplet ;
- signaler les informations à vérifier ;
- ne jamais inventer une règle administrative ;
- ne jamais se substituer au conseiller ;
- ne jamais prendre une décision à la place de l'agent ou de l'administration.

**Trame de réponse pour une situation complexe :**

```
Situation → Analyse → Dispositifs/pistes possibles → Points à vérifier → Prochaines étapes → Sources
```

## 12. Qualité attendue

Le résultat doit être une **véritable application fonctionnelle**, non une simple maquette. Priorités :

- code propre ;
- architecture modulaire ;
- maintenabilité ;
- accessibilité ;
- sécurité ;
- tests ;
- documentation ;
- évolutivité.

Une fonctionnalité n'est terminée que lorsqu'elle a été **testée**. À chaque étape importante, vérifier que l'implémentation correspond au besoin initial.

## 13. Livrables finaux

1. l'application fonctionnelle ;
2. le code source structuré ;
3. le modèle de données ;
4. la base documentaire ou son mécanisme d'alimentation ;
5. les tests ;
6. la documentation technique ;
7. la documentation utilisateur ;
8. les instructions d'installation et de déploiement ;
9. une présentation synthétique de l'architecture ;
10. une liste des évolutions recommandées après le MVP.

## 14. Éléments à préciser avant la v2

Trois éléments manquent aujourd'hui pour rendre ce brief pleinement opérationnel. Tant qu'ils ne sont pas fournis, la Phase 2 (conception technique) ne peut être finalisée qu'avec des hypothèses par défaut, explicitement signalées comme telles — voir la Phase 0 de la [roadmap](./ROADMAP.md).

| # | Élément | Statut | Impact si non fourni |
|---|---|---|---|
| 1 | **Stack technique souhaitée** (ou mandat « laisse Claude choisir ») | ❌ à préciser | Une stack par défaut sera proposée et justifiée en Phase 2, à valider avant le début du MVP. |
| 2 | **Mode de déploiement envisagé** (cloud public, hébergement interne/État, air-gapped, etc.) | ❌ à préciser | Impacte le choix d'hébergement, la stratégie de sécurité/RGPD et les options d'IA (API externe vs modèle auto-hébergé). |
| 3 | **Guide(s) DGAFP de référence** (documents source pour la base documentaire et le RAG) | ❌ à fournir | Sans ces documents, la base documentaire ne peut pas être alimentée avec du contenu réellement vérifié ; le MVP devra utiliser des données d'exemple clairement marquées comme fictives/non officielles en attendant. |

> **Rappel de la règle impérative (§3) :** en l'absence du guide DGAFP, aucune information réglementaire (dispositif, condition d'accès, durée, montant, procédure) ne doit être inventée ou déduite par défaut. Tant que la base documentaire officielle n'est pas alimentée, l'application doit répondre systématiquement par le message type prévu au §3 plutôt que de produire une réponse non sourcée.
