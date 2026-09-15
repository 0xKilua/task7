import path from 'node:path';
import { extraireTexte } from '../src/lib/extract';
import { ingererDocument } from '../src/lib/ingest';

function argument(nom: string): string | undefined {
  const index = process.argv.indexOf(`--${nom}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const fichier = argument('fichier');
  if (!fichier) {
    console.error(
      'Usage : npm run ingest -- --fichier <chemin> [--titre <titre>] [--source <source>] [--url <url>] [--date <date>] [--statut officiel|a_verifier]',
    );
    process.exit(1);
  }

  const chemin = path.resolve(fichier);
  const pages = await extraireTexte(chemin);

  const resultat = ingererDocument(
    {
      titre: argument('titre') ?? path.basename(chemin),
      source: argument('source') ?? 'Source non précisée',
      url: argument('url') ?? null,
      datePublication: argument('date') ?? null,
      statut: argument('statut') === 'a_verifier' ? 'a_verifier' : 'officiel',
      fichier: path.basename(chemin),
    },
    pages,
  );

  console.log(
    `${resultat.remplace ? 'Document remplacé' : 'Document ingéré'} : ${resultat.nbPassages} passages indexés (id ${resultat.documentId}).`,
  );
}

main().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
