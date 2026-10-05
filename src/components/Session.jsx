// Voice-first practice session.
// Sphere listens as soon as the session opens. Transcript builds live on the side (editable).
// Tap the sphere (or "Done") → coach thinks → feedback, read aloud if enabled.

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useSpeechRecognition } from "../useSpeechRecognition.js";
import { useMicLevel } from "../useMicLevel.js";
import { useSpeak } from "../useSpeak.js";
import Sphere from "./Sphere.jsx";
import FeedbackCard from "./FeedbackCard.jsx";

function spokenSeconds(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, seconds: Math.round((words / 150) * 60) };
}

function readAloudPref() {
  try {
    return localStorage.getItem("coach.readAloud") !== "false";
  } catch {
    return true;
  }
}

export default function Session({ category, scenario, focus, onFeedback, onChangeScenario }) {
  const [phase, setPhase] = useState("idle"); // idle | listening | review | thinking | feedback
  const [transcript, setTranscript] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);
  const [readAloud, setReadAloud] = useState(readAloudPref);

  const mic = useMicLevel();
  const tts = useSpeak();
  const textareaRef = useRef(null);

  const appendFinal = useCallback((text) => {
    if (!text) return;
    setTranscript((prev) => prev + (prev && !/\s$/.test(prev) ? " " : "") + text);
  }, []);
  const speech = useSpeechRecognition({ onFinal: appendFinal });

  const startListening = useCallback(() => {
    setError(null);
    tts.stop();
    mic.start();
    if (speech.supported) speech.start();
    setPhase("listening");
  }, [mic, speech, tts]);

  const stopListening = useCallback(() => {
    speech.stop();
    mic.stop();
    setPhase("review");
  }, [mic, speech]);

  // Auto-start when the session opens.
  useEffect(() => {
    startListening();
    return () => {
      speech.stop();
      mic.stop();
      tts.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // Keep the transcript scrolled to the bottom while dictating.
  useEffect(() => {
    if (phase === "listening" && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [transcript, speech.interim, phase]);

  async function submit() {
    if (!transcript.trim()) {
      setError("Nothing to coach yet. Say (or type) what you'd actually say first.");
      return;
    }
    speech.stop();
    mic.stop();
    setPhase("thinking");
    setError(null);
    try {
      const { attempt: a } = await api.getFeedback({
        category,
        scenario,
        response: transcript.trim(),
        deliveryNotes: deliveryNotes.trim() || undefined,
      });
      setAttempt(a);
      setPhase("feedback");
      onFeedback?.(a);
      if (readAloud && tts.supported && a.feedback?.parsed) {
        const fb = a.feedback;
        tts.speak(
          [
            `What worked. ${fb.whatWorked}`,
            `What to fix. ${fb.whatToFix}`,
            `One next rep. ${fb.oneNextRep}`,
            fb.focusCheck ? `Focus check. ${fb.focusCheck}` : "",
          ].join(" "),
        );
      }
    } catch (e) {
      setError(e.message + (e.detail ? ` (${e.detail})` : ""));
      setPhase("review");
    }
  }

  function again() {
    tts.stop();
    setAttempt(null);
    setTranscript("");
    setDeliveryNotes("");
    setError(null);
    startListening();
  }

  function toggleReadAloud() {
    const next = !readAloud;
    setReadAloud(next);
    try {
      localStorage.setItem("coach.readAloud", String(next));
    } catch {
      /* ignore */
    }
    if (!next) tts.stop();
  }

  // Sphere presentation
  const sphereState =
    phase === "listening" ? "listening" : phase === "thinking" ? "thinking" : tts.speaking ? "speaking" : phase === "feedback" ? "done" : "idle";
  const sphereLabel =
    phase === "listening"
      ? "Listening… tap when done"
      : phase === "thinking"
        ? "Coach is thinking"
        : tts.speaking
          ? "Coach is talking… tap to hush"
          : phase === "feedback"
            ? "Tap to go again"
            : "Tap to start";

  function onSphereClick() {
    if (phase === "listening") return transcript.trim() ? submit() : stopListening();
    if (phase === "thinking") return;
    if (tts.speaking) return tts.stop();
    if (phase === "feedback") return again();
    startListening();
  }

  const { words, seconds } = spokenSeconds(transcript);
  const micProblem = mic.error || speech.error;

  return (
    <div className="session">
      <div className="session-head">
        <div>
          <span className="pill">{category}</span>
          <p className="scenario-line">{scenario}</p>
        </div>
        <button className="link" onClick={onChangeScenario}>
          Change scenario
        </button>
      </div>

      <div className="stage">
        <div className="stage-sphere">
          <Sphere state={sphereState} level={mic.level} onClick={onSphereClick} label={sphereLabel} />
          {micProblem && <div className="hint error-text center">{micProblem} You can still type on the right.</div>}
          {!speech.supported && phase === "listening" && (
            <div className="hint center">Live dictation needs Chrome, Edge or Safari. Type on the right; the sphere still hears you.</div>
          )}

          <div className="stage-actions">
            {phase === "listening" && (
              <button className="primary" onClick={submit} disabled={!transcript.trim()}>
                Done — get feedback
              </button>
            )}
            {phase === "review" && (
              <>
                <button className="primary" onClick={submit} disabled={!transcript.trim()}>
                  Get feedback
                </button>
                <button className="ghost" onClick={startListening}>
                  Keep talking
                </button>
              </>
            )}
            {phase === "idle" && (
              <button className="primary" onClick={startListening}>
                Start listening
              </button>
            )}
            {phase === "feedback" && (
              <button className="ghost" onClick={again}>
                Rep it again
              </button>
            )}
          </div>

          {tts.supported && (
            <label className="toggle">
              <input type="checkbox" checked={readAloud} onChange={toggleReadAloud} />
              Coach reads feedback aloud
            </label>
          )}
        </div>

        <aside className="transcript-panel">
          <div className="card-head">
            <h2>Transcript</h2>
            <div className="meta">
              {words} words · ~{seconds}s
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="transcript"
            value={transcript}
            disabled={phase === "thinking"}
            placeholder={
              phase === "listening"
                ? "Start talking. Your words land here — fix anything the mic got wrong."
                : "Type here if you'd rather not dictate."
            }
            onChange={(e) => setTranscript(e.target.value)}
          />
          {phase === "listening" && speech.interim && <div className="interim">{speech.interim}…</div>}

          <div className="notes-toggle">
            <button type="button" className="link" onClick={() => setShowNotes((s) => !s)}>
              {showNotes ? "Hide" : "Add"} delivery notes
            </button>
            {showNotes && (
              <textarea
                rows={2}
                value={deliveryNotes}
                disabled={phase === "thinking"}
                placeholder="Posture, pace, where you looked — anything the text can't show."
                onChange={(e) => setDeliveryNotes(e.target.value)}
              />
            )}
          </div>
          {transcript && phase !== "thinking" && (
            <button className="link" onClick={() => setTranscript("")}>
              Clear transcript
            </button>
          )}
        </aside>
      </div>

      {error && <div className="banner error">{error}</div>}
      {attempt && <FeedbackCard attempt={attempt} focus={focus} />}
    </div>
  );
}
