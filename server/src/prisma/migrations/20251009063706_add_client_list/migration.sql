-- CreateEnum
CREATE TYPE "public"."ClientName" AS ENUM ('ADM_Wild_Flavors_Kenya_Limited', 'Africa_Banking_Corporation_ABC_Bank', 'African_Population_and_Health_Research_Centre_APHRC', 'Alma_Wangu_Ngare', 'Athena_Lab_Llc', 'Cloudhop', 'Commercial_International_Bank_CIB_Kenya_Limited', 'Dib_Bank_Kenya', 'Digital_Divide_Data_Kenya_Limited_DDD', 'Dp_World', 'Gulf_African_Bank', 'GZI_Kenya_Limited', 'Helium_Health_Limited', 'HF_Group', 'Highlands_Drinks_Limited', 'iCOLO_Limited_Kenya', 'Kenya_Tea_Development_Agency_KTDA', 'Kijani_Holdings_Limited', 'Angrac_Company_Limited', 'Laomai_Limited', 'Kyosk_Digital_Service_Limited', 'Maonga_Ndonye_Associates', 'Maple_Leaf_Educonnect_Limited', 'Motion_Industrial', 'Novartis_Kenya_Limited', 'Ochieng_Abuodha_And_Associates_Limited', 'Planate_Management_Group', 'Riley_Falcon_Security_Services_Limited', 'Rise_And_Learn_Global', 'Salix_Data_Africa_Limited', 'Seamlesshr', 'Strathmore_University', 'Sun_King_Greenlight_Planet', 'Surgipharm', 'Trademark_Africa_Limited', 'Virtual_Pay', 'Zanifu_Limited');

-- AlterTable
ALTER TABLE "public"."ClientExpense" ADD COLUMN     "clientListId" INTEGER;

-- CreateTable
CREATE TABLE "public"."ClientList" (
    "id" SERIAL NOT NULL,
    "clientName" "public"."ClientName" NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "kraPin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,
    "createdByStaffCognitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClientList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientList_clientName_idx" ON "public"."ClientList"("clientName");

-- CreateIndex
CREATE INDEX "ClientList_createdByAdminCognitoId_idx" ON "public"."ClientList"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "ClientList_createdByAccountsCognitoId_idx" ON "public"."ClientList"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "ClientList_createdByStaffCognitoId_idx" ON "public"."ClientList"("createdByStaffCognitoId");

-- CreateIndex
CREATE INDEX "ClientList_isActive_idx" ON "public"."ClientList"("isActive");

-- CreateIndex
CREATE INDEX "ClientExpense_clientListId_idx" ON "public"."ClientExpense"("clientListId");

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_clientListId_fkey" FOREIGN KEY ("clientListId") REFERENCES "public"."ClientList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientList" ADD CONSTRAINT "ClientList_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientList" ADD CONSTRAINT "ClientList_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientList" ADD CONSTRAINT "ClientList_createdByStaffCognitoId_fkey" FOREIGN KEY ("createdByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;
