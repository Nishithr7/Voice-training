// Tiny JSON-file store. Single-user tool, so a flat file is plenty.
// Data lives in data/db.json (git-ignored). All writes are atomic (write temp, rename).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(here, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const EMPTY = {
  attempts: [],
  focus: {
    current: null, // { id, focus, startedAt, repeatCount }
    log: [], // past focus periods: { ...current, endedAt, result: 'improved' | 'repeat' | 'abandoned' }
  },
};

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    cache = {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      focus: {
        current: parsed.focus?.current ?? null,
        log: Array.isArray(parsed.focus?.log) ? parsed.focus.log : [],
      },
    };
  } catch {
    cache = structuredClone(EMPTY);
  }
  return cache;
}

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Attempts ----

export function listAttempts({ category } = {}) {
  const { attempts } = load();
  const filtered = category ? attempts.filter((a) => a.category === category) : attempts;
  return [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addAttempt(attempt) {
  const db = load();
  const record = { id: newId(), createdAt: new Date().toISOString(), ...attempt };
  db.attempts.push(record);
  save();
  return record;
}

export function deleteAttempt(id) {
  const db = load();
  const before = db.attempts.length;
  db.attempts = db.attempts.filter((a) => a.id !== id);
  if (db.attempts.length !== before) save();
  return db.attempts.length !== before;
}

// ---- Weekly focus ----

export function getFocus() {
  return load().focus;
}

export function setFocus(text) {
  const db = load();
  const trimmed = String(text ?? "").trim();
  if (db.focus.current) {
    // Replacing an active focus without a review counts as abandoning it.
    db.focus.log.push({ ...db.focus.current, endedAt: new Date().toISOString(), result: "abandoned" });
  }
  db.focus.current = trimmed
    ? { id: newId(), focus: trimmed, startedAt: new Date().toISOString(), repeatCount: 0 }
    : null;
  save();
  return db.focus;
}

/**
 * End-of-week checkpoint (12 Week Plan mechanic).
 * result = "improved": close it out, clear the current focus so the next one can be set.
 * result = "repeat":   same focus, another week; bump repeatCount and restart the clock.
 */
export function reviewFocus(result) {
  const db = load();
  const cur = db.focus.current;
  if (!cur) return db.focus;
  const now = new Date().toISOString();
  if (result === "improved") {
    db.focus.log.push({ ...cur, endedAt: now, result: "improved" });
    db.focus.current = null;
  } else if (result === "repeat") {
    db.focus.log.push({ ...cur, endedAt: now, result: "repeat" });
    db.focus.current = { ...cur, startedAt: now, repeatCount: (cur.repeatCount ?? 0) + 1 };
  }
  save();
  return db.focus;
}
