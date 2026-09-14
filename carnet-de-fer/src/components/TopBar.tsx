"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DAYS } from "@/data/program";

const TABS: { href: string; label: string }[] = [
  { href: "/", label: "Avant de commencer" },
  { href: "/journal", label: "Journal" },
  ...DAYS.map((d) => ({ href: `/jour/${d.id}`, label: d.label })),
  { href: "/progression", label: "Progression" },
  { href: "/lexique", label: "Lexique" },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <div className="topbar">
      <div className="topbar-head">
        <h1>🏋️ Carnet de Fer</h1>
      </div>
      <p className="tagline">
        Programme débutant — haltères 5/10 kg &amp; barre EZ 20 kg — avec journal de séances
      </p>
      <nav className="tabs">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={`tab-btn ${pathname === tab.href ? "active" : ""}`}>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
