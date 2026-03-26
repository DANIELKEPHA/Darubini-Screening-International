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
exports.downloadOperationalExpensePdf = exports.deleteOperationalExpense = exports.approveOperationalExpense = exports.reverseAndEditOperationalExpense = exports.reverseOperationalExpense = exports.updateOperationalExpense = exports.getOperationalExpense = exports.getOperationalExpenses = exports.createDraftOperationalExpense = exports.createOperationalExpense = exports.validateAccount = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const node_stream_1 = require("node:stream");
const prisma = new client_1.PrismaClient();
// Define actorFieldMap at module scope
const actorFieldMap = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
    user: "actorUserCognitoId",
};
// Helper function for input validation (unchanged)
const validateString = (value, maxLength, fieldName) => {
    if (value === undefined || value === null)
        return null;
    if (typeof value !== "string" || value.length > maxLength || value.trim() === "") {
        throw new Error(`${fieldName} must be a non-empty string, ${maxLength} characters or less`);
    }
    return (0, sanitize_html_1.default)(value.trim());
};
const validateKraPin = (kraPin) => {
    if (kraPin === undefined || kraPin === null)
        return null;
    if (typeof kraPin !== "string" || kraPin.length !== 11 || !/^[A-Za-z0-9]+$/.test(kraPin)) {
        throw new Error("KRA PIN must be an 11-character alphanumeric string or null");
    }
    return (0, sanitize_html_1.default)(kraPin);
};
const validateAmount = (amount, fieldName) => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
        throw new Error(`${fieldName} must be a positive number`);
    }
    return num;
};
const validateDate = (date) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
    }
    return parsedDate;
};
const validateAccount = (bankAccountId, cashAccountId, mobileAccountId, otherAccountId, currency) => __awaiter(void 0, void 0, void 0, function* () {
    const accountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
    if (accountIds.length > 1) {
        console.error('Multiple account IDs provided:', { accountIds });
        throw new Error(`Only one account ID can be provided: ${JSON.stringify(accountIds)}`);
    }
    if (accountIds.length === 0) {
        return;
    }
    const accountId = accountIds[0];
    let account;
    let accountType;
    if (bankAccountId) {
        account = yield prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
        accountType = 'BankAccount';
    }
    else if (cashAccountId) {
        account = yield prisma.cashAccount.findUnique({ where: { id: cashAccountId } });
        accountType = 'CashAccount';
    }
    else if (mobileAccountId) {
        account = yield prisma.mobileAccount.findUnique({ where: { id: mobileAccountId } });
        accountType = 'MobileAccount';
    }
    else {
        account = yield prisma.otherAccount.findUnique({ where: { id: otherAccountId } });
        accountType = 'OtherAccount';
    }
    if (!account) {
        throw new Error(`Invalid or non-existent ${accountType} ID ${accountId}`);
    }
    if (account.currency !== currency) {
        throw new Error(`Account currency (${account.currency}) must match expense currency (${currency})`);
    }
});
exports.validateAccount = validateAccount;
const createAuditLog = (action_1, entityId_1, role_1, cognitoId_1, expense_1, ...args_1) => __awaiter(void 0, [action_1, entityId_1, role_1, cognitoId_1, expense_1, ...args_1], void 0, function* (action, entityId, role, cognitoId, expense, extraMeta = {}) {
    const actorFieldMap = {
        admin: "actorAdminCognitoId",
        accounts: "actorAccountsCognitoId",
        staff: "actorStaffCognitoId",
        user: "actorUserCognitoId",
    };
    try {
        yield prisma.auditLog.create({
            data: {
                action,
                entity: "OperationalExpense",
                entityId,
                meta: Object.assign({ expenseName: expense.expenseName, amount: expense.amount.toString(), currency: expense.currency, itemType: expense.itemType, accountType: expense.accountType, bankAccountId: expense.bankAccountId, cashAccountId: expense.cashAccountId, mobileAccountId: expense.mobileAccountId, otherAccountId: expense.otherAccountId, role,
                    cognitoId }, extraMeta),
                [actorFieldMap[role]]: cognitoId,
            },
        });
    }
    catch (auditError) {
        console.warn(`Failed to create audit log for ${action}:`, {
            message: auditError instanceof Error ? auditError.message : "Unknown error",
            stack: auditError instanceof Error ? auditError.stack : undefined,
            entityId,
            timestamp: new Date().toISOString(),
        });
    }
});
const createOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { agentName, kraPin, date, expenseDetails, expenseName, institutionName, frequency, paymentMode, paymentModeDescription, amount, currency, totalAmountPaid, supplierId, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, isDraft = false, itemType, accountType, } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({
                message: `Access denied: Role ${role} not authorized to create operational expenses`,
            });
            return;
        }
        const sanitizedAgentName = validateString(agentName, 100, "Agent name");
        const sanitizedKraPin = validateKraPin(kraPin);
        const parsedDate = validateDate(date);
        const sanitizedExpenseDetails = validateString(expenseDetails, 1000, "Expense details");
        const sanitizedExpenseName = validateString(expenseName, 100, "Expense name");
        const sanitizedInstitutionName = validateString(institutionName, 100, "Institution name");
        // Removed: const sanitizedReason = validateString(reasonForPayment, 500, "Reason for payment");
        const sanitizedAmount = validateAmount(amount, "Amount");
        const sanitizedTotalAmountPaid = totalAmountPaid !== undefined
            ? validateAmount(totalAmountPaid, "Total amount paid")
            : sanitizedAmount;
        if (role === "admin") {
            if (!frequency || !Object.values(client_1.Frequency).includes(frequency)) {
                throw new Error("Invalid or missing frequency");
            }
            if (!paymentMode || !Object.values(client_1.PaymentMode).includes(paymentMode)) {
                throw new Error("Invalid or missing payment mode");
            }
            const sanitizedPaymentModeDesc = validateString(paymentModeDescription, 500, "Payment mode description");
            const sanitizedCurrency = validateString(currency, 10, "Currency");
            if (sanitizedCurrency && sanitizedCurrency.length < 3) {
                throw new Error("Currency must be at least 3 characters");
            }
        }
        if (itemType && !Object.values(client_1.ItemType).includes(itemType)) {
            throw new Error("Invalid item type");
        }
        if (accountType && !Object.values(client_1.AccountType).includes(accountType)) {
            throw new Error("Invalid account type");
        }
        const effectiveCurrency = role === "admin" && currency ? currency : "KES";
        yield (0, exports.validateAccount)(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);
        const data = {
            agentName: sanitizedAgentName,
            kraPin: sanitizedKraPin,
            date: parsedDate,
            expenseDetails: sanitizedExpenseDetails,
            expenseName: sanitizedExpenseName,
            institutionName: sanitizedInstitutionName,
            frequency: role === "admin" && frequency ? frequency : client_1.Frequency.ONCE_OFF,
            paymentMode: role === "admin" && paymentMode ? paymentMode : client_1.PaymentMode.CASH,
            paymentModeDescription: role === "admin" && paymentModeDescription
                ? paymentModeDescription
                : "Pending payment mode description",
            amount: new client_1.Prisma.Decimal(sanitizedAmount),
            currency: effectiveCurrency,
            totalAmountPaid: new client_1.Prisma.Decimal(sanitizedTotalAmountPaid),
            paymentStatus: isDraft ? client_1.PaymentStatus.PENDING : client_1.PaymentStatus.PENDING,
            expenseStatus: isDraft ? client_1.ExpenseStatus.DRAFT : client_1.ExpenseStatus.PENDING,
            supplier: supplierId ? { connect: { id: supplierId } } : undefined,
            bankAccount: bankAccountId ? { connect: { id: bankAccountId } } : undefined,
            cashAccount: cashAccountId ? { connect: { id: cashAccountId } } : undefined,
            mobileAccount: mobileAccountId ? { connect: { id: mobileAccountId } } : undefined,
            otherAccount: otherAccountId ? { connect: { id: otherAccountId } } : undefined,
            itemType,
            accountType,
            [role === "admin" ? "createdByAdmin" : role === "accounts" ? "createdByAccounts" : "createdByStaff"]: {
                connect: { cognitoId },
            },
        };
        const expense = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const created = yield tx.operationalExpense.create({
                data,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            const now = new Date();
            const referenceNumber = `DSIC-${now.getFullYear()}-EXP-${created.id.toString().padStart(5, "0")}`;
            return tx.operationalExpense.update({
                where: { id: created.id },
                data: { referenceNumber },
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
        }));
        yield createAuditLog(isDraft ? "CREATE_DRAFT" : "CREATE", expense.id.toString(), role, cognitoId, expense);
        res.status(201).json({ success: true, data: expense });
    }
    catch (error) {
        res.status(error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025" ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.createOperationalExpense = createOperationalExpense;
const createDraftOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, id: cognitoId } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to create drafts` });
            return;
        }
        const { agentName, kraPin, date, expenseDetails, expenseName, institutionName, reasonForPayment, frequency, paymentMode, paymentModeDescription, amount, currency, totalAmountPaid, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, itemType, accountType, } = req.body;
        // Validate inputs
        if (!agentName || typeof agentName !== "string" || agentName.length > 100) {
            res.status(400).json({ message: "Agent name must be a string, 100 characters or less" });
            return;
        }
        if (kraPin !== undefined && kraPin !== null && (typeof kraPin !== "string" || kraPin.length !== 11 || !/^[A-Za-z0-9]+$/.test(kraPin))) {
            res.status(400).json({ message: "KRA PIN must be an 11-character alphanumeric string or null" });
            return;
        }
        if (date && isNaN(new Date(date).getTime())) {
            res.status(400).json({ message: "Invalid date" });
            return;
        }
        if (expenseDetails && (typeof expenseDetails !== "string" || expenseDetails.length > 1000)) {
            res.status(400).json({ message: "Expense details must be a string, 1000 characters or less" });
            return;
        }
        if (!expenseName || typeof expenseName !== "string" || expenseName.length > 100) {
            res.status(400).json({ message: "Expense name must be a string, 100 characters or less" });
            return;
        }
        if (!institutionName || typeof institutionName !== "string" || institutionName.length > 100) {
            res.status(400).json({ message: "Institution name must be a string, 100 characters or less" });
            return;
        }
        if (!reasonForPayment || typeof reasonForPayment !== "string" || reasonForPayment.length > 500) {
            res.status(400).json({ message: "Reason for payment must be a string, 500 characters or less" });
            return;
        }
        if (role === "admin") {
            if (frequency && !Object.values(client_1.Frequency).includes(frequency)) {
                res.status(400).json({ message: "Invalid frequency" });
                return;
            }
            if (paymentMode && !Object.values(client_1.PaymentMode).includes(paymentMode)) {
                res.status(400).json({ message: "Invalid payment mode" });
                return;
            }
            if (paymentModeDescription && (typeof paymentModeDescription !== "string" || paymentModeDescription.length > 500)) {
                res.status(400).json({ message: "Payment mode description must be a string, 500 characters or less" });
                return;
            }
            if (currency && (typeof currency !== "string" || currency.length < 3 || currency.length > 10)) {
                res.status(400).json({ message: "Currency must be a string between 3 and 10 characters if provided" });
                return;
            }
        }
        if (!amount || typeof amount !== "string" || isNaN(Number(amount)) || Number(amount) <= 0) {
            res.status(400).json({ message: "Amount must be a string representing a positive number" });
            return;
        }
        if (!/^\d+(\.\d{0,2})?$/.test(amount)) {
            res.status(400).json({ message: "Amount must be a valid number with up to 2 decimal places" });
            return;
        }
        if (totalAmountPaid !== undefined && (isNaN(Number(totalAmountPaid)) || Number(totalAmountPaid) < 0)) {
            res.status(400).json({ message: "Total amount paid must be a non-negative number if provided" });
            return;
        }
        if (itemType && !Object.values(client_1.ItemType).includes(itemType)) {
            res.status(400).json({ message: "Invalid item type" });
            return;
        }
        if (accountType && !Object.values(client_1.AccountType).includes(accountType)) {
            res.status(400).json({ message: "Invalid account type" });
            return;
        }
        // Validate exactly one account ID is provided and exists
        const accountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
        if (accountIds.length > 1) {
            res.status(400).json({ message: "Only one account ID (bank, cash, mobile, or other) can be provided" });
            return;
        }
        let account;
        if (bankAccountId) {
            account = yield prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
            if (!account) {
                res.status(400).json({ message: "Invalid or non-existent bank account ID" });
                return;
            }
            if (account.currency !== (currency || "KES")) {
                res.status(400).json({ message: "Bank account currency must match expense currency" });
                return;
            }
        }
        else if (cashAccountId) {
            account = yield prisma.cashAccount.findUnique({ where: { id: cashAccountId } });
            if (!account) {
                res.status(400).json({ message: "Invalid or non-existent cash account ID" });
                return;
            }
            if (account.currency !== (currency || "KES")) {
                res.status(400).json({ message: "Cash account currency must match expense currency" });
                return;
            }
        }
        else if (mobileAccountId) {
            account = yield prisma.mobileAccount.findUnique({ where: { id: mobileAccountId } });
            if (!account) {
                res.status(400).json({ message: "Invalid or non-existent mobile account ID" });
                return;
            }
            if (account.currency !== (currency || "KES")) {
                res.status(400).json({ message: "Mobile account currency must match expense currency" });
                return;
            }
        }
        else if (otherAccountId) {
            account = yield prisma.otherAccount.findUnique({ where: { id: otherAccountId } });
            if (!account) {
                res.status(400).json({ message: "Invalid or non-existent other account ID" });
                return;
            }
            if (account.currency !== (currency || "KES")) {
                res.status(400).json({ message: "Other account currency must match expense currency" });
                return;
            }
        }
        const data = {
            agentName: (0, sanitize_html_1.default)(agentName),
            kraPin: kraPin ? (0, sanitize_html_1.default)(kraPin) : null,
            date: new Date(date || new Date()),
            expenseDetails: expenseDetails ? (0, sanitize_html_1.default)(expenseDetails) : "Draft expense details pending",
            expenseName: (0, sanitize_html_1.default)(expenseName),
            institutionName: (0, sanitize_html_1.default)(institutionName),
            frequency: role === "admin" && frequency ? frequency : client_1.Frequency.ONCE_OFF,
            paymentMode: role === "admin" && paymentMode ? paymentMode : client_1.PaymentMode.CASH,
            paymentModeDescription: role === "admin" && paymentModeDescription ? (0, sanitize_html_1.default)(paymentModeDescription) : "Pending payment mode description",
            amount: new client_1.Prisma.Decimal(amount),
            currency: role === "admin" && currency ? (0, sanitize_html_1.default)(currency) : "KES",
            totalAmountPaid: new client_1.Prisma.Decimal(totalAmountPaid || 0),
            expenseStatus: client_1.ExpenseStatus.DRAFT,
            paymentStatus: client_1.PaymentStatus.PENDING,
            bankAccount: bankAccountId ? { connect: { id: bankAccountId } } : undefined,
            cashAccount: cashAccountId ? { connect: { id: cashAccountId } } : undefined,
            mobileAccount: mobileAccountId ? { connect: { id: mobileAccountId } } : undefined,
            otherAccount: otherAccountId ? { connect: { id: otherAccountId } } : undefined,
            itemType,
            accountType,
            [role === "admin" ? "createdByAdmin" : role === "accounts" ? "createdByAccounts" : "createdByStaff"]: {
                connect: { cognitoId },
            },
        };
        const expense = yield prisma.operationalExpense.create({
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "CREATE_DRAFT",
                entity: "OperationalExpense",
                entityId: expense.id.toString(),
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    createdBy: role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.status(201).json(expense);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Related record not found (account or creator user)" });
            return;
        }
        console.error(error); // Log for debugging
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createDraftOperationalExpense = createDraftOperationalExpense;
const getOperationalExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10", period, agentName, expenseName, kraPin, expenseDescription, frequency, paymentMode, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, includeDrafts = "false" } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);
        const showDrafts = includeDrafts === "true";
        // Validate authenticated user
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Validate user role
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view operational expenses` });
            return;
        }
        // Validate page and limit parameters
        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }
        // Validate account IDs
        const accountIds = {
            bankAccountId: bankAccountId ? Number(bankAccountId) : undefined,
            cashAccountId: cashAccountId ? Number(cashAccountId) : undefined,
            mobileAccountId: mobileAccountId ? Number(mobileAccountId) : undefined,
            otherAccountId: otherAccountId ? Number(otherAccountId) : undefined,
        };
        for (const [key, id] of Object.entries(accountIds)) {
            if (id !== undefined && (isNaN(id) || id <= 0)) {
                res.status(400).json({ message: `Invalid ${key}` });
                return;
            }
        }
        // Build where clause
        const where = {
            AND: [
                period ? { date: { gte: new Date(String(period).split(",")[0]), lte: new Date(String(period).split(",")[1]) } } : {},
                agentName ? { agentName: { contains: String(agentName), mode: client_1.Prisma.QueryMode.insensitive } } : {},
                kraPin ? { kraPin: { contains: String(kraPin), mode: client_1.Prisma.QueryMode.insensitive } } : {},
                expenseName ? { expenseName: { contains: String(expenseName), mode: client_1.Prisma.QueryMode.insensitive } } : {},
                expenseDescription ? { reasonForPayment: { contains: String(expenseDescription), mode: client_1.Prisma.QueryMode.insensitive } } : {},
                frequency ? { frequency: String(frequency) } : {},
                paymentMode ? { paymentMode: String(paymentMode) } : {},
                bankAccountId ? { bankAccountId: accountIds.bankAccountId } : {},
                cashAccountId ? { cashAccountId: accountIds.cashAccountId } : {},
                mobileAccountId ? { mobileAccountId: accountIds.mobileAccountId } : {},
                otherAccountId ? { otherAccountId: accountIds.otherAccountId } : {},
                showDrafts
                    ? Object.assign({ expenseStatus: client_1.ExpenseStatus.DRAFT }, (role === "admin"
                        ? {}
                        : {
                            OR: [
                                role === "staff" ? { createdByStaffCognitoId: cognitoId } : {},
                                role === "accounts" ? { createdByAccountsCognitoId: cognitoId } : {},
                            ].filter((condition) => Object.keys(condition).length > 0),
                        })) : { expenseStatus: { not: client_1.ExpenseStatus.DRAFT } },
            ].filter((condition) => Object.keys(condition).length > 0),
        };
        // Fetch expenses and count
        const [expenses, total] = yield Promise.all([
            prisma.operationalExpense.findMany({
                where,
                orderBy: { date: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            }),
            prisma.operationalExpense.count({ where }),
        ]);
        // Create audit log
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        if (actorField && cognitoId) {
            yield prisma.auditLog.create({
                data: {
                    action: "READ",
                    entity: "OperationalExpense",
                    entityId: "multiple",
                    meta: {
                        count: expenses.length,
                        page: pageNumber,
                        limit: limitNumber,
                        includeDrafts: showDrafts,
                        bankAccountId,
                        cashAccountId,
                        mobileAccountId,
                        otherAccountId,
                        role,
                        cognitoId,
                    },
                    [actorField]: cognitoId,
                },
            });
        }
        res.json({
            expenses,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    }
    catch (error) {
        console.error("Error fetching operational expenses:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(500).json({
                    message: "Data integrity error: Some expenses reference non-existent users/accounts. Contact admin."
                });
                return;
            }
        }
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getOperationalExpenses = getOperationalExpenses;
const getOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Validate user role
        const allowedRoles = ['admin', 'accounts', 'staff'];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view operational expense` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: 'Invalid expense ID' });
            return;
        }
        const expense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        if (!expense) {
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        if (role === 'staff' && expense.createdByStaffCognitoId !== cognitoId && expense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            res.status(403).json({ message: 'Access denied: Cannot view draft expense created by another user' });
            return;
        }
        // Create audit log
        const actorFieldMap = {
            admin: 'actorAdminCognitoId',
            accounts: 'actorAccountsCognitoId',
            user: 'actorUserCognitoId',
            staff: 'actorStaffCognitoId',
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: 'READ',
                entity: 'OperationalExpense',
                entityId: id,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.json(expense);
    }
    catch (error) {
        console.error("Error fetching operational expenses:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(500).json({
                    message: "Data integrity error: Some expenses reference non-existent users/accounts. Contact admin."
                });
                return;
            }
        }
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getOperationalExpense = getOperationalExpense;
const updateOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to update operational expense` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new Error("Invalid expense ID");
        }
        const { agentName, kraPin, date, expenseDetails, expenseName, institutionName, frequency, paymentMode, paymentModeDescription, amount, currency, totalAmountPaid, supplierId, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, expenseStatus, itemType, accountType, } = req.body;
        const existingExpense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                createdByAdmin: { select: { name: true } },
                createdByAccounts: { select: { name: true } },
                createdByStaff: { select: { name: true } },
                approvedByAdmin: { select: { name: true } },
                approvedByAccounts: { select: { name: true } },
                approvedByStaff: { select: { name: true } },
            },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (role === "staff" && existingExpense.createdByStaffCognitoId !== cognitoId && existingExpense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            res.status(403).json({ message: "Access denied: Cannot update draft expense created by another user" });
            return;
        }
        if (expenseStatus && !["admin", "accounts"].includes(role) && expenseStatus === client_1.ExpenseStatus.CANCELLED) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reverse expense` });
            return;
        }
        if (expenseStatus === client_1.ExpenseStatus.CANCELLED && (existingExpense.expenseStatus === client_1.ExpenseStatus.CANCELLED || existingExpense.expenseStatus === client_1.ExpenseStatus.DRAFT)) {
            throw new Error("Cannot reverse an expense that is already cancelled or a draft");
        }
        if (itemType && !Object.values(client_1.ItemType).includes(itemType)) {
            throw new Error("Invalid item type");
        }
        if (accountType && !Object.values(client_1.AccountType).includes(accountType)) {
            throw new Error("Invalid account type");
        }
        // Validate inputs
        const sanitizedAgentName = (_a = validateString(agentName, 100, "Agent name")) !== null && _a !== void 0 ? _a : undefined;
        const sanitizedKraPin = validateKraPin(kraPin);
        const sanitizedDate = date ? validateDate(date) : undefined;
        const sanitizedExpenseDetails = (_b = validateString(expenseDetails, 1000, "Expense details")) !== null && _b !== void 0 ? _b : undefined;
        const sanitizedExpenseName = (_c = validateString(expenseName, 100, "Expense name")) !== null && _c !== void 0 ? _c : undefined;
        const sanitizedInstitutionName = (_d = validateString(institutionName, 100, "Institution name")) !== null && _d !== void 0 ? _d : undefined;
        const sanitizedAmount = amount !== undefined ? validateAmount(amount, "Amount") : undefined;
        const sanitizedTotalAmountPaid = totalAmountPaid !== undefined ? validateAmount(totalAmountPaid, "Total amount paid") : undefined;
        if (role === "admin") {
            if (frequency && !Object.values(client_1.Frequency).includes(frequency)) {
                throw new Error("Invalid frequency");
            }
            if (paymentMode && !Object.values(client_1.PaymentMode).includes(paymentMode)) {
                throw new Error("Invalid payment mode");
            }
            const sanitizedPaymentModeDesc = (_e = validateString(paymentModeDescription, 500, "Payment mode description")) !== null && _e !== void 0 ? _e : undefined;
            const sanitizedCurrency = (_f = validateString(currency, 10, "Currency")) !== null && _f !== void 0 ? _f : undefined;
            if (sanitizedCurrency && sanitizedCurrency.length < 3) {
                throw new Error("Currency must be at least 3 characters");
            }
        }
        const effectiveCurrency = currency || existingExpense.currency;
        yield (0, exports.validateAccount)(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);
        const data = {
            agentName: sanitizedAgentName,
            kraPin: sanitizedKraPin,
            date: sanitizedDate,
            expenseDetails: sanitizedExpenseDetails,
            expenseName: sanitizedExpenseName,
            institutionName: sanitizedInstitutionName,
            frequency,
            paymentMode,
            paymentModeDescription,
            amount: sanitizedAmount !== undefined ? new client_1.Prisma.Decimal(sanitizedAmount) : undefined,
            currency: effectiveCurrency,
            totalAmountPaid: sanitizedTotalAmountPaid !== undefined ? new client_1.Prisma.Decimal(sanitizedTotalAmountPaid) : undefined,
            supplier: supplierId ? { connect: { id: supplierId } } : undefined,
            bankAccount: bankAccountId !== undefined ? (bankAccountId ? { connect: { id: bankAccountId } } : { disconnect: true }) : undefined,
            cashAccount: cashAccountId !== undefined ? (cashAccountId ? { connect: { id: cashAccountId } } : { disconnect: true }) : undefined,
            mobileAccount: mobileAccountId !== undefined ? (mobileAccountId ? { connect: { id: mobileAccountId } } : { disconnect: true }) : undefined,
            otherAccount: otherAccountId !== undefined ? (otherAccountId ? { connect: { id: otherAccountId } } : { disconnect: true }) : undefined,
            expenseStatus,
            itemType,
            accountType,
        };
        const expense = yield prisma.operationalExpense.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        const updateFields = Object.keys(data).filter((key) => data[key] !== undefined);
        yield createAuditLog(expenseStatus === client_1.ExpenseStatus.CANCELLED ? "REVERSE" : "UPDATE", id, role, cognitoId, expense, { updateFields });
        res.json({ success: true, data: expense });
    }
    catch (error) {
        res.status(error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025" ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateOperationalExpense = updateOperationalExpense;
const reverseOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reverse operational expense` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const existingExpense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (existingExpense.expenseStatus === client_1.ExpenseStatus.CANCELLED || existingExpense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            res.status(400).json({ message: "Cannot reverse an expense that is already cancelled or a draft" });
            return;
        }
        const expense = yield prisma.operationalExpense.update({
            where: { id: idNumber },
            data: { expenseStatus: client_1.ExpenseStatus.CANCELLED },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "REVERSE",
                entity: "OperationalExpense",
                entityId: id,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.json(expense);
    }
    catch (error) {
        console.error("Error reversing operational expense:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.reverseOperationalExpense = reverseOperationalExpense;
const reverseAndEditOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to reverse and edit operational expense` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const existingExpense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (existingExpense.expenseStatus === client_1.ExpenseStatus.CANCELLED || existingExpense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            res.status(400).json({ message: "Cannot reverse and edit an expense that is already cancelled or a draft" });
            return;
        }
        const expense = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Step 1: Cancel the existing expense
            const canceledExpense = yield tx.operationalExpense.update({
                where: { id: idNumber },
                data: { expenseStatus: client_1.ExpenseStatus.CANCELLED },
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            // Step 2: Create a new draft expense with copied fields
            const newExpenseData = {
                agentName: existingExpense.agentName,
                kraPin: existingExpense.kraPin,
                date: existingExpense.date,
                expenseDetails: existingExpense.expenseDetails,
                expenseName: existingExpense.expenseName,
                institutionName: existingExpense.institutionName,
                frequency: existingExpense.frequency,
                paymentMode: existingExpense.paymentMode,
                paymentModeDescription: existingExpense.paymentModeDescription,
                amount: existingExpense.amount,
                currency: existingExpense.currency,
                totalAmountPaid: new client_1.Prisma.Decimal(0),
                expenseStatus: client_1.ExpenseStatus.DRAFT,
                paymentStatus: client_1.PaymentStatus.PENDING,
                supplier: existingExpense.supplierId ? { connect: { id: existingExpense.supplierId } } : undefined,
                bankAccount: existingExpense.bankAccountId ? { connect: { id: existingExpense.bankAccountId } } : undefined,
                cashAccount: existingExpense.cashAccountId ? { connect: { id: existingExpense.cashAccountId } } : undefined,
                mobileAccount: existingExpense.mobileAccountId ? { connect: { id: existingExpense.mobileAccountId } } : undefined,
                otherAccount: existingExpense.otherAccountId ? { connect: { id: existingExpense.otherAccountId } } : undefined,
                itemType: existingExpense.itemType,
                accountType: existingExpense.accountType,
                [role === "admin" ? "createdByAdmin" : "createdByAccounts"]: {
                    connect: { cognitoId },
                },
            };
            const newExpense = yield tx.operationalExpense.create({
                data: newExpenseData,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            // Step 3: Create audit logs for both actions
            yield tx.auditLog.create({
                data: {
                    action: "REVERSE",
                    entity: "OperationalExpense",
                    entityId: id,
                    meta: {
                        expenseName: canceledExpense.expenseName,
                        amount: canceledExpense.amount.toString(),
                        currency: canceledExpense.currency,
                        itemType: canceledExpense.itemType,
                        accountType: canceledExpense.accountType,
                        bankAccountId: canceledExpense.bankAccountId,
                        cashAccountId: canceledExpense.cashAccountId,
                        mobileAccountId: canceledExpense.mobileAccountId,
                        otherAccountId: canceledExpense.otherAccountId,
                        role,
                        cognitoId,
                    },
                    [actorFieldMap[role]]: cognitoId,
                },
            });
            yield tx.auditLog.create({
                data: {
                    action: "CREATE_DRAFT",
                    entity: "OperationalExpense",
                    entityId: newExpense.id.toString(),
                    meta: {
                        expenseName: newExpense.expenseName,
                        amount: newExpense.amount.toString(),
                        currency: newExpense.currency,
                        itemType: newExpense.itemType,
                        accountType: newExpense.accountType,
                        bankAccountId: newExpense.bankAccountId,
                        cashAccountId: newExpense.cashAccountId,
                        mobileAccountId: newExpense.mobileAccountId,
                        otherAccountId: newExpense.otherAccountId,
                        originalExpenseId: idNumber,
                        role,
                        cognitoId,
                    },
                    [actorFieldMap[role]]: cognitoId,
                },
            });
            return newExpense;
        }));
        res.json(expense);
    }
    catch (error) {
        console.error("Error reversing and editing operational expense:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025" ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
        });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.reverseAndEditOperationalExpense = reverseAndEditOperationalExpense;
const approveOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        const { bankAccountId, cashAccountId, mobileAccountId, otherAccountId } = req.body;
        if (!req.user) {
            console.warn('No authenticated user found');
            res.status(401).json({ message: 'Unauthorized: No authenticated user' });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Validate user role
        const allowedRoles = ['admin', 'accounts'];
        if (!allowedRoles.includes(role)) {
            console.warn('Unauthorized role', { role });
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to approve operational expense` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            throw new Error('Invalid expense ID');
        }
        const existingExpense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            select: {
                id: true,
                expenseStatus: true,
                expenseName: true,
                amount: true,
                currency: true,
                itemType: true,
                accountType: true,
                bankAccountId: true,
                cashAccountId: true,
                mobileAccountId: true,
                otherAccountId: true,
                totalAmountPaid: true,
                paymentStatus: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                agentName: true,
                paymentMode: true,
            },
        });
        if (!existingExpense) {
            console.warn('Expense not found', { expenseId: idNumber });
            res.status(404).json({ message: 'Expense not found' });
            return;
        }
        if (existingExpense.expenseStatus === client_1.ExpenseStatus.APPROVED) {
            throw new Error('Expense is already approved');
        }
        if (existingExpense.expenseStatus === client_1.ExpenseStatus.CANCELLED) {
            throw new Error('Cannot approve a cancelled expense');
        }
        if (existingExpense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            throw new Error('Cannot approve a draft expense');
        }
        // Enforce single account ID from request body, fall back to existing expense account ID
        let effectiveBankAccountId;
        let effectiveCashAccountId;
        let effectiveMobileAccountId;
        let effectiveOtherAccountId;
        const providedAccountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
        if (providedAccountIds.length > 1) {
            console.error('Multiple account IDs provided in request body', { providedAccountIds });
            throw new Error(`Only one account ID can be provided in the request body: ${JSON.stringify(providedAccountIds)}`);
        }
        if (bankAccountId) {
            effectiveBankAccountId = bankAccountId;
        }
        else if (cashAccountId) {
            effectiveCashAccountId = cashAccountId;
        }
        else if (mobileAccountId) {
            effectiveMobileAccountId = mobileAccountId;
        }
        else if (otherAccountId) {
            effectiveOtherAccountId = otherAccountId;
        }
        else {
            // Convert null to undefined for Prisma fields
            effectiveBankAccountId = (_a = existingExpense.bankAccountId) !== null && _a !== void 0 ? _a : undefined;
            effectiveCashAccountId = (_b = existingExpense.cashAccountId) !== null && _b !== void 0 ? _b : undefined;
            effectiveMobileAccountId = (_c = existingExpense.mobileAccountId) !== null && _c !== void 0 ? _c : undefined;
            effectiveOtherAccountId = (_d = existingExpense.otherAccountId) !== null && _d !== void 0 ? _d : undefined;
        }
        // Require an account ID
        if (!effectiveBankAccountId && !effectiveCashAccountId && !effectiveMobileAccountId && !effectiveOtherAccountId) {
            console.error('No account ID provided or found in expense');
            throw new Error('An account ID (bank, cash, mobile, or other) must be provided or set in the expense');
        }
        yield (0, exports.validateAccount)(effectiveBankAccountId, effectiveCashAccountId, effectiveMobileAccountId, effectiveOtherAccountId, existingExpense.currency);
        const [expense, transaction] = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Fetch and validate account
            let account;
            let accountType = null;
            let accountId = null;
            if (effectiveBankAccountId) {
                account = yield tx.bankAccount.findUnique({ where: { id: effectiveBankAccountId } });
                if (!account)
                    throw new Error(`Bank account not found: ID ${effectiveBankAccountId}`);
                accountType = 'BankAccount';
                accountId = effectiveBankAccountId;
            }
            else if (effectiveCashAccountId) {
                account = yield tx.cashAccount.findUnique({ where: { id: effectiveCashAccountId } });
                if (!account)
                    throw new Error(`Cash account not found: ID ${effectiveCashAccountId}`);
                accountType = 'CashAccount';
                accountId = effectiveCashAccountId;
            }
            else if (effectiveMobileAccountId) {
                account = yield tx.mobileAccount.findUnique({ where: { id: effectiveMobileAccountId } });
                if (!account)
                    throw new Error(`Mobile account not found: ID ${effectiveMobileAccountId}`);
                accountType = 'MobileAccount';
                accountId = effectiveMobileAccountId;
            }
            else if (effectiveOtherAccountId) {
                account = yield tx.otherAccount.findUnique({ where: { id: effectiveOtherAccountId } });
                if (!account)
                    throw new Error(`Other account not found: ID ${effectiveOtherAccountId}`);
                accountType = 'OtherAccount';
                accountId = effectiveOtherAccountId;
            }
            // Validate account balance
            if (account) {
                const balance = Number(account.balance);
                const expenseAmount = Number(existingExpense.amount);
                if (balance < expenseAmount) {
                    throw new Error(`Insufficient balance in ${accountType} ID ${accountId}: ${balance} ${existingExpense.currency} available, ${expenseAmount} required`);
                }
            }
            // Prevent re-approval if already PAID
            if (existingExpense.paymentStatus === client_1.PaymentStatus.PAID) {
                throw new Error('Expense is already paid and cannot be re-approved');
            }
            const updateData = {
                expenseStatus: client_1.ExpenseStatus.APPROVED,
                [role === 'admin' ? 'approvedByAdmin' : 'approvedByAccounts']: {
                    connect: { cognitoId },
                },
                bankAccount: effectiveBankAccountId ? { connect: { id: effectiveBankAccountId } } : { disconnect: true },
                cashAccount: effectiveCashAccountId ? { connect: { id: effectiveCashAccountId } } : { disconnect: true },
                mobileAccount: effectiveMobileAccountId ? { connect: { id: effectiveMobileAccountId } } : { disconnect: true },
                otherAccount: effectiveOtherAccountId ? { connect: { id: effectiveOtherAccountId } } : { disconnect: true },
                totalAmountPaid: existingExpense.amount, // Set to amount, not additive
                paymentStatus: client_1.PaymentStatus.PAID,
            };
            const updatedExpense = yield tx.operationalExpense.update({
                where: { id: idNumber },
                data: updateData,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                    createdByStaff: true,
                    approvedByAdmin: true,
                    approvedByAccounts: true,
                    approvedByStaff: true,
                    supplier: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            const transaction = yield tx.transaction.create({
                data: {
                    amount: existingExpense.amount,
                    currency: existingExpense.currency,
                    payee: existingExpense.agentName || 'Unknown',
                    paymentMode: existingExpense.paymentMode || client_1.PaymentMode.CASH,
                    status: client_1.PaymentStatus.PAID,
                    date: new Date(),
                    expense: { connect: { id: idNumber } },
                    bankAccount: effectiveBankAccountId ? { connect: { id: effectiveBankAccountId } } : undefined,
                    cashAccount: effectiveCashAccountId ? { connect: { id: effectiveCashAccountId } } : undefined,
                    mobileAccount: effectiveMobileAccountId ? { connect: { id: effectiveMobileAccountId } } : undefined,
                    otherAccount: effectiveOtherAccountId ? { connect: { id: effectiveOtherAccountId } } : undefined,
                    [role === 'admin' ? 'createdByAdmin' : 'createdByAccounts']: {
                        connect: { cognitoId },
                    },
                },
            });
            yield tx.auditLog.create({
                data: {
                    action: 'CREATE',
                    entity: 'Transaction',
                    entityId: transaction.id.toString(),
                    meta: {
                        expenseId: idNumber,
                        expenseName: existingExpense.expenseName,
                        amount: transaction.amount.toString(),
                        currency: transaction.currency,
                        payee: transaction.payee,
                        paymentMode: transaction.paymentMode,
                        accountType,
                        accountId,
                        role,
                        cognitoId,
                    },
                    [actorFieldMap[role]]: cognitoId,
                },
            });
            // Deduct balance if account exists
            if (account && accountType && accountId) {
                const newBalance = new client_1.Prisma.Decimal(Number(account.balance) - Number(existingExpense.amount));
                if (accountType === 'BankAccount') {
                    yield tx.bankAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                }
                else if (accountType === 'CashAccount') {
                    yield tx.cashAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                }
                else if (accountType === 'MobileAccount') {
                    yield tx.mobileAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                }
                else if (accountType === 'OtherAccount') {
                    yield tx.otherAccount.update({
                        where: { id: accountId },
                        data: { balance: newBalance, updatedAt: new Date() },
                    });
                }
                yield tx.auditLog.create({
                    data: {
                        action: `DEDUCT_BALANCE_${accountType.toUpperCase()}`,
                        entity: accountType,
                        entityId: accountId.toString(),
                        meta: {
                            expenseId: idNumber,
                            expenseName: existingExpense.expenseName,
                            amountDeducted: existingExpense.amount.toString(),
                            newBalance: newBalance.toString(),
                            currency: existingExpense.currency,
                            role,
                            cognitoId,
                        },
                        [actorFieldMap[role]]: cognitoId,
                    },
                });
            }
            return [updatedExpense, transaction];
        }));
        yield createAuditLog('APPROVE', id, role, cognitoId, expense, {
            bankAccountId: effectiveBankAccountId,
            cashAccountId: effectiveCashAccountId,
            mobileAccountId: effectiveMobileAccountId,
            otherAccountId: effectiveOtherAccountId,
            transactionId: transaction.id,
        });
        res.json({ success: true, data: { expense, transaction } });
    }
    catch (error) {
        console.error('Error approving operational expense', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025' ? 404 : 400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
exports.approveOperationalExpense = approveOperationalExpense;
const deleteOperationalExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to delete operational expense` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const existingExpense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByStaff: true,
                createdByAdmin: true,
                createdByAccounts: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                transactions: true,
            },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (role === "staff" && existingExpense.createdByStaffCognitoId !== cognitoId) {
            res.status(403).json({ message: "Access denied: Cannot delete expense created by another user" });
            return;
        }
        if (existingExpense.transactions.length > 0) {
            res.status(400).json({ message: "Cannot delete expense with associated transactions" });
            return;
        }
        const expenseDetailsForAudit = {
            id: existingExpense.id,
            referenceNumber: existingExpense.referenceNumber,
            agentName: existingExpense.agentName,
            kraPin: existingExpense.kraPin,
            date: existingExpense.date.toISOString(),
            expenseDetails: existingExpense.expenseDetails,
            expenseName: existingExpense.expenseName,
            institutionName: existingExpense.institutionName,
            frequency: existingExpense.frequency,
            paymentMode: existingExpense.paymentMode,
            paymentModeDescription: existingExpense.paymentModeDescription,
            amount: existingExpense.amount.toString(),
            currency: existingExpense.currency,
            totalAmountPaid: existingExpense.totalAmountPaid.toString(),
            paymentStatus: existingExpense.paymentStatus,
            expenseStatus: existingExpense.expenseStatus,
            lpoStatus: existingExpense.lpoStatus,
            itemType: existingExpense.itemType,
            accountType: existingExpense.accountType,
            bankAccountId: existingExpense.bankAccountId,
            cashAccountId: existingExpense.cashAccountId,
            mobileAccountId: existingExpense.mobileAccountId,
            otherAccountId: existingExpense.otherAccountId,
            supplier: existingExpense.supplier ? { id: existingExpense.supplier.id, name: existingExpense.supplier.name } : null,
            createdBy: {
                role,
                name: ((_a = existingExpense.createdByAdmin) === null || _a === void 0 ? void 0 : _a.name) || ((_b = existingExpense.createdByAccounts) === null || _b === void 0 ? void 0 : _b.name) || ((_c = existingExpense.createdByStaff) === null || _c === void 0 ? void 0 : _c.name) || "Unknown",
                cognitoId: existingExpense.createdByAdminCognitoId || existingExpense.createdByAccountsCognitoId || existingExpense.createdByStaffCognitoId || null,
            },
            approvedBy: {
                name: ((_d = existingExpense.approvedByAdmin) === null || _d === void 0 ? void 0 : _d.name) || ((_e = existingExpense.approvedByAccounts) === null || _e === void 0 ? void 0 : _e.name) || ((_f = existingExpense.approvedByStaff) === null || _f === void 0 ? void 0 : _f.name) || null,
                cognitoId: existingExpense.approvedByAdminCognitoId || existingExpense.approvedByAccountsCognitoId || existingExpense.approvedByStaffCognitoId || null,
            },
            createdAt: existingExpense.createdAt.toISOString(),
            updatedAt: existingExpense.updatedAt.toISOString(),
        };
        yield prisma.operationalExpense.delete({
            where: { id: idNumber },
        });
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "DELETE",
                entity: "OperationalExpense",
                entityId: id,
                meta: {
                    expenseDetails: expenseDetailsForAudit,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting operational expense:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteOperationalExpense = deleteOperationalExpense;
const downloadOperationalExpensePdf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to download operational expense PDF` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const expense = yield prisma.operationalExpense.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                supplier: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId && expense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            res.status(403).json({ message: "Access denied: Cannot download draft expense created by another user" });
            return;
        }
        const doc = new pdfkit_1.default({
            size: 'A4',
            bufferPages: true,
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        const stream = new node_stream_1.PassThrough();
        const buffers = [];
        stream.on("data", (chunk) => buffers.push(chunk));
        stream.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=expense-${id}.pdf`);
            res.send(pdfBuffer);
        });
        doc.pipe(stream);
        const primaryColor = '#8d182c';
        const secondaryColor = '#D9911E';
        const lightGray = '#f5f5f5';
        const darkGray = '#666666';
        // Header section with logo and reference - fixed positioning
        const logoWidth = 60;
        const logoHeight = 60;
        // Use the correct aspect ratio to prevent distortion
        doc.image('public/images/logo.png', 50, 50, { width: logoWidth, height: logoHeight });
        // Reference number - moved left and reduced font size
        const now = new Date();
        const referenceNumber = `DSIC-${now.getFullYear()}-EXP-${expense.id.toString().padStart(5, "0")}`;
        doc.fillColor(secondaryColor)
            .fontSize(10) // Reduced from 12 to 10 points
            .font('Helvetica-Bold')
            .text(`REF: ${expense.referenceNumber || referenceNumber}`, 300, 65, { width: 250, align: 'right' }); // Moved left from 400 to 300
        // Main title - positioned below logo
        const titleY = 50 + logoHeight + 20;
        doc.fillColor(primaryColor)
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Operational Expense', 50, titleY);
        doc.fillColor(darkGray)
            .fontSize(12)
            .font('Helvetica')
            .text('Expense Details', 50, titleY + 30);
        // Card container
        const cardX = 50;
        const cardY = titleY + 50;
        const cardWidth = 495;
        // Draw card background with rounded corners
        doc.roundedRect(cardX, cardY, cardWidth, 400, 5)
            .fill(lightGray);
        // Card content
        const contentX = cardX + 20;
        let contentY = cardY + 20;
        // Expense name (larger and prominent)
        doc.fillColor(primaryColor)
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(expense.expenseName || 'N/A', contentX, contentY, {
            width: cardWidth - 40,
            align: 'left'
        });
        contentY += 30;
        // Separator line
        doc.moveTo(contentX, contentY)
            .lineTo(contentX + cardWidth - 40, contentY)
            .lineWidth(1)
            .strokeColor(darkGray)
            .stroke();
        contentY += 15;
        // BASIC INFORMATION SECTION - Single Column
        doc.fillColor(darkGray)
            .fontSize(10)
            .text('BASIC INFORMATION', contentX, contentY);
        contentY += 15;
        // Single column layout for basic info
        const labelWidth = 120;
        const valueX = contentX + labelWidth + 10;
        doc.fillColor('black')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Institution:', contentX, contentY, { width: labelWidth });
        const institutionHeight = doc.heightOfString(expense.institutionName || 'N/A', { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(expense.institutionName || 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += Math.max(20, institutionHeight + 5);
        doc.font('Helvetica-Bold')
            .text('Category:', contentX, contentY, { width: labelWidth });
        const categoryText = expense.accountType ? expense.accountType.replace(/_/g, " ").toLowerCase() : 'N/A';
        const categoryHeight = doc.heightOfString(categoryText, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(categoryText, valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += Math.max(20, categoryHeight + 5);
        doc.font('Helvetica-Bold')
            .text('Frequency:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(expense.frequency || 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 20;
        doc.font('Helvetica-Bold')
            .text('Payment Mode:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(expense.paymentMode || 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 20;
        doc.font('Helvetica-Bold')
            .text('Date:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A', valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 20;
        doc.font('Helvetica-Bold')
            .text('Status:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(expense.expenseStatus || "N/A", valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 30;
        // Separator line
        doc.moveTo(contentX, contentY)
            .lineTo(contentX + cardWidth - 40, contentY)
            .lineWidth(1)
            .strokeColor(darkGray)
            .stroke();
        contentY += 15;
        // PAYMENT DETAILS SECTION
        doc.fillColor(darkGray)
            .fontSize(10)
            .text('PAYMENT DETAILS', contentX, contentY);
        contentY += 15;
        // Determine the payment account type and name
        let paymentAccountType = 'N/A';
        let paymentAccountName = 'N/A';
        if (expense.bankAccountId && expense.bankAccount) {
            paymentAccountType = 'Bank';
            paymentAccountName = expense.bankAccount.accountName;
        }
        else if (expense.cashAccountId && expense.cashAccount) {
            paymentAccountType = 'Cash';
            paymentAccountName = expense.cashAccount.accountName;
        }
        else if (expense.mobileAccountId && expense.mobileAccount) {
            paymentAccountType = 'Mobile';
            paymentAccountName = expense.mobileAccount.accountName;
        }
        else if (expense.otherAccountId && expense.otherAccount) {
            paymentAccountType = 'Other';
            paymentAccountName = expense.otherAccount.accountName;
        }
        doc.font('Helvetica-Bold')
            .text('Account Type:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(paymentAccountType, valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 20;
        doc.font('Helvetica-Bold')
            .text('Account Name:', contentX, contentY, { width: labelWidth });
        const accountNameHeight = doc.heightOfString(paymentAccountName, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(paymentAccountName, valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += Math.max(20, accountNameHeight + 5);
        doc.font('Helvetica-Bold')
            .text('Payment Status:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(expense.paymentStatus || "N/A", valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 20;
        doc.font('Helvetica-Bold')
            .text('Amount:', contentX, contentY, { width: labelWidth });
        doc.font('Helvetica')
            .text(`${expense.currency} ${expense.totalAmountPaid.toString()}`, valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += 30;
        // Separator line
        doc.moveTo(contentX, contentY)
            .lineTo(contentX + cardWidth - 40, contentY)
            .lineWidth(1)
            .strokeColor(darkGray)
            .stroke();
        contentY += 15;
        // APPROVAL INFORMATION SECTION
        doc.fillColor(darkGray)
            .fontSize(10)
            .text('APPROVAL INFORMATION', contentX, contentY);
        contentY += 15;
        doc.font('Helvetica-Bold')
            .text('Created By:', contentX, contentY, { width: labelWidth });
        const createdByName = ((_a = expense.createdByAdmin) === null || _a === void 0 ? void 0 : _a.name) || ((_b = expense.createdByAccounts) === null || _b === void 0 ? void 0 : _b.name) ||
            ((_c = expense.createdByStaff) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown';
        const createdByHeight = doc.heightOfString(createdByName, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(createdByName, valueX, contentY, { width: cardWidth - valueX - 20 });
        contentY += Math.max(20, createdByHeight + 5);
        doc.font('Helvetica-Bold')
            .text('Approved By:', contentX, contentY, { width: labelWidth });
        const approvedByName = ((_d = expense.approvedByAdmin) === null || _d === void 0 ? void 0 : _d.name) || ((_e = expense.approvedByAccounts) === null || _e === void 0 ? void 0 : _e.name) ||
            ((_f = expense.approvedByStaff) === null || _f === void 0 ? void 0 : _f.name) || 'Not Approved';
        const approvedByHeight = doc.heightOfString(approvedByName, { width: cardWidth - valueX - 20 });
        doc.font('Helvetica')
            .text(approvedByName, valueX, contentY, { width: cardWidth - valueX - 20 });
        // Footer
        const footerY = cardY + 400 + 30;
        doc.fillColor(darkGray)
            .fontSize(10)
            .text(`Downloaded: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}`, 50, footerY);
        doc.fillColor(primaryColor)
            .text('DARUBINI • Operational Expense Report', 400, footerY, { width: 150, align: 'right' });
        doc.end();
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            user: "actorUserCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "DOWNLOAD_PDF",
                entity: "OperationalExpense",
                entityId: id,
                meta: {
                    expenseName: expense.expenseName,
                    amount: expense.amount.toString(),
                    currency: expense.currency,
                    itemType: expense.itemType,
                    accountType: expense.accountType,
                    bankAccountId: expense.bankAccountId,
                    cashAccountId: expense.cashAccountId,
                    mobileAccountId: expense.mobileAccountId,
                    otherAccountId: expense.otherAccountId,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
    }
    catch (error) {
        console.error("Error downloading operational expense PDF:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            params: req.params,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.downloadOperationalExpensePdf = downloadOperationalExpensePdf;
