export const MESSAGE_A_VERIFIER =
  "Information à vérifier auprès de la source institutionnelle compétente ou du conseiller mobilité-carrière.";

export type StatutDocument = 'officiel' | 'a_verifier';

export interface DocumentSource {
  id: string;
  titre: string;
  source: string;
  url: string | null;
  datePublication: string | null;
  dateIngestion: string;
  statut: StatutDocument;
  fichier: string | null;
  nbPassages: number;
}

export interface Passage {
  id: number;
  documentId: string;
  ordre: number;
  titreSection: string | null;
  contenu: string;
  page: number | null;
}

export interface Citation {
  passageId: number;
  documentId: string;
  documentTitre: string;
  source: string;
  url: string | null;
  datePublication: string | null;
  statut: StatutDocument;
  titreSection: string | null;
  page: number | null;
  extrait: string;
  score: number;
}

export type StatutVerification = 'verifie_source' | 'non_verifie';

export interface Dispositif {
  id: string;
  nom: string;
  categorie: string;
  objectif: string | null;
  publicConcerne: string | null;
  conditions: string | null;
  demarches: string | null;
  acteurs: string | null;
  pointsVigilance: string | null;
  ressources: string | null;
  dateInformation: string | null;
  source: string | null;
  statutVerification: StatutVerification;
}

export interface Dossier {
  id: string;
  reference: string;
  intitule: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Diagnostic {
  id: string;
  dossierId: string;
  payload: Record<string, string>;
  synthese: string;
  createdAt: string;
}

export interface Bilan {
  id: string;
  dossierId: string;
  payload: Record<string, string>;
  synthese: string;
  createdAt: string;
}

export interface Entretien {
  id: string;
  dossierId: string | null;
  type: string;
  trame: TrameEntretien;
  createdAt: string;
}

export interface TrameEntretien {
  intitule: string;
  objectif: string;
  etapes: { titre: string; questions: string[] }[];
  rappels: string[];
}

export interface PlanAccompagnement {
  id: string;
  dossierId: string;
  constats: string[];
  objectifs: string[];
  pistes: string[];
  dispositifs: string[];
  aVerifier: string[];
  actions: string[];
  ressources: string[];
  echeances: string[];
  prochainesEtapes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReponseAssistant {
  aSource: boolean;
  message: string | null;
  situation: string;
  analyse: { texte: string; citation: Citation }[];
  pistes: Dispositif[];
  questionsClarification: string[];
  aVerifier: string[];
  prochainesEtapes: string[];
  citations: Citation[];
}
