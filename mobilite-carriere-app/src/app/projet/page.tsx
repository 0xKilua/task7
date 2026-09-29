import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { Marked, type Tokens } from 'marked';
import { Carte, EtatVide, TitrePage } from '@/components/ui';
import { exigerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DOCUMENTS = [
  { cle: 'cahier', libelle: 'Cahier des charges', fichier: 'README.md' },
  { cle: 'roadmap', libelle: 'Roadmap', fichier: 'ROADMAP.md' },
] as const;

const RACINE_DOCS = path.join(process.cwd(), '..', 'docs', 'conseiller-mobilite-carriere');

// Tableaux : chaque cellule porte l'intitulé de sa colonne. Sur téléphone, chaque ligne s'affiche
// en fiche, valeurs précédées de leur intitulé (voir globals.css) ; sur écran large, tableau
// classique, dans un cadre qui défile s'il est trop large.
const rendu = new Marked({
  renderer: {
    table(tableau: Tokens.Table) {
      const alignement = (a: Tokens.TableCell['align']) => (a ? ` align="${a}"` : '');
      const entetes = tableau.header.map((cellule) => this.parser.parseInline(cellule.tokens));
      // Texte déjà échappé par marked : sans balises, il peut servir de valeur d'attribut.
      const intitules = entetes.map((html) => html.replace(/<[^>]*>/g, ''));
      const tete = tableau.header.map((c, i) => `<th${alignement(c.align)}>${entetes[i]}</th>`).join('');
      const lignes = tableau.rows
        .map(
          (ligne) =>
            `<tr>${ligne
              .map(
                (c, i) =>
                  `<td data-colonne="${intitules[i] ?? ''}"${alignement(c.align)}>${this.parser.parseInline(c.tokens)}</td>`,
              )
              .join('')}</tr>`,
        )
        .join('');
      return `<div class="tableau-defilant"><table><thead><tr>${tete}</tr></thead><tbody>${lignes}</tbody></table></div>\n`;
    },
  },
});

export default async function PageProjet(props: { searchParams: Promise<{ doc?: string }> }) {
  const searchParams = await props.searchParams;
  await exigerSession();
  const selection = DOCUMENTS.find((d) => d.cle === searchParams.doc) ?? DOCUMENTS[0];
  const chemin = path.join(RACINE_DOCS, selection.fichier);
  const existe = fs.existsSync(chemin);
  const html = existe ? rendu.parse(fs.readFileSync(chemin, 'utf8'), { async: false }) : '';

  return (
    <>
      <TitrePage
        titre="Documentation projet"
        chapo="Cahier des charges et roadmap du projet, rendus depuis les fichiers du dépôt."
      />

      <nav aria-label="Documents du projet" className="mb-4 flex flex-wrap gap-2">
        {DOCUMENTS.map((doc) => (
          <Link
            key={doc.cle}
            href={`/projet?doc=${doc.cle}`}
            className={`rounded px-3 py-2 text-sm font-medium ${
              doc.cle === selection.cle
                ? 'bg-etat-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {doc.libelle}
          </Link>
        ))}
      </nav>

      <Carte>
        {existe ? (
          <article className="prose-doc max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <EtatVide titre="Document introuvable">
            Le fichier <code>{path.relative(process.cwd(), chemin)}</code> n&apos;est pas présent
            dans le dépôt.
          </EtatVide>
        )}
      </Carte>
    </>
  );
}
