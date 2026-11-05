import { describe, it, expect } from "vitest";
import { getPostSource } from "@/lib/content/posts";
import { getJobSource } from "@/lib/content/jobs";

describe("Public Content Parity & Safety", () => {
  it("ensures all legacy blog articles are accessible via the post source", async () => {
    const postSource = getPostSource();
    const posts = await postSource.list();
    expect(posts.length).toBeGreaterThanOrEqual(8);

    const slugs = await postSource.slugs();
    expect(slugs).toContain("cms-techsonance-enterprise-multi-tenant-architecture");
  });

  it("ensures post source retrieves individual post with full content", async () => {
    const postSource = getPostSource();
    const post = await postSource.get("cms-techsonance-enterprise-multi-tenant-architecture");
    expect(post).toBeDefined();
    expect(post?.title).toBeDefined();
    expect(post?.content).toBeDefined();
    expect(post?.content.length).toBeGreaterThan(0);
  });

  it("ensures job source returns open positions with correct attributes", async () => {
    const jobSource = getJobSource();
    const jobs = await jobSource.list();
    expect(jobs.length).toBeGreaterThan(0);
    const active = jobs.find((j) => j.status === "OPEN" || !j.status);
    expect(active).toBeDefined();
    expect(active?.title).toBeDefined();
    expect(active?.department).toBeDefined();
  });

  it("ensures job source retrieves individual job details by slug", async () => {
    const jobSource = getJobSource();
    const job = await jobSource.get("business-development-partner");
    expect(job).toBeDefined();
    expect(job?.title).toBe("Business Development Partner");
    expect(job?.type).toBe("Commission / Project-Based");
  });
});
