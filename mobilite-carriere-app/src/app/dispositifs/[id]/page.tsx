import Link from 'next/link';
import { notFound } from 'next/navigation';
import { majDispositifAction } from '@/app/actions';
import {
  AlerteAVerifier,
  Bouton,
  Carte,
  ChampSource,
  EtiquetteIA,
  EtiquetteOfficielle,
  TitrePage,
} from '@/components/ui';
import { obtenirDispositif } from '@/lib/dispositifs';
import { rechercherPassages } from '@/lib/search';
import { BlocCitation } from '@/components/ui';

export const dynamic = 'force-dynamic';

const CHAMPS_EDITABLES = [
  { cle: 'objectif', libelle: 'Objectif' },
  { cle: 'publicConcerne', libelle: 'Public concerné' },
  { cle: 'conditions', libelle: "Conditions ou critères d'accès" },
  { cle: 'demarches', libelle: 'Démarches' },
  { cle: 'acteurs', libelle: 'Acteurs compétents' },
  { cle: 'pointsVigilance', libelle: 'Points de vigilance' },
  { cle: 'ressources', libelle: 'Ressources officielles' },
] as const;

export default function PageDispositif({ params }: { params: { id: string } }) {
  const dispositif = obtenirDispositif(params.id);
  if (!dispositif) notFound();

  const passages = rechercherPassages(dispositif.nom, 4);

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href="/dispositifs" className="text-etat-700 underline">
          ← Retour aux dispositifs
        </Link>
      </p>

      <TitrePage titre={dispositif.nom} chapo={dispositif.categorie} />

      <div className="mb-5">
        {dispositif.statutVerification === 'verifie_source' ? (
          <EtiquetteOfficielle>
            Fiche documentée — source : {dispositif.source}
            {dispositif.dateInformation && ` · information datée de ${dispositif.dateInformation}`}
          </EtiquetteOfficielle>
        ) : (
          <EtiquetteIA>
            Entrée de catalogue non encore documentée depuis une source officielle
          </EtiquetteIA>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Carte titre="Fiche dispositif">
          {dispositif.statutVerification === 'non_verifie' && (
            <div className="mb-3">
              <AlerteAVerifier />
            </div>
          )}
          <dl>
            <ChampSource libelle="Objectif" valeur={dispositif.objectif} />
            <ChampSource libelle="Public concerné" valeur={dispositif.publicConcerne} />
            <ChampSource libelle="Conditions ou critères d'accès" valeur={dispositif.conditions} />
            <ChampSource libelle="Démarches" valeur={dispositif.demarches} />
            <ChampSource libelle="Acteurs compétents" valeur={dispositif.acteurs} />
            <ChampSource libelle="Points de vigilance" valeur={dispositif.pointsVigilance} />
            <ChampSource libelle="Ressources officielles" valeur={dispositif.ressources} />
            <ChampSource libelle="Fraîcheur de l'information" valeur={dispositif.dateInformation} />
            <ChampSource libelle="Source" valeur={dispositif.source} />
          </dl>
        </Carte>

        <div className="space-y-5">
          <Carte titre="Passages correspondants dans la base documentaire">
            {passages.length === 0 ? (
              <AlerteAVerifier texte="Aucun passage correspondant n'a été trouvé dans les documents ingérés." />
            ) : (
              <ul className="space-y-3">
                {passages.map((citation, index) => (
                  <BlocCitation key={citation.passageId} citation={citation} index={index + 1} />
                ))}
              </ul>
            )}
          </Carte>

          <Carte titre="Documenter cette fiche depuis une source">
            <p className="mb-3 text-xs text-slate-600">
              Ne renseigner que des éléments figurant dans un document officiel, en indiquant la
              source. La fiche n&apos;est marquée comme documentée que si une source est renseignée.
            </p>
            <form action={majDispositifAction} className="space-y-3">
              <input type="hidden" name="dispositifId" value={dispositif.id} />
              {CHAMPS_EDITABLES.map((champ) => (
                <div key={champ.cle}>
                  <label
                    htmlFor={champ.cle}
                    className="block text-xs font-medium text-slate-600"
                  >
                    {champ.libelle}
                  </label>
                  <textarea
                    id={champ.cle}
                    name={champ.cle}
                    rows={2}
                    defaultValue={dispositif[champ.cle] ?? ''}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                </div>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="dateInformation" className="block text-xs font-medium text-slate-600">
                    Date ou fraîcheur de l&apos;information
                  </label>
                  <input
                    id="dateInformation"
                    name="dateInformation"
                    defaultValue={dispositif.dateInformation ?? ''}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="source" className="block text-xs font-medium text-slate-600">
                    Source (obligatoire pour valider)
                  </label>
                  <input
                    id="source"
                    name="source"
                    defaultValue={dispositif.source ?? ''}
                    placeholder="Ex. : DGAFP — guide, section X, page Y"
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>
              <Bouton>Enregistrer la fiche</Bouton>
            </form>
          </Carte>
        </div>
      </div>
    </>
  );
}
