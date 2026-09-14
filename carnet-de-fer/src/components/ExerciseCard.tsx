"use client";

import { useId, useState } from "react";
import type { Exercise } from "@/data/program";
import { useJournal } from "@/lib/journal";
import { todayStr } from "@/lib/utils";
import VideoDemo from "./VideoDemo";
import JournalSection from "./JournalSection";

export default function ExerciseCard({ dayId, exercise }: { dayId: string; exercise: Exercise }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const { entriesFor } = useJournal();
  const doneToday = entriesFor(dayId, exercise.name).some((e) => e.date === todayStr());

  return (
    <div className={`exercise ${doneToday ? "done" : ""}`}>
      <button
        type="button"
        className="ex-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ex-title-wrap">
          <span className="ex-name">
            {exercise.name}
            {doneToday && <span className="chip chip-done">✓ fait</span>}
          </span>
          <span className="ex-spec">{exercise.sets} · {exercise.weight}</span>
          <span className="chip chip-muscle">{exercise.muscle}</span>
        </span>
        <span className={`chevron ${open ? "open" : ""}`} aria-hidden="true">▶</span>
      </button>
      {open && (
        <div className="ex-body open" id={bodyId}>
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
