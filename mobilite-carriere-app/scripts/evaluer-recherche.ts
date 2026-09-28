import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Mesure la pertinence de la recherche sur un jeu de questions de référence : chaque
// modification du moteur ou de l'extraction se juge sur ces chiffres, pas à l'impression.
// Trois séries : les questions de référence (termes du guide), des reformulations en langage
// courant (ce que la recherche par le sens doit rattraper) et des sujets que le guide ne traite
// pas (aucun passage attendu). Mots seuls et mots + sens sont mesurés côte à côte.

interface Question {
  question: string;
  pages: number[];
}

interface JeuDeReference {
  document: string;
  questions: Question[];
  reformulations: Question[];
  horsCorpus: string[];
  // Limites connues, mesurées sans compter dans le verdict : question hors sujet dont seul un
  // mot, absent de la base, porte le sujet, le reste de la phrase correspondant à un passage.
  horsCorpusLimites: string[];
}

type Mode = 'mots' | 'mots+sens';

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
  const { pistesParLeSens, rechercherPassages } = await import('../src/lib/search');
  const { lancerIndexation, modeleInstalle } = await import('../src/lib/semantique');

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
      `${jeu.document} — ${pages.length} pages, ${nbPassages} passages indexés${corpusComplet ? ' (avec les textes livrés)' : ''}`,
    );

    const modes: Mode[] = ['mots'];
    if (modeleInstalle()) {
      const debut = Date.now();
      await lancerIndexation();
      console.log(`Recherche par le sens : passages vectorisés en ${Math.round((Date.now() - debut) / 1000)} s`);
      modes.push('mots+sens');
    } else {
      console.log('Recherche par le sens : modèle non installé (npm run semantique:installer), mots seuls mesurés.');
    }

    const rang = async (question: string, attendues: number[]) => {
      const resultats = await rechercherPassages(question, 5);
      return {
        rang: resultats.findIndex((r) => r.page !== null && attendues.includes(r.page)) + 1,
        pages: resultats.map((r) => `${r.page ?? '?'}${r.origine === 'sens' ? 's' : ''}`).join(', ') || 'aucun',
      };
    };

    const bilan: Record<Mode, Record<string, number>> = { mots: {}, 'mots+sens': {} };
    const lignes: string[] = [];
    for (const [serie, questions] of [
      ['questions', jeu.questions],
      ['reformulations', jeu.reformulations],
    ] as const) {
      lignes.push(`\n${serie === 'questions' ? 'Questions de référence' : 'Reformulations en langage courant'} :`);
      for (const { question, pages: attendues } of questions) {
        const parMode: string[] = [];
        for (const mode of modes) {
          process.env.MCC_RECHERCHE_SENS = mode === 'mots' ? 'non' : 'oui';
          const r = await rang(question, attendues);
          const b = bilan[mode];
          b[`${serie}.1`] = (b[`${serie}.1`] ?? 0) + (r.rang === 1 ? 1 : 0);
          b[`${serie}.3`] = (b[`${serie}.3`] ?? 0) + (r.rang >= 1 && r.rang <= 3 ? 1 : 0);
          b[`${serie}.5`] = (b[`${serie}.5`] ?? 0) + (r.rang >= 1 ? 1 : 0);
          let piste = '';
          // Sans résultat, les pistes de lecture par le sens mènent-elles à la bonne page ?
          if (mode === 'mots+sens' && r.pages === 'aucun') {
            const pistes = await pistesParLeSens(question, 3);
            const bonne = pistes.some((p) => p.page !== null && attendues.includes(p.page));
            b[`${serie}.pistes`] = (b[`${serie}.pistes`] ?? 0) + (bonne ? 1 : 0);
            piste = ` ; pistes : ${pistes.map((p) => p.page ?? '?').join(', ') || 'aucune'}${bonne ? ' ✓' : ''}`;
          }
          parMode.push(`${mode} : rang ${r.rang || '—'} (${r.pages})${piste}`);
        }
        const dernier = parMode[parMode.length - 1];
        lignes.push(`${/rang [123] /.test(dernier) ? 'OK   ' : 'ECHEC'} ${question.padEnd(58)} ${parMode.join(' | ')}`);
      }
    }

    lignes.push(
      `\n${corpusComplet ? 'Sujets hors guide (indicatif : les textes livrés peuvent légitimement y répondre)' : 'Sujets hors corpus (aucun passage attendu)'} :`,
    );
    for (const question of jeu.horsCorpus) {
      const parMode: string[] = [];
      for (const mode of modes) {
        process.env.MCC_RECHERCHE_SENS = mode === 'mots' ? 'non' : 'oui';
        const resultats = await rechercherPassages(question, 5);
        bilan[mode].horsCorpus = (bilan[mode].horsCorpus ?? 0) + (resultats.length === 0 ? 1 : 0);
        let piste = '';
        if (mode === 'mots+sens' && resultats.length === 0) {
          const pistes = await pistesParLeSens(question, 3);
          bilan[mode].horsCorpusPistes = (bilan[mode].horsCorpusPistes ?? 0) + (pistes.length > 0 ? 1 : 0);
          piste = pistes.length ? ` (${pistes.length} piste(s) signalée(s) comme telles)` : '';
        }
        parMode.push(`${mode} : ${resultats.length} passage(s)${piste}`);
      }
      const propre = parMode[parMode.length - 1].endsWith(': 0 passage(s)');
      lignes.push(`${propre ? 'OK   ' : 'ECHEC'} ${question.padEnd(58)} ${parMode.join(' | ')}`);
    }
    lignes.push('\nLimites connues (indicatif) :');
    for (const question of jeu.horsCorpusLimites) {
      const parMode: string[] = [];
      for (const mode of modes) {
        process.env.MCC_RECHERCHE_SENS = mode === 'mots' ? 'non' : 'oui';
        parMode.push(`${mode} : ${(await rechercherPassages(question, 5)).length} passage(s)`);
      }
      lignes.push(`      ${question.padEnd(58)} ${parMode.join(' | ')}`);
    }
    console.log(lignes.join('\n'));

    const n = { questions: jeu.questions.length, reformulations: jeu.reformulations.length, horsCorpus: jeu.horsCorpus.length };
    const cellule = (mode: Mode, cle: string, total: number) => `${bilan[mode][cle] ?? 0}/${total}`.padStart(12);
    console.log(`\nPertinence ${modes.map((m) => (m === 'mots' ? 'mots seuls' : 'mots + sens').padStart(12)).join('')}`);
    for (const [libelle, cle, total] of [
      ['questions — 1re position     ', 'questions.1', n.questions],
      ['questions — 3 premiers       ', 'questions.3', n.questions],
      ['reformulations — 1re position', 'reformulations.1', n.reformulations],
      ['reformulations — 3 premiers  ', 'reformulations.3', n.reformulations],
      ['reformulations — 5 premiers  ', 'reformulations.5', n.reformulations],
      ['  + bonne page en piste       ', 'reformulations.pistes', n.reformulations],
      ['hors corpus sans faux résultat', 'horsCorpus', n.horsCorpus],
      ['  dont avec pistes signalées  ', 'horsCorpusPistes', n.horsCorpus],
    ] as const) {
      console.log(`  ${libelle} ${modes.map((m) => cellule(m, cle, total)).join('')}`);
    }

    // Critère : le mode le plus complet disponible, tel que les conseillers l'utilisent.
    const mode = modes[modes.length - 1];
    const taux3 = (bilan[mode]['questions.3'] ?? 0) / n.questions;
    const reussi = taux3 >= seuil && (corpusComplet || bilan[mode].horsCorpus === n.horsCorpus);
    console.log(
      reussi
        ? `\nÉvaluation réussie (${mode}).`
        : `\nÉvaluation en échec (${mode} ; seuil « 3 premiers » : ${Math.round(seuil * 100)} %, aucun faux résultat hors corpus).`,
    );
    process.exitCode = reussi ? 0 : 1;
  } finally {
    fs.rmSync(dossierTemp, { recursive: true, force: true });
  }
}

main().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
