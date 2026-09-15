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

  const pages: string[] = [];
  await pdfParse(buffer, {
    pagerender: async (pageData: {
      getTextContent: (opts: Record<string, boolean>) => Promise<{ items: { str: string }[] }>;
    }) => {
      const contenu = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });
      const texte = contenu.items.map((item) => item.str).join(' ');
      pages.push(texte);
      return texte;
    },
  });

  return pages.map((texte, index) => ({ page: index + 1, texte }));
}
