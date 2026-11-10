import readline from "node:readline";
import crypto from "node:crypto";
import { loadEnvironment, getScriptSupabaseClient } from "./seed-cms-content";

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
      const onData = (char: Buffer) => {
        const s = char.toString();
        if (s === "\n" || s === "\r" || s === "\u0004") {
          process.stdin.removeListener("data", onData);
          if (process.stdin.isTTY) (process.stdin as any).setRawMode(false);
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

      if (process.stdin.isTTY) {
        (process.stdin as any).setRawMode(true);
      }
      process.stdin.resume();
      process.stdin.on("data", onData);
    }
  });
}

async function main() {
  loadEnvironment();
  const supabase = getScriptSupabaseClient();

  if (!supabase) {
    console.error("❌ Could not connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("   TechSonance Admin User Injection Utility");
  console.log("=======================================================\n");

  // Read arguments from command-line flags or environment variables or interactive prompt
  const envEmail = process.env.ADMIN_SEED_EMAIL;
  const envName = process.env.ADMIN_SEED_NAME;
  const envRole = process.env.ADMIN_SEED_ROLE;
  const envPassword = process.env.ADMIN_SEED_PASSWORD;

  const email = envEmail || (await promptInput("Enter Admin Email: "));
  if (!email || !email.includes("@")) {
    console.error("❌ Invalid email provided.");
    process.exit(1);
  }

  const name = envName || (await promptInput("Enter Admin Full Name: "));
  if (!name) {
    console.error("❌ Name is required.");
    process.exit(1);
  }

  const role = envRole || (await promptInput("Enter Admin Role (owner/admin/editor) [default: admin]: ")) || "admin";
  const validRoles = ["owner", "admin", "editor", "author", "viewer"];
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role. Allowed: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  const password = envPassword || (await promptInput("Enter Secure Password: ", true));
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
