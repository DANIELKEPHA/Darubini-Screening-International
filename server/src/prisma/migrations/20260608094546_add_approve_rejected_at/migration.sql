-- AlterTable
ALTER TABLE "public"."LeaveRequest" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3);
