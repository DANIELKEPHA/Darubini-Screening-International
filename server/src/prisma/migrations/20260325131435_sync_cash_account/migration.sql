/*
  Warnings:

  - You are about to drop the `cash_accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientExpense" DROP CONSTRAINT "ClientExpense_cashAccountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OperationalExpense" DROP CONSTRAINT "OperationalExpense_cashAccountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_cash_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cash_account_daily_balances" DROP CONSTRAINT "cash_account_daily_balances_cashAccountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cash_accounts" DROP CONSTRAINT "cash_accounts_createdByAccountsCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cash_accounts" DROP CONSTRAINT "cash_accounts_createdByAdminCognitoId_fkey";

-- DropTable
DROP TABLE "public"."cash_accounts";

-- CreateTable
CREATE TABLE "public"."CashAccount" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL,
    "description" TEXT,
    "balance" DECIMAL(14,2) NOT NULL,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "closedAt" TIMESTAMP(3),
    "closedByAdminCognitoId" TEXT,
    "closedByAccountsCognitoId" TEXT,
    "closureReason" TEXT,
    "closureNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashAccount_status_idx" ON "public"."CashAccount"("status");

-- CreateIndex
CREATE INDEX "CashAccount_isActive_idx" ON "public"."CashAccount"("isActive");

-- CreateIndex
CREATE INDEX "CashAccount_closedAt_idx" ON "public"."CashAccount"("closedAt");

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashAccount" ADD CONSTRAINT "CashAccount_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashAccount" ADD CONSTRAINT "CashAccount_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_account_daily_balances" ADD CONSTRAINT "cash_account_daily_balances_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."CashAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_cash_account_id_fkey" FOREIGN KEY ("cash_account_id") REFERENCES "public"."CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
