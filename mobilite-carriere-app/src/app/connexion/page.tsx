import { redirect } from 'next/navigation';
import { connexionAction } from '@/app/auth-actions';
import { aucunUtilisateur, sessionCourante } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function PageConnexion({
  searchParams,
}: {
  searchParams: { erreur?: string; succes?: string };
}) {
  if (aucunUtilisateur()) redirect('/installation');
  if (sessionCourante()) redirect('/');

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-etat-800">Connexion</h1>
        <p className="mt-1 text-sm text-slate-600">
          Accès réservé aux conseillers mobilité-carrière habilités.
        </p>

        {searchParams.erreur && (
          <p role="alert" className="mt-4 rounded border-l-4 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-900">
            {searchParams.erreur}
          </p>
        )}
        {searchParams.succes && (
          <p role="status" className="mt-4 rounded border-l-4 border-emerald-400 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {searchParams.succes}
          </p>
        )}

        <form action={connexionAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="identifiant" className="block text-sm font-medium text-slate-700">
              Identifiant
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
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-etat-600 px-3 py-2 text-sm font-medium text-white hover:bg-etat-700"
          >
            Se connecter
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Les données d&apos;accompagnement sont confidentielles. Ne partagez pas vos identifiants.
      </p>
    </div>
  );
}
