import type Database from 'better-sqlite3';
import { getDb } from './db';
import {
  lancerIndexation,
  rechercheParSensActivee,
  rechercherParSens,
  similariteEntreQuestions,
  type ResultatSens,
} from './semantique';
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
// Au-delà, une question ne gagne rien en précision et coûterait en calcul (chaque mot est
// résolu dans l'index, chaque jeton passe par le modèle).
export const LONGUEUR_REQUETE_MAX = 500;
// Recherche par le sens (similarités cosinus, calibrées sur scripts/questions-reference.json,
// guide seul et base complète) :
// - en complément de passages trouvés par les mots, un passage proche est retenu dès 0,87 ;
// - seul, le sens doit être net (0,88 : aucune des questions hors sujet de référence ne
//   l'atteint) et ne pas reposer sur des mots absents de la base qui portent le sujet.
const CANDIDATS_SENS = 30;
const SEUIL_SENS_COMPLEMENT = 0.87;
const SEUIL_SENS_SEUL = 0.88;
const SEUIL_SANS_MOTS_INCONNUS = 0.92;
const POIDS_SENS = 0.75;
const K_FUSION = 5;
// Pistes de lecture, proposées à part quand aucun passage ne répond : le sens y suffit, sans
// garantie de réponse — elles sont affichées comme telles.
const SEUIL_PISTES = 0.83;
// Entre versants, les similarités d'un même texte ne diffèrent que de quelques millièmes.
const ECART_AUTRE_VERSANT = 0.01;
const LONGUEUR_EXTRAIT = 240;
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
  'combien', 'puis', 'peux', 'suis', 'voudrais', 'pourrait', 'pourrais',
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

export interface LigneResultat {
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

export interface ResultatMots {
  // « vide » : question faite de mots-outils seuls, ou base vide. « hors_corpus » : une part
  // décisive de la question porte sur des mots absents de la base.
  statut: 'vide' | 'hors_corpus' | 'ok';
  lignes: LigneResultat[];
  inconnus: string[];
  // Part de l'information de la question portée par des mots absents de la base.
  partInconnue: number;
}

// Passages retenus par les mots, du plus au moins pertinent.
export function rechercherParLesMots(requeteSaisie: string): ResultatMots {
  const requete = requeteSaisie.slice(0, LONGUEUR_REQUETE_MAX);
  const aucun = (statut: ResultatMots['statut'], inconnus: string[] = [], partInconnue = 0): ResultatMots => ({
    statut,
    lignes: [],
    inconnus,
    partInconnue,
  });
  const notions = analyserRequete(requete);
  if (notions.length === 0) return aucun('vide');

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS n FROM passages').get() as { n: number }).n;
  if (total === 0) return aucun('vide');
  // Poids d'une notion selon sa rareté (idf de BM25) : un mot présent partout n'apporte
  // presque rien, un mot absent de la base pèse le plus lourd.
  const resolues = notions.map((notion) => {
    const r = resoudreNotion(db, notion);
    return { ...r, poids: Math.log((total - r.n + 0.5) / (r.n + 0.5) + 1) };
  });
  const poidsTotal = resolues.reduce((somme, r) => somme + r.poids, 0);
  const poidsInconnu = resolues.filter((r) => r.n === 0).reduce((somme, r) => somme + r.poids, 0);
  const inconnus = resolues.filter((r) => r.n === 0 && r.notion.mot).map((r) => r.notion.mot as string);
  const partInconnue = poidsInconnu / poidsTotal;
  if (partInconnue >= SEUIL_HORS_CORPUS) return aucun('hors_corpus', inconnus, partInconnue);

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

  const retenues = lignes
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
    .map((r) => r.ligne);
  return { statut: 'ok', lignes: retenues, inconnus, partInconnue };
}

// Recherche hybride : les mots (passages qui emploient les termes de la question) et le sens
// (passages qui en traitent avec d'autres mots : « s'occuper de ses enfants » → « élever un
// enfant »). Les deux classements sont fusionnés par rang réciproque.
export async function rechercherPassages(requeteSaisie: string, limite = 8): Promise<Citation[]> {
  const requete = requeteSaisie.slice(0, LONGUEUR_REQUETE_MAX);
  const mots = rechercherParLesMots(requete);
  if (mots.statut === 'vide') return [];
  let parLesMots = mots.lignes;
  let parLeSens: ResultatSens[] = [];
  if (rechercheParSensActivee()) {
    // Des mots absents de la base qui portent le sujet de la question (« accident » dans
    // « déclarer un accident sur le trajet ») : les passages trouvés sur les autres mots
    // (« trajet ») seraient hors sujet.
    if (mots.inconnus.length > 0 && !(await sensConserveSans(requete, mots.inconnus))) return [];
    parLeSens = await rechercherParLeSens(requete, mots);
  } else if (mots.statut === 'hors_corpus') {
    parLesMots = [];
  }
  if (parLesMots.length === 0 && parLeSens.length === 0) return [];

  const rangMots = new Map(parLesMots.map((l, i) => [l.passage_id, i + 1]));
  const rangSens = new Map(parLeSens.map((r, i) => [r.passageId, i + 1]));
  const lignes = [
    ...parLesMots,
    ...lirePassages(parLeSens.map((r) => r.passageId).filter((id) => !rangMots.has(id))),
  ];
  const score = (l: LigneResultat) => {
    const rm = rangMots.get(l.passage_id);
    const rs = rangSens.get(l.passage_id);
    const versant = AUTRE_VERSANT.test(l.titre_section ?? '') ? PONDERATION_AUTRE_VERSANT : 1;
    return (rm ? 1 / (K_FUSION + rm) : 0) + (rs ? (POIDS_SENS * versant) / (K_FUSION + rs) : 0);
  };

  return lignes
    .map((ligne) => ({ ligne, fusion: score(ligne) }))
    .sort((a, b) => b.fusion - a.fusion)
    .filter(dedoublonner())
    .slice(0, limite)
    .map(({ ligne, fusion }) =>
      versCitation(
        ligne,
        fusion,
        rangMots.has(ligne.passage_id) ? (rangSens.has(ligne.passage_id) ? 'mots_et_sens' : 'mots') : 'sens',
      ),
    );
}

// Quand aucun passage ne répond à la question, les plus proches par le sens sont proposés à
// part, comme pistes de lecture à vérifier, jamais comme réponse : « mon mari est muté, puis-je
// le suivre ? » mène à la disponibilité pour suivre son conjoint, que rien, dans les mots de la
// question, ne désigne.
export async function pistesParLeSens(requeteSaisie: string, limite = 3): Promise<Citation[]> {
  const requete = requeteSaisie.slice(0, LONGUEUR_REQUETE_MAX);
  if (!rechercheParSensActivee() || rechercherParLesMots(requete).statut === 'vide') return [];
  try {
    const proches = (await rechercherParSens(requete, limite * 3)).filter((r) => r.similarite >= SEUIL_PISTES);
    const parId = new Map(lirePassages(proches.map((r) => r.passageId)).map((l) => [l.passage_id, l]));
    return proches
      .flatMap((r) => {
        const ligne = parId.get(r.passageId);
        return ligne ? [{ ligne, similarite: r.similarite }] : [];
      })
      // À sens voisin, la règle de l'État d'abord (même préférence que pour les résultats).
      .sort((a, b) => scoreSensVersant(b) - scoreSensVersant(a))
      .filter(dedoublonner())
      .slice(0, limite)
      .map(({ ligne, similarite }) => versCitation(ligne, similarite, 'sens'));
  } catch (erreur) {
    console.error('Recherche par le sens indisponible :', erreur instanceof Error ? erreur.message : erreur);
    return [];
  }
}

function scoreSensVersant({ ligne, similarite }: { ligne: LigneResultat; similarite: number }): number {
  return AUTRE_VERSANT.test(ligne.titre_section ?? '') ? similarite - ECART_AUTRE_VERSANT : similarite;
}

function versCitation(ligne: LigneResultat, score: number, origine: Citation['origine']): Citation {
  return {
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
    score,
    origine,
  };
}

async function rechercherParLeSens(requete: string, mots: ResultatMots): Promise<ResultatSens[]> {
  void lancerIndexation();
  try {
    const candidats = await rechercherParSens(requete, CANDIDATS_SENS);
    // En complément des mots, un passage proche suffit ; seul, ou face à des mots absents de la
    // base, le sens doit être net.
    const seuil = mots.lignes.length > 0 && mots.inconnus.length === 0 ? SEUIL_SENS_COMPLEMENT : SEUIL_SENS_SEUL;
    return candidats.filter((r) => r.similarite >= seuil);
  } catch (erreur) {
    // Modèle illisible ou moteur indisponible : la recherche par les mots suffit.
    console.error('Recherche par le sens indisponible :', erreur instanceof Error ? erreur.message : erreur);
    return [];
  }
}

// La question privée de ses mots absents de la base garde-t-elle son sens ? « Congé de
// maternité » sans « maternité » n'est plus la même question ; « mon projet a-t-il des chances
// d'aboutir ? » sans « aboutir », si. Moteur indisponible : on s'en tient aux mots.
async function sensConserveSans(requete: string, inconnus: string[]): Promise<boolean> {
  const reste = sansMots(requete, inconnus);
  if (reste.length === 0) return false;
  try {
    return (await similariteEntreQuestions(requete, reste)) >= SEUIL_SANS_MOTS_INCONNUS;
  } catch {
    return true;
  }
}

function sansMots(requete: string, mots: string[]): string {
  return requete
    .split(/(\p{L}[\p{L}\p{N}-]*)/u)
    .filter((morceau) => !mots.some((m) => normaliser(morceau).startsWith(m)))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

// Passages trouvés par le seul sens : aucun terme à surligner, l'extrait est leur début.
function lirePassages(ids: number[]): LigneResultat[] {
  if (ids.length === 0) return [];
  const lignes = getDb()
    .prepare(
      `SELECT p.id AS passage_id, p.document_id, p.titre_section, p.page, p.contenu, 0 AS score,
              d.titre, d.source, d.url, d.date_publication, d.statut
         FROM passages p JOIN documents d ON d.id = p.document_id
        WHERE p.id IN (${ids.map(() => '?').join(', ')})`,
    )
    .all(...ids) as Omit<LigneResultat, 'extrait'>[];
  return lignes.map((l) => ({ ...l, extrait: debutDuPassage(l.contenu) }));
}

function debutDuPassage(contenu: string): string {
  const texte = contenu.replace(/\s+/g, ' ').trim();
  if (texte.length <= LONGUEUR_EXTRAIT) return texte;
  const coupe = texte.slice(0, LONGUEUR_EXTRAIT);
  return `${coupe.slice(0, Math.max(coupe.lastIndexOf(' '), LONGUEUR_EXTRAIT / 2))}…`;
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
    .run(conseillerId, new Date().toISOString(), requete.slice(0, LONGUEUR_REQUETE_MAX), nbResultats);
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
