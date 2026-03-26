-- AlterTable
ALTER TABLE "public"."ClientExpense" ADD COLUMN     "bankAccountId" INTEGER,
ADD COLUMN     "cashAccountId" INTEGER,
ADD COLUMN     "mobileAccountId" INTEGER,
ADD COLUMN     "otherAccountId" INTEGER;

-- CreateIndex
CREATE INDEX "ClientExpense_expenseStatus_idx" ON "public"."ClientExpense"("expenseStatus");

-- CreateIndex
CREATE INDEX "ClientExpense_bankAccountId_idx" ON "public"."ClientExpense"("bankAccountId");

-- CreateIndex
CREATE INDEX "ClientExpense_cashAccountId_idx" ON "public"."ClientExpense"("cashAccountId");

-- CreateIndex
CREATE INDEX "ClientExpense_mobileAccountId_idx" ON "public"."ClientExpense"("mobileAccountId");

-- CreateIndex
CREATE INDEX "ClientExpense_otherAccountId_idx" ON "public"."ClientExpense"("otherAccountId");

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_mobileAccountId_fkey" FOREIGN KEY ("mobileAccountId") REFERENCES "public"."MobileAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_otherAccountId_fkey" FOREIGN KEY ("otherAccountId") REFERENCES "public"."OtherAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
