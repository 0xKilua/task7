import { redirect } from 'next/navigation';
import { installationAction } from '@/app/auth-actions';
import { aucunUtilisateur } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function PageInstallation({ searchParams }: { searchParams: { erreur?: string } }) {
  if (!aucunUtilisateur()) redirect('/connexion');

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-etat-800">Première installation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Aucun compte n&apos;existe encore. Créez le compte administrateur : il pourra ensuite
          ouvrir les comptes des conseillers.
        </p>

        {searchParams.erreur && (
          <p role="alert" className="mt-4 rounded border-l-4 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-900">
            {searchParams.erreur}
          </p>
        )}

        <form action={installationAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-slate-700">
              Nom affiché
            </label>
            <input id="nom" name="nom" required className="mt-1 w-full rounded border border-slate-300 p-2 text-sm" />
          </div>
          <div>
            <label htmlFor="identifiant" className="block text-sm font-medium text-slate-700">
              Identifiant de connexion
            </label>
            <input
              id="identifiant"
              name="identifiant"
              autoComplete="username"
              required
              className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">12 caractères minimum.</p>
          </div>
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-slate-700">
              Confirmer le mot de passe
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
          <button
            type="submit"
            className="w-full rounded bg-etat-600 px-3 py-2 text-sm font-medium text-white hover:bg-etat-700"
          >
            Créer le compte administrateur
          </button>
        </form>
      </div>
    </div>
  );
}
