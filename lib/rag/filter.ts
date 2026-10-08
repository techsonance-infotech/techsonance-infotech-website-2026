import { BOT_CONFIG } from "../config";

export interface FilterResult {
  text: string;
  showBooking: boolean;
}

export function filterOutput(rawText: string): FilterResult {
  let text = rawText;
  let showBooking = false;

  // 1. Detect and parse [[BOOKING]] token
  if (text.includes("[[BOOKING]]")) {
    showBooking = true;
    text = text.replace(/\[\[BOOKING\]\]/g, "").replace(/\s+/g, " ").trim();
  }

  // 2. Strip code fences and inline code blocks
  text = text.replace(/```[\s\S]*?```/g, "").trim();

  // If text became empty or mostly code, replace with refusal template
  if (!text || /function\s*\w*\s*\(|class\s+\w+|import\s+.*from|const\s+\w+\s*=/i.test(text)) {
    return {
      text: BOT_CONFIG.refusalText,
      showBooking: false,
    };
  }

  // 3. Replace any placeholder {{...}} that might have slipped through
  if (text.includes("{{")) {
    text = text.replace(
      /\{\{[^}]*\}\}/g,
      "our team can provide specific details during a consultation"
    );
  }

  // 4. Validate URLs against allowlist
  const allowedDomain = BOT_CONFIG.defaultDomain;
  text = text.replace(/https?:\/\/([^\s/$.?#].[^\s]*)/gi, (match, domainAndPath) => {
    if (domainAndPath.toLowerCase().includes(allowedDomain)) {
      return match;
    }
    return "";
  });

  // 5. Truncate to ~120 words at a clean sentence boundary
  const words = text.split(/\s+/);
  if (words.length > 130) {
    const trimmed = words.slice(0, 120).join(" ");
    const lastPunctuation = Math.max(
      trimmed.lastIndexOf("."),
      trimmed.lastIndexOf("!"),
      trimmed.lastIndexOf("?")
    );
    if (lastPunctuation > 60) {
      text = trimmed.slice(0, lastPunctuation + 1);
    } else {
      text = trimmed + "...";
    }
  }

  return {
    text: text.trim(),
    showBooking,
  };
}
