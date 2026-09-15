import Link from 'next/link';
import { Bouton, Carte, EtiquetteIA, EtiquetteOfficielle, TitrePage } from '@/components/ui';
import { listerCategories, listerDispositifs } from '@/lib/dispositifs';
import { exigerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function PageDispositifs({
  searchParams,
}: {
  searchParams: { categorie?: string; q?: string };
}) {
  exigerSession();
  const categories = listerCategories();
  const categorie = searchParams.categorie ?? '';
  const recherche = searchParams.q ?? '';
  const dispositifs = listerDispositifs(categorie || undefined, recherche || undefined);

  const parCategorie = dispositifs.reduce<Record<string, typeof dispositifs>>((acc, d) => {
    (acc[d.categorie] ??= []).push(d);
    return acc;
  }, {});

  return (
    <>
      <TitrePage
        titre="Dispositifs"
        chapo="Catalogue des dispositifs d'accompagnement des parcours. Chaque fiche est documentée à partir d'une source officielle ; tant que ce n'est pas le cas, elle est signalée comme non vérifiée."
      />

      <Carte>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="q" className="block text-xs font-medium text-slate-600">
              Rechercher
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={recherche}
              placeholder="Nom du dispositif"
              className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="categorie" className="block text-xs font-medium text-slate-600">
              Catégorie
            </label>
            <select
              id="categorie"
              name="categorie"
              defaultValue={categorie}
              className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <Bouton>Filtrer</Bouton>
        </form>
      </Carte>

      <div className="mt-6 space-y-6">
        {Object.entries(parCategorie).map(([nomCategorie, liste]) => (
          <section key={nomCategorie}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {nomCategorie}
            </h2>
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {liste.map((dispositif) => (
                <li key={dispositif.id}>
                  <Link
                    href={`/dispositifs/${dispositif.id}`}
                    className="block h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-etat-200"
                  >
                    <p className="font-medium text-etat-700">{dispositif.nom}</p>
                    <div className="mt-2">
                      {dispositif.statutVerification === 'verifie_source' ? (
                        <EtiquetteOfficielle>
                          Documenté — source : {dispositif.source}
                        </EtiquetteOfficielle>
                      ) : (
                        <EtiquetteIA>Fiche à documenter depuis une source officielle</EtiquetteIA>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {dispositifs.length === 0 && (
          <p className="text-sm text-slate-600">Aucun dispositif ne correspond à ces critères.</p>
        )}
      </div>
    </>
  );
}
