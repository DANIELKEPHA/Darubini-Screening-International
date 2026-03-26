/*
  Warnings:

  - You are about to drop the column `reasonForPayment` on the `OperationalExpense` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."OperationalExpense" DROP COLUMN "reasonForPayment";
