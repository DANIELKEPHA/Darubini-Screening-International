-- AlterTable
ALTER TABLE "public"."ClientExpense" ADD COLUMN     "expenseStatus" "public"."ExpenseStatus" NOT NULL DEFAULT 'DRAFT';
