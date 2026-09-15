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
}

interface LignePdf {
  texte: string;
  taille: number;
}

// Le texte PDF arrive en fragments positionnés : on regroupe par ordonnée pour
// restituer les sauts de ligne, sans lesquels les titres de section sont indétectables.
function reconstruireLignes(items: ItemPdf[]): LignePdf[] {
  const TOLERANCE_Y = 2;
  const lignes: { y: number; taille: number; fragments: string[] }[] = [];

  for (const item of items) {
    if (item.str.trim().length === 0) continue;
    const y = item.transform?.[5] ?? lignes[lignes.length - 1]?.y ?? 0;
    const taille = item.height ?? item.transform?.[0] ?? 0;
    const ligne = lignes.find((l) => Math.abs(l.y - y) <= TOLERANCE_Y);
    if (ligne) {
      ligne.fragments.push(item.str);
      ligne.taille = Math.max(ligne.taille, taille);
    } else {
      lignes.push({ y, taille, fragments: [item.str] });
    }
  }

  return lignes
    .sort((a, b) => b.y - a.y)
    .map((l) => ({ texte: l.fragments.join(' ').replace(/\s+/g, ' ').trim(), taille: l.taille }))
    .filter((l) => l.texte.length > 0);
}

function tailleMediane(lignes: LignePdf[]): number {
  const tailles = lignes.map((l) => l.taille).filter((t) => t > 0).sort((a, b) => a - b);
  return tailles.length === 0 ? 0 : tailles[Math.floor(tailles.length / 2)];
}

// Dans un PDF un titre n'est pas en majuscules : il est simplement composé plus grand.
function estTitrePdf(ligne: LignePdf, tailleCorps: number): boolean {
  if (tailleCorps <= 0 || ligne.taille < tailleCorps * 1.15) return false;
  return ligne.texte.length <= 120 && !/[.;:,]$/.test(ligne.texte);
}
