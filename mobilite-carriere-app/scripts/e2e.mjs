const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SORTIE = process.env.SORTIE ?? '/tmp';
const resultats = [];

function verifier(libelle, condition) {
  resultats.push({ libelle, ok: Boolean(condition) });
  console.log(`${condition ? 'OK  ' : 'ECHEC'} ${libelle}`);
}

const suffixe = Date.now().toString().slice(-6);
const ADMIN = { identifiant: `admin${suffixe}`, motDePasse: 'MotDePasseAdmin-2026' };
const CONSEILLER = { identifiant: `conseiller${suffixe}`, motDePasse: 'MotDePasseConseil-2026' };

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
const page = await contexte.newPage();

const erreursConsole = [];
page.on('pageerror', (e) => erreursConsole.push(e.message));

// Après une action serveur, Next navigue côté client : « networkidle » se résout avant
// que l'URL ait changé. Il faut attendre la navigation elle-même.
async function connecter(identifiant, motDePasse) {
  await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
  await page.fill('#identifiant', identifiant);
  await page.fill('#motDePasse', motDePasse);
  const navigation = page
    .waitForURL((url) => !url.pathname.startsWith('/connexion') || url.search.includes('erreur='), {
      timeout: 15000,
    })
    .catch(() => {});
  await page.click('button:has-text("Se connecter")');
  await navigation;
  await page.waitForLoadState('networkidle');
}

// --- Accès sans session ---------------------------------------------------
await page.goto(`${BASE}/dossiers`, { waitUntil: 'networkidle' });
verifier('Sans session, toute page renvoie vers la connexion', /\/(connexion|installation)/.test(page.url()));

// --- Installation ou connexion administrateur -----------------------------
if (page.url().includes('/installation')) {
  await page.fill('#nom', 'Administrateur de test');
  await page.fill('#identifiant', ADMIN.identifiant);
  await page.fill('#motDePasse', ADMIN.motDePasse);
  await page.fill('#confirmation', ADMIN.motDePasse);
  await page.click('button:has-text("Créer le compte administrateur")');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  verifier('Installation du premier compte administrateur', true);
} else {
  throw new Error('Base non vierge : lancez les tests sur une base de test.');
}

verifier('Tableau de bord accessible une fois connecté', await page.getByText('Tableau de bord').first().isVisible());
await page.screenshot({ path: `${SORTIE}/01-tableau-de-bord.png`, fullPage: true });

// --- Mot de passe trop court refusé ---------------------------------------
await page.goto(`${BASE}/mon-compte`, { waitUntil: 'networkidle' });
await page.fill('#motDePasse', 'court');
await page.fill('#confirmation', 'court');
await page.click('button:has-text("Changer le mot de passe")');
await page.waitForURL(/erreur=/, { timeout: 15000 });
verifier(
  'Mot de passe trop court refusé',
  (await page.locator('main').innerText()).includes('12 caractères'),
);

// --- Parcours métier ------------------------------------------------------
const reference = `ACC-TEST-${suffixe}`;
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
verifier('Synthèse de bilan générée', await page.getByRole('heading', { name: 'Synthèse de bilan' }).isVisible());

await page.click('button:has-text("Proposer un plan")');
await page.waitForSelector('button:has-text("Enregistrer le plan")', { timeout: 15000 });
verifier(
  'Plan pré-rempli avec les constats saisis',
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
  (await page.locator('main').innerText()).includes('déjà un dossier'),
);

await page.goto(`${BASE}/assistant?q=quelles+pistes+de+mobilite+geographique+explorer`, { waitUntil: 'networkidle' });
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

await page.goto(`${BASE}/dispositifs`, { waitUntil: 'networkidle' });
verifier(
  'Catalogue de dispositifs affiché',
  await page.getByRole('link', { name: /Détachement/ }).first().isVisible(),
);

// --- Création d'un second compte ------------------------------------------
await page.goto(`${BASE}/administration`, { waitUntil: 'networkidle' });
verifier('Page d’administration accessible à l’administrateur', await page.locator('#identifiant').isVisible());
await page.fill('#nom', 'Conseiller de test');
await page.fill('#identifiant', CONSEILLER.identifiant);
await page.fill('#motDePasse', CONSEILLER.motDePasse);
await page.selectOption('#role', 'conseiller');
await page.click('button:has-text("Créer le compte")');
await page.waitForURL(/succes=|erreur=/, { timeout: 15000 });
verifier(
  'Compte conseiller créé',
  page.url().includes('succes=') &&
    (await page.locator('main').innerText()).includes('devra être changé'),
);

await page.click('button:has-text("Se déconnecter")');
await page.waitForURL(/\/connexion/, { timeout: 15000 });
verifier('Déconnexion effective', page.url().includes('/connexion'));

await page.goto(urlDossier, { waitUntil: 'networkidle' });
verifier('Après déconnexion, le dossier n’est plus accessible', page.url().includes('/connexion'));

// --- Cloisonnement entre conseillers --------------------------------------
await connecter(CONSEILLER.identifiant, CONSEILLER.motDePasse);
verifier(
  'Premier mot de passe : changement imposé',
  page.url().includes('/mon-compte'),
);
await page.fill('#motDePasse', CONSEILLER.motDePasse + '-nouveau');
await page.fill('#confirmation', CONSEILLER.motDePasse + '-nouveau');
await page.click('button:has-text("Changer le mot de passe")');
await page.waitForURL(/\/connexion/, { timeout: 15000 });

await connecter(CONSEILLER.identifiant, CONSEILLER.motDePasse);
verifier('Ancien mot de passe refusé après changement', page.url().includes('/connexion'));

await connecter(CONSEILLER.identifiant, CONSEILLER.motDePasse + '-nouveau');
verifier('Connexion avec le nouveau mot de passe', new URL(page.url()).pathname === '/');

await page.goto(urlDossier, { waitUntil: 'networkidle' });
const corps = await page.locator('body').innerText();
verifier(
  'Un conseiller ne peut pas ouvrir le dossier d’un autre par son URL',
  !corps.includes('Agent en poste administratif') && !corps.includes(reference),
);

await page.goto(`${BASE}/dossiers`, { waitUntil: 'networkidle' });
verifier(
  'La liste des accompagnements ne montre que les siens',
  !(await page.locator('main').innerText()).includes(reference),
);

await page.goto(`${BASE}/administration`, { waitUntil: 'networkidle' });
verifier(
  'Un conseiller n’accède pas à l’administration des comptes',
  !(await page.locator('body').innerText()).includes('Ouvrir un compte'),
);

await page.goto(`${BASE}/base-documentaire`, { waitUntil: 'networkidle' });
verifier(
  'Un conseiller ne peut pas ingérer de document',
  (await page.locator('main').innerText()).includes('seul un administrateur'),
);

// --- Robustesse -----------------------------------------------------------
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
