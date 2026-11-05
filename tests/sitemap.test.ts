import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";

describe("Dynamic Sitemap", () => {
  it("includes /careers and active published job slugs", async () => {
    const urls = await sitemap();
    const careersUrl = urls.find((u) => u.url.endsWith("/careers"));
    expect(careersUrl).toBeDefined();

    // Check that published/open jobs are present
    const jobDetailUrl = urls.find((u) => u.url.includes("/careers/business-development-partner"));
    expect(jobDetailUrl).toBeDefined();
    expect(jobDetailUrl?.priority).toBe(0.8);
    expect(jobDetailUrl?.changeFrequency).toBe("weekly");
    expect(jobDetailUrl?.lastModified).toBeDefined();
  });

  it("does not include draft or non-existent career URLs", async () => {
    const urls = await sitemap();
    const draftUrl = urls.find((u) => u.url.includes("/careers/draft-job"));
    expect(draftUrl).toBeUndefined();
  });
});
