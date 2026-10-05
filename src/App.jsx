import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";
import { CUSTOM_CATEGORY } from "./scenarios.js";
import ScenarioPicker from "./components/ScenarioPicker.jsx";
import Session from "./components/Session.jsx";
import History from "./components/History.jsx";
import WeeklyFocus from "./components/WeeklyFocus.jsx";

export default function App() {
  const [tab, setTab] = useState("practice");
  const [health, setHealth] = useState(null);

  // Scenario selection (picker) → active session
  const [category, setCategory] = useState(null);
  const [scenario, setScenario] = useState("");
  const [session, setSession] = useState(null); // { category, scenario } once started

  const [focus, setFocus] = useState({ current: null, log: [] });
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
    api.getFocus().then(setFocus).catch(() => {});
  }, []);

  const pickScenario = useCallback((cat, text) => {
    setCategory(cat);
    setScenario(text ?? "");
  }, []);

  function startSession() {
    if (!scenario.trim()) return;
    setSession({ category: category || CUSTOM_CATEGORY, scenario: scenario.trim(), key: Date.now() });
  }

  function endSession() {
    setSession(null);
  }

  function retryFromHistory(attempt) {
    setCategory(attempt.category);
    setScenario(attempt.scenario);
    setSession({ category: attempt.category, scenario: attempt.scenario, key: Date.now() });
    setTab("practice");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🎙</span>
          <div>
            <h1>Speaking Coach</h1>
            <p className="tagline">Say it. Hear the truth. Change one thing.</p>
          </div>
        </div>
        <nav className="tabs" aria-label="Sections">
          <button className={tab === "practice" ? "active" : ""} onClick={() => setTab("practice")}>
            Practice
          </button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>
            History
          </button>
        </nav>
      </header>

      {health && !health.hasKey && (
        <div className="banner warn">
          No API key on the server. Copy <code>.env.example</code> to <code>.env</code>, add{" "}
          <code>ANTHROPIC_API_KEY</code>, and restart <code>npm run dev</code>.
        </div>
      )}
      {health && health.ok === false && (
        <div className="banner warn">
          Can't reach the local server on port 3001. Is <code>npm run dev</code> running?
        </div>
      )}

      <main className={`layout ${session && tab === "practice" ? "in-session" : ""}`}>
        <section className="main-col">
          {tab === "practice" ? (
            session ? (
              <Session
                key={session.key}
                category={session.category}
                scenario={session.scenario}
                focus={focus.current}
                onFeedback={() => setHistoryVersion((v) => v + 1)}
                onChangeScenario={endSession}
              />
            ) : (
              <>
                <ScenarioPicker category={category} scenario={scenario} onPick={pickScenario} onScenarioChange={setScenario} />
                {scenario.trim() && (
                  <div className="submit-row">
                    <button className="primary big" onClick={startSession}>
                      🎙 Start session
                    </button>
                    <span className="hint">The coach starts listening right away.</span>
                  </div>
                )}
              </>
            )
          ) : (
            <History version={historyVersion} onRetry={retryFromHistory} />
          )}
        </section>

        <aside className="side-col">
          <WeeklyFocus focus={focus} onChange={setFocus} />
        </aside>
      </main>
    </div>
  );
}
