import type { Day } from "@/data/program";
import ExerciseCard from "./ExerciseCard";
import JournalSection from "./JournalSection";

export default function DayView({ day }: { day: Day }) {
  if (day.type === "muscu") {
    return (
      <>
        <div className="day-head">
          <span className="eyebrow strength">Musculation</span>
          <h2>{day.label} — {day.title}</h2>
          <p className="sub">Touche un exercice pour voir la démo et enregistrer ta séance.</p>
        </div>
        {day.exercises.map((ex) => (
          <ExerciseCard key={ex.name} dayId={day.id} exercise={ex} />
        ))}
        {day.finisher && <ExerciseCard dayId={day.id} exercise={day.finisher} />}
      </>
    );
  }

  if (day.type === "cardio") {
    return (
      <>
        <div className="day-head">
          <span className="eyebrow cardio">Cardio</span>
          <h2>{day.label} — {day.title}</h2>
          <p className="sub mono">{day.spec}</p>
        </div>
        <div className="panel">
          <p>{day.description}</p>
          <div className="tip-box">
            🎯 <strong>Pourquoi cette séance :</strong> {day.why}
          </div>
        </div>
        <div className="panel">
          <JournalSection dayId={day.id} itemId="session" kind="cardio" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="day-head">
        <span className="eyebrow rest">Repos</span>
        <h2>{day.label}</h2>
      </div>
      <div className="panel">
        <p>{day.description}</p>
        <div className="tip-box">
          🎯 <strong>Pourquoi ce jour compte :</strong> {day.why}
        </div>
      </div>
    </>
  );
}
