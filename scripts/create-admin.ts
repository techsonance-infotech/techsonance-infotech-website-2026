import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Environment Loader ───────────────────────────────────────────────────────
function loadEnvironment(): void {
  for (const envFile of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(envPath);
        } else {
          const content = fs.readFileSync(envPath, "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed
                .slice(eqIdx + 1)
                .trim()
                .replace(/^["']|["']$/g, "");
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
  }
}

function getSupabaseAdminClient(): SupabaseClient | null {
  loadEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const KEY_LENGTH = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function promptInput(query: string, hide = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (!hide) {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    } else {
      process.stdout.write(query);
      let input = "";
      const stdin = process.stdin as NodeJS.ReadStream;
      const onData = (char: Buffer) => {
        const s = char.toString();
        if (s === "\n" || s === "\r" || s === "\u0004") {
          stdin.removeListener("data", onData);
          if (stdin.isTTY && typeof stdin.setRawMode === "function") {
            stdin.setRawMode(false);
          }
          process.stdout.write("\n");
          rl.close();
          resolve(input.trim());
        } else if (s === "\u0003") {
          process.exit(1);
        } else if (s === "\b" || s === "\x7f") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          input += s;
          process.stdout.write("*");
        }
      };

      if (stdin.isTTY && typeof stdin.setRawMode === "function") {
        stdin.setRawMode(true);
      }
      stdin.resume();
      stdin.on("data", onData);
    }
  });
}

function parseCliArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = "true";
    } else if (arg.startsWith("--") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      const key = arg.slice(2);
      parsed[key] = args[i + 1];
      i++;
    }
  }
  return parsed;
}

function printHelp(): void {
  console.log(`
TechSonance Infotech - Admin User Injection CLI
================================================
Usage:
  npx tsx scripts/create-admin.ts [options]

Options:
  --email <email>        Admin user email address
  --name <name>          Admin user full name
  --role <role>          Admin role: owner | admin | editor | author | viewer (default: admin)
  --password <password>  Admin password (at least 8 characters)
  --help, -h             Show this help message

Environment Variables (alternative to flags):
  ADMIN_SEED_EMAIL
  ADMIN_SEED_NAME
  ADMIN_SEED_ROLE
  ADMIN_SEED_PASSWORD

If neither flags nor environment variables are supplied, the script will prompt interactively.
`);
}

async function main() {
  const cliArgs = parseCliArgs();
  if (cliArgs.help) {
    printHelp();
    process.exit(0);
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    console.error("❌ Could not connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("   TechSonance Admin User Injection Utility");
  console.log("=======================================================\n");

  const email =
    cliArgs.email ||
    process.env.ADMIN_SEED_EMAIL ||
    (await promptInput("Enter Admin Email: "));
  if (!email || !email.includes("@")) {
    console.error("❌ Invalid email provided.");
    process.exit(1);
  }

  const name =
    cliArgs.name ||
    process.env.ADMIN_SEED_NAME ||
    (await promptInput("Enter Admin Full Name: "));
  if (!name) {
    console.error("❌ Name is required.");
    process.exit(1);
  }

  const role =
    cliArgs.role ||
    process.env.ADMIN_SEED_ROLE ||
    (await promptInput("Enter Admin Role (owner/admin/editor) [default: admin]: ")) ||
    "admin";
  const validRoles = ["owner", "admin", "editor", "author", "viewer"];
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role. Allowed: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  const password =
    cliArgs.password ||
    process.env.ADMIN_SEED_PASSWORD ||
    (await promptInput("Enter Secure Password: ", true));
  if (!password || password.length < 8) {
    console.error("❌ Password must be at least 8 characters long.");
    process.exit(1);
  }

  console.log("\nHashing password using scrypt...");
  const passwordHash = await hashPassword(password);

  console.log(`Checking if user "${email}" already exists...`);
  const { data: existingUser, error: checkError } = await supabase
    .from("ts_admin_users")
    .select("id, email")
    .eq("email", email.toLowerCase())
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.warn("⚠️ Warning checking existing user:", checkError.message);
  }

  if (existingUser) {
    console.log(`User exists (ID: ${existingUser.id}). Updating password and role...`);
    const { error: updateError } = await supabase
      .from("ts_admin_users")
      .update({
        name,
        role,
        password_hash: passwordHash,
        is_active: true,
      })
      .eq("id", existingUser.id);

    if (updateError) {
      console.error("❌ Failed to update user:", updateError.message);
      process.exit(1);
    }

    console.log(`✅ Admin user "${email}" updated successfully with role "${role}".`);
  } else {
    console.log(`Inserting new admin user "${email}"...`);
    const { data: newUser, error: insertError } = await supabase
      .from("ts_admin_users")
      .insert({
        email: email.toLowerCase(),
        name,
        role,
        password_hash: passwordHash,
        is_active: true,
      })
      .select("id, email, role")
      .single();

    if (insertError) {
      console.error("❌ Failed to insert user:", insertError.message);
      process.exit(1);
    }

    console.log(`✅ Admin user "${newUser?.email}" created successfully (ID: ${newUser?.id}, Role: ${newUser?.role}).`);
  }

  console.log("\nDone! You can now log in at /admin/login using these credentials.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
