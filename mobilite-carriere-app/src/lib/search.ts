import type Database from 'better-sqlite3';
import { getDb } from './db';
import { SIGLES } from './sigles';
import type { Citation, DocumentSource } from './types';

// Part de l'information de la requête qu'un passage doit contenir pour être retenu, chaque
// notion pesant selon sa rareté dans la base. Une question longue, rédigée en langage
// courant, porte des mots secondaires qu'aucun passage ne réunit tous : on en exige moins,
// sans descendre sous le tiers.
function seuilCouverture(nombreNotions: number): number {
  // Deux mots désignent une notion précise : « rupture conventionnelle » n'est pas
  // « dispositions conventionnelles ». Seul un mot courant (« rôle ») peut manquer.
  if (nombreNotions <= 2) return 0.6;
  return Math.max(0.34, 0.5 - 0.04 * Math.max(0, nombreNotions - 3));
}
// Au-delà de cette part d'information portée par des mots absents de la base, la question
// porte sur un sujet que les documents ne traitent pas : « congé de maternité » ne doit pas
// renvoyer un passage sur le congé de formation au seul motif qu'il contient « congé ».
const SEUIL_HORS_CORPUS = 0.4;
const CANDIDATS_MAX = 80;
// L'outil sert la fonction publique de l'État : à pertinence voisine, la règle de l'État passe
// avant celles des versants territorial et hospitalier, qui restent affichées.
const PONDERATION_AUTRE_VERSANT = 0.8;
const AUTRE_VERSANT = /^(FPT|FPH)\b/;

const MOTS_VIDES = new Set([
  'les', 'des', 'une', 'un', 'le', 'la', 'de', 'du', 'et', 'ou', 'que', 'qui', 'quoi', 'dans',
  'pour', 'par', 'sur', 'avec', 'sans', 'est', 'sont', 'ete', 'etre', 'aux', 'ses', 'son', 'sa',
  'mes', 'mon', 'ma', 'ce', 'cet', 'cette', 'ces', 'il', 'elle', 'ils', 'elles', 'je', 'tu',
  'nous', 'vous', 'plus', 'moins', 'tout', 'tous', 'toute', 'toutes', 'quel', 'quelle', 'quels',
  'quelles', 'comment', 'pourquoi', 'peut', 'peuvent', 'faire', 'fait', 'mais', 'donc', 'car',
  'si', 'ne', 'pas', 'en', 'au', 'y', 'a', 'me', 'te', 'se', 'lui', 'leur', 'leurs', 'dont',
  // Tournures de question : elles ne disent rien du sujet, mais absentes des documents,
  // elles pèseraient autant qu'un terme rare.
  'veut', 'veux', 'voudrait', 'voudraient', 'voulez', 'souhaite', 'souhaitent', 'souhaiterait',
  'souhaitez', 'souhaiter', 'aimerait', 'aimerais', 'dois', 'doit', 'doivent', 'faut', 'savoir',
  'autre', 'autres', 'avant', 'apres', 'quand', 'alors', 'ainsi', 'aussi', 'tres', 'bien', 'deja',
  'encore', 'comme', 'chez', 'entre', 'votre', 'notre', 'vos', 'nos', 'cela', 'ceci', 'celui',
  'celle', 'etc',
]);

export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function extraireTokens(requete: string): string[] {
  return normaliser(requete)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !MOTS_VIDES.has(t));
}

function sansAccents(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function motsNormalises(texte: string): string {
  return normaliser(texte).replace(/[^a-z0-9]+/g, ' ').trim();
}

function echapper(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface TexteCompare {
  normalise: string;
  sansAccents: string;
}

// Une notion recherchée : un mot, ou un sigle avec ses formes développées.
interface Notion {
  fts: string;
  presente: (texte: TexteCompare) => boolean;
  mot?: string;
}

// Terminaisons admises après le radical d'un mot : pluriel et féminin (« détachée »,
// « professionnelles »), pas les dérivés — « départ » ne doit pas trouver « département », ni
// « fonction » « fonctionnaire ».
const TERMINAISON_MAX = 3;

// « derive » : mot absent de la base, cherché par son début sous toutes ses formes dérivées.
function notionMot(debut: string, derive = false): Notion {
  // Début de mot uniquement : « cep » ne doit pas être vu dans « exception ».
  const fin = derive ? '' : `[a-z0-9]{0,${TERMINAISON_MAX}}(?![a-z0-9])`;
  const motif = new RegExp(`(?:^|[^a-z0-9])${echapper(debut)}${fin}`);
  return { fts: `"${debut}"*`, presente: (t) => motif.test(t.normalise), mot: debut };
}

// Formes réellement indexées du mot : sa rareté se mesure sur elles seules, une troncature
// "depart"* compterait aussi « département ».
function formesIndexees(db: Database.Database, debut: string): string[] {
  return (
    db
      .prepare('SELECT term FROM passages_vocab WHERE term GLOB ? AND length(term) <= ?')
      .all(`${debut}*`, debut.length + TERMINAISON_MAX) as { term: string }[]
  ).map((r) => r.term);
}

// Suite de mots dont chacun peut porter une terminaison (pluriel, féminin) :
// « conseillers mobilité-carrière » répond à « conseiller mobilité-carrière ».
function motifForme(forme: string): RegExp {
  const mots = motsNormalises(forme).split(' ');
  return new RegExp(`(?:^|[^a-z0-9])${mots.map((m) => `${echapper(m)}[a-z0-9]*`).join('[^a-z0-9]+')}`);
}

function ftsForme(forme: string): string {
  const significatifs = motsNormalises(forme)
    .split(' ')
    .filter((m) => m.length >= 3 && !MOTS_VIDES.has(m));
  return `(${significatifs.map((m) => `"${m}"*`).join(' AND ')})`;
}

const NOTIONS_SIGLES = SIGLES.map((s) => {
  const motifsFormes = s.formes.map(motifForme);
  // Dans les documents, le sigle n'est reconnu qu'en capitales : « ROME » ne doit pas
  // trouver la ville, ni « CEP » le mot « cep ».
  const motifSigle = new RegExp(`(?:^|[^A-Za-z0-9])${echapper(s.sigle)}(?![A-Za-z0-9])`);
  return {
    motifSigleRequete: new RegExp(` ${echapper(s.sigle.toLowerCase())} `),
    motifsFormes,
    notion: {
      // Sigle cherché sans troncature : "cep"* trouverait « cependant ».
      fts: [`"${s.sigle.toLowerCase()}"`, ...s.formes.map(ftsForme)].join(' OR '),
      presente: (t: TexteCompare) =>
        motifSigle.test(t.sansAccents) || motifsFormes.some((m) => m.test(t.normalise)),
    } satisfies Notion,
  };
});

function analyserRequete(requete: string): Notion[] {
  let reste = ` ${motsNormalises(requete)} `;
  const notions: Notion[] = [];

  for (const s of NOTIONS_SIGLES) {
    let trouve = false;
    if (s.motifSigleRequete.test(reste)) {
      reste = reste.replace(s.motifSigleRequete, ' ');
      trouve = true;
    }
    for (const motif of s.motifsFormes) {
      if (motif.test(reste)) {
        reste = reste.replace(motif, ' ');
        trouve = true;
      }
    }
    if (trouve) notions.push(s.notion);
  }

  for (const token of new Set(extraireTokens(reste))) notions.push(notionMot(token));
  return notions;
}

function compterPassages(db: Database.Database, fts: string): number {
  return (
    db.prepare('SELECT COUNT(*) AS n FROM passages_fts WHERE passages_fts MATCH ?').get(fts) as {
      n: number;
    }
  ).n;
}

// Un mot absent de la base peut y figurer sous une autre forme (« reconvertir » →
// « reconversion ») ou avec une faute de frappe : on raccourcit son début, sans descendre
// sous 70 % de sa longueur pour ne pas rapprocher des mots sans rapport.
function resoudreNotion(db: Database.Database, notion: Notion): { notion: Notion; n: number } {
  if (!notion.mot) return { notion, n: compterPassages(db, notion.fts) };
  const formes = formesIndexees(db, notion.mot);
  // Le classement garde la troncature : chaque forme rare, cherchée seule, pèserait trop.
  if (formes.length > 0) return { notion, n: compterPassages(db, formes.map((f) => `"${f}"`).join(' OR ')) };
  if (notion.mot.length < 7) return { notion, n: 0 };
  const minimum = Math.max(6, Math.ceil(notion.mot.length * 0.7));
  for (let longueur = notion.mot.length - 1; longueur >= minimum; longueur--) {
    const variante = notionMot(notion.mot.slice(0, longueur), true);
    const nVariante = compterPassages(db, variante.fts);
    if (nVariante > 0) return { notion: variante, n: nVariante };
  }
  return { notion, n: 0 };
}

interface LigneResultat {
  passage_id: number;
  document_id: string;
  titre_section: string | null;
  page: number | null;
  contenu: string;
  extrait: string;
  score: number;
  titre: string;
  source: string;
  url: string | null;
  date_publication: string | null;
  statut: string;
}

export function rechercherPassages(requete: string, limite = 8): Citation[] {
  const notions = analyserRequete(requete);
  if (notions.length === 0) return [];

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS n FROM passages').get() as { n: number }).n;
  if (total === 0) return [];
  // Poids d'une notion selon sa rareté (idf de BM25) : un mot présent partout n'apporte
  // presque rien, un mot absent de la base pèse le plus lourd.
  const resolues = notions.map((notion) => {
    const r = resoudreNotion(db, notion);
    return { ...r, poids: Math.log((total - r.n + 0.5) / (r.n + 0.5) + 1) };
  });
  const poidsTotal = resolues.reduce((somme, r) => somme + r.poids, 0);
  const poidsInconnu = resolues.filter((r) => r.n === 0).reduce((somme, r) => somme + r.poids, 0);
  if (poidsInconnu / poidsTotal >= SEUIL_HORS_CORPUS) return [];

  const connues = resolues.filter((r) => r.n > 0);
  const poidsConnu = connues.reduce((somme, r) => somme + r.poids, 0);

  const lignes = db
    .prepare(
      `SELECT p.id AS passage_id, p.document_id, p.titre_section, p.page, p.contenu,
              snippet(passages_fts, 0, char(1), char(2), '…', 28) AS extrait,
              bm25(passages_fts) AS score,
              d.titre, d.source, d.url, d.date_publication, d.statut
         FROM passages_fts
         JOIN passages p ON p.id = passages_fts.rowid
         JOIN documents d ON d.id = p.document_id
        WHERE passages_fts MATCH ?
        ORDER BY score
        LIMIT ?`,
    )
    .all(connues.map((r) => `(${r.notion.fts})`).join(' OR '), CANDIDATS_MAX) as LigneResultat[];

  return lignes
    .map((ligne) => {
      const brut = `${ligne.titre_section ?? ''}\n${ligne.contenu}`;
      const texte = { normalise: normaliser(brut), sansAccents: sansAccents(brut) };
      const couvert = connues.reduce((somme, r) => somme + (r.notion.presente(texte) ? r.poids : 0), 0);
      return { ligne, couverture: couvert / poidsConnu };
    })
    // La couverture écarte les passages qui ne répondent qu'à une partie de la question ;
    // le classement revient ensuite à BM25, qui préfère la page consacrée au sujet à la page
    // d'introduction qui mentionne tous les sujets en une ligne.
    .filter((r) => r.couverture >= seuilCouverture(connues.length))
    .sort((a, b) => scoreClassement(a.ligne) - scoreClassement(b.ligne))
    .filter(dedoublonner())
    .slice(0, limite)
    .map(({ ligne }) => ({
      passageId: ligne.passage_id,
      documentId: ligne.document_id,
      documentTitre: ligne.titre,
      source: ligne.source,
      url: ligne.url,
      datePublication: ligne.date_publication,
      statut: ligne.statut === 'officiel' ? 'officiel' : 'a_verifier',
      titreSection: ligne.titre_section,
      page: ligne.page,
      extrait: ligne.extrait,
      score: ligne.score,
    }));
}

// Score bm25 : négatif, d'autant plus bas que le passage est pertinent.
function scoreClassement(ligne: LigneResultat): number {
  return AUTRE_VERSANT.test(ligne.titre_section ?? '') ? ligne.score * PONDERATION_AUTRE_VERSANT : ligne.score;
}

// Un même contenu se répète d'une page à l'autre dans les documents maquettés :
// le conseiller n'a pas besoin de le lire deux fois.
function dedoublonner() {
  const vus = new Set<string>();
  return ({ ligne }: { ligne: LigneResultat }) => {
    // Empreinte sur l'intégralité du passage : deux passages distincts partageant
    // la même accroche doivent rester visibles tous les deux.
    const empreinte = normaliser(ligne.contenu).replace(/[^a-z0-9]/g, '');
    if (vus.has(empreinte)) return false;
    vus.add(empreinte);
    return true;
  };
}

export function enregistrerRecherche(conseillerId: string, requete: string, nbResultats: number) {
  getDb()
    .prepare('INSERT INTO recherches (conseiller_id, ts, requete, nb_resultats) VALUES (?, ?, ?, ?)')
    .run(conseillerId, new Date().toISOString(), requete, nbResultats);
}

export function listerDocuments(): DocumentSource[] {
  const lignes = getDb()
    .prepare('SELECT * FROM documents ORDER BY date_ingestion DESC')
    .all() as Record<string, string | number | null>[];

  return lignes.map((l) => ({
    id: String(l.id),
    titre: String(l.titre),
    source: String(l.source),
    url: l.url ? String(l.url) : null,
    datePublication: l.date_publication ? String(l.date_publication) : null,
    dateIngestion: String(l.date_ingestion),
    statut: l.statut === 'officiel' ? 'officiel' : 'a_verifier',
    fichier: l.fichier ? String(l.fichier) : null,
    nbPassages: Number(l.nb_passages),
  }));
}

export function baseDocumentaireVide(): boolean {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM documents').get() as { n: number };
  return row.n === 0;
}

export function recherchesRecentes(
  conseillerId: string,
  limite = 5,
): { requete: string; ts: string; nbResultats: number }[] {
  const lignes = getDb()
    .prepare('SELECT requete, ts, nb_resultats FROM recherches WHERE conseiller_id = ? ORDER BY id DESC LIMIT ?')
    .all(conseillerId, limite) as { requete: string; ts: string; nb_resultats: number }[];
  return lignes.map((l) => ({ requete: l.requete, ts: l.ts, nbResultats: l.nb_resultats }));
}
