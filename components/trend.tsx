// Progress over time. Pure presentation — takes plain numbers, draws inline
// SVG, no chart library and no lib imports, so it renders anywhere.

export type TrendPoint = { score: number; when: string | null; label: string };

const TONE = (v: number) => (v >= 75 ? "var(--green)" : v >= 50 ? "var(--amber)" : "var(--red)");

/** Score-over-time line. Oldest on the left, newest on the right. */
export function TrendChart({ points, height = 120 }: { points: TrendPoint[]; height?: number }) {
  if (points.length < 2)
    return (
      <p className="small muted" style={{ margin: 0 }}>
        {points.length === 1
          ? "One graded call so far — the trend line appears from the second one."
          : "No graded calls yet."}
      </p>
    );

  const W = 720;
  const H = height;
  const pad = { l: 30, r: 10, t: 12, b: 20 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (Math.max(0, Math.min(100, v)) / 100) * ih;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${(pad.t + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + ih).toFixed(1)} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={`Score over ${points.length} calls, most recent ${last.score} out of 100`}
      style={{ display: "block", overflow: "visible" }}
    >
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth="1" />
          <text x={pad.l - 6} y={y(g) + 3.5} textAnchor="end" fontSize="9" fill="var(--muted)">
            {g}
          </text>
        </g>
      ))}
      <path d={area} fill="var(--brand)" opacity="0.10" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.score)} r={i === points.length - 1 ? 4.5 : 2.8} fill={TONE(p.score)}>
          <title>{`${p.label}: ${p.score}/100`}</title>
        </circle>
      ))}
      <text x={x(0)} y={H - 5} fontSize="9" fill="var(--muted)">oldest</text>
      <text x={x(points.length - 1)} y={H - 5} fontSize="9" fill="var(--muted)" textAnchor="end">newest</text>
    </svg>
  );
}

/** "Last 5 vs the 5 before" — the number Juan actually asks for. */
export function TrendDelta({ points }: { points: TrendPoint[] }) {
  if (points.length < 4)
    return (
      <span className="small muted">
        Needs at least 4 graded calls to show movement ({points.length} so far).
      </span>
    );
  const n = Math.min(5, Math.floor(points.length / 2));
  const recent = points.slice(-n);
  const before = points.slice(-(n * 2), -n);
  const avg = (a: TrendPoint[]) => Math.round(a.reduce((s, p) => s + p.score, 0) / a.length);
  const now = avg(recent);
  const then = avg(before);
  const d = now - then;
  const tone = d > 2 ? "var(--green)" : d < -2 ? "var(--red)" : "var(--muted)";
  return (
    <span className="small">
      <strong style={{ color: tone, fontSize: 17 }}>
        {d > 0 ? "+" : ""}{d}
      </strong>{" "}
      <span className="muted">
        — last {n} calls average {now}, the {n} before averaged {then}
      </span>
    </span>
  );
}

/** Where a group is weakest: one bar per rubric category, worst first. */
export function WeakSpots({
  rows,
}: {
  rows: { label: string; got: number; max: number; calls: number }[];
}) {
  if (rows.length === 0) return <p className="small muted" style={{ margin: 0 }}>Not enough graded calls yet.</p>;
  return (
    <div className="rpt-bars">
      {rows.map((r) => {
        const pct = r.max > 0 ? r.got / r.max : 0;
        const tone = pct >= 0.75 ? "rpt-good" : pct >= 0.5 ? "rpt-mid" : "rpt-low";
        return (
          <div key={r.label} className="rpt-bar">
            <span className="lbl">{r.label}</span>
            <span className="rpt-track">
              <span className={`rpt-fill ${tone}`} style={{ width: `${Math.round(pct * 100)}%` }} />
            </span>
            <span className="rpt-n">{Math.round(pct * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}
