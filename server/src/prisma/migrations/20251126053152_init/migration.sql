-- AlterTable
ALTER TABLE "public"."ClientExpense" ALTER COLUMN "expenseDetails" DROP NOT NULL,
ALTER COLUMN "expenseDescription" DROP NOT NULL;
