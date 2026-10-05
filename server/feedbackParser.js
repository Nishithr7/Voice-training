// Parses the coach's fixed-format reply into sections.
// Expected headers (in order): WHAT WORKED, WHAT TO FIX, ONE NEXT REP, FOCUS CHECK (optional).
// Tolerant of markdown bold, trailing colons, and extra whitespace. Falls back to raw text.

const SECTIONS = [
  { key: "whatWorked", pattern: /what\s+worked/i },
  { key: "whatToFix", pattern: /what\s+to\s+fix/i },
  { key: "oneNextRep", pattern: /one\s+next\s+rep/i },
  { key: "focusCheck", pattern: /focus\s+check/i },
];

function matchHeader(line) {
  // Strip markdown emphasis / list markers, then see if the line *starts* with a known header.
  const cleaned = line.replace(/^[\s\-*#>]+/, "").replace(/[*_`]/g, "").trim();
  for (const s of SECTIONS) {
    const m = cleaned.match(new RegExp(`^${s.pattern.source}\\s*:?\\s*(.*)$`, "i"));
    if (m) return { key: s.key, rest: m[1] ?? "" };
  }
  return null;
}

export function parseFeedback(raw) {
  const text = String(raw ?? "").trim();
  const out = { raw: text, whatWorked: "", whatToFix: "", oneNextRep: "", focusCheck: "" };

  let current = null;
  const buffers = {};
  for (const line of text.split(/\r?\n/)) {
    const header = matchHeader(line);
    if (header) {
      current = header.key;
      buffers[current] = header.rest ? [header.rest] : [];
    } else if (current) {
      buffers[current].push(line);
    }
  }

  for (const key of Object.keys(buffers)) {
    out[key] = buffers[key].join("\n").trim();
  }
  out.parsed = Boolean(out.whatWorked || out.whatToFix || out.oneNextRep);
  return out;
}
