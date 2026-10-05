# Claude Code Build Prompt — Speaking Coach App

Paste the prompt below into Claude Code **after** copying `stage-academy-notes.md`
into the project folder/repo root, so Claude Code can read it directly as the
app's knowledge base.

---

```
Build a web app called "Speaking Coach" — a personal practice tool for rehearsing
real-world speaking scenarios and getting honest, structured feedback.

KNOWLEDGE BASE
Read `stage-academy-notes.md` in this repo before building anything. It's the full
compiled knowledge base — vocal archetypes, storytelling structure, body language,
rehearsal technique, nerves management, and the Vanessa Van Edwards conversation
frameworks (three-tier conversation model, story archetypes, conversational
mechanics, vocal charisma, graceful exits) — plus a "Speaking Coach Practice
Protocol" section that already defines how feedback should be structured. Use that
file (not just the condensed rubric below) as the source of truth. Build the
feedback system prompt (see below) by drawing directly from it rather than
reinventing the rubric — the condensed version below is a fallback/starting point
if you want a smaller system prompt, but the full file should inform the actual
feedback logic and tone.

STACK
- Single-page app: React (Vite) + plain CSS, no backend framework needed.
- Browser Web Speech API for optional live voice-to-text (fallback: plain textarea
  if the browser doesn't support it or the user prefers typing).
- Calls the Anthropic Messages API directly from a small serverless function
  (or a thin Node/Express backend) to keep the API key off the client. Store the
  key in an env var, never in frontend code.
- Persist session history in a local SQLite file (or lowdb/JSON file) — no need
  for a hosted DB for a single-user tool.

CORE FLOW
1. Scenario picker: buttons/cards for categories — Small Talk / Networking,
   Job Interview, Work Presentation, Difficult Conversation, Phone Call,
   Storytelling / Keynote. Each shows 2-3 example prompts (e.g. under
   "Networking": "You just met someone at a conference — open the conversation").
   Also allow a free-text custom scenario.
2. Response input: a mic button (Web Speech API, live transcription into a text
   box the user can edit) OR a textarea to type directly.
3. Submit → send the scenario + the user's response to the LLM with the system
   prompt below (built from stage-academy-notes.md) → render structured feedback.
4. Save each attempt (scenario, response, feedback, timestamp) to local storage.
5. History view: list past attempts, filterable by scenario category, so the
   user can see progress over time.
6. "Weekly Focus" tracker: a simple single-field widget where the user sets ONE
   behavior to work on this week (e.g. "pausing", "eye contact language",
   "tighter stories") — this mirrors the "12 Week Plan" coaching method described
   in stage-academy-notes.md (one behavior at a time, gated by a review checkpoint
   at the end of the week; repeat the same focus if it didn't improve). Every
   piece of feedback generated that week should explicitly call out whether that
   specific focus area showed improvement. Include a manual "mark this week
   done / not improved, repeat" toggle.

SYSTEM PROMPT TO EMBED (fallback/starting point — expand using the full detail in
stage-academy-notes.md rather than treating this condensed version as final):

"You are an honest, specific speaking coach. You evaluate written/transcribed
responses to speaking scenarios against this rubric:

- Archetype fit: is the tone matched to the goal — Educator (informative),
  Coach (assertive/motivating), Friend (warm/conversational), or a blend — and
  is it right for this scenario?
- Storytelling structure (if a story is used): Incident (who/what/where/when,
  brought to life with sensory/dialogue detail) → Point (held until near the
  end, not front-loaded) → Linking (tied back to the topic, not left implicit
  unless it clearly doesn't need it). Flag if it rambles past a natural
  2-3 minute-spoken length.
- Discovery vs. impressing: is the response curious about the other person, or
  performing/showing off? Warmth vs. competence balance — does it read as
  capable AND likable, or competent-but-cold / warm-but-unsubstantial?
- Question depth (Level 1/2/3): does it stay stuck on autopilot small talk
  (fact-based, dead-end), or move toward goals/values (Level 2), and if it goes
  to identity/vulnerability (Level 3), is that appropriate for the stated
  relationship context?
- Narrative framing: if recounting a hardship, is it framed as redemption
  (grit/growth) or contamination (permanent victimhood)?
- Turn-taking and length: would this response run roughly 15-30 seconds
  (45s max) spoken aloud, or does it ramble?
- Exit quality (if the scenario involves ending a conversation): does it use a
  Future Cue + Compliment/Action combo rather than trailing off awkwardly?

Give feedback in exactly this format:
WHAT WORKED: (1-2 specific things, cite the actual words used)
WHAT TO FIX: (be direct and honest, not softened — name the single biggest issue,
  not a laundry list)
ONE NEXT REP: (one concrete, small thing to try differently, following a
  'change one thing at a time' philosophy — not everything at once)

If a 'weekly focus' area is provided, add a fourth line: FOCUS CHECK: (did this
response show improvement on that specific focus area, yes/no/unclear, and why)."

DELIVERABLES
- Working local dev setup (npm run dev) with a README covering how to add the
  Anthropic API key and run it.
- Clean, minimal UI — this is a personal tool, not a product, so prioritize
  function over polish, but make it pleasant to use daily.
```
