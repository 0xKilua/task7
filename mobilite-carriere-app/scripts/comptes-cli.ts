import { getDb, journaliser } from '../src/lib/db';
import { hacherMotDePasse, validerMotDePasse } from '../src/lib/auth';

function argument(nom: string): string | undefined {
  const index = process.argv.indexOf(`--${nom}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

type LigneUtilisateur = {
  id: string;
  identifiant: string;
  nom: string;
  role: string;
  actif: number;
  created_at: string;
  derniere_connexion: string | null;
};

function lister() {
  const db = getDb();
  const lignes = db
    .prepare(
      'SELECT id, identifiant, nom, role, actif, created_at, derniere_connexion FROM utilisateurs ORDER BY created_at',
    )
    .all() as LigneUtilisateur[];

  if (lignes.length === 0) {
    console.log("Aucun compte n'existe dans cette base. Ouvre l'application : elle redirigera vers /installation.");
    return;
  }

  console.log(`${lignes.length} compte(s) dans cette base :\n`);
  for (const l of lignes) {
    const derniere = l.derniere_connexion ? `dernière connexion ${l.derniere_connexion.slice(0, 10)}` : 'jamais connecté';
    console.log(
      `- ${l.identifiant}  —  ${l.nom}  (${l.role}, ${l.actif ? 'actif' : 'désactivé'})  —  créé le ${l.created_at.slice(0, 10)}, ${derniere}`,
    );
  }
  console.log(
    "\nLe mot de passe n'est jamais affiché (il n'est même pas conservé en clair en base) : utilise" +
      ' "npm run comptes:reinitialiser" pour en fixer un nouveau sur un identifiant ci-dessus.',
  );
}

function reinitialiser() {
  const identifiant = argument('identifiant');
  const motDePasse = argument('mot-de-passe');
  if (!identifiant || !motDePasse) {
    console.error(
      'Usage : npm run comptes:reinitialiser -- --identifiant <identifiant> --mot-de-passe <nouveau mot de passe>',
    );
    process.exit(1);
  }

  const invalide = validerMotDePasse(motDePasse);
  if (invalide) {
    console.error(invalide);
    process.exit(1);
  }

  const db = getDb();
  const ligne = db.prepare('SELECT id FROM utilisateurs WHERE identifiant = ?').get(identifiant) as
    | { id: string }
    | undefined;

  if (!ligne) {
    console.error(
      `Aucun compte avec l'identifiant « ${identifiant} ». Utilise "npm run comptes:lister" pour voir les identifiants existants.`,
    );
    process.exit(1);
  }

  db.prepare('UPDATE utilisateurs SET mot_de_passe = ?, doit_changer_mot_de_passe = 1 WHERE id = ?').run(
    hacherMotDePasse(motDePasse),
    ligne.id,
  );
  journaliser('mot_de_passe.reinitialise_cli', ligne.id);

  console.log(
    `Mot de passe réinitialisé pour « ${identifiant} ». Un changement de mot de passe sera demandé dès la prochaine connexion.`,
  );
}

function main() {
  const commande = process.argv[2];
  if (commande === 'lister') return lister();
  if (commande === 'reinitialiser') return reinitialiser();

  console.error('Usage :');
  console.error('  npm run comptes:lister');
  console.error('  npm run comptes:reinitialiser -- --identifiant <identifiant> --mot-de-passe <nouveau mot de passe>');
  process.exit(1);
}

main();
