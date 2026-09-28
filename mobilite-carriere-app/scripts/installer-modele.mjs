// Installe le modèle de la recherche par le sens (multilingual-e5-small, quantifié en int8,
// ~135 Mo) dans modeles/multilingual-e5-small. Une seule fois : l'application ne télécharge
// jamais rien à l'usage. Usage :
//   npm run semantique:installer                         téléchargement depuis Hugging Face
//   npm run semantique:installer -- --depuis <dossier>   copie d'un dossier déjà téléchargé
//   npm run semantique:installer -- --forcer             réinstallation
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// onnxruntime embarque une télémétrie Microsoft (envois vers mobile.events.data.microsoft.com) :
// désactivée avant tout chargement du module.
process.env.ORT_DISABLE_TELEMETRY = '1';

const MODELE = 'multilingual-e5-small';
const DEPOT = 'https://huggingface.co/Xenova/multilingual-e5-small/resolve/main';
const FICHIERS = ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'];
const destination = process.env.MCC_MODELE_DIR ?? path.join(process.cwd(), 'modeles', MODELE);

function argument(nom) {
  const i = process.argv.indexOf(`--${nom}`);
  return i >= 0 ? (process.argv[i + 1] ?? '') : undefined;
}

// Derrière un proxy d'entreprise, fetch ne le suit que si NODE_USE_ENV_PROXY est posé au
// lancement de Node : on se relance avec.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(r.status ?? 1);
}

const installe = () => FICHIERS.every((f) => fs.existsSync(path.join(destination, f)));
if (installe() && argument('forcer') === undefined) {
  console.log(`Modèle déjà installé dans ${destination}.`);
  process.exit(0);
}

async function telecharger(fichier, cible) {
  const reponse = await fetch(`${DEPOT}/${fichier}`, { redirect: 'follow' });
  if (!reponse.ok || !reponse.body) throw new Error(`${fichier} : réponse HTTP ${reponse.status}`);
  await pipeline(Readable.fromWeb(reponse.body), fs.createWriteStream(cible));
}

async function empreinte(chemin) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(chemin), hash);
  return hash.digest('hex');
}

// Le modèle installé doit se charger et produire un vecteur : sinon, rien n'est remplacé.
async function verifier(dossier) {
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  const ort = require('onnxruntime-node');
  const { Tokenizer } = require('@huggingface/tokenizers');
  const lire = (f) => JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf8'));
  const ids = new Tokenizer(lire('tokenizer.json'), lire('tokenizer_config.json')).encode('query: mobilité').ids;
  const session = await ort.InferenceSession.create(path.join(dossier, 'onnx/model_quantized.onnx'));
  const tenseur = (valeurs) => new ort.Tensor('int64', BigInt64Array.from(valeurs, BigInt), [1, ids.length]);
  const entrees = { input_ids: tenseur(ids), attention_mask: tenseur(ids.map(() => 1)) };
  if (session.inputNames.includes('token_type_ids')) entrees.token_type_ids = tenseur(ids.map(() => 0));
  const sortie = (await session.run(entrees))[session.outputNames[0]];
  if (sortie.dims.length !== 3 || sortie.dims[2] < 64) throw new Error(`sortie inattendue : ${sortie.dims}`);
}

const temporaire = `${destination}.installation`;
fs.rmSync(temporaire, { recursive: true, force: true });
fs.mkdirSync(path.join(temporaire, 'onnx'), { recursive: true });

try {
  const depuis = argument('depuis');
  for (const fichier of FICHIERS) {
    const cible = path.join(temporaire, fichier);
    if (depuis) {
      fs.copyFileSync(path.join(path.resolve(depuis), fichier), cible);
    } else {
      process.stdout.write(`Téléchargement de ${fichier}… `);
      await telecharger(fichier, cible);
      console.log('fait.');
    }
  }
  await verifier(temporaire);
  const empreintes = {};
  for (const fichier of FICHIERS) {
    const chemin = path.join(temporaire, fichier);
    empreintes[fichier] = { taille: fs.statSync(chemin).size, sha256: await empreinte(chemin) };
  }
  fs.writeFileSync(
    path.join(temporaire, 'installation.json'),
    `${JSON.stringify({ modele: MODELE, source: depuis ? path.resolve(depuis) : DEPOT, date: new Date().toISOString(), empreintes }, null, 2)}\n`,
  );
  fs.rmSync(destination, { recursive: true, force: true });
  fs.renameSync(temporaire, destination);
  console.log(`Modèle installé dans ${destination}. La recherche par le sens s'active au prochain démarrage.`);
} catch (erreur) {
  fs.rmSync(temporaire, { recursive: true, force: true });
  console.error(`Modèle non installé : ${erreur instanceof Error ? erreur.message : erreur}`);
  console.error("L'application reste utilisable : la recherche se fait alors par les mots seulement.");
  process.exit(1);
}
