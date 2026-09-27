import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ajouterNoteSuiviAction,
  enregistrerBilanAction,
  enregistrerDiagnosticAction,
  enregistrerPlanAction,
  genererPlanAction,
  mettreAJourSuiviAction,
  supprimerDossierAction,
  supprimerNoteSuiviAction,
} from '@/app/actions';
import {
  AlerteAVerifier,
  BadgeStatut,
  Bouton,
  Carte,
  EtatVide,
  EtiquetteIA,
  LienBouton,
  TitrePage,
} from '@/components/ui';
import { exigerSession } from '@/lib/auth';
import {
  CHAMPS_DIAGNOSTIC,
  ETAPES_BILAN,
  aujourdhuiLocal,
  dernierBilan,
  dernierDiagnostic,
  listerNotesSuivi,
  maintenantLocal,
  obtenirDossier,
  obtenirPlan,
} from '@/lib/dossiers';
import { formaterJour, formaterRdv } from '@/lib/format';
import { LIBELLES_MODALITE, LIBELLES_STATUT } from '@/lib/types';

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

export default function PageDossier({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erreur?: string };
}) {
  const utilisateur = exigerSession();
  const dossier = obtenirDossier(params.id, utilisateur.id);
  if (!dossier) notFound();

  const diagnostic = dernierDiagnostic(dossier.id, utilisateur.id);
  const bilan = dernierBilan(dossier.id, utilisateur.id);
  const plan = obtenirPlan(dossier.id, utilisateur.id);
  const notes = listerNotesSuivi(dossier.id, utilisateur.id);
  const rdvPasse =
    dossier.statut !== 'clos' && dossier.prochainRdv !== null && dossier.prochainRdv < maintenantLocal();

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href="/dossiers" className="text-etat-700 underline">
          ← Retour aux accompagnements
        </Link>
      </p>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <TitrePage titre={dossier.reference} chapo={dossier.intitule ?? undefined} />
          <div className="-mt-4 mb-2">
            <BadgeStatut statut={dossier.statut} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LienBouton href={`/dossiers/${dossier.id}/restitution`}>Document de restitution</LienBouton>
          <form action={supprimerDossierAction}>
            <input type="hidden" name="dossierId" value={dossier.id} />
            <Bouton variante="secondaire">Supprimer ce dossier</Bouton>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <div id="suivi" className="scroll-mt-4">
          <Carte titre="Suivi de l'accompagnement">
            {searchParams.erreur && (
              <p
                role="alert"
                className="mb-4 rounded border-l-4 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-900"
              >
                {searchParams.erreur}
              </p>
            )}
            {rdvPasse && dossier.prochainRdv && (
              <p
                role="status"
                className="mb-4 rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                Le rendez-vous du {formaterRdv(dossier.prochainRdv)} est passé : consignez
                l&apos;échange ci-dessous puis fixez le prochain rendez-vous.
              </p>
            )}

            <form action={mettreAJourSuiviAction} className="grid gap-3 md:grid-cols-3 md:items-end">
              <input type="hidden" name="dossierId" value={dossier.id} />
              <div>
                <label htmlFor="statut" className="block text-xs font-medium text-slate-600">
                  Statut
                </label>
                <select
                  id="statut"
                  name="statut"
                  defaultValue={dossier.statut}
                  className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm"
                >
                  {Object.entries(LIBELLES_STATUT).map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>
                      {libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prochainRdv" className="block text-xs font-medium text-slate-600">
                  Prochain rendez-vous
                </label>
                <input
                  id="prochainRdv"
                  name="prochainRdv"
                  type="datetime-local"
                  defaultValue={dossier.prochainRdv ?? ''}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
              <div>
                <Bouton>Enregistrer le suivi</Bouton>
              </div>
            </form>
            <p className="mt-2 text-xs text-slate-500">
              {dossier.prochainRdv && !rdvPasse
                ? `Prochain rendez-vous : ${formaterRdv(dossier.prochainRdv)}. `
                : ''}
              Passer l&apos;accompagnement à « Clos » efface le rendez-vous prévu.
            </p>

            <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-800">
              Historique des échanges
            </h3>
            <form action={ajouterNoteSuiviAction} className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
              <input type="hidden" name="dossierId" value={dossier.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor="dateEchange" className="block text-xs font-medium text-slate-600">
                    Date de l&apos;échange
                  </label>
                  <input
                    id="dateEchange"
                    name="dateEchange"
                    type="date"
                    required
                    defaultValue={aujourdhuiLocal()}
                    className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="modalite" className="block text-xs font-medium text-slate-600">
                    Modalité
                  </label>
                  <select
                    id="modalite"
                    name="modalite"
                    defaultValue="entretien"
                    className="mt-1 w-full rounded border border-slate-300 bg-white p-2 text-sm"
                  >
                    {Object.entries(LIBELLES_MODALITE).map(([valeur, libelle]) => (
                      <option key={valeur} value={valeur}>
                        {libelle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="compteRendu" className="block text-xs font-medium text-slate-600">
                  Compte rendu
                </label>
                <textarea
                  id="compteRendu"
                  name="compteRendu"
                  rows={3}
                  required
                  maxLength={5000}
                  className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Consignez uniquement ce qui est utile à l&apos;accompagnement : ni information de
                  santé, ni appréciation sur la personne. Ces notes restent internes et ne figurent
                  pas dans le document de restitution.
                </p>
              </div>
              <Bouton>Ajouter au suivi</Bouton>
            </form>

            {notes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Aucun échange consigné pour l&apos;instant.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="rounded border border-slate-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs font-medium text-slate-600">
                        {formaterJour(note.dateEchange)} · {LIBELLES_MODALITE[note.modalite]}
                      </p>
                      <form action={supprimerNoteSuiviAction}>
                        <input type="hidden" name="dossierId" value={dossier.id} />
                        <input type="hidden" name="noteId" value={note.id} />
                        <button type="submit" className="text-xs text-slate-500 underline hover:text-red-700">
                          Supprimer
                        </button>
                      </form>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{note.contenu}</p>
                  </li>
                ))}
              </ol>
            )}
          </Carte>
        </div>

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
