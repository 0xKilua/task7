import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../src/lib/db';

// Sauvegarde à chaud : l'API backup() de better-sqlite3 produit une copie cohérente
// même si l'application écrit en même temps (WAL), sans verrouiller la base.

const DOSSIER_SAUVEGARDES = process.env.MCC_BACKUP_DIR ?? path.join(process.cwd(), 'data', 'sauvegardes');
const RETENTION_JOURS = Number(process.env.MCC_BACKUP_RETENTION_JOURS ?? 30);

function horodatage(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main() {
  fs.mkdirSync(DOSSIER_SAUVEGARDES, { recursive: true });
  const destination = path.join(DOSSIER_SAUVEGARDES, `app-${horodatage()}.db`);

  const db = getDb();
  await db.backup(destination);
  console.log(`Sauvegarde écrite : ${destination}`);

  const limite = Date.now() - RETENTION_JOURS * 86_400_000;
  const fichiers = fs
    .readdirSync(DOSSIER_SAUVEGARDES)
    .filter((f) => f.startsWith('app-') && f.endsWith('.db'));

  let supprimes = 0;
  for (const fichier of fichiers) {
    const chemin = path.join(DOSSIER_SAUVEGARDES, fichier);
    if (fs.statSync(chemin).mtimeMs < limite) {
      fs.unlinkSync(chemin);
      supprimes++;
    }
  }
  if (supprimes > 0) console.log(`${supprimes} sauvegarde(s) de plus de ${RETENTION_JOURS} jours supprimée(s).`);
}

main().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
