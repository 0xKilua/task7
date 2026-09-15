import Link from 'next/link';
import { MESSAGE_A_VERIFIER, type Citation } from '@/lib/types';

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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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

export function BlocCitation({ citation, index }: { citation: Citation; index: number }) {
  return (
    <li className="rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm text-slate-800">
        <span className="mr-1 font-semibold text-etat-700">[{index}]</span>
        <span className="italic">
          <Surligne texte={citation.extrait} />
        </span>
      </p>
      <p className="mt-2 text-xs text-slate-600">
        <span className="font-medium">{citation.documentTitre}</span>
        {citation.titreSection && <> — section « {citation.titreSection} »</>}
        {citation.page !== null && <> — page {citation.page}</>}
        {' · '}
        Source : {citation.source}
        {citation.datePublication && <> · Document daté de {citation.datePublication}</>}
        {citation.url && (
          <>
            {' · '}
            <a className="text-etat-600 underline" href={citation.url} target="_blank" rel="noreferrer">
              consulter la source
            </a>
          </>
        )}
      </p>
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
