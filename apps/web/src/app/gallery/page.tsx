"use client";

import { useEffect, useState } from "react";
import type { Simulation } from "@relook/types";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import { SimulationCard } from "@/components/SimulationCard";

type SimulationWithLabel = Simulation & { statusLabel: string };

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const [simulations, setSimulations] = useState<SimulationWithLabel[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<SimulationWithLabel[]>("/simulations")
      .then(setSimulations)
      .finally(() => setLoadingList(false));
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>Connectez-vous pour retrouver vos simulations sauvegardees.</p>
        <a href="/login" className="btn-primary mt-4 inline-flex">
          Connexion
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Ma galerie</h1>
      {loadingList ? (
        <p className="text-sm text-neutral-500">Chargement...</p>
      ) : simulations.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aucune simulation pour le moment. Importez une photo pour commencer.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {simulations.map((s) => (
            <SimulationCard
              key={s.id}
              simulation={s}
              onDeleted={(id) => setSimulations((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
