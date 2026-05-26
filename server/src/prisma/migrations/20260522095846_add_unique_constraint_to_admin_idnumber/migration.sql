/*
  Warnings:

  - A unique constraint covering the columns `[idNumber]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Admin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Admin_idNumber_key" ON "public"."Admin"("idNumber");
