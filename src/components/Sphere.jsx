// The AI sphere. Pure CSS; `level` (0..1) drives scale + glow while listening.
// states: "idle" | "listening" | "thinking" | "speaking" | "done"

export default function Sphere({ state, level = 0, onClick, label }) {
  const style = { "--level": level.toFixed(3) };
  return (
    <button type="button" className={`sphere-wrap s-${state}`} style={style} onClick={onClick} aria-label={label}>
      <span className="halo" />
      <span className="ring r1" />
      <span className="ring r2" />
      <span className="orb">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="sheen" />
      </span>
      <span className="sphere-label">{label}</span>
    </button>
  );
}
