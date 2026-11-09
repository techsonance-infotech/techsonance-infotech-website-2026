import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { ApprovalService, type ApprovalDecision } from "@/lib/services/approval.service";
import { logger } from "@/lib/logger";

const confirmSchema = z.object({
  decision: z.enum(["approve", "reject", "improve"]),
  feedback: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Missing approval token" }, { status: 400 });
    }

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = confirmSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid decision request", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { decision, feedback } = parseResult.data;

    const container = getContainer();
    const approvalService = container.get(ApprovalService);

    const result = await approvalService.decide(
      token,
      decision as ApprovalDecision,
      feedback,
      "email_approver",
    );

    logger.info("Editorial decision successfully recorded", {
      decision,
      postId: result.postId,
      newStatus: result.newStatus,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err) {
    logger.error("Approval confirmation error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirmation failed" },
      { status: 400 },
    );
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const url = new URL(req.url);
  const decisionParam = url.searchParams.get("decision") || url.searchParams.get("action");

  if (!decisionParam || !["approve", "reject", "improve"].includes(decisionParam)) {
    return NextResponse.json({ error: "Invalid decision parameter" }, { status: 400 });
  }

  try {
    const { token } = await params;
    const container = getContainer();
    const approvalService = container.get(ApprovalService);

    const result = await approvalService.decide(
      token,
      decisionParam as ApprovalDecision,
      undefined,
      "email_approver_direct",
    );

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirmation failed" },
      { status: 400 },
    );
  }
}
