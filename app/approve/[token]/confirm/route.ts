import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContainer } from "@/lib/di/container";
import { ApprovalService, type ApprovalDecision } from "@/lib/services/approval.service";

const confirmSchema = z.object({
  decision: z.enum(["approve", "reject", "improve"]),
  feedback: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
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

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err) {
    console.error("Approval confirmation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Confirmation failed" },
      { status: 400 },
    );
  }
}
