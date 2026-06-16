/*
  Warnings:

  - Made the column `currency` on table `OperationalExpense` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."OperationalExpense" ALTER COLUMN "currency" SET NOT NULL;
