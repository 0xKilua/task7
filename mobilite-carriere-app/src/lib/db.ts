import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.MCC_DB_PATH ?? path.join(DATA_DIR, 'app.db');

let instance: Database.Database | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT,
  date_publication TEXT,
  date_ingestion TEXT NOT NULL,
  statut TEXT NOT NULL CHECK (statut IN ('officiel', 'a_verifier')),
  fichier TEXT,
  nb_passages INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS passages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  titre_section TEXT,
  contenu TEXT NOT NULL,
  page INTEGER
);

CREATE INDEX IF NOT EXISTS idx_passages_document ON passages(document_id);

CREATE VIRTUAL TABLE IF NOT EXISTS passages_fts USING fts5(
  contenu,
  titre_section,
  content='passages',
  content_rowid='id',
  tokenize="unicode61 remove_diacritics 2"
);

CREATE TRIGGER IF NOT EXISTS passages_ai AFTER INSERT ON passages BEGIN
  INSERT INTO passages_fts(rowid, contenu, titre_section)
  VALUES (new.id, new.contenu, new.titre_section);
END;

CREATE TRIGGER IF NOT EXISTS passages_ad AFTER DELETE ON passages BEGIN
  INSERT INTO passages_fts(passages_fts, rowid, contenu, titre_section)
  VALUES ('delete', old.id, old.contenu, old.titre_section);
END;

CREATE TABLE IF NOT EXISTS dispositifs (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  objectif TEXT,
  public_concerne TEXT,
  conditions TEXT,
  demarches TEXT,
  acteurs TEXT,
  points_vigilance TEXT,
  ressources TEXT,
  date_information TEXT,
  source TEXT,
  statut_verification TEXT NOT NULL CHECK (statut_verification IN ('verifie_source', 'non_verifie'))
);

CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  intitule TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diagnostics (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  synthese TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bilans (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  synthese TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entretiens (
  id TEXT PRIMARY KEY,
  dossier_id TEXT REFERENCES dossiers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  trame TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recherches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  requete TEXT NOT NULL,
  nb_resultats INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  action TEXT NOT NULL,
  cible TEXT,
  details TEXT
);
`;

export function getDb(): Database.Database {
  if (instance) return instance;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(SCHEMA);
  seedDispositifs(db);
  instance = db;
  return db;
}

function seedDispositifs(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM dispositifs').get() as { n: number };
  if (count.n > 0) return;

  const seedPath = path.join(DATA_DIR, 'dispositifs.seed.json');
  if (!fs.existsSync(seedPath)) return;

  const rows = JSON.parse(fs.readFileSync(seedPath, 'utf8')) as {
    id: string;
    nom: string;
    categorie: string;
  }[];

  const insert = db.prepare(`
    INSERT INTO dispositifs (id, nom, categorie, objectif, public_concerne, conditions,
      demarches, acteurs, points_vigilance, ressources, date_information, source, statut_verification)
    VALUES (@id, @nom, @categorie, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'non_verifie')
  `);

  const tx = db.transaction((items: typeof rows) => {
    for (const item of items) insert.run(item);
  });
  tx(rows);
}

export function journaliser(action: string, cible?: string, details?: string) {
  getDb()
    .prepare('INSERT INTO journal (ts, action, cible, details) VALUES (?, ?, ?, ?)')
    .run(new Date().toISOString(), action, cible ?? null, details ?? null);
}

export function nouvelId(prefixe: string): string {
  return `${prefixe}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
