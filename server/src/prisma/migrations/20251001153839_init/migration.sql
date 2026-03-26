-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "public"."SenderType" AS ENUM ('USER', 'GUEST', 'ADMIN', 'ACCOUNTS', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EmailSendStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED', 'UNSUBSCRIBED', 'SPAM');

-- CreateEnum
CREATE TYPE "public"."ExpenseType" AS ENUM ('CLIENT', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "public"."ExpenseCheck" AS ENUM ('IDENTITY', 'ACADEMIC', 'PROFESSIONAL', 'ADDRESS', 'FINGERPRINT', 'PCC_FAST_TRACK', 'CERTIFICATE_VERIFICATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "public"."PaymentMode" AS ENUM ('MPESA_PAYBILL', 'BANK_DEPOSIT', 'VISA_CARD', 'CASH');

-- CreateEnum
CREATE TYPE "public"."Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'WEEKLY', 'ONCE_OFF');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('RENT_EXPENSE', 'REPAIR_AND_MAINTENANCE', 'SALARIES_AND_EMPLOYEE_WAGES', 'TELEPHONE_EXPENSE', 'TRAVEL_EXPENSE', 'UTILITIES_EXPENSE', 'OFFICE_SUPPLIES_EXPENSE', 'INSURANCE_EXPENSE', 'ADVERTISING_AND_MARKETING_EXPENSE', 'TRAINING_AND_DEVELOPMENT_EXPENSE', 'PROFESSIONAL_FEES', 'DEPRECIATION_EXPENSE', 'BANK_CHARGES_AND_FEES', 'VEHICLE_RUNNING_AND_MAINTENANCE_EXPENSE', 'MISCELLANEOUS_EXPENSE');

-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('GOODS', 'SERVICES');

-- CreateEnum
CREATE TYPE "public"."QuotationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'ACCOUNTS', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('CHECKED_IN', 'CHECKED_OUT', 'FLAGGED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."BreakType" AS ENUM ('TEA_COFFEE', 'LUNCH', 'PRAYER_MEDITATION', 'STRETCH_FRESH_AIR', 'ERRAND', 'FIELD', 'MEETING', 'PERSONAL', 'LEAVE', 'DAY_END', 'TRAINING', 'OFFICIAL_TRAVEL', 'SICK', 'MATERNITY_PATERNITY', 'TEAM_BUILDING', 'COMPENSATORY');

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ADMIN',

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Accounts" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ACCOUNTS',

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GuestUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRoom" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "guestUserId" INTEGER,
    "userCognitoId" TEXT,
    "adminCognitoId" TEXT,
    "accountsCognitoId" TEXT,
    "staffCognitoId" TEXT,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "senderType" "public"."SenderType" NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "subject" TEXT,
    "interests" TEXT,
    "privacyConsent" BOOLEAN NOT NULL,
    "userCognitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Author" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bio" TEXT,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "videoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "authorId" INTEGER,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailCampaign" (
    "id" SERIAL NOT NULL,
    "brevoCampaignId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminCognitoId" TEXT NOT NULL,
    "emailListId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3),

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" SERIAL NOT NULL,
    "emailCampaignId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailList" (
    "id" SERIAL NOT NULL,
    "brevoListId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "adminCognitoId" TEXT NOT NULL,

    CONSTRAINT "EmailList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailSend" (
    "id" SERIAL NOT NULL,
    "emailCampaignId" INTEGER NOT NULL,
    "userId" INTEGER,
    "guestUserId" INTEGER,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "status" "public"."EmailSendStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,

    CONSTRAINT "EmailSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quotation" (
    "id" SERIAL NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "quotedAmount" DECIMAL(14,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "public"."QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserCognitoId" TEXT,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,
    "createdByStaffCognitoId" TEXT,
    "approvedByUserCognitoId" TEXT,
    "approvedByAdminCognitoId" TEXT,
    "approvedByAccountsCognitoId" TEXT,
    "approvedByStaffCognitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "kraPin" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientExpense" (
    "id" SERIAL NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,
    "createdByStaffCognitoId" TEXT,
    "approvedByUserCognitoId" TEXT,
    "approvedByAdminCognitoId" TEXT,
    "approvedByAccountsCognitoId" TEXT,
    "approvedByStaffCognitoId" TEXT,
    "agentName" TEXT NOT NULL,
    "kraPin" TEXT,
    "candidateName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "expenseDetails" TEXT NOT NULL,
    "expenseCheck" "public"."ExpenseCheck" NOT NULL,
    "expenseDescription" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "paymentMode" "public"."PaymentMode" NOT NULL,
    "paymentModeDescription" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "totalAmountPaid" DECIMAL(14,2) NOT NULL,
    "supplierId" INTEGER,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OperationalExpense" (
    "id" SERIAL NOT NULL,
    "referenceNumber" TEXT,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,
    "createdByStaffCognitoId" TEXT,
    "approvedByUserCognitoId" TEXT,
    "approvedByAdminCognitoId" TEXT,
    "approvedByAccountsCognitoId" TEXT,
    "approvedByStaffCognitoId" TEXT,
    "agentName" TEXT NOT NULL,
    "kraPin" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "expenseDetails" TEXT NOT NULL,
    "expenseName" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "reasonForPayment" TEXT NOT NULL,
    "frequency" "public"."Frequency" NOT NULL,
    "paymentMode" "public"."PaymentMode" NOT NULL,
    "paymentModeDescription" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "totalAmountPaid" DECIMAL(14,2) NOT NULL,
    "supplierId" INTEGER,
    "bankAccountId" INTEGER,
    "cashAccountId" INTEGER,
    "mobileAccountId" INTEGER,
    "otherAccountId" INTEGER,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "expenseStatus" "public"."ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "lpoStatus" TEXT DEFAULT 'DRAFT',
    "itemType" "public"."ItemType",
    "accountType" "public"."AccountType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashAccount" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MobileAccount" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "MobileAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OtherAccount" (
    "id" SERIAL NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "OtherAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "paymentMode" "public"."PaymentMode" NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "expense_id" INTEGER,
    "proof_file_id" INTEGER,
    "bank_account_id" INTEGER,
    "cash_account_id" INTEGER,
    "mobile_account_id" INTEGER,
    "other_account_id" INTEGER,
    "checkoutRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminCognitoId" TEXT,
    "createdByAccountsCognitoId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProofFile" (
    "id" SERIAL NOT NULL,
    "expenseType" "public"."ExpenseType",
    "clientExpenseId" INTEGER,
    "operationalExpenseId" INTEGER,
    "quotationId" INTEGER,
    "s3Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedByUserCognitoId" TEXT,
    "uploadedByAdminCognitoId" TEXT,
    "uploadedByAccountsCognitoId" TEXT,
    "uploadedByStaffCognitoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "actorUserCognitoId" TEXT,
    "actorAdminCognitoId" TEXT,
    "actorAccountsCognitoId" TEXT,
    "actorStaffCognitoId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "appSettingId" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmployeeSchedule" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "expectedStartTime" TIMESTAMP(3) NOT NULL,
    "expectedEndTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" SERIAL NOT NULL,
    "userCognitoId" TEXT,
    "adminCognitoId" TEXT,
    "accountsCognitoId" TEXT,
    "staffCognitoId" TEXT,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "total_hours" DOUBLE PRECISION,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "checkInLat" DECIMAL(9,6),
    "checkInLng" DECIMAL(9,6),
    "checkOutLat" DECIMAL(9,6),
    "checkOutLng" DECIMAL(9,6),
    "breakType" "public"."BreakType",
    "autoCheckedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppSettings" (
    "id" SERIAL NOT NULL,
    "settingKey" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AdminQuotations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminQuotations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AdminClientExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminClientExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AdminOperationalExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminOperationalExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AdminClientExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminClientExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AdminOperationalExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AdminOperationalExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AccountsEmailLists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccountsEmailLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AccountsQuotations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccountsQuotations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AccountsClientExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccountsClientExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AccountsOperationalExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccountsOperationalExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AccountsClientExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccountsClientExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_AccountsOperationalExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AccountsOperationalExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserEmailLists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserEmailLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_GuestUserEmailLists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GuestUserEmailLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_StaffEmailLists" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffEmailLists_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserQuotations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserQuotations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_StaffQuotations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffQuotations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserClientExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserClientExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_StaffClientExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffClientExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserClientExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserClientExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_StaffClientExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffClientExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserOperationalExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserOperationalExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_StaffOperationalExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffOperationalExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserOperationalExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserOperationalExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_StaffOperationalExpenseApprovals" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StaffOperationalExpenseApprovals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_cognitoId_key" ON "public"."Admin"("cognitoId");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "public"."Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_role_idx" ON "public"."Admin"("role");

-- CreateIndex
CREATE UNIQUE INDEX "User_cognitoId_key" ON "public"."User"("cognitoId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_cognitoId_key" ON "public"."Accounts"("cognitoId");

-- CreateIndex
CREATE INDEX "Accounts_email_idx" ON "public"."Accounts"("email");

-- CreateIndex
CREATE INDEX "Accounts_role_idx" ON "public"."Accounts"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_cognitoId_key" ON "public"."Staff"("cognitoId");

-- CreateIndex
CREATE INDEX "Staff_email_idx" ON "public"."Staff"("email");

-- CreateIndex
CREATE INDEX "Staff_role_idx" ON "public"."Staff"("role");

-- CreateIndex
CREATE UNIQUE INDEX "GuestUser_email_key" ON "public"."GuestUser"("email");

-- CreateIndex
CREATE INDEX "Contact_userCognitoId_idx" ON "public"."Contact"("userCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Author_email_key" ON "public"."Author"("email");

-- CreateIndex
CREATE INDEX "Author_email_idx" ON "public"."Author"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "public"."Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_authorId_idx" ON "public"."Blog"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_brevoCampaignId_key" ON "public"."EmailCampaign"("brevoCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailList_brevoListId_key" ON "public"."EmailList"("brevoListId");

-- CreateIndex
CREATE INDEX "EmailSend_emailCampaignId_idx" ON "public"."EmailSend"("emailCampaignId");

-- CreateIndex
CREATE INDEX "EmailSend_userId_idx" ON "public"."EmailSend"("userId");

-- CreateIndex
CREATE INDEX "EmailSend_guestUserId_idx" ON "public"."EmailSend"("guestUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "public"."Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_quotationNumber_idx" ON "public"."Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_supplierName_idx" ON "public"."Quotation"("supplierName");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "public"."Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_createdByUserCognitoId_idx" ON "public"."Quotation"("createdByUserCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_createdByAdminCognitoId_idx" ON "public"."Quotation"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_createdByAccountsCognitoId_idx" ON "public"."Quotation"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_createdByStaffCognitoId_idx" ON "public"."Quotation"("createdByStaffCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_approvedByUserCognitoId_idx" ON "public"."Quotation"("approvedByUserCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_approvedByAdminCognitoId_idx" ON "public"."Quotation"("approvedByAdminCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_approvedByAccountsCognitoId_idx" ON "public"."Quotation"("approvedByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "Quotation_approvedByStaffCognitoId_idx" ON "public"."Quotation"("approvedByStaffCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_date_idx" ON "public"."ClientExpense"("date");

-- CreateIndex
CREATE INDEX "ClientExpense_clientName_idx" ON "public"."ClientExpense"("clientName");

-- CreateIndex
CREATE INDEX "ClientExpense_candidateName_idx" ON "public"."ClientExpense"("candidateName");

-- CreateIndex
CREATE INDEX "ClientExpense_kraPin_idx" ON "public"."ClientExpense"("kraPin");

-- CreateIndex
CREATE INDEX "ClientExpense_paymentStatus_idx" ON "public"."ClientExpense"("paymentStatus");

-- CreateIndex
CREATE INDEX "ClientExpense_createdByAdminCognitoId_idx" ON "public"."ClientExpense"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_createdByAccountsCognitoId_idx" ON "public"."ClientExpense"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_createdByStaffCognitoId_idx" ON "public"."ClientExpense"("createdByStaffCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_approvedByUserCognitoId_idx" ON "public"."ClientExpense"("approvedByUserCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_approvedByAdminCognitoId_idx" ON "public"."ClientExpense"("approvedByAdminCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_approvedByAccountsCognitoId_idx" ON "public"."ClientExpense"("approvedByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_approvedByStaffCognitoId_idx" ON "public"."ClientExpense"("approvedByStaffCognitoId");

-- CreateIndex
CREATE INDEX "ClientExpense_supplierId_idx" ON "public"."ClientExpense"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalExpense_referenceNumber_key" ON "public"."OperationalExpense"("referenceNumber");

-- CreateIndex
CREATE INDEX "OperationalExpense_date_idx" ON "public"."OperationalExpense"("date");

-- CreateIndex
CREATE INDEX "OperationalExpense_expenseName_idx" ON "public"."OperationalExpense"("expenseName");

-- CreateIndex
CREATE INDEX "OperationalExpense_expenseStatus_idx" ON "public"."OperationalExpense"("expenseStatus");

-- CreateIndex
CREATE INDEX "OperationalExpense_paymentStatus_idx" ON "public"."OperationalExpense"("paymentStatus");

-- CreateIndex
CREATE INDEX "OperationalExpense_kraPin_idx" ON "public"."OperationalExpense"("kraPin");

-- CreateIndex
CREATE INDEX "OperationalExpense_createdByAdminCognitoId_idx" ON "public"."OperationalExpense"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_createdByAccountsCognitoId_idx" ON "public"."OperationalExpense"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_createdByStaffCognitoId_idx" ON "public"."OperationalExpense"("createdByStaffCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_approvedByUserCognitoId_idx" ON "public"."OperationalExpense"("approvedByUserCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_approvedByAdminCognitoId_idx" ON "public"."OperationalExpense"("approvedByAdminCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_approvedByAccountsCognitoId_idx" ON "public"."OperationalExpense"("approvedByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_approvedByStaffCognitoId_idx" ON "public"."OperationalExpense"("approvedByStaffCognitoId");

-- CreateIndex
CREATE INDEX "OperationalExpense_supplierId_idx" ON "public"."OperationalExpense"("supplierId");

-- CreateIndex
CREATE INDEX "OperationalExpense_bankAccountId_idx" ON "public"."OperationalExpense"("bankAccountId");

-- CreateIndex
CREATE INDEX "OperationalExpense_cashAccountId_idx" ON "public"."OperationalExpense"("cashAccountId");

-- CreateIndex
CREATE INDEX "OperationalExpense_mobileAccountId_idx" ON "public"."OperationalExpense"("mobileAccountId");

-- CreateIndex
CREATE INDEX "OperationalExpense_otherAccountId_idx" ON "public"."OperationalExpense"("otherAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_createdByAdminCognitoId_idx" ON "public"."BankAccount"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "BankAccount_createdByAccountsCognitoId_idx" ON "public"."BankAccount"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "CashAccount_createdByAdminCognitoId_idx" ON "public"."CashAccount"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "CashAccount_createdByAccountsCognitoId_idx" ON "public"."CashAccount"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "MobileAccount_createdByAdminCognitoId_idx" ON "public"."MobileAccount"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "MobileAccount_createdByAccountsCognitoId_idx" ON "public"."MobileAccount"("createdByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "OtherAccount_createdByAdminCognitoId_idx" ON "public"."OtherAccount"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "OtherAccount_createdByAccountsCognitoId_idx" ON "public"."OtherAccount"("createdByAccountsCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_proof_file_id_key" ON "public"."Transaction"("proof_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_checkoutRequestId_key" ON "public"."Transaction"("checkoutRequestId");

-- CreateIndex
CREATE INDEX "Transaction_expense_id_idx" ON "public"."Transaction"("expense_id");

-- CreateIndex
CREATE INDEX "Transaction_proof_file_id_idx" ON "public"."Transaction"("proof_file_id");

-- CreateIndex
CREATE INDEX "Transaction_bank_account_id_idx" ON "public"."Transaction"("bank_account_id");

-- CreateIndex
CREATE INDEX "Transaction_cash_account_id_idx" ON "public"."Transaction"("cash_account_id");

-- CreateIndex
CREATE INDEX "Transaction_mobile_account_id_idx" ON "public"."Transaction"("mobile_account_id");

-- CreateIndex
CREATE INDEX "Transaction_other_account_id_idx" ON "public"."Transaction"("other_account_id");

-- CreateIndex
CREATE INDEX "Transaction_createdByAdminCognitoId_idx" ON "public"."Transaction"("createdByAdminCognitoId");

-- CreateIndex
CREATE INDEX "Transaction_createdByAccountsCognitoId_idx" ON "public"."Transaction"("createdByAccountsCognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProofFile_s3Key_key" ON "public"."ProofFile"("s3Key");

-- CreateIndex
CREATE INDEX "ProofFile_clientExpenseId_idx" ON "public"."ProofFile"("clientExpenseId");

-- CreateIndex
CREATE INDEX "ProofFile_operationalExpenseId_idx" ON "public"."ProofFile"("operationalExpenseId");

-- CreateIndex
CREATE INDEX "ProofFile_quotationId_idx" ON "public"."ProofFile"("quotationId");

-- CreateIndex
CREATE INDEX "ProofFile_uploadedByUserCognitoId_idx" ON "public"."ProofFile"("uploadedByUserCognitoId");

-- CreateIndex
CREATE INDEX "ProofFile_uploadedByAdminCognitoId_idx" ON "public"."ProofFile"("uploadedByAdminCognitoId");

-- CreateIndex
CREATE INDEX "ProofFile_uploadedByAccountsCognitoId_idx" ON "public"."ProofFile"("uploadedByAccountsCognitoId");

-- CreateIndex
CREATE INDEX "ProofFile_uploadedByStaffCognitoId_idx" ON "public"."ProofFile"("uploadedByStaffCognitoId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "public"."AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_appSettingId_idx" ON "public"."AuditLog"("appSettingId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserCognitoId_idx" ON "public"."AuditLog"("actorUserCognitoId");

-- CreateIndex
CREATE INDEX "AuditLog_actorAdminCognitoId_idx" ON "public"."AuditLog"("actorAdminCognitoId");

-- CreateIndex
CREATE INDEX "AuditLog_actorAccountsCognitoId_idx" ON "public"."AuditLog"("actorAccountsCognitoId");

-- CreateIndex
CREATE INDEX "AuditLog_actorStaffCognitoId_idx" ON "public"."AuditLog"("actorStaffCognitoId");

-- CreateIndex
CREATE INDEX "EmployeeSchedule_cognitoId_dayOfWeek_idx" ON "public"."EmployeeSchedule"("cognitoId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Attendance_userCognitoId_checkInTime_idx" ON "public"."Attendance"("userCognitoId", "checkInTime");

-- CreateIndex
CREATE INDEX "Attendance_adminCognitoId_checkInTime_idx" ON "public"."Attendance"("adminCognitoId", "checkInTime");

-- CreateIndex
CREATE INDEX "Attendance_accountsCognitoId_checkInTime_idx" ON "public"."Attendance"("accountsCognitoId", "checkInTime");

-- CreateIndex
CREATE INDEX "Attendance_staffCognitoId_checkInTime_idx" ON "public"."Attendance"("staffCognitoId", "checkInTime");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_settingKey_key" ON "public"."AppSettings"("settingKey");

-- CreateIndex
CREATE INDEX "AppSettings_settingKey_idx" ON "public"."AppSettings"("settingKey");

-- CreateIndex
CREATE INDEX "_AdminQuotations_B_index" ON "public"."_AdminQuotations"("B");

-- CreateIndex
CREATE INDEX "_AdminClientExpenses_B_index" ON "public"."_AdminClientExpenses"("B");

-- CreateIndex
CREATE INDEX "_AdminOperationalExpenses_B_index" ON "public"."_AdminOperationalExpenses"("B");

-- CreateIndex
CREATE INDEX "_AdminClientExpenseApprovals_B_index" ON "public"."_AdminClientExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_AdminOperationalExpenseApprovals_B_index" ON "public"."_AdminOperationalExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_AccountsEmailLists_B_index" ON "public"."_AccountsEmailLists"("B");

-- CreateIndex
CREATE INDEX "_AccountsQuotations_B_index" ON "public"."_AccountsQuotations"("B");

-- CreateIndex
CREATE INDEX "_AccountsClientExpenses_B_index" ON "public"."_AccountsClientExpenses"("B");

-- CreateIndex
CREATE INDEX "_AccountsOperationalExpenses_B_index" ON "public"."_AccountsOperationalExpenses"("B");

-- CreateIndex
CREATE INDEX "_AccountsClientExpenseApprovals_B_index" ON "public"."_AccountsClientExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_AccountsOperationalExpenseApprovals_B_index" ON "public"."_AccountsOperationalExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_UserEmailLists_B_index" ON "public"."_UserEmailLists"("B");

-- CreateIndex
CREATE INDEX "_GuestUserEmailLists_B_index" ON "public"."_GuestUserEmailLists"("B");

-- CreateIndex
CREATE INDEX "_StaffEmailLists_B_index" ON "public"."_StaffEmailLists"("B");

-- CreateIndex
CREATE INDEX "_UserQuotations_B_index" ON "public"."_UserQuotations"("B");

-- CreateIndex
CREATE INDEX "_StaffQuotations_B_index" ON "public"."_StaffQuotations"("B");

-- CreateIndex
CREATE INDEX "_UserClientExpenses_B_index" ON "public"."_UserClientExpenses"("B");

-- CreateIndex
CREATE INDEX "_StaffClientExpenses_B_index" ON "public"."_StaffClientExpenses"("B");

-- CreateIndex
CREATE INDEX "_UserClientExpenseApprovals_B_index" ON "public"."_UserClientExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_StaffClientExpenseApprovals_B_index" ON "public"."_StaffClientExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_UserOperationalExpenses_B_index" ON "public"."_UserOperationalExpenses"("B");

-- CreateIndex
CREATE INDEX "_StaffOperationalExpenses_B_index" ON "public"."_StaffOperationalExpenses"("B");

-- CreateIndex
CREATE INDEX "_UserOperationalExpenseApprovals_B_index" ON "public"."_UserOperationalExpenseApprovals"("B");

-- CreateIndex
CREATE INDEX "_StaffOperationalExpenseApprovals_B_index" ON "public"."_StaffOperationalExpenseApprovals"("B");

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "public"."GuestUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_accountsCognitoId_fkey" FOREIGN KEY ("accountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoom" ADD CONSTRAINT "ChatRoom_staffCognitoId_fkey" FOREIGN KEY ("staffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailCampaign" ADD CONSTRAINT "EmailCampaign_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailCampaign" ADD CONSTRAINT "EmailCampaign_emailListId_fkey" FOREIGN KEY ("emailListId") REFERENCES "public"."EmailList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "public"."EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailList" ADD CONSTRAINT "EmailList_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailSend" ADD CONSTRAINT "EmailSend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailSend" ADD CONSTRAINT "EmailSend_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "public"."GuestUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailSend" ADD CONSTRAINT "EmailSend_emailCampaignId_fkey" FOREIGN KEY ("emailCampaignId") REFERENCES "public"."EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_createdByUserCognitoId_fkey" FOREIGN KEY ("createdByUserCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_createdByStaffCognitoId_fkey" FOREIGN KEY ("createdByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_approvedByUserCognitoId_fkey" FOREIGN KEY ("approvedByUserCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_approvedByAdminCognitoId_fkey" FOREIGN KEY ("approvedByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_approvedByAccountsCognitoId_fkey" FOREIGN KEY ("approvedByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_approvedByStaffCognitoId_fkey" FOREIGN KEY ("approvedByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_createdByStaffCognitoId_fkey" FOREIGN KEY ("createdByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_approvedByUserCognitoId_fkey" FOREIGN KEY ("approvedByUserCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_approvedByAdminCognitoId_fkey" FOREIGN KEY ("approvedByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_approvedByAccountsCognitoId_fkey" FOREIGN KEY ("approvedByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_approvedByStaffCognitoId_fkey" FOREIGN KEY ("approvedByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientExpense" ADD CONSTRAINT "ClientExpense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_createdByStaffCognitoId_fkey" FOREIGN KEY ("createdByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_approvedByUserCognitoId_fkey" FOREIGN KEY ("approvedByUserCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_approvedByAdminCognitoId_fkey" FOREIGN KEY ("approvedByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_approvedByAccountsCognitoId_fkey" FOREIGN KEY ("approvedByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_approvedByStaffCognitoId_fkey" FOREIGN KEY ("approvedByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "public"."CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_mobileAccountId_fkey" FOREIGN KEY ("mobileAccountId") REFERENCES "public"."MobileAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OperationalExpense" ADD CONSTRAINT "OperationalExpense_otherAccountId_fkey" FOREIGN KEY ("otherAccountId") REFERENCES "public"."OtherAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashAccount" ADD CONSTRAINT "CashAccount_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashAccount" ADD CONSTRAINT "CashAccount_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MobileAccount" ADD CONSTRAINT "MobileAccount_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MobileAccount" ADD CONSTRAINT "MobileAccount_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OtherAccount" ADD CONSTRAINT "OtherAccount_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OtherAccount" ADD CONSTRAINT "OtherAccount_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "public"."OperationalExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_proof_file_id_fkey" FOREIGN KEY ("proof_file_id") REFERENCES "public"."ProofFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_cash_account_id_fkey" FOREIGN KEY ("cash_account_id") REFERENCES "public"."CashAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_mobile_account_id_fkey" FOREIGN KEY ("mobile_account_id") REFERENCES "public"."MobileAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_other_account_id_fkey" FOREIGN KEY ("other_account_id") REFERENCES "public"."OtherAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_createdByAdminCognitoId_fkey" FOREIGN KEY ("createdByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_createdByAccountsCognitoId_fkey" FOREIGN KEY ("createdByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "ProofFile_clientExpenseId_fkey" FOREIGN KEY ("clientExpenseId") REFERENCES "public"."ClientExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "ProofFile_operationalExpenseId_fkey" FOREIGN KEY ("operationalExpenseId") REFERENCES "public"."OperationalExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "ProofFile_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "proof_file_uploaded_user_fkey" FOREIGN KEY ("uploadedByUserCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "proof_file_uploaded_admin_fkey" FOREIGN KEY ("uploadedByAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "proof_file_uploaded_accounts_fkey" FOREIGN KEY ("uploadedByAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProofFile" ADD CONSTRAINT "proof_file_uploaded_staff_fkey" FOREIGN KEY ("uploadedByStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserCognitoId_fkey" FOREIGN KEY ("actorUserCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorAdminCognitoId_fkey" FOREIGN KEY ("actorAdminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorAccountsCognitoId_fkey" FOREIGN KEY ("actorAccountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorStaffCognitoId_fkey" FOREIGN KEY ("actorStaffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_appSettingId_fkey" FOREIGN KEY ("appSettingId") REFERENCES "public"."AppSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_userCognitoId_fkey" FOREIGN KEY ("userCognitoId") REFERENCES "public"."User"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_adminCognitoId_fkey" FOREIGN KEY ("adminCognitoId") REFERENCES "public"."Admin"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_accountsCognitoId_fkey" FOREIGN KEY ("accountsCognitoId") REFERENCES "public"."Accounts"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_staffCognitoId_fkey" FOREIGN KEY ("staffCognitoId") REFERENCES "public"."Staff"("cognitoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminQuotations" ADD CONSTRAINT "_AdminQuotations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminQuotations" ADD CONSTRAINT "_AdminQuotations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminClientExpenses" ADD CONSTRAINT "_AdminClientExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminClientExpenses" ADD CONSTRAINT "_AdminClientExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminOperationalExpenses" ADD CONSTRAINT "_AdminOperationalExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminOperationalExpenses" ADD CONSTRAINT "_AdminOperationalExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminClientExpenseApprovals" ADD CONSTRAINT "_AdminClientExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminClientExpenseApprovals" ADD CONSTRAINT "_AdminClientExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminOperationalExpenseApprovals" ADD CONSTRAINT "_AdminOperationalExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AdminOperationalExpenseApprovals" ADD CONSTRAINT "_AdminOperationalExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsEmailLists" ADD CONSTRAINT "_AccountsEmailLists_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsEmailLists" ADD CONSTRAINT "_AccountsEmailLists_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."EmailList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsQuotations" ADD CONSTRAINT "_AccountsQuotations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsQuotations" ADD CONSTRAINT "_AccountsQuotations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsClientExpenses" ADD CONSTRAINT "_AccountsClientExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsClientExpenses" ADD CONSTRAINT "_AccountsClientExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsOperationalExpenses" ADD CONSTRAINT "_AccountsOperationalExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsOperationalExpenses" ADD CONSTRAINT "_AccountsOperationalExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsClientExpenseApprovals" ADD CONSTRAINT "_AccountsClientExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsClientExpenseApprovals" ADD CONSTRAINT "_AccountsClientExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsOperationalExpenseApprovals" ADD CONSTRAINT "_AccountsOperationalExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AccountsOperationalExpenseApprovals" ADD CONSTRAINT "_AccountsOperationalExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserEmailLists" ADD CONSTRAINT "_UserEmailLists_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."EmailList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserEmailLists" ADD CONSTRAINT "_UserEmailLists_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GuestUserEmailLists" ADD CONSTRAINT "_GuestUserEmailLists_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."EmailList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GuestUserEmailLists" ADD CONSTRAINT "_GuestUserEmailLists_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."GuestUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffEmailLists" ADD CONSTRAINT "_StaffEmailLists_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."EmailList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffEmailLists" ADD CONSTRAINT "_StaffEmailLists_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserQuotations" ADD CONSTRAINT "_UserQuotations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserQuotations" ADD CONSTRAINT "_UserQuotations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffQuotations" ADD CONSTRAINT "_StaffQuotations_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffQuotations" ADD CONSTRAINT "_StaffQuotations_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserClientExpenses" ADD CONSTRAINT "_UserClientExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserClientExpenses" ADD CONSTRAINT "_UserClientExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffClientExpenses" ADD CONSTRAINT "_StaffClientExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffClientExpenses" ADD CONSTRAINT "_StaffClientExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserClientExpenseApprovals" ADD CONSTRAINT "_UserClientExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserClientExpenseApprovals" ADD CONSTRAINT "_UserClientExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffClientExpenseApprovals" ADD CONSTRAINT "_StaffClientExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ClientExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffClientExpenseApprovals" ADD CONSTRAINT "_StaffClientExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserOperationalExpenses" ADD CONSTRAINT "_UserOperationalExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserOperationalExpenses" ADD CONSTRAINT "_UserOperationalExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffOperationalExpenses" ADD CONSTRAINT "_StaffOperationalExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffOperationalExpenses" ADD CONSTRAINT "_StaffOperationalExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserOperationalExpenseApprovals" ADD CONSTRAINT "_UserOperationalExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserOperationalExpenseApprovals" ADD CONSTRAINT "_UserOperationalExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffOperationalExpenseApprovals" ADD CONSTRAINT "_StaffOperationalExpenseApprovals_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."OperationalExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_StaffOperationalExpenseApprovals" ADD CONSTRAINT "_StaffOperationalExpenseApprovals_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
