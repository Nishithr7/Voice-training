import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { ALL_CATEGORY_IDS } from "../scenarios.js";
import FeedbackCard from "./FeedbackCard.jsx";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function History({ version, onRetry }) {
  const [attempts, setAttempts] = useState([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .listAttempts()
      .then((r) => setAttempts(r.attempts))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, [version]);

  const shown = useMemo(() => (filter ? attempts.filter((a) => a.category === filter) : attempts), [attempts, filter]);

  const counts = useMemo(() => {
    const m = {};
    for (const a of attempts) m[a.category] = (m[a.category] || 0) + 1;
    return m;
  }, [attempts]);

  // Focus-check trend for the visible list (most recent first): yes / no / unclear.
  const focusTrend = useMemo(
    () =>
      shown
        .filter((a) => a.feedback?.focusCheck)
        .slice(0, 12)
        .map((a) => {
          const t = a.feedback.focusCheck.trim().toLowerCase();
          return t.startsWith("yes") ? "yes" : t.startsWith("no") ? "no" : "unclear";
        }),
    [shown],
  );

  async function remove(id) {
    if (!window.confirm("Delete this attempt? No undo.")) return;
    await api.deleteAttempt(id);
    setAttempts((list) => list.filter((a) => a.id !== id));
    if (open === id) setOpen(null);
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>History</h2>
        <div className="meta">
          {attempts.length} rep{attempts.length === 1 ? "" : "s"} total
        </div>
      </div>

      <div className="filter-row">
        <button className={`chip ${filter === "" ? "on" : ""}`} onClick={() => setFilter("")}>
          All
        </button>
        {ALL_CATEGORY_IDS.filter((c) => counts[c]).map((c) => (
          <button key={c} className={`chip ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>
            {c} <span className="count">{counts[c]}</span>
          </button>
        ))}
      </div>

      {focusTrend.length > 0 && (
        <div className="trend">
          <span className="hint">Focus checks, newest first:</span>
          <div className="trend-dots">
            {focusTrend.map((v, i) => (
              <span key={i} className={`tdot v-${v}`} title={v} />
            ))}
          </div>
        </div>
      )}

      {loading && <p className="hint">Loading…</p>}
      {!loading && shown.length === 0 && <p className="hint">No reps yet. Go do one.</p>}

      <ul className="history-list">
        {shown.map((a) => (
          <li key={a.id} className={open === a.id ? "open" : ""}>
            <button className="history-row" onClick={() => setOpen(open === a.id ? null : a.id)}>
              <span className="pill small">{a.category}</span>
              <span className="scenario-text">{a.scenario}</span>
              <span className="when">{fmtDate(a.createdAt)}</span>
            </button>
            {open === a.id && (
              <div className="history-detail">
                <div className="said">
                  <h4>What you said</h4>
                  <p>{a.response}</p>
                  {a.deliveryNotes && (
                    <p className="hint">
                      <strong>Delivery notes:</strong> {a.deliveryNotes}
                    </p>
                  )}
                </div>
                <FeedbackCard attempt={a} compact />
                <div className="row-actions">
                  <button className="ghost" onClick={() => onRetry(a)}>
                    Rep this scenario again
                  </button>
                  <button className="link danger" onClick={() => remove(a.id)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
