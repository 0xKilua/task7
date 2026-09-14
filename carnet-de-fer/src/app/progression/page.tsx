"use client";

import { useState } from "react";
import { EXERCISE_INDEX, progressionOptions } from "@/data/program";
import { useJournal } from "@/lib/journal";
import Chart from "@/components/Chart";
import HistoryTable from "@/components/HistoryTable";

export default function ProgressionPage() {
  const options = progressionOptions();
  const [key, setKey] = useState(`${options[0].dayId}::${options[0].itemId}`);
  const { entriesFor, removeEntry } = useJournal();

  const [curDay, curItem] = key.split("::");
  const kind = EXERCISE_INDEX[curDay][curItem].kind;
  const entries = entriesFor(curDay, curItem);

  return (
    <>
      <div className="day-head">
        <span className="eyebrow rest">Analyse</span>
        <h2>Progression</h2>
        <p className="sub">Choisis un exercice pour voir son évolution dans le temps.</p>
      </div>
      <select className="progression-select" value={key} onChange={(e) => setKey(e.target.value)}>
        {options.map((o) => (
          <option key={`${o.dayId}::${o.itemId}`} value={`${o.dayId}::${o.itemId}`}>
            {o.label}
          </option>
        ))}
      </select>
      {entries.length >= 2 ? (
        <div className="panel">
          <Chart entries={entries} kind={kind} width={600} height={200} />
        </div>
      ) : (
        <div className="panel">
          <p>
            Pas encore assez de données (il faut au moins 2 séances enregistrées).{" "}
            {entries.length === 1 ? "Tu en as 1 pour l'instant." : "Enregistre tes séances depuis l'onglet du jour correspondant."}
          </p>
        </div>
      )}
      {entries.length > 0 && (
        <div className="panel">
          <HistoryTable entries={entries} kind={kind} onDelete={removeEntry} />
        </div>
      )}
    </>
  );
}
