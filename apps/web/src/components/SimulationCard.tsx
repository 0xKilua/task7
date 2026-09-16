"use client";

import { useEffect, useState } from "react";
import type { Simulation } from "@relook/types";
import { SIMULATION_STATUS_LABELS } from "@relook/types";
import { apiFetch, fetchAuthedBlobUrl } from "@/lib/api-client";

type SimulationWithLabel = Simulation & { statusLabel: string };

const MODULE_LABELS: Record<string, string> = {
  coiffure: "Coiffure",
  couleur: "Couleur",
  vetements: "Vetements",
  silhouette: "Silhouette",
};

export function SimulationCard({
  simulation,
  onDeleted,
}: {
  simulation: SimulationWithLabel;
  onDeleted: (id: string) => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (simulation.status !== "completed") return;
    let cancelled = false;
    fetchAuthedBlobUrl(`/simulations/${simulation.id}/result`).then((url) => {
      if (!cancelled) setThumbUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [simulation.id, simulation.status]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/simulations/${simulation.id}`, { method: "DELETE" });
      onDeleted(simulation.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-neutral-100">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="Resultat de simulation" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-400">
            {SIMULATION_STATUS_LABELS[simulation.status] ?? simulation.statusLabel}
          </div>
        )}
      </div>
      <p className="text-sm font-medium">{MODULE_LABELS[simulation.module] ?? simulation.module}</p>
      <p className="text-xs text-neutral-500">{simulation.statusLabel}</p>
      <button className="btn-secondary mt-3 w-full text-xs" onClick={handleDelete} disabled={deleting}>
        {deleting ? "Suppression..." : "Supprimer"}
      </button>
    </div>
  );
}
