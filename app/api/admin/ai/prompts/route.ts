import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/di/container";
import { AdminAuthService } from "@/lib/services/admin-auth.service";
import { AdminPromptsService } from "@/lib/services/admin-prompts.service";

export async function GET() {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const promptsService = container.get(AdminPromptsService);
  const templates = await promptsService.listTemplates();

  return NextResponse.json({ templates });
}

export async function PUT(req: NextRequest) {
  const container = getContainer();
  const auth = container.get(AdminAuthService);
  const session = await auth.getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { stepName, systemPrompt, userPromptTemplate, modelPreference, temperature } = body;

    if (!stepName || !systemPrompt || !userPromptTemplate) {
      return NextResponse.json(
        { error: "stepName, systemPrompt, and userPromptTemplate are required" },
        { status: 400 }
      );
    }

    const promptsService = container.get(AdminPromptsService);
    const updated = await promptsService.updateTemplate(stepName, {
      systemPrompt,
      userPromptTemplate,
      modelPreference,
      temperature: Number(temperature),
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save template" },
      { status: 500 }
    );
  }
}
