import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { BOT_CONFIG } from "../lib/config";

// Simple env loader without external dependency
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// Load .env.local first, then .env
loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

function maskKey(key: string | undefined): string {
  if (!key) return "(missing)";
  if (key.length <= 6) return "******";
  return `...${key.slice(-4)}`;
}

interface ProviderCheckResult {
  id: string;
  name: string;
  keyStatus: string;
  model: string;
  status: "OK" | "FAIL" | "RATE_LIMITED" | "BAD_KEY" | "DISABLED";
  latencyMs?: number;
  message?: string;
}

async function checkOpenAICompatible(
  name: string,
  baseUrl: string,
  apiKey: string,
  model: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: "OK" | "FAIL" | "RATE_LIMITED" | "BAD_KEY"; latencyMs: number; message?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (res.status === 200) {
      return { status: "OK", latencyMs: latency };
    }
    if (res.status === 429) {
      return { status: "RATE_LIMITED", latencyMs: latency, message: "Rate limit reached" };
    }
    if (res.status === 401 || res.status === 403) {
      return { status: "BAD_KEY", latencyMs: latency, message: `HTTP ${res.status} Auth Error` };
    }
    const bodyText = await res.text().catch(() => "");
    return { status: "FAIL", latencyMs: latency, message: `HTTP ${res.status}: ${bodyText.slice(0, 80)}` };
  } catch (err: unknown) {
    const latency = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "FAIL", latencyMs: latency, message: msg };
  }
}

async function run() {
  console.log("\n=======================================================");
  console.log(" 🔍 TechSonance Chatbot Environment & Health Check");
  console.log("=======================================================\n");

  const results: ProviderCheckResult[] = [];
  const providers = BOT_CONFIG.providers;

  // 1. Check Groq
  const groqKey = process.env[providers.groq.apiKeyEnv];
  if (groqKey) {
    const check = await checkOpenAICompatible(
      providers.groq.name,
      providers.groq.baseUrl,
      groqKey,
      providers.groq.model
    );
    results.push({
      id: "groq",
      name: providers.groq.name,
      keyStatus: maskKey(groqKey),
      model: providers.groq.model,
      ...check,
    });
  } else {
    results.push({
      id: "groq",
      name: providers.groq.name,
      keyStatus: "(missing)",
      model: providers.groq.model,
      status: "DISABLED",
    });
  }

  // 2. Check Gemini
  const geminiKey = process.env[providers.gemini.apiKeyEnv];
  if (geminiKey) {
    const check = await checkOpenAICompatible(
      providers.gemini.name,
      providers.gemini.baseUrl,
      geminiKey,
      providers.gemini.model
    );
    results.push({
      id: "gemini",
      name: providers.gemini.name,
      keyStatus: maskKey(geminiKey),
      model: providers.gemini.model,
      ...check,
    });
  } else {
    results.push({
      id: "gemini",
      name: providers.gemini.name,
      keyStatus: "(missing)",
      model: providers.gemini.model,
      status: "DISABLED",
    });
  }

  // 3. Check Cerebras
  const cerebrasKey = process.env[providers.cerebras.apiKeyEnv];
  if (cerebrasKey) {
    const check = await checkOpenAICompatible(
      providers.cerebras.name,
      providers.cerebras.baseUrl,
      cerebrasKey,
      providers.cerebras.model
    );
    results.push({
      id: "cerebras",
      name: providers.cerebras.name,
      keyStatus: maskKey(cerebrasKey),
      model: providers.cerebras.model,
      ...check,
    });
  } else {
    results.push({
      id: "cerebras",
      name: providers.cerebras.name,
      keyStatus: "(missing)",
      model: providers.cerebras.model,
      status: "DISABLED",
    });
  }

  // 4. Check OpenRouter
  const openrouterKey = process.env[providers.openrouter.apiKeyEnv];
  if (openrouterKey) {
    const check = await checkOpenAICompatible(
      providers.openrouter.name,
      providers.openrouter.baseUrl,
      openrouterKey,
      providers.openrouter.model,
      {
        "HTTP-Referer": "https://techsonance.co.in",
        "X-Title": "TechSonance Website Assistant",
      }
    );
    results.push({
      id: "openrouter",
      name: providers.openrouter.name,
      keyStatus: maskKey(openrouterKey),
      model: providers.openrouter.model,
      ...check,
    });
  } else {
    results.push({
      id: "openrouter",
      name: providers.openrouter.name,
      keyStatus: "(missing)",
      model: providers.openrouter.model,
      status: "DISABLED",
    });
  }

  // 5. Check Mistral
  const mistralKey = process.env[providers.mistral.apiKeyEnv];
  if (mistralKey) {
    const check = await checkOpenAICompatible(
      providers.mistral.name,
      providers.mistral.baseUrl,
      mistralKey,
      providers.mistral.model
    );
    results.push({
      id: "mistral",
      name: providers.mistral.name,
      keyStatus: maskKey(mistralKey),
      model: providers.mistral.model,
      ...check,
    });
  } else {
    results.push({
      id: "mistral",
      name: providers.mistral.name,
      keyStatus: "(missing)",
      model: providers.mistral.model,
      status: "DISABLED",
    });
  }

  // Print LLM Providers Table
  console.log("📋 LLM Providers Status:");
  console.log("--------------------------------------------------------------------------------");
  console.log(
    ` ${"Provider".padEnd(16)} | ${"Key".padEnd(10)} | ${"Status".padEnd(14)} | ${"Latency".padEnd(10)} | Model`
  );
  console.log("--------------------------------------------------------------------------------");
  for (const r of results) {
    const statusStr =
      r.status === "OK"
        ? "✅ OK"
        : r.status === "RATE_LIMITED"
        ? "⏳ RATE_LIMIT"
        : r.status === "BAD_KEY"
        ? "❌ BAD_KEY"
        : r.status === "DISABLED"
        ? "⚪ DISABLED"
        : "⚠️ FAIL";
    const latencyStr = r.latencyMs !== undefined ? `${r.latencyMs}ms` : "-";
    console.log(
      ` ${r.name.padEnd(16)} | ${r.keyStatus.padEnd(10)} | ${statusStr.padEnd(14)} | ${latencyStr.padEnd(10)} | ${r.model}`
    );
    if (r.message && r.status !== "OK") {
      console.log(`   └─ ℹ️ ${r.message}`);
    }
  }
  console.log("--------------------------------------------------------------------------------\n");

  // Check Email Configuration
  console.log("📧 Email Delivery Status:");
  const adminEmail = process.env.ADMIN_EMAIL;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    console.log(`   • Resend API Key: ${maskKey(resendKey)} (Configured)`);
  } else if (smtpUser && smtpPass) {
    console.log(`   • SMTP Host: ${process.env.SMTP_HOST ?? "smtp.gmail.com"}:${process.env.SMTP_PORT ?? 465}`);
    console.log(`   • SMTP User: ${smtpUser}`);
    console.log(`   • Admin Email: ${adminEmail ?? "(missing)"}`);

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.verify();
      console.log("   • SMTP Connection: ✅ Authenticated successfully!");

      if (process.argv.includes("--send-test")) {
        if (!adminEmail) {
          console.log("   ❌ Cannot send test email: ADMIN_EMAIL is not set.");
        } else {
          console.log(`   • Sending test consultation email to ${adminEmail}...`);
          await transporter.sendMail({
            from: process.env.FROM_EMAIL || `"TechSonance Bot" <${smtpUser}>`,
            to: adminEmail,
            subject: "Test Consultation Request from TechSonance Bot",
            text: "This is a test email confirming your chatbot email delivery is working correctly.",
          });
          console.log("   • Test email sent: ✅ Check your inbox!");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`   • SMTP Connection: ❌ Failed (${msg})`);
    }
  } else {
    console.log("   • SMTP/Resend: ⚪ Not configured in .env.local (Fallback to simulated mode in dev)");
  }

  // Check Upstash Redis
  console.log("\n🗄️ Shared Cache & Redis Status:");
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    console.log(`   • Upstash Redis URL: ${redisUrl}`);
    try {
      const pingRes = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      if (pingRes.ok) {
        console.log("   • Redis Connection: ✅ Ping successful!");
      } else {
        console.log(`   • Redis Connection: ❌ Error HTTP ${pingRes.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`   • Redis Connection: ❌ Failed (${msg})`);
    }
  } else {
    console.log("   • Upstash Redis: ⚪ Not set (using in-memory health state & token bucket)");
  }

  console.log("\n💡 Summary:");
  const activeCount = results.filter((r) => r.status === "OK").length;
  if (activeCount >= 2) {
    console.log(`   ✅ ${activeCount} LLM providers active and healthy! Ready for production RAG.`);
  } else if (activeCount === 1) {
    console.log(`   ⚠️ 1 LLM provider active. Recommended to configure at least 2 for automatic failover.`);
  } else {
    console.log(`   ℹ️ 0 LLM providers configured with working keys. Bot will operate in Direct FAQ mode.`);
  }
  console.log("\n=======================================================\n");
}

run().catch((err) => {
  console.error("Health check error:", err);
  process.exit(1);
});
