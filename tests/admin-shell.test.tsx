import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { AdminShell } from "@/components/admin/AdminShell";

// Mock next/navigation
let currentPathname = "/admin/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock logout API
vi.mock("@/lib/api/admin-governance.api", () => ({
  logoutAdmin: vi.fn().mockResolvedValue({ success: true }),
}));

function getAnchorByHref(html: string, href: string): { classes: string } {
  // Find <a ... href="exactHref" ... >
  const regex = new RegExp(`<a\\s+[^>]*href="${href}"[^>]*>`, "i");
  const match = html.match(regex);
  if (!match) return { classes: "" };
  const tag = match[0];
  const classMatch = tag.match(/class="([^"]*)"/i);
  return { classes: classMatch ? classMatch[1] : "" };
}

describe("AdminShell Component — Collapsible Sidebar & Navigation Active State", () => {
  beforeEach(() => {
    currentPathname = "/admin/dashboard";
  });

  it("renders correctly on dashboard route", () => {
    const html = renderToString(
      <AdminShell userEmail="admin@techsonance.co.in" userRole="owner">
        <div>Dashboard Content</div>
      </AdminShell>,
    );

    expect(html).toContain("Dashboard Content");
    expect(html).toContain("TechSonance");
    expect(html).toContain("Overview");
    expect(html).toContain("Blog Articles");
    expect(html).toContain("Collapse sidebar");
  });

  it("fixes dual-highlighting bug: /admin/blog/topics highlights Topic Backlog and NOT Blog Articles", () => {
    currentPathname = "/admin/blog/topics";

    const html = renderToString(
      <AdminShell>
        <div>Topics Page</div>
      </AdminShell>,
    );

    const blogLink = getAnchorByHref(html, "/admin/blog");
    const topicsLink = getAnchorByHref(html, "/admin/blog/topics");

    // Blog Articles should NOT have active styling
    expect(blogLink.classes).not.toContain("bg-[#1155CC]");
    expect(blogLink.classes).toContain("text-slate-600");

    // Topic Backlog must have active class
    expect(topicsLink.classes).toContain("bg-[#1155CC]");
  });

  it("highlights Blog Articles for article subroutes like /admin/blog/post-123", () => {
    currentPathname = "/admin/blog/post-123";

    const html = renderToString(
      <AdminShell>
        <div>Edit Article</div>
      </AdminShell>,
    );

    const blogLink = getAnchorByHref(html, "/admin/blog");
    const topicsLink = getAnchorByHref(html, "/admin/blog/topics");

    expect(blogLink.classes).toContain("bg-[#1155CC]");
    expect(topicsLink.classes).not.toContain("bg-[#1155CC]");
  });

  it("highlights Blog Articles for /admin/blog/new", () => {
    currentPathname = "/admin/blog/new";

    const html = renderToString(
      <AdminShell>
        <div>New Article</div>
      </AdminShell>,
    );

    const blogLink = getAnchorByHref(html, "/admin/blog");
    expect(blogLink.classes).toContain("bg-[#1155CC]");
  });

  it("highlights Prompt Studio exclusively on /admin/blog/prompts", () => {
    currentPathname = "/admin/blog/prompts";

    const html = renderToString(
      <AdminShell>
        <div>Prompt Studio</div>
      </AdminShell>,
    );

    const blogLink = getAnchorByHref(html, "/admin/blog");
    const promptsLink = getAnchorByHref(html, "/admin/blog/prompts");

    expect(blogLink.classes).not.toContain("bg-[#1155CC]");
    expect(promptsLink.classes).toContain("bg-[#1155CC]");
  });

  it("highlights Careers & Jobs on /admin/careers/jobs", () => {
    currentPathname = "/admin/careers/jobs";

    const html = renderToString(
      <AdminShell>
        <div>Careers Page</div>
      </AdminShell>,
    );

    const careersLink = getAnchorByHref(html, "/admin/careers/jobs");
    expect(careersLink.classes).toContain("bg-[#1155CC]");
  });
});
