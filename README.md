# Speaking Coach

A personal practice tool for rehearsing real-world speaking scenarios and getting honest,
structured feedback. Pick a scenario, say what you'd actually say (dictate or type), and a
Claude-powered coach grades it against the frameworks in `stage-academy-notes.md`:
vocal archetypes, Incident → Point → Linking storytelling, Vanessa Van Edwards' conversation
mechanics, and the "one behavior per week" 12 Week Plan.

Single user, local only. Attempts and your weekly focus are saved to `data/db.json`.

## Setup

Requires Node 20.6+ (uses `--env-file`). Node 24 tested.

```bash
npm install
cp .env.example .env
# open .env and paste your key:  ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the Express
backend on port 3001, so the key never reaches the browser.

If the top of the page shows a "No API key on the server" banner, the server didn't see
`ANTHROPIC_API_KEY`. Check `.env` is in the repo root and restart `npm run dev`.

## How to use it

1. **Pick a scenario.** Six categories (Small Talk / Networking, Job Interview, Work
   Presentation, Difficult Conversation, Phone Call, Storytelling / Keynote), each with
   example prompts, or write a custom one.
2. **Say it out loud first**, then hit *Dictate with mic* (Chrome, Edge, Safari) and say
   it again, or type it. The word count shows roughly how long it runs spoken.
   Optionally add delivery notes (posture, pace, where you looked) since text can't show those.
3. **Get feedback.** Fixed format, no fluff:
   - **What worked** (quotes your actual words)
   - **What to fix** (the single biggest issue, not softened)
   - **One next rep** (one small thing to change next time)
   - **Focus check** (only if a weekly focus is set: did this rep show improvement on it?)
4. **Weekly focus** (sidebar). Set ONE behavior to work on this week. Every piece of
   feedback that week checks it. At week's end, mark *Improved → done* to unlock the next
   focus, or *Not yet → repeat week* to run the same focus again. Same mechanic as the
   12 Week Plan in the notes: confirmed improvement is the only way forward.
5. **History** tab lists every attempt, filterable by category, with a dot-strip of recent
   focus-check results so you can see the trend.

## Project layout

```
server/
  index.js          Express API: /api/feedback, /api/attempts, /api/focus
  coachPrompt.js    System prompt (rubric) + attaches stage-academy-notes.md as cached context
  feedbackParser.js Splits the coach's reply into the four sections
  db.js             JSON-file store (data/db.json)
src/
  App.jsx           Tabs, practice flow, state
  scenarios.js      Categories, example prompts, per-category "lens" hints
  useSpeechRecognition.js  Web Speech API hook with textarea fallback
  components/       ScenarioPicker, ResponseInput, FeedbackCard, History, WeeklyFocus
stage-academy-notes.md     Knowledge base. Keep it updated: feedback quality depends on it.
```

## Configuration (`.env`)

| Variable | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Required. |
| `PORT` | `3001` | Backend port. Update `vite.config.js` proxy if you change it. |
| `COACH_MODEL` | `claude-opus-5` | Any current Claude model ID. |
| `COACH_EFFORT` | `high` | `low` / `medium` / `high` / `xhigh` / `max`. Lower is cheaper and faster. |
| `COACH_FALLBACKS` | `true` | Server-side refusal fallback (beta). If the API rejects the beta the server drops it automatically; set `false` to never send it. |

## Cost note

The full notes file (~15k tokens) is sent as a system block with a 1-hour prompt cache, so
you pay full price for it roughly once an hour and ~10% on every rep after that. Each
attempt's token usage is shown under the feedback.

## Production-ish run

```bash
npm run build
npm start        # serves dist/ and the API from one process on port 3001
```

## Editing the coach

- Rubric and tone: `server/coachPrompt.js` (`COACH_RUBRIC`).
- Frameworks and course content: `stage-academy-notes.md`. Anything added there is
  available to the coach on the next request.
- Scenario categories and prompts: `src/scenarios.js`.
