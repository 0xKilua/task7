import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ingererDocument, VERSION_DECOUPAGE } from './ingest';
import { construireVocabulaire, reparerMotsCoupes } from './mots-coupes';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.MCC_DB_PATH ?? path.join(DATA_DIR, 'app.db');
// Contenus livrés avec l'application, hors du dossier de données (volume en production).
const CONTENUS_DIR = path.join(process.cwd(), 'contenus');

let instance: Database.Database | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS utilisateurs (
  id TEXT PRIMARY KEY,
  identifiant TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nom TEXT NOT NULL,
  mot_de_passe TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('conseiller', 'administrateur')),
  actif INTEGER NOT NULL DEFAULT 1,
  doit_changer_mot_de_passe INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  derniere_connexion TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  jeton TEXT PRIMARY KEY,
  utilisateur_id TEXT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expire_le TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_utilisateur ON sessions(utilisateur_id);

CREATE TABLE IF NOT EXISTS tentatives_connexion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifiant TEXT NOT NULL,
  ts TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tentatives_identifiant ON tentatives_connexion(identifiant, ts);

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

-- Vocabulaire indexé : la recherche y choisit les formes d'un mot (pluriel, féminin).
CREATE VIRTUAL TABLE IF NOT EXISTS passages_vocab USING fts5vocab(passages_fts, 'row');

-- Vecteurs de la recherche par le sens (float32), recalculés si le modèle change.
CREATE TABLE IF NOT EXISTS passages_vecteurs (
  passage_id INTEGER PRIMARY KEY REFERENCES passages(id) ON DELETE CASCADE,
  modele TEXT NOT NULL,
  vecteur BLOB NOT NULL
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
  conseiller_id TEXT REFERENCES utilisateurs(id) ON DELETE RESTRICT,
  reference TEXT NOT NULL,
  intitule TEXT,
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'en_attente', 'clos')),
  prochain_rdv TEXT,
  date_cloture TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- L'index sur conseiller_id est créé après migrerDossiers(), pas ici : sur une base
-- antérieure à l'authentification, CREATE TABLE IF NOT EXISTS ne fait rien (la table
-- existe déjà sans cette colonne), et l'index échouerait avant que la migration ne l'ajoute.

CREATE TABLE IF NOT EXISTS notes_suivi (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  date_echange TEXT NOT NULL,
  modalite TEXT NOT NULL CHECK (modalite IN ('entretien', 'telephone', 'visio', 'courriel', 'autre')),
  contenu TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_suivi_dossier ON notes_suivi(dossier_id, date_echange);

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
  conseiller_id TEXT REFERENCES utilisateurs(id) ON DELETE CASCADE,
  ts TEXT NOT NULL,
  requete TEXT NOT NULL,
  nb_resultats INTEGER NOT NULL
);
-- Même raison que pour dossiers : l'index est créé après migrerRecherches().

CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  action TEXT NOT NULL,
  cible TEXT,
  details TEXT,
  acteur_id TEXT
);

CREATE TABLE IF NOT EXISTS parametres (
  cle TEXT PRIMARY KEY,
  valeur TEXT NOT NULL
);
`;

export function getDb(): Database.Database {
  if (instance) return instance;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(SCHEMA);
  migrerDossiers(db);
  migrerSuiviDossiers(db);
  migrerDateCloture(db);
  migrerRecherches(db);
  migrerJournal(db);
  // Après migration : la colonne conseiller_id existe forcément, base neuve ou migrée.
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_dossiers_reference ON dossiers(conseiller_id, reference)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_recherches_conseiller ON recherches(conseiller_id, id)');
  reparerPassagesExistants(db);
  // La synchronisation passe par les fonctions d'ingestion, qui appellent getDb() : la
  // connexion doit être disponible avant.
  instance = db;
  // Désactivable pour les mesures qui doivent porter sur un seul document (évaluation).
  if (process.env.MCC_CONTENUS_LIVRES !== 'non') {
    synchroniserCatalogue(db);
    synchroniserSources(db);
  }
  return db;
}

function lireParametre(db: Database.Database, cle: string): string | null {
  const ligne = db.prepare('SELECT valeur FROM parametres WHERE cle = ?').get(cle) as { valeur: string } | undefined;
  return ligne?.valeur ?? null;
}

function ecrireParametre(db: Database.Database, cle: string, valeur: string) {
  db.prepare(
    'INSERT INTO parametres (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur',
  ).run(cle, valeur);
}

const empreinte = (contenu: Buffer) => crypto.createHash('sha256').update(contenu).digest('hex');

const COLONNES_FICHE = [
  'nom', 'categorie', 'objectif', 'public_concerne', 'conditions', 'demarches', 'acteurs',
  'points_vigilance', 'ressources', 'date_information', 'source', 'statut_verification',
] as const;

const empreinteFiche = (valeurs: unknown[]) => empreinte(Buffer.from(JSON.stringify(valeurs)));

function valeursSeed(item: DispositifSeed): unknown[] {
  return [
    item.nom, item.categorie, item.objectif ?? null, item.publicConcerne ?? null, item.conditions ?? null,
    item.demarches ?? null, item.acteurs ?? null, item.pointsVigilance ?? null, item.ressources ?? null,
    item.dateInformation ?? null, item.source ?? null,
    item.statutVerification === 'verifie_source' ? 'verifie_source' : 'non_verifie',
  ];
}

// Le catalogue livré est appliqué à chaque nouvelle version : fiches ajoutées ou corrigées
// arrivent sans commande. Une fiche vérifiée modifiée dans l'installation n'est jamais
// écrasée : le travail du conseiller prime. On la reconnaît à ce qu'elle ne correspond plus
// à la dernière version livrée, dont l'empreinte est conservée.
export function importerCatalogue(db: Database.Database, items: DispositifSeed[]) {
  const lire = db.prepare(`SELECT ${COLONNES_FICHE.join(', ')} FROM dispositifs WHERE id = ?`);
  const bilan = { ajoutees: 0, misesAJour: 0, preservees: 0 };
  db.transaction(() => {
    for (const item of items) {
      const ligne = lire.get(item.id) as Record<string, unknown> | undefined;
      const cle = `catalogue.fiche.${item.id}`;
      const livree = empreinteFiche(valeursSeed(item));
      if (ligne) {
        const actuelle = empreinteFiche(COLONNES_FICHE.map((c) => ligne[c]));
        if (actuelle === livree) {
          ecrireParametre(db, cle, livree);
          continue;
        }
        if (ligne.statut_verification === 'verifie_source' && lireParametre(db, cle) !== actuelle) {
          bilan.preservees++;
          continue;
        }
      }
      insererDispositif(db, item);
      ecrireParametre(db, cle, livree);
      if (ligne) bilan.misesAJour++;
      else bilan.ajoutees++;
    }
  })();
  return bilan;
}

// Un contenu livré illisible ne doit jamais empêcher l'application de démarrer.
function synchroniserCatalogue(db: Database.Database) {
  const chemin = path.join(CONTENUS_DIR, 'dispositifs.seed.json');
  try {
    if (!fs.existsSync(chemin)) return;
    const contenu = fs.readFileSync(chemin);
    const version = empreinte(contenu);
    if (lireParametre(db, 'catalogue.empreinte') === version) return;
    const bilan = importerCatalogue(db, JSON.parse(contenu.toString('utf8')) as DispositifSeed[]);
    ecrireParametre(db, 'catalogue.empreinte', version);
    journaliser('dispositifs.import', undefined, `${bilan.ajoutees} ajoutées, ${bilan.misesAJour} mises à jour, ${bilan.preservees} préservées`);
  } catch (erreur) {
    console.error('Catalogue de dispositifs non mis à jour :', erreur instanceof Error ? erreur.message : erreur);
  }
}

interface SourceLivree {
  fichier: string;
  titre: string;
  source: string;
  url: string;
  datePublication: string;
  statut: 'officiel' | 'a_verifier';
}

export function lireSourcesLivrees(): { dossier: string; sources: SourceLivree[] } {
  const dossier = path.join(CONTENUS_DIR, 'sources');
  const manifeste = path.join(dossier, 'sources.json');
  return { dossier, sources: fs.existsSync(manifeste) ? (JSON.parse(fs.readFileSync(manifeste, 'utf8')) as SourceLivree[]) : [] };
}

// Les textes officiels livrés sont ingérés à chaque nouvelle version du fichier. Un texte
// retiré depuis la base documentaire ne revient qu'avec une version plus récente.
function synchroniserSources(db: Database.Database) {
  const { dossier, sources } = lireSourcesLivrees();
  for (const s of sources) {
    const chemin = path.join(dossier, s.fichier);
    try {
      const contenu = fs.readFileSync(chemin);
      const cle = `source.${s.fichier}.empreinte`;
      const version = `${empreinte(contenu)}:${VERSION_DECOUPAGE}`;
      if (lireParametre(db, cle) === version) continue;
      ingererDocument({ ...s }, [{ page: null, texte: contenu.toString('utf8') }]);
      ecrireParametre(db, cle, version);
    } catch (erreur) {
      console.error(`Texte officiel « ${s.titre} » non ingéré :`, erreur instanceof Error ? erreur.message : erreur);
    }
  }
}

// Les bases créées avant l'authentification n'ont pas de propriétaire de dossier, et
// contraignent la référence à être unique globalement — ce qui révélerait à un conseiller
// qu'un autre utilise déjà cette référence.
function migrerDossiers(db: Database.Database) {
  const colonnes = db.prepare('PRAGMA table_info(dossiers)').all() as { name: string }[];
  if (colonnes.length === 0 || colonnes.some((c) => c.name === 'conseiller_id')) return;

  db.pragma('foreign_keys = OFF');
  try {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE dossiers_migres (
          id TEXT PRIMARY KEY,
          conseiller_id TEXT REFERENCES utilisateurs(id) ON DELETE RESTRICT,
          reference TEXT NOT NULL,
          intitule TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        INSERT INTO dossiers_migres (id, conseiller_id, reference, intitule, created_at, updated_at)
          SELECT id, NULL, reference, intitule, created_at, updated_at FROM dossiers;
        DROP TABLE dossiers;
        ALTER TABLE dossiers_migres RENAME TO dossiers;
      `);
      const anomalies = db.pragma('foreign_key_check') as unknown[];
      if (anomalies.length > 0) throw new Error('Migration des dossiers interrompue : intégrité rompue.');
    })();
  } finally {
    db.pragma('foreign_keys = ON');
  }
}

function migrerSuiviDossiers(db: Database.Database) {
  const colonnes = db.prepare('PRAGMA table_info(dossiers)').all() as { name: string }[];
  if (colonnes.some((c) => c.name === 'statut')) return;
  db.transaction(() => {
    db.exec(
      "ALTER TABLE dossiers ADD COLUMN statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'en_attente', 'clos'))",
    );
    db.exec('ALTER TABLE dossiers ADD COLUMN prochain_rdv TEXT');
  })();
}

// La durée de conservation court à partir de la clôture : un dossier déjà clos reçoit
// comme date de clôture sa dernière modification, borne la plus prudente disponible.
function migrerDateCloture(db: Database.Database) {
  const colonnes = db.prepare('PRAGMA table_info(dossiers)').all() as { name: string }[];
  if (colonnes.some((c) => c.name === 'date_cloture')) return;
  db.transaction(() => {
    db.exec('ALTER TABLE dossiers ADD COLUMN date_cloture TEXT');
    db.exec("UPDATE dossiers SET date_cloture = updated_at WHERE statut = 'clos'");
  })();
}

// Sans auteur, le journal dit ce qui s'est passé mais pas qui l'a fait.
function migrerJournal(db: Database.Database) {
  const colonnes = db.prepare('PRAGMA table_info(journal)').all() as { name: string }[];
  if (colonnes.some((c) => c.name === 'acteur_id')) return;
  db.exec('ALTER TABLE journal ADD COLUMN acteur_id TEXT');
}

// Une requête de recherche est saisie en traitant le dossier d'un agent : elle relève du
// conseiller qui l'a tapée, pas du service.
function migrerRecherches(db: Database.Database) {
  const colonnes = db.prepare('PRAGMA table_info(recherches)').all() as { name: string }[];
  if (colonnes.length === 0 || colonnes.some((c) => c.name === 'conseiller_id')) return;
  db.exec('ALTER TABLE recherches ADD COLUMN conseiller_id TEXT REFERENCES utilisateurs(id) ON DELETE CASCADE');
}

// Les documents ingérés avant la réparation des mots coupés sont corrigés une fois, sur
// place : le PDF d'origine n'est pas conservé, et les identifiants de passage restent
// stables pour ne pas invalider les citations. Réinsérer la ligne met l'index FTS à jour.
function reparerPassagesExistants(db: Database.Database) {
  const CLE = 'migration.mots_coupes_v1';
  if (db.prepare('SELECT 1 FROM parametres WHERE cle = ?').get(CLE)) return;
  db.transaction(() => {
    const documents = db.prepare('SELECT id FROM documents').all() as { id: string }[];
    for (const { id } of documents) {
      const passages = db
        .prepare('SELECT id, document_id, ordre, titre_section, contenu, page FROM passages WHERE document_id = ?')
        .all(id) as { id: number; document_id: string; ordre: number; titre_section: string | null; contenu: string; page: number | null }[];
      const vocabulaire = construireVocabulaire(passages.map((p) => p.contenu));
      for (const p of passages) {
        const contenu = reparerMotsCoupes(p.contenu, vocabulaire);
        const titre = p.titre_section === null ? null : reparerMotsCoupes(p.titre_section, vocabulaire);
        if (contenu === p.contenu && titre === p.titre_section) continue;
        db.prepare('DELETE FROM passages WHERE id = ?').run(p.id);
        db.prepare('INSERT INTO passages (id, document_id, ordre, titre_section, contenu, page) VALUES (?, ?, ?, ?, ?, ?)')
          .run(p.id, p.document_id, p.ordre, titre, contenu, p.page);
      }
    }
    db.prepare('INSERT INTO parametres (cle, valeur) VALUES (?, ?)').run(CLE, new Date().toISOString());
  })();
}

export interface DispositifSeed {
  id: string;
  nom: string;
  categorie: string;
  objectif?: string | null;
  publicConcerne?: string | null;
  conditions?: string | null;
  demarches?: string | null;
  acteurs?: string | null;
  pointsVigilance?: string | null;
  ressources?: string | null;
  dateInformation?: string | null;
  source?: string | null;
  statutVerification?: string | null;
}

export function lireSeedDispositifs(chemin = path.join(CONTENUS_DIR, 'dispositifs.seed.json')): DispositifSeed[] {
  return JSON.parse(fs.readFileSync(chemin, 'utf8')) as DispositifSeed[];
}

export function insererDispositif(db: Database.Database, item: DispositifSeed) {
  db.prepare(
    `INSERT INTO dispositifs (id, nom, categorie, objectif, public_concerne, conditions,
       demarches, acteurs, points_vigilance, ressources, date_information, source, statut_verification)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nom = excluded.nom, categorie = excluded.categorie, objectif = excluded.objectif,
       public_concerne = excluded.public_concerne, conditions = excluded.conditions,
       demarches = excluded.demarches, acteurs = excluded.acteurs,
       points_vigilance = excluded.points_vigilance, ressources = excluded.ressources,
       date_information = excluded.date_information, source = excluded.source,
       statut_verification = excluded.statut_verification`,
  ).run(
    item.id,
    item.nom,
    item.categorie,
    item.objectif ?? null,
    item.publicConcerne ?? null,
    item.conditions ?? null,
    item.demarches ?? null,
    item.acteurs ?? null,
    item.pointsVigilance ?? null,
    item.ressources ?? null,
    item.dateInformation ?? null,
    item.source ?? null,
    item.statutVerification === 'verifie_source' ? 'verifie_source' : 'non_verifie',
  );
}

// Le journal ne doit contenir aucune donnée sur les agents : identifiants techniques et
// nature de l'action seulement, jamais une référence de dossier ni un contenu saisi.
export function journaliser(action: string, cible?: string, details?: string, acteurId?: string) {
  getDb()
    .prepare('INSERT INTO journal (ts, action, cible, details, acteur_id) VALUES (?, ?, ?, ?, ?)')
    .run(new Date().toISOString(), action, cible ?? null, details ?? null, acteurId ?? null);
}

export function nouvelId(prefixe: string): string {
  return `${prefixe}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
