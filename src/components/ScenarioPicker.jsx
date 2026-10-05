import { CATEGORIES, CUSTOM_CATEGORY } from "../scenarios.js";

export default function ScenarioPicker({ category, scenario, onPick, onScenarioChange }) {
  const active = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="card">
      <div className="card-head">
        <h2>1. Pick a scenario</h2>
        {category && (
          <button className="link" onClick={() => onPick(null, "")}>
            Change
          </button>
        )}
      </div>

      {!category && (
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <button key={c.id} className="cat-card" onClick={() => onPick(c.id, "")}>
              <strong>{c.id}</strong>
              <span>{c.lens}</span>
            </button>
          ))}
          <button className="cat-card custom" onClick={() => onPick(CUSTOM_CATEGORY, "")}>
            <strong>Custom scenario</strong>
            <span>Describe any situation in your own words.</span>
          </button>
        </div>
      )}

      {category && (
        <div className="scenario-body">
          <div className="pill-row">
            <span className="pill">{category}</span>
            {active && <span className="lens">{active.lens}</span>}
          </div>

          {active && (
            <div className="prompt-list">
              {active.prompts.map((p) => (
                <button
                  key={p}
                  className={`prompt ${scenario === p ? "selected" : ""}`}
                  onClick={() => onPick(category, p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <label className="field">
            <span>{active ? "Or write your own version of the scenario" : "Describe the scenario"}</span>
            <textarea
              rows={2}
              value={scenario}
              placeholder={
                active
                  ? "e.g. I'm at my partner's work party and just got introduced to their boss…"
                  : "e.g. Toast at my brother's wedding, 200 guests, mixed ages, 3 minutes…"
              }
              onChange={(e) => onScenarioChange(e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
