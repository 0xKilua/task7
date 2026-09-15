import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getDb, journaliser, nouvelId } from './db';

export const COOKIE_SESSION = 'mcc_session';

const DUREE_SESSION_HEURES = 12;
const LONGUEUR_MOT_DE_PASSE_MIN = 12;
const TENTATIVES_MAX = 5;
const FENETRE_TENTATIVES_MINUTES = 15;

const SCRYPT_N = 16384;
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const SCRYPT_LONGUEUR = 64;
// scrypt consomme 128 × N × r octets, soit 32 Mo ici : exactement la limite par défaut
// de Node, qui rejetterait le calcul.
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

export type RoleUtilisateur = 'conseiller' | 'administrateur';

export interface Utilisateur {
  id: string;
  identifiant: string;
  nom: string;
  role: RoleUtilisateur;
  actif: boolean;
  doitChangerMotDePasse: boolean;
  createdAt: string;
  derniereConnexion: string | null;
}

type LigneUtilisateur = {
  id: string;
  identifiant: string;
  nom: string;
  mot_de_passe: string;
  role: string;
  actif: number;
  doit_changer_mot_de_passe: number;
  created_at: string;
  derniere_connexion: string | null;
};

function versUtilisateur(l: LigneUtilisateur): Utilisateur {
  return {
    id: l.id,
    identifiant: l.identifiant,
    nom: l.nom,
    role: l.role === 'administrateur' ? 'administrateur' : 'conseiller',
    actif: l.actif === 1,
    doitChangerMotDePasse: l.doit_changer_mot_de_passe === 1,
    createdAt: l.created_at,
    derniereConnexion: l.derniere_connexion,
  };
}

export function hacherMotDePasse(motDePasse: string): string {
  const sel = crypto.randomBytes(16);
  const derive = crypto.scryptSync(motDePasse.normalize('NFKC'), sel, SCRYPT_LONGUEUR, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
    maxmem: SCRYPT_MAXMEM,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${sel.toString('hex')}$${derive.toString('hex')}`;
}

export function verifierMotDePasse(motDePasse: string, stocke: string): boolean {
  const parties = stocke.split('$');
  if (parties.length !== 6 || parties[0] !== 'scrypt') return false;

  const [, n, r, p, selHex, attenduHex] = parties;
  const attendu = Buffer.from(attenduHex, 'hex');
  if (attendu.length === 0) return false;

  const derive = crypto.scryptSync(motDePasse.normalize('NFKC'), Buffer.from(selHex, 'hex'), attendu.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT_MAXMEM,
  });
  return crypto.timingSafeEqual(derive, attendu);
}

export function validerMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < LONGUEUR_MOT_DE_PASSE_MIN) {
    return `Le mot de passe doit comporter au moins ${LONGUEUR_MOT_DE_PASSE_MIN} caractères.`;
  }
  if (motDePasse.length > 200) return 'Le mot de passe est trop long.';
  return null;
}

function empreinteJeton(jeton: string): string {
  return crypto.createHash('sha256').update(jeton).digest('hex');
}

export function creerUtilisateur(
  identifiant: string,
  nom: string,
  motDePasse: string,
  role: RoleUtilisateur,
  doitChangerMotDePasse = false,
): Utilisateur {
  const db = getDb();
  const id = nouvelId('usr');
  const maintenant = new Date().toISOString();

  db.prepare(
    `INSERT INTO utilisateurs (id, identifiant, nom, mot_de_passe, role, actif, doit_changer_mot_de_passe, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
  ).run(id, identifiant.trim(), nom.trim(), hacherMotDePasse(motDePasse), role, doitChangerMotDePasse ? 1 : 0, maintenant);

  journaliser('utilisateur.creation', id, role);
  return {
    id,
    identifiant: identifiant.trim(),
    nom: nom.trim(),
    role,
    actif: true,
    doitChangerMotDePasse,
    createdAt: maintenant,
    derniereConnexion: null,
  };
}

export function aucunUtilisateur(): boolean {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM utilisateurs').get() as { n: number };
  return row.n === 0;
}

function tropDeTentatives(identifiant: string): boolean {
  const depuis = new Date(Date.now() - FENETRE_TENTATIVES_MINUTES * 60_000).toISOString();
  const row = getDb()
    .prepare('SELECT COUNT(*) AS n FROM tentatives_connexion WHERE identifiant = ? AND ts > ?')
    .get(identifiant.toLowerCase(), depuis) as { n: number };
  return row.n >= TENTATIVES_MAX;
}

function enregistrerTentative(identifiant: string) {
  getDb()
    .prepare('INSERT INTO tentatives_connexion (identifiant, ts) VALUES (?, ?)')
    .run(identifiant.toLowerCase(), new Date().toISOString());
}

function purgerTentatives(identifiant: string) {
  getDb().prepare('DELETE FROM tentatives_connexion WHERE identifiant = ?').run(identifiant.toLowerCase());
}

export type ResultatConnexion =
  | { ok: true; utilisateur: Utilisateur; jeton: string }
  | { ok: false; message: string };

export function connecter(identifiant: string, motDePasse: string): ResultatConnexion {
  const db = getDb();
  const saisi = identifiant.trim();

  if (tropDeTentatives(saisi)) {
    return {
      ok: false,
      message: `Trop de tentatives infructueuses. Réessayez dans ${FENETRE_TENTATIVES_MINUTES} minutes.`,
    };
  }

  const ligne = db
    .prepare('SELECT * FROM utilisateurs WHERE identifiant = ?')
    .get(saisi) as LigneUtilisateur | undefined;

  // Le mot de passe est vérifié même sans compte correspondant : sans cela, le temps de
  // réponse révélerait quels identifiants existent.
  const referenceFactice =
    'scrypt$16384$8$1$00000000000000000000000000000000$' + '0'.repeat(128);
  const valide = verifierMotDePasse(motDePasse, ligne?.mot_de_passe ?? referenceFactice);

  if (!ligne || !valide || ligne.actif !== 1) {
    enregistrerTentative(saisi);
    // L'identifiant n'est pas journalisé : un mot de passe saisi par erreur dans ce
    // champ se retrouverait en clair dans un écran que l'administrateur consulte.
    journaliser('connexion.echec');
    return { ok: false, message: 'Identifiant ou mot de passe incorrect.' };
  }

  purgerTentatives(saisi);

  const jeton = crypto.randomBytes(32).toString('hex');
  const maintenant = new Date();
  const expiration = new Date(maintenant.getTime() + DUREE_SESSION_HEURES * 3_600_000);

  db.prepare('INSERT INTO sessions (jeton, utilisateur_id, created_at, expire_le) VALUES (?, ?, ?, ?)').run(
    empreinteJeton(jeton),
    ligne.id,
    maintenant.toISOString(),
    expiration.toISOString(),
  );
  db.prepare('UPDATE utilisateurs SET derniere_connexion = ? WHERE id = ?').run(
    maintenant.toISOString(),
    ligne.id,
  );
  db.prepare('DELETE FROM sessions WHERE expire_le < ?').run(maintenant.toISOString());

  journaliser('connexion.reussie', ligne.id);
  return { ok: true, utilisateur: versUtilisateur(ligne), jeton };
}

export function deconnecter(jeton: string) {
  getDb().prepare('DELETE FROM sessions WHERE jeton = ?').run(empreinteJeton(jeton));
}

export function deconnecterToutesLesSessions(utilisateurId: string) {
  getDb().prepare('DELETE FROM sessions WHERE utilisateur_id = ?').run(utilisateurId);
}

export function utilisateurDuJeton(jeton: string): Utilisateur | null {
  const ligne = getDb()
    .prepare(
      `SELECT u.* FROM sessions s
         JOIN utilisateurs u ON u.id = s.utilisateur_id
        WHERE s.jeton = ? AND s.expire_le > ? AND u.actif = 1`,
    )
    .get(empreinteJeton(jeton), new Date().toISOString()) as LigneUtilisateur | undefined;
  return ligne ? versUtilisateur(ligne) : null;
}

export function sessionCourante(): Utilisateur | null {
  const jeton = cookies().get(COOKIE_SESSION)?.value;
  return jeton ? utilisateurDuJeton(jeton) : null;
}

// Le middleware ne peut pas interroger la base : toute page et toute action serveur
// doivent donc revalider la session elles-mêmes.
export function exigerSession(): Utilisateur {
  const utilisateur = sessionCourante();
  if (!utilisateur) redirect('/connexion');
  return utilisateur;
}

export function exigerAdministrateur(): Utilisateur {
  const utilisateur = exigerSession();
  if (utilisateur.role !== 'administrateur') notFound();
  return utilisateur;
}

export function motDePasseValide(utilisateurId: string, motDePasse: string): boolean {
  const ligne = getDb()
    .prepare('SELECT mot_de_passe FROM utilisateurs WHERE id = ?')
    .get(utilisateurId) as { mot_de_passe: string } | undefined;
  return ligne ? verifierMotDePasse(motDePasse, ligne.mot_de_passe) : false;
}

export function changerMotDePasse(utilisateurId: string, nouveau: string) {
  getDb()
    .prepare('UPDATE utilisateurs SET mot_de_passe = ?, doit_changer_mot_de_passe = 0 WHERE id = ?')
    .run(hacherMotDePasse(nouveau), utilisateurId);
  journaliser('mot_de_passe.change', utilisateurId);
}
