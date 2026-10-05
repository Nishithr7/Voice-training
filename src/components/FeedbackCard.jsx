function focusVerdict(text) {
  const t = (text || "").trim().toLowerCase();
  if (t.startsWith("yes")) return "yes";
  if (t.startsWith("no")) return "no";
  if (t) return "unclear";
  return null;
}

export default function FeedbackCard({ attempt, focus, compact = false }) {
  const fb = attempt.feedback || {};
  const verdict = focusVerdict(fb.focusCheck);

  if (!fb.parsed) {
    return (
      <div className={`card feedback ${compact ? "compact" : ""}`}>
        <h2>Coach feedback</h2>
        <pre className="raw">{fb.raw}</pre>
      </div>
    );
  }

  return (
    <div className={`card feedback ${compact ? "compact" : ""}`}>
      {!compact && <h2>Coach feedback</h2>}

      <section className="fb-block worked">
        <h3>What worked</h3>
        <p>{fb.whatWorked}</p>
      </section>

      <section className="fb-block fix">
        <h3>What to fix</h3>
        <p>{fb.whatToFix}</p>
      </section>

      <section className="fb-block rep">
        <h3>One next rep</h3>
        <p>{fb.oneNextRep}</p>
      </section>

      {fb.focusCheck && (
        <section className={`fb-block focus v-${verdict}`}>
          <h3>
            Focus check {attempt.focus?.focus && <span className="focus-name">· {attempt.focus.focus}</span>}
          </h3>
          <p>{fb.focusCheck}</p>
        </section>
      )}

      {!compact && attempt.usage && (
        <div className="usage">
          {attempt.model} · in {attempt.usage.input + attempt.usage.cacheRead} tok
          {attempt.usage.cacheRead > 0 && <> ({attempt.usage.cacheRead} cached)</>} · out {attempt.usage.output} tok
        </div>
      )}
      {!compact && focus && !fb.focusCheck && (
        <div className="hint">Weekly focus is set but the coach didn't return a focus check this time.</div>
      )}
    </div>
  );
}
