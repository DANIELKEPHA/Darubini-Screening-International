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
exports.downloadClientExpensesXlsx = exports.downloadClientExpensePdf = exports.approveClientExpense = exports.deleteClientExpense = exports.rejectClientExpense = exports.updateClientExpense = exports.cancelClientExpense = exports.getClientExpense = exports.getClientExpenses = exports.createClientExpense = exports.validateAccount = void 0;
const client_1 = require("@prisma/client");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const node_stream_1 = require("node:stream");
const exceljs_1 = __importDefault(require("exceljs"));
const multer_1 = __importDefault(require("multer"));
const prisma = new client_1.PrismaClient();
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("SIGTERM received — shutting down gracefully");
    yield prisma.$disconnect();
    process.exit(0);
}));
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("SIGINT received — shutting down gracefully");
    yield prisma.$disconnect();
    process.exit(0);
}));
const logAudit = (role, cognitoId, action, entityId, meta) => __awaiter(void 0, void 0, void 0, function* () {
    switch (role) {
        case "admin":
            yield prisma.auditLog.create({
                data: {
                    action,
                    entity: "ClientExpense",
                    entityId,
                    meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
                    actorAdminCognitoId: cognitoId,
                },
            });
            break;
        case "accounts":
            yield prisma.auditLog.create({
                data: {
                    action,
                    entity: "ClientExpense",
                    entityId,
                    meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
                    actorAccountsCognitoId: cognitoId,
                },
            });
            break;
        case "staff":
            yield prisma.auditLog.create({
                data: {
                    action,
                    entity: "ClientExpense",
                    entityId,
                    meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
                    actorStaffCognitoId: cognitoId,
                },
            });
            break;
    }
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
        if (allowed.includes(file.mimetype))
            cb(null, true);
        else
            cb(new Error("Only JPG, PNG, and PDF allowed"));
    },
});
const actorFieldMap = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
};
const validateAccount = (bankAccountId, cashAccountId, mobileAccountId, otherAccountId, currency) => __awaiter(void 0, void 0, void 0, function* () {
    const accountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
    if (accountIds.length > 1) {
        throw new Error(`Only one account ID can be provided: ${JSON.stringify(accountIds)}`);
    }
    if (accountIds.length === 0)
        return;
    const accountId = accountIds[0];
    let account;
    if (bankAccountId) {
        account = yield prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!account)
            throw new Error(`Bank account not found: ${bankAccountId}`);
        if (account.currency !== currency)
            throw new Error(`Bank account currency ${account.currency} must match expense currency ${currency}`);
    }
    else if (cashAccountId) {
        account = yield prisma.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (!account)
            throw new Error(`Cash account not found: ${cashAccountId}`);
        if (account.currency !== currency)
            throw new Error(`Cash account currency ${account.currency} must match expense currency ${currency}`);
    }
    else if (mobileAccountId) {
        account = yield prisma.mobileAccount.findUnique({ where: { id: mobileAccountId } });
        if (!account)
            throw new Error(`Mobile account not found: ${mobileAccountId}`);
        if (account.currency !== currency)
            throw new Error(`Mobile account currency ${account.currency} must match expense currency ${currency}`);
    }
    else if (otherAccountId) {
        account = yield prisma.otherAccount.findUnique({ where: { id: otherAccountId } });
        if (!account)
            throw new Error(`Other account not found: ${otherAccountId}`);
        if (account.currency !== currency)
            throw new Error(`Other account currency ${account.currency} must match expense currency ${currency}`);
    }
});
exports.validateAccount = validateAccount;
const createClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return; // This stops execution and satisfies Promise<void>
        }
        const { id: cognitoId, role } = req.user;
        const { agentName, candidateName, clientListId, date, expenseCheck, institutionName, paymentMode, paymentModeDescription, amount, currency = "KES", totalAmountPaid = 0, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, } = req.body;
        // === VALIDATION (Now TypeScript-safe) ===
        if (!(agentName === null || agentName === void 0 ? void 0 : agentName.trim())) {
            res.status(400).json({ message: "Agent name required" });
            return;
        }
        if (!(candidateName === null || candidateName === void 0 ? void 0 : candidateName.trim())) {
            res.status(400).json({ message: "Candidate name required" });
            return;
        }
        if (!clientListId || clientListId <= 0) {
            res.status(400).json({ message: "Valid client required" });
            return;
        }
        if (isNaN(new Date(date).getTime())) {
            res.status(400).json({ message: "Valid date required" });
            return;
        }
        if (!Object.values(client_1.ExpenseCheck).includes(expenseCheck)) {
            res.status(400).json({ message: "Invalid expense check" });
            return;
        }
        if (!(institutionName === null || institutionName === void 0 ? void 0 : institutionName.trim())) {
            res.status(400).json({ message: "Institution required" });
            return;
        }
        if (!Object.values(client_1.PaymentMode).includes(paymentMode)) {
            res.status(400).json({ message: "Invalid payment mode" });
            return;
        }
        if (!(paymentModeDescription === null || paymentModeDescription === void 0 ? void 0 : paymentModeDescription.trim())) {
            res.status(400).json({ message: "Payment description required" });
            return;
        }
        if (!amount || amount <= 0) {
            res.status(400).json({ message: "Amount must be positive" });
            return;
        }
        if (totalAmountPaid < 0) {
            res.status(400).json({ message: "Total amount paid cannot be negative" });
            return;
        }
        const effectiveCurrency = currency.toUpperCase();
        // Validate account (only one allowed)
        yield (0, exports.validateAccount)(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);
        const client = yield prisma.clientList.findUnique({
            where: { id: clientListId, isActive: true, deletedAt: null },
        });
        if (!client) {
            res.status(404).json({ message: "Client not found or inactive" });
            return;
        }
        const expense = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const created = yield tx.clientExpense.create({
                data: Object.assign(Object.assign(Object.assign({ agentName: (0, sanitize_html_1.default)(agentName.trim()), candidateName: (0, sanitize_html_1.default)(candidateName.trim()), clientName: (_b = (_a = client.clientName) !== null && _a !== void 0 ? _a : client.customClientName) !== null && _b !== void 0 ? _b : "Unknown Client", clientList: { connect: { id: clientListId } }, date: new Date(date), expenseCheck, institutionName: (0, sanitize_html_1.default)(institutionName.trim()), paymentMode, paymentModeDescription: (0, sanitize_html_1.default)(paymentModeDescription.trim()), amount: new client_1.Prisma.Decimal(amount), currency: effectiveCurrency, totalAmountPaid: new client_1.Prisma.Decimal(totalAmountPaid), paymentStatus: client_1.PaymentStatus.PENDING, expenseStatus: client_1.ExpenseStatus.PENDING, 
                    // Account connections
                    bankAccount: bankAccountId ? { connect: { id: bankAccountId } } : undefined, cashAccount: cashAccountId ? { connect: { id: cashAccountId } } : undefined, mobileAccount: mobileAccountId ? { connect: { id: mobileAccountId } } : undefined, otherAccount: otherAccountId ? { connect: { id: otherAccountId } } : undefined }, (role === "admin" && { createdByAdmin: { connect: { cognitoId } } })), (role === "accounts" && { createdByAccounts: { connect: { cognitoId } } })), (role === "staff" && { createdByStaff: { connect: { cognitoId } } })),
                include: {
                    clientList: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            const year = new Date().getFullYear();
            const referenceNumber = `DSIC${year}C${created.id.toString().padStart(6, "0")}`;
            return yield tx.clientExpense.update({
                where: { id: created.id },
                data: { referenceNumber },
                include: {
                    clientList: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
        }));
        // Audit log
        yield logAudit(role, cognitoId, "CREATE", expense.id.toString(), {
            expenseId: expense.id,
            referenceNumber: expense.referenceNumber,
            clientListId,
            bankAccountId,
            cashAccountId,
            mobileAccountId,
            otherAccountId,
        });
        res.status(201).json(expense);
        // No return needed here — res.json() + implicit return is fine
    }
    catch (error) {
        console.error("createClientExpense error:", error);
        if ((_b = (_a = error.message) === null || _a === void 0 ? void 0 : _a.includes) === null || _b === void 0 ? void 0 : _b.call(_a, "Only one account ID")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if ((_d = (_c = error.message) === null || _c === void 0 ? void 0 : _c.includes) === null || _d === void 0 ? void 0 : _d.call(_c, "not found")) {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: error.message || "Failed to create client expense" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.createClientExpense = createClientExpense;
const getClientExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const { page = "1", limit = "10", tab, period, agentName, clientName, candidateName, expenseCheck, paymentMode, search, } = req.query;
        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.min(100, Number(limit) || 10);
        const whereConditions = [];
        const tabValue = String(tab || "").toLowerCase().trim();
        if (tabValue === "drafts") {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.DRAFT });
        }
        else if (tabValue === "approved") {
            whereConditions.push({
                expenseStatus: client_1.ExpenseStatus.APPROVED,
                paymentStatus: client_1.PaymentStatus.PAID,
            });
        }
        else if (tabValue === "cancelled") {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.CANCELLED });
        }
        else if (tabValue === "rejected") {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.REJECTED });
        }
        else {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.PENDING });
        }
        if (period) {
            const dates = String(period).split(",");
            if (dates.length !== 2) {
                res.status(400).json({ message: "Invalid period format. Use start,end" });
                return;
            }
            const [start, end] = dates;
            whereConditions.push({
                date: { gte: new Date(start), lte: new Date(end) },
            });
        }
        if (search) {
            const term = String(search).trim();
            if (term) {
                const orConditions = [
                    { candidateName: { contains: term, mode: "insensitive" } },
                    { institutionName: { contains: term, mode: "insensitive" } },
                    { agentName: { contains: term, mode: "insensitive" } },
                    { clientList: { customClientName: { contains: term, mode: "insensitive" } } },
                ];
                const matchingEnums = Object.values(client_1.ClientName).filter((name) => name.toLowerCase().includes(term.toLowerCase()));
                if (matchingEnums.length > 0) {
                    orConditions.push({
                        clientList: { clientName: { in: matchingEnums } },
                    });
                }
                whereConditions.push({ OR: orConditions });
            }
        }
        if (agentName)
            whereConditions.push({
                agentName: { contains: String(agentName), mode: "insensitive" },
            });
        if (candidateName)
            whereConditions.push({
                candidateName: { contains: String(candidateName), mode: "insensitive" },
            });
        if (expenseCheck)
            whereConditions.push({ expenseCheck: String(expenseCheck) });
        if (paymentMode)
            whereConditions.push({ paymentMode: String(paymentMode) });
        if (role === "staff") {
            whereConditions.push({ createdByStaffCognitoId: cognitoId });
        }
        const where = { AND: whereConditions };
        const [expenses, total] = yield Promise.all([
            prisma.clientExpense.findMany({
                where,
                orderBy: { date: "desc" },
                skip: (pageNumber - 1) * limitNumber,
                take: limitNumber,
                include: {
                    proofFiles: {
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            url: true,
                            createdAt: true,
                            uploadedByAdmin: { select: { name: true } },
                            uploadedByAccounts: { select: { name: true } },
                            uploadedByStaff: { select: { name: true } },
                        },
                    },
                    clientList: {
                        select: {
                            id: true,
                            clientName: true,
                            customClientName: true,
                            contactEmail: true,
                            contactPhone: true,
                        },
                    },
                    createdByAdmin: { select: { name: true } },
                    createdByAccounts: { select: { name: true } },
                    createdByStaff: { select: { name: true } },
                    approvedByAdmin: { select: { name: true } },
                    approvedByAccounts: { select: { name: true } },
                    approvedByStaff: { select: { name: true } },
                },
            }),
            prisma.clientExpense.count({ where }),
        ]);
        // Enrich proof files with uploader name
        const expensesWithUploader = expenses.map((expense) => (Object.assign(Object.assign({}, expense), { proofFiles: expense.proofFiles.map((pf) => {
                var _a, _b, _c;
                return (Object.assign(Object.assign({}, pf), { uploadedBy: ((_a = pf.uploadedByAdmin) === null || _a === void 0 ? void 0 : _a.name) ||
                        ((_b = pf.uploadedByAccounts) === null || _b === void 0 ? void 0 : _b.name) ||
                        ((_c = pf.uploadedByStaff) === null || _c === void 0 ? void 0 : _c.name) ||
                        "Unknown" }));
            }) })));
        yield logAudit(role, cognitoId, "READ", "multiple", {
            count: expenses.length,
            page: pageNumber,
            limit: limitNumber,
            filters: { tab, search, period },
        });
        res.json({
            expenses: expensesWithUploader,
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        });
    }
    catch (error) {
        console.error("getClientExpenses ERROR:", error.message || error);
        console.error("Stack:", error.stack);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getClientExpenses = getClientExpenses;
const getClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const expense = yield prisma.clientExpense.findUnique({
            where: { id: idNumber },
            include: {
                proofFiles: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        url: true,
                        createdAt: true,
                        uploadedByAdmin: { select: { name: true } },
                        uploadedByAccounts: { select: { name: true } },
                        uploadedByStaff: { select: { name: true } },
                    },
                },
                clientList: {
                    select: {
                        id: true,
                        clientName: true,
                        customClientName: true,
                        contactEmail: true,
                        contactPhone: true,
                    },
                },
                createdByAdmin: { select: { name: true } },
                createdByAccounts: { select: { name: true } },
                createdByStaff: { select: { name: true } },
                approvedByAdmin: { select: { name: true } },
                approvedByAccounts: { select: { name: true } },
                approvedByStaff: { select: { name: true } },
            },
        });
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId) {
            res.status(403).json({ message: "Forbidden: You can only view your own expenses" });
            return;
        }
        // Add uploader name to each proof file
        const expenseWithUploader = Object.assign(Object.assign({}, expense), { proofFiles: expense.proofFiles.map((pf) => {
                var _a, _b, _c;
                return (Object.assign(Object.assign({}, pf), { uploadedBy: ((_a = pf.uploadedByAdmin) === null || _a === void 0 ? void 0 : _a.name) ||
                        ((_b = pf.uploadedByAccounts) === null || _b === void 0 ? void 0 : _b.name) ||
                        ((_c = pf.uploadedByStaff) === null || _c === void 0 ? void 0 : _c.name) ||
                        "Unknown" }));
            }) });
        yield logAudit(role, cognitoId, "READ", idNumber.toString(), {
            expenseId: idNumber,
            clientListId: expense.clientListId,
            hasProof: expense.proofFiles.length > 0,
        });
        res.json(expenseWithUploader);
    }
    catch (error) {
        console.error("getClientExpense error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getClientExpense = getClientExpense;
const cancelClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }
        const expense = yield prisma.clientExpense.findUnique({
            where: { id: idNumber },
        });
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (expense.paymentStatus === client_1.PaymentStatus.PAID) {
            res.status(400).json({ message: "Cannot cancel a paid expense" });
            return;
        }
        if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId) {
            res.status(403).json({ message: "You can only cancel your own expenses" });
            return;
        }
        const cancelledExpense = yield prisma.clientExpense.update({
            where: { id: idNumber },
            data: {
                expenseStatus: client_1.ExpenseStatus.CANCELLED,
                paymentStatus: client_1.PaymentStatus.FAILED,
            },
            include: {
                proofFiles: true,
                clientList: true,
            },
        });
        yield logAudit(role, cognitoId, "CANCEL", idNumber.toString(), {
            previousStatus: expense.expenseStatus,
        });
        res.json(cancelledExpense);
    }
    catch (error) {
        console.error("cancelClientExpense error:", error);
        res.status(500).json({ message: "Failed to cancel expense" });
    }
});
exports.cancelClientExpense = cancelClientExpense;
const updateClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const existingExpense = yield prisma.clientExpense.findUnique({
            where: { id: idNumber },
            include: {
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        if (!existingExpense) {
            res.status(404).json({ message: "Client expense not found" });
            return;
        }
        if (role === "staff" && existingExpense.createdByStaffCognitoId !== cognitoId) {
            res.status(403).json({ message: "Access denied: You can only update your own expenses" });
            return;
        }
        const { agentName, candidateName, clientListId, date, expenseCheck, institutionName, paymentMode, paymentModeDescription, amount, currency, totalAmountPaid, bankAccountId, cashAccountId, mobileAccountId, otherAccountId, } = req.body;
        if (agentName !== undefined) {
            if (typeof agentName !== "string" || agentName.trim().length === 0 || agentName.length > 100) {
                res.status(400).json({ message: "Agent name must be 1–100 characters" });
                return;
            }
            console.warn(`[SECURITY] Attempt to change immutable agentName from "${existingExpense.agentName}" to "${agentName}" by ${role} (${cognitoId})`);
        }
        if (candidateName !== undefined && (typeof candidateName !== "string" || candidateName.trim().length === 0 || candidateName.length > 100)) {
            res.status(400).json({ message: "Candidate name must be 1–100 characters" });
            return;
        }
        if (clientListId !== undefined && (typeof clientListId !== "number" || clientListId <= 0)) {
            res.status(400).json({ message: "Valid clientListId required" });
            return;
        }
        if (date !== undefined && isNaN(new Date(date).getTime())) {
            res.status(400).json({ message: "Invalid date" });
            return;
        }
        if (expenseCheck !== undefined && !Object.values(client_1.ExpenseCheck).includes(expenseCheck)) {
            res.status(400).json({ message: "Invalid expense check" });
            return;
        }
        if (institutionName !== undefined && (typeof institutionName !== "string" || institutionName.trim().length === 0 || institutionName.length > 100)) {
            res.status(400).json({ message: "Institution name must be 1–100 characters" });
            return;
        }
        if (paymentMode !== undefined && !Object.values(client_1.PaymentMode).includes(paymentMode)) {
            res.status(400).json({ message: "Invalid payment mode" });
            return;
        }
        if (paymentModeDescription !== undefined && (typeof paymentModeDescription !== "string" || paymentModeDescription.trim().length === 0 || paymentModeDescription.length > 500)) {
            res.status(400).json({ message: "Payment mode description must be 1–500 characters" });
            return;
        }
        if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
            res.status(400).json({ message: "Amount must be positive" });
            return;
        }
        if (currency !== undefined && (typeof currency !== "string" || currency.trim().length < 3 || currency.trim().length > 10)) {
            res.status(400).json({ message: "Currency must be 3–10 characters" });
            return;
        }
        if (totalAmountPaid !== undefined && (isNaN(totalAmountPaid) || totalAmountPaid < 0)) {
            res.status(400).json({ message: "Total amount paid cannot be negative" });
            return;
        }
        const hasAccountField = bankAccountId !== undefined || cashAccountId !== undefined || mobileAccountId !== undefined || otherAccountId !== undefined;
        if (hasAccountField) {
            const effectiveCurrency = (currency || existingExpense.currency).toUpperCase();
            yield (0, exports.validateAccount)(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);
        }
        let clientNameUpdate;
        if (clientListId !== undefined) {
            const client = yield prisma.clientList.findUnique({
                where: { id: clientListId, isActive: true, deletedAt: null },
            });
            if (!client) {
                res.status(404).json({ message: "Client not found or inactive" });
                return;
            }
            clientNameUpdate = (_b = (_a = client.clientName) !== null && _a !== void 0 ? _a : client.customClientName) !== null && _b !== void 0 ? _b : "Unknown Client";
        }
        const data = {};
        if (candidateName !== undefined)
            data.candidateName = (0, sanitize_html_1.default)(candidateName.trim());
        if (institutionName !== undefined)
            data.institutionName = (0, sanitize_html_1.default)(institutionName.trim());
        if (paymentModeDescription !== undefined)
            data.paymentModeDescription = (0, sanitize_html_1.default)(paymentModeDescription.trim());
        if (date !== undefined)
            data.date = new Date(date);
        if (expenseCheck !== undefined)
            data.expenseCheck = expenseCheck;
        if (paymentMode !== undefined)
            data.paymentMode = paymentMode;
        if (amount !== undefined)
            data.amount = new client_1.Prisma.Decimal(amount);
        if (totalAmountPaid !== undefined)
            data.totalAmountPaid = new client_1.Prisma.Decimal(totalAmountPaid);
        if (currency !== undefined)
            data.currency = currency.toUpperCase();
        if (clientListId !== undefined) {
            data.clientList = { connect: { id: clientListId } };
            data.clientName = clientNameUpdate;
        }
        // Account connections
        if (bankAccountId !== undefined) {
            data.bankAccount = bankAccountId ? { connect: { id: bankAccountId } } : { disconnect: true };
        }
        if (cashAccountId !== undefined) {
            data.cashAccount = cashAccountId ? { connect: { id: cashAccountId } } : { disconnect: true };
        }
        if (mobileAccountId !== undefined) {
            data.mobileAccount = mobileAccountId ? { connect: { id: mobileAccountId } } : { disconnect: true };
        }
        if (otherAccountId !== undefined) {
            data.otherAccount = otherAccountId ? { connect: { id: otherAccountId } } : { disconnect: true };
        }
        const updatedExpense = yield prisma.clientExpense.update({
            where: { id: idNumber },
            data,
            include: {
                proofFiles: true,
                clientList: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
            },
        });
        const updatedFields = Object.keys(data).filter(key => data[key] !== undefined);
        yield logAudit(role, cognitoId, "UPDATE", idNumber.toString(), {
            expenseId: idNumber,
            updatedFields,
            bankAccountId: updatedExpense.bankAccountId,
            cashAccountId: updatedExpense.cashAccountId,
            mobileAccountId: updatedExpense.mobileAccountId,
            otherAccountId: updatedExpense.otherAccountId,
            clientListId: updatedExpense.clientListId,
            note: agentName !== undefined ? "agentName change attempt was blocked (immutable field)" : undefined,
        });
        res.json(updatedExpense);
    }
    catch (error) {
        console.error("Error updating client expense:", error);
        if ((_d = (_c = error.message) === null || _c === void 0 ? void 0 : _c.includes) === null || _d === void 0 ? void 0 : _d.call(_c, "Only one account ID")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if ((_f = (_e = error.message) === null || _e === void 0 ? void 0 : _e.includes) === null || _f === void 0 ? void 0 : _f.call(_e, "not found")) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Record or related entity not found" });
            return;
        }
        res.status(500).json({ message: "Internal server error" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.updateClientExpense = updateClientExpense;
const rejectClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }
        const expense = yield prisma.clientExpense.findUnique({
            where: { id: idNumber },
        });
        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }
        if (expense.paymentStatus === client_1.PaymentStatus.PAID) {
            res.status(400).json({ message: "Cannot reject a paid expense" });
            return;
        }
        const updated = yield prisma.clientExpense.update({
            where: { id: idNumber },
            data: Object.assign(Object.assign({ expenseStatus: client_1.ExpenseStatus.REJECTED, paymentStatus: client_1.PaymentStatus.FAILED }, (role === "admin" && {
                approvedByAdmin: { connect: { cognitoId } },
            })), (role === "accounts" && {
                approvedByAccounts: { connect: { cognitoId } },
            })),
            include: { proofFiles: true, clientList: true },
        });
        yield logAudit(role, cognitoId, "REJECT", idNumber.toString());
        res.json(updated);
    }
    catch (error) {
        console.error("rejectClientExpense error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.rejectClientExpense = rejectClientExpense;
const deleteClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        const idNumber = Number(req.params.id);
        if (isNaN(idNumber)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }
        const expense = yield prisma.clientExpense.findUnique({ where: { id: idNumber } });
        if (!expense) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        yield prisma.clientExpense.delete({ where: { id: idNumber } });
        yield logAudit(role, cognitoId, "DELETE", idNumber.toString());
        res.json({ message: "Expense deleted" });
    }
    catch (error) {
        console.error("deleteClientExpense error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteClientExpense = deleteClientExpense;
const approveClientExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const startTime = Date.now();
    console.log(`\n[APPROVE] START → Expense ID: ${req.params.id} | User: ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.id} (${(_b = req.user) === null || _b === void 0 ? void 0 : _b.role})`);
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Forbidden: Only admin/accounts can approve" });
            return;
        }
        const idNumber = Number(req.params.id);
        const { accountId, accountType } = req.body;
        if (!accountId || !["bank", "cash", "mobile", "other"].includes(accountType)) {
            res.status(400).json({ message: "accountId and valid accountType (bank/cash/mobile/other) are required" });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(`[APPROVE] Fetching expense ${idNumber}...`);
            const expense = yield tx.clientExpense.findUnique({
                where: { id: idNumber },
                include: {
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            if (!expense)
                throw new Error("Expense not found");
            if (expense.paymentStatus === client_1.PaymentStatus.PAID)
                throw new Error("Expense already paid");
            const amountToDeduct = Number(expense.totalAmountPaid);
            console.log(`[APPROVE] Amount to deduct: ${amountToDeduct} ${expense.currency}`);
            // === UNIVERSAL ACCOUNT LOOKUP ===
            let account = null;
            let accountModel = "";
            switch (accountType) {
                case "bank":
                    account = yield tx.bankAccount.findUnique({ where: { id: accountId } });
                    accountModel = "BankAccount";
                    break;
                case "cash":
                    account = yield tx.cashAccount.findUnique({ where: { id: accountId } });
                    accountModel = "CashAccount";
                    break;
                case "mobile":
                    account = yield tx.mobileAccount.findUnique({ where: { id: accountId } });
                    accountModel = "MobileAccount";
                    break;
                case "other":
                    account = yield tx.otherAccount.findUnique({ where: { id: accountId } });
                    accountModel = "OtherAccount";
                    break;
            }
            if (!account)
                throw new Error(`${accountModel} not found`);
            if (account.currency !== expense.currency)
                throw new Error("Currency mismatch");
            const currentBalance = new client_1.Prisma.Decimal(account.balance);
            if (currentBalance.lessThan(amountToDeduct)) {
                throw new Error(`Insufficient funds in ${accountModel}: ${currentBalance} < ${amountToDeduct}`);
            }
            // === DEDUCT BALANCE ===
            console.log(`[APPROVE] Deducting ${amountToDeduct} from ${accountModel} #${accountId}`);
            switch (accountType) {
                case "bank":
                    yield tx.bankAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
                case "cash":
                    yield tx.cashAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
                case "mobile":
                    yield tx.mobileAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
                case "other":
                    yield tx.otherAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
            }
            // === FINAL UPDATE: Approve + Pay + Link Account ===
            const approvedExpense = yield tx.clientExpense.update({
                where: { id: idNumber },
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ expenseStatus: client_1.ExpenseStatus.APPROVED, paymentStatus: client_1.PaymentStatus.PAID, 
                    // Disconnect all payment accounts first
                    bankAccount: { disconnect: true }, cashAccount: { disconnect: true }, mobileAccount: { disconnect: true }, otherAccount: { disconnect: true } }, (accountType === "bank" && { bankAccount: { connect: { id: accountId } } })), (accountType === "cash" && { cashAccount: { connect: { id: accountId } } })), (accountType === "mobile" && { mobileAccount: { connect: { id: accountId } } })), (accountType === "other" && { otherAccount: { connect: { id: accountId } } })), (role === "admin" && { approvedByAdmin: { connect: { cognitoId } } })), (role === "accounts" && { approvedByAccounts: { connect: { cognitoId } } })),
                include: {
                    proofFiles: true,
                    clientList: true,
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });
            // Audit
            yield logAudit(role, cognitoId, "APPROVE_AND_PAY", idNumber.toString(), {
                amount: amountToDeduct,
                currency: expense.currency,
                accountType,
                accountId,
                accountName: account.accountName,
            });
            console.log(`[APPROVE] SUCCESS → Expense ${idNumber} is now APPROVED & PAID via ${accountType.toUpperCase()} account`);
            console.log(`[APPROVE] Took ${Date.now() - startTime}ms\n`);
            return approvedExpense;
        }));
        // SUCCESS RESPONSE — NO "return" IS FORBIDDEN HERE
        res.json(result);
    }
    catch (error) {
        console.error(`[APPROVE] FAILED → ${error.message}`);
        res.status(400).json({ message: error.message || "Failed to approve expense" });
    }
});
exports.approveClientExpense = approveClientExpense;
const downloadClientExpensePdf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
            res.status(403).json({ message: `Access denied: Role ${role} not authorized` });
            return;
        }
        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }
        const expense = yield prisma.clientExpense.findUnique({
            where: { id: idNumber },
            include: {
                clientList: true,
                createdByAdmin: true,
                createdByAccounts: true,
                createdByStaff: true,
                approvedByAdmin: true,
                approvedByAccounts: true,
                approvedByStaff: true,
                bankAccount: true,
                cashAccount: true,
                mobileAccount: true,
                otherAccount: true,
            },
        });
        if (!expense) {
            res.status(404).json({ message: "Client expense not found" });
            return;
        }
        // Staff can only download their own drafts
        if (role === "staff" &&
            expense.createdByStaffCognitoId !== cognitoId &&
            expense.expenseStatus === client_1.ExpenseStatus.DRAFT) {
            res.status(403).json({
                message: "Access denied: Cannot download draft expense created by another user",
            });
            return;
        }
        const doc = new pdfkit_1.default({
            size: "A4",
            bufferPages: true,
            margins: { top: 50, bottom: 70, left: 50, right: 50 },
        });
        const stream = new node_stream_1.PassThrough();
        const buffers = [];
        stream.on("data", (chunk) => buffers.push(chunk));
        stream.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=client-expense-${id}.pdf`);
            res.send(pdfBuffer);
        });
        doc.pipe(stream);
        const primaryColor = "#8d182c";
        const secondaryColor = "#D9911E";
        const lightGray = "#f5f5f5";
        const darkGray = "#333333";
        const borderColor = "#e0e0e0";
        // === HEADER ===
        // Logo
        doc.image("public/images/logo.png", 50, 50, { width: 60, height: 60 });
        // Reference number
        const now = new Date();
        const referenceNumber = expense.referenceNumber ||
            `DSIC${now.getFullYear()}C${expense.id.toString().padStart(6, "0")}`;
        doc
            .fillColor(secondaryColor)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(`REF: ${referenceNumber}`, 300, 65, { width: 250, align: "right" });
        // === MAIN TITLE (Expense Type) - LEFT ALIGNED ===
        const titleY = 130;
        doc
            .fillColor(primaryColor)
            .fontSize(20)
            .font("Helvetica-Bold")
            .text(expense.expenseCheck.toUpperCase(), 50, titleY);
        // === DATA SECTION ===
        const sectionY = titleY + 30;
        const cardWidth = 495;
        const cardX = 50;
        const cardHeight = 270;
        // Background container
        doc.roundedRect(cardX, sectionY, cardWidth, cardHeight, 8).fill(lightGray);
        let contentY = sectionY + 20;
        const labelWidth = 140;
        const valueX = cardX + labelWidth + 30;
        const lineHeight = 20;
        const sectionSpacing = 5;
        // Helper function for data rows
        const addDataRow = (label, value, isBold = false, isHighlighted = false) => {
            // Label
            doc
                .font("Helvetica-Bold")
                .fontSize(10)
                .fillColor(darkGray)
                .text(`${label}:`, cardX + 20, contentY, {
                width: labelWidth,
                continued: false
            });
            // Value
            const font = isBold ? "Helvetica-Bold" : "Helvetica";
            const color = isHighlighted ? primaryColor : "black";
            doc
                .font(font)
                .fontSize(10)
                .fillColor(color)
                .text(value || "N/A", valueX, contentY, {
                width: cardWidth - valueX - 20
            });
            contentY += lineHeight;
        };
        // Add all data in a clean, professional layout
        addDataRow("Client", ((_a = expense.clientList) === null || _a === void 0 ? void 0 : _a.clientName) || ((_b = expense.clientList) === null || _b === void 0 ? void 0 : _b.customClientName) || "N/A", true);
        addDataRow("Candidate Name", expense.candidateName);
        addDataRow("Institution", expense.institutionName);
        addDataRow("Date", expense.date ? new Date(expense.date).toLocaleDateString("en-KE") : "N/A");
        addDataRow("Status", expense.expenseStatus, true, true);
        addDataRow("Payment Status", expense.paymentStatus, true, true);
        contentY += sectionSpacing;
        // Thin separator line
        doc
            .moveTo(cardX + 20, contentY)
            .lineTo(cardX + cardWidth - 20, contentY)
            .lineWidth(0.5)
            .strokeColor(borderColor)
            .stroke();
        contentY += lineHeight;
        // Payment details
        let paymentAccountType = "N/A";
        let paymentAccountName = "Pending Payment";
        if (expense.bankAccount) {
            paymentAccountType = "Bank Transfer";
            paymentAccountName = expense.bankAccount.accountName;
        }
        else if (expense.cashAccount) {
            paymentAccountType = "Cash";
            paymentAccountName = expense.cashAccount.accountName;
        }
        else if (expense.mobileAccount) {
            paymentAccountType = "Mobile Money";
            paymentAccountName = expense.mobileAccount.accountName;
        }
        else if (expense.otherAccount) {
            paymentAccountType = "Other";
            paymentAccountName = expense.otherAccount.accountName;
        }
        addDataRow("Payment Mode", expense.paymentMode);
        addDataRow("Account Type", paymentAccountType, true);
        addDataRow("Account Name", paymentAccountName);
        // Amount - emphasized with more space before
        contentY += 8;
        addDataRow("Amount", `${expense.currency} ${Number(expense.totalAmountPaid).toLocaleString()}`, true, true);
        // === FOOTER - SINGLE LINE WITH ALL ELEMENTS ===
        const footerY = 700;
        // Thin line above footer
        doc
            .moveTo(50, footerY - 10)
            .lineTo(545, footerY - 10)
            .lineWidth(0.5)
            .strokeColor(borderColor)
            .stroke();
        // Get user names
        const createdBy = ((_c = expense.createdByAdmin) === null || _c === void 0 ? void 0 : _c.name) ||
            ((_d = expense.createdByAccounts) === null || _d === void 0 ? void 0 : _d.name) ||
            ((_e = expense.createdByStaff) === null || _e === void 0 ? void 0 : _e.name) ||
            "Unknown";
        const approvedBy = ((_f = expense.approvedByAdmin) === null || _f === void 0 ? void 0 : _f.name) ||
            ((_g = expense.approvedByAccounts) === null || _g === void 0 ? void 0 : _g.name) ||
            ((_h = expense.approvedByStaff) === null || _h === void 0 ? void 0 : _h.name) ||
            "Not Approved";
        const downloadedOn = new Date().toLocaleString("en-KE");
        // Single line footer with all elements
        doc
            .fontSize(8)
            .font("Helvetica");
        // Start at left margin
        let currentX = 50;
        // Created By
        doc
            .fillColor(darkGray)
            .text("Created By: ", currentX, footerY, { continued: true })
            .fillColor("black")
            .font("Helvetica-Bold")
            .text(createdBy);
        // Move position for next element
        const createdByWidth = doc.widthOfString(`Created By: ${createdBy}`);
        currentX += createdByWidth + 15; // 15px spacing
        // Separator
        doc
            .fillColor("#cccccc")
            .font("Helvetica")
            .text("•", currentX, footerY, { continued: false });
        currentX += 10; // Space after separator
        // Approved By
        doc
            .fillColor(darkGray)
            .text("Approved By: ", currentX, footerY, { continued: true })
            .fillColor("black")
            .font("Helvetica-Bold")
            .text(approvedBy);
        // Move position for next element
        const approvedByWidth = doc.widthOfString(`Approved By: ${approvedBy}`);
        currentX += approvedByWidth + 15;
        // Separator
        doc
            .fillColor("#cccccc")
            .font("Helvetica")
            .text("•", currentX, footerY, { continued: false });
        currentX += 10;
        // Downloaded On
        doc
            .fillColor(darkGray)
            .text("Downloaded: ", currentX, footerY, { continued: true })
            .fillColor("black")
            .font("Helvetica-Bold")
            .text(downloadedOn);
        // Move position for page info (right side)
        const downloadedWidth = doc.widthOfString(`Downloaded: ${downloadedOn}`);
        currentX += downloadedWidth + 15;
        // Separator
        doc
            .fillColor("#cccccc")
            .font("Helvetica")
            .text("•", currentX, footerY, { continued: false });
        currentX += 10;
        // Page info
        doc
            .fillColor(darkGray)
            .text("Page ", currentX, footerY, { continued: true })
            .fillColor("black")
            .font("Helvetica-Bold")
            .text("1", { continued: true })
            .fillColor(darkGray)
            .font("Helvetica")
            .text(" of ", { continued: true })
            .fillColor("black")
            .font("Helvetica-Bold")
            .text("1", { continued: false });
        // Branding at very bottom (centered)
        doc
            .fontSize(7)
            .fillColor("#666666")
            .font("Helvetica")
            .text(`Darubini Client Expense • ${new Date().getFullYear()}`, 50, footerY + 15, { width: 495, align: "center" });
        doc.end();
        // === AUDIT LOG ===
        const actorField = role === "admin" ? "actorAdminCognitoId" :
            role === "accounts" ? "actorAccountsCognitoId" :
                "actorStaffCognitoId";
        yield prisma.auditLog.create({
            data: {
                action: "DOWNLOAD_PDF",
                entity: "ClientExpense",
                entityId: id,
                meta: {
                    referenceNumber: expense.referenceNumber,
                    agentName: expense.agentName,
                    candidateName: expense.candidateName,
                    clientName: expense.clientName,
                    amount: expense.totalAmountPaid.toString(),
                    currency: expense.currency,
                    paymentStatus: expense.paymentStatus,
                    expenseStatus: expense.expenseStatus,
                    role,
                    cognitoId,
                },
                [actorField]: cognitoId,
            },
        });
    }
    catch (error) {
        console.error("Error downloading client expense PDF:", error);
        res.status(500).json({ message: "Failed to generate PDF" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.downloadClientExpensePdf = downloadClientExpensePdf;
const downloadClientExpensesXlsx = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const { id: cognitoId, role } = req.user;
        const { tab, period, agentName, candidateName, expenseCheck, paymentMode, search, } = req.query;
        const whereConditions = [];
        const tabValue = String(tab || "").toLowerCase().trim();
        if (tabValue === "drafts") {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.DRAFT });
        }
        else if (tabValue === "approved") {
            whereConditions.push({
                expenseStatus: client_1.ExpenseStatus.APPROVED,
                paymentStatus: client_1.PaymentStatus.PAID,
            });
        }
        else if (tabValue === "cancelled") {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.CANCELLED });
        }
        else if (tabValue === "rejected") {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.REJECTED });
        }
        else {
            whereConditions.push({ expenseStatus: client_1.ExpenseStatus.PENDING });
        }
        if (period) {
            const dates = String(period).split(",");
            if (dates.length !== 2) {
                res.status(400).json({ message: "Invalid period format. Use start,end" });
                return;
            }
            const [start, end] = dates;
            whereConditions.push({
                date: { gte: new Date(start), lte: new Date(end) },
            });
        }
        if (search) {
            const term = String(search).trim();
            if (term) {
                const orConditions = [
                    { candidateName: { contains: term, mode: "insensitive" } },
                    { institutionName: { contains: term, mode: "insensitive" } },
                    { agentName: { contains: term, mode: "insensitive" } },
                    { clientList: { customClientName: { contains: term, mode: "insensitive" } } },
                ];
                const matchingEnums = Object.values(client_1.ClientName).filter((name) => name.toLowerCase().includes(term.toLowerCase()));
                if (matchingEnums.length > 0) {
                    orConditions.push({ clientList: { clientName: { in: matchingEnums } } });
                }
                whereConditions.push({ OR: orConditions });
            }
        }
        if (agentName)
            whereConditions.push({ agentName: { contains: String(agentName), mode: "insensitive" } });
        if (candidateName)
            whereConditions.push({ candidateName: { contains: String(candidateName), mode: "insensitive" } });
        if (expenseCheck)
            whereConditions.push({ expenseCheck: String(expenseCheck) });
        if (paymentMode)
            whereConditions.push({ paymentMode: String(paymentMode) });
        if (role === "staff") {
            whereConditions.push({ createdByStaffCognitoId: cognitoId });
        }
        const where = { AND: whereConditions };
        const expenses = yield prisma.clientExpense.findMany({
            where,
            orderBy: { date: "desc" },
            include: {
                clientList: { select: { clientName: true, customClientName: true } },
                createdByAdmin: { select: { name: true } },
                createdByAccounts: { select: { name: true } },
                createdByStaff: { select: { name: true } },
                approvedByAdmin: { select: { name: true } },
                approvedByAccounts: { select: { name: true } },
                bankAccount: { select: { accountName: true } },
                cashAccount: { select: { accountName: true } },
                mobileAccount: { select: { accountName: true } },
                otherAccount: { select: { accountName: true } },
            },
        });
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = "Darubini System";
        workbook.created = new Date();
        const sheet = workbook.addWorksheet("Client Expenses");
        sheet.columns = [
            { header: "Ref No.", key: "ref", width: 18 },
            { header: "Date", key: "date", width: 14 },
            { header: "Client", key: "client", width: 25 },
            { header: "Candidate", key: "candidate", width: 22 },
            { header: "Agent", key: "agent", width: 20 },
            { header: "Institution", key: "institution", width: 25 },
            { header: "Type", key: "type", width: 18 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Currency", key: "currency", width: 10 },
            { header: "Payment Mode", key: "paymentMode", width: 16 },
            { header: "Payment Account", key: "account", width: 22 },
            { header: "Expense Status", key: "expenseStatus", width: 16 },
            { header: "Payment Status", key: "paymentStatus", width: 16 },
            { header: "Created By", key: "createdBy", width: 20 },
            { header: "Approved By", key: "approvedBy", width: 20 },
        ];
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8D182C" } };
        expenses.forEach((exp) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const client = ((_a = exp.clientList) === null || _a === void 0 ? void 0 : _a.clientName) || ((_b = exp.clientList) === null || _b === void 0 ? void 0 : _b.customClientName) || "Unknown";
            const createdBy = ((_c = exp.createdByAdmin) === null || _c === void 0 ? void 0 : _c.name) || ((_d = exp.createdByAccounts) === null || _d === void 0 ? void 0 : _d.name) || ((_e = exp.createdByStaff) === null || _e === void 0 ? void 0 : _e.name) || "Unknown";
            const approvedBy = ((_f = exp.approvedByAdmin) === null || _f === void 0 ? void 0 : _f.name) || ((_g = exp.approvedByAccounts) === null || _g === void 0 ? void 0 : _g.name) || "Not Approved";
            let account = "Pending";
            if (exp.bankAccount)
                account = exp.bankAccount.accountName || "Bank";
            else if (exp.cashAccount)
                account = exp.cashAccount.accountName || "Cash";
            else if (exp.mobileAccount)
                account = exp.mobileAccount.accountName || "Mobile";
            else if (exp.otherAccount)
                account = exp.otherAccount.accountName || "Other";
            sheet.addRow({
                ref: exp.referenceNumber || `DSIC${new Date().getFullYear()}C${exp.id.toString().padStart(6, "0")}`,
                date: exp.date ? new Date(exp.date).toLocaleDateString("en-KE") : "",
                client,
                candidate: exp.candidateName,
                agent: exp.agentName,
                institution: exp.institutionName,
                type: exp.expenseCheck,
                amount: Number(exp.totalAmountPaid).toLocaleString(),
                currency: exp.currency,
                paymentMode: exp.paymentMode,
                account,
                expenseStatus: exp.expenseStatus,
                paymentStatus: exp.paymentStatus,
                createdBy,
                approvedBy,
            });
        });
        const buffer = yield workbook.xlsx.writeBuffer();
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=client-expenses-${new Date().toISOString().slice(0, 10)}.xlsx`);
        res.send(buffer);
        yield logAudit(role, cognitoId, "DOWNLOAD_XLSX", "multiple", {
            count: expenses.length,
            filters: { tab, period, search },
        });
    }
    catch (error) {
        console.error("downloadClientExpensesXlsx error:", error);
        res.status(500).json({ message: "Failed to generate Excel file" });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.downloadClientExpensesXlsx = downloadClientExpensesXlsx;
