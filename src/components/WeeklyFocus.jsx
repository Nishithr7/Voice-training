import { useState } from "react";
import { api } from "../api.js";

const SUGGESTIONS = ["pausing", "volume", "eye contact language", "tighter stories", "asking Level 2 questions", "hand gestures", "finishing my thought", "linking the story back"];

function daysSince(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function WeeklyFocus({ focus, onChange }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const cur = focus.current;

  async function run(fn) {
    setBusy(true);
    try {
      onChange(await fn());
    } finally {
      setBusy(false);
    }
  }

  const days = cur ? daysSince(cur.startedAt) : 0;
  const weekDone = days >= 7;
  const improvedCount = focus.log.filter((l) => l.result === "improved").length;

  return (
    <div className="card focus-card">
      <div className="card-head">
        <h2>Weekly focus</h2>
        {improvedCount > 0 && <span className="meta">{improvedCount} ✓ locked in</span>}
      </div>
      <p className="hint">
        One behavior at a time. At week's end, review: improved → next behavior; not yet → same focus, another week.
      </p>

      {!cur ? (
        <>
          <form
            className="focus-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) run(() => api.setFocus(draft.trim())).then(() => setDraft(""));
            }}
          >
            <input
              value={draft}
              disabled={busy}
              placeholder="This week I'm working on…"
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="primary" type="submit" disabled={busy || !draft.trim()}>
              Set
            </button>
          </form>
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => setDraft(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="focus-current">
            <div className="focus-text">{cur.focus}</div>
            <div className="meta">
              Day {days + 1} of 7
              {cur.repeatCount > 0 && <> · week {cur.repeatCount + 1} on this (repeated)</>}
            </div>
            <div className="progress">
              <span style={{ width: `${Math.min(100, ((days + 1) / 7) * 100)}%` }} />
            </div>
          </div>

          <div className="focus-review">
            <div className="hint">
              {weekDone ? "Week's up. Be honest — did it improve?" : "End-of-week checkpoint (you can review early if you've done the reps):"}
            </div>
            <div className="review-buttons">
              <button className="primary" disabled={busy} onClick={() => run(() => api.reviewFocus("improved"))}>
                Improved → done
              </button>
              <button className="ghost" disabled={busy} onClick={() => run(() => api.reviewFocus("repeat"))}>
                Not yet → repeat week
              </button>
            </div>
            <button className="link danger" disabled={busy} onClick={() => run(() => api.setFocus(""))}>
              Drop this focus
            </button>
          </div>
        </>
      )}

      {focus.log.length > 0 && (
        <details className="focus-log">
          <summary>Past focuses ({focus.log.length})</summary>
          <ul>
            {[...focus.log].reverse().map((l, i) => (
              <li key={`${l.id}-${i}`} className={`log-${l.result}`}>
                <span>{l.focus}</span>
                <span className="meta">{l.result}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
