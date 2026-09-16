"use client";

import { useEffect, useState } from "react";
import type { HairColorCatalogItem } from "@relook/types";
import { apiFetch } from "@/lib/api-client";

export function ColorPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [items, setItems] = useState<HairColorCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<HairColorCatalogItem[]>("/catalog/colors")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Chargement des couleurs...</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-neutral-600">
        Recoloration reelle (texture et volume conserves), calculee localement.
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-colors ${
              selectedId === item.id
                ? "border-brand-600 ring-1 ring-brand-500"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <span
              className="h-9 w-9 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: item.swatchHex }}
              aria-hidden
            />
            <span className="text-xs leading-tight">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
