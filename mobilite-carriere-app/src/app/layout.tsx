import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { deconnexionAction } from '@/app/auth-actions';
import { BarreNavigation, MenuMobile, type EntreeMenu } from '@/components/MenuPrincipal';
import { sessionCourante } from '@/lib/auth';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Appui conseiller mobilité-carrière',
  description:
    "Outil d'aide à l'accompagnement des parcours professionnels dans la fonction publique de l'État",
};

// Couleur de l'en-tête reprise par la barre du navigateur sur téléphone.
export const viewport: Viewport = {
  themeColor: '#102c4e',
};

const NAVIGATION: EntreeMenu[] = [
  { href: '/', libelle: 'Tableau de bord' },
  { href: '/assistant', libelle: 'Assistant' },
  { href: '/recherche', libelle: 'Recherche documentaire' },
  { href: '/dispositifs', libelle: 'Dispositifs' },
  { href: '/dossiers', libelle: 'Accompagnements' },
  { href: '/entretien', libelle: "Préparation d'entretien" },
  { href: '/base-documentaire', libelle: 'Base documentaire' },
  { href: '/projet', libelle: 'Projet' },
];

const AVERTISSEMENT =
  "Outil d'aide à l'accompagnement. Il ne se substitue pas au conseiller et ne produit aucune décision administrative.";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const utilisateur = await sessionCourante();
  const entrees =
    utilisateur?.role === 'administrateur'
      ? [...NAVIGATION, { href: '/administration', libelle: 'Administration' }]
      : NAVIGATION;

  return (
    <html lang="fr">
      <body>
        <a
          href="#contenu"
          className="sr-only print:hidden focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Aller au contenu principal
        </a>

        <header className="relative bg-etat-800 text-white print:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:flex-wrap">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-etat-200">
                Fonction publique de l&apos;État
              </p>
              <p className="text-base font-semibold leading-snug md:text-lg">
                Appui conseiller <span className="whitespace-nowrap">mobilité-carrière</span>
              </p>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <p className="max-w-xs text-xs text-etat-100">{AVERTISSEMENT}</p>
              {utilisateur && (
                <div className="text-right text-xs">
                  <Link href="/mon-compte" className="block font-medium text-white underline">
                    {utilisateur.nom}
                  </Link>
                  <form action={deconnexionAction}>
                    <button type="submit" className="mt-1 text-etat-100 underline hover:text-white">
                      Se déconnecter
                    </button>
                  </form>
                </div>
              )}
            </div>
            {utilisateur && (
              <MenuMobile entrees={entrees}>
                <div className="border-t border-etat-600 px-5 py-3 text-sm">
                  <Link href="/mon-compte" className="block py-2 text-white underline">
                    Mon compte — {utilisateur.nom}
                  </Link>
                  <form action={deconnexionAction}>
                    <button type="submit" className="py-2 text-etat-100 underline hover:text-white">
                      Se déconnecter
                    </button>
                  </form>
                </div>
              </MenuMobile>
            )}
          </div>
          {utilisateur && <BarreNavigation entrees={entrees} />}
        </header>

        <main id="contenu" className="mx-auto max-w-7xl px-4 py-5 sm:py-6 print:max-w-none print:p-0">
          {children}
        </main>

        <footer className="mx-auto max-w-7xl space-y-2 px-4 pb-10 pt-4 text-xs text-slate-500 print:hidden">
          {/* Sur téléphone, l'en-tête n'a pas la place de ce rappel : il figure ici. */}
          <p className="md:hidden">{AVERTISSEMENT}</p>
          <p>
            Les réponses s&apos;appuient exclusivement sur les documents ingérés dans la base
            documentaire. En l&apos;absence de source, l&apos;application le signale explicitement.
          </p>
        </footer>
      </body>
    </html>
  );
}
