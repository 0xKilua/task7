# Roadmap détaillée — Application d'aide à l'accompagnement mobilité-carrière

> Compagnon du [cahier des charges](./README.md). Ce document découpe la mission en phases,
> lots de travail et tâches actionnables, avec livrables, dépendances et points de vigilance.
> Les durées indiquées sont **indicatives** (base : 1 développeur senior + assistance Claude Code,
> à ajuster selon la taille réelle de l'équipe et la disponibilité des sources DGAFP).

## Légende

- ⛔ Bloquant — ne peut pas être finalisé sans une décision/donnée externe
- 🟡 À faire avec hypothèse par défaut si non fourni
- ✅ Peut démarrer immédiatement

---

## État d'avancement

Un **prototype local exécutable** est disponible dans [`mobilite-carriere-app/`](../../mobilite-carriere-app/README.md)
(`npm install && npm run dev` → <http://localhost:3000>). Il couvre les 9 blocs du MVP au niveau
« visualisable et testable », sur une stack proposée par défaut (Next.js + TypeScript + SQLite/FTS5
+ Tailwind) **restant à valider** en Phase 0.

| Lot Phase 3 | État | Réserve |
|---|---|---|
| Lot 0 — Socle technique | Partiel | Base et migrations en place ; **authentification et droits non implémentés** |
| Lot 1 — Base documentaire & RAG | Fait (lexical) | Ingestion PDF/MD/TXT, découpage, index FTS5, citations, cas « aucune source » ; recherche **sémantique à ajouter** |
| Lot 2 — Assistant | Fait (sans LLM) | Restitution ancrée sur les passages retrouvés, trame complète, questions de clarification |
| Lot 3 — Fiche de situation | Fait | 14 champs + synthèse structurée |
| Lot 4 — Bilan de parcours | Fait | 12 étapes + synthèse |
| Lot 5 — Dispositifs | Fait | Catalogue filtrable + fiche + édition sourcée ; **fiches non encore documentées** |
| Lot 6 — Préparation d'entretien | Fait | 7 types de trames, questions ouvertes |
| Lot 7 — Plan d'accompagnement | Fait | Génération + édition libre + persistance |
| Lot 8 — Tableau de bord | Fait | Indicateurs, dossiers, bilans, recherches, ressources |

Tests de bout en bout : 14 vérifications automatisées (`scripts/e2e.mjs`), toutes passantes.

**Reste prioritairement à faire** : ingérer le guide DGAFP (Phase 0 #3), implémenter
l'authentification et les droits (Lot 0), documenter les fiches dispositif depuis la source,
ajouter la recherche sémantique.

---

## Phase 0 — Cadrage préalable (bloquant) — 1 à 3 jours

Objectif : lever les ambiguïtés qui conditionnent les choix d'architecture avant que la Phase 2 ne s'engage réellement, pour éviter de reconstruire les fondations en cours de route.

| Décision | Statut | Action |
|---|---|---|
| Stack technique | ⛔ | Confirmer une stack imposée, ou mandat explicite « laisse Claude choisir » → dans ce cas, une proposition argumentée sera produite en Phase 2 (§ *Architecture technique*). |
| Mode de déploiement | ⛔ | Préciser : hébergement interne à l'administration / cloud public souverain (ex. offre qualifiée SecNumCloud) / cloud public standard / on-premise air-gapped. Conditionne le choix du fournisseur IA (API externe vs modèle auto-hébergé) et la stratégie RGPD. |
| Guide(s) DGAFP de référence | ⛔ | Obtenir le(s) document(s) source (PDF/HTML) à ingérer dans la base documentaire. Sans eux, le MVP tourne avec un **corpus d'exemple factice, explicitement marqué comme non officiel**, uniquement pour valider le pipeline RAG. |
| Autres sources institutionnelles complémentaires | 🟡 | Lister les textes réglementaires à intégrer en complément (décrets, circulaires) si prévu — sinon MVP limité au guide DGAFP fourni. |
| Volumétrie utilisateurs attendue | 🟡 | Hypothèse par défaut : usage interne, quelques dizaines à quelques centaines de conseillers. À confirmer pour dimensionner l'hébergement. |

**Livrable de phase :** note de cadrage actant les décisions (ou les hypothèses par défaut retenues faute de réponse), validée avant le lancement de la Phase 2.

---

## Phase 1 — Analyse (Discovery) — 3 à 5 jours ✅

Peut démarrer immédiatement, indépendamment de la Phase 0.

### 1.1 Analyse du besoin
- [ ] Reformuler les objectifs métier et les critères de succès du MVP
- [ ] Cartographier les irritants actuels d'un conseiller mobilité-carrière (sources dispersées, délai de réponse, hétérogénéité des dossiers)

### 1.2 Utilisateurs et parcours
- [ ] Rédiger 2-3 personas (conseiller débutant / conseiller expérimenté / éventuel profil "agent" pour l'évolution post-MVP)
- [ ] Cartographier les parcours principaux : diagnostic de situation → recherche de dispositifs → préparation d'entretien → plan d'accompagnement

### 1.3 Fonctionnalités
- [ ] Prioriser les 9 blocs fonctionnels du MVP (cahier des charges §5 et §10) en MoSCoW (Must/Should/Could/Won't pour le MVP)
- [ ] Identifier les fonctionnalités explicitement hors MVP (accès direct agent, analytics avancées, multi-administration, etc.)

### 1.4 Risques
- [ ] Lister les risques : hallucination réglementaire, obsolescence documentaire, sur-confiance du conseiller dans l'IA, fuite de données sensibles, dépendance à un fournisseur IA externe
- [ ] Définir une mitigation par risque (cf. §"Risques & points de vigilance" en fin de document)

### 1.5 Données
- [ ] Lister les données personnelles/sensibles manipulées (situation professionnelle de l'agent, compétences, souhaits) et leur finalité
- [ ] Vérifier les obligations RGPD applicables (base légale, DPIA à envisager compte tenu de la sensibilité)

### 1.6 Sources documentaires
- [ ] Inventorier les sources disponibles au lancement du projet (guide DGAFP si fourni en Phase 0, sinon corpus d'exemple)
- [ ] Définir le format d'ingestion (PDF, HTML, DOCX) et la fréquence de mise à jour attendue

**Livrable de phase :** document d'analyse (besoins, personas, parcours, priorisation MVP, cartographie des risques, cartographie des données et sources).

---

## Phase 2 — Conception — 5 à 8 jours

Démarre en parallèle de la Phase 1 pour les aspects génériques, mais **ne peut être figée** sur les points marqués ⛔ tant que la Phase 0 n'a pas produit de réponse ou d'hypothèse actée.

### 2.1 Architecture fonctionnelle ✅
- [ ] Diagramme des modules (Assistant conversationnel, Diagnostic, Bilan, Dispositifs, Générateur d'entretien, Plan d'accompagnement, Tableau de bord)
- [ ] Matrice fonctionnalités ↔ utilisateurs ↔ droits d'accès

### 2.2 Architecture technique 🟡
- [ ] Proposer une stack (frontend, backend, base de données, moteur de recherche/vecteurs, orchestration IA) avec justification brève de chaque choix
- [ ] Schéma d'architecture globale (front / API / services / base documentaire / fournisseur IA)
- [ ] Lister les dépendances externes (API LLM, service d'embeddings, etc.) et les alternatives en cas d'hébergement contraint (Phase 0)

### 2.3 Modèle de données ✅
- [ ] Entités principales : Conseiller, Agent (fiche de situation), Diagnostic, Bilan de parcours, Dispositif, Entretien, Plan d'accompagnement, Document source, Passage indexé, Source citée
- [ ] Relations et cycle de vie des données (création, mise à jour, suppression, durée de conservation — cf. §7 du cahier des charges)
- [ ] Schéma de données (ER diagram) + choix du type de stockage (relationnel pour les données structurées, vectoriel pour la base documentaire)

### 2.4 Architecture documentaire 🟡
- [ ] Définir le pipeline d'ingestion : dépôt du document → extraction → découpage → indexation → validation avant mise en production
- [ ] Définir les métadonnées obligatoires par document (source, date de publication, date d'ingestion, statut de validité)
- [ ] Concevoir le mécanisme de mise à jour incrémentale (remplacement d'un document sans casser les citations existantes)

### 2.5 Stratégie RAG ⛔ (dépend du guide DGAFP)
- [ ] Choix de la méthode de recherche (sémantique, hybride lexical+sémantique)
- [ ] Définir le format de citation des sources dans les réponses (document, section, date)
- [ ] Définir le comportement en cas d'absence de source pertinente (message type du §3)
- [ ] Prévoir des tests de non-régression sur un jeu de questions/réponses de référence (à construire une fois le guide DGAFP disponible)

### 2.6 Sécurité et confidentialité ✅
- [ ] Modèle d'authentification et de gestion des droits (rôles conseiller / administrateur)
- [ ] Politique de chiffrement (au repos et en transit) des données sensibles
- [ ] Politique de journalisation des actions importantes (consultation de dossier, génération de synthèse)
- [ ] Politique de conservation et de suppression/export des données
- [ ] Clause explicite : pas d'utilisation des données personnelles pour l'entraînement sans cadre défini

### 2.7 Stratégie de tests ✅
- [ ] Définir les niveaux de tests (unitaires, intégration, end-to-end, tests de qualité des réponses IA)
- [ ] Définir les cas de test critiques : absence de source, information à vérifier, injection de contenu malveillant dans un document ingéré, séparation des données entre utilisateurs

**Livrable de phase :** dossier de conception (architecture fonctionnelle + technique, modèle de données, architecture documentaire, stratégie RAG, sécurité, stratégie de tests), avec mention explicite des hypothèses retenues faute de réponse à la Phase 0.

---

## Phase 3 — MVP (développement) — 6 à 10 semaines (ordre de grandeur, à ajuster après Phase 2)

Découpage en lots fonctionnels, dans un ordre pensé pour dérisquer le plus tôt possible la brique RAG (cœur de la fiabilité de l'outil).

### Lot 0 — Socle technique
- [ ] Initialisation du projet (frontend + backend), CI de base, conventions de code
- [ ] Authentification et gestion des droits
- [ ] Mise en place de la base de données et des migrations

### Lot 1 — Base documentaire & RAG (priorité haute, dérisquage)
- [ ] Pipeline d'ingestion (upload document → extraction → découpage → indexation)
- [ ] Moteur de recherche documentaire (sémantique/hybride)
- [ ] Génération de réponse avec citation systématique des sources
- [ ] Gestion explicite du cas "aucune source pertinente trouvée"
- [ ] Interface d'administration de la base documentaire (ajout/mise à jour/retrait d'un document)

### Lot 2 — Assistant conversationnel mobilité-carrière
- [ ] Interface de conversation
- [ ] Raisonnement à partir de la situation décrite + questions de clarification
- [ ] Réponses multi-pistes quand plusieurs dispositifs sont pertinents
- [ ] Trame « Situation → Analyse → Dispositifs/pistes → Points à vérifier → Prochaines étapes → Sources » pour les cas complexes

### Lot 3 — Fiche de situation agent (diagnostic)
- [ ] Formulaire guidé (situation, corps/grade, ancienneté, compétences, souhaits, contraintes, etc.)
- [ ] Génération de la synthèse structurée

### Lot 4 — Bilan de parcours professionnel
- [ ] Parcours progressif en 12 étapes (cf. cahier des charges §5.C)
- [ ] Génération de la synthèse exploitable pour un entretien (sans diagnostic psychologique/médical)

### Lot 5 — Exploration des dispositifs
- [ ] Recherche et filtrage de la base de dispositifs
- [ ] Fiche dispositif complète (objectif, public, conditions, démarches, acteurs, points de vigilance, sources, fraîcheur)

### Lot 6 — Générateur de préparation d'entretien
- [ ] Sélection du type d'entretien
- [ ] Génération de trame de questions ouvertes et non directives

### Lot 7 — Plan d'accompagnement
- [ ] Génération du plan (constats, objectifs, pistes, dispositifs, points à vérifier, actions, ressources, échéances)
- [ ] Édition manuelle (modifier/compléter/supprimer) par le conseiller

### Lot 8 — Tableau de bord
- [ ] Vue d'ensemble : nouveaux accompagnements, dossiers récents, recherches, bilans en cours, ressources fréquentes, dispositifs, accès assistant IA

**Livrable de phase :** MVP fonctionnel intégrant les 9 blocs listés au §10 du cahier des charges, déployé sur un environnement de recette.

---

## Phase 4 — Tests — 1 à 2 semaines (en continu depuis la Phase 3)

- [ ] Tests fonctionnels par module (chaque lot de la Phase 3)
- [ ] Tests de navigation et parcours utilisateur de bout en bout
- [ ] Tests responsive design
- [ ] Tests de la recherche documentaire (pertinence, temps de réponse)
- [ ] Tests de qualité des citations (exactitude, lien vers la bonne source/version)
- [ ] Tests du cas "aucune information disponible" (doit toujours renvoyer le message type, jamais une réponse inventée)
- [ ] Tests de gestion d'erreurs (document corrompu, API IA indisponible, entrée utilisateur invalide)
- [ ] Tests de sécurité (contrôle d'accès, séparation des données entre conseillers, injection)
- [ ] Tests de cohérence des réponses (même question posée différemment → réponses cohérentes entre elles)

**Livrable de phase :** rapport de tests + suite de tests automatisés intégrée à la CI.

---

## Phase 5 — Documentation & livraison — 3 à 5 jours

- [ ] Documentation technique : installation, architecture, lancement local
- [ ] Guide d'alimentation de la base documentaire (comment ajouter/mettre à jour un guide DGAFP)
- [ ] Guide de modification des fonctionnalités (pour un autre développeur)
- [ ] Procédure de tests
- [ ] Procédure de déploiement
- [ ] Documentation utilisateur (conseiller mobilité-carrière)
- [ ] Présentation synthétique de l'architecture
- [ ] Liste des évolutions recommandées post-MVP (voir section suivante)

**Livrable de phase :** ensemble des 10 livrables finaux listés au §13 du cahier des charges.

---

## Vue d'ensemble des jalons

| Jalon | Contenu | Dépend de |
|---|---|---|
| M0 — Cadrage validé | Décisions/hypothèses actées (stack, déploiement, sources) | Phase 0 |
| M1 — Analyse validée | Besoins, personas, priorisation MVP actés | Phase 1 |
| M2 — Conception validée | Dossier de conception complet | Phase 2, M0 |
| M3 — RAG opérationnel | Pipeline d'ingestion + recherche + citation fonctionnels sur corpus (réel ou exemple) | Phase 3 / Lot 1 |
| M4 — MVP complet | 9 blocs fonctionnels livrés en recette | Phase 3 |
| M5 — MVP testé | Suite de tests passée, rapport de tests | Phase 4 |
| M6 — MVP documenté et livrable | Documentation complète, prêt pour déploiement | Phase 5 |

---

## Risques & points de vigilance

| Risque | Mitigation |
|---|---|
| Hallucination réglementaire (dispositif ou règle inventée) | Génération strictement ancrée sur les passages récupérés (RAG), message type systématique en l'absence de source, tests de non-régression dédiés |
| Base documentaire obsolète | Métadonnées de fraîcheur affichées, mécanisme de mise à jour incrémentale, alerte visuelle sur document ancien |
| Sur-confiance du conseiller dans les réponses IA | Distinction visuelle stricte information officielle / suggestion IA, rappel systématique que l'outil n'est pas décisionnaire |
| Données sensibles sur les agents | Minimisation des données, chiffrement, séparation stricte entre conseillers, politique de conservation définie dès la Phase 2 |
| Dépendance à un fournisseur IA externe non compatible avec le mode de déploiement retenu | Trancher le mode de déploiement dès la Phase 0 avant d'arrêter le choix du fournisseur IA |
| Absence du guide DGAFP au lancement du développement | Démarrage du Lot 1 sur corpus d'exemple explicitement non officiel, substitution dès réception du guide réel, sans changement d'architecture |

---

## Évolutions recommandées post-MVP (à affiner en fin de Phase 5)

- Accès direct pour les agents (évolution mentionnée comme non prioritaire au §4 du cahier des charges)
- Élargissement de la base documentaire à d'autres textes réglementaires/administrations
- Statistiques d'usage agrégées et anonymisées pour le pilotage du dispositif d'accompagnement
- Export/partage sécurisé du plan d'accompagnement avec l'agent
- Amélioration continue du RAG (feedback conseiller sur la pertinence des réponses)
- Internationalisation/accessibilité renforcée (RGAA) si diffusion élargie

---

## Prochaine étape immédiate

Fournir les 3 éléments listés en Phase 0 (stack, déploiement, guide DGAFP) — ou valider explicitement les hypothèses par défaut — afin de lancer la Phase 2 sans risque de refonte ultérieure.
