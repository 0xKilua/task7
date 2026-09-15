import { dispositifsPertinents } from './dispositifs';
import { baseDocumentaireVide, enregistrerRecherche, normaliser, rechercherPassages } from './search';
import { MESSAGE_A_VERIFIER, type ReponseAssistant } from './types';

const QUESTIONS_CLARIFICATION: { motsCles: string[]; question: string }[] = [
  { motsCles: ['corps', 'grade', 'categorie'], question: "Quel est le corps, le grade et la catégorie de l'agent ?" },
  { motsCles: ['anciennete', 'annees', 'depuis'], question: "Quelle est l'ancienneté de l'agent dans son poste actuel et dans la fonction publique ?" },
  { motsCles: ['geographique', 'region', 'mutation', 'demenagement'], question: 'Une mobilité géographique est-elle envisagée, souhaitée ou contrainte ?' },
  { motsCles: ['formation', 'competence', 'diplome'], question: "Quels besoins de formation ou de développement de compétences l'agent a-t-il exprimés ?" },
  { motsCles: ['echeance', 'delai', 'horizon', 'quand'], question: 'À quelle échéance le projet est-il envisagé ?' },
  { motsCles: ['contrainte', 'famille', 'sante'], question: "Quelles contraintes l'agent exprime-t-il (personnelles, organisationnelles, de calendrier) ?" },
  { motsCles: ['motivation', 'souhait', 'projet'], question: 'Quelles sont les motivations exprimées par l’agent pour ce projet d’évolution ?' },
  { motsCles: ['administration', 'ministere', 'employeur'], question: "Dans quelle administration ou quel environnement professionnel l'agent exerce-t-il ?" },
];

const PROCHAINES_ETAPES_TYPES = [
  "Reprendre avec l'agent les éléments de situation encore manquants avant d'explorer les dispositifs.",
  'Vérifier les conditions applicables auprès du service des ressources humaines compétent.',
  "Consulter les ressources officielles citées et en confirmer la date de mise à jour.",
  "Formaliser les pistes retenues dans un plan d'accompagnement partagé avec l'agent.",
];

function selectionnerQuestions(requete: string, limite = 4): string[] {
  const texte = normaliser(requete);
  const manquantes = QUESTIONS_CLARIFICATION.filter(
    (q) => !q.motsCles.some((mot) => texte.includes(mot)),
  );
  return manquantes.slice(0, limite).map((q) => q.question);
}

export function repondre(requete: string): ReponseAssistant {
  const citations = rechercherPassages(requete, 6);
  enregistrerRecherche(requete, citations.length);

  const pistes = dispositifsPertinents(requete);
  const questionsClarification = selectionnerQuestions(requete);

  const aVerifier: string[] = [];
  const nonDocumentes = pistes.filter((d) => d.statutVerification === 'non_verifie');
  if (nonDocumentes.length > 0) {
    aVerifier.push(
      `Les entrées suivantes du catalogue ne sont pas encore documentées à partir d'une source officielle : ${nonDocumentes
        .map((d) => d.nom)
        .join(', ')}. ${MESSAGE_A_VERIFIER}`,
    );
  }
  aVerifier.push(
    "Toute condition d'accès, durée, procédure ou règle applicable doit être confirmée auprès de la source institutionnelle compétente.",
  );

  if (citations.length === 0) {
    const raison = baseDocumentaireVide()
      ? "Aucun document source n'est encore ingéré dans la base documentaire."
      : "Aucun passage suffisamment pertinent n'a été trouvé dans les documents ingérés.";

    return {
      aSource: false,
      message: `${raison} ${MESSAGE_A_VERIFIER}`,
      situation: requete,
      analyse: [],
      pistes,
      questionsClarification,
      aVerifier,
      prochainesEtapes: PROCHAINES_ETAPES_TYPES,
      citations: [],
    };
  }

  return {
    aSource: true,
    message: null,
    situation: requete,
    analyse: citations.map((citation) => ({
      texte: citation.extrait,
      citation,
    })),
    pistes,
    questionsClarification,
    aVerifier,
    prochainesEtapes: PROCHAINES_ETAPES_TYPES,
    citations,
  };
}
