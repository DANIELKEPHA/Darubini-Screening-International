-- DropForeignKey
ALTER TABLE "public"."LeaveBalance" DROP CONSTRAINT "leave_balance_accounts";

-- DropForeignKey
ALTER TABLE "public"."LeaveBalance" DROP CONSTRAINT "leave_balance_admin";

-- DropForeignKey
ALTER TABLE "public"."LeaveBalance" DROP CONSTRAINT "leave_balance_staff";

-- AlterTable
ALTER TABLE "public"."LeaveBalance" ADD COLUMN     "accounts_cognito_id" TEXT,
ADD COLUMN     "admin_cognito_id" TEXT,
ADD COLUMN     "staff_cognito_id" TEXT;

-- CreateIndex
CREATE INDEX "LeaveBalance_admin_cognito_id_idx" ON "public"."LeaveBalance"("admin_cognito_id");

-- CreateIndex
CREATE INDEX "LeaveBalance_accounts_cognito_id_idx" ON "public"."LeaveBalance"("accounts_cognito_id");

-- CreateIndex
CREATE INDEX "LeaveBalance_staff_cognito_id_idx" ON "public"."LeaveBalance"("staff_cognito_id");

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "LeaveBalance_admin_cognito_id_fkey" FOREIGN KEY ("admin_cognito_id") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "LeaveBalance_accounts_cognito_id_fkey" FOREIGN KEY ("accounts_cognito_id") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveBalance" ADD CONSTRAINT "LeaveBalance_staff_cognito_id_fkey" FOREIGN KEY ("staff_cognito_id") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
