"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function resetSequence(modelName) {
    return __awaiter(this, void 0, void 0, function* () {
        const quotedModelName = `"${modelName}"`;
        const modelNameCamel = toCamelCase(modelName);
        const model = prisma[modelNameCamel];
        if (!model) {
            console.warn(`Model ${modelName} not found in Prisma client.`);
            return;
        }
        try {
            const maxIdResult = yield model.findMany({
                select: { id: true },
                orderBy: { id: "desc" },
                take: 1,
            });
            const nextId = maxIdResult.length === 0 ? 1 : maxIdResult[0].id + 1;
            yield prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('${quotedModelName}', 'id'), ${nextId}, false);
    `);
            console.log(`Reset sequence for ${modelName} to ${nextId}`);
        }
        catch (error) {
            console.error(`Failed to reset sequence for ${modelName}:`, error);
        }
    });
}
function deleteAllData(modelNames) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const modelName of modelNames.reverse()) {
            const modelNameCamel = toCamelCase(modelName);
            const quotedModelName = `"${modelName}"`;
            const model = prisma[modelNameCamel];
            if (!model) {
                console.warn(`Model ${modelName} not found.`);
                continue;
            }
            try {
                yield model.deleteMany({});
                console.log(`Cleared ${modelName}`);
                yield prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('${quotedModelName}', 'id'), 1, false);
      `);
                console.log(`Reset sequence for ${modelName} to 1`);
            }
            catch (error) {
                console.error(`Failed to clear ${modelName}:`, error);
            }
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const dataDirectory = path_1.default.join(__dirname, "seedData");
        const orderedModelFiles = [
            "admin.json",
            "user.json",
            "accounts.json",
            "staff.json",
            "guestUser.json",
            "supplier.json",
            "bankAccount.json",
            "blog.json",
            "contact.json",
            "emailList.json",
            "emailCampaign.json",
            "attachment.json",
            "chatRoom.json",
            "chatMessage.json",
            "emailSend.json",
            "quotation.json",
            "proofFile.json",
            "clientExpense.json",
            "operationalExpense.json",
            "transaction.json",
            "auditLog.json",
        ];
        yield deleteAllData(orderedModelFiles.map((f) => toPascalCase(path_1.default.basename(f, ".json"))));
        const validAdminCognitoIds = new Set();
        const validUserCognitoIds = new Set();
        const validAccountsCognitoIds = new Set();
        const validStaffCognitoIds = new Set();
        const validGuestUserIds = new Set();
        const validSupplierIds = new Set();
        const validBankAccountIds = new Set();
        const validQuotationIds = new Set();
        const validClientExpenseIds = new Set();
        const validOperationalExpenseIds = new Set();
        const validProofFileIds = new Set();
        const validTransactionIds = new Set();
        const validUserIds = new Set();
        // Seed Admin, User, Accounts, Staff, GuestUser, Supplier, and BankAccount first to collect valid IDs
        for (const fileName of ["admin.json", "user.json", "accounts.json", "staff.json", "guestUser.json", "supplier.json", "bankAccount.json"]) {
            const filePath = path_1.default.join(dataDirectory, fileName);
            if (!fs_1.default.existsSync(filePath)) {
                console.warn(`File ${fileName} not found, skipping.`);
                continue;
            }
            const jsonData = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
            const modelName = toPascalCase(path_1.default.basename(fileName, ".json"));
            const modelNameCamel = toCamelCase(modelName);
            const model = prisma[modelNameCamel];
            if (!model) {
                console.warn(`Model ${modelName} not found in Prisma client.`);
                continue;
            }
            for (const item of jsonData) {
                try {
                    const created = yield model.create({ data: item });
                    if (modelName === "Admin") {
                        validAdminCognitoIds.add(item.cognitoId);
                    }
                    else if (modelName === "User") {
                        validUserCognitoIds.add(item.cognitoId);
                        validUserIds.add(created.id);
                    }
                    else if (modelName === "Accounts") {
                        validAccountsCognitoIds.add(item.cognitoId);
                    }
                    else if (modelName === "Staff") {
                        validStaffCognitoIds.add(item.cognitoId);
                    }
                    else if (modelName === "GuestUser") {
                        validGuestUserIds.add(created.id);
                    }
                    else if (modelName === "Supplier") {
                        validSupplierIds.add(created.id);
                    }
                    else if (modelName === "BankAccount") {
                        validBankAccountIds.add(created.id);
                    }
                }
                catch (error) {
                    console.error(`Error creating ${modelName} record: ${JSON.stringify(item, null, 2)}`, error);
                }
            }
            console.log(`Seeded ${modelName} with ${jsonData.length} records`);
            if (modelName === "User") {
                console.log("Valid User Cognito IDs:", Array.from(validUserCognitoIds));
                console.log("Valid User IDs:", Array.from(validUserIds));
            }
            yield resetSequence(modelName);
            yield sleep(500);
        }
        // Seed remaining models with strict validation
        for (const fileName of orderedModelFiles.slice(7)) {
            const filePath = path_1.default.join(dataDirectory, fileName);
            if (!fs_1.default.existsSync(filePath)) {
                console.warn(`File ${fileName} not found, skipping.`);
                continue;
            }
            const jsonData = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
            const modelName = toPascalCase(path_1.default.basename(fileName, ".json"));
            const modelNameCamel = toCamelCase(modelName);
            const model = prisma[modelNameCamel];
            if (!model) {
                console.warn(`Model ${modelName} not found in Prisma client.`);
                continue;
            }
            let validData = jsonData;
            if (modelName === "EmailSend") {
                const validStatuses = ["PENDING", "SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "FAILED", "UNSUBSCRIBED", "SPAM"];
                validData = jsonData.filter((item) => {
                    const isValidGuestUserId = !item.guestUserId || validGuestUserIds.has(item.guestUserId);
                    const isValidUserId = !item.userId || validUserIds.has(item.userId);
                    const isValidEmailCampaignId = item.emailCampaignId && (item.emailCampaignId === 1 || item.emailCampaignId === 2);
                    const isValidStatus = validStatuses.includes(item.status);
                    if (!isValidGuestUserId) {
                        console.warn(`Invalid guestUserId in EmailSend: ${item.guestUserId}`);
                    }
                    if (!isValidUserId) {
                        console.warn(`Invalid userId in EmailSend: ${item.userId}`);
                    }
                    if (!isValidEmailCampaignId) {
                        console.warn(`Invalid emailCampaignId in EmailSend: ${item.emailCampaignId}`);
                    }
                    if (!isValidStatus) {
                        console.warn(`Invalid status in EmailSend: ${item.status}`);
                    }
                    return isValidGuestUserId && isValidUserId && isValidEmailCampaignId && isValidStatus;
                });
            }
            if (modelName === "Quotation") {
                const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
                validData = jsonData.filter((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                    const hasValidCreatedBy = (((_b = (_a = item.createdByUser) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.cognitoId) && validUserCognitoIds.has(item.createdByUser.connect.cognitoId)) ||
                        (((_d = (_c = item.createdByAdmin) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.cognitoId) && validAdminCognitoIds.has(item.createdByAdmin.connect.cognitoId)) ||
                        (((_f = (_e = item.createdByAccounts) === null || _e === void 0 ? void 0 : _e.connect) === null || _f === void 0 ? void 0 : _f.cognitoId) && validAccountsCognitoIds.has(item.createdByAccounts.connect.cognitoId)) ||
                        (((_h = (_g = item.createdByStaff) === null || _g === void 0 ? void 0 : _g.connect) === null || _h === void 0 ? void 0 : _h.cognitoId) && validStaffCognitoIds.has(item.createdByStaff.connect.cognitoId));
                    const hasValidApprovedBy = (!((_k = (_j = item.approvedByUser) === null || _j === void 0 ? void 0 : _j.connect) === null || _k === void 0 ? void 0 : _k.cognitoId) || validUserCognitoIds.has(item.approvedByUser.connect.cognitoId)) &&
                        (!((_m = (_l = item.approvedByAdmin) === null || _l === void 0 ? void 0 : _l.connect) === null || _m === void 0 ? void 0 : _m.cognitoId) || validAdminCognitoIds.has(item.approvedByAdmin.connect.cognitoId)) &&
                        (!((_p = (_o = item.approvedByAccounts) === null || _o === void 0 ? void 0 : _o.connect) === null || _p === void 0 ? void 0 : _p.cognitoId) || validAccountsCognitoIds.has(item.approvedByAccounts.connect.cognitoId)) &&
                        (!((_r = (_q = item.approvedByStaff) === null || _q === void 0 ? void 0 : _q.connect) === null || _r === void 0 ? void 0 : _r.cognitoId) || validStaffCognitoIds.has(item.approvedByStaff.connect.cognitoId));
                    const isValidStatus = validStatuses.includes(item.status);
                    const isValidProofFiles = item.proofFiles && (item.proofFiles.connect || item.proofFiles.create) || !item.proofFiles;
                    if (!hasValidCreatedBy) {
                        console.warn(`Invalid createdBy in Quotation: ${JSON.stringify(item.createdByUser || item.createdByAdmin || item.createdByAccounts || item.createdByStaff)}`);
                    }
                    if (!hasValidApprovedBy) {
                        console.warn(`Invalid approvedBy in Quotation: ${JSON.stringify(item.approvedByUser || item.approvedByAdmin || item.approvedByAccounts || item.approvedByStaff)}`);
                    }
                    if (!isValidStatus) {
                        console.warn(`Invalid status in Quotation: ${item.status}`);
                    }
                    if (!isValidProofFiles) {
                        console.warn(`Invalid proofFiles in Quotation: ${JSON.stringify(item.proofFiles)}`);
                    }
                    return hasValidCreatedBy && hasValidApprovedBy && isValidStatus && isValidProofFiles;
                });
            }
            if (modelName === "ProofFile") {
                const validExpenseTypes = ["CLIENT", "OPERATIONAL"];
                validData = jsonData.filter((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                    const hasValidUploadedBy = (((_b = (_a = item.uploadedByUser) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.cognitoId) && validUserCognitoIds.has(item.uploadedByUser.connect.cognitoId)) ||
                        (((_d = (_c = item.uploadedByAdmin) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.cognitoId) && validAdminCognitoIds.has(item.uploadedByAdmin.connect.cognitoId)) ||
                        (((_f = (_e = item.uploadedByAccounts) === null || _e === void 0 ? void 0 : _e.connect) === null || _f === void 0 ? void 0 : _f.cognitoId) && validAccountsCognitoIds.has(item.uploadedByAccounts.connect.cognitoId)) ||
                        (((_h = (_g = item.uploadedByStaff) === null || _g === void 0 ? void 0 : _g.connect) === null || _h === void 0 ? void 0 : _h.cognitoId) && validStaffCognitoIds.has(item.uploadedByStaff.connect.cognitoId));
                    const hasValidCreatedBy = (((_k = (_j = item.createdByUser) === null || _j === void 0 ? void 0 : _j.connect) === null || _k === void 0 ? void 0 : _k.cognitoId) && validUserCognitoIds.has(item.createdByUser.connect.cognitoId)) ||
                        (((_m = (_l = item.createdByAdmin) === null || _l === void 0 ? void 0 : _l.connect) === null || _m === void 0 ? void 0 : _m.cognitoId) && validAdminCognitoIds.has(item.createdByAdmin.connect.cognitoId)) ||
                        (((_p = (_o = item.createdByAccounts) === null || _o === void 0 ? void 0 : _o.connect) === null || _p === void 0 ? void 0 : _p.cognitoId) && validAccountsCognitoIds.has(item.createdByAccounts.connect.cognitoId)) ||
                        (((_r = (_q = item.createdByStaff) === null || _q === void 0 ? void 0 : _q.connect) === null || _r === void 0 ? void 0 : _r.cognitoId) && validStaffCognitoIds.has(item.createdByStaff.connect.cognitoId));
                    const isValidExpenseType = !item.expenseType || validExpenseTypes.includes(item.expenseType);
                    const isValidClientExpenseId = !item.clientExpenseId || validClientExpenseIds.has(item.clientExpenseId);
                    const isValidOperationalExpenseId = !item.operationalExpenseId || validOperationalExpenseIds.has(item.operationalExpenseId);
                    const isValidQuotationId = !item.quotationId || validQuotationIds.has(item.quotationId);
                    if (!hasValidUploadedBy) {
                        console.warn(`Invalid uploadedBy in ProofFile: ${JSON.stringify(item.uploadedByUser || item.uploadedByAdmin || item.uploadedByAccounts || item.uploadedByStaff)}`);
                    }
                    if (!hasValidCreatedBy) {
                        console.warn(`Invalid createdBy in ProofFile: ${JSON.stringify(item.createdByUser || item.createdByAdmin || item.createdByAccounts || item.createdByStaff)}`);
                    }
                    if (!isValidExpenseType) {
                        console.warn(`Invalid expenseType in ProofFile: ${item.expenseType}`);
                    }
                    if (!isValidClientExpenseId) {
                        console.warn(`Invalid clientExpenseId in ProofFile: ${item.clientExpenseId}`);
                    }
                    if (!isValidOperationalExpenseId) {
                        console.warn(`Invalid operationalExpenseId in ProofFile: ${item.operationalExpenseId}`);
                    }
                    if (!isValidQuotationId) {
                        console.warn(`Invalid quotationId in ProofFile: ${item.quotationId}`);
                    }
                    return (hasValidUploadedBy &&
                        hasValidCreatedBy &&
                        isValidExpenseType &&
                        isValidClientExpenseId &&
                        isValidOperationalExpenseId &&
                        isValidQuotationId);
                });
            }
            if (modelName === "ClientExpense") {
                const validExpenseChecks = ["IDENTITY", "ACADEMIC", "PROFESSIONAL", "ADDRESS", "FINGERPRINT", "PCC_FAST_TRACK", "CERTIFICATE_VERIFICATION", "OTHERS"];
                const validPaymentModes = ["MPESA_PAYBILL", "BANK_DEPOSIT", "VISA_CARD", "CASH"];
                const validPaymentStatuses = ["PENDING", "PAID", "FAILED"];
                validData = jsonData.filter((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                    const hasValidCreatedBy = (((_b = (_a = item.createdByAdmin) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.cognitoId) && validAdminCognitoIds.has(item.createdByAdmin.connect.cognitoId)) ||
                        (((_d = (_c = item.createdByAccounts) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.cognitoId) && validAccountsCognitoIds.has(item.createdByAccounts.connect.cognitoId)) ||
                        (((_f = (_e = item.createdByStaff) === null || _e === void 0 ? void 0 : _e.connect) === null || _f === void 0 ? void 0 : _f.cognitoId) && validStaffCognitoIds.has(item.createdByStaff.connect.cognitoId));
                    const hasValidApprovedBy = (!((_h = (_g = item.approvedByUser) === null || _g === void 0 ? void 0 : _g.connect) === null || _h === void 0 ? void 0 : _h.cognitoId) || validUserCognitoIds.has(item.approvedByUser.connect.cognitoId)) &&
                        (!((_k = (_j = item.approvedByAdmin) === null || _j === void 0 ? void 0 : _j.connect) === null || _k === void 0 ? void 0 : _k.cognitoId) || validAdminCognitoIds.has(item.approvedByAdmin.connect.cognitoId)) &&
                        (!((_m = (_l = item.approvedByAccounts) === null || _l === void 0 ? void 0 : _l.connect) === null || _m === void 0 ? void 0 : _m.cognitoId) || validAccountsCognitoIds.has(item.approvedByAccounts.connect.cognitoId)) &&
                        (!((_p = (_o = item.approvedByStaff) === null || _o === void 0 ? void 0 : _o.connect) === null || _p === void 0 ? void 0 : _p.cognitoId) || validStaffCognitoIds.has(item.approvedByStaff.connect.cognitoId));
                    const isValidExpenseCheck = validExpenseChecks.includes(item.expenseCheck);
                    const isValidPaymentMode = validPaymentModes.includes(item.paymentMode);
                    const isValidPaymentStatus = validPaymentStatuses.includes(item.paymentStatus);
                    const isValidSupplier = !item.supplier || (((_r = (_q = item.supplier) === null || _q === void 0 ? void 0 : _q.connect) === null || _r === void 0 ? void 0 : _r.id) && validSupplierIds.has(item.supplier.connect.id));
                    const isValidAdminClientExpenses = item.adminClientExpenses && (item.adminClientExpenses.connect || item.adminClientExpenses.create) || !item.adminClientExpenses;
                    const isValidAccountsClientExpenses = item.accountsClientExpenses && (item.accountsClientExpenses.connect || item.accountsClientExpenses.create) || !item.accountsClientExpenses;
                    const isValidStaffClientExpenses = item.staffClientExpenses && (item.staffClientExpenses.connect || item.staffClientExpenses.create) || !item.staffClientExpenses;
                    const isValidAdminApprovals = item.adminApprovals && (item.adminApprovals.connect || item.adminApprovals.create) || !item.adminApprovals;
                    const isValidAccountsApprovals = item.accountsApprovals && (item.accountsApprovals.connect || item.accountsApprovals.create) || !item.accountsApprovals;
                    const isValidStaffApprovals = item.staffApprovals && (item.staffApprovals.connect || item.staffApprovals.create) || !item.staffApprovals;
                    const isValidProofFiles = item.proofFiles && (item.proofFiles.connect || item.proofFiles.create) || !item.proofFiles;
                    if (!hasValidCreatedBy) {
                        console.warn(`Invalid createdBy in ClientExpense: ${JSON.stringify(item.createdByAdmin || item.createdByAccounts || item.createdByStaff)}`);
                    }
                    if (!hasValidApprovedBy) {
                        console.warn(`Invalid approvedBy in ClientExpense: ${JSON.stringify(item.approvedByUser || item.approvedByAdmin || item.approvedByAccounts || item.approvedByStaff)}`);
                    }
                    if (!isValidExpenseCheck) {
                        console.warn(`Invalid expenseCheck in ClientExpense: ${item.expenseCheck}`);
                    }
                    if (!isValidPaymentMode) {
                        console.warn(`Invalid paymentMode in ClientExpense: ${item.paymentMode}`);
                    }
                    if (!isValidPaymentStatus) {
                        console.warn(`Invalid paymentStatus in ClientExpense: ${item.paymentStatus}`);
                    }
                    if (!isValidSupplier) {
                        console.warn(`Invalid supplier in ClientExpense: ${JSON.stringify(item.supplier)}`);
                    }
                    return (hasValidCreatedBy &&
                        hasValidApprovedBy &&
                        isValidExpenseCheck &&
                        isValidPaymentMode &&
                        isValidPaymentStatus &&
                        isValidSupplier &&
                        isValidAdminClientExpenses &&
                        isValidAccountsClientExpenses &&
                        isValidStaffClientExpenses &&
                        isValidAdminApprovals &&
                        isValidAccountsApprovals &&
                        isValidStaffApprovals &&
                        isValidProofFiles);
                });
            }
            if (modelName === "OperationalExpense") {
                const validFrequencies = ["MONTHLY", "QUARTERLY", "YEARLY", "WEEKLY", "ONCE_OFF"];
                const validPaymentModes = ["MPESA_PAYBILL", "BANK_DEPOSIT", "VISA_CARD", "CASH"];
                const validPaymentStatuses = ["PENDING", "PAID", "FAILED"];
                const validExpenseStatuses = ["PENDING", "APPROVED", "CANCELLED", "DRAFT"];
                const validItemTypes = ["GOODS", "SERVICES"];
                const validAccountTypes = [
                    "RENT_EXPENSE",
                    "REPAIR_AND_MAINTENANCE",
                    "SALARIES_AND_EMPLOYEE_WAGES",
                    "TELEPHONE_EXPENSE",
                    "TRAVEL_EXPENSE",
                    "UTILITIES_EXPENSE",
                    "OFFICE_SUPPLIES_EXPENSE",
                    "INSURANCE_EXPENSE",
                    "ADVERTISING_AND_MARKETING_EXPENSE",
                    "TRAINING_AND_DEVELOPMENT_EXPENSE",
                    "PROFESSIONAL_FEES",
                    "DEPRECIATION_EXPENSE",
                    "BANK_CHARGES_AND_FEES",
                    "VEHICLE_RUNNING_AND_MAINTENANCE_EXPENSE",
                    "MISCELLANEOUS_EXPENSE",
                ];
                validData = jsonData.filter((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                    const hasValidCreatedBy = (((_b = (_a = item.createdByAdmin) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.cognitoId) && validAdminCognitoIds.has(item.createdByAdmin.connect.cognitoId)) ||
                        (((_d = (_c = item.createdByAccounts) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.cognitoId) && validAccountsCognitoIds.has(item.createdByAccounts.connect.cognitoId)) ||
                        (((_f = (_e = item.createdByStaff) === null || _e === void 0 ? void 0 : _e.connect) === null || _f === void 0 ? void 0 : _f.cognitoId) && validStaffCognitoIds.has(item.createdByStaff.connect.cugnoId));
                    const hasValidApprovedBy = (!((_h = (_g = item.approvedByUser) === null || _g === void 0 ? void 0 : _g.connect) === null || _h === void 0 ? void 0 : _h.cognitoId) || validUserCognitoIds.has(item.approvedByUser.connect.cognitoId)) &&
                        (!((_k = (_j = item.approvedByAdmin) === null || _j === void 0 ? void 0 : _j.connect) === null || _k === void 0 ? void 0 : _k.cognitoId) || validAdminCognitoIds.has(item.approvedByAdmin.connect.cognitoId)) &&
                        (!((_m = (_l = item.approvedByAccounts) === null || _l === void 0 ? void 0 : _l.connect) === null || _m === void 0 ? void 0 : _m.cognitoId) || validAccountsCognitoIds.has(item.approvedByAccounts.connect.cognitoId)) &&
                        (!((_p = (_o = item.approvedByStaff) === null || _o === void 0 ? void 0 : _o.connect) === null || _p === void 0 ? void 0 : _p.cognitoId) || validStaffCognitoIds.has(item.approvedByStaff.connect.cognitoId));
                    const isValidFrequency = validFrequencies.includes(item.frequency);
                    const isValidPaymentMode = validPaymentModes.includes(item.paymentMode);
                    const isValidPaymentStatus = validPaymentStatuses.includes(item.paymentStatus);
                    const isValidExpenseStatus = validExpenseStatuses.includes(item.expenseStatus);
                    const isValidSupplier = !item.supplier || (((_r = (_q = item.supplier) === null || _q === void 0 ? void 0 : _q.connect) === null || _r === void 0 ? void 0 : _r.id) && validSupplierIds.has(item.supplier.connect.id));
                    const isValidItemType = !item.itemType || validItemTypes.includes(item.itemType);
                    const isValidAccountType = !item.accountType || validAccountTypes.includes(item.accountType);
                    if (!hasValidCreatedBy) {
                        console.warn(`Invalid createdBy in OperationalExpense: ${JSON.stringify(item.createdByAdmin || item.createdByAccounts || item.createdByStaff)}`);
                    }
                    if (!hasValidApprovedBy) {
                        console.warn(`Invalid approvedBy in OperationalExpense: ${JSON.stringify(item.approvedByUser || item.approvedByAdmin || item.approvedByAccounts || item.approvedByStaff)}`);
                    }
                    if (!isValidFrequency) {
                        console.warn(`Invalid frequency in OperationalExpense: ${item.frequency}`);
                    }
                    if (!isValidPaymentMode) {
                        console.warn(`Invalid paymentMode in OperationalExpense: ${item.paymentMode}`);
                    }
                    if (!isValidPaymentStatus) {
                        console.warn(`Invalid paymentStatus in OperationalExpense: ${item.paymentStatus}`);
                    }
                    if (!isValidExpenseStatus) {
                        console.warn(`Invalid expenseStatus in OperationalExpense: ${item.expenseStatus}`);
                    }
                    if (!isValidSupplier) {
                        console.warn(`Invalid supplier in OperationalExpense: ${JSON.stringify(item.supplier)}`);
                    }
                    if (!isValidItemType) {
                        console.warn(`Invalid itemType in OperationalExpense: ${item.itemType}`);
                    }
                    if (!isValidAccountType) {
                        console.warn(`Invalid accountType in OperationalExpense: ${item.accountType}`);
                    }
                    return (hasValidCreatedBy &&
                        hasValidApprovedBy &&
                        isValidFrequency &&
                        isValidPaymentMode &&
                        isValidPaymentStatus &&
                        isValidExpenseStatus &&
                        isValidSupplier &&
                        isValidItemType &&
                        isValidAccountType);
                });
            }
            if (modelName === "Transaction") {
                validData = jsonData.filter((item) => {
                    var _a, _b, _c, _d;
                    const hasValidCreatedBy = (((_b = (_a = item.createdByAdmin) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.cognitoId) && validAdminCognitoIds.has(item.createdByAdmin.connect.cognitoId)) ||
                        (((_d = (_c = item.createdByAccounts) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.cognitoId) && validAccountsCognitoIds.has(item.createdByAccounts.connect.cognitoId));
                    const isValidExpenseId = !item.expenseId || validOperationalExpenseIds.has(item.expenseId);
                    const isValidProofFileId = !item.proofFileId || validProofFileIds.has(item.proofFileId);
                    const isValidBankAccountId = !item.bankAccountId || validBankAccountIds.has(item.bankAccountId);
                    if (!hasValidCreatedBy) {
                        console.warn(`Invalid createdBy in Transaction: ${JSON.stringify(item.createdByAdmin || item.createdByAccounts)}`);
                    }
                    if (!isValidExpenseId) {
                        console.warn(`Invalid expenseId in Transaction: ${item.expenseId}`);
                    }
                    if (!isValidProofFileId) {
                        console.warn(`Invalid proofFileId in Transaction: ${item.proofFileId}`);
                    }
                    if (!isValidBankAccountId) {
                        console.warn(`Invalid bankAccountId in Transaction: ${item.bankAccountId}`);
                    }
                    return hasValidCreatedBy && isValidExpenseId && isValidProofFileId && isValidBankAccountId;
                });
            }
            if (modelName === "AuditLog") {
                validData = jsonData.filter((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    const hasValidActor = (((_b = (_a = item.actorAdmin) === null || _a === void 0 ? void 0 : _a.connect) === null || _b === void 0 ? void 0 : _b.cognitoId) && validAdminCognitoIds.has(item.actorAdmin.connect.cognitoId)) ||
                        (((_d = (_c = item.actorAccounts) === null || _c === void 0 ? void 0 : _c.connect) === null || _d === void 0 ? void 0 : _d.cognitoId) && validAccountsCognitoIds.has(item.actorAccounts.connect.cognitoId)) ||
                        (((_f = (_e = item.actorStaff) === null || _e === void 0 ? void 0 : _e.connect) === null || _f === void 0 ? void 0 : _f.cognitoId) && validStaffCognitoIds.has(item.actorStaff.connect.cognitoId)) ||
                        (((_h = (_g = item.actorUser) === null || _g === void 0 ? void 0 : _g.connect) === null || _h === void 0 ? void 0 : _h.cognitoId) && validUserCognitoIds.has(item.actorUser.connect.cognitoId));
                    const isValidEntity = item.entity !== "LPO" && ["ClientExpense", "OperationalExpense", "Quotation", "EmailCampaign", "Blog"].includes(item.entity);
                    if (!hasValidActor) {
                        console.warn(`Invalid actor in AuditLog: ${JSON.stringify(item.actorAdmin || item.actorAccounts || item.actorStaff || item.actorUser)}`);
                    }
                    if (!isValidEntity) {
                        console.warn(`Invalid entity in AuditLog: ${item.entity}`);
                    }
                    return hasValidActor && isValidEntity;
                });
            }
            try {
                for (const item of validData) {
                    console.log(`Attempting to create ${modelName} record: ${JSON.stringify(item, null, 2)}`);
                    const created = yield model.create({ data: item });
                    if (modelName === "Quotation") {
                        validQuotationIds.add(created.id);
                    }
                    else if (modelName === "ClientExpense") {
                        validClientExpenseIds.add(created.id);
                    }
                    else if (modelName === "OperationalExpense") {
                        validOperationalExpenseIds.add(created.id);
                    }
                    else if (modelName === "ProofFile") {
                        validProofFileIds.add(created.id);
                    }
                    else if (modelName === "Transaction") {
                        validTransactionIds.add(created.id);
                    }
                }
                console.log(`Seeded ${modelName} with ${validData.length} records`);
                if (validData.length < jsonData.length) {
                    console.warn(`Skipped ${jsonData.length - validData.length} invalid records for ${modelName}`);
                }
                yield resetSequence(modelName);
            }
            catch (error) {
                console.error(`Error seeding ${modelName}:`, error);
            }
            yield sleep(500);
        }
        // Post-seeding: Link ProofFile to ClientExpense, Quotation, and Transaction
        try {
            const quotation1 = yield prisma.quotation.findFirst({ where: { quotationNumber: "QUO-2025-0001" } });
            const clientExpense2 = yield prisma.clientExpense.findFirst({ where: { candidateName: "Jane Roe" } });
            const operationalExpense1 = yield prisma.operationalExpense.findFirst({ where: { referenceNumber: "EXP-2025-001" } });
            const bankAccount1 = yield prisma.bankAccount.findFirst({ where: { accountNumber: "1234567890" } });
            if (clientExpense2) {
                const proofFile = yield prisma.proofFile.findFirst({ where: { s3Key: "proofs/expense_2_proof.pdf" } });
                if (proofFile) {
                    yield prisma.proofFile.update({
                        where: { id: proofFile.id },
                        data: { clientExpenseId: clientExpense2.id },
                    });
                    console.log(`Linked ProofFile ID ${proofFile.id} to ClientExpense ID ${clientExpense2.id}`);
                }
                else {
                    console.warn(`ProofFile with s3Key proofs/expense_2_proof.pdf not found`);
                }
            }
            if (quotation1) {
                const proofFile = yield prisma.proofFile.findFirst({ where: { s3Key: "proofs/quotation/2025/0001.pdf" } });
                if (proofFile) {
                    yield prisma.proofFile.update({
                        where: { id: proofFile.id },
                        data: { quotationId: quotation1.id },
                    });
                    console.log(`Linked ProofFile ID ${proofFile.id} to Quotation ID ${quotation1.id}`);
                }
                else {
                    console.warn(`ProofFile with s3Key proofs/quotation/2025/0001.pdf not found`);
                }
            }
            if (operationalExpense1 && bankAccount1) {
                const proofFile = yield prisma.proofFile.findFirst({ where: { s3Key: "proofs/transaction_1_proof.pdf" } });
                if (proofFile) {
                    const transaction = yield prisma.transaction.findFirst({ where: { checkoutRequestId: "TXN-2025-001" } });
                    if (transaction) {
                        yield prisma.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                proofFileId: proofFile.id,
                                expenseId: operationalExpense1.id,
                                bankAccountId: bankAccount1.id,
                            },
                        });
                        console.log(`Linked Transaction ID ${transaction.id} to ProofFile ID ${proofFile.id}, OperationalExpense ID ${operationalExpense1.id}, and BankAccount ID ${bankAccount1.id}`);
                    }
                    else {
                        console.warn(`Transaction with checkoutRequestId TXN-2025-001 not found`);
                    }
                }
                else {
                    console.warn(`ProofFile with s3Key proofs/transaction_1_proof.pdf not found`);
                }
            }
        }
        catch (error) {
            console.error("Error linking relationships:", error);
        }
    });
}
main()
    .catch((e) => console.error("Seeding failed:", e))
    .finally(() => __awaiter(void 0, void 0, void 0, function* () { return yield prisma.$disconnect(); }));
