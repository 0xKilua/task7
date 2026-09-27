import fs from 'node:fs';
import path from 'node:path';
import { journaliser } from '../src/lib/db';
import { extraireTexte } from '../src/lib/extract';
import { ingererDocument } from '../src/lib/ingest';

// Ingère les textes officiels livrés avec l'application (data/sources). Relancer la
// commande remplace chaque texte par sa version livrée, sans toucher aux autres documents.
interface Source {
  fichier: string;
  titre: string;
  source: string;
  url: string;
  datePublication: string;
  statut: 'officiel' | 'a_verifier';
}

async function main() {
  const dossier = path.join(process.cwd(), 'data', 'sources');
  const sources = JSON.parse(fs.readFileSync(path.join(dossier, 'sources.json'), 'utf8')) as Source[];
  for (const s of sources) {
    const pages = await extraireTexte(path.join(dossier, s.fichier));
    const r = ingererDocument({ ...s, fichier: s.fichier }, pages);
    console.log(`${r.remplace ? 'Mis à jour' : 'Ingéré'} : « ${s.titre} » — ${r.nbPassages} passages.`);
  }
  journaliser('sources.import', undefined, `${sources.length} texte(s)`);
}

main().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
