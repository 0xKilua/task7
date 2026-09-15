import { getDb, journaliser, nouvelId } from './db';
import type { Entretien, TrameEntretien } from './types';

export const TYPES_ENTRETIEN = [
  { cle: 'premiere_demande', libelle: 'Entretien de première demande' },
  { cle: 'projet_mobilite', libelle: 'Projet de mobilité' },
  { cle: 'evolution_professionnelle', libelle: 'Évolution professionnelle' },
  { cle: 'besoin_formation', libelle: 'Besoin de formation' },
  { cle: 'reconversion', libelle: 'Reconversion' },
  { cle: 'bilan_parcours', libelle: 'Bilan de parcours' },
  { cle: 'projet_professionnel', libelle: "Préparation d'un projet professionnel" },
] as const;

const RAPPELS_COMMUNS = [
  "Les questions sont ouvertes et non directives : elles servent à explorer, pas à orienter la décision de l'agent.",
  "Aucune condition réglementaire ne doit être affirmée en entretien sans vérification auprès de la source institutionnelle compétente.",
  "Les éléments recueillis relèvent de la seule finalité d'accompagnement : ne consigner que ce qui est nécessaire.",
];

const ETAPES_COMMUNES: { titre: string; questions: string[] }[] = [
  {
    titre: 'Accueil et cadrage',
    questions: [
      "Qu'est-ce qui vous amène à solliciter cet entretien aujourd'hui ?",
      "Qu'attendez-vous de cet échange ?",
      'Avez-vous déjà entrepris des démarches ou échangé avec d’autres interlocuteurs sur ce sujet ?',
    ],
  },
  {
    titre: 'Exploration de la situation actuelle',
    questions: [
      'Comment décririez-vous votre poste et vos activités actuelles ?',
      "Qu'est-ce qui vous convient dans votre situation actuelle ? Qu'est-ce qui vous convient moins ?",
      'Quelles compétences mobilisez-vous le plus fréquemment ?',
    ],
  },
];

const ETAPES_FINALES: { titre: string; questions: string[] }[] = [
  {
    titre: 'Contraintes, ressources et environnement',
    questions: [
      'Quelles contraintes devez-vous prendre en compte dans ce projet ?',
      'Sur quels appuis pouvez-vous compter ?',
      'À quelle échéance envisagez-vous ce projet ?',
    ],
  },
  {
    titre: 'Clôture et prochaines étapes',
    questions: [
      'Parmi les pistes évoquées, lesquelles souhaitez-vous approfondir en priorité ?',
      'Quelles informations vous manque-t-il pour avancer ?',
      'Quelles actions envisagez-vous de mener d’ici notre prochain échange ?',
    ],
  },
];

const ETAPES_SPECIFIQUES: Record<string, { titre: string; questions: string[] }[]> = {
  premiere_demande: [
    {
      titre: 'Clarification de la demande',
      questions: [
        'Comment formuleriez-vous votre demande en une phrase ?',
        'Depuis quand cette réflexion est-elle présente ?',
        'Qu’est-ce qui a déclenché cette démarche à ce moment précis ?',
      ],
    },
  ],
  projet_mobilite: [
    {
      titre: 'Exploration du projet de mobilité',
      questions: [
        'Quel type de mobilité envisagez-vous : fonctionnelle, géographique, ou les deux ?',
        'Quels environnements professionnels vous attirent et pour quelles raisons ?',
        'Qu’avez-vous déjà exploré concernant les possibilités qui s’offrent à vous ?',
        'Comment imaginez-vous votre poste idéal à l’issue de cette mobilité ?',
      ],
    },
  ],
  evolution_professionnelle: [
    {
      titre: "Exploration du projet d'évolution",
      questions: [
        'Vers quel type de responsabilités souhaiteriez-vous évoluer ?',
        'Quelles expériences vous semblent transférables vers cette évolution ?',
        'Quels écarts identifiez-vous entre votre situation actuelle et le projet visé ?',
      ],
    },
  ],
  besoin_formation: [
    {
      titre: 'Analyse du besoin de formation',
      questions: [
        'Quelles compétences souhaitez-vous acquérir ou renforcer ?',
        'À quel besoin professionnel concret cette formation répondrait-elle ?',
        'Quelles modalités de formation seraient compatibles avec votre organisation de travail ?',
        'Comment envisagez-vous de mobiliser ce que vous auriez appris ?',
      ],
    },
  ],
  reconversion: [
    {
      titre: 'Exploration du projet de reconversion',
      questions: [
        'Qu’est-ce qui vous conduit à envisager un changement de métier ?',
        'Quels métiers ou domaines avez-vous commencé à explorer ?',
        'Quelles étapes avez-vous déjà franchies dans cette réflexion ?',
        'Comment vous représentez-vous ce nouveau métier au quotidien ?',
      ],
    },
  ],
  bilan_parcours: [
    {
      titre: 'Retour sur le parcours',
      questions: [
        'Quelles étapes de votre parcours vous semblent les plus structurantes ?',
        'De quelles réalisations êtes-vous le plus satisfait ?',
        'Quels enseignements tirez-vous des transitions que vous avez déjà vécues ?',
        'Quels fils conducteurs identifiez-vous dans votre parcours ?',
      ],
    },
  ],
  projet_professionnel: [
    {
      titre: 'Construction du projet professionnel',
      questions: [
        'Comment décririez-vous le projet tel que vous l’imaginez aujourd’hui ?',
        'Qu’est-ce qui est essentiel pour vous dans ce projet ?',
        'Quels scénarios alternatifs avez-vous envisagés ?',
        'À quoi reconnaîtrez-vous que ce projet est réussi ?',
      ],
    },
  ],
};

export function genererTrame(type: string, contexte?: string): TrameEntretien {
  const definition = TYPES_ENTRETIEN.find((t) => t.cle === type) ?? TYPES_ENTRETIEN[0];
  const specifiques = ETAPES_SPECIFIQUES[definition.cle] ?? [];

  const etapes = [...ETAPES_COMMUNES, ...specifiques, ...ETAPES_FINALES];

  if (contexte && contexte.trim().length > 0) {
    etapes.splice(1, 0, {
      titre: 'Points à reprendre issus du contexte renseigné',
      questions: [
        `Vous avez évoqué : « ${contexte.trim()} ». Pouvez-vous m'en dire davantage ?`,
        'Qu’est-ce qui a évolué depuis notre dernier échange sur ce point ?',
      ],
    });
  }

  return {
    intitule: definition.libelle,
    objectif:
      "Conduire un entretien d'accompagnement structuré, en laissant à l'agent l'initiative de son projet.",
    etapes,
    rappels: RAPPELS_COMMUNS,
  };
}

export function enregistrerEntretien(
  type: string,
  trame: TrameEntretien,
  dossierId?: string | null,
): Entretien {
  const id = nouvelId('entr');
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO entretiens (id, dossier_id, type, trame, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, dossierId ?? null, type, JSON.stringify(trame), now);
  journaliser('entretien.generation', id, type);
  return { id, dossierId: dossierId ?? null, type, trame, createdAt: now };
}
