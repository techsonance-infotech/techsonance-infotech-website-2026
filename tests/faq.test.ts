import { describe, it, expect } from "vitest";
import { matchFAQ } from "../lib/rag/faq";
import { filterOutput } from "../lib/rag/filter";
import { BOT_CONFIG } from "../lib/config";

describe("FAQ Direct Matching Tests", () => {
  it("should match exact questions directly without LLM", () => {
    const result = matchFAQ("Who are you and what does TechSonance do?");
    expect(result).not.toBeNull();
    expect(result?.isDirect).toBe(true);
    expect(result?.faq.id).toBe("company-overview");
  });

  it("should match alias queries directly", () => {
    const result = matchFAQ("how much does a website cost");
    expect(result).not.toBeNull();
    expect(result?.faq.id).toBe("pricing-general");
  });

  it("should match Hinglish aliases (kharcha kitna hoga)", () => {
    const result = matchFAQ("kharcha kitna hoga");
    expect(result).not.toBeNull();
    expect(result?.faq.id).toBe("pricing-general");
  });

  it("should match portfolio queries", () => {
    const result = matchFAQ("show me your past work and case studies");
    expect(result).not.toBeNull();
    expect(result?.faq.id).toBe("company-portfolio");
  });
});

describe("Output Filter Tests", () => {
  it("should extract [[BOOKING]] token and set showBooking = true", () => {
    const raw = "I can help with that. [[BOOKING]] Would you like to schedule a call?";
    const filtered = filterOutput(raw);
    expect(filtered.showBooking).toBe(true);
    expect(filtered.text).not.toContain("[[BOOKING]]");
    expect(filtered.text).toBe("I can help with that. Would you like to schedule a call?");
  });

  it("should strip code fences and replace code-heavy answers with refusal", () => {
    const rawCode = "```javascript\nfunction test() { return true; }\n```";
    const filtered = filterOutput(rawCode);
    expect(filtered.text).toBe(BOT_CONFIG.refusalText);
    expect(filtered.showBooking).toBe(false);
  });

  it("should replace unresolved {{...}} placeholders with fallback text", () => {
    const raw = "We have {{5+}} years of experience.";
    const filtered = filterOutput(raw);
    expect(filtered.text).not.toContain("{{");
    expect(filtered.text).toContain("our team can provide specific details during a consultation");
  });

  it("should filter unauthorized external URLs while keeping techsonance domain", () => {
    const raw = "Visit https://malicious-site.com or check https://techsonance.co.in/portfolio";
    const filtered = filterOutput(raw);
    expect(filtered.text).not.toContain("https://malicious-site.com");
    expect(filtered.text).toContain("https://techsonance.co.in/portfolio");
  });
});
