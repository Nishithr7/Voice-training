// Live microphone loudness (0..1) via Web Audio, for driving the sphere animation.
// Independent of SpeechRecognition so the orb reacts even between recognized words.

import { useCallback, useEffect, useRef, useState } from "react";

export function useMicLevel() {
  const [level, setLevel] = useState(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);

  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setActive(false);
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      streamRef.current = stream;
      ctxRef.current = ctx;
      setActive(true);

      const buf = new Uint8Array(analyser.fftSize);
      let smoothed = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length); // ~0.01 silence, ~0.2 loud speech
        const target = Math.min(1, rms * 4);
        smoothed += (target - smoothed) * (target > smoothed ? 0.5 : 0.12); // fast attack, slow release
        setLevel(smoothed);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setError(e?.name === "NotAllowedError" ? "Microphone permission denied." : String(e?.message || e));
      setActive(false);
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { level, active, error, start, stop };
}
