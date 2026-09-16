"use client";

import { silhouetteSteps, SILHOUETTE_DISCLAIMER } from "@relook/types";

export function SilhouettePicker({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (deltaKg: number) => void;
}) {
  const steps = silhouetteSteps();

  return (
    <div>
      <p className="mb-3 text-sm text-neutral-600">
        Simulation par palier de 2 kg, calculee localement a partir de votre posture. Fonctionne mieux
        sur une photo de la tete aux pieds.
      </p>
      <div className="flex flex-wrap gap-2">
        {steps.map((kg) => (
          <button
            key={kg}
            type="button"
            onClick={() => onSelect(kg)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              selected === kg
                ? "bg-brand-600 text-white"
                : kg === 0
                  ? "bg-neutral-200 text-neutral-800"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {kg === 0 ? "0 kg (original)" : kg > 0 ? `+${kg} kg` : `${kg} kg`}
          </button>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{SILHOUETTE_DISCLAIMER}</p>
    </div>
  );
}
