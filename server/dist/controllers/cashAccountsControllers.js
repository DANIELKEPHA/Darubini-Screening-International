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
exports.getCashAccountDailyBalance = exports.depositToCashAccount = exports.deleteCashAccount = exports.closeCashAccount = exports.updateCashAccount = exports.getCashAccount = exports.getCashAccounts = exports.createCashAccount = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const prisma = new client_1.PrismaClient();
const BUSINESS_TZ = "Africa/Nairobi";
const createCashAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, currency, balance, accountNumber, description, } = req.body;
        // 🔐 Auth check
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({
                message: `Access denied: Role ${role} not authorized`,
            });
            return;
        }
        // 🧪 Validation
        if (!name || typeof name !== "string" || name.length > 100) {
            res.status(400).json({
                message: "Account name must be a string (max 100 chars)",
            });
            return;
        }
        if (!currency || typeof currency !== "string" || currency.length < 3 || currency.length > 10) {
            res.status(400).json({
                message: "Currency must be between 3–10 characters",
            });
            return;
        }
        if (isNaN(balance) || balance < 0) {
            res.status(400).json({
                message: "Balance must be a non-negative number",
            });
            return;
        }
        if (accountNumber && (typeof accountNumber !== "string" || accountNumber.length > 100)) {
            res.status(400).json({
                message: "Account number must be a string (max 100 chars)",
            });
            return;
        }
        if (description && typeof description !== "string") {
            res.status(400).json({
                message: "Description must be a string",
            });
            return;
        }
        // 🔄 Create account only (no daily balance yet)
        const account = yield prisma.cashAccount.create({
            data: {
                accountName: (0, sanitize_html_1.default)(name),
                accountNumber: accountNumber
                    ? (0, sanitize_html_1.default)(accountNumber)
                    : `CASH-${Date.now()}`,
                description: description ? (0, sanitize_html_1.default)(description) : null,
                currency: (0, sanitize_html_1.default)(currency),
                balance: new client_1.Prisma.Decimal(balance),
                [role === "admin"
                    ? "createdByAdminCognitoId"
                    : "createdByAccountsCognitoId"]: cognitoId,
            },
        });
        // 🧾 Audit log
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "CREATE",
                entity: "CashAccount",
                entityId: account.id.toString(),
                meta: {
                    name: account.accountName,
                    accountNumber: account.accountNumber,
                    description: account.description,
                    currency: account.currency,
                    balance: account.balance.toString(),
                    createdBy: role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        // ✅ Success
        res.status(201).json(account);
    }
    catch (error) {
        console.error("❌ Error creating cash account:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({
            message: "Internal server error",
        });
    }
});
exports.createCashAccount = createCashAccount;
const getCashAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "10" } = req.query;
        const pageNumber = Number(page);
        const maxLimit = 100;
        const limitNumber = Math.min(Number(limit), maxLimit);
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view cash accounts` });
            return;
        }
        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            res.status(400).json({ message: "Invalid page or limit parameters" });
            return;
        }
        const [accounts, total] = yield Promise.all([
            prisma.cashAccount.findMany({
                orderBy: { createdAt: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    createdByAdmin: true,
                    createdByAccounts: true,
                },
            }),
            prisma.cashAccount.count(),
        ]);
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "READ",
                entity: "CashAccount",
                entityId: "multiple",
                meta: { count: accounts.length, page: pageNumber, limit: limitNumber, role, cognitoId },
                [actorField]: cognitoId,
            },
        });
        res.json({
            accounts,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    }
    catch (error) {
        console.error("Error retrieving cash accounts:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.code : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError ? error.meta : undefined,
            query: req.query,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getCashAccounts = getCashAccounts;
const getCashAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            res.status(403).json({ message: `Access denied: Role ${role} not authorized to view cash account` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid account ID" });
            return;
        }
        const account = yield prisma.cashAccount.findUnique({
            where: { id: idNumber },
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
            },
        });
        if (!account) {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        yield prisma.auditLog.create({
            data: {
                action: "READ",
                entity: "CashAccount",
                entityId: id,
                meta: {
                    name: account.accountName,
                    accountNumber: account.accountNumber,
                    currency: account.currency,
                    balance: account.balance.toString(),
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.json(account);
    }
    catch (error) {
        console.error("Error retrieving cash account:", {
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
exports.getCashAccount = getCashAccount;
const updateCashAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        // 🚨 Explicitly reject balance edits
        if ("balance" in req.body) {
            res.status(400).json({
                message: "Account balance cannot be updated directly. Use transactions instead.",
            });
            return;
        }
        const { name, currency, accountNumber } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const allowedRoles = ["admin", "accounts", "staff"];
        if (!allowedRoles.includes(role)) {
            res.status(403).json({
                message: `Access denied: Role ${role} not authorized to update cash account`,
            });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid account ID" });
            return;
        }
        const existingAccount = yield prisma.cashAccount.findUnique({
            where: { id: idNumber },
        });
        if (!existingAccount) {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        // 🔒 Validate inputs
        if (name && (typeof name !== "string" || name.length > 100)) {
            res.status(400).json({
                message: "Account name must be a string, 100 characters or less",
            });
            return;
        }
        if (accountNumber && (typeof accountNumber !== "string" || accountNumber.length > 100)) {
            res.status(400).json({
                message: "Account number must be a string, 100 characters or less",
            });
            return;
        }
        if (currency) {
            if (typeof currency !== "string" || currency.length < 3 || currency.length > 10) {
                res.status(400).json({
                    message: "Currency must be a string between 3 and 10 characters",
                });
                return;
            }
            // 🔒 Currency becomes immutable once transactions exist
            const txCount = yield prisma.transaction.count({
                where: { cashAccountId: idNumber },
            });
            if (txCount > 0 && currency !== existingAccount.currency) {
                res.status(400).json({
                    message: "Currency cannot be changed after transactions exist",
                });
                return;
            }
        }
        const data = {
            accountName: name ? (0, sanitize_html_1.default)(name) : undefined,
            accountNumber: accountNumber ? (0, sanitize_html_1.default)(accountNumber) : undefined,
            currency: currency ? (0, sanitize_html_1.default)(currency) : undefined,
            updatedAt: new Date(),
        };
        const updatedAccount = yield prisma.cashAccount.update({
            where: { id: idNumber },
            data,
            include: {
                createdByAdmin: true,
                createdByAccounts: true,
            },
        });
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        const updatedFields = Object.keys(data).filter((key) => data[key] !== undefined);
        yield prisma.auditLog.create({
            data: {
                action: "UPDATE",
                entity: "CashAccount",
                entityId: id,
                meta: {
                    updatedFields,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.json(updatedAccount);
    }
    catch (error) {
        console.error("Error updating cash account:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            code: error instanceof client_1.Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
            meta: error instanceof client_1.Prisma.PrismaClientKnownRequestError
                ? error.meta
                : undefined,
            params: req.params,
            body: req.body,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025") {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateCashAccount = updateCashAccount;
const closeCashAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        const { reason, notes } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // Only Admin and Accounts can close accounts
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: `Access denied: Only Admin or Accounts can close cash accounts` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid account ID" });
            return;
        }
        if (!reason || typeof reason !== "string" || reason.length < 10 || reason.length > 500) {
            res.status(400).json({ message: "Closure reason is required and must be between 10-500 characters" });
            return;
        }
        const account = yield prisma.cashAccount.findUnique({
            where: { id: idNumber },
            include: {
                operationalExpenses: { where: { paymentStatus: { not: "PAID" } } },
                clientExpenses: { where: { paymentStatus: { not: "PAID" } } },
                transactions: { take: 1, orderBy: { createdAt: "desc" } },
            },
        });
        if (!account) {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        if (account.status === client_1.AccountStatus.CLOSED) {
            res.status(400).json({ message: "Account is already closed" });
            return;
        }
        // === Strict Business Rules ===
        if (account.balance.gt(0)) {
            res.status(400).json({
                message: `Cannot close account with non-zero balance. Current balance: ${account.balance} ${account.currency}`
            });
            return;
        }
        if (account.operationalExpenses.length > 0 || account.clientExpenses.length > 0) {
            res.status(400).json({
                message: "Cannot close account with unpaid operational or client expenses"
            });
            return;
        }
        // Optional: Prevent closing if there were recent transactions (last 7 days)
        const sevenDaysAgo = (0, date_fns_1.addDays)(new Date(), -7);
        if (account.transactions.length > 0 && account.transactions[0].createdAt > sevenDaysAgo) {
            res.status(400).json({ message: "Cannot close account with recent transactions in the last 7 days" });
            return;
        }
        // === Perform Closure ===
        const closedAccount = yield prisma.cashAccount.update({
            where: { id: idNumber },
            data: Object.assign(Object.assign({ status: client_1.AccountStatus.CLOSED, isActive: false, closedAt: new Date(), closureReason: (0, sanitize_html_1.default)(reason), closureNotes: notes ? (0, sanitize_html_1.default)(notes) : null }, (role === "admin"
                ? { closedByAdminCognitoId: cognitoId }
                : { closedByAccountsCognitoId: cognitoId })), { updatedAt: new Date() }),
        });
        // Audit Log
        const actorField = role === "admin" ? "actorAdminCognitoId" : "actorAccountsCognitoId";
        yield prisma.auditLog.create({
            data: {
                action: "CLOSE",
                entity: "CashAccount",
                entityId: id,
                meta: {
                    previousStatus: account.status,
                    newStatus: "CLOSED",
                    reason: closedAccount.closureReason,
                    notes: closedAccount.closureNotes,
                    balanceAtClosure: account.balance.toString(),
                    currency: account.currency,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        res.json({
            message: "Cash account closed successfully",
            account: closedAccount,
        });
    }
    catch (error) {
        console.error("Error closing cash account:", error);
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.closeCashAccount = closeCashAccount;
const deleteCashAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        const { reason } = req.body;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        // ONLY Admin can permanently delete
        if (role !== "admin") {
            res.status(403).json({ message: "Access denied: Only Admin can permanently delete closed accounts" });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid account ID" });
            return;
        }
        if (!reason || typeof reason !== "string" || reason.length < 15) {
            res.status(400).json({ message: "Deletion reason is required and must be at least 15 characters" });
            return;
        }
        const account = yield prisma.cashAccount.findUnique({
            where: { id: idNumber },
            include: {
                dailyBalances: true,
                transactions: { take: 5 },
            },
        });
        if (!account) {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        if (account.status !== client_1.AccountStatus.CLOSED) {
            res.status(400).json({ message: "Only CLOSED accounts can be permanently deleted" });
            return;
        }
        if (!account.closedAt) {
            res.status(400).json({ message: "Account has no closure date" });
            return;
        }
        // Enforce 90-day rule
        const ninetyDaysAgo = (0, date_fns_1.addDays)(new Date(), -90);
        if (!(0, date_fns_1.isAfter)(ninetyDaysAgo, account.closedAt)) {
            const daysSinceClosure = Math.floor((Date.now() - account.closedAt.getTime()) / (1000 * 60 * 60 * 24));
            res.status(400).json({
                message: `Account can only be deleted after 90 days of closure. Currently only ${daysSinceClosure} days have passed.`
            });
            return;
        }
        // === Optional: Archive before delete (recommended for enterprise) ===
        // You can create an archive table later. For now, we log everything.
        const accountDetailsForAudit = {
            id: account.id,
            accountName: account.accountName,
            accountNumber: account.accountNumber,
            currency: account.currency,
            balanceAtClosure: account.balance.toString(),
            closedAt: account.closedAt.toISOString(),
            closureReason: account.closureReason,
            daysSinceClosure: Math.floor((Date.now() - account.closedAt.getTime()) / (1000 * 60 * 60 * 24)),
        };
        // Perform permanent deletion
        yield prisma.cashAccount.delete({
            where: { id: idNumber },
        });
        // Final Audit Log
        yield prisma.auditLog.create({
            data: {
                action: "PERMANENT_DELETE",
                entity: "CashAccount",
                entityId: id,
                meta: {
                    deletionReason: (0, sanitize_html_1.default)(reason),
                    accountDetails: accountDetailsForAudit,
                    role: "admin",
                    cognitoId,
                    note: "Permanent deletion after 90+ days closure",
                },
                actorAdminCognitoId: cognitoId,
            },
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error permanently deleting cash account:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.deleteCashAccount = deleteCashAccount;
const depositToCashAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cashAccountId = Number(req.params.id);
    const { amount, description, payee = "Cash Deposit", paymentMode = "CASH", date: dateInput = new Date().toISOString(), proofFileId, } = req.body;
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { id: cognitoId, role } = req.user;
    if (!["admin", "accounts", "staff"].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    if (isNaN(cashAccountId) || cashAccountId <= 0) {
        return res.status(400).json({ message: "Invalid cash account ID" });
    }
    const depositAmount = new client_1.Prisma.Decimal(amount);
    if (depositAmount.isNaN() || depositAmount.lte(0)) {
        return res.status(400).json({ message: "Amount must be a positive number" });
    }
    try {
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Fetch the cash account
            const account = yield tx.cashAccount.findUniqueOrThrow({
                where: { id: cashAccountId },
            });
            let txDate = new Date(dateInput);
            if (isNaN(txDate.getTime())) {
                txDate = new Date();
            }
            const txDateInNairobi = (0, date_fns_tz_1.toZonedTime)(txDate, BUSINESS_TZ);
            const dayStartInNairobi = (0, date_fns_1.startOfDay)(txDateInNairobi);
            const dayStartUtc = (0, date_fns_tz_1.fromZonedTime)(dayStartInNairobi, BUSINESS_TZ);
            const dayEndInNairobi = (0, date_fns_1.endOfDay)(txDateInNairobi);
            const dayEndUtc = (0, date_fns_tz_1.fromZonedTime)(dayEndInNairobi, BUSINESS_TZ);
            const transaction = yield tx.transaction.create({
                data: Object.assign({ amount: depositAmount, currency: account.currency, payee, paymentMode: paymentMode, status: "PAID", date: txDate, description: description || "Cash deposit / funding", cashAccountId, proofFileId: proofFileId ? Number(proofFileId) : null }, (role === "admin"
                    ? { createdByAdminCognitoId: cognitoId }
                    : { createdByAccountsCognitoId: cognitoId })),
            });
            const updatedAccount = yield tx.cashAccount.update({
                where: { id: cashAccountId },
                data: {
                    balance: { increment: depositAmount },
                    updatedAt: new Date(),
                },
            });
            let daily = yield tx.cashAccountDailyBalance.findUnique({
                where: {
                    cashAccountId_date: {
                        cashAccountId,
                        date: dayStartUtc,
                    },
                },
            });
            if (!daily) {
                const prevDayInNairobi = (0, date_fns_1.subDays)(dayStartInNairobi, 1);
                const prevDayStartUtc = (0, date_fns_tz_1.fromZonedTime)((0, date_fns_1.startOfDay)(prevDayInNairobi), BUSINESS_TZ);
                const prevDaily = yield tx.cashAccountDailyBalance.findUnique({
                    where: {
                        cashAccountId_date: {
                            cashAccountId,
                            date: prevDayStartUtc,
                        },
                    },
                });
                let opening;
                if (prevDaily) {
                    opening = prevDaily.closingBalance;
                }
                else {
                    const earlierSum = yield tx.transaction.aggregate({
                        where: {
                            cashAccountId,
                            date: { lt: dayStartUtc },
                        },
                        _sum: { amount: true },
                    });
                    opening = new client_1.Prisma.Decimal(earlierSum._sum.amount || "0");
                }
                daily = yield tx.cashAccountDailyBalance.create({
                    data: {
                        cashAccountId,
                        date: dayStartUtc,
                        openingBalance: opening,
                        closingBalance: opening,
                        netMovement: new client_1.Prisma.Decimal(0),
                        transactionCount: 0,
                    },
                });
            }
            const newNet = daily.netMovement.add(depositAmount);
            const newClosing = daily.openingBalance.add(newNet);
            daily = yield tx.cashAccountDailyBalance.update({
                where: { id: daily.id },
                data: {
                    netMovement: newNet,
                    closingBalance: newClosing,
                    transactionCount: { increment: 1 },
                    updatedAt: new Date(),
                },
            });
            // Optional: consistency check for current day
            const todayInNairobi = (0, date_fns_1.startOfDay)((0, date_fns_tz_1.toZonedTime)(new Date(), BUSINESS_TZ));
            const todayStartUtc = (0, date_fns_tz_1.fromZonedTime)(todayInNairobi, BUSINESS_TZ);
            if (dayStartUtc.getTime() === todayStartUtc.getTime()) {
                if (!updatedAccount.balance.eq(newClosing)) {
                    console.warn(`[DAILY BALANCE MISMATCH] ${dayStartUtc.toISOString()} | ` +
                        `account: ${updatedAccount.balance.toString()}, ` +
                        `daily closing: ${newClosing.toString()}`);
                }
            }
            yield tx.auditLog.create({
                data: Object.assign({ action: "DEPOSIT", entity: "CashAccount", entityId: cashAccountId.toString(), meta: {
                        transactionId: transaction.id,
                        amount: depositAmount.toString(),
                        previousBalance: account.balance.toString(),
                        newBalance: updatedAccount.balance.toString(),
                        dailyDate: dayStartUtc.toISOString(),
                        dailyOpening: daily.openingBalance.toString(),
                        dailyClosing: daily.closingBalance.toString(),
                        payee,
                        paymentMode,
                        description,
                        originalTxDate: txDate.toISOString(),
                        timezoneUsed: BUSINESS_TZ,
                    } }, (role === "admin"
                    ? { actorAdminCognitoId: cognitoId }
                    : { actorAccountsCognitoId: cognitoId })),
            });
            return {
                transaction,
                account: updatedAccount,
                dailyBalance: {
                    date: dayStartUtc.toISOString(),
                    openingBalance: daily.openingBalance.toString(),
                    closingBalance: daily.closingBalance.toString(),
                    netMovement: daily.netMovement.toString(),
                },
            };
        }));
        res.status(201).json(result);
    }
    catch (err) {
        console.error("Deposit failed:", {
            message: err.message,
            stack: err.stack,
            code: err.code,
            cashAccountId,
            amount,
            dateInput,
            userRole: role,
            timestamp: new Date().toISOString(),
        });
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                return res.status(404).json({ message: "Cash account not found" });
            }
        }
        res.status(500).json({ message: "Failed to process deposit" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.depositToCashAccount = depositToCashAccount;
const getCashAccountDailyBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const idNumber = Number(id);
        const { date: dateInput } = req.query;
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts", "staff"].includes(role)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid cash account ID" });
            return;
        }
        // Date handling (same as before)
        let targetDate;
        if (dateInput && typeof dateInput === 'string') {
            targetDate = new Date(dateInput);
            if (isNaN(targetDate.getTime())) {
                res.status(400).json({ message: "Invalid date format (use YYYY-MM-DD)" });
                return;
            }
        }
        else {
            targetDate = new Date();
        }
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(targetDate, BUSINESS_TZ);
        const dayStartInNairobi = (0, date_fns_1.startOfDay)(zonedDate);
        const targetDayStartUtc = (0, date_fns_tz_1.fromZonedTime)(dayStartInNairobi, BUSINESS_TZ);
        const daily = yield prisma.cashAccountDailyBalance.findUnique({
            where: {
                cashAccountId_date: {
                    cashAccountId: idNumber,
                    date: targetDayStartUtc,
                },
            },
        });
        const account = yield prisma.cashAccount.findUnique({
            where: { id: idNumber },
            select: { id: true, currency: true, balance: true, accountName: true },
        });
        if (!account) {
            res.status(404).json({ message: "Cash account not found" });
            return;
        }
        // ────────────────────────────────────────────────
        // Actor field logic – exactly matching your other endpoints
        const actorFieldMap = {
            admin: "actorAdminCognitoId",
            accounts: "actorAccountsCognitoId",
            staff: "actorStaffCognitoId",
        };
        const actorField = actorFieldMap[role];
        // ────────────────────────────────────────────────
        // Optional: audit log
        yield prisma.auditLog.create({
            data: {
                action: "READ_DAILY_BALANCE",
                entity: "CashAccountDailyBalance",
                entityId: idNumber.toString(),
                meta: {
                    requestedDate: dayStartInNairobi.toISOString(),
                    accountName: account.accountName,
                    currency: account.currency,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
        const response = {
            cashAccountId: account.id,
            accountName: account.accountName,
            currency: account.currency,
            currentBalance: account.balance.toString(),
            requestedDate: dayStartInNairobi.toISOString().split('T')[0],
            openingBalance: daily ? daily.openingBalance.toString() : "0",
            closingBalance: daily ? daily.closingBalance.toString() : null,
            netMovement: daily ? daily.netMovement.toString() : "0",
            transactionCount: daily ? daily.transactionCount : 0,
            note: daily && !new client_1.Prisma.Decimal(account.balance).eq(daily.closingBalance)
                ? "Warning: closing balance does not match current account balance"
                : undefined,
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error fetching daily balance:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            params: req.params,
            query: req.query,
            user: req.user,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.getCashAccountDailyBalance = getCashAccountDailyBalance;
