/*
  Warnings:

  - You are about to alter the column `contactEmail` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `contactPhone` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `address` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `kraPin` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `createdByAdminCognitoId` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `createdByAccountsCognitoId` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `createdByStaffCognitoId` on the `ClientList` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientList" DROP CONSTRAINT "ClientList_createdByAccountsCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientList" DROP CONSTRAINT "ClientList_createdByAdminCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientList" DROP CONSTRAINT "ClientList_createdByStaffCognitoId_fkey";

-- AlterTable
ALTER TABLE "public"."ClientList" ADD COLUMN     "customClientName" VARCHAR(100),
ALTER COLUMN "contactEmail" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "contactPhone" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "kraPin" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "createdByAdminCognitoId" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "createdByAccountsCognitoId" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "createdByStaffCognitoId" SET DATA TYPE VARCHAR(255);

-- AddForeignKey
ALTER TABLE "public"."ClientList" ADD CONSTRAINT "ClientList_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientList" ADD CONSTRAINT "ClientList_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientList" ADD CONSTRAINT "ClientList_createdByStaffCognitoId_fkey" FOREIGN KEY ("createdByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
