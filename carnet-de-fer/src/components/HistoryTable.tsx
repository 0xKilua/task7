"use client";

import type { LogEntry } from "@/lib/journal";
import { formatDateFR } from "@/lib/utils";

type Props = {
  entries: LogEntry[];
  kind: "muscu" | "cardio";
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  editingId?: string | null;
};

export default function HistoryTable({ entries, kind, onDelete, onEdit, editingId }: Props) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const unit = kind === "muscu" ? "kg" : "min";

  // La confirmation vit ici pour qu'aucun écran affichant ce tableau ne puisse
  // supprimer une séance sans demander : il n'y a pas d'annulation possible.
  function confirmDelete(entry: LogEntry) {
    const ok = window.confirm(
      `Supprimer définitivement l'entrée du ${formatDateFR(entry.date)} (${entry.value} ${unit}) ?`
    );
    if (ok) onDelete(entry.id);
  }
  return (
    <table className="log-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>{kind === "muscu" ? "Poids" : "Durée"}</th>
          {kind === "muscu" && <th>Reps</th>}
          <th>Note</th>
          <th>
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((e) => (
          <tr key={e.id} className={editingId === e.id ? "editing" : undefined}>
            <td className="num">{formatDateFR(e.date)}</td>
            <td className="num">
              {e.value}
              {kind === "muscu" ? " kg" : " min"}
            </td>
            {kind === "muscu" && <td className="num">{e.reps || "—"}</td>}
            <td>{e.note || "—"}</td>
            <td className="row-actions">
              {onEdit && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onEdit(e.id)}
                  aria-label={`Modifier l'entrée du ${formatDateFR(e.date)}`}
                >
                  ✎
                </button>
              )}
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => confirmDelete(e)}
                aria-label={`Supprimer l'entrée du ${formatDateFR(e.date)}`}
              >
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
