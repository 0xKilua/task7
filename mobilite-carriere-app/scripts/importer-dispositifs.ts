import { getDb, importerCatalogue, journaliser, lireSeedDispositifs } from '../src/lib/db';

// Le catalogue livré est déjà appliqué automatiquement au démarrage à chaque nouvelle
// version ; cette commande le réapplique à la demande.
const bilan = importerCatalogue(getDb(), lireSeedDispositifs());
journaliser('dispositifs.import', undefined, `${bilan.ajoutees} ajoutées, ${bilan.misesAJour} mises à jour, ${bilan.preservees} préservées`);
console.log(`${bilan.ajoutees} fiche(s) ajoutée(s), ${bilan.misesAJour} mise(s) à jour, ${bilan.preservees} préservée(s).`);
if (bilan.preservees > 0) {
  console.log('Les fiches préservées sont celles déjà documentées dans cette installation : elles ne sont jamais écrasées.');
}
