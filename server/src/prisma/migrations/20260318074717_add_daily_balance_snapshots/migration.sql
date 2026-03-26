/*
  Warnings:

  - You are about to drop the `CashAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CashAccount" DROP CONSTRAINT "CashAccount_createdByAccountsCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CashAccount" DROP CONSTRAINT "CashAccount_createdByAdminCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientExpense" DROP CONSTRAINT "ClientExpense_cashAccountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OperationalExpense" DROP CONSTRAINT "OperationalExpense_cashAccountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_cash_account_id_fkey";

-- DropTable
DROP TABLE "public"."CashAccount";

-- CreateTable
CREATE TABLE "public"."cash_accounts" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cash_account_daily_balances" (
    "id" SERIAL NOT NULL,
    "cashAccountId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(14,2) NOT NULL,
    "closingBalance" DECIMAL(14,2) NOT NULL,
    "netMovement" DECIMAL(14,2) NOT NULL,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_account_daily_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_accounts_createdByAdminCognitoId_idx" ON "public"."cash_accounts"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "cash_accounts_createdByAccountsCognitoId_idx" ON "public"."cash_accounts"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "cash_accounts_currency_idx" ON "public"."cash_accounts"("currency");

-- CreateIndex
CREATE INDEX "cash_account_daily_balances_cashAccountId_date_idx" ON "public"."cash_account_daily_balances"("cashAccountId", "date" ASC);

-- CreateIndex
CREATE INDEX "cash_account_daily_balances_date_idx" ON "public"."cash_account_daily_balances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "cash_account_daily_balances_cashAccountId_date_key" ON "public"."cash_account_daily_balances"("cashAccountId", "date");

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."cash_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."cash_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_accounts" ADD CONSTRAINT "cash_accounts_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_accounts" ADD CONSTRAINT "cash_accounts_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_account_daily_balances" ADD CONSTRAINT "cash_account_daily_balances_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."cash_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_cash_account_id_fkey" FOREIGN KEY ("cash_account_id") REFERENCES "public"."cash_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
