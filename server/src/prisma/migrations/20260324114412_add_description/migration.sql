-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');

-- DropIndex
DROP INDEX "public"."cash_accounts_createdByAccountsCognitoId_idx";

-- DropIndex
DROP INDEX "public"."cash_accounts_createdByAdminCognitoId_idx";

-- DropIndex
DROP INDEX "public"."cash_accounts_currency_idx";

-- AlterTable
ALTER TABLE "public"."cash_accounts" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedByAccountsCognitoId" TEXT,
ADD COLUMN     "closedByAdminCognitoId" TEXT,
ADD COLUMN     "closureNotes" TEXT,
ADD COLUMN     "closureReason" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "cash_accounts_status_idx" ON "public"."cash_accounts"("status");

-- CreateIndex
CREATE INDEX "cash_accounts_isActive_idx" ON "public"."cash_accounts"("isActive");

-- CreateIndex
CREATE INDEX "cash_accounts_closedAt_idx" ON "public"."cash_accounts"("closedAt");
