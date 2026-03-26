-- CreateEnum
CREATE TYPE "public"."StickySharePermission" AS ENUM ('VIEW', 'EDIT');

-- DropForeignKey
ALTER TABLE "public"."StickyNote" DROP CONSTRAINT "StickyNote_accountsCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StickyNote" DROP CONSTRAINT "StickyNote_adminCognitoId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StickyNote" DROP CONSTRAINT "StickyNote_staffCognitoId_fkey";

-- DropIndex
DROP INDEX "public"."StickyNote_accountsCognitoId_idx";

-- DropIndex
DROP INDEX "public"."StickyNote_adminCognitoId_idx";

-- DropIndex
DROP INDEX "public"."StickyNote_staffCognitoId_idx";

-- AlterTable
ALTER TABLE "public"."StickyNote" ALTER COLUMN "adminCognitoId" SET DATA TYPE TEXT,
ALTER COLUMN "staffCognitoId" SET DATA TYPE TEXT,
ALTER COLUMN "accountsCognitoId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "public"."StickyNoteShare" (
    "id" SERIAL NOT NULL,
    "stickyNoteId" INTEGER NOT NULL,
    "permission" "public"."StickySharePermission" NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminCognitoId" TEXT,
    "staffCognitoId" TEXT,
    "accountsCognitoId" TEXT,

    CONSTRAINT "StickyNoteShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StickyNoteShare_stickyNoteId_idx" ON "public"."StickyNoteShare"("stickyNoteId");

-- CreateIndex
CREATE INDEX "StickyNoteShare_adminCognitoId_idx" ON "public"."StickyNoteShare"("adminCognitoId");

-- CreateIndex
CREATE INDEX "StickyNoteShare_staffCognitoId_idx" ON "public"."StickyNoteShare"("staffCognitoId");

-- CreateIndex
CREATE INDEX "StickyNoteShare_accountsCognitoId_idx" ON "public"."StickyNoteShare"("accountsCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "StickyNoteShare_stickyNoteId_adminCognitoId_key" ON "public"."StickyNoteShare"("stickyNoteId", "adminCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "StickyNoteShare_stickyNoteId_staffCognitoId_key" ON "public"."StickyNoteShare"("stickyNoteId", "staffCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "StickyNoteShare_stickyNoteId_accountsCognitoId_key" ON "public"."StickyNoteShare"("stickyNoteId", "accountsCognitoId");

-- AddForeignKey
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_staffCognitoId_fkey" FOREIGN KEY ("staffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_accountsCognitoId_fkey" FOREIGN KEY ("accountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNoteShare" ADD CONSTRAINT "StickyNoteShare_stickyNoteId_fkey" FOREIGN KEY ("stickyNoteId") REFERENCES "public"."StickyNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNoteShare" ADD CONSTRAINT "StickyNoteShare_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNoteShare" ADD CONSTRAINT "StickyNoteShare_staffCognitoId_fkey" FOREIGN KEY ("staffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNoteShare" ADD CONSTRAINT "StickyNoteShare_accountsCognitoId_fkey" FOREIGN KEY ("accountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
