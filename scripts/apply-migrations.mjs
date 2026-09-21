// One-time script to apply Prisma migration SQL files to Turso.
// Asks for DATABASE_URL interactively if it's not already in .env.local.
//
// Usage:
//   npx tsx scripts/apply-migrations.mjs

import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

dotenv.config({ path: ".env.local" });

let url = process.env.DATABASE_URL;
if (!url) {
  const rl = createInterface({ input: stdin, output: stdout });
  console.log(
    "\nPaste your Turso DATABASE_URL (the long libsql://... line from Railway Variables), then press Enter:",
  );
  url = (await rl.question("> ")).trim();
  rl.close();
}

if (!url) {
  console.error("No URL provided. Exiting.");
  process.exit(1);
}

const client = createClient({ url });

const files = [
  "prisma/migrations/20260606105424_init/migration.sql",
  "prisma/migrations/20260609063251_add_review_ip_address/migration.sql",
];

for (const file of files) {
  console.log(`Applying ${file}…`);
  const sql = readFileSync(file, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      const msg = err?.message ?? String(err);
      if (msg.includes("already exists") || msg.includes("duplicate column")) {
        console.log(`  · skip (already applied): ${stmt.slice(0, 70)}…`);
      } else {
        console.error(`  ✗ failed: ${stmt.slice(0, 70)}…`);
        throw err;
      }
    }
  }
}

console.log("\n✓ All migrations applied successfully.");
process.exit(0);
