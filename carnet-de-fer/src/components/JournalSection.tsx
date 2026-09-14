"use client";

import { FormEvent } from "react";
import { useJournal } from "@/lib/journal";
import { slug, todayStr } from "@/lib/utils";
import HistoryTable from "./HistoryTable";
import Chart from "./Chart";

type Props = {
  dayId: string;
  itemId: string;
  kind: "muscu" | "cardio";
};

export default function JournalSection({ dayId, itemId, kind }: Props) {
  const { entriesFor, addEntry, removeEntry } = useJournal();
  const entries = entriesFor(dayId, itemId);
  const base = slug(`${dayId}-${itemId}`);
  const valueLabel = kind === "muscu" ? "Poids (kg)" : "Durée (min)";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    addEntry({
      dayId,
      itemId,
      date: String(data.get("date")),
      value: parseFloat(String(data.get("value"))),
      reps: String(data.get("reps") || ""),
      note: String(data.get("note") || ""),
      ts: Date.now(),
    });
    form.reset();
  }

  return (
    <div className="log-section">
      <h4>Ton journal</h4>
      <form className="log-form" onSubmit={handleSubmit}>
        <div className="log-row">
          <label htmlFor={`${base}-date`}>
            Date
            <input id={`${base}-date`} type="date" name="date" defaultValue={todayStr()} required />
          </label>
          <label htmlFor={`${base}-value`}>
            {valueLabel}
            <input id={`${base}-value`} type="number" step="0.5" min="0" name="value" required />
          </label>
          {kind === "muscu" && (
            <label htmlFor={`${base}-reps`}>
              Reps
              <input id={`${base}-reps`} type="text" name="reps" placeholder="12,11,10,9" />
            </label>
          )}
        </div>
        <label className="log-note" htmlFor={`${base}-note`}>
          Note (optionnel)
          <input id={`${base}-note`} type="text" name="note" placeholder="ressenti, douleur, énergie..." />
        </label>
        <button type="submit" className="log-submit">
          Ajouter au journal
        </button>
      </form>
      {entries.length ? (
        <HistoryTable entries={entries} kind={kind} onDelete={removeEntry} />
      ) : (
        <p className="log-empty">Pas encore d&apos;entrée — enregistre ta première séance ci-dessus.</p>
      )}
      {entries.length >= 2 && <Chart entries={entries} kind={kind} />}
    </div>
  );
}
