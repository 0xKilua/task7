import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  enregistrerBilanAction,
  enregistrerDiagnosticAction,
  enregistrerPlanAction,
  genererPlanAction,
  supprimerDossierAction,
} from '@/app/actions';
import { AlerteAVerifier, Bouton, Carte, EtatVide, EtiquetteIA, TitrePage } from '@/components/ui';
import {
  CHAMPS_DIAGNOSTIC,
  ETAPES_BILAN,
  dernierBilan,
  dernierDiagnostic,
  obtenirDossier,
  obtenirPlan,
} from '@/lib/dossiers';

export const dynamic = 'force-dynamic';

const SECTIONS_PLAN = [
  { cle: 'constats', libelle: 'Constats' },
  { cle: 'objectifs', libelle: "Objectifs de l'agent" },
  { cle: 'pistes', libelle: 'Pistes à explorer' },
  { cle: 'dispositifs', libelle: 'Dispositifs potentiellement pertinents' },
  { cle: 'aVerifier', libelle: 'Informations restant à vérifier' },
  { cle: 'actions', libelle: 'Actions à réaliser' },
  { cle: 'ressources', libelle: 'Ressources à consulter' },
  { cle: 'echeances', libelle: 'Échéances' },
  { cle: 'prochainesEtapes', libelle: 'Prochaines étapes' },
] as const;

export default function PageDossier({ params }: { params: { id: string } }) {
  const dossier = obtenirDossier(params.id);
  if (!dossier) notFound();

  const diagnostic = dernierDiagnostic(dossier.id);
  const bilan = dernierBilan(dossier.id);
  const plan = obtenirPlan(dossier.id);

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href="/dossiers" className="text-etat-700 underline">
          ← Retour aux accompagnements
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <TitrePage titre={dossier.reference} chapo={dossier.intitule ?? undefined} />
        <form action={supprimerDossierAction}>
          <input type="hidden" name="dossierId" value={dossier.id} />
          <Bouton variante="secondaire">Supprimer ce dossier</Bouton>
        </form>
      </div>

      <div className="space-y-6">
        <Carte titre="Fiche de situation">
          <form action={enregistrerDiagnosticAction} className="space-y-3">
            <input type="hidden" name="dossierId" value={dossier.id} />
            <div className="grid gap-3 md:grid-cols-2">
              {CHAMPS_DIAGNOSTIC.map((champ) => (
                <div key={champ.cle}>
                  <label htmlFor={champ.cle} className="block text-xs font-medium text-slate-600">
                    {champ.libelle}
                    {champ.aide && <span className="ml-1 text-slate-400">({champ.aide})</span>}
                  </label>
                  <textarea
                    id={champ.cle}
                    name={champ.cle}
                    rows={2}
                    defaultValue={diagnostic?.payload[champ.cle] ?? ''}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <Bouton>Enregistrer et générer la synthèse</Bouton>
          </form>
        </Carte>

        {diagnostic && (
          <Carte titre="Synthèse de situation" action={<EtiquetteIA>Mise en forme des éléments saisis</EtiquetteIA>}>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
              {diagnostic.synthese}
            </pre>
            <p className="mt-3 text-xs text-slate-500">
              Générée le {new Date(diagnostic.createdAt).toLocaleString('fr-FR')}
            </p>
          </Carte>
        )}

        <Carte titre="Bilan de parcours professionnel">
          <p className="mb-3 text-xs text-slate-600">
            Exploration progressive du parcours. Ce module n&apos;a pas vocation à produire un
            diagnostic psychologique ou médical.
          </p>
          <form action={enregistrerBilanAction} className="space-y-3">
            <input type="hidden" name="dossierId" value={dossier.id} />
            <ol className="grid gap-3 md:grid-cols-2">
              {ETAPES_BILAN.map((etape, index) => (
                <li key={etape.cle}>
                  <label htmlFor={etape.cle} className="block text-xs font-medium text-slate-600">
                    {index + 1}. {etape.libelle}
                  </label>
                  <textarea
                    id={etape.cle}
                    name={etape.cle}
                    rows={2}
                    defaultValue={bilan?.payload[etape.cle] ?? ''}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                </li>
              ))}
            </ol>
            <Bouton>Enregistrer le bilan</Bouton>
          </form>
        </Carte>

        {bilan && (
          <Carte titre="Synthèse de bilan" action={<EtiquetteIA>Mise en forme des éléments saisis</EtiquetteIA>}>
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
              {bilan.synthese}
            </pre>
            <p className="mt-3 text-xs text-slate-500">
              Générée le {new Date(bilan.createdAt).toLocaleString('fr-FR')}
            </p>
          </Carte>
        )}

        <Carte
          titre="Plan d'accompagnement"
          action={
            <form action={genererPlanAction}>
              <input type="hidden" name="dossierId" value={dossier.id} />
              <Bouton variante="secondaire">Proposer un plan</Bouton>
            </form>
          }
        >
          {!plan ? (
            <EtatVide titre="Aucun plan d'accompagnement">
              Renseignez la fiche de situation puis demandez une proposition de plan, librement
              modifiable ensuite.
            </EtatVide>
          ) : (
            <>
              <div className="mb-3">
                <EtiquetteIA>Proposition générée — à modifier, compléter ou supprimer</EtiquetteIA>
              </div>
              <AlerteAVerifier />
              <form action={enregistrerPlanAction} className="mt-4 space-y-3">
                <input type="hidden" name="dossierId" value={dossier.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  {SECTIONS_PLAN.map((section) => (
                    <div key={section.cle}>
                      <label
                        htmlFor={section.cle}
                        className="block text-xs font-medium text-slate-600"
                      >
                        {section.libelle}{' '}
                        <span className="text-slate-400">(une ligne par élément)</span>
                      </label>
                      <textarea
                        id={section.cle}
                        name={section.cle}
                        rows={3}
                        defaultValue={(plan[section.cle] ?? []).join('\n')}
                        className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <Bouton>Enregistrer le plan</Bouton>
              </form>
              <p className="mt-3 text-xs text-slate-500">
                Dernière mise à jour : {new Date(plan.updatedAt).toLocaleString('fr-FR')}
              </p>
            </>
          )}
        </Carte>

        <Carte titre="Préparer un entretien pour ce dossier">
          <p className="mb-3 text-sm text-slate-700">
            Générer une trame d&apos;entretien en reprenant le contexte de ce dossier.
          </p>
          <Link
            href={`/entretien?dossierId=${dossier.id}&contexte=${encodeURIComponent(
              diagnostic?.payload.projetProfessionnel || diagnostic?.payload.souhaitsEvolution || '',
            )}`}
            className="inline-flex items-center rounded bg-etat-600 px-3 py-2 text-sm font-medium text-white hover:bg-etat-700"
          >
            Générer une trame d&apos;entretien
          </Link>
        </Carte>
      </div>
    </>
  );
}
