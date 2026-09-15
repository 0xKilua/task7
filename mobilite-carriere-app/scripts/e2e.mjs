const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SORTIE = process.env.SORTIE ?? '/tmp';
const resultats = [];

function verifier(libelle, condition) {
  resultats.push({ libelle, ok: Boolean(condition) });
  console.log(`${condition ? 'OK  ' : 'ECHEC'} ${libelle}`);
}

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
const page = await contexte.newPage();

const erreursConsole = [];
page.on('pageerror', (e) => erreursConsole.push(e.message));

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
verifier('Tableau de bord affiché', await page.getByText('Tableau de bord').first().isVisible());
await page.screenshot({ path: `${SORTIE}/01-tableau-de-bord.png`, fullPage: true });

const reference = `ACC-TEST-${Date.now().toString().slice(-6)}`;
await page.goto(`${BASE}/dossiers`, { waitUntil: 'networkidle' });
await page.fill('#reference', reference);
await page.fill('#intitule', 'projet de mobilité fonctionnelle');
await page.click('button:has-text("Créer le dossier")');
await page.waitForURL(/\/dossiers\/dos_/, { timeout: 15000 });
verifier('Dossier créé et ouvert', page.url().includes('/dossiers/dos_'));
const urlDossier = page.url();

await page.fill('#situationProfessionnelle', 'Agent en poste administratif depuis 6 ans');
await page.fill('#souhaitsEvolution', 'Souhaite évoluer vers des fonctions de pilotage de projet');
await page.fill('#echeance', 'Horizon 12 mois');
await page.fill('#mobiliteGeographique', 'Mobilité géographique envisagée en région');
await page.click('button:has-text("Enregistrer et générer la synthèse")');
await page.waitForSelector('h2:has-text("Synthèse de situation")', { timeout: 15000 });
verifier(
  'Synthèse de situation générée',
  await page.getByRole('heading', { name: 'Synthèse de situation' }).isVisible(),
);
verifier(
  'Synthèse signale les éléments non renseignés',
  await page.getByText('Éléments non renseignés à ce stade').isVisible(),
);

await page.fill('#parcours', 'Parcours administratif en services déconcentrés');
await page.fill('#pistesProfessionnelles', 'Chef de projet, appui au pilotage');
await page.click('button:has-text("Enregistrer le bilan")');
await page.waitForSelector('h2:has-text("Synthèse de bilan")', { timeout: 15000 });
verifier(
  'Synthèse de bilan générée',
  await page.getByRole('heading', { name: 'Synthèse de bilan' }).isVisible(),
);

await page.click('button:has-text("Proposer un plan")');
await page.waitForSelector('button:has-text("Enregistrer le plan")', { timeout: 15000 });
verifier('Plan d’accompagnement proposé', await page.locator('#constats').isVisible());
verifier(
  'Plan éditable pré-rempli avec les constats saisis',
  (await page.locator('#constats').inputValue()).includes('Agent en poste administratif'),
);
verifier(
  'Plan rappelle les informations à vérifier',
  (await page.locator('#aVerifier').inputValue()).includes('Information à vérifier'),
);

await page.fill('#actions', 'Prendre contact avec le service RH\nIdentifier deux postes cibles');
await page.click('button:has-text("Enregistrer le plan")');
await page.waitForTimeout(1500);
await page.goto(urlDossier, { waitUntil: 'networkidle' });
verifier(
  'Modifications du plan persistées',
  (await page.locator('#actions').inputValue()).includes('Identifier deux postes cibles'),
);

await page.click('button:has-text("Proposer un plan")');
await page.waitForTimeout(1500);
await page.goto(urlDossier, { waitUntil: 'networkidle' });
verifier(
  'Re-proposer un plan ne supprime pas les saisies du conseiller',
  (await page.locator('#actions').inputValue()).includes('Identifier deux postes cibles'),
);
await page.screenshot({ path: `${SORTIE}/02-dossier.png`, fullPage: true });

await page.goto(`${BASE}/dossiers`, { waitUntil: 'networkidle' });
await page.fill('#reference', reference);
await page.click('button:has-text("Créer le dossier")');
await page.waitForURL(/erreur=/, { timeout: 15000 });
verifier(
  'Référence de dossier déjà utilisée : message clair, pas d’erreur serveur',
  (await page.locator('main').innerText()).includes('déjà utilisée'),
);

await page.goto(`${BASE}/assistant?q=quelles+pistes+de+mobilite+geographique+explorer`, {
  waitUntil: 'networkidle',
});
verifier(
  'Assistant affiche la trame structurée',
  await page.getByRole('heading', { name: 'Points à vérifier' }).isVisible(),
);
await page.screenshot({ path: `${SORTIE}/03-assistant.png`, fullPage: true });

await page.goto(`${BASE}/entretien?type=projet_mobilite`, { waitUntil: 'networkidle' });
verifier(
  'Trame d’entretien générée',
  await page.getByRole('heading', { name: /Exploration du projet de mobilité/ }).isVisible(),
);
await page.screenshot({ path: `${SORTIE}/04-entretien.png`, fullPage: true });

await page.goto(`${BASE}/dispositifs`, { waitUntil: 'networkidle' });
verifier(
  'Catalogue de dispositifs affiché',
  await page.getByRole('link', { name: /Détachement/ }).first().isVisible(),
);
await page.screenshot({ path: `${SORTIE}/05-dispositifs.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
const largeurDocument = await page.evaluate(() => document.documentElement.scrollWidth);
verifier(`Responsive mobile sans débordement (${largeurDocument}px)`, largeurDocument <= 400);
await page.screenshot({ path: `${SORTIE}/06-mobile.png`, fullPage: true });

verifier('Aucune erreur JavaScript', erreursConsole.length === 0);
if (erreursConsole.length > 0) console.log(erreursConsole);

await navigateur.close();

const echecs = resultats.filter((r) => !r.ok);
console.log(`\n${resultats.length - echecs.length}/${resultats.length} vérifications réussies.`);
process.exit(echecs.length === 0 ? 0 : 1);
