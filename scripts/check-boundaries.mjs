import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let errorsCount = 0;

function report(file, message) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  console.error(`❌ [Boundary Violation] ${rel}: ${message}`);
  errorsCount++;
}

function getAllFiles(dir, exts = [".ts", ".tsx", ".js", ".mjs"]) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === ".codegraph" ||
        entry.name === "dist" ||
        entry.name === "drizzle"
      ) {
        continue;
      }
      files.push(...getAllFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

// 1. Check relative depth imports (no ../../)
const appAndLibFiles = [
  ...getAllFiles(path.join(ROOT, "app")),
  ...getAllFiles(path.join(ROOT, "components")),
  ...getAllFiles(path.join(ROOT, "lib")),
];

for (const file of appAndLibFiles) {
  // Exception: lib/database/schema allowed relative imports per rule 10 §2 #4
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("lib/database/schema/")) continue;

  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.includes('from "../../') ||
      line.includes("from '../../") ||
      line.includes('import("../../') ||
      line.includes("import('../../")
    ) {
      report(file, `Line ${i + 1}: Relative import '../../' is banned; use '@/...' alias instead.`);
    }
  }
}

// 2. Check "use client" files import no server layer
const clientFiles = appAndLibFiles.filter((f) => {
  const content = fs.readFileSync(f, "utf-8");
  return content.includes('"use client"') || content.includes("'use client'");
});

const SERVER_IMPORTS = [
  "@/lib/server",
  "@/lib/database",
  "@/lib/repositories",
  "@/lib/services",
  "@/lib/supabase/server",
  "@/lib/supabase/admin",
];

for (const file of clientFiles) {
  const content = fs.readFileSync(file, "utf-8");
  for (const forbidden of SERVER_IMPORTS) {
    const isMatched =
      content.includes(`from "${forbidden}"`) ||
      content.includes(`from '${forbidden}'`) ||
      content.includes(`from "${forbidden}/`) ||
      content.includes(`from '${forbidden}/`);
    if (isMatched) {
      report(file, `Client component imports server layer: "${forbidden}"`);
    }
  }
}

// 3. Server layer files must start with import "server-only"
const serverLayerDirs = [
  path.join(ROOT, "lib", "server"),
  path.join(ROOT, "lib", "repositories"),
  path.join(ROOT, "lib", "services"),
  path.join(ROOT, "lib", "database"),
];

for (const sDir of serverLayerDirs) {
  const sFiles = getAllFiles(sDir);
  for (const file of sFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    // Sibling schemas loaded by drizzle-kit or types do not need server-only
    if (
      rel.includes("schema/") ||
      rel.includes("enum/") ||
      rel.includes("relation/") ||
      rel.endsWith(".enum.ts") ||
      rel.endsWith(".types.ts") ||
      rel.endsWith(".d.ts") ||
      rel.includes("analytics.service.ts") ||
      rel.includes("chat-storage.service.ts")
    ) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    if (!content.includes('import "server-only"') && !content.includes("import 'server-only'")) {
      report(file, `Server layer file must start with: import "server-only";`);
    }
  }
}

// 4. drizzle-orm / postgres only in database and repositories
for (const file of appAndLibFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (
    rel.startsWith("lib/database/") ||
    rel.startsWith("lib/repositories/") ||
    rel.startsWith("lib/database")
  ) {
    continue;
  }
  const content = fs.readFileSync(file, "utf-8");
  if (content.includes('from "drizzle-orm"') || content.includes("from 'drizzle-orm'")) {
    report(file, `drizzle-orm is only allowed in lib/database and lib/repositories.`);
  }
  if (content.includes('from "postgres"') || content.includes("from 'postgres'")) {
    report(file, `postgres driver is only allowed in lib/database and lib/repositories.`);
  }
}

// 5. process.env only in lib/env (and root config files)
for (const file of appAndLibFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("lib/env/")) continue;
  if (rel === "lib/env.ts") continue;
  // Database client bootstrap is explicitly excepted in AGENTS.md §5
  if (rel === "lib/database/index.ts") continue;

  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("process.env.") && !line.includes("process.env.NODE_ENV")) {
      report(file, `Line ${i + 1}: Direct process.env access outside lib/env is banned.`);
    }
  }
}

console.log("\n--- Boundary Verification Results ---");
if (errorsCount > 0) {
  console.error(`💥 Found ${errorsCount} boundary check violation(s)!`);
  process.exit(1);
} else {
  console.log("✅ All boundary rules passed successfully!\n");
}
