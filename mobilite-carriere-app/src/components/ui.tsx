import Link from 'next/link';
import { LIBELLES_STATUT, MESSAGE_A_VERIFIER, type Citation, type StatutDossier } from '@/lib/types';
import { mentionDate } from '@/lib/format';
import type { EtatRechercheParSens } from '@/lib/semantique';

const COULEURS_STATUT: Record<StatutDossier, string> = {
  en_cours: 'border-etat-200 bg-etat-50 text-etat-800',
  en_attente: 'border-amber-300 bg-amber-50 text-amber-800',
  clos: 'border-slate-300 bg-slate-100 text-slate-600',
};

export function BadgeStatut({ statut }: { statut: StatutDossier }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${COULEURS_STATUT[statut]}`}
    >
      {LIBELLES_STATUT[statut]}
    </span>
  );
}

export function TitrePage({ titre, chapo }: { titre: string; chapo?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-etat-800">{titre}</h1>
      {chapo && <p className="mt-1 max-w-3xl text-sm text-slate-600">{chapo}</p>}
    </div>
  );
}

export function Carte({
  titre,
  children,
  action,
}: {
  titre?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {titre && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-800">{titre}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EtiquetteIA({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
      {children ?? 'Suggestion générée — à valider par le conseiller'}
    </span>
  );
}

export function EtiquetteOfficielle({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
      {children}
    </span>
  );
}

export function AlerteAVerifier({ texte }: { texte?: string }) {
  return (
    <p className="rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {texte ?? MESSAGE_A_VERIFIER}
    </p>
  );
}

export function ChampSource({ libelle, valeur }: { libelle: string; valeur: string | null }) {
  return (
    <div className="border-t border-slate-100 py-2 first:border-t-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{libelle}</dt>
      <dd className="mt-1 text-sm">
        {valeur && valeur.trim().length > 0 ? (
          <span className="whitespace-pre-line text-slate-800">{valeur}</span>
        ) : (
          <span className="text-amber-800">{MESSAGE_A_VERIFIER}</span>
        )}
      </dd>
    </div>
  );
}

// Le moteur de recherche encadre les termes trouvés par deux caractères de contrôle,
// invisibles dans le texte, que l'on convertit ici en surlignage.
function Surligne({ texte }: { texte: string }) {
  const segments = texte.split(/([^]*)/);
  return (
    <>
      {segments.map((segment, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="bg-etat-100 font-medium text-etat-900">
            {segment}
          </mark>
        ) : (
          <span key={index}>{segment}</span>
        ),
      )}
    </>
  );
}

// Les mots très longs (adresses web, références) sont coupés plutôt que de déborder sur téléphone.
export function BlocCitation({ citation, index }: { citation: Citation; index: number }) {
  return (
    <li className="break-words rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm leading-relaxed text-slate-800">
        <span className="mr-1 font-semibold text-etat-700">[{index}]</span>
        {citation.origine === 'sens' && (
          <span
            className="mr-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-800"
            title="Aucun mot de la question n'y figure : passage proposé pour la proximité de son sens, à lire avant de s'y appuyer."
          >
            trouvé par le sens
          </span>
        )}
        <span className="italic">
          <Surligne texte={citation.extrait} />
        </span>
      </p>
      {citation.texteComplet && citation.texteComplet.length > citation.extrait.length && (
        <details className="group mt-1 print:hidden">
          {/* Zone de toucher confortable sur téléphone ; libellé inversé une fois déplié. */}
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 py-2 text-sm font-medium text-etat-700 hover:underline [&::-webkit-details-marker]:hidden">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7.5 5l5 5-5 5" />
            </svg>
            <span className="group-open:hidden">Lire le passage en entier</span>
            <span className="hidden group-open:inline">Replier le passage</span>
          </summary>
          <p className="mb-1 whitespace-pre-line rounded border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800">
            <Surligne texte={citation.texteComplet} />
          </p>
        </details>
      )}
      <div className="mt-2 space-y-0.5 text-xs leading-relaxed text-slate-600">
        <p>
          <span className="font-medium text-slate-700">{citation.documentTitre}</span>
          {citation.page !== null && <> — page {citation.page}</>}
        </p>
        {citation.titreSection && <p>Section « {citation.titreSection} »</p>}
        <p>
          Source : {citation.source}
          {citation.datePublication && <> · {mentionDate(citation.datePublication, 'Document daté de')}</>}
          {citation.url && (
            <>
              {' · '}
              <a className="text-etat-600 underline" href={citation.url} target="_blank" rel="noreferrer">
                consulter la source
              </a>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

export function LienBouton({
  href,
  children,
  variante = 'primaire',
}: {
  href: string;
  children: React.ReactNode;
  variante?: 'primaire' | 'secondaire';
}) {
  const classes =
    variante === 'primaire'
      ? 'bg-etat-600 text-white hover:bg-etat-700'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-etat-600 ${classes}`}
    >
      {children}
    </Link>
  );
}

export function Bouton({
  children,
  variante = 'primaire',
  type = 'submit',
}: {
  children: React.ReactNode;
  variante?: 'primaire' | 'secondaire';
  type?: 'submit' | 'button';
}) {
  const classes =
    variante === 'primaire'
      ? 'bg-etat-600 text-white hover:bg-etat-700'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50';
  return (
    <button
      type={type}
      className={`inline-flex items-center rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-etat-600 ${classes}`}
    >
      {children}
    </button>
  );
}

export function EtatVide({ titre, children }: { titre: string; children?: React.ReactNode }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center">
      <p className="font-medium text-slate-700">{titre}</p>
      {children && <div className="mt-2 text-sm text-slate-600">{children}</div>}
    </div>
  );
}

const LIBELLES_SENS: Record<EtatRechercheParSens['statut'], string> = {
  active: 'Recherche par les mots et par le sens (modèle installé sur le serveur : aucune donnée transmise).',
  indexation: 'Recherche par le sens en préparation',
  desactivee: 'Recherche par les mots seulement : recherche par le sens désactivée sur ce serveur.',
  non_installe: "Recherche par les mots seulement : le modèle de recherche par le sens n'est pas installé.",
  erreur: 'Recherche par le sens indisponible (modèle illisible) : recherche par les mots seulement.',
};

export function MentionRechercheParSens({
  etat,
  administrateur = false,
}: {
  etat: EtatRechercheParSens;
  administrateur?: boolean;
}) {
  return (
    <p className="text-xs text-slate-500">
      {LIBELLES_SENS[etat.statut]}
      {etat.statut === 'indexation' &&
        ` : ${etat.indexes} passages sur ${etat.total} indexés. Les autres restent trouvés par les mots.`}
      {administrateur && etat.statut === 'non_installe' && (
        <>
          {' '}
          Installation : <code>npm run semantique:installer</code> (une fois, environ 135 Mo).
        </>
      )}
      {administrateur && etat.statut === 'erreur' && etat.erreur && <> Détail : {etat.erreur}</>}
    </p>
  );
}

export function PistesParLeSens({ pistes }: { pistes: Citation[] }) {
  if (pistes.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-800">Pistes de lecture, proches par le sens</h3>
      <p className="mt-1 text-xs text-slate-600">
        Aucun terme de la question n&apos;y figure : ces passages en sont seulement proches par le sens.
        Ils ne constituent pas une réponse et sont à lire avant tout usage auprès d&apos;un agent.
      </p>
      <ul className="mt-3 space-y-3">
        {pistes.map((citation, index) => (
          <BlocCitation key={citation.passageId} citation={citation} index={index + 1} />
        ))}
      </ul>
    </div>
  );
}
