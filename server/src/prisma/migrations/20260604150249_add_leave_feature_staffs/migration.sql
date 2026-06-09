-- DropForeignKey
ALTER TABLE "public"."LeaveRequest" DROP CONSTRAINT "leave_request_accounts_requester";

-- DropForeignKey
ALTER TABLE "public"."LeaveRequest" DROP CONSTRAINT "leave_request_admin_requester";

-- DropForeignKey
ALTER TABLE "public"."LeaveRequest" DROP CONSTRAINT "leave_request_staff_requester";
