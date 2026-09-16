"use client";

import { useEffect, useState } from "react";
import type { HairstyleCatalogItem } from "@relook/types";
import { apiFetch } from "@/lib/api-client";

export function HairstylePicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [items, setItems] = useState<HairstyleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<HairstyleCatalogItem[]>("/catalog/hairstyles")
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Chargement du catalogue de coiffures...</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-neutral-600">
        Le changement de forme de coiffure necessite un moteur de generation (voir note en bas de
        page). Choisissez un style :
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`rounded-xl border p-3 text-left text-sm transition-colors ${
              selectedId === item.id
                ? "border-brand-600 bg-brand-50 ring-1 ring-brand-500"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <span className="block font-medium">{item.name}</span>
            <span className="mt-1 block text-xs text-neutral-500">
              {item.length.replace(/_/g, " ")} · {item.texture.replace(/_/g, " ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
