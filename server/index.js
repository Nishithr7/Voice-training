// Speaking Coach — thin Express backend.
// Keeps the Anthropic API key server-side, persists attempts + weekly focus to data/db.json.

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

import { buildSystemBlocks, buildUserMessage } from "./coachPrompt.js";
import { parseFeedback } from "./feedbackParser.js";
import * as db from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const MODEL = process.env.COACH_MODEL || "claude-opus-5";
const EFFORT = process.env.COACH_EFFORT || "high";
// Server-side refusal fallback (beta). On by default; auto-disables for the process if the
// API rejects the beta, and can be forced off with COACH_FALLBACKS=false.
let useFallbacks = process.env.COACH_FALLBACKS !== "false";

const app = express();
app.use(express.json({ limit: "1mb" }));

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY (or an `ant auth login` profile)
  return client;
}

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
}

// ---- Health ----
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: hasCredentials(), fallbacks: useFallbacks });
});

// ---- Feedback (the main event) ----
app.post("/api/feedback", async (req, res) => {
  const { category, scenario, response, deliveryNotes } = req.body ?? {};
  if (!scenario?.trim() || !response?.trim()) {
    return res.status(400).json({ error: "scenario and response are required" });
  }

  const focus = db.getFocus().current;
  const system = buildSystemBlocks();
  const messages = [{ role: "user", content: buildUserMessage({ category, scenario, response, focus, deliveryNotes }) }];

  const base = {
    model: MODEL,
    max_tokens: 4000,
    system,
    messages,
    output_config: { effort: EFFORT },
  };

  let message;
  try {
    message = await callCoach(base);
  } catch (error) {
    return res.status(statusFor(error)).json({ error: describeError(error) });
  }

  if (message.stop_reason === "refusal") {
    return res.status(422).json({
      error: "The coach declined to evaluate this response.",
      detail: message.stop_details?.explanation ?? null,
    });
  }

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const feedback = parseFeedback(raw);

  const attempt = db.addAttempt({
    category: category || "Custom",
    scenario: scenario.trim(),
    response: response.trim(),
    deliveryNotes: deliveryNotes?.trim() || "",
    focus: focus ? { id: focus.id, focus: focus.focus, repeatCount: focus.repeatCount ?? 0 } : null,
    feedback,
    model: message.model,
    usage: {
      input: message.usage?.input_tokens ?? 0,
      output: message.usage?.output_tokens ?? 0,
      cacheRead: message.usage?.cache_read_input_tokens ?? 0,
      cacheWrite: message.usage?.cache_creation_input_tokens ?? 0,
    },
  });

  res.json({ attempt });
});

async function callCoach(base) {
  const c = getClient();
  if (useFallbacks) {
    try {
      return await c.beta.messages.create({
        ...base,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } catch (error) {
      // If the account/platform rejects the beta, drop it for the rest of the process and retry plain.
      if (error instanceof Anthropic.BadRequestError) {
        console.warn("[coach] fallbacks beta rejected, retrying without it:", error.message);
        useFallbacks = false;
      } else {
        throw error;
      }
    }
  }
  return c.messages.create(base);
}

function statusFor(error) {
  if (error instanceof Anthropic.AuthenticationError) return 401;
  if (error instanceof Anthropic.RateLimitError) return 429;
  if (error instanceof Anthropic.BadRequestError) return 400;
  if (error instanceof Anthropic.APIError && error.status) return error.status >= 500 ? 502 : error.status;
  return 500;
}

function describeError(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in .env and restart the server.";
  }
  if (error instanceof Anthropic.RateLimitError) return "Rate limited by the API. Wait a moment and try again.";
  if (error instanceof Anthropic.APIConnectionError) return "Could not reach the Anthropic API. Check your connection.";
  if (error instanceof Anthropic.APIError) return `API error ${error.status ?? ""}: ${error.message}`;
  if (!hasCredentials()) return "No ANTHROPIC_API_KEY found. Copy .env.example to .env, add your key, restart.";
  console.error("[coach] unexpected error", error);
  return "Unexpected server error. See server logs.";
}

// ---- Attempts / history ----
app.get("/api/attempts", (req, res) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  res.json({ attempts: db.listAttempts({ category }) });
});

app.delete("/api/attempts/:id", (req, res) => {
  const ok = db.deleteAttempt(req.params.id);
  res.status(ok ? 200 : 404).json({ ok });
});

// ---- Weekly focus ----
app.get("/api/focus", (_req, res) => res.json(db.getFocus()));

app.put("/api/focus", (req, res) => {
  res.json(db.setFocus(req.body?.focus ?? ""));
});

app.post("/api/focus/review", (req, res) => {
  const { result } = req.body ?? {};
  if (result !== "improved" && result !== "repeat") {
    return res.status(400).json({ error: 'result must be "improved" or "repeat"' });
  }
  res.json(db.reviewFocus(result));
});

// ---- Static build (production) ----
if (process.env.NODE_ENV === "production") {
  const dist = path.join(here, "..", "dist");
  app.use(express.static(dist));
  app.get("/{*splat}", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`[coach] server on http://localhost:${PORT}  model=${MODEL}  key=${hasCredentials() ? "yes" : "MISSING"}`);
  if (!hasCredentials()) {
    console.warn("[coach] No ANTHROPIC_API_KEY set. Copy .env.example to .env and add your key.");
  }
});
