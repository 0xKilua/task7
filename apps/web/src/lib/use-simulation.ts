"use client";

import { useCallback, useRef, useState } from "react";
import type { Simulation, SimulationRequest } from "@relook/types";
import { apiFetch, fetchAuthedBlobUrl } from "./api-client";

type SimulationWithLabel = Simulation & { statusLabel: string };

const TERMINAL_STATUSES = new Set(["completed", "failed", "provider_not_configured"]);

export function useSimulation() {
  const [simulation, setSimulation] = useState<SimulationWithLabel | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  const poll = useCallback(
    async (id: string) => {
      try {
        const current = await apiFetch<SimulationWithLabel>(`/simulations/${id}`);
        setSimulation(current);
        if (TERMINAL_STATUSES.has(current.status)) {
          setRunning(false);
          if (current.status === "completed") {
            const url = await fetchAuthedBlobUrl(`/simulations/${id}/result`);
            setResultUrl(url);
          }
          return;
        }
        pollTimer.current = setTimeout(() => void poll(id), 1200);
      } catch {
        setRunning(false);
      }
    },
    [],
  );

  const start = useCallback(
    async (request: SimulationRequest) => {
      stopPolling();
      setResultUrl(null);
      setSimulation(null);
      setRunning(true);
      const created = await apiFetch<SimulationWithLabel>("/simulations", {
        method: "POST",
        body: request,
      });
      setSimulation(created);
      pollTimer.current = setTimeout(() => void poll(created.id), 800);
    },
    [poll, stopPolling],
  );

  const reset = useCallback(() => {
    stopPolling();
    setSimulation(null);
    setResultUrl(null);
    setRunning(false);
  }, [stopPolling]);

  return { simulation, resultUrl, running, start, reset };
}
