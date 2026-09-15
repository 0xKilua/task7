'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import path from 'node:path';
import { exigerAdministrateur, exigerSession } from '@/lib/auth';
import { getDb, journaliser } from '@/lib/db';
import { dispositifsPertinents } from '@/lib/dispositifs';
import {
  CHAMPS_DIAGNOSTIC,
  ETAPES_BILAN,
  creerDossier,
  dernierBilan,
  dernierDiagnostic,
  enregistrerBilan,
  enregistrerDiagnostic,
  enregistrerPlan,
  exigerDossier,
  obtenirPlan,
  supprimerDossier,
} from '@/lib/dossiers';
import { enregistrerEntretien, genererTrame } from '@/lib/entretien';
import { extraireDepuisBuffer } from '@/lib/extract';
import { ingererDocument, supprimerDocument } from '@/lib/ingest';
import { MESSAGE_A_VERIFIER } from '@/lib/types';

const FORMATS_ACCEPTES = new Set(['.pdf', '.md', '.txt']);

function texte(formData: FormData, cle: string): string {
  const valeur = formData.get(cle);
  return typeof valeur === 'string' ? valeur.trim() : '';
}

function lignes(formData: FormData, cle: string): string[] {
  return texte(formData, cle)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export async function creerDossierAction(formData: FormData) {
  const utilisateur = exigerSession();
  const reference = texte(formData, 'reference');
  if (reference.length === 0) return;
  const intitule = texte(formData, 'intitule');

  let dossier;
  try {
    dossier = creerDossier(utilisateur.id, reference, intitule || undefined);
  } catch (erreur) {
    const conflit =
      erreur instanceof Error && erreur.message.includes('UNIQUE constraint failed');
    redirect(
      '/dossiers?erreur=' +
        encodeURIComponent(
          conflit
            ? `Vous avez déjà un dossier portant la référence « ${reference} ».`
            : "Le dossier n'a pas pu être créé.",
        ),
    );
  }

  revalidatePath('/dossiers');
  revalidatePath('/');
  redirect(`/dossiers/${dossier.id}`);
}

export async function supprimerDossierAction(formData: FormData) {
  const utilisateur = exigerSession();
  const id = texte(formData, 'dossierId');
  if (id) supprimerDossier(id, utilisateur.id);
  revalidatePath('/dossiers');
  revalidatePath('/');
  redirect('/dossiers');
}

export async function enregistrerDiagnosticAction(formData: FormData) {
  const utilisateur = exigerSession();
  const dossierId = texte(formData, 'dossierId');
  if (!dossierId) return;
  const payload: Record<string, string> = {};
  for (const champ of CHAMPS_DIAGNOSTIC) payload[champ.cle] = texte(formData, champ.cle);
  enregistrerDiagnostic(dossierId, utilisateur.id, payload);
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath('/');
}

export async function enregistrerBilanAction(formData: FormData) {
  const utilisateur = exigerSession();
  const dossierId = texte(formData, 'dossierId');
  if (!dossierId) return;
  const payload: Record<string, string> = {};
  for (const etape of ETAPES_BILAN) payload[etape.cle] = texte(formData, etape.cle);
  enregistrerBilan(dossierId, utilisateur.id, payload);
  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath('/');
}

export async function genererPlanAction(formData: FormData) {
  const utilisateur = exigerSession();
  const dossierId = texte(formData, 'dossierId');
  if (!dossierId) return;

  const diagnostic = dernierDiagnostic(dossierId, utilisateur.id);
  const bilan = dernierBilan(dossierId, utilisateur.id);
  const existant = obtenirPlan(dossierId, utilisateur.id);

  const d = diagnostic?.payload ?? {};
  const b = bilan?.payload ?? {};

  const contexte = [
    d.situationProfessionnelle,
    d.souhaitsEvolution,
    d.projetProfessionnel,
    d.besoinsFormation,
    d.mobiliteGeographique,
    d.mobiliteFonctionnelle,
    b.pistesProfessionnelles,
    b.besoinsDeveloppement,
  ]
    .filter(Boolean)
    .join(' ');

  const listeOuVide = (...valeurs: (string | undefined)[]) =>
    valeurs.filter((v): v is string => Boolean(v && v.trim().length > 0)).map((v) => v.trim());

  const propositions = {
    constats: listeOuVide(d.situationProfessionnelle, d.anciennete, b.parcours, b.pointsAppui),
    objectifs: listeOuVide(d.souhaitsEvolution, d.projetProfessionnel, b.souhaitsEvolution),
    pistes: listeOuVide(b.pistesProfessionnelles, d.mobiliteFonctionnelle, d.mobiliteGeographique),
    dispositifs: dispositifsPertinents(contexte, 6).map(
      (disp) =>
        `${disp.nom}${disp.statutVerification === 'non_verifie' ? ' — entrée non encore documentée depuis une source officielle' : ''}`,
    ),
    aVerifier: [
      MESSAGE_A_VERIFIER,
      "Conditions d'accès et procédures applicables aux dispositifs envisagés.",
      ...listeOuVide(d.contraintes),
    ],
    actions: listeOuVide(b.prochainesEtapes, d.besoinsFormation),
    ressources: ['Ressources officielles citées dans la base documentaire.'],
    echeances: listeOuVide(d.echeance),
    prochainesEtapes: [
      'Valider avec l’agent les objectifs retenus.',
      'Confirmer les conditions applicables auprès du service RH compétent.',
    ],
  };

  // Les lignes déjà saisies par le conseiller priment : une nouvelle proposition
  // complète le plan existant, elle ne l'écrase pas.
  const fusionner = (cle: keyof typeof propositions) => {
    const conserve = existant?.[cle] ?? [];
    const ajouts = propositions[cle].filter((item) => !conserve.includes(item));
    return [...conserve, ...ajouts];
  };

  enregistrerPlan(dossierId, utilisateur.id, {
    constats: fusionner('constats'),
    objectifs: fusionner('objectifs'),
    pistes: fusionner('pistes'),
    dispositifs: fusionner('dispositifs'),
    aVerifier: fusionner('aVerifier'),
    actions: fusionner('actions'),
    ressources: fusionner('ressources'),
    echeances: fusionner('echeances'),
    prochainesEtapes: fusionner('prochainesEtapes'),
  });
  revalidatePath(`/dossiers/${dossierId}`);
}

export async function enregistrerPlanAction(formData: FormData) {
  const utilisateur = exigerSession();
  const dossierId = texte(formData, 'dossierId');
  if (!dossierId) return;

  enregistrerPlan(dossierId, utilisateur.id, {
    constats: lignes(formData, 'constats'),
    objectifs: lignes(formData, 'objectifs'),
    pistes: lignes(formData, 'pistes'),
    dispositifs: lignes(formData, 'dispositifs'),
    aVerifier: lignes(formData, 'aVerifier'),
    actions: lignes(formData, 'actions'),
    ressources: lignes(formData, 'ressources'),
    echeances: lignes(formData, 'echeances'),
    prochainesEtapes: lignes(formData, 'prochainesEtapes'),
  });

  revalidatePath(`/dossiers/${dossierId}`);
}

export async function genererEntretienAction(formData: FormData) {
  const utilisateur = exigerSession();
  const type = texte(formData, 'type') || 'premiere_demande';
  const contexte = texte(formData, 'contexte');
  const dossierId = texte(formData, 'dossierId');
  // Un entretien rattaché à un dossier ne doit pouvoir l'être qu'au sien.
  if (dossierId) exigerDossier(dossierId, utilisateur.id);
  const trame = genererTrame(type, contexte);
  enregistrerEntretien(type, trame, dossierId || null);
  revalidatePath('/entretien');
  const parametres = new URLSearchParams({ type, contexte });
  if (dossierId) parametres.set('dossierId', dossierId);
  redirect(`/entretien?${parametres.toString()}`);
}

export async function ingererDocumentAction(formData: FormData) {
  // La base documentaire est commune : sa modification relève de l'administrateur.
  exigerAdministrateur();
  const fichier = formData.get('fichier');
  if (!(fichier instanceof File) || fichier.size === 0) {
    redirect('/base-documentaire?erreur=' + encodeURIComponent('Aucun fichier reçu.'));
  }

  const ext = path.extname((fichier as File).name).toLowerCase();
  if (!FORMATS_ACCEPTES.has(ext)) {
    redirect(
      '/base-documentaire?erreur=' +
        encodeURIComponent(`Format non pris en charge : ${ext || 'inconnu'} (attendu .pdf, .md, .txt)`),
    );
  }

  const titre = texte(formData, 'titre') || (fichier as File).name;
  const source = texte(formData, 'source') || 'Source non précisée';

  try {
    const buffer = Buffer.from(await (fichier as File).arrayBuffer());
    const pages = await extraireDepuisBuffer(buffer, ext);
    const resultat = ingererDocument(
      {
        titre,
        source,
        url: texte(formData, 'url') || null,
        datePublication: texte(formData, 'datePublication') || null,
        statut: texte(formData, 'statut') === 'a_verifier' ? 'a_verifier' : 'officiel',
        fichier: (fichier as File).name,
      },
      pages,
    );
    revalidatePath('/base-documentaire');
    revalidatePath('/');
    redirect(
      '/base-documentaire?succes=' +
        encodeURIComponent(
          `« ${titre} » ingéré : ${resultat.nbPassages} passages indexés${resultat.remplace ? ' (document remplacé)' : ''}.`,
        ),
    );
  } catch (erreur) {
    if (erreur instanceof Error && erreur.message.includes('NEXT_REDIRECT')) throw erreur;
    const message = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
    redirect('/base-documentaire?erreur=' + encodeURIComponent(message));
  }
}

export async function supprimerDocumentAction(formData: FormData) {
  exigerAdministrateur();
  const id = texte(formData, 'documentId');
  if (id) supprimerDocument(id);
  revalidatePath('/base-documentaire');
  revalidatePath('/');
}

export async function majDispositifAction(formData: FormData) {
  exigerSession();
  const id = texte(formData, 'dispositifId');
  if (!id) return;

  const champs = {
    objectif: texte(formData, 'objectif') || null,
    public_concerne: texte(formData, 'publicConcerne') || null,
    conditions: texte(formData, 'conditions') || null,
    demarches: texte(formData, 'demarches') || null,
    acteurs: texte(formData, 'acteurs') || null,
    points_vigilance: texte(formData, 'pointsVigilance') || null,
    ressources: texte(formData, 'ressources') || null,
    date_information: texte(formData, 'dateInformation') || null,
    source: texte(formData, 'source') || null,
  };

  const renseigne = Object.values(champs).some((v) => v !== null);
  const statut = renseigne && champs.source ? 'verifie_source' : 'non_verifie';

  getDb()
    .prepare(
      `UPDATE dispositifs SET objectif = ?, public_concerne = ?, conditions = ?, demarches = ?,
              acteurs = ?, points_vigilance = ?, ressources = ?, date_information = ?, source = ?,
              statut_verification = ?
        WHERE id = ?`,
    )
    .run(
      champs.objectif,
      champs.public_concerne,
      champs.conditions,
      champs.demarches,
      champs.acteurs,
      champs.points_vigilance,
      champs.ressources,
      champs.date_information,
      champs.source,
      statut,
      id,
    );

  journaliser('dispositif.mise_a_jour', id, statut);
  revalidatePath(`/dispositifs/${id}`);
  revalidatePath('/dispositifs');
}
