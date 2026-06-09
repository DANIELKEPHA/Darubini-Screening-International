/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to alter the column `daysRequested` on the `LeaveRequest` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.
  - You are about to alter the column `totalWorkingDays` on the `LeaveRequest` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(5,2)`.

*/
-- CreateEnum
CREATE TYPE "public"."LeaveTransactionType" AS ENUM ('ALLOCATION', 'ACCRUAL', 'APPROVAL', 'REVERSAL', 'CANCELLATION', 'CARRY_FORWARD', 'ADJUSTMENT', 'ENCASHMENT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "public"."LeaveConditionType" AS ENUM ('SERVICE_YEARS', 'DEFAULT');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SKIPPED');

-- DropIndex
DROP INDEX "public"."LeaveBalance_cognitoId_year_idx";

-- DropIndex
DROP INDEX "public"."LeaveBalance_role_year_idx";

-- DropIndex
DROP INDEX "public"."LeaveRequest_approvedByAdminCognitoId_idx";

-- DropIndex
DROP INDEX "public"."LeaveRequest_endDate_idx";

-- DropIndex
DROP INDEX "public"."LeaveRequest_leaveType_idx";

-- DropIndex
DROP INDEX "public"."LeaveRequest_startDate_idx";

-- AlterTable
ALTER TABLE "public"."LeaveRequest" DROP COLUMN "approvedAt",
DROP COLUMN "remarks",
ALTER COLUMN "daysRequested" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "totalWorkingDays" SET DATA TYPE DECIMAL(5,2);

-- CreateTable
CREATE TABLE "public"."LeaveLedger" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "transactionType" "public"."LeaveTransactionType" NOT NULL,
    "days" DECIMAL(5,2) NOT NULL,
    "balanceBefore" DECIMAL(5,2) NOT NULL,
    "balanceAfter" DECIMAL(5,2) NOT NULL,
    "leaveRequestId" INTEGER,
    "approvalId" INTEGER,
    "leaveBalanceId" INTEGER,
    "remarks" TEXT,
    "performedByCognitoId" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaveAccrual" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "accruedDays" DECIMAL(5,2) NOT NULL,
    "policyId" INTEGER,
    "leaveBalanceId" INTEGER,
    "ledgerId" INTEGER,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaveApproval" (
    "id" SERIAL NOT NULL,
    "leaveRequestId" INTEGER NOT NULL,
    "approvalLevel" INTEGER NOT NULL,
    "approverCognitoId" TEXT NOT NULL,
    "approverRole" "public"."UserRole" NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actionedAt" TIMESTAMP(3),
    "delegatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkScheduleOverride" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "hoursPerDay" DECIMAL(4,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeavePolicyRule" (
    "id" SERIAL NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "role" "public"."UserRole",
    "year" INTEGER,
    "maxDays" DECIMAL(5,2),
    "conditionType" "public"."LeaveConditionType",
    "conditionValue" INTEGER,
    "payPercentage" DECIMAL(5,2),
    "allowsHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "requiresMedical" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "isDiscretionary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeavePolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveLedger_cognitoId_year_idx" ON "public"."LeaveLedger"("cognitoId", "year");

-- CreateIndex
CREATE INDEX "LeaveLedger_leaveRequestId_idx" ON "public"."LeaveLedger"("leaveRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveAccrual_cognitoId_year_month_leaveType_key" ON "public"."LeaveAccrual"("cognitoId", "year", "month", "leaveType");

-- CreateIndex
CREATE INDEX "LeaveApproval_leaveRequestId_idx" ON "public"."LeaveApproval"("leaveRequestId");

-- CreateIndex
CREATE INDEX "LeaveApproval_approverCognitoId_idx" ON "public"."LeaveApproval"("approverCognitoId");

-- CreateIndex
CREATE INDEX "LeaveApproval_approvalLevel_idx" ON "public"."LeaveApproval"("approvalLevel");

-- CreateIndex
CREATE INDEX "LeaveApproval_status_idx" ON "public"."LeaveApproval"("status");

-- AddForeignKey
ALTER TABLE "public"."LeaveLedger" ADD CONSTRAINT "LeaveLedger_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "public"."LeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveLedger" ADD CONSTRAINT "LeaveLedger_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "public"."LeaveApproval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveLedger" ADD CONSTRAINT "LeaveLedger_leaveBalanceId_fkey" FOREIGN KEY ("leaveBalanceId") REFERENCES "public"."LeaveBalance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveAccrual" ADD CONSTRAINT "LeaveAccrual_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "public"."LeavePolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveAccrual" ADD CONSTRAINT "LeaveAccrual_leaveBalanceId_fkey" FOREIGN KEY ("leaveBalanceId") REFERENCES "public"."LeaveBalance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveAccrual" ADD CONSTRAINT "LeaveAccrual_ledgerId_fkey" FOREIGN KEY ("ledgerId") REFERENCES "public"."LeaveLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveApproval" ADD CONSTRAINT "LeaveApproval_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "public"."LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
