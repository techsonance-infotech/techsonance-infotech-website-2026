import { matchFAQ, type FAQMatchResult } from "./faq";
import { retrieve, type RetrievedChunk } from "./search";
import { BOT_CONFIG } from "../config";

export type GateDecision =
  | "BLOCKED"
  | "BOOKING"
  | "GREETING"
  | "SMALLTALK"
  | "FAQ_DIRECT"
  | "IN_SCOPE"
  | "OUT_OF_SCOPE";

export interface GateResult {
  decision: GateDecision;
  reason?: string;
  cannedReply?: string;
  faqMatch?: FAQMatchResult;
  chunks?: RetrievedChunk[];
  showBooking?: boolean;
}

// 1. Blocked Patterns (Code writing, prompt injections, debugging, homework, offensive)
const BLOCKED_PATTERNS = [
  /```/, // Fenced code blocks
  /\b(write|create|generate|give me|code|implement)\s+(a\s+)?(python|javascript|typescript|java|c\+\+|rust|golang|php|sql|html|css|c#)?\s*(function|script|code|class|program|algo|algorithm|query|regex|method|routine)\b/i,
  /\b(fix|debug|solve)\s+(this|my)?\s*(bug|error|issue|code|script|traceback|syntax)\b/i,
  /\bleetcode\b/i,
  /\bregex for\b/i,
  /\bsql query to\b/i,
  /\b(ignore|disregard|forget)\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules|prompt)\b/i,
  /\b(system\s*prompt|reveal\s*prompt|show\s*me\s*your\s*prompt|system\s*message|developer\s*mode|jailbreak|dan\s*mode|unrestricted chatbot)\b/i,
  /\b(act\s+as|you\s+are\s+now|pretend\s+to\s+be)\s+(a\s+)?(chatgpt|dan|unrestricted|linux\s+terminal|hacker|bot)/i,
  /\b(write\s+(an?\s+)?(essay|poem|song|story|letter|article)|translate\s+this|who\s+won\s+the\s+cricket|capital\s+of\s+[a-z]+|weather\s+in|stock\s+tips|medical\s+advice|legal\s+advice)\b/i,
  /\b(stocks\s+should\s+i\s+buy|who\s+is\s+better|tell\s+me\s+a\s+joke|how\s+do\s+i\s+cook|nuclear\s+fission|population\s+of|distance\s+between|president\s+of|political\s+opinion|news\s+today|math\s+homework|solve\s+\d+)/i,
];

// 2. Booking Intent Patterns
const BOOKING_PATTERNS = [
  /\b(book|schedule|reserve|set\s+up)\s+(a\s+)?(call|meeting|consultation|appointment|demo|slot|discussion)\b/i,
  /\b(talk\s+to|speak\s+with|meet\s+with)\s+(a\s+)?(human|team|founder|developer|someone|representative)\b/i,
  /\b(book\s+free\s+consultation|schedule\s+meeting|schedule\s+call)\b/i,
  /^(book|call|schedule|meeting|consultation|appointment|demo)$/i,
];

// 3. Greeting Patterns
const GREETING_PATTERNS = [
  /^(hi|hello|hey|hola|namaste|greetings|good\s+(morning|afternoon|evening|day))[\s!.]*$/i,
  /^(hey\s+there|hi\s+there|hello\s+there)[\s!.]*$/i,
];

// 4. Smalltalk Patterns
const SMALLTALK_PATTERNS = [
  /^(who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|tell\s+me\s+about\s+yourself)[\s?!.]*$/i,
  /^(thanks|thank\s+you|thx|cheers|awesome|great|cool|ok|okay|got\s+it)(\s+.*)?[\s!.]*$/i,
  /^(bye|goodbye|see\s+you|talk\s+later)(\s+.*)?[\s!.]*$/i,
];

// 5. Explicit Agency Domain Keywords (Required for IN_SCOPE qualification)
const AGENCY_KEYWORDS = [
  "techsonance",
  "agency",
  "software",
  "app",
  "apps",
  "website",
  "web",
  "mobile",
  "flutter",
  "react",
  "nextjs",
  "nodejs",
  "saas",
  "ecommerce",
  "e-commerce",
  "marketplace",
  "pos",
  "crm",
  "erp",
  "ai",
  "chatbot",
  "chatbots",
  "rag",
  "automation",
  "service",
  "services",
  "cost",
  "price",
  "pricing",
  "budget",
  "rate",
  "rates",
  "quote",
  "timeline",
  "time",
  "weeks",
  "months",
  "duration",
  "team",
  "developer",
  "developers",
  "engineers",
  "seniority",
  "portfolio",
  "case study",
  "case studies",
  "project",
  "projects",
  "build",
  "develop",
  "hire",
  "hiring",
  "process",
  "estimate",
  "consultation",
  "contract",
  "contracts",
  "nda",
  "warranty",
  "maintenance",
  "support",
  "surat",
  "india",
  "zion",
  "freightflow",
  "syncserve",
  "utsav",
  "masterweg",
  "accunest",
  "kharcha",
  "kitna",
  "banwana",
  "mvp",
  "codebase",
  "databases",
  "postgres",
  "mongo",
  "redis",
  "aws",
  "docker",
  "ownership",
  "security",
  "encryption",
  "offline",
  "payment",
  "payments",
  "gateway",
  "gateways",
  "stripe",
  "razorpay",
  "paypal",
  "milestone",
  "milestones",
  "schedule",
  "integrate",
  "integration",
  "integrations",
  "terms",
];

export function evaluateGate(message: string): GateResult {
  const cleanMsg = message.trim();
  const lowerMsg = cleanMsg.toLowerCase();

  // Step 1: BLOCKED checks
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(cleanMsg)) {
      return {
        decision: "BLOCKED",
        reason: "Matched blocked / prompt injection / code generation pattern",
        cannedReply: BOT_CONFIG.refusalText,
        showBooking: false,
      };
    }
  }

  // Step 2: BOOKING intent
  for (const pattern of BOOKING_PATTERNS) {
    if (pattern.test(cleanMsg)) {
      return {
        decision: "BOOKING",
        reason: "Detected consultation booking intent",
        cannedReply:
          "I'd be glad to set up a free 30-minute consultation with our engineering team. Please pick a date and time slot below:",
        showBooking: true,
      };
    }
  }

  // Step 3: GREETING
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(cleanMsg)) {
      return {
        decision: "GREETING",
        cannedReply: `Hello! I'm Sonance AI, your guide at TechSonance Infotech. How can I assist with your software project or engineering needs today?`,
        showBooking: false,
      };
    }
  }

  // Step 4: SMALLTALK
  for (const pattern of SMALLTALK_PATTERNS) {
    if (pattern.test(cleanMsg)) {
      if (/who\s+are\s+you|what\s+is\s+your\s+name/i.test(cleanMsg)) {
        return {
          decision: "SMALLTALK",
          cannedReply: `I'm Sonance AI, the assistant for TechSonance Infotech LLP. I can answer questions about our services, tech stack, team, project estimates, or schedule a consultation with our engineers!`,
          showBooking: false,
        };
      }
      if (/thanks|thank\s+you|thx|cheers|awesome|great/i.test(cleanMsg)) {
        return {
          decision: "SMALLTALK",
          cannedReply: `You're welcome! Let me know if you have any other questions about TechSonance or would like to schedule a free project consultation.`,
          showBooking: false,
        };
      }
      if (/bye|goodbye/i.test(cleanMsg)) {
        return {
          decision: "SMALLTALK",
          cannedReply: `Goodbye! Feel free to reach out anytime or book a call when you're ready to start your project. Have a wonderful day!`,
          showBooking: false,
        };
      }
      return {
        decision: "SMALLTALK",
        cannedReply: `I'm here to help with all questions about TechSonance and your software development needs.`,
        showBooking: false,
      };
    }
  }

  // Step 5: Direct FAQ Matching
  const faqMatch = matchFAQ(cleanMsg);
  if (faqMatch && faqMatch.isDirect) {
    return {
      decision: "FAQ_DIRECT",
      faqMatch,
      cannedReply: faqMatch.faq.a,
      showBooking: false,
    };
  }

  // Step 6: Retrieval & Domain Keyword Evaluation
  const hasKeyword = AGENCY_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(lowerMsg);
  });

  if (hasKeyword) {
    const chunks = retrieve(cleanMsg, 3);
    if (chunks.length > 0) {
      return {
        decision: "IN_SCOPE",
        chunks,
        showBooking: false,
      };
    }
  }

  // Step 7: OUT OF SCOPE
  return {
    decision: "OUT_OF_SCOPE",
    reason: "Off-topic query not relevant to TechSonance services",
    cannedReply: BOT_CONFIG.refusalText,
    showBooking: false,
  };
}
