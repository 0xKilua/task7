import type { Metadata } from 'next';
import Link from 'next/link';
import { BoutonImprimer } from '@/components/BoutonImprimer';
import { EtatVide } from '@/components/ui';
import { exigerSession, sessionCourante } from '@/lib/auth';
import { journaliser } from '@/lib/db';
import { listerDispositifs } from '@/lib/dispositifs';
import {
  CHAMPS_DIAGNOSTIC,
  ETAPES_BILAN,
  dernierBilan,
  dernierDiagnostic,
  exigerDossier,
  maintenantLocal,
  obtenirDossier,
  obtenirPlan,
} from '@/lib/dossiers';
import { formaterRdv } from '@/lib/format';
import { MESSAGE_A_VERIFIER, type Dispositif, type PlanAccompagnement } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Le titre de la page devient le nom de fichier proposé à l'enregistrement en PDF.
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const utilisateur = await sessionCourante();
  const dossier = utilisateur ? obtenirDossier(params.id, utilisateur.id) : null;
  return { title: dossier ? `Restitution ${dossier.reference}` : 'Document de restitution' };
}

const SECTIONS = [
  { cle: 'situation', libelle: 'Situation' },
  { cle: 'bilan', libelle: 'Bilan de parcours' },
  { cle: 'plan', libelle: "Plan d'accompagnement" },
  { cle: 'references', libelle: 'Références des dispositifs' },
  { cle: 'rdv', libelle: 'Prochain rendez-vous' },
] as const;

type CleSection = (typeof SECTIONS)[number]['cle'];

// Ordre et libellés pensés pour l'agent qui lit le document, pas pour la saisie.
const RUBRIQUES_PLAN: { cle: keyof PlanAccompagnement; libelle: string }[] = [
  { cle: 'objectifs', libelle: 'Vos objectifs' },
  { cle: 'constats', libelle: 'Constats partagés' },
  { cle: 'pistes', libelle: 'Pistes à explorer' },
  { cle: 'dispositifs', libelle: 'Dispositifs pouvant être mobilisés' },
  { cle: 'actions', libelle: 'Actions à réaliser' },
  { cle: 'echeances', libelle: 'Échéances' },
  { cle: 'prochainesEtapes', libelle: 'Prochaines étapes' },
  { cle: 'ressources', libelle: 'Ressources à consulter' },
  { cle: 'aVerifier', libelle: 'Points restant à vérifier' },
];

// Mention ajoutée par la proposition automatique de plan : utile au conseiller, jargon pour
// l'agent. Le statut de vérification réapparaît dans les références des dispositifs.
const MENTION_INTERNE = ' — entrée non encore documentée depuis une source officielle';

function sansMentionInterne(ligne: string): string {
  return ligne.endsWith(MENTION_INTERNE) ? ligne.slice(0, -MENTION_INTERNE.length) : ligne;
}

// Rattache une ligne du plan à la fiche du catalogue dont le nom la commence ; le nom le plus
// long l'emporte pour ne pas confondre deux dispositifs au nom proche.
function ficheDuCatalogue(ligne: string, catalogue: Dispositif[]): Dispositif | null {
  const texte = ligne.toLocaleLowerCase('fr-FR');
  let meilleure: Dispositif | null = null;
  for (const fiche of catalogue) {
    const nom = fiche.nom.toLocaleLowerCase('fr-FR');
    if (texte.startsWith(nom) && (!meilleure || nom.length > meilleure.nom.length)) meilleure = fiche;
  }
  return meilleure;
}

function TexteAvecLiens({ texte }: { texte: string }) {
  const morceaux = texte.split(/(https?:\/\/[^\s·]+)/g);
  return (
    <>
      {morceaux.map((morceau, index) =>
        /^https?:\/\//.test(morceau) ? (
          <a key={index} href={morceau} className="break-all text-etat-700 underline">
            {morceau}
          </a>
        ) : (
          <span key={index}>{morceau}</span>
        ),
      )}
    </>
  );
}

function Rubrique({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="break-after-avoid border-b border-slate-300 pb-1 text-base font-semibold text-etat-800">
        {titre}
      </h2>
      <div className="mt-2 text-sm text-slate-800">{children}</div>
    </section>
  );
}

export default async function PageRestitution(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ choix?: string; sections?: string | string[] }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const utilisateur = await exigerSession();
  const dossier = exigerDossier(params.id, utilisateur.id);
  const diagnostic = dernierDiagnostic(dossier.id, utilisateur.id);
  const bilan = dernierBilan(dossier.id, utilisateur.id);
  const plan = obtenirPlan(dossier.id, utilisateur.id);

  const demandees = searchParams.choix
    ? new Set(([] as string[]).concat(searchParams.sections ?? []))
    : new Set<string>(SECTIONS.map((s) => s.cle));

  const champsSituation = diagnostic
    ? CHAMPS_DIAGNOSTIC.filter((c) => (diagnostic.payload[c.cle] ?? '').trim().length > 0)
    : [];
  const etapesBilan = bilan
    ? ETAPES_BILAN.filter((e) => (bilan.payload[e.cle] ?? '').trim().length > 0)
    : [];
  const rubriquesPlan = plan
    ? RUBRIQUES_PLAN.filter((r) => ((plan[r.cle] as string[] | undefined) ?? []).length > 0)
    : [];

  const catalogue = listerDispositifs();
  const references = new Map<string, Dispositif>();
  for (const ligne of plan?.dispositifs ?? []) {
    const fiche = ficheDuCatalogue(ligne, catalogue);
    if (fiche) references.set(fiche.id, fiche);
  }

  const rdvAVenir =
    dossier.statut !== 'clos' && dossier.prochainRdv !== null && dossier.prochainRdv >= maintenantLocal()
      ? dossier.prochainRdv
      : null;

  const disponibles: Record<CleSection, boolean> = {
    situation: champsSituation.length > 0,
    bilan: etapesBilan.length > 0,
    plan: rubriquesPlan.length > 0,
    references: references.size > 0,
    rdv: rdvAVenir !== null,
  };
  const affichee = (cle: CleSection) => disponibles[cle] && demandees.has(cle);
  const aucunContenu = !Object.values(disponibles).some(Boolean);

  journaliser('restitution.edition', dossier.id, undefined, utilisateur.id);

  return (
    <>
      <div className="mb-6 space-y-4 print:hidden">
        <p className="text-sm">
          <Link href={`/dossiers/${dossier.id}`} className="text-etat-700 underline">
            ← Retour au dossier {dossier.reference}
          </Link>
        </p>
        <p className="rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Relisez ce document avant de le remettre : il reprend tels quels les éléments saisis dans
          le dossier. Les notes de suivi, internes, n&apos;y figurent pas.
        </p>
        <form method="get" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded border border-slate-200 bg-white p-3">
          <input type="hidden" name="choix" value="1" />
          <span className="text-xs font-medium text-slate-600">Sections à inclure :</span>
          {SECTIONS.map((section) => (
            <label key={section.cle} className="flex items-center gap-1 text-sm text-slate-700">
              <input
                type="checkbox"
                name="sections"
                value={section.cle}
                defaultChecked={demandees.has(section.cle)}
                disabled={!disponibles[section.cle]}
              />
              {section.libelle}
              {!disponibles[section.cle] && <span className="text-xs text-slate-400">(vide)</span>}
            </label>
          ))}
          <button type="submit" className="rounded border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50">
            Mettre à jour l&apos;aperçu
          </button>
        </form>
        <BoutonImprimer />
      </div>

      <article className="mx-auto max-w-3xl break-words rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b-2 border-etat-700 pb-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Fonction publique de l&apos;État — Accompagnement mobilité-carrière
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-etat-800">Synthèse de votre accompagnement</h1>
          <p className="mt-2 text-sm text-slate-700">
            Référence : <strong>{dossier.reference}</strong>
            {dossier.intitule && <> — {dossier.intitule}</>}
          </p>
          <p className="text-sm text-slate-700">
            Votre conseiller mobilité-carrière : {utilisateur.nom} · Document édité le{' '}
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </header>

        {aucunContenu && (
          <div className="mt-6 print:hidden">
            <EtatVide titre="Rien à restituer pour l'instant">
              Renseignez la fiche de situation, le bilan ou le plan d&apos;accompagnement du dossier.
            </EtatVide>
          </div>
        )}

        {affichee('situation') && diagnostic && (
          <Rubrique titre="Votre situation">
            <dl className="space-y-2">
              {champsSituation.map((c) => (
                <div key={c.cle} className="break-inside-avoid">
                  <dt className="font-medium text-slate-600">{c.libelle}</dt>
                  <dd className="whitespace-pre-line">{diagnostic.payload[c.cle].trim()}</dd>
                </div>
              ))}
            </dl>
          </Rubrique>
        )}

        {affichee('bilan') && bilan && (
          <Rubrique titre="Bilan de parcours">
            <dl className="space-y-2">
              {etapesBilan.map((e) => (
                <div key={e.cle} className="break-inside-avoid">
                  <dt className="font-medium text-slate-600">{e.libelle}</dt>
                  <dd className="whitespace-pre-line">{bilan.payload[e.cle].trim()}</dd>
                </div>
              ))}
            </dl>
          </Rubrique>
        )}

        {affichee('plan') && plan && (
          <Rubrique titre="Plan d'accompagnement">
            {rubriquesPlan.map((r) => (
              <div key={r.cle} className="mt-3 first:mt-0 break-inside-avoid">
                <h3 className="break-after-avoid font-medium text-slate-600">{r.libelle}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {(plan[r.cle] as string[]).map((ligne, index) => (
                    <li key={index}>{r.cle === 'dispositifs' ? sansMentionInterne(ligne) : ligne}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Rubrique>
        )}

        {affichee('references') && (
          <Rubrique titre="Références des dispositifs mentionnés">
            <ul className="space-y-3">
              {Array.from(references.values()).map((fiche) => (
                <li key={fiche.id} className="break-inside-avoid">
                  <p className="font-medium">{fiche.nom}</p>
                  {fiche.statutVerification === 'verifie_source' ? (
                    <>
                      {fiche.objectif && <p className="whitespace-pre-line">{fiche.objectif}</p>}
                      {fiche.source && <p className="text-xs text-slate-600">Source : {fiche.source}</p>}
                    </>
                  ) : (
                    <p className="text-amber-900">
                      Les informations sur ce dispositif n&apos;ont pas encore été vérifiées dans un
                      texte officiel. {MESSAGE_A_VERIFIER}
                    </p>
                  )}
                  {fiche.ressources && (
                    <p className="mt-1 text-xs text-slate-600">
                      Pour en savoir plus : <TexteAvecLiens texte={fiche.ressources} />
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Rubrique>
        )}

        {affichee('rdv') && rdvAVenir && (
          <Rubrique titre="Prochain rendez-vous">
            <p>{formaterRdv(rdvAVenir)}</p>
          </Rubrique>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-600">
          <p>
            Ce document récapitule les échanges intervenus dans le cadre de votre accompagnement. Il
            ne constitue ni une décision administrative, ni un avis juridique. Les conditions
            d&apos;accès aux dispositifs mentionnés doivent être confirmées auprès de votre service
            des ressources humaines.
          </p>
        </footer>
      </article>
    </>
  );
}
