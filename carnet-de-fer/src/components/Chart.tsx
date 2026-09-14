import type { LogEntry } from "@/lib/journal";
import { formatDateFR } from "@/lib/utils";

type Props = {
  entries: LogEntry[];
  kind: "muscu" | "cardio";
  width?: number;
  height?: number;
};

export default function Chart({ entries, kind, width = 320, height = 90 }: Props) {
  const asc = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const values = asc.map((e) => e.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padL = 34;
  const padR = 10;
  const padT = 12;
  const padB = 10;
  const stepX = asc.length > 1 ? (width - padL - padR) / (asc.length - 1) : 0;
  const coords = asc.map((e, i) => ({
    x: padL + i * stepX,
    y: height - padB - ((e.value - min) / range) * (height - padT - padB),
  }));
  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPts = `${padL},${height - padB} ${points} ${coords[coords.length - 1].x},${height - padB}`;
  const unit = kind === "muscu" ? "kg" : "min";

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" preserveAspectRatio="none">
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} style={{ stroke: "var(--line)", strokeWidth: 1 }} />
        <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} style={{ stroke: "var(--line)", strokeWidth: 1 }} />
        <text x={4} y={padT + 4}>{max}{unit}</text>
        <text x={4} y={height - padB}>{min}{unit}</text>
        <polygon points={areaPts} style={{ fill: "var(--amber)", opacity: 0.12 }} />
        <polyline points={points} style={{ fill: "none", stroke: "var(--amber)", strokeWidth: 2.5 }} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3.5} style={{ fill: "var(--amber)" }} />
        ))}
      </svg>
      <p className="chart-caption">
        Évolution du {kind === "muscu" ? "poids" : "temps"} — {formatDateFR(asc[0].date)} → {formatDateFR(asc[asc.length - 1].date)}
      </p>
    </div>
  );
}
