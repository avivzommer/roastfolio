-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioUrl" TEXT NOT NULL,
    "targetSeniority" TEXT NOT NULL DEFAULT 'unspecified',
    "heatLevel" TEXT NOT NULL DEFAULT 'honest',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "report" TEXT,
    "failureReason" TEXT,
    "ipAddress" TEXT
);
INSERT INTO "new_Review" ("costCents", "createdAt", "failureReason", "id", "ipAddress", "portfolioUrl", "report", "status", "targetSeniority") SELECT "costCents", "createdAt", "failureReason", "id", "ipAddress", "portfolioUrl", "report", "status", "targetSeniority" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");
CREATE INDEX "Review_status_idx" ON "Review"("status");
CREATE INDEX "Review_ipAddress_createdAt_idx" ON "Review"("ipAddress", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
