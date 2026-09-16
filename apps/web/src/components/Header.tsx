"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          Relook
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/gallery" className="hidden rounded-full px-3 py-2 hover:bg-neutral-100 sm:inline-block">
            Galerie
          </Link>
          {!loading && user ? (
            <>
              <Link href="/account" className="hidden rounded-full px-3 py-2 hover:bg-neutral-100 sm:inline-block">
                Mon compte
              </Link>
              {user.role === "admin" && (
                <Link href="/admin/catalog" className="hidden rounded-full px-3 py-2 hover:bg-neutral-100 sm:inline-block">
                  Administration
                </Link>
              )}
              <button className="btn-secondary" onClick={() => logout()}>
                Deconnexion
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="btn-secondary">
                Connexion
              </Link>
              <Link href="/register" className="btn-primary">
                Creer un compte
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
