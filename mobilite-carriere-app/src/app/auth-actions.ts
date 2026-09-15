'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  COOKIE_SESSION,
  aucunUtilisateur,
  changerMotDePasse,
  connecter,
  creerUtilisateur,
  deconnecter,
  deconnecterToutesLesSessions,
  exigerAdministrateur,
  exigerSession,
  hacherMotDePasse,
  motDePasseValide,
  validerMotDePasse,
} from '@/lib/auth';
import { getDb, journaliser } from '@/lib/db';

function texte(formData: FormData, cle: string): string {
  const valeur = formData.get(cle);
  return typeof valeur === 'string' ? valeur : '';
}

function poserCookieSession(jeton: string) {
  cookies().set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 12 * 3600,
  });
}

export async function installationAction(formData: FormData) {
  // Sans ce verrou, la page d'installation permettrait de se créer un compte
  // administrateur sur une instance déjà en service.
  if (!aucunUtilisateur()) redirect('/connexion');

  const identifiant = texte(formData, 'identifiant').trim();
  const nom = texte(formData, 'nom').trim();
  const motDePasse = texte(formData, 'motDePasse');
  const confirmation = texte(formData, 'confirmation');

  const erreur =
    identifiant.length < 3
      ? "L'identifiant doit comporter au moins 3 caractères."
      : nom.length === 0
        ? 'Le nom est obligatoire.'
        : motDePasse !== confirmation
          ? 'Les deux mots de passe ne correspondent pas.'
          : validerMotDePasse(motDePasse);

  if (erreur) redirect('/installation?erreur=' + encodeURIComponent(erreur));

  const utilisateur = creerUtilisateur(identifiant, nom, motDePasse, 'administrateur');

  // Une base créée avant l'authentification contient des dossiers sans propriétaire :
  // ils reviennent au premier compte, faute de quoi ils resteraient inaccessibles.
  getDb()
    .prepare('UPDATE dossiers SET conseiller_id = ? WHERE conseiller_id IS NULL')
    .run(utilisateur.id);

  const resultat = connecter(identifiant, motDePasse);
  if (resultat.ok) poserCookieSession(resultat.jeton);
  redirect('/');
}

export async function connexionAction(formData: FormData) {
  if (aucunUtilisateur()) redirect('/installation');

  const identifiant = texte(formData, 'identifiant');
  const motDePasse = texte(formData, 'motDePasse');

  if (identifiant.trim().length === 0 || motDePasse.length === 0) {
    redirect('/connexion?erreur=' + encodeURIComponent('Identifiant et mot de passe sont requis.'));
  }

  const resultat = connecter(identifiant, motDePasse);
  if (!resultat.ok) redirect('/connexion?erreur=' + encodeURIComponent(resultat.message));

  poserCookieSession(resultat.jeton);
  redirect(resultat.utilisateur.doitChangerMotDePasse ? '/mon-compte?initial=1' : '/');
}

export async function deconnexionAction() {
  const jeton = cookies().get(COOKIE_SESSION)?.value;
  if (jeton) deconnecter(jeton);
  cookies().delete(COOKIE_SESSION);
  redirect('/connexion');
}

export async function changerMotDePasseAction(formData: FormData) {
  const utilisateur = exigerSession();
  const actuel = texte(formData, 'motDePasseActuel');
  const nouveau = texte(formData, 'motDePasse');
  const confirmation = texte(formData, 'confirmation');

  // Sans cette vérification, quiconque récupère une session ouverte — poste non
  // verrouillé, cookie recopié — s'approprie définitivement le compte, d'autant que le
  // changement ferme ensuite les sessions du titulaire légitime.
  // Seul le changement imposé à la première connexion en est dispensé : le mot de passe
  // provisoire est de toute façon connu de l'administrateur qui vient de le fixer.
  if (!utilisateur.doitChangerMotDePasse && !motDePasseValide(utilisateur.id, actuel)) {
    redirect('/mon-compte?erreur=' + encodeURIComponent('Le mot de passe actuel est incorrect.'));
  }

  const erreur = nouveau !== confirmation ? 'Les deux mots de passe ne correspondent pas.' : validerMotDePasse(nouveau);
  if (erreur) redirect('/mon-compte?erreur=' + encodeURIComponent(erreur));

  changerMotDePasse(utilisateur.id, nouveau);
  // Un changement de mot de passe doit invalider les sessions ouvertes ailleurs.
  deconnecterToutesLesSessions(utilisateur.id);
  cookies().delete(COOKIE_SESSION);
  redirect('/connexion?succes=' + encodeURIComponent('Mot de passe modifié. Reconnectez-vous.'));
}

export async function creerUtilisateurAction(formData: FormData) {
  exigerAdministrateur();

  const identifiant = texte(formData, 'identifiant').trim();
  const nom = texte(formData, 'nom').trim();
  const motDePasse = texte(formData, 'motDePasse');
  const role = texte(formData, 'role') === 'administrateur' ? 'administrateur' : 'conseiller';

  const erreur =
    identifiant.length < 3
      ? "L'identifiant doit comporter au moins 3 caractères."
      : nom.length === 0
        ? 'Le nom est obligatoire.'
        : validerMotDePasse(motDePasse);

  if (erreur) redirect('/administration?erreur=' + encodeURIComponent(erreur));

  try {
    creerUtilisateur(identifiant, nom, motDePasse, role, true);
  } catch (e) {
    const conflit = e instanceof Error && e.message.includes('UNIQUE constraint failed');
    redirect(
      '/administration?erreur=' +
        encodeURIComponent(
          conflit ? `L'identifiant « ${identifiant} » est déjà utilisé.` : "Le compte n'a pas pu être créé.",
        ),
    );
  }

  revalidatePath('/administration');
  redirect(
    '/administration?succes=' +
      encodeURIComponent(`Compte « ${identifiant} » créé. Le mot de passe devra être changé à la première connexion.`),
  );
}

export async function basculerActivationAction(formData: FormData) {
  const administrateur = exigerAdministrateur();
  const cible = texte(formData, 'utilisateurId');

  if (cible === administrateur.id) {
    redirect('/administration?erreur=' + encodeURIComponent('Vous ne pouvez pas désactiver votre propre compte.'));
  }

  const db = getDb();
  const ligne = db.prepare('SELECT actif FROM utilisateurs WHERE id = ?').get(cible) as
    | { actif: number }
    | undefined;
  if (!ligne) redirect('/administration');

  const nouvelEtat = ligne.actif === 1 ? 0 : 1;
  db.prepare('UPDATE utilisateurs SET actif = ? WHERE id = ?').run(nouvelEtat, cible);
  if (nouvelEtat === 0) deconnecterToutesLesSessions(cible);
  journaliser(nouvelEtat === 1 ? 'utilisateur.reactivation' : 'utilisateur.desactivation', cible);

  revalidatePath('/administration');
}

export async function reinitialiserMotDePasseAction(formData: FormData) {
  exigerAdministrateur();

  const cible = texte(formData, 'utilisateurId');
  const motDePasse = texte(formData, 'motDePasse');
  const erreur = validerMotDePasse(motDePasse);
  if (erreur) redirect('/administration?erreur=' + encodeURIComponent(erreur));

  getDb()
    .prepare('UPDATE utilisateurs SET mot_de_passe = ?, doit_changer_mot_de_passe = 1 WHERE id = ?')
    .run(hacherMotDePasse(motDePasse), cible);
  deconnecterToutesLesSessions(cible);
  journaliser('mot_de_passe.reinitialise', cible);

  revalidatePath('/administration');
  redirect(
    '/administration?succes=' +
      encodeURIComponent('Mot de passe réinitialisé. Il devra être changé à la prochaine connexion.'),
  );
}
