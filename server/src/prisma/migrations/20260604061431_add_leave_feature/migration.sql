-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY_PATERNITY', 'COMPASSIONATE', 'OFF_DAY', 'STUDY', 'UNPAID', 'PUBLIC_HOLIDAY', 'JURY_DUTY', 'BEREAVEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LeaveAccrualType" AS ENUM ('MONTHLY', 'ANNUAL', 'QUARTERLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "public"."LeaveCarryForwardType" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_userCognitoId_fkey";

-- DropIndex
DROP INDEX "public"."Attendance_userCognitoId_checkInTime_idx";

-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "leaveRequestId" INTEGER;

-- CreateTable
CREATE TABLE "public"."LeaveRequest" (
    "id" SERIAL NOT NULL,
    "requesterCognitoId" TEXT NOT NULL,
    "requesterRole" "public"."UserRole" NOT NULL,
    "leaveType" "public"."LeaveType" NOT NULL,
    "otherLeaveType" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysRequested" INTEGER NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL,
    "reason" TEXT,
    "leaveBalanceId" INTEGER,
    "status" "public"."LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approvedByAdminCognitoId" TEXT,
    "remarks" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeavePolicy" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "annualLeaveDays" INTEGER NOT NULL DEFAULT 21,
    "sickLeaveDays" INTEGER NOT NULL DEFAULT 10,
    "compassionateDays" INTEGER NOT NULL DEFAULT 5,
    "maternityDays" INTEGER NOT NULL DEFAULT 90,
    "paternityDays" INTEGER NOT NULL DEFAULT 14,
    "emergencyDays" INTEGER NOT NULL DEFAULT 5,
    "studyLeaveDays" INTEGER,
    "unpaidLeaveAllowed" BOOLEAN NOT NULL DEFAULT true,
    "accrualType" "public"."LeaveAccrualType" NOT NULL DEFAULT 'ANNUAL',
    "carryForwardType" "public"."LeaveCarryForwardType" NOT NULL DEFAULT 'PARTIAL',
    "carryForwardMaxDays" INTEGER DEFAULT 5,
    "workingDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "excludeHolidays" BOOLEAN NOT NULL DEFAULT true,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaveBalance" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "year" INTEGER NOT NULL,
    "annualEntitled" DECIMAL(5,2) NOT NULL,
    "sickEntitled" DECIMAL(5,2) NOT NULL,
    "compassionateEntitled" DECIMAL(5,2) NOT NULL,
    "emergencyEntitled" DECIMAL(5,2) NOT NULL,
    "annualUsed" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sickUsed" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "compassionateUsed" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "emergencyUsed" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "annualRemaining" DECIMAL(5,2) NOT NULL,
    "sickRemaining" DECIMAL(5,2) NOT NULL,
    "compassionateRemaining" DECIMAL(5,2) NOT NULL,
    "emergencyRemaining" DECIMAL(5,2) NOT NULL,
    "lastAccruedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveRequest_requesterCognitoId_idx" ON "public"."LeaveRequest"("requesterCognitoId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "public"."LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_leaveType_idx" ON "public"."LeaveRequest"("leaveType");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_idx" ON "public"."LeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_endDate_idx" ON "public"."LeaveRequest"("endDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_approvedByAdminCognitoId_idx" ON "public"."LeaveRequest"("approvedByAdminCognitoId");

-- CreateIndex
CREATE INDEX "LeavePolicy_year_idx" ON "public"."LeavePolicy"("year");

-- CreateIndex
CREATE INDEX "LeavePolicy_role_idx" ON "public"."LeavePolicy"("role");

-- CreateIndex
CREATE UNIQUE INDEX "LeavePolicy_year_role_key" ON "public"."LeavePolicy"("year", "role");

-- CreateIndex
CREATE INDEX "LeaveBalance_cognitoId_idx" ON "public"."LeaveBalance"("cognitoId");

-- CreateIndex
CREATE INDEX "LeaveBalance_year_idx" ON "public"."LeaveBalance"("year");

-- CreateIndex
CREATE INDEX "LeaveBalance_role_idx" ON "public"."LeaveBalance"("role");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_cognitoId_year_key" ON "public"."LeaveBalance"("cognitoId", "year");

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "leave_request_admin_requester" FOREIGN KEY ("requesterCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "leave_request_accounts_requester" FOREIGN KEY ("requesterCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "leave_request_staff_requester" FOREIGN KEY ("requesterCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveBalanceId_fkey" FOREIGN KEY ("leaveBalanceId") REFERENCES "public"."LeaveBalance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_approvedByAdminCognitoId_fkey" FOREIGN KEY ("approvedByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "leave_balance_admin" FOREIGN KEY ("cognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "leave_balance_accounts" FOREIGN KEY ("cognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "leave_balance_staff" FOREIGN KEY ("cognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "LeaveBalance_year_role_fkey" FOREIGN KEY ("year", "role") REFERENCES "public"."LeavePolicy"("year", "role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "public"."LeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
