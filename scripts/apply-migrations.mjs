// Applies every Prisma migration SQL file in prisma/migrations/ to the
// Turso (libSQL) database referenced by DATABASE_URL.
//
// Runs at container startup on Railway (via railway.json → startCommand)
// so new migrations land automatically before `next start`.
//
// Also usable locally:
//   node scripts/apply-migrations.mjs
// With DATABASE_URL already exported, or (dev-only) with dotenv loading
// .env.local — the dotenv import is optional so prod doesn't need it.

import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

// Soft-load dotenv when it's installed (dev). In prod, Railway injects env.
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env.local" });
} catch {
  // No dotenv installed — expected in prod.
}

let url = process.env.DATABASE_URL;

// Interactive fallback (local only, when TTY is attached).
if (!url && stdin.isTTY) {
  const rl = createInterface({ input: stdin, output: stdout });
  console.log(
    "\nPaste your Turso DATABASE_URL (the long libsql://... line from Railway Variables), then press Enter:",
  );
  url = (await rl.question("> ")).trim();
  rl.close();
}

if (!url) {
  console.error(
    "[apply-migrations] DATABASE_URL is not set. Skipping migration step.",
  );
  process.exit(0);
}

// libSQL URLs starting with file: mean a local dev DB — Prisma handles those
// itself (via `prisma migrate dev`), so no need to run this script.
if (url.startsWith("file:")) {
  console.log("[apply-migrations] DATABASE_URL is a local file — skipping.");
  process.exit(0);
}

const migrationsDir = "prisma/migrations";
const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort(); // Timestamped names sort chronologically.

if (migrationDirs.length === 0) {
  console.log("[apply-migrations] No migrations found.");
  process.exit(0);
}

const client = createClient({ url });

for (const dir of migrationDirs) {
  const file = join(migrationsDir, dir, "migration.sql");
  console.log(`[apply-migrations] Applying ${dir}…`);
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
      // Idempotent skips — running against a DB where the migration already
      // applied should be a no-op, not an error.
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate column") ||
        msg.includes("no such table") // guard for pre-init DROP TABLE lines
      ) {
        console.log(`  · skip (already applied): ${stmt.slice(0, 70)}…`);
      } else {
        console.error(`  ✗ failed: ${stmt.slice(0, 70)}…`);
        throw err;
      }
    }
  }
}

console.log("[apply-migrations] ✓ All migrations applied.");

// The libSQL client keeps a WebSocket-ish connection alive, which stops Node
// from exiting on its own. Close it explicitly so Railway's startCommand can
// move on to `next start`.
try {
  client.close();
} catch {
  // Best-effort; not fatal if the runtime doesn't expose close().
}
process.exit(0);
