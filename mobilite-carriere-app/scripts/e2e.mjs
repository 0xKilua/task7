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

const ROUTES_PROTEGEES = [
  '/',
  '/dossiers',
  '/dossiers/dos_inexistant/restitution',
  '/assistant?q=detachement',
  '/recherche?q=detachement',
  '/entretien',
  '/dispositifs',
  '/base-documentaire',
  '/projet',
  '/mon-compte',
  '/administration',
];

// --- Accès sans session ---------------------------------------------------
await page.goto(`${BASE}/dossiers`, { waitUntil: 'networkidle' });
verifier('Sans session, toute page renvoie vers la connexion', /\/(connexion|installation)/.test(page.url()));

// Le middleware ne voit que la présence du cookie : sans revalidation en page, un cookie
// inventé suffirait à lire la base documentaire et le catalogue.
const contexteForge = await navigateur.newContext();
await contexteForge.addCookies([
  { name: 'mcc_session', value: 'jeton-invente-par-un-attaquant', domain: 'localhost', path: '/' },
]);
const pageForgee = await contexteForge.newPage();
const fuites = [];
for (const route of ROUTES_PROTEGEES) {
  await pageForgee.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  if (!pageForgee.url().includes('/connexion') && !pageForgee.url().includes('/installation')) {
    fuites.push(`${route} → ${pageForgee.url()}`);
  }
}
verifier(
  `Un cookie de session inventé n'ouvre aucune page${fuites.length ? ' — fuites : ' + fuites.join(', ') : ''}`,
  fuites.length === 0,
);
await contexteForge.close();

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

// --- Mot de passe actuel exigé pour tout changement volontaire -----------
await page.goto(`${BASE}/mon-compte`, { waitUntil: 'networkidle' });
verifier(
  'Le formulaire exige le mot de passe actuel',
  await page.locator('#motDePasseActuel').isVisible(),
);
await page.fill('#motDePasseActuel', 'un-mot-de-passe-incorrect');
await page.fill('#motDePasse', ADMIN.motDePasse + '-nouveau');
await page.fill('#confirmation', ADMIN.motDePasse + '-nouveau');
await page.click('button:has-text("Changer le mot de passe")');
await page.waitForURL(/erreur=/, { timeout: 15000 });
verifier(
  'Mot de passe actuel incorrect refusé',
  (await page.locator('main').innerText()).includes('mot de passe actuel est incorrect'),
);

// --- Mot de passe trop court refusé ---------------------------------------
await page.goto(`${BASE}/mon-compte`, { waitUntil: 'networkidle' });
await page.fill('#motDePasseActuel', ADMIN.motDePasse);
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

// --- Suivi de l'accompagnement --------------------------------------------
const local = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const rdvPasse = local(new Date(Date.now() - 3 * 86_400_000));
const rdvFutur = local(new Date(Date.now() + 7 * 86_400_000));

async function enregistrerSuivi(statut, rdv) {
  await page.goto(urlDossier, { waitUntil: 'networkidle' });
  await page.selectOption('#statut', statut);
  await page.fill('#prochainRdv', rdv);
  await page.click('button:has-text("Enregistrer le suivi")');
  await page.waitForTimeout(1500);
  await page.goto(urlDossier, { waitUntil: 'networkidle' });
}

await enregistrerSuivi('en_cours', rdvPasse);
verifier(
  'Rendez-vous passé signalé sur le dossier',
  (await page.locator('main').innerText()).includes('est passé'),
);
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
const carteRelance = page.locator('section', { has: page.getByRole('heading', { name: 'À relancer' }) });
verifier(
  'Tableau de bord : dossier au rendez-vous passé listé « À relancer »',
  (await carteRelance.innerText()).includes(reference),
);

await enregistrerSuivi('en_attente', rdvFutur);
verifier(
  'Statut et prochain rendez-vous enregistrés',
  (await page.locator('#statut').inputValue()) === 'en_attente' &&
    (await page.locator('#prochainRdv').inputValue()) === rdvFutur,
);

const NOTE_CONSERVEE = `Point téléphonique ${suffixe} sur les postes cibles`;
const NOTE_SUPPRIMEE = `Note erronée ${suffixe}`;
for (const note of [NOTE_CONSERVEE, NOTE_SUPPRIMEE]) {
  await page.fill('#compteRendu', note);
  await page.click('button:has-text("Ajouter au suivi")');
  await page.waitForTimeout(1500);
  await page.goto(urlDossier, { waitUntil: 'networkidle' });
}
verifier(
  'Échanges consignés dans l’historique',
  (await page.locator('#suivi').innerText()).includes(NOTE_CONSERVEE) &&
    (await page.locator('#suivi').innerText()).includes(NOTE_SUPPRIMEE),
);
await page
  .locator('#suivi li', { hasText: NOTE_SUPPRIMEE })
  .getByRole('button', { name: 'Supprimer' })
  .click();
await page.waitForTimeout(1500);
await page.goto(urlDossier, { waitUntil: 'networkidle' });
verifier(
  'Suppression d’un échange consigné',
  (await page.locator('#suivi').innerText()).includes(NOTE_CONSERVEE) &&
    !(await page.locator('#suivi').innerText()).includes(NOTE_SUPPRIMEE),
);
await page.screenshot({ path: `${SORTIE}/02b-suivi.png`, fullPage: true });

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
const carteRdv = page.locator('section', { has: page.getByRole('heading', { name: 'Prochains rendez-vous' }) });
verifier(
  'Tableau de bord : prochain rendez-vous affiché',
  (await carteRdv.innerText()).includes(reference),
);
verifier(
  'Tableau de bord : le dossier n’est plus « À relancer »',
  !(await carteRelance.innerText()).includes(reference),
);

await page.goto(`${BASE}/dossiers?statut=en_attente`, { waitUntil: 'networkidle' });
const listeEnAttente = await page.locator('main').innerText();
await page.goto(`${BASE}/dossiers?statut=clos`, { waitUntil: 'networkidle' });
verifier(
  'Liste filtrable par statut',
  listeEnAttente.includes(reference) && !(await page.locator('main').innerText()).includes(reference),
);

// --- Document de restitution ----------------------------------------------
await page.goto(`${urlDossier}/restitution`, { waitUntil: 'networkidle' });
const restitution = await page.locator('article').innerText();
verifier(
  'Restitution : situation, plan et prochain rendez-vous repris',
  restitution.includes('Synthèse de votre accompagnement') &&
    restitution.includes(reference) &&
    restitution.includes('Agent en poste administratif') &&
    restitution.includes('Identifier deux postes cibles') &&
    restitution.includes('Prochain rendez-vous'),
);
verifier(
  'Restitution : les notes internes de suivi n’y figurent pas',
  !restitution.includes(NOTE_CONSERVEE),
);
verifier(
  'Restitution : points à vérifier rappelés, sans jargon interne',
  restitution.includes('Information à vérifier') && !restitution.includes('entrée non encore documentée'),
);
await page.emulateMedia({ media: 'print' });
verifier(
  'Restitution : en-tête du site et outils masqués à l’impression',
  !(await page.getByRole('navigation', { name: 'Navigation principale' }).isVisible()) &&
    !(await page.getByRole('button', { name: /Imprimer/ }).isVisible()),
);
await page.pdf({ path: `${SORTIE}/07-restitution.pdf`, format: 'A4', printBackground: true });
await page.emulateMedia({ media: 'screen' });
await page.screenshot({ path: `${SORTIE}/07-restitution.png`, fullPage: true });

await page.goto(`${urlDossier}/restitution?choix=1&sections=plan`, { waitUntil: 'networkidle' });
const restitutionPartielle = await page.locator('article').innerText();
verifier(
  'Restitution : choix des sections respecté',
  restitutionPartielle.includes("Plan d'accompagnement") && !restitutionPartielle.includes('Votre situation'),
);

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

await page.goto(`${urlDossier}/restitution`, { waitUntil: 'networkidle' });
const corpsRestitution = await page.locator('body').innerText();
verifier(
  'Un conseiller ne peut pas éditer la restitution du dossier d’un autre',
  !corpsRestitution.includes('Agent en poste administratif') && !corpsRestitution.includes(reference),
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
