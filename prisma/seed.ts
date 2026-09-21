import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Seed is a no-op in v2 — production reviews come exclusively from the
 * Claude agent. Run a real review against any portfolio URL to populate
 * the database. Kept as a stub so `prisma migrate dev` doesn't fail.
 */

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    "Seed: nothing to insert. Submit a portfolio URL through the form to create reviews.",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
