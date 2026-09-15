import Link from 'next/link';
import { repondre } from '@/lib/assistant';
import {
  AlerteAVerifier,
  BlocCitation,
  Bouton,
  Carte,
  EtatVide,
  EtiquetteIA,
  TitrePage,
} from '@/components/ui';

export const dynamic = 'force-dynamic';

const EXEMPLES = [
  'Quelles possibilités de mobilité peuvent être envisagées dans ma situation ?',
  'Je souhaite changer de métier dans la fonction publique, quelles pistes explorer ?',
  'Quels dispositifs de formation pourraient correspondre à mon projet ?',
  'Comment préparer un bilan de parcours professionnel ?',
  'Quels éléments faut-il analyser avant d’envisager une mobilité ?',
];

export default function PageAssistant({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const requete = (searchParams.q ?? '').trim();
  const reponse = requete.length > 0 ? repondre(requete) : null;

  return (
    <>
      <TitrePage
        titre="Assistant mobilité-carrière"
        chapo="L'assistant restitue les passages issus des documents ingérés et les met en regard de la situation décrite. Il ne formule aucune règle qui ne figure pas dans une source."
      />

      <Carte>
        <form method="get" className="space-y-3">
          <label htmlFor="q" className="block text-sm font-medium text-slate-700">
            Décrivez la situation ou posez votre question
          </label>
          <textarea
            id="q"
            name="q"
            rows={3}
            defaultValue={requete}
            placeholder="Ex. : un agent de catégorie B souhaite une mobilité géographique à échéance d'un an, quelles pistes explorer ?"
            className="w-full rounded border border-slate-300 p-3 text-sm focus:border-etat-600 focus:outline-none focus:ring-1 focus:ring-etat-600"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Bouton>Interroger</Bouton>
            <span className="text-xs text-slate-500">
              Ne saisissez que les éléments nécessaires à l&apos;accompagnement.
            </span>
          </div>
        </form>

        {!reponse && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Exemples de questions
            </p>
            <ul className="flex flex-wrap gap-2">
              {EXEMPLES.map((exemple) => (
                <li key={exemple}>
                  <Link
                    href={`/assistant?q=${encodeURIComponent(exemple)}`}
                    className="inline-block rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {exemple}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Carte>

      {reponse && (
        <div className="mt-6 space-y-5">
          <Carte titre="Situation">
            <p className="text-sm text-slate-800">{reponse.situation}</p>
          </Carte>

          <Carte titre="Analyse à partir des sources" action={<EtiquetteIA>Extraits sourcés</EtiquetteIA>}>
            {reponse.aSource ? (
              <ul className="space-y-3">
                {reponse.analyse.map((element, index) => (
                  <BlocCitation key={element.citation.passageId} citation={element.citation} index={index + 1} />
                ))}
              </ul>
            ) : (
              <>
                <AlerteAVerifier texte={reponse.message ?? undefined} />
                <p className="mt-3 text-sm text-slate-600">
                  Aucune analyse n&apos;est produite en l&apos;absence de source : l&apos;application
                  ne formule pas d&apos;information réglementaire non vérifiable.
                </p>
              </>
            )}
          </Carte>

          <Carte
            titre="Pistes et dispositifs à explorer"
            action={<EtiquetteIA>Rapprochement automatique — à valider</EtiquetteIA>}
          >
            {reponse.pistes.length === 0 ? (
              <EtatVide titre="Aucun dispositif du catalogue ne correspond aux termes employés" />
            ) : (
              <ul className="space-y-2">
                {reponse.pistes.map((piste) => (
                  <li key={piste.id} className="text-sm">
                    <Link href={`/dispositifs/${piste.id}`} className="font-medium text-etat-700 underline">
                      {piste.nom}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">{piste.categorie}</span>
                    {piste.statutVerification === 'non_verifie' && (
                      <span className="ml-2 text-xs text-amber-800">
                        — fiche non encore documentée depuis une source officielle
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          <div className="grid gap-5 lg:grid-cols-2">
            <Carte titre="Questions de clarification à poser à l'agent">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {reponse.questionsClarification.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </Carte>

            <Carte titre="Points à vérifier">
              <ul className="space-y-2">
                {reponse.aVerifier.map((point) => (
                  <li key={point}>
                    <AlerteAVerifier texte={point} />
                  </li>
                ))}
              </ul>
            </Carte>
          </div>

          <Carte titre="Prochaines étapes suggérées" action={<EtiquetteIA />}>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {reponse.prochainesEtapes.map((etape) => (
                <li key={etape}>{etape}</li>
              ))}
            </ol>
          </Carte>

          <Carte titre="Sources">
            {reponse.citations.length === 0 ? (
              <EtatVide titre="Aucune source mobilisée">
                <Link className="text-etat-700 underline" href="/base-documentaire">
                  Alimenter la base documentaire
                </Link>
              </EtatVide>
            ) : (
              <ul className="space-y-3">
                {reponse.citations.map((citation, index) => (
                  <BlocCitation key={citation.passageId} citation={citation} index={index + 1} />
                ))}
              </ul>
            )}
          </Carte>
        </div>
      )}
    </>
  );
}
