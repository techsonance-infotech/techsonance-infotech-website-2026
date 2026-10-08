// ─── Query Synonyms & Vocabulary Expansion ───────────────────────────────────

export const SYNONYM_MAP: Record<string, string[]> = {
  // Pricing / Cost / Budget
  cost: ["price", "pricing", "budget", "quote", "rates", "charges", "estimate", "fee", "kharcha", "kitna"],
  price: ["cost", "pricing", "budget", "quote", "rates", "charges", "estimate", "fee", "kharcha", "kitna"],
  pricing: ["cost", "price", "budget", "quote", "rates", "charges", "estimate", "fee"],
  budget: ["cost", "price", "pricing", "quote", "estimate", "rates", "affordable", "cheap"],
  quote: ["estimate", "cost", "pricing", "proposal", "rates"],
  charges: ["cost", "price", "rates", "fees"],
  rate: ["hourly", "monthly", "cost", "price", "charges"],

  // Timeline / Duration
  time: ["timeline", "duration", "how long", "weeks", "months", "days", "turnaround", "delivery", "kitna time"],
  timeline: ["duration", "time", "how long", "schedule", "deadline", "turnaround", "completion"],
  duration: ["timeline", "time", "how long", "weeks", "months"],

  // Team & People
  team: ["developers", "engineers", "people", "staff", "programmers", "lead", "founder", "members"],
  developer: ["engineer", "coder", "programmer", "specialist", "staff"],
  developers: ["engineers", "team", "programmers", "coders", "staff"],
  hire: ["engage", "contract", "staff augmentation", "dedicated team", "developer hiring"],

  // Services & Creation
  build: ["develop", "create", "make", "engineer", "construct", "banwana"],
  create: ["build", "develop", "make", "engineer"],
  develop: ["build", "create", "make", "engineer", "program"],
  app: ["mobile app", "application", "ios", "android", "flutter"],
  website: ["web app", "web portal", "site", "web development", "nextjs"],
  saas: ["software as a service", "subscription platform", "multi tenant"],
  ecommerce: ["online store", "shop", "marketplace", "cart", "checkout"],
  ai: ["chatbot", "rag", "llm", "automation", "agent", "gpt", "gemini", "claude"],
  chatbot: ["rag bot", "ai assistant", "virtual assistant", "support bot"],

  // Booking / Meeting
  book: ["schedule", "meeting", "call", "consultation", "appointment", "demo", "talk"],
  meeting: ["call", "consultation", "discussion", "appointment", "demo"],
  consultation: ["call", "meeting", "discussion", "discovery call"],

  // Hinglish expressions
  kitna: ["how much", "cost", "price", "time", "duration"],
  kharcha: ["cost", "budget", "price"],
  banwana: ["build", "develop", "create"],
};

export function expandQuerySynonyms(query: string): string {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const expansions = new Set<string>(words);

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/g, "");
    if (SYNONYM_MAP[cleanWord]) {
      for (const syn of SYNONYM_MAP[cleanWord]) {
        expansions.add(syn);
      }
    }
  }

  return Array.from(expansions).join(" ");
}
