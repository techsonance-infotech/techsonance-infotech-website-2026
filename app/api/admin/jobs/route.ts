import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { AdminJobsService } from "@/lib/services/admin-jobs.service";
import { AdminAuthService } from "@/lib/services/admin-auth.service";

const createJobSchema = z.object({
  siteId: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  department: z.string().min(2),
  location: z.string().min(2),
  type: z.enum(["Full Time", "Internship", "Contract", "Partner"]).default("Full Time"),
  experienceLevel: z.string().optional().default("Mid-Senior"),
  description: z.string().min(10),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "ARCHIVED"]).default("DRAFT"),
});

export async function GET(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const siteId = searchParams.get("siteId") || session.site?.id || undefined;
    const limit = Number(searchParams.get("limit")) || 20;
    const offset = Number(searchParams.get("offset")) || 0;

    const jobsService = container.get(AdminJobsService);
    const result = await jobsService.listJobs({
      status,
      search,
      siteId,
      limit,
      offset,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("List jobs error:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const container = getContainer();
    const authService = container.get(AdminAuthService);
    const session = await authService.getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = createJobSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const siteId = parseResult.data.siteId || session.site?.id;
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    const jobsService = container.get(AdminJobsService);
    const job = await jobsService.createJob(
      {
        ...parseResult.data,
        siteId,
      },
      session.userId,
    );

    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
