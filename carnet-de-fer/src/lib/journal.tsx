"use client";

import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  addEntry,
  updateEntry,
  removeEntry,
  exportEntries,
  importEntries,
} from "./journalStore";

export type { LogEntry } from "./journalStore";

export function useJournal() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function entriesFor(dayId: string, itemId: string) {
    return entries.filter((e) => e.dayId === dayId && e.itemId === itemId);
  }

  return { entries, addEntry, updateEntry, removeEntry, entriesFor, exportEntries, importEntries };
}
