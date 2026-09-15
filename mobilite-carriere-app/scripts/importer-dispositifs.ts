import { getDb, insererDispositif, lireSeedDispositifs, journaliser } from '../src/lib/db';

function main() {
  const db = getDb();
  const seed = lireSeedDispositifs();

  const existants = db
    .prepare('SELECT id, statut_verification FROM dispositifs')
    .all() as { id: string; statut_verification: string }[];
  const documentesParLeConseiller = new Set(
    existants.filter((d) => d.statut_verification === 'verifie_source').map((d) => d.id),
  );

  let ajoutes = 0;
  let mis_a_jour = 0;
  let preserves = 0;

  const tx = db.transaction(() => {
    for (const item of seed) {
      // Une fiche déjà documentée dans cette installation a pu l'être par le conseiller :
      // on ne l'écrase pas.
      if (documentesParLeConseiller.has(item.id)) {
        preserves++;
        continue;
      }
      const connu = existants.some((d) => d.id === item.id);
      insererDispositif(db, item);
      if (connu) mis_a_jour++;
      else ajoutes++;
    }
  });
  tx();

  journaliser('dispositifs.import', undefined, `${ajoutes} ajoutées, ${mis_a_jour} mises à jour`);

  console.log(`${ajoutes} fiche(s) ajoutée(s), ${mis_a_jour} mise(s) à jour, ${preserves} préservée(s).`);
  if (preserves > 0) {
    console.log(
      'Les fiches préservées sont celles déjà documentées dans cette installation : elles ne sont jamais écrasées.',
    );
  }
}

main();
