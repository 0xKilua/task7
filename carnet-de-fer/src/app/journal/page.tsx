"use client";

import { EXERCISE_INDEX } from "@/data/program";
import { useJournal, type LogEntry } from "@/lib/journal";
import { formatDateFR } from "@/lib/utils";
import JournalBackup from "@/components/JournalBackup";

export default function JournalPage() {
  const { entries } = useJournal();

  if (!entries.length) {
    return (
      <>
        <div className="day-head">
          <span className="eyebrow rest">Historique</span>
          <h2>Journal de bord</h2>
        </div>
        <div className="panel">
          <p>Ton journal est vide pour l&apos;instant. Enregistre tes séances depuis les onglets des jours pour les voir apparaître ici, classées par date.</p>
        </div>
        <JournalBackup />
      </>
    );
  }

  const withMeta = entries.map((e) => ({
    ...e,
    meta: EXERCISE_INDEX[e.dayId]?.[e.itemId] ?? { name: e.itemId, kind: "muscu" as const, dayLabel: e.dayId },
  }));
  withMeta.sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);

  const byDate = new Map<string, typeof withMeta>();
  withMeta.forEach((e) => {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  });
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="day-head">
        <span className="eyebrow rest">Historique</span>
        <h2>Journal de bord</h2>
        <p className="sub">Toutes tes séances enregistrées, de la plus récente à la plus ancienne.</p>
      </div>
      {dates.map((date) => (
        <div className="journal-date" key={date}>
          <h3>{formatDateFR(date)}</h3>
          {byDate.get(date)!.map((e) => (
            <JournalEntryRow key={e.id} entry={e} />
          ))}
        </div>
      ))}
      <JournalBackup />
    </>
  );
}

function JournalEntryRow({ entry }: { entry: LogEntry & { meta: { name: string; kind: "muscu" | "cardio"; dayLabel: string } } }) {
  return (
    <div className="journal-entry">
      <div className="journal-entry-head">
        <span className="day-tag">{entry.meta.dayLabel}</span>
        <strong>{entry.meta.name}</strong>
        <span className="journal-value">
          {entry.value}{entry.meta.kind === "muscu" ? "kg" : "min"}
          {entry.reps ? ` · ${entry.reps} reps` : ""}
        </span>
      </div>
      {entry.note && <p className="journal-note">{entry.note}</p>}
    </div>
  );
}
