-- AlterTable
ALTER TABLE "Review" ADD COLUMN "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "Review_ipAddress_createdAt_idx" ON "Review"("ipAddress", "createdAt");
