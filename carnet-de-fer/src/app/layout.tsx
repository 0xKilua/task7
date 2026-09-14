import type { Metadata } from "next";
import { Anton, Oswald, Barlow } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";

// Anton pour les gros titres (affiche de salle), Oswald pour les libellés et
// les chiffres (lisible en condensé, chiffres tabulaires), Barlow pour le
// texte courant : les consignes d'exercice doivent rester confortables à lire.
const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
});

const oswald = Oswald({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlow = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Carnet de Fer",
  description: "Programme de musculation débutant avec journal de séances et courbes de progression.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${oswald.variable} ${barlow.variable}`}>
      <body>
        <TopBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
