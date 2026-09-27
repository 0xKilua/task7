// Sauvegarde à chaud : l'API backup() de better-sqlite3 produit une copie cohérente même
// si l'application écrit en même temps (WAL), sans verrouiller la base. Script en
// JavaScript simple, sans dépendance de développement : il tourne aussi dans l'image Docker.
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const BASE = process.env.MCC_DB_PATH ?? path.join(process.cwd(), 'data', 'app.db');
const DOSSIER = process.env.MCC_BACKUP_DIR ?? path.join(path.dirname(BASE), 'sauvegardes');
const RETENTION_JOURS = Number(process.env.MCC_BACKUP_RETENTION_JOURS ?? 30);

try {
  const db = new Database(BASE, { fileMustExist: true });
  fs.mkdirSync(DOSSIER, { recursive: true });
  const destination = path.join(DOSSIER, `app-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  await db.backup(destination);
  db.close();
  console.log(`Sauvegarde écrite : ${destination}`);

  const limite = Date.now() - RETENTION_JOURS * 86_400_000;
  let supprimees = 0;
  for (const fichier of fs.readdirSync(DOSSIER)) {
    const chemin = path.join(DOSSIER, fichier);
    if (/^app-.*\.db$/.test(fichier) && fs.statSync(chemin).mtimeMs < limite) {
      fs.unlinkSync(chemin);
      supprimees++;
    }
  }
  if (supprimees > 0) console.log(`${supprimees} sauvegarde(s) de plus de ${RETENTION_JOURS} jours supprimée(s).`);
} catch (erreur) {
  console.error(`Échec de la sauvegarde : ${erreur instanceof Error ? erreur.message : erreur}`);
  process.exit(1);
}
