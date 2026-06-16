-- AlterTable
ALTER TABLE "public"."OperationalExpense" ALTER COLUMN "expenseDetails" DROP NOT NULL,
ALTER COLUMN "institutionName" DROP NOT NULL,
ALTER COLUMN "paymentModeDescription" DROP NOT NULL,
ALTER COLUMN "currency" DROP NOT NULL;
