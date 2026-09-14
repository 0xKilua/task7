import type { LogEntry } from "@/lib/journal";
import { formatDateFR } from "@/lib/utils";

type Props = {
  entries: LogEntry[];
  kind: "muscu" | "cardio";
  onDelete: (id: string) => void;
};

export default function HistoryTable({ entries, kind, onDelete }: Props) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <table className="log-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>{kind === "muscu" ? "Poids" : "Durée"}</th>
          {kind === "muscu" && <th>Reps</th>}
          <th>Note</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {sorted.map((e) => (
          <tr key={e.id}>
            <td className="num">{formatDateFR(e.date)}</td>
            <td className="num">{e.value}{kind === "muscu" ? " kg" : " min"}</td>
            {kind === "muscu" && <td className="num">{e.reps || "—"}</td>}
            <td>{e.note || "—"}</td>
            <td>
              <button type="button" className="del-btn" title="Supprimer" onClick={() => onDelete(e.id)}>
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
