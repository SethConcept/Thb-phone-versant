// Pure presentation for a coach report. NO lib imports on purpose — this
// renders in the browser (inside the results client), so it must never pull
// in the academy/dispo persona content. It only ever receives ReportData.

export type ReportBar = { label: string; got: number; max: number };
export type ReportFlag = { label: string; quote?: string };
export type ReportData = {
  graded: boolean;
  pass: boolean;
  headline: string;
  scoreText: string | null;
  score100: number | null;
  whoLabel: string;
  who: string;
  note: string | null;
  passRule: string | null;
  bars: ReportBar[];
  strengths: string[];
  recommendations: string[];
  flags: ReportFlag[];
  coaching: string | null;
  extra: string | null;
};

export function ReportBars({ bars }: { bars: ReportBar[] }) {
  return (
    <div className="rpt-bars">
      {bars.map((b) => {
        const ratio = b.max > 0 ? b.got / b.max : 0;
        const tone = ratio >= 0.75 ? "rpt-good" : ratio >= 0.5 ? "rpt-mid" : "rpt-low";
        return (
          <div key={b.label} className="rpt-bar">
            <span className="lbl">{b.label}</span>
            <span className="rpt-track">
              <span className={`rpt-fill ${tone}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
            </span>
            <span className="rpt-n">{b.got} / {b.max}</span>
          </div>
        );
      })}
    </div>
  );
}

/** The coach block: score line, bars, strengths vs recommendations, note. */
export function ReportView({ data, heading }: { data: ReportData; heading?: string }) {
  return (
    <>
      <div className="rpt-head">
        {heading && <strong style={{ fontSize: 15 }}>{heading}</strong>}
        {data.scoreText && <span className="rpt-score">{data.scoreText}</span>}
        <span className={`pill ${data.pass ? "pill-green" : "pill-amber"}`}>
          {data.pass ? "✓ " : ""}{data.headline}
        </span>
        {data.passRule && <span className="small muted">{data.passRule}</span>}
      </div>

      {data.note && (
        <p className="small" style={{ margin: "6px 0 0" }}>
          <strong>Recommendation:</strong> {data.note}
        </p>
      )}

      {data.bars.length > 0 && <ReportBars bars={data.bars} />}

      {data.flags.length > 0 && (
        <div className="notice notice-gray small" style={{ margin: "8px 0", color: "var(--red)" }}>
          {data.flags.map((f, i) => (
            <div key={i}>
              🚫 <strong>{f.label}</strong>
              {f.quote && <> — “{f.quote}”</>}
            </div>
          ))}
        </div>
      )}

      {(data.strengths.length > 0 || data.recommendations.length > 0) && (
        <div className="rpt-cols">
          <div className="good">
            <h4>Strengths</h4>
            <ul>
              {data.strengths.length === 0 && <li className="muted">None yet — see recommendations.</li>}
              {data.strengths.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
          <div className="work">
            <h4>Recommendations</h4>
            <ul>
              {data.recommendations.length === 0 && <li className="muted">Nothing — clean call.</li>}
              {data.recommendations.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>
      )}

      {data.extra && <p className="small" style={{ marginTop: 10 }}>{data.extra}</p>}
      {data.coaching && (
        <div className="rpt-coach"><strong>Coaching:</strong> {data.coaching}</div>
      )}
    </>
  );
}
