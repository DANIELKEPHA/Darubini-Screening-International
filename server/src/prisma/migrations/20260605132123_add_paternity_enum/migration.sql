/*
  Warnings:

  - The values [MATERNITY_PATERNITY] on the enum `LeaveType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LeaveType_new" AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE', 'OFF_DAY', 'STUDY', 'UNPAID', 'PUBLIC_HOLIDAY', 'JURY_DUTY', 'BEREAVEMENT', 'OTHER');
ALTER TABLE "public"."LeaveRequest" ALTER COLUMN "leaveType" TYPE "public"."LeaveType_new" USING ("leaveType"::text::"public"."LeaveType_new");
ALTER TABLE "public"."LeaveLedger" ALTER COLUMN "leaveType" TYPE "public"."LeaveType_new" USING ("leaveType"::text::"public"."LeaveType_new");
ALTER TABLE "public"."LeaveAccrual" ALTER COLUMN "leaveType" TYPE "public"."LeaveType_new" USING ("leaveType"::text::"public"."LeaveType_new");
ALTER TABLE "public"."LeavePolicyRule" ALTER COLUMN "leaveType" TYPE "public"."LeaveType_new" USING ("leaveType"::text::"public"."LeaveType_new");
ALTER TYPE "public"."LeaveType" RENAME TO "LeaveType_old";
ALTER TYPE "public"."LeaveType_new" RENAME TO "LeaveType";
DROP TYPE "public"."LeaveType_old";
COMMIT;
