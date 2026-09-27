'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigerAdministrateur } from '@/lib/auth';
import { MOIS_MAX, appliquerPurge, enregistrerPolitique } from '@/lib/conservation';

function mois(formData: FormData, cle: string): number | null | 'invalide' {
  const brut = String(formData.get(cle) ?? '').trim();
  if (brut === '') return null;
  const valeur = Number(brut);
  return Number.isInteger(valeur) && valeur >= 1 && valeur <= MOIS_MAX ? valeur : 'invalide';
}

export async function enregistrerPolitiqueAction(formData: FormData) {
  const administrateur = exigerAdministrateur();
  const moisDossiersClos = mois(formData, 'moisDossiersClos');
  const moisJournal = mois(formData, 'moisJournal');
  if (moisDossiersClos === 'invalide' || moisJournal === 'invalide') {
    redirect(
      '/administration/donnees?erreur=' +
        encodeURIComponent(`Indiquez un nombre entier de mois entre 1 et ${MOIS_MAX}, ou laissez vide.`),
    );
  }
  enregistrerPolitique({ moisDossiersClos, moisJournal }, administrateur.id);
  revalidatePath('/administration/donnees');
  redirect('/administration/donnees?succes=' + encodeURIComponent('Politique de conservation enregistrée.'));
}

export async function appliquerPurgeAction(formData: FormData) {
  const administrateur = exigerAdministrateur();
  if (formData.get('confirmation') !== 'oui') {
    redirect(
      '/administration/donnees?erreur=' +
        encodeURIComponent('Cochez la case de confirmation : la suppression est définitive.'),
    );
  }
  const { dossiers, journal } = appliquerPurge(administrateur.id);
  revalidatePath('/administration/donnees');
  revalidatePath('/');
  redirect(
    '/administration/donnees?succes=' +
      encodeURIComponent(
        `Politique appliquée : ${dossiers} accompagnement(s) clos et ${journal} entrée(s) de journal supprimés.`,
      ),
  );
}
