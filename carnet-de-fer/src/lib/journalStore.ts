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

// L'id et l'horodatage sont générés par le store : les appelants ne décrivent
// que la séance.
type NewEntry = Omit<LogEntry, "id" | "ts">;

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
  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2)}`;
  entries = [...entries, { ...entry, id, ts: now }];
  persist();
  emitChange();
}

export function updateEntry(id: string, patch: Partial<Omit<LogEntry, "id">>) {
  ensureInit();
  entries = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
  persist();
  emitChange();
}

export function removeEntry(id: string) {
  ensureInit();
  entries = entries.filter((e) => e.id !== id);
  persist();
  emitChange();
}

export function exportEntries(): string {
  ensureInit();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2);
}

export type ImportResult = { added: number; skipped: number };

/**
 * Fusionne un export dans le journal courant. Les entrées déjà présentes
 * (même id) sont ignorées, pour qu'un réimport accidentel ne duplique rien.
 */
export function importEntries(json: string): ImportResult {
  ensureInit();
  const parsed: unknown = JSON.parse(json);
  const incoming = (parsed as { entries?: unknown })?.entries;
  if (!Array.isArray(incoming)) {
    throw new Error("Fichier invalide : aucune liste d'entrées trouvée.");
  }

  const known = new Set(entries.map((e) => e.id));
  const valid: LogEntry[] = [];
  let skipped = 0;

  for (const raw of incoming) {
    const e = raw as Partial<LogEntry>;
    const isValid =
      typeof e?.id === "string" &&
      typeof e?.dayId === "string" &&
      typeof e?.itemId === "string" &&
      typeof e?.date === "string" &&
      typeof e?.value === "number" &&
      Number.isFinite(e.value);

    if (!isValid || known.has(e.id as string)) {
      skipped++;
      continue;
    }
    known.add(e.id as string);
    valid.push({
      id: e.id as string,
      dayId: e.dayId as string,
      itemId: e.itemId as string,
      date: e.date as string,
      value: e.value as number,
      reps: typeof e.reps === "string" ? e.reps : "",
      note: typeof e.note === "string" ? e.note : "",
      ts: typeof e.ts === "number" ? e.ts : Date.now(),
    });
  }

  entries = [...entries, ...valid];
  persist();
  emitChange();
  return { added: valid.length, skipped };
}
