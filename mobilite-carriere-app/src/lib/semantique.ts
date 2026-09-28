import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { InferenceSession, Tensor } from 'onnxruntime-node';
import { getDb } from './db';

// Recherche par le sens : un modèle d'embeddings multilingue (multilingual-e5-small, quantifié
// en int8) tourne sur le serveur même. Aucune donnée ne quitte la machine ; le modèle est
// installé une fois (npm run semantique:installer) et n'est jamais téléchargé à l'usage.
export const MODELE = 'multilingual-e5-small';
const LONGUEUR_MAX = 512;
// Lots de 8 passages : mémoire contenue (~700 Mo au pic pour tout le serveur) à vitesse égale.
const TAILLE_LOT = 8;
const FICHIERS = ['onnx/model_quantized.onnx', 'tokenizer.json', 'tokenizer_config.json'];

export function dossierModele(): string {
  return process.env.MCC_MODELE_DIR ?? path.join(process.cwd(), 'modeles', MODELE);
}

export function modeleInstalle(): boolean {
  const dossier = dossierModele();
  return FICHIERS.every((f) => fs.existsSync(path.join(dossier, f)));
}

// Désactivable (MCC_RECHERCHE_SENS=non) : serveur de moins de 2 Go de mémoire, ou mesure de
// l'apport du sens à la recherche par les mots (évaluation).
export function rechercheParSensActivee(): boolean {
  return process.env.MCC_RECHERCHE_SENS !== 'non' && modeleInstalle();
}

interface Moteur {
  session: InferenceSession;
  Tensor: typeof Tensor;
  encoder: (texte: string) => number[];
  idRemplissage: number;
  avecTypes: boolean;
  sortie: string;
}

interface Index {
  version: string;
  ids: Int32Array;
  vecteurs: Float32Array;
  dimension: number;
  // Pénalité de chaque passage : l'excès de sa ressemblance moyenne avec des questions de toute
  // sorte sur celle, médiane, des autres passages du même document.
  penalite: Float32Array;
}

// Questions variées, du champ de l'accompagnement ou non. Un passage fait de mots en vrac
// (schéma, liste de verbes, sommaire) ressemble un peu à toutes, bien plus que les autres
// passages de son document : cet excès est retranché, pour qu'il ne l'emporte pas sur un
// passage qui traite vraiment la question posée. La comparaison se fait au sein de chaque
// document, pour ne pas désavantager un document entier au seul motif de son style.
const SONDES = [
  'congés', 'rémunération', 'formation', 'carrière', 'recrutement', 'mutation', 'retraite',
  'santé au travail', 'handicap', 'télétravail', 'management', 'compétences', 'entretien annuel',
  'concours', 'promotion', 'mobilité', 'contrat', 'démission', 'temps de travail',
  'égalité professionnelle', 'dialogue social', 'discipline', 'déontologie', 'logement', 'famille',
  'salaire', 'prime', 'indemnité', 'diplôme', 'apprentissage', 'reconversion', 'projet professionnel',
  'candidature', 'réseau', "offre d'emploi", 'fiche de poste', 'motivation', 'valeurs', 'bilan',
  'comment faire une demande ?', 'quelles sont les conditions ?', 'quels sont mes droits ?',
  'que faire ?', 'qui contacter ?', 'combien de temps cela dure-t-il ?',
];

// Un seul modèle chargé et une seule indexation à la fois par processus, y compris quand le
// serveur de développement recharge les modules.
const etat = ((globalThis as { __mccSemantique?: EtatSemantique }).__mccSemantique ??= {
  moteur: null,
  indexation: null,
  index: null,
  sondes: null,
  erreur: null,
});

interface EtatSemantique {
  moteur: Promise<Moteur> | null;
  indexation: Promise<void> | null;
  index: Index | null;
  sondes: Promise<Float32Array[]> | null;
  erreur: string | null;
}

// Paquets chargés à la demande : une bibliothèque native manquante (processeur non pris en
// charge, bibliothèque système absente) désactive la recherche par le sens sans empêcher
// l'application de démarrer.
async function chargerMoteur(): Promise<Moteur> {
  etat.moteur ??= (async () => {
    // onnxruntime (1.30) embarque une télémétrie Microsoft qui, sinon, contacte
    // mobile.events.data.microsoft.com : aucune donnée ne doit quitter le serveur.
    process.env.ORT_DISABLE_TELEMETRY = '1';
    type Ort = typeof import('onnxruntime-node');
    // Selon le chargeur (serveur Next ou script), le module CommonJS arrive tel quel ou en « default ».
    const ortModule = (await import('onnxruntime-node')) as Ort & { default?: Ort };
    const ort = ortModule.default ?? ortModule;
    const { Tokenizer } = await import('@huggingface/tokenizers');
    const dossier = dossierModele();
    const lireJson = (f: string) => JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf8')) as Record<string, unknown>;
    const configuration = lireJson('tokenizer_config.json');
    const tokenizer = new Tokenizer(lireJson('tokenizer.json'), configuration);
    const session = await ort.InferenceSession.create(path.join(dossier, 'onnx/model_quantized.onnx'), {
      // La moitié des cœurs : l'indexation ne doit pas priver le serveur de ressources.
      intraOpNumThreads: Math.max(1, Math.floor(os.availableParallelism() / 2)),
      interOpNumThreads: 1,
      // Sans réserve mémoire, la mémoire d'un calcul est rendue ensuite : sinon elle reste
      // acquise à la taille du plus gros lot (1,5 Go mesurés au lieu de 0,7).
      enableCpuMemArena: false,
    });
    const pad = typeof configuration.pad_token === 'string' ? configuration.pad_token : '<pad>';
    return {
      session,
      Tensor: ort.Tensor,
      encoder: (texte: string) => tokenizer.encode(texte).ids,
      idRemplissage: tokenizer.encode(pad, { add_special_tokens: false }).ids[0] ?? 0,
      avecTypes: session.inputNames.includes('token_type_ids'),
      sortie: session.outputNames.includes('last_hidden_state') ? 'last_hidden_state' : session.outputNames[0],
    };
  })().catch((erreur: unknown) => {
    etat.moteur = null;
    etat.erreur = erreur instanceof Error ? erreur.message : String(erreur);
    throw erreur;
  });
  return etat.moteur;
}

// Le modèle ne lit que 512 jetons : au-delà, on garde le début et le jeton de fin.
function tronquer(ids: number[]): number[] {
  return ids.length <= LONGUEUR_MAX ? ids : [...ids.slice(0, LONGUEUR_MAX - 1), ids[ids.length - 1]];
}

// Vecteur d'un texte : moyenne des états cachés sur ses jetons réels, normalisée (le produit
// scalaire de deux vecteurs est alors leur similarité cosinus).
async function vectoriser(textes: string[]): Promise<Float32Array[]> {
  const m = await chargerMoteur();
  const encodages = textes.map((t) => tronquer(m.encoder(t)));
  const n = textes.length;
  const longueur = Math.max(...encodages.map((e) => e.length));
  const ids = new BigInt64Array(n * longueur).fill(BigInt(m.idRemplissage));
  const masque = new BigInt64Array(n * longueur);
  encodages.forEach((e, i) =>
    e.forEach((id, j) => {
      ids[i * longueur + j] = BigInt(id);
      masque[i * longueur + j] = 1n;
    }),
  );
  const forme = [n, longueur];
  const entrees: Record<string, Tensor> = {
    input_ids: new m.Tensor('int64', ids, forme),
    attention_mask: new m.Tensor('int64', masque, forme),
  };
  if (m.avecTypes) entrees.token_type_ids = new m.Tensor('int64', new BigInt64Array(n * longueur), forme);
  const sortie = (await m.session.run(entrees))[m.sortie];
  const etats = sortie.data as Float32Array;
  const dimension = sortie.dims[2];

  return encodages.map((e, i) => {
    const v = new Float32Array(dimension);
    for (let j = 0; j < e.length; j++) {
      const debut = (i * longueur + j) * dimension;
      for (let k = 0; k < dimension; k++) v[k] += etats[debut + k];
    }
    let norme = 0;
    for (let k = 0; k < dimension; k++) norme += v[k] * v[k];
    norme = Math.sqrt(norme) || 1;
    for (let k = 0; k < dimension; k++) v[k] /= norme;
    return v;
  });
}

// La section situe le passage (« FPE › Convenances personnelles › Quelle est la durée… ? ») :
// elle fait partie de son sens.
function texteDuPassage(p: { titre_section: string | null; contenu: string }): string {
  return `passage: ${p.titre_section ? `${p.titre_section} — ` : ''}${p.contenu}`;
}

// Calcule, en tâche de fond, les vecteurs des passages qui n'en ont pas encore (nouveau
// document, première installation du modèle). Sans effet si une indexation est en cours.
export function lancerIndexation(): Promise<void> {
  if (!rechercheParSensActivee()) return Promise.resolve();
  etat.indexation ??= indexer()
    .catch((erreur: unknown) => {
      etat.erreur = erreur instanceof Error ? erreur.message : String(erreur);
      console.error('Indexation par le sens interrompue :', etat.erreur);
    })
    .finally(() => {
      etat.indexation = null;
    });
  return etat.indexation;
}

async function indexer() {
  const db = getDb();
  // Les passages de longueur voisine vont ensemble : moins de remplissage, calcul plus court.
  const aIndexer = db.prepare(
    `SELECT p.id, p.titre_section, p.contenu FROM passages p
      WHERE NOT EXISTS (SELECT 1 FROM passages_vecteurs v WHERE v.passage_id = p.id AND v.modele = ?)
      ORDER BY length(p.contenu) LIMIT 256`,
  );
  // Un passage retiré pendant le calcul (document supprimé) est simplement ignoré.
  const inserer = db.prepare(
    `INSERT OR REPLACE INTO passages_vecteurs (passage_id, modele, vecteur)
     SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM passages WHERE id = ?)`,
  );
  for (;;) {
    const lot = aIndexer.all(MODELE) as { id: number; titre_section: string | null; contenu: string }[];
    if (lot.length === 0) break;
    let inseres = 0;
    for (let i = 0; i < lot.length; i += TAILLE_LOT) {
      const tranche = lot.slice(i, i + TAILLE_LOT);
      const vecteurs = await vectoriser(tranche.map(texteDuPassage));
      db.transaction(() => {
        tranche.forEach((p, j) => {
          const v = vecteurs[j];
          inseres += inserer.run(p.id, MODELE, Buffer.from(v.buffer, v.byteOffset, v.byteLength), p.id).changes;
        });
      })();
      // Laisse passer les requêtes des conseillers entre deux lots.
      await new Promise((resolve) => setImmediate(resolve));
    }
    if (inseres === 0) break;
  }
  etat.erreur = null;
}

async function chargerIndex(): Promise<Index> {
  const db = getDb();
  const { n, somme } = db
    .prepare('SELECT COUNT(*) AS n, COALESCE(SUM(passage_id), 0) AS somme FROM passages_vecteurs WHERE modele = ?')
    .get(MODELE) as { n: number; somme: number };
  const version = `${n}:${somme}`;
  if (etat.index?.version === version) return etat.index;

  const lignes = db
    .prepare(
      `SELECT v.passage_id, v.vecteur, p.document_id FROM passages_vecteurs v JOIN passages p ON p.id = v.passage_id
        WHERE v.modele = ? ORDER BY v.passage_id`,
    )
    .all(MODELE) as { passage_id: number; vecteur: Buffer; document_id: string }[];
  const dimension = lignes.length > 0 ? lignes[0].vecteur.byteLength / 4 : 0;
  const ids = new Int32Array(lignes.length);
  const vecteurs = new Float32Array(lignes.length * dimension);
  lignes.forEach((l, i) => {
    ids[i] = l.passage_id;
    vecteurs.set(new Float32Array(l.vecteur.buffer, l.vecteur.byteOffset, dimension), i * dimension);
  });

  etat.sondes ??= vectoriser(SONDES.map((q) => `query: ${q}`)).catch((erreur: unknown) => {
    etat.sondes = null;
    throw erreur;
  });
  const sondes = await etat.sondes;
  const centralite = lignes.map((_, i) => {
    let s = 0;
    for (const sonde of sondes) s += produitScalaire(sonde, vecteurs, i * dimension);
    return s / sondes.length;
  });
  const parDocument = new Map<string, number[]>();
  lignes.forEach((l, i) => parDocument.set(l.document_id, [...(parDocument.get(l.document_id) ?? []), centralite[i]]));
  const medianes = new Map([...parDocument].map(([doc, valeurs]) => [doc, mediane(valeurs)]));
  const penalite = Float32Array.from(lignes, (l, i) => Math.max(0, centralite[i] - (medianes.get(l.document_id) ?? 0)));

  etat.index = { version, ids, vecteurs, dimension, penalite };
  return etat.index;
}

function mediane(valeurs: number[]): number {
  const tries = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tries.length / 2);
  return tries.length % 2 ? tries[milieu] : (tries[milieu - 1] + tries[milieu]) / 2;
}

function produitScalaire(v: Float32Array, matrice: Float32Array, debut: number): number {
  let s = 0;
  for (let k = 0; k < v.length; k++) s += v[k] * matrice[debut + k];
  return s;
}

export interface ResultatSens {
  passageId: number;
  similarite: number;
}

// Passages les plus proches de la question par le sens, du plus proche au moins proche.
// Similarité : cosinus, diminué de la pénalité des passages « fourre-tout ».
export async function rechercherParSens(requete: string, max: number): Promise<ResultatSens[]> {
  const index = await chargerIndex();
  if (index.ids.length === 0) return [];
  const [q] = await vectoriser([`query: ${requete}`]);
  const { ids, vecteurs, dimension, penalite } = index;
  const resultats: ResultatSens[] = [];
  for (let i = 0; i < ids.length; i++) {
    resultats.push({ passageId: ids[i], similarite: produitScalaire(q, vecteurs, i * dimension) - penalite[i] });
  }
  return resultats.sort((a, b) => b.similarite - a.similarite).slice(0, max);
}

// Similarité de sens entre deux formulations d'une même question.
export async function similariteEntreQuestions(a: string, b: string): Promise<number> {
  const [va, vb] = await vectoriser([`query: ${a}`, `query: ${b}`]);
  let s = 0;
  for (let k = 0; k < va.length; k++) s += va[k] * vb[k];
  return s;
}

export interface EtatRechercheParSens {
  statut: 'desactivee' | 'non_installe' | 'erreur' | 'indexation' | 'active';
  indexes: number;
  total: number;
  erreur: string | null;
}

export function etatRechercheParSens(): EtatRechercheParSens {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS n FROM passages').get() as { n: number }).n;
  const indexes = (
    db.prepare('SELECT COUNT(*) AS n FROM passages_vecteurs WHERE modele = ?').get(MODELE) as { n: number }
  ).n;
  return { statut: statut(indexes, total), indexes, total, erreur: etat.erreur };
}

function statut(indexes: number, total: number): EtatRechercheParSens['statut'] {
  if (process.env.MCC_RECHERCHE_SENS === 'non') return 'desactivee';
  if (!modeleInstalle()) return 'non_installe';
  if (etat.erreur) return 'erreur';
  return indexes < total ? 'indexation' : 'active';
}
