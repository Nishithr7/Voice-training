// Web Speech API wrapper. Appends final transcripts via onFinal, exposes interim text for
// live display. Falls back gracefully (supported=false) where the API is missing.

import { useCallback, useEffect, useRef, useState } from "react";

function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition({ onFinal, lang = "en-US" } = {}) {
  const Ctor = getRecognitionCtor();
  const supported = Boolean(Ctor);

  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);

  const recRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  const wantListeningRef = useRef(false);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    recRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    setError(null);
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        /* ignore */
      }
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript ?? "";
        if (r.isFinal) {
          onFinalRef.current?.(text.trim());
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
    };
    rec.onerror = (event) => {
      // "no-speech" and "aborted" are routine; surface the rest.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error === "not-allowed" ? "Microphone permission denied." : `Speech error: ${event.error}`);
        wantListeningRef.current = false;
        setListening(false);
      }
    };
    rec.onend = () => {
      // Chrome stops continuous recognition after a silence; restart if user still wants it.
      if (wantListeningRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    wantListeningRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setError(String(e?.message || e));
      wantListeningRef.current = false;
    }
  }, [Ctor, lang]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, interim, error, start, stop };
}
