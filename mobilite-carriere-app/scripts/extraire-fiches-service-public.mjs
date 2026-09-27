// Produit contenus/sources/service-public/<fiche>.md et leurs entrées dans sources.json à partir
// des fiches pratiques de service-public.fr (DILA), diffusées par les ministères sociaux (paquet
// npm @socialgouv/fiches-vdd). Usage :
//   npm pack @socialgouv/fiches-vdd && tar xzf socialgouv-fiches-vdd-*.tgz package/data/particuliers
//   node scripts/extraire-fiches-service-public.mjs package/data/particuliers "26 septembre 2026"
// Le second argument est la date de diffusion du paquet : l'état du texte que l'on cite.
import fs from 'node:fs';
import path from 'node:path';

// Fiches consacrées à la carrière et à la formation des fonctionnaires.
const FICHES = [
  'F544', 'F31603', 'F543', 'F3026', 'F36639', 'F2749', 'F3019', 'F20094', 'F18090', 'F3027', 'F11992',
];

const IGNORES = new Set([
  'Questionnaire', 'ServiceEnLigne', 'Source', 'PourEnSavoirPlus', 'OuSAdresser', 'FilDAriane', 'Theme',
  'SousThemePere', 'DossierPere', 'SurTitre', 'Audience', 'Canal', 'Definition', 'Abreviation',
  'QuestionReponse', 'Fiche', 'Niveau',
]);
const TITRES = new Set(['Situation', 'Chapitre', 'SousChapitre', 'Cas']);
const ENCADRES = { ANoter: 'À noter', ASavoir: 'À savoir', Attention: 'Attention' };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// Les balises en ligne (liens, valeurs, exposants) portent leurs espaces dans le texte voisin,
// sauf parfois devant un nombre (« au moins<Valeur>120 jours</Valeur> »).
const enLigne = (n) =>
  n.type === 'text'
    ? n.text
    : (n.children || []).map(enLigne).reduce((a, b) => a + (/\p{L}$/u.test(a) && /^\d/.test(b) ? ' ' : '') + b, '');
const propre = (t) => t.replace(/\s+/g, ' ').trim();
const dateFr = (iso) => {
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`;
};

// Une même fiche décline souvent ses règles par versant (FPE, FPT, FPH) puis par cas : chaque
// titre porte donc tout son chemin, pour qu'un extrait cité seul dise à quelle situation il
// s'applique.
function rendre(fiche) {
  const racine = fiche.children[0];
  const lignes = [];
  const references = [];
  const chemin = [];
  let titre = '';
  (function parcourir(n) {
    if (!n || n.type === 'text') return;
    if (n.name === 'dc:title') titre = propre(enLigne(n));
    if (n.name?.startsWith('dc:') || IGNORES.has(n.name)) return;
    if (n.name === 'Reference') {
      const t = (n.children || []).find((c) => c.name === 'Titre');
      const c = (n.children || []).find((c) => c.name === 'Complement');
      references.push(`- ${propre(t ? enLigne(t) : '')}${c ? ` : ${propre(enLigne(c))}` : ''}${n.attributes?.URL ? ` — ${n.attributes.URL}` : ''}`);
      return;
    }
    if (n.name === 'Paragraphe') return void lignes.push(propre(enLigne(n)), '');
    // Texte brut : les extraits cités s'affichent tels quels, sans rendu Markdown.
    if (n.name === 'TitreFlottant') return void lignes.push(`${propre(enLigne(n))} :`, '');
    if (n.name === 'Liste') {
      for (const item of n.children || []) if (item.name === 'Item') lignes.push(`- ${propre(enLigne(item))}`);
      return void lignes.push('');
    }
    const enfants = n.children || [];
    const t = enfants.find((c) => c.name === 'Titre');
    const intitule = TITRES.has(n.name) && t ? propre(enLigne(t)) : null;
    if (intitule) {
      chemin.push(intitule);
      lignes.push(`${'#'.repeat(Math.min(6, chemin.length + 1))} ${chemin.join(' › ')}`, '');
    }
    if (ENCADRES[n.name]) {
      const sousTitre = t ? propre(enLigne(t)) : '';
      lignes.push(`${ENCADRES[n.name]}${sousTitre && sousTitre !== ENCADRES[n.name] ? ` — ${sousTitre}` : ''} :`, '');
    }
    for (const e of enfants) if (e !== t) parcourir(e);
    if (intitule) chemin.pop();
  })(racine);
  const { ID: id, spUrl: url, dateDerniereModificationImportante: modification } = racine.attributes;
  const texte = [
    `# ${titre}`,
    '',
    `Fiche ${id} de service-public.fr (DILA) — ${url} — dernière modification importante le ${dateFr(modification)}.`,
    '',
    ...lignes,
    ...(references.length ? ['## Textes de référence', '', ...references, ''] : []),
  ].join('\n');
  return { id, titre, url, modification, texte };
}

const [dossier, etatAu] = process.argv.slice(2);
if (!dossier || !etatAu) {
  console.error('Usage : node scripts/extraire-fiches-service-public.mjs <dossier des fiches> "<date de diffusion>"');
  process.exit(1);
}
const sortie = 'contenus/sources/service-public';
fs.mkdirSync(sortie, { recursive: true });
const entrees = FICHES.map((fichier) => {
  const f = rendre(JSON.parse(fs.readFileSync(path.join(dossier, `${fichier}.json`), 'utf8')));
  fs.writeFileSync(path.join(sortie, `${f.id}.md`), f.texte);
  return {
    fichier: `service-public/${f.id}.md`,
    titre: `${f.titre} — service-public.fr (${f.id})`,
    source: 'service-public.fr — DILA',
    url: f.url,
    datePublication: `Fiche modifiée le ${dateFr(f.modification)}, état au ${etatAu}`,
    statut: 'officiel',
  };
});

// Le manifeste garde les autres textes livrés ; seules les fiches service-public.fr sont remplacées.
const manifeste = 'contenus/sources/sources.json';
const autres = JSON.parse(fs.readFileSync(manifeste, 'utf8')).filter((s) => !s.fichier.startsWith('service-public'));
fs.writeFileSync(manifeste, `${JSON.stringify([...autres, ...entrees], null, 2)}\n`);
console.log(`${entrees.length} fiches extraites dans ${sortie}.`);
