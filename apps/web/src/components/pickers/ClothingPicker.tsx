"use client";

import { useEffect, useState } from "react";
import type { ClothingCatalogItem, OutfitSelection } from "@relook/types";
import { apiFetch } from "@/lib/api-client";

const CATEGORY_LABELS: Record<string, string> = {
  haut: "Haut",
  bas: "Bas",
  robe: "Robe",
};

export function ClothingPicker({
  selection,
  onChange,
}: {
  selection: OutfitSelection;
  onChange: (selection: OutfitSelection) => void;
}) {
  const [items, setItems] = useState<ClothingCatalogItem[]>([]);
  const [category, setCategory] = useState<"haut" | "bas" | "robe">("haut");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ClothingCatalogItem[]>("/catalog/clothing")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const visible = items.filter((i) => i.category === category);
  const robeSelected = Boolean(selection.robe);

  function toggle(item: ClothingCatalogItem) {
    if (item.category === "robe") {
      onChange({ robe: selection.robe === item.id ? undefined : item.id });
      return;
    }
    const key = item.category as "haut" | "bas";
    onChange({
      ...selection,
      robe: undefined,
      [key]: selection[key] === item.id ? undefined : item.id,
    });
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {(["haut", "bas", "robe"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              category === cat ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {robeSelected && category !== "robe" && (
        <p className="mb-3 text-xs text-amber-700">
          Une robe est selectionnee : elle remplace haut + bas. Choisissez une robe seule, ou revenez
          sur l&apos;onglet Robe pour la retirer.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Chargement du catalogue...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item) => {
            const selected =
              category === "robe" ? selection.robe === item.id : selection[category] === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item)}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  selected
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-500"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <span className="block font-medium">{item.name}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {item.color} · {item.style}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
