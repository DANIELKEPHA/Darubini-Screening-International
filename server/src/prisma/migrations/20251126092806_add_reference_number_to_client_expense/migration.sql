/*
  Warnings:

  - A unique constraint covering the columns `[referenceNumber]` on the table `ClientExpense` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."ClientExpense" ADD COLUMN     "referenceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientExpense_referenceNumber_key" ON "public"."ClientExpense"("referenceNumber");
