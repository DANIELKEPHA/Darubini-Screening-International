-- CreateTable
CREATE TABLE "public"."StickyNote" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminCognitoId" VARCHAR(255),
    "staffCognitoId" VARCHAR(255),
    "accountsCognitoId" VARCHAR(255),

    CONSTRAINT "StickyNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StickyNote_adminCognitoId_idx" ON "public"."StickyNote"("adminCognitoId");

-- CreateIndex
CREATE INDEX "StickyNote_staffCognitoId_idx" ON "public"."StickyNote"("staffCognitoId");

-- CreateIndex
CREATE INDEX "StickyNote_accountsCognitoId_idx" ON "public"."StickyNote"("accountsCognitoId");

-- AddForeignKey
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_staffCognitoId_fkey" FOREIGN KEY ("staffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StickyNote" ADD CONSTRAINT "StickyNote_accountsCognitoId_fkey" FOREIGN KEY ("accountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
