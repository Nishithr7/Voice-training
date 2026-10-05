// Text-to-speech for reading feedback aloud. Prefers a natural English voice when available.

import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED = ["Samantha", "Google US English", "Microsoft Aria", "Karen", "Daniel", "Moira"];

export function useSpeak() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voiceRef.current =
        PREFERRED.map((n) => voices.find((v) => v.name.includes(n))).find(Boolean) ||
        voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  useEffect(() => stop, [stop]);

  return { supported, speaking, speak, stop };
}
