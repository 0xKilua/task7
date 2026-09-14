"use client";

import { useState } from "react";
import type { Exercise } from "@/data/program";
import { useJournal } from "@/lib/journal";
import { todayStr } from "@/lib/utils";
import VideoDemo from "./VideoDemo";
import JournalSection from "./JournalSection";

export default function ExerciseCard({ dayId, exercise }: { dayId: string; exercise: Exercise }) {
  const [open, setOpen] = useState(false);
  const { entriesFor } = useJournal();
  const doneToday = entriesFor(dayId, exercise.name).some((e) => e.date === todayStr());

  return (
    <div className={`exercise ${doneToday ? "done" : ""}`}>
      <div className="ex-head" onClick={() => setOpen((v) => !v)}>
        <div className="ex-title-wrap">
          <p className="ex-name">
            {exercise.name}
            {doneToday && <span className="chip chip-done">✓ fait</span>}
          </p>
          <p className="ex-spec">{exercise.sets} · {exercise.weight}</p>
          <span className="chip chip-muscle">{exercise.muscle}</span>
        </div>
        <span className={`chevron ${open ? "open" : ""}`}>▶</span>
      </div>
      {open && (
        <div className="ex-body open">
          <h4>Comment faire</h4>
          <ol>
            {exercise.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <VideoDemo video={exercise.video} />
          {exercise.tip && (
            <div className="tip-box">
              💡 <strong>Astuce :</strong> {exercise.tip}
            </div>
          )}
          {exercise.mistake && (
            <div className="mistake-box">
              ⚠️ <strong>Erreur à éviter :</strong> {exercise.mistake}
            </div>
          )}
          <JournalSection dayId={dayId} itemId={exercise.name} kind="muscu" />
        </div>
      )}
    </div>
  );
}
