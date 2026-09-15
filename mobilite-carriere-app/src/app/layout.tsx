import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Appui conseiller mobilité-carrière',
  description:
    "Outil d'aide à l'accompagnement des parcours professionnels dans la fonction publique de l'État",
};

const NAVIGATION = [
  { href: '/', libelle: 'Tableau de bord' },
  { href: '/assistant', libelle: 'Assistant' },
  { href: '/recherche', libelle: 'Recherche documentaire' },
  { href: '/dispositifs', libelle: 'Dispositifs' },
  { href: '/dossiers', libelle: 'Accompagnements' },
  { href: '/entretien', libelle: "Préparation d'entretien" },
  { href: '/base-documentaire', libelle: 'Base documentaire' },
  { href: '/projet', libelle: 'Projet' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:shadow"
        >
          Aller au contenu principal
        </a>

        <header className="bg-etat-800 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-etat-200">
                Fonction publique de l&apos;État
              </p>
              <p className="text-lg font-semibold">Appui conseiller mobilité-carrière</p>
            </div>
            <p className="max-w-md text-xs text-etat-100">
              Outil d&apos;aide à l&apos;accompagnement. Il ne se substitue pas au conseiller et ne
              produit aucune décision administrative.
            </p>
          </div>
          <nav aria-label="Navigation principale" className="bg-etat-700">
            <ul className="mx-auto flex max-w-7xl flex-wrap gap-1 px-2 py-1">
              {NAVIGATION.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded px-3 py-2 text-sm text-etat-50 hover:bg-etat-600 focus:bg-etat-600 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    {item.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main id="contenu" className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-slate-500">
          <p>
            Les réponses s&apos;appuient exclusivement sur les documents ingérés dans la base
            documentaire. En l&apos;absence de source, l&apos;application le signale explicitement.
          </p>
        </footer>
      </body>
    </html>
  );
}
