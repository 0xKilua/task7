import Link from 'next/link';
import { creerDossierAction } from '@/app/actions';
import { BadgeStatut, Bouton, Carte, EtatVide, TitrePage } from '@/components/ui';
import { exigerSession } from '@/lib/auth';
import { estStatut, listerDossiers, maintenantLocal } from '@/lib/dossiers';
import { formaterRdv } from '@/lib/format';
import { LIBELLES_STATUT, type StatutDossier } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function PageDossiers({
  searchParams,
}: {
  searchParams: { erreur?: string; statut?: string };
}) {
  const utilisateur = exigerSession();
  const filtre = searchParams.statut && estStatut(searchParams.statut) ? searchParams.statut : undefined;
  const dossiers = listerDossiers(utilisateur.id, 200, filtre);
  const maintenant = maintenantLocal();
  const filtres: { valeur?: StatutDossier; libelle: string }[] = [
    { libelle: 'Tous' },
    ...Object.entries(LIBELLES_STATUT).map(([valeur, libelle]) => ({
      valeur: valeur as StatutDossier,
      libelle,
    })),
  ];

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
            <nav aria-label="Filtrer par statut" className="mb-3 flex flex-wrap gap-2">
              {filtres.map((f) => {
                const actif = f.valeur === filtre;
                return (
                  <Link
                    key={f.libelle}
                    href={f.valeur ? `/dossiers?statut=${f.valeur}` : '/dossiers'}
                    aria-current={actif ? 'page' : undefined}
                    className={`rounded border px-3 py-1 text-xs font-medium ${
                      actif
                        ? 'border-etat-600 bg-etat-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f.libelle}
                  </Link>
                );
              })}
            </nav>
            {dossiers.length === 0 ? (
              <EtatVide
                titre={filtre ? `Aucun accompagnement « ${LIBELLES_STATUT[filtre]} »` : 'Aucun accompagnement enregistré'}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {dossiers.map((dossier) => (
                  <li key={dossier.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dossiers/${dossier.id}`}
                        className="font-medium text-etat-700 underline"
                      >
                        {dossier.reference}
                      </Link>
                      <BadgeStatut statut={dossier.statut} />
                    </div>
                    {dossier.intitule && (
                      <p className="text-sm text-slate-600">{dossier.intitule}</p>
                    )}
                    {dossier.prochainRdv && dossier.statut !== 'clos' && (
                      <p
                        className={`text-xs ${dossier.prochainRdv < maintenant ? 'font-medium text-amber-800' : 'text-slate-700'}`}
                      >
                        {dossier.prochainRdv < maintenant ? 'Rendez-vous passé, à mettre à jour : ' : 'Prochain rendez-vous : '}
                        {formaterRdv(dossier.prochainRdv)}
                      </p>
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
