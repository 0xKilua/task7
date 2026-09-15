import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export interface PageExtraite {
  page: number | null;
  texte: string;
}

const require_ = createRequire(import.meta.url);

export async function extraireTexte(cheminFichier: string): Promise<PageExtraite[]> {
  const ext = path.extname(cheminFichier).toLowerCase();
  const buffer = fs.readFileSync(cheminFichier);
  return extraireDepuisBuffer(buffer, ext);
}

export async function extraireDepuisBuffer(buffer: Buffer, ext: string): Promise<PageExtraite[]> {
  if (ext === '.pdf') return extrairePdf(buffer);
  if (ext === '.md' || ext === '.txt') {
    return [{ page: null, texte: buffer.toString('utf8') }];
  }
  throw new Error(`Format non pris en charge : ${ext} (attendu : .pdf, .md, .txt)`);
}

async function extrairePdf(buffer: Buffer): Promise<PageExtraite[]> {
  const pdfParse = require_('pdf-parse/lib/pdf-parse.js') as (
    data: Buffer,
    options?: Record<string, unknown>,
  ) => Promise<{ numpages: number; text: string }>;

  const pages: LignePdf[][] = [];
  await pdfParse(buffer, {
    pagerender: async (pageData: {
      getTextContent: (opts: Record<string, boolean>) => Promise<{
        items: ItemPdf[];
      }>;
    }) => {
      const contenu = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });
      const lignes = reconstruireLignes(contenu.items);
      pages.push(lignes);
      return lignes.map((l) => l.texte).join('\n');
    },
  });

  const tailleCorps = tailleMediane(pages.flat());

  return pages.map((lignes, index) => ({
    page: index + 1,
    texte: lignes.map((ligne) => (estTitrePdf(ligne, tailleCorps) ? `## ${ligne.texte}` : ligne.texte)).join('\n'),
  }));
}

interface ItemPdf {
  str: string;
  transform?: number[];
  height?: number;
  width?: number;
}

interface LignePdf {
  texte: string;
  taille: number;
}

interface ItemPositionne {
  texte: string;
  x: number;
  y: number;
  largeur: number;
  taille: number;
}

const TOLERANCE_Y = 2;
const PROFONDEUR_COLONNES_MAX = 2;

function positionner(items: ItemPdf[]): ItemPositionne[] {
  return items
    .filter((item) => item.str.trim().length > 0)
    .map((item) => ({
      texte: item.str,
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
      largeur: item.width ?? 0,
      taille: item.height ?? item.transform?.[0] ?? 0,
    }));
}

// Le texte PDF arrive en fragments positionnés, sans sauts de ligne ni ordre de lecture :
// on sépare d'abord les colonnes, puis on regroupe par ordonnée à l'intérieur de chacune.
function reconstruireLignes(items: ItemPdf[]): LignePdf[] {
  return decouperColonnes(positionner(items), 0).flatMap(grouperParLigne);
}

function grouperParLigne(items: ItemPositionne[]): LignePdf[] {
  const lignes: { y: number; taille: number; fragments: ItemPositionne[] }[] = [];

  for (const item of items) {
    const ligne = lignes.find((l) => Math.abs(l.y - item.y) <= TOLERANCE_Y);
    if (ligne) {
      ligne.fragments.push(item);
      ligne.taille = Math.max(ligne.taille, item.taille);
    } else {
      lignes.push({ y: item.y, taille: item.taille, fragments: [item] });
    }
  }

  return lignes
    .sort((a, b) => b.y - a.y)
    .map((l) => ({
      texte: l.fragments
        .sort((a, b) => a.x - b.x)
        .map((f) => f.texte)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
      taille: l.taille,
    }))
    .filter((l) => l.texte.length > 0);
}

// Sans cette séparation, deux colonnes côte à côte partagent la même ordonnée et
// leurs phrases s'entrelacent dans le passage indexé.
function decouperColonnes(items: ItemPositionne[], profondeur: number): ItemPositionne[][] {
  if (profondeur >= PROFONDEUR_COLONNES_MAX || items.length < 40) return [items];

  const xMin = Math.min(...items.map((i) => i.x));
  const xMax = Math.max(...items.map((i) => i.x + i.largeur));
  const largeur = xMax - xMin;
  if (largeur <= 0) return [items];

  const NB_CASES = 100;
  const occupe = new Array<boolean>(NB_CASES).fill(false);
  for (const item of items) {
    const debut = Math.floor(((item.x - xMin) / largeur) * NB_CASES);
    const fin = Math.ceil(((item.x + item.largeur - xMin) / largeur) * NB_CASES);
    for (let i = Math.max(0, debut); i < Math.min(NB_CASES, Math.max(fin, debut + 1)); i++) {
      occupe[i] = true;
    }
  }

  const gouttiere = plusLargeGouttiere(occupe);
  if (!gouttiere) return [items];

  const coupure = xMin + ((gouttiere.debut + gouttiere.fin) / 2 / NB_CASES) * largeur;
  const gauche = items.filter((i) => i.x + i.largeur / 2 < coupure);
  const droite = items.filter((i) => i.x + i.largeur / 2 >= coupure);

  const minimum = items.length * 0.2;
  if (gauche.length < minimum || droite.length < minimum) return [items];

  return [...decouperColonnes(gauche, profondeur + 1), ...decouperColonnes(droite, profondeur + 1)];
}

function plusLargeGouttiere(occupe: boolean[]): { debut: number; fin: number } | null {
  const LARGEUR_MIN = 5;
  const MARGE = 15;
  let meilleure: { debut: number; fin: number } | null = null;
  let debut = -1;

  for (let i = MARGE; i <= occupe.length - MARGE; i++) {
    if (i < occupe.length && !occupe[i]) {
      if (debut < 0) debut = i;
      continue;
    }
    if (debut >= 0) {
      const largeurVide = i - debut;
      if (largeurVide >= LARGEUR_MIN && (!meilleure || largeurVide > meilleure.fin - meilleure.debut)) {
        meilleure = { debut, fin: i };
      }
      debut = -1;
    }
  }

  return meilleure;
}

function tailleMediane(lignes: LignePdf[]): number {
  const tailles = lignes.map((l) => l.taille).filter((t) => t > 0).sort((a, b) => a - b);
  return tailles.length === 0 ? 0 : tailles[Math.floor(tailles.length / 2)];
}

// Dans un PDF un titre n'est pas en majuscules : il est simplement composé plus grand.
// Le seuil reste élevé car un document très maquetté multiplie les tailles de police.
function estTitrePdf(ligne: LignePdf, tailleCorps: number): boolean {
  if (tailleCorps <= 0 || ligne.taille < tailleCorps * 1.35) return false;
  if (ligne.texte.length < 8 || ligne.texte.length > 100) return false;
  if (/[.;:,]$/.test(ligne.texte)) return false;

  const lettres = ligne.texte.replace(/[^A-Za-zÀ-ÿ]/g, '').length;
  return lettres >= 6 && lettres / ligne.texte.length > 0.5;
}
