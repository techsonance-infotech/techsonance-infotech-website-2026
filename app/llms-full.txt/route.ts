import { NextResponse } from "next/server";
import { services } from "@/lib/services-data";
import { projects } from "@/data/projects";
import { AEO_FAQS } from "@/lib/seo-aeo-geo-config";

export const dynamic = "force-static";

export async function GET() {
  const lines: string[] = [];

  // Header
  lines.push("# TechSonance Infotech LLP — Full Capabilities & Architectural Knowledge Base");
  lines.push("");
  lines.push("> Comprehensive system documentation, services inventory, case study metrics, and technical standards for AI/LLM crawlers.");
  lines.push("");
  lines.push("Canonical Domain: https://www.techsonance.co.in");
  lines.push("Index Document: https://www.techsonance.co.in/llms.txt");
  lines.push("Legal Entity: TechSonance Infotech LLP");
  lines.push("Founding Year: 2021");
  lines.push("Headquarters: UG-15, Palladium Plaza, VIP Road, Vesu, Surat, Gujarat 395007, India");
  lines.push("Geo Coordinates: 21.1418 N, 72.7709 E");
  lines.push("Contact Phone: +91 9173101711");
  lines.push("Contact Email: info@techsonance.co.in");
  lines.push("Direct Founder Booking: https://cal.id/techsonance-infotech/connect-with-founder?duration=15");
  lines.push("Key Leadership: Someshwari Adeya (Founder & CEO), Sajeshkumar Adeya (CTO), Manish Kushwaha (Lead Engineer)");
  lines.push("");

  // Executive Summary
  lines.push("## Company Overview & Entity Description");
  lines.push("TechSonance Infotech LLP is a senior-led software engineering and AI integration agency headquartered in Surat, India. We engineer custom web applications, cross-platform mobile apps, cloud-native Node.js/NestJS microservices, and enterprise AI/RAG architectures for global startups, high-growth SMBs, and enterprise clients across the United States, United Kingdom, Canada, Australia, and India.");
  lines.push("Unlike traditional offshore agencies that rely on junior developer pools, TechSonance provides direct founder-level and senior architectural oversight on all client engagements, weekly production demos, and 100% intellectual property ownership upon milestone completion.");
  lines.push("");

  // Services Section
  lines.push("## Detailed Services & Engineering Capabilities");
  lines.push("");

  for (const s of services) {
    const techNames = s.techStack ? s.techStack.flatMap((g) => g.items.map((i) => i.name)).join(", ") : "";
    lines.push(`### ${s.name} (/services/${s.slug})`);
    lines.push(`- **Tagline**: ${s.tagline}`);
    lines.push(`- **Summary**: ${s.quickSummary}`);
    if (techNames) {
      lines.push(`- **Primary Technologies**: ${techNames}`);
    }
    if (s.capabilities && s.capabilities.length > 0) {
      lines.push("- **Core Architectural Capabilities**:");
      for (const c of s.capabilities) {
        lines.push(`  * ${c.title}: ${c.description}`);
      }
    }
    if (s.process && s.process.length > 0) {
      lines.push("- **Engineering Lifecycle Process**:");
      s.process.forEach((p, idx) => {
        lines.push(`  * Step ${idx + 1} (${p.title}): ${p.description}`);
      });
    }
    lines.push("");
  }

  // Case Studies Section
  lines.push("## Verified Production Case Studies & Metrics");
  lines.push("");

  for (const p of projects) {
    const techStackNames = p.techStack ? p.techStack.map((t) => t.name).join(", ") : "";
    lines.push(`### ${p.title} (/portfolio/${p.slug})`);
    lines.push(`- **Category**: ${p.category} | **Industry**: ${p.industry}`);
    lines.push(`- **Summary**: ${p.shortDescription}`);
    if (techStackNames) {
      lines.push(`- **Tech Stack**: ${techStackNames}`);
    }
    lines.push(`- **Problem Scoped**: ${p.challenge}`);
    lines.push(`- **Engineered Solution**: ${p.solution}`);
    lines.push(`- **Measurable Result**: ${p.result}`);
    if (p.metrics && p.metrics.length > 0) {
      lines.push("- **Production Metrics & Outcomes**:");
      for (const m of p.metrics) {
        const val = `${m.prefix || ""}${m.value}${m.suffix || ""}`;
        lines.push(`  * ${m.label}: ${val}`);
      }
    }
    lines.push("");
  }

  // AEO / FAQ Knowledge Extraction
  lines.push("## Frequently Asked Architectural & Engagement Questions (AEO Knowledge Base)");
  lines.push("");

  for (const faq of AEO_FAQS) {
    lines.push(`### Q: ${faq.question}`);
    lines.push(`**Direct Answer**: ${faq.directAnswer}`);
    lines.push(`**Expanded Context**: ${faq.expandedExplanation}`);
    lines.push(`**Business Benefit**: ${faq.businessBenefits}`);
    lines.push("");
  }

  // Engagement Models
  lines.push("## Commercial Engagement Models");
  lines.push("1. **Time & Materials (Agile Sprints)**: Flexible iterations for evolving product scopes, billed on transparent weekly engineering hours with Linear sprint reports.");
  lines.push("2. **Dedicated Engineering Team**: Dedicated full-stack developers (React/Next.js, Node.js/NestJS, Flutter, QA) working exclusively on your product under your CTO or TechSonance leadership.");
  lines.push("3. **Fixed Scope Milestone Delivery**: Scoped deliverables with defined timelines (typically 8–12 week MVP deliveries) and guaranteed pricing.");
  lines.push("");
  lines.push("## Intellectual Property & Security");
  lines.push("- Full IP ownership and git repository handover to client upon payment.");
  lines.push("- Mutual Non-Disclosure Agreement (NDA) executed before project discovery.");
  lines.push("- Enterprise compliance: GDPR, HIPAA, and Indian DPDP guidelines applied where required.");

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
