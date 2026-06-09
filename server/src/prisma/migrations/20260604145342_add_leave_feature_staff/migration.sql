/*
  Warnings:

  - You are about to drop the column `accounts_cognito_id` on the `LeaveBalance` table. All the data in the column will be lost.
  - You are about to drop the column `admin_cognito_id` on the `LeaveBalance` table. All the data in the column will be lost.
  - You are about to drop the column `staff_cognito_id` on the `LeaveBalance` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LeaveBalance" DROP CONSTRAINT "LeaveBalance_accounts_cognito_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeaveBalance" DROP CONSTRAINT "LeaveBalance_admin_cognito_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeaveBalance" DROP CONSTRAINT "LeaveBalance_staff_cognito_id_fkey";

-- DropIndex
DROP INDEX "public"."LeaveBalance_accounts_cognito_id_idx";

-- DropIndex
DROP INDEX "public"."LeaveBalance_admin_cognito_id_idx";

-- DropIndex
DROP INDEX "public"."LeaveBalance_cognitoId_idx";

-- DropIndex
DROP INDEX "public"."LeaveBalance_role_idx";

-- DropIndex
DROP INDEX "public"."LeaveBalance_staff_cognito_id_idx";

-- DropIndex
DROP INDEX "public"."LeaveBalance_year_idx";

-- AlterTable
ALTER TABLE "public"."LeaveBalance" DROP COLUMN "accounts_cognito_id",
DROP COLUMN "admin_cognito_id",
DROP COLUMN "staff_cognito_id";

-- CreateIndex
CREATE INDEX "LeaveBalance_cognitoId_year_idx" ON "public"."LeaveBalance"("cognitoId", "year");

-- CreateIndex
CREATE INDEX "LeaveBalance_role_year_idx" ON "public"."LeaveBalance"("role", "year");
