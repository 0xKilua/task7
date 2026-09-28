import Link from 'next/link';
import { OngletsAdministration } from '@/app/administration/Onglets';
import { Carte, EtatVide, TitrePage } from '@/components/ui';
import { exigerAdministrateur } from '@/lib/auth';
import { formaterHorodatage } from '@/lib/format';
import { FAMILLES, listerJournal } from '@/lib/journal';

export const dynamic = 'force-dynamic';

export default async function PageJournal(props: { searchParams: Promise<{ famille?: string }> }) {
  const searchParams = await props.searchParams;
  await exigerAdministrateur();
  const famille = FAMILLES.some((f) => f.valeur === searchParams.famille) ? searchParams.famille : undefined;
  const entrees = listerJournal(famille);

  return (
    <>
      <TitrePage
        titre="Journal des actions"
        chapo="Qui a fait quoi, et quand. Le journal ne contient aucune donnée sur les agents : seulement la nature de l'action et des identifiants techniques."
      />
      <OngletsAdministration actif="/administration/journal" />

      <Carte titre={`Dernières actions (${entrees.length})`}>
        <nav aria-label="Filtrer le journal" className="mb-3 flex flex-wrap gap-2">
          {[{ valeur: undefined, libelle: 'Tout' }, ...FAMILLES].map((f) => (
            <Link
              key={f.libelle}
              href={f.valeur ? `/administration/journal?famille=${f.valeur}` : '/administration/journal'}
              aria-current={f.valeur === famille ? 'page' : undefined}
              className={`rounded border px-3 py-1 text-xs font-medium ${
                f.valeur === famille ? 'border-etat-600 bg-etat-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.libelle}
            </Link>
          ))}
        </nav>
        {entrees.length === 0 ? (
          <EtatVide titre="Aucune action enregistrée" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Auteur</th>
                  <th className="py-2 font-medium">Objet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entrees.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap py-2 pr-3 text-slate-600">{formaterHorodatage(e.ts)}</td>
                    <td className="py-2 pr-3 text-slate-800">{e.libelle}</td>
                    <td className="py-2 pr-3 text-slate-700">{e.acteur ?? '—'}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {e.cible && <code>{e.cible}</code>}
                      {e.details && <span className="ml-1">{e.details}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </>
  );
}
