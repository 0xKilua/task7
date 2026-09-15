import { genererEntretienAction } from '@/app/actions';
import { Bouton, Carte, EtatVide, EtiquetteIA, TitrePage } from '@/components/ui';
import { TYPES_ENTRETIEN, genererTrame } from '@/lib/entretien';

export const dynamic = 'force-dynamic';

export default function PageEntretien({
  searchParams,
}: {
  searchParams: { type?: string; contexte?: string; dossierId?: string };
}) {
  const type = searchParams.type ?? '';
  const contexte = searchParams.contexte ?? '';
  const dossierId = searchParams.dossierId ?? '';
  const trame = type ? genererTrame(type, contexte) : null;

  return (
    <>
      <TitrePage
        titre="Préparation d'entretien"
        chapo="Génère une trame de questions ouvertes et non directives adaptée au type d'entretien. La trame est un appui méthodologique : elle reste à adapter par le conseiller."
      />

      <Carte>
        <form action={genererEntretienAction} className="space-y-3">
          <input type="hidden" name="dossierId" value={dossierId} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-xs font-medium text-slate-600">
                Type d&apos;entretien
              </label>
              <select
                id="type"
                name="type"
                defaultValue={type || TYPES_ENTRETIEN[0].cle}
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              >
                {TYPES_ENTRETIEN.map((t) => (
                  <option key={t.cle} value={t.cle}>
                    {t.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contexte" className="block text-xs font-medium text-slate-600">
                Contexte à reprendre (facultatif)
              </label>
              <input
                id="contexte"
                name="contexte"
                defaultValue={contexte}
                placeholder="Ex. : souhait de mobilité géographique à un an"
                className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>
          </div>
          <Bouton>Générer la trame</Bouton>
        </form>
      </Carte>

      <div className="mt-6">
        {!trame ? (
          <EtatVide titre="Sélectionnez un type d'entretien pour générer une trame" />
        ) : (
          <div className="space-y-5">
            <Carte titre={trame.intitule} action={<EtiquetteIA>Trame méthodologique — à adapter</EtiquetteIA>}>
              <p className="text-sm text-slate-700">{trame.objectif}</p>
            </Carte>

            {trame.etapes.map((etape, index) => (
              <Carte key={etape.titre} titre={`${index + 1}. ${etape.titre}`}>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
                  {etape.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </Carte>
            ))}

            <Carte titre="Points de vigilance">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {trame.rappels.map((rappel) => (
                  <li key={rappel}>{rappel}</li>
                ))}
              </ul>
            </Carte>
          </div>
        )}
      </div>
    </>
  );
}
