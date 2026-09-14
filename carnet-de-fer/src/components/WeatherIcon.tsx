export type WeatherKind =
  | "clear"
  | "clear-night"
  | "partly"
  | "partly-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

/**
 * Icônes dessinées à la main en SVG : dégradés radiaux pour les volumes,
 * reflets et ombre portée pour le relief. Aucune librairie 3D ni image
 * externe, donc rien à télécharger et un rendu identique hors ligne.
 */
export default function WeatherIcon({ kind, size = 96 }: { kind: WeatherKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      className="weather-icon"
    >
      <defs>
        <radialGradient id="sunGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="45%" stopColor="#FFC24D" />
          <stop offset="100%" stopColor="#E8871E" />
        </radialGradient>
        <radialGradient id="moonGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#F4F7FF" />
          <stop offset="55%" stopColor="#CBD5E8" />
          <stop offset="100%" stopColor="#8E9BB5" />
        </radialGradient>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#FDFEFF" />
          <stop offset="55%" stopColor="#D7DEEA" />
          <stop offset="100%" stopColor="#9AA6BB" />
        </linearGradient>
        <linearGradient id="darkCloudGrad" x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#C3CBD9" />
          <stop offset="55%" stopColor="#8B96A9" />
          <stop offset="100%" stopColor="#5C6779" />
        </linearGradient>
        <linearGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9FD4FF" />
          <stop offset="100%" stopColor="#3D8FD4" />
        </linearGradient>
        <linearGradient id="boltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="100%" stopColor="#F0A621" />
        </linearGradient>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#soft)">
        {(kind === "clear" || kind === "partly") && <Sun cx={kind === "clear" ? 50 : 38} cy={kind === "clear" ? 50 : 38} r={kind === "clear" ? 24 : 18} />}
        {(kind === "clear-night" || kind === "partly-night") && (
          <Moon cx={kind === "clear-night" ? 50 : 38} cy={kind === "clear-night" ? 48 : 36} r={kind === "clear-night" ? 24 : 18} />
        )}

        {kind !== "clear" && kind !== "clear-night" && (
          <Cloud dark={kind === "thunder" || kind === "rain" || kind === "snow"} />
        )}

        {(kind === "rain" || kind === "drizzle") && <Drops heavy={kind === "rain"} />}
        {kind === "snow" && <Flakes />}
        {kind === "thunder" && <Bolt />}
        {kind === "fog" && <FogLines />}
      </g>
    </svg>
  );
}

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <g>
      {rays.map((angle) => (
        <rect
          key={angle}
          x={cx - 2.5}
          y={cy - r - 12}
          width={5}
          height={8}
          rx={2.5}
          fill="#FFC24D"
          opacity={0.9}
          transform={`rotate(${angle} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="url(#sunGrad)" />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.38} rx={r * 0.38} ry={r * 0.26} fill="#FFF6D8" opacity="0.55" />
    </g>
  );
}

function Moon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#moonGrad)" />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.3} r={r * 0.18} fill="#A9B4C7" opacity="0.6" />
      <circle cx={cx - r * 0.25} cy={cy + r * 0.3} r={r * 0.13} fill="#A9B4C7" opacity="0.5" />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.4} rx={r * 0.34} ry={r * 0.22} fill="#FFFFFF" opacity="0.5" />
    </g>
  );
}

function Cloud({ dark = false }: { dark?: boolean }) {
  const fill = dark ? "url(#darkCloudGrad)" : "url(#cloudGrad)";
  return (
    <g>
      <ellipse cx={40} cy={58} rx={18} ry={16} fill={fill} />
      <ellipse cx={60} cy={54} rx={20} ry={18} fill={fill} />
      <ellipse cx={52} cy={66} rx={26} ry={13} fill={fill} />
      <ellipse cx={44} cy={50} rx={9} ry={6} fill="#FFFFFF" opacity={dark ? 0.25 : 0.6} />
    </g>
  );
}

function Drops({ heavy }: { heavy: boolean }) {
  const xs = heavy ? [36, 50, 64] : [42, 58];
  return (
    <g>
      {xs.map((x, i) => (
        <path
          key={x}
          d={`M ${x} ${78 + (i % 2) * 4} q 4 6 0 9 q -4 -3 0 -9 z`}
          fill="url(#dropGrad)"
        />
      ))}
    </g>
  );
}

function Flakes() {
  return (
    <g fill="#E8F3FF">
      {[38, 52, 66].map((x, i) => (
        <g key={x} transform={`translate(${x} ${82 + (i % 2) * 4})`}>
          <rect x={-5} y={-1} width={10} height={2} rx={1} />
          <rect x={-5} y={-1} width={10} height={2} rx={1} transform="rotate(60)" />
          <rect x={-5} y={-1} width={10} height={2} rx={1} transform="rotate(120)" />
        </g>
      ))}
    </g>
  );
}

function Bolt() {
  return <path d="M 54 74 L 44 90 L 51 90 L 46 100 L 62 82 L 54 82 L 60 74 Z" fill="url(#boltGrad)" />;
}

function FogLines() {
  return (
    <g stroke="#C3CBD9" strokeWidth={4} strokeLinecap="round" opacity="0.85">
      <line x1={30} y1={80} x2={70} y2={80} />
      <line x1={36} y1={89} x2={64} y2={89} />
    </g>
  );
}
