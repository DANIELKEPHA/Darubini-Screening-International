/*
  Warnings:

  - A unique constraint covering the columns `[idNumber]` on the table `Accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idNumber]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Accounts" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "contractPeriod" TEXT,
ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfHire" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "supervisor" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "contractPeriod" TEXT,
ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfHire" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "supervisor" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_idNumber_key" ON "public"."Accounts"("idNumber");

-- CreateIndex
CREATE INDEX "Accounts_department_idx" ON "public"."Accounts"("department");

-- CreateIndex
CREATE INDEX "Accounts_dateOfHire_idx" ON "public"."Accounts"("dateOfHire");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_idNumber_key" ON "public"."Staff"("idNumber");

-- CreateIndex
CREATE INDEX "Staff_department_idx" ON "public"."Staff"("department");

-- CreateIndex
CREATE INDEX "Staff_dateOfHire_idx" ON "public"."Staff"("dateOfHire");
