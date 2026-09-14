export type LogEntry = {
  id: string;
  dayId: string;
  itemId: string;
  date: string;
  value: number;
  reps?: string;
  note?: string;
  ts: number;
};

type NewEntry = Omit<LogEntry, "id">;

const STORAGE_KEY = "carnet_de_fer_logs";
let entries: LogEntry[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function readFromStorage(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // stockage indisponible (navigation privée, etc.) : le journal reste en mémoire pour la session en cours
  }
}

function ensureInit() {
  if (!initialized && typeof window !== "undefined") {
    entries = readFromStorage();
    initialized = true;
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): LogEntry[] {
  ensureInit();
  return entries;
}

export function getServerSnapshot(): LogEntry[] {
  return entries;
}

export function addEntry(entry: NewEntry) {
  ensureInit();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  entries = [...entries, { ...entry, id }];
  persist();
  emitChange();
}

export function removeEntry(id: string) {
  ensureInit();
  entries = entries.filter((e) => e.id !== id);
  persist();
  emitChange();
}
