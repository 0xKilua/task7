'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export interface EntreeMenu {
  href: string;
  libelle: string;
}

// Rubrique de la page affichée : l'accueil pour « / » seulement, les autres rubriques aussi
// pour leurs sous-pages (une fiche d'accompagnement relève d'« Accompagnements »).
function estActive(href: string, chemin: string): boolean {
  return href === '/' ? chemin === '/' : chemin === href || chemin.startsWith(`${href}/`);
}

// Écran large : barre de navigation horizontale sous l'en-tête.
export function BarreNavigation({ entrees }: { entrees: EntreeMenu[] }) {
  const chemin = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden bg-etat-700 md:block">
      <ul className="mx-auto flex max-w-7xl flex-wrap gap-1 px-2 py-1">
        {entrees.map((entree) => {
          const active = estActive(entree.href, chemin);
          return (
            <li key={entree.href}>
              <Link
                href={entree.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded px-3 py-2 text-sm hover:bg-etat-600 focus:bg-etat-600 focus:outline-none focus:ring-2 focus:ring-white ${
                  active ? 'bg-etat-600 font-medium text-white' : 'text-etat-50'
                }`}
              >
                {entree.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Téléphone : les rubriques sont repliées derrière un bouton « Menu », pour que la page commence
// en haut de l'écran. Le panneau se referme au choix d'une page, à la touche Échap ou au toucher
// en dehors ; sans JavaScript, il s'ouvre et se ferme quand même (élément details natif).
export function MenuMobile({ entrees, children }: { entrees: EntreeMenu[]; children?: React.ReactNode }) {
  const chemin = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  const fermer = () => {
    if (menu.current) menu.current.open = false;
  };

  useEffect(() => {
    const toucherAilleurs = (evenement: MouseEvent) => {
      if (menu.current?.open && !menu.current.contains(evenement.target as Node)) fermer();
    };
    const echap = (evenement: KeyboardEvent) => {
      if (evenement.key !== 'Escape' || !menu.current?.open) return;
      fermer();
      menu.current.querySelector('summary')?.focus();
    };
    document.addEventListener('click', toucherAilleurs);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('click', toucherAilleurs);
      document.removeEventListener('keydown', echap);
    };
  }, []);

  // Changement de page, y compris par le bouton retour du téléphone : menu refermé.
  useEffect(fermer, [chemin]);

  return (
    <details ref={menu} className="group shrink-0 md:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded border border-etat-600 px-3 py-2 text-sm font-medium text-white hover:bg-etat-700 focus:outline-none focus:ring-2 focus:ring-white group-open:bg-etat-700 [&::-webkit-details-marker]:hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path className="group-open:hidden" d="M3 5h14M3 10h14M3 15h14" />
          <path className="hidden group-open:inline" d="M5 5l10 10M15 5L5 15" />
        </svg>
        Menu
      </summary>
      <nav
        aria-label="Navigation principale"
        className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-etat-600 bg-etat-800 shadow-lg"
      >
        <ul className="px-2 py-2">
          {entrees.map((entree) => {
            const active = estActive(entree.href, chemin);
            return (
              <li key={entree.href}>
                <Link
                  href={entree.href}
                  onClick={fermer}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded border-l-4 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white ${
                    active
                      ? 'border-white bg-etat-700 font-semibold text-white'
                      : 'border-transparent text-etat-50 hover:bg-etat-700'
                  }`}
                >
                  {entree.libelle}
                </Link>
              </li>
            );
          })}
        </ul>
        {children}
      </nav>
    </details>
  );
}
