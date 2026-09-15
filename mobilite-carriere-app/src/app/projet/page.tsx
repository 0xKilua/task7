import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { marked } from 'marked';
import { Carte, EtatVide, TitrePage } from '@/components/ui';
import { exigerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DOCUMENTS = [
  { cle: 'cahier', libelle: 'Cahier des charges', fichier: 'README.md' },
  { cle: 'roadmap', libelle: 'Roadmap', fichier: 'ROADMAP.md' },
] as const;

const RACINE_DOCS = path.join(process.cwd(), '..', 'docs', 'conseiller-mobilite-carriere');

export default function PageProjet({ searchParams }: { searchParams: { doc?: string } }) {
  exigerSession();
  const selection = DOCUMENTS.find((d) => d.cle === searchParams.doc) ?? DOCUMENTS[0];
  const chemin = path.join(RACINE_DOCS, selection.fichier);
  const existe = fs.existsSync(chemin);
  const html = existe ? marked.parse(fs.readFileSync(chemin, 'utf8'), { async: false }) : '';

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
