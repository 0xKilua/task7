"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { OutfitSelection, SimulationModule, SimulationRequest } from "@relook/types";
import { isOutfitSelectionValid } from "@relook/types";
import { apiFetch, fetchAuthedBlobUrl } from "@/lib/api-client";
import { useSimulation } from "@/lib/use-simulation";
import { HairstylePicker } from "@/components/pickers/HairstylePicker";
import { ColorPicker } from "@/components/pickers/ColorPicker";
import { ClothingPicker } from "@/components/pickers/ClothingPicker";
import { SilhouettePicker } from "@/components/pickers/SilhouettePicker";
import { SimulationPanel } from "@/components/SimulationPanel";

interface PhotoDetail {
  id: string;
  framing: string;
  faceDetected: boolean;
  bodyDetected: boolean;
  fullBodyVisible: boolean;
  warnings: string[];
}

const MODULES: { id: SimulationModule; label: string }[] = [
  { id: "coiffure", label: "Coiffure" },
  { id: "couleur", label: "Couleur" },
  { id: "vetements", label: "Vetements" },
  { id: "silhouette", label: "Silhouette" },
];

export default function StudioPage() {
  const params = useParams<{ photoId: string }>();
  const photoId = params.photoId;

  const [photo, setPhoto] = useState<PhotoDetail | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<SimulationModule>("couleur");

  const [hairstyleId, setHairstyleId] = useState<string | null>(null);
  const [colorId, setColorId] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<OutfitSelection>({});
  const [silhouetteDeltaKg, setSilhouetteDeltaKg] = useState(0);

  const { simulation, resultUrl, running, start, reset } = useSimulation();

  useEffect(() => {
    void (async () => {
      const detail = await apiFetch<PhotoDetail>(`/photos/${photoId}`);
      setPhoto(detail);
      const url = await fetchAuthedBlobUrl(`/photos/${photoId}/image`);
      setBeforeUrl(url);
    })();
  }, [photoId]);

  function switchModule(module: SimulationModule) {
    setActiveModule(module);
    reset();
  }

  function buildRequest(): SimulationRequest | null {
    switch (activeModule) {
      case "coiffure":
        return hairstyleId ? { photoId, module: "coiffure", hair: { hairstyleId } } : null;
      case "couleur":
        return colorId ? { photoId, module: "couleur", hair: { colorId } } : null;
      case "vetements":
        return isOutfitSelectionValid(outfit) ? { photoId, module: "vetements", outfit } : null;
      case "silhouette":
        return silhouetteDeltaKg !== 0
          ? { photoId, module: "silhouette", silhouetteDeltaKg }
          : null;
      default:
        return null;
    }
  }

  const request = buildRequest();

  return (
    <div>
      {photo?.warnings && photo.warnings.length > 0 && (
        <div className="mb-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          <ul className="list-inside list-disc space-y-1">
            {photo.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => switchModule(m.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
              activeModule === m.id ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeModule === "coiffure" && <HairstylePicker selectedId={hairstyleId} onSelect={setHairstyleId} />}
        {activeModule === "couleur" && <ColorPicker selectedId={colorId} onSelect={setColorId} />}
        {activeModule === "vetements" && <ClothingPicker selection={outfit} onChange={setOutfit} />}
        {activeModule === "silhouette" && (
          <SilhouettePicker selected={silhouetteDeltaKg} onSelect={setSilhouetteDeltaKg} />
        )}
      </div>

      <SimulationPanel
        beforeUrl={beforeUrl}
        simulation={simulation}
        resultUrl={resultUrl}
        running={running}
        canGenerate={Boolean(request)}
        onGenerate={() => request && void start(request)}
      />
    </div>
  );
}
