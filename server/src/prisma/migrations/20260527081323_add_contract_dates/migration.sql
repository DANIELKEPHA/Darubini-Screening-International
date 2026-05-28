-- AlterTable
ALTER TABLE "public"."Accounts" ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "contractEndDate" TIMESTAMP(3),
ADD COLUMN     "contractStartDate" TIMESTAMP(3);
