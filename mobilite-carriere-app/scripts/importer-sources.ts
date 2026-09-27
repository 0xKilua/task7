import fs from 'node:fs';
import path from 'node:path';
import { getDb, lireSourcesLivrees } from '../src/lib/db';
import { ingererDocument } from '../src/lib/ingest';

// Les textes officiels livrés (contenus/sources) sont déjà ingérés automatiquement au
// démarrage à chaque nouvelle version ; cette commande les réingère à la demande.
getDb();
const { dossier, sources } = lireSourcesLivrees();
for (const s of sources) {
  const texte = fs.readFileSync(path.join(dossier, s.fichier), 'utf8');
  const r = ingererDocument({ ...s }, [{ page: null, texte }]);
  console.log(`${r.remplace ? 'Mis à jour' : 'Ingéré'} : « ${s.titre} » — ${r.nbPassages} passages.`);
}
