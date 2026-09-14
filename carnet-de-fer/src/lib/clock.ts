"use client";

import { useSyncExternalStore } from "react";

// Horloge partagée : un seul intervalle pour tous les composants qui affichent
// l'heure, et une lecture stable entre deux rendus (exigence de
// useSyncExternalStore, qui boucle si getSnapshot renvoie une valeur neuve à
// chaque appel).
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return now;
}

// 0 côté serveur : l'heure du serveur n'est pas celle du visiteur, et une
// valeur figée évite toute différence d'hydratation. Le composant affiche un
// espace réservé tant qu'il reçoit 0.
function getServerSnapshot(): number {
  return 0;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
