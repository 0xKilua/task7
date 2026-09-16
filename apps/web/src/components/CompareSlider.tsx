"use client";

import { useRef, useState } from "react";

export function CompareSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Avant",
  afterLabel = "Apres",
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl bg-neutral-200 sm:aspect-[4/5]"
        onMouseDown={(e) => {
          dragging.current = true;
          updateFromClientX(e.clientX);
        }}
        onMouseMove={(e) => dragging.current && updateFromClientX(e.clientX)}
        onMouseUp={() => (dragging.current = false)}
        onMouseLeave={() => (dragging.current = false)}
        onTouchStart={(e) => updateFromClientX(e.touches[0]!.clientX)}
        onTouchMove={(e) => updateFromClientX(e.touches[0]!.clientX)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md ring-1 ring-neutral-300" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
          {beforeLabel}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
          {afterLabel}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="mt-3 w-full"
        aria-label="Reveler progressivement la transformation"
      />
    </div>
  );
}
