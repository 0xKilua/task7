"use client";

import { useState } from "react";
import type { Simulation } from "@relook/types";
import { SIMULATION_STATUS_LABELS } from "@relook/types";
import { apiFetch, ApiError } from "@/lib/api-client";
import { CompareSlider } from "./CompareSlider";

type SimulationWithLabel = Simulation & { statusLabel: string };

export function SimulationPanel({
  beforeUrl,
  simulation,
  resultUrl,
  running,
  canGenerate,
  onGenerate,
}: {
  beforeUrl: string | null;
  simulation: SimulationWithLabel | null;
  resultUrl: string | null;
  running: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
}) {
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [favoriteSaved, setFavoriteSaved] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  async function saveFavorite() {
    if (!simulation) return;
    setSavingFavorite(true);
    setFavoriteError(null);
    try {
      await apiFetch("/favorites", { method: "POST", body: { simulationId: simulation.id } });
      setFavoriteSaved(true);
    } catch (err) {
      setFavoriteError(err instanceof ApiError ? err.message : "Echec de la sauvegarde.");
    } finally {
      setSavingFavorite(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <button className="btn-primary" onClick={onGenerate} disabled={!canGenerate || running}>
        {running ? "Generation en cours..." : "Generer la simulation"}
      </button>

      {simulation && running && (
        <div className="card">
          <p className="text-sm font-medium text-neutral-700">{simulation.statusLabel}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
          </div>
        </div>
      )}

      {simulation?.status === "provider_not_configured" && (
        <div className="card border border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">
            {SIMULATION_STATUS_LABELS.provider_not_configured}
          </p>
          {simulation.errorMessage && <p className="mt-1 text-xs text-amber-700">{simulation.errorMessage}</p>}
        </div>
      )}

      {simulation?.status === "failed" && (
        <div className="card border border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-800">Echec de la generation.</p>
          {simulation.errorMessage && <p className="mt-1 text-xs text-red-700">{simulation.errorMessage}</p>}
        </div>
      )}

      {simulation?.status === "completed" && beforeUrl && resultUrl && (
        <div>
          <CompareSlider beforeSrc={beforeUrl} afterSrc={resultUrl} />
          <div className="mt-3 flex items-center gap-3">
            <button className="btn-secondary" onClick={saveFavorite} disabled={savingFavorite || favoriteSaved}>
              {favoriteSaved ? "Ajoute aux favoris" : savingFavorite ? "Sauvegarde..." : "Sauvegarder en favoris"}
            </button>
            <a className="btn-secondary" href={resultUrl} download="relook-simulation.png">
              Telecharger
            </a>
          </div>
          {favoriteError && <p className="mt-2 text-sm text-red-600">{favoriteError}</p>}
        </div>
      )}
    </div>
  );
}
