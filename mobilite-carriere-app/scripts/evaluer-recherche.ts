import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Mesure la pertinence de la recherche sur un jeu de questions de référence : chaque
// modification du moteur ou de l'extraction se juge sur ces chiffres, pas à l'impression.

interface JeuDeReference {
  document: string;
  questions: { question: string; pages: number[] }[];
  horsCorpus: string[];
}

function argument(nom: string): string | undefined {
  const index = process.argv.indexOf(`--${nom}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const fichier = argument('fichier');
  if (!fichier || !fs.existsSync(fichier)) {
    console.error(
      'Usage : npm run recherche:evaluer -- --fichier <chemin du guide DGAFP (PDF)> [--seuil 0.8] [--corpus-complet]',
    );
    process.exit(1);
  }
  const seuil = Number(argument('seuil') ?? 0.8);

  // Base jetable : l'évaluation ne touche jamais à la base de l'application.
  const dossierTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcc-evaluation-'));
  process.env.MCC_DB_PATH = path.join(dossierTemp, 'evaluation.db');
  // Les pages attendues et les questions hors corpus se rapportent au seul guide : les textes
  // livrés avec l'application en sont exclus, sauf demande explicite (concurrence réelle).
  const corpusComplet = process.argv.includes('--corpus-complet');
  if (!corpusComplet) process.env.MCC_CONTENUS_LIVRES = 'non';
  const { extraireTexte } = await import('../src/lib/extract');
  const { ingererDocument } = await import('../src/lib/ingest');
  const { rechercherPassages } = await import('../src/lib/search');

  const jeu = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'questions-reference.json'), 'utf8'),
  ) as JeuDeReference;

  try {
    const pages = await extraireTexte(path.resolve(fichier));
    const { nbPassages } = ingererDocument(
      { titre: 'Évaluation', source: 'DGAFP', statut: 'officiel' },
      pages,
    );
    console.log(
      `${jeu.document} — ${pages.length} pages, ${nbPassages} passages indexés${corpusComplet ? ' (avec les textes livrés)' : ''}\n`,
    );

    let a1 = 0;
    let a3 = 0;
    let a5 = 0;
    let rangsInverses = 0;
    for (const { question, pages: attendues } of jeu.questions) {
      const resultats = rechercherPassages(question, 5);
      const rang = resultats.findIndex((r) => r.page !== null && attendues.includes(r.page)) + 1;
      if (rang === 1) a1++;
      if (rang >= 1 && rang <= 3) a3++;
      if (rang >= 1) a5++;
      if (rang >= 1) rangsInverses += 1 / rang;
      const obtenues = resultats.map((r) => r.page ?? '?').join(', ') || 'aucun résultat';
      console.log(
        `${rang >= 1 && rang <= 3 ? 'OK   ' : 'ECHEC'} ${question.padEnd(48)} rang ${rang || '—'}  (pages obtenues : ${obtenues})`,
      );
    }

    console.log(
      corpusComplet
        ? '\nQuestions hors guide (indicatif : les textes livrés peuvent légitimement y répondre) :'
        : '\nQuestions hors corpus (aucun passage attendu) :',
    );
    let horsCorpusPropres = 0;
    for (const question of jeu.horsCorpus) {
      const resultats = rechercherPassages(question, 5);
      if (resultats.length === 0) horsCorpusPropres++;
      console.log(
        `${resultats.length === 0 ? 'OK   ' : 'ECHEC'} ${question.padEnd(48)} ${resultats.length} passage(s)${
          resultats.length ? ` — ex. p. ${resultats[0].page} : « ${resultats[0].extrait.replace(/[]/g, '').slice(0, 70)}… »` : ''
        }`,
      );
    }

    const n = jeu.questions.length;
    const taux3 = a3 / n;
    console.log(`
Pertinence (${n} questions) :
  réponse en 1re position : ${a1}/${n} (${Math.round((a1 / n) * 100)} %)
  dans les 3 premiers     : ${a3}/${n} (${Math.round(taux3 * 100)} %)
  dans les 5 premiers     : ${a5}/${n} (${Math.round((a5 / n) * 100)} %)
  rang réciproque moyen   : ${(rangsInverses / n).toFixed(2)}
Hors corpus sans faux résultat : ${horsCorpusPropres}/${jeu.horsCorpus.length}`);

    const reussi = taux3 >= seuil && (corpusComplet || horsCorpusPropres === jeu.horsCorpus.length);
    console.log(reussi ? '\nÉvaluation réussie.' : `\nÉvaluation en échec (seuil « 3 premiers » : ${Math.round(seuil * 100)} %).`);
    process.exitCode = reussi ? 0 : 1;
  } finally {
    fs.rmSync(dossierTemp, { recursive: true, force: true });
  }
}

main().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
