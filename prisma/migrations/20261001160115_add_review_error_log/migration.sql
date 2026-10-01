-- AlterTable
ALTER TABLE "Review" ADD COLUMN "failureKind" TEXT;

-- CreateTable
CREATE TABLE "ReviewError" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phase" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reviewId" TEXT,
    "portfolioUrl" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "ReviewError_createdAt_idx" ON "ReviewError"("createdAt");

-- CreateIndex
CREATE INDEX "ReviewError_resolved_createdAt_idx" ON "ReviewError"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewError_kind_idx" ON "ReviewError"("kind");
