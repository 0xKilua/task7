import Link from 'next/link';
import { creerDossierAction } from '@/app/actions';
import { Bouton, Carte, EtatVide, TitrePage } from '@/components/ui';
import { listerDossiers } from '@/lib/dossiers';

export const dynamic = 'force-dynamic';

export default function PageDossiers({ searchParams }: { searchParams: { erreur?: string } }) {
  const dossiers = listerDossiers();

  return (
    <>
      <TitrePage
        titre="Accompagnements"
        chapo="Chaque accompagnement est identifié par une référence choisie par le conseiller. Par principe de minimisation, l'application ne demande ni nom, ni prénom, ni identifiant d'agent."
      />

      {searchParams.erreur && (
        <p
          role="alert"
          className="mb-4 rounded border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {searchParams.erreur}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Nouvel accompagnement">
          <form action={creerDossierAction} className="space-y-3">
            <div>
              <label htmlFor="reference" className="block text-xs font-medium text-slate-600">
                Référence du dossier *
              </label>
              <input
                id="reference"
                name="reference"
                required
                placeholder="Ex. : ACC-2026-014"
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="intitule" className="block text-xs font-medium text-slate-600">
                Intitulé (facultatif)
              </label>
              <input
                id="intitule"
                name="intitule"
                placeholder="Ex. : projet de mobilité fonctionnelle"
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
            <Bouton>Créer le dossier</Bouton>
          </form>
        </Carte>

        <div className="lg:col-span-2">
          <Carte titre={`Dossiers (${dossiers.length})`}>
            {dossiers.length === 0 ? (
              <EtatVide titre="Aucun accompagnement enregistré" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {dossiers.map((dossier) => (
                  <li key={dossier.id} className="py-3">
                    <Link
                      href={`/dossiers/${dossier.id}`}
                      className="font-medium text-etat-700 underline"
                    >
                      {dossier.reference}
                    </Link>
                    {dossier.intitule && (
                      <p className="text-sm text-slate-600">{dossier.intitule}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Créé le {new Date(dossier.createdAt).toLocaleDateString('fr-FR')} · mis à jour
                      le {new Date(dossier.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>
      </div>
    </>
  );
}
