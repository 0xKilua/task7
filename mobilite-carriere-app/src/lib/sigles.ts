// Un sigle et sa forme développée désignent la même notion : la recherche les traite comme
// équivalents. N'y figurent que des sigles dont la forme longue est certaine — définie dans
// le guide DGAFP ou intitulé statutaire officiel —, pour ne jamais rapprocher deux notions
// distinctes (un détachement n'est pas une mise à disposition).

export interface Sigle {
  sigle: string;
  formes: string[];
  source: string;
}

export const SIGLES: Sigle[] = [
  { sigle: 'CMC', formes: ['conseiller mobilité-carrière'], source: 'Guide DGAFP 2026, p. 38' },
  { sigle: 'CPF', formes: ['compte personnel de formation'], source: 'Guide DGAFP 2026, p. 98' },
  {
    sigle: 'RMFP',
    formes: ['répertoire des métiers de la fonction publique'],
    source: 'Guide DGAFP 2026, p. 75',
  },
  {
    sigle: 'ROME',
    formes: ['répertoire opérationnel des métiers et des emplois'],
    source: 'Guide DGAFP 2026, p. 75',
  },
  {
    sigle: 'RIME',
    formes: ['référentiel interministériel des métiers de l’État'],
    source: 'Guide DGAFP 2026, p. 76',
  },
  {
    sigle: 'BOETH',
    formes: ['bénéficiaire de l’obligation d’emploi de travailleurs handicapés'],
    source: 'Guide DGAFP 2026, p. 38 et 157',
  },
  {
    sigle: 'PFRH',
    formes: ['plate-forme régionale d’appui interministériel à la gestion des ressources humaines'],
    source: 'Guide DGAFP 2026, p. 87',
  },
  {
    sigle: 'SGAE',
    formes: ['secrétariat général des affaires européennes'],
    source: 'Guide DGAFP 2026, p. 10',
  },
  {
    sigle: 'DGAFP',
    formes: ['direction générale de l’administration et de la fonction publique'],
    source: 'Intitulé officiel',
  },
  { sigle: 'FPE', formes: ['fonction publique de l’État'], source: 'Intitulé statutaire' },
  { sigle: 'FPT', formes: ['fonction publique territoriale'], source: 'Intitulé statutaire' },
  { sigle: 'FPH', formes: ['fonction publique hospitalière'], source: 'Intitulé statutaire' },
  { sigle: 'PNA', formes: ['position normale d’activité'], source: 'Intitulé statutaire' },
  { sigle: 'CEP', formes: ['conseil en évolution professionnelle'], source: 'Intitulé statutaire' },
  { sigle: 'VAE', formes: ['validation des acquis de l’expérience'], source: 'Intitulé statutaire' },
  { sigle: 'CFP', formes: ['congé de formation professionnelle'], source: 'Intitulé statutaire' },
  {
    sigle: 'RQTH',
    formes: ['reconnaissance de la qualité de travailleur handicapé'],
    source: 'Intitulé statutaire',
  },
  { sigle: 'RH', formes: ['ressources humaines'], source: 'Usage administratif' },
  {
    sigle: 'DRH',
    formes: ['direction des ressources humaines', 'directeur des ressources humaines'],
    source: 'Usage administratif',
  },
  { sigle: 'CV', formes: ['curriculum vitae'], source: 'Usage courant' },
  {
    sigle: 'CNIL',
    formes: ['commission nationale de l’informatique et des libertés'],
    source: 'Intitulé officiel',
  },
];
