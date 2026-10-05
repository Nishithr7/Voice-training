// Scenario categories and example prompts. Each category also carries a short "lens" hint
// shown in the UI so the user knows what the coach will weigh most for that kind of rep.

export const CATEGORIES = [
  {
    id: "Small Talk / Networking",
    short: "Networking",
    lens: "Level 1 → 2 questions, discovery over impressing, 15–30s turns, graceful exit.",
    prompts: [
      "You just met someone at a conference coffee table — open the conversation.",
      "Someone asks \"So, what do you do?\" — answer in a way that opens a doorway, not a stop sign.",
      "You've been chatting for ten minutes and need to leave — exit gracefully.",
    ],
  },
  {
    id: "Job Interview",
    short: "Interview",
    lens: "Tight redemption-framed stories, archetype shifts, clear link back to the role.",
    prompts: [
      "\"Tell me about yourself\" — the opening two minutes.",
      "\"Tell me about a time you failed and what you learned.\"",
      "\"Why do you want this role?\"",
    ],
  },
  {
    id: "Work Presentation",
    short: "Presentation",
    lens: "Open in Friend, structure (Why → What → How), point held to the end, big as the room.",
    prompts: [
      "Open a 20-minute project update to leadership — the first 90 seconds.",
      "Explain a delay to stakeholders and what you're doing about it.",
      "Close the presentation with a clear ask and a memorable last line.",
    ],
  },
  {
    id: "Difficult Conversation",
    short: "Difficult",
    lens: "Archetype intensity control, assertive curiosity over lecturing, warmth + competence.",
    prompts: [
      "Tell a teammate their work on the last deliverable wasn't good enough.",
      "Push back on your manager's unrealistic deadline without sounding defensive.",
      "Say no to a friend who keeps asking for favors.",
    ],
  },
  {
    id: "Phone Call",
    short: "Phone",
    lens: "Clear ask, turn-taking, energy you can hear (stand, smile, move).",
    prompts: [
      "Cold-call a potential client — the first 30 seconds.",
      "Call a customer to apologise for a mistake and offer a fix.",
      "Leave a voicemail asking someone to call you back about an opportunity.",
    ],
  },
  {
    id: "Storytelling / Keynote",
    short: "Story",
    lens: "Incident → Point → Linking, VAKS detail, dialogue, 2–3 minutes max, no rambling.",
    prompts: [
      "Tell a 2-minute personal story that links to the idea 'ask for help'.",
      "Open a keynote with a story that addresses the elephant in the room.",
      "Tell your origin story — how you got into what you do — in under 3 minutes.",
    ],
  },
];

export const CUSTOM_CATEGORY = "Custom";

export const ALL_CATEGORY_IDS = [...CATEGORIES.map((c) => c.id), CUSTOM_CATEGORY];
