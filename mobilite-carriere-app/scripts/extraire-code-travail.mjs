// Produit data/sources/code-du-travail-formation.md à partir du fonds LEGI de la DILA,
// diffusé par les ministères sociaux (paquet npm @socialgouv/legi-data).
// Usage : npm pack @socialgouv/legi-data && tar xzf socialgouv-legi-data-*.tgz
//         node scripts/extraire-code-travail.mjs package/data/LEGITEXT000006072050.json
// Seule la sixième partie (formation professionnelle tout au long de la vie) est retenue :
// le reste du code régit le contrat de travail de droit privé et ne s'applique pas aux
// agents publics.
import fs from 'node:fs';

const code = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const texte = (html) =>
  (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

const lignes = [];
let articles = 0;
function parcourir(noeud, niveau) {
  if (noeud.type === 'article') {
    if (noeud.data.etat !== 'VIGUEUR') return;
    articles++;
    lignes.push(`Article ${noeud.data.num} — ${texte(noeud.data.texte)}`, '');
    return;
  }
  const enfants = (noeud.children || []).filter((e) => e.type === 'article' ? e.data.etat === 'VIGUEUR' : true);
  if (enfants.length === 0) return;
  if (niveau > 0) lignes.push(`${'#'.repeat(Math.min(niveau + 1, 6))} ${noeud.data.title.trim()}`, '');
  for (const e of enfants) parcourir(e, niveau + 1);
}

for (const partie of code.children.filter((p) => /^Partie (législative|réglementaire)\s*$/.test(p.data.title.trim()))) {
  const sixieme = partie.children.find((s) => /^Sixième partie/i.test(s.data.title));
  lignes.push(`# Code du travail — ${partie.data.title.trim()} — ${sixieme.data.title.trim()}`, '');
  parcourir(sixieme, 1);
}

const entete = [
  `Code du travail, version en vigueur au ${code.data.dateDebutVersion} — sixième partie : formation professionnelle tout au long de la vie.`,
  'Source : Légifrance, fonds LEGI de la DILA (https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050).',
  'Ces dispositions régissent d’abord les salariés de droit privé. Pour un agent public, seules certaines s’appliquent (conseil en évolution professionnelle, validation des acquis de l’expérience…) : vérifier le texte propre à la fonction publique.',
  '',
];
fs.mkdirSync('data/sources', { recursive: true });
fs.writeFileSync('data/sources/code-du-travail-formation.md', [...entete, ...lignes].join('\n'));
console.log(`${articles} articles en vigueur extraits (version du ${code.data.dateDebutVersion}).`);
