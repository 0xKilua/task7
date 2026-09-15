import {
  basculerActivationAction,
  creerUtilisateurAction,
  reinitialiserMotDePasseAction,
} from '@/app/auth-actions';
import { Bouton, Carte, TitrePage } from '@/components/ui';
import { exigerAdministrateur } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface LigneCompte {
  id: string;
  identifiant: string;
  nom: string;
  role: string;
  actif: number;
  created_at: string;
  derniere_connexion: string | null;
  nb_dossiers: number;
}

export default function PageAdministration({
  searchParams,
}: {
  searchParams: { erreur?: string; succes?: string };
}) {
  const administrateur = exigerAdministrateur();

  const comptes = getDb()
    .prepare(
      `SELECT u.id, u.identifiant, u.nom, u.role, u.actif, u.created_at, u.derniere_connexion,
              (SELECT COUNT(*) FROM dossiers d WHERE d.conseiller_id = u.id) AS nb_dossiers
         FROM utilisateurs u
        ORDER BY u.nom`,
    )
    .all() as LigneCompte[];

  return (
    <>
      <TitrePage
        titre="Administration des comptes"
        chapo="Gestion des accès à l'application. Les accompagnements restent cloisonnés : un administrateur gère les comptes, il n'accède pas aux dossiers des conseillers."
      />

      {searchParams.succes && (
        <p role="status" className="mb-4 rounded border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {searchParams.succes}
        </p>
      )}
      {searchParams.erreur && (
        <p role="alert" className="mb-4 rounded border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900">
          {searchParams.erreur}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Ouvrir un compte">
          <form action={creerUtilisateurAction} className="space-y-3">
            <div>
              <label htmlFor="nom" className="block text-xs font-medium text-slate-600">
                Nom affiché
              </label>
              <input id="nom" name="nom" required className="mt-1 w-full rounded border border-slate-300 p-2 text-sm" />
            </div>
            <div>
              <label htmlFor="identifiant" className="block text-xs font-medium text-slate-600">
                Identifiant
              </label>
              <input
                id="identifiant"
                name="identifiant"
                required
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="motDePasse" className="block text-xs font-medium text-slate-600">
                Mot de passe provisoire
              </label>
              <input
                id="motDePasse"
                name="motDePasse"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                12 caractères minimum. Il devra être changé à la première connexion.
              </p>
            </div>
            <div>
              <label htmlFor="role" className="block text-xs font-medium text-slate-600">
                Rôle
              </label>
              <select id="role" name="role" className="mt-1 w-full rounded border border-slate-300 p-2 text-sm">
                <option value="conseiller">Conseiller mobilité-carrière</option>
                <option value="administrateur">Administrateur</option>
              </select>
            </div>
            <Bouton>Créer le compte</Bouton>
          </form>
        </Carte>

        <div className="lg:col-span-2">
          <Carte titre={`Comptes (${comptes.length})`}>
            <ul className="divide-y divide-slate-100">
              {comptes.map((compte) => (
                <li key={compte.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {compte.nom}
                        <span className="ml-2 font-normal text-slate-500">({compte.identifiant})</span>
                        {compte.id === administrateur.id && (
                          <span className="ml-2 text-xs text-etat-700">— vous</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-600">
                        {compte.role === 'administrateur' ? 'Administrateur' : 'Conseiller'} ·{' '}
                        {compte.actif === 1 ? 'actif' : 'désactivé'} · {compte.nb_dossiers} accompagnement
                        {compte.nb_dossiers > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        {compte.derniere_connexion
                          ? `Dernière connexion le ${new Date(compte.derniere_connexion).toLocaleString('fr-FR')}`
                          : 'Jamais connecté'}
                      </p>
                    </div>

                    {compte.id !== administrateur.id && (
                      <form action={basculerActivationAction}>
                        <input type="hidden" name="utilisateurId" value={compte.id} />
                        <Bouton variante="secondaire">
                          {compte.actif === 1 ? 'Désactiver' : 'Réactiver'}
                        </Bouton>
                      </form>
                    )}
                  </div>

                  <form action={reinitialiserMotDePasseAction} className="mt-2 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="utilisateurId" value={compte.id} />
                    <div>
                      <label htmlFor={`mdp-${compte.id}`} className="block text-xs text-slate-500">
                        Nouveau mot de passe provisoire
                      </label>
                      <input
                        id={`mdp-${compte.id}`}
                        name="motDePasse"
                        type="password"
                        autoComplete="new-password"
                        className="mt-1 rounded border border-slate-300 p-1.5 text-sm"
                      />
                    </div>
                    <Bouton variante="secondaire">Réinitialiser</Bouton>
                  </form>
                </li>
              ))}
            </ul>
          </Carte>
        </div>
      </div>

      <div className="mt-5">
        <Carte titre="Journal des actions récentes">
          <JournalRecent />
        </Carte>
      </div>
    </>
  );
}

function JournalRecent() {
  const lignes = getDb()
    .prepare('SELECT ts, action, cible, details FROM journal ORDER BY id DESC LIMIT 25')
    .all() as { ts: string; action: string; cible: string | null; details: string | null }[];

  if (lignes.length === 0) return <p className="text-sm text-slate-600">Aucune action enregistrée.</p>;

  return (
    <ul className="space-y-1 text-xs text-slate-600">
      {lignes.map((ligne, index) => (
        <li key={index}>
          <span className="text-slate-500">{new Date(ligne.ts).toLocaleString('fr-FR')}</span>{' '}
          <span className="font-medium text-slate-800">{ligne.action}</span>
          {ligne.details && <> — {ligne.details}</>}
        </li>
      ))}
    </ul>
  );
}
