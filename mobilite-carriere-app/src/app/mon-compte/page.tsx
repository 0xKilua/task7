import { changerMotDePasseAction } from '@/app/auth-actions';
import { Bouton, Carte, TitrePage } from '@/components/ui';
import { exigerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function PageMonCompte({
  searchParams,
}: {
  searchParams: { erreur?: string; initial?: string };
}) {
  const utilisateur = exigerSession();

  return (
    <div className="mx-auto max-w-2xl">
      <TitrePage titre="Mon compte" />

      {searchParams.initial === '1' && (
        <p role="status" className="mb-4 rounded border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ce compte utilise un mot de passe défini par un administrateur. Changez-le avant de
          poursuivre.
        </p>
      )}
      {searchParams.erreur && (
        <p role="alert" className="mb-4 rounded border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900">
          {searchParams.erreur}
        </p>
      )}

      <div className="space-y-5">
        <Carte titre="Identité">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Nom</dt>
              <dd className="text-slate-800">{utilisateur.nom}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Identifiant</dt>
              <dd className="text-slate-800">{utilisateur.identifiant}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Rôle</dt>
              <dd className="text-slate-800">
                {utilisateur.role === 'administrateur' ? 'Administrateur' : 'Conseiller mobilité-carrière'}
              </dd>
            </div>
          </dl>
        </Carte>

        <Carte titre="Changer mon mot de passe">
          <form action={changerMotDePasseAction} className="space-y-3">
            {!utilisateur.doitChangerMotDePasse && (
              <div>
                <label htmlFor="motDePasseActuel" className="block text-xs font-medium text-slate-600">
                  Mot de passe actuel
                </label>
                <input
                  id="motDePasseActuel"
                  name="motDePasseActuel"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
            )}
            <div>
              <label htmlFor="motDePasse" className="block text-xs font-medium text-slate-600">
                Nouveau mot de passe (12 caractères minimum)
              </label>
              <input
                id="motDePasse"
                name="motDePasse"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmation" className="block text-xs font-medium text-slate-600">
                Confirmer
              </label>
              <input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <Bouton>Changer le mot de passe</Bouton>
            <p className="text-xs text-slate-500">
              Toutes vos sessions ouvertes seront fermées : vous devrez vous reconnecter.
            </p>
          </form>
        </Carte>
      </div>
    </div>
  );
}
