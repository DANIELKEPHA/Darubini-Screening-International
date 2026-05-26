-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "contractPeriod" TEXT,
ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dateOfHire" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "supervisor" TEXT;

-- CreateIndex
CREATE INDEX "Admin_department_idx" ON "public"."Admin"("department");

-- CreateIndex
CREATE INDEX "Admin_dateOfHire_idx" ON "public"."Admin"("dateOfHire");
