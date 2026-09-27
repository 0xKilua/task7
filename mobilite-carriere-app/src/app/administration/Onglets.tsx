import Link from 'next/link';

const ONGLETS = [
  { href: '/administration', libelle: 'Comptes' },
  { href: '/administration/donnees', libelle: 'Données et conservation' },
  { href: '/administration/journal', libelle: 'Journal des actions' },
];

export function OngletsAdministration({ actif }: { actif: string }) {
  return (
    <nav aria-label="Administration" className="-mt-2 mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {ONGLETS.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.href === actif ? 'page' : undefined}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            o.href === actif ? 'bg-etat-600 text-white' : 'text-etat-700 hover:bg-etat-50'
          }`}
        >
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}
