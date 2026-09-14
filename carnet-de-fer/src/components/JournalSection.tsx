"use client";

import { FormEvent, useState } from "react";
import { useJournal } from "@/lib/journal";
import { formatDateFR, slug, todayStr } from "@/lib/utils";
import HistoryTable from "./HistoryTable";
import Chart from "./Chart";

type Props = {
  dayId: string;
  itemId: string;
  kind: "muscu" | "cardio";
};

export default function JournalSection({ dayId, itemId, kind }: Props) {
  const { entriesFor, addEntry, updateEntry, removeEntry } = useJournal();
  const entries = entriesFor(dayId, itemId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = editingId ? entries.find((e) => e.id === editingId) ?? null : null;
  const base = slug(`${dayId}-${itemId}`);
  const valueLabel = kind === "muscu" ? "Poids (kg)" : "Durée (min)";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const fields = {
      date: String(data.get("date")),
      value: parseFloat(String(data.get("value"))),
      reps: String(data.get("reps") || ""),
      note: String(data.get("note") || ""),
    };

    if (editing) {
      updateEntry(editing.id, fields);
      setEditingId(null);
    } else {
      addEntry({ dayId, itemId, ...fields });
      form.reset();
    }
  }

  function handleDelete(id: string) {
    if (editingId === id) setEditingId(null);
    removeEntry(id);
  }

  return (
    <div className="log-section">
      <h4>{editing ? `Modifier l'entrée du ${formatDateFR(editing.date)}` : "Ton journal"}</h4>
      <form key={editing?.id ?? "new"} className="log-form" onSubmit={handleSubmit}>
        <div className="log-row">
          <label htmlFor={`${base}-date`}>
            Date
            <input
              id={`${base}-date`}
              type="date"
              name="date"
              defaultValue={editing?.date ?? todayStr()}
              required
            />
          </label>
          <label htmlFor={`${base}-value`}>
            {valueLabel}
            <input
              id={`${base}-value`}
              type="number"
              step="0.5"
              min="0"
              name="value"
              defaultValue={editing?.value ?? ""}
              required
            />
          </label>
          {kind === "muscu" && (
            <label htmlFor={`${base}-reps`}>
              Reps
              <input
                id={`${base}-reps`}
                type="text"
                name="reps"
                placeholder="12,11,10,9"
                defaultValue={editing?.reps ?? ""}
              />
            </label>
          )}
        </div>
        <label className="log-note" htmlFor={`${base}-note`}>
          Note (optionnel)
          <input
            id={`${base}-note`}
            type="text"
            name="note"
            placeholder="ressenti, douleur, énergie..."
            defaultValue={editing?.note ?? ""}
          />
        </label>
        <div className="log-actions">
          <button type="submit" className="log-submit">
            {editing ? "Enregistrer les modifications" : "Ajouter au journal"}
          </button>
          {editing && (
            <button type="button" className="log-cancel" onClick={() => setEditingId(null)}>
              Annuler
            </button>
          )}
        </div>
      </form>
      {entries.length ? (
        <HistoryTable
          entries={entries}
          kind={kind}
          onDelete={handleDelete}
          onEdit={setEditingId}
          editingId={editingId}
        />
      ) : (
        <p className="log-empty">Pas encore d&apos;entrée — enregistre ta première séance ci-dessus.</p>
      )}
      {entries.length >= 2 && <Chart entries={entries} kind={kind} />}
    </div>
  );
}
