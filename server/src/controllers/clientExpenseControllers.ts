import { Request, Response } from "express";
import {
    PrismaClient,
    Prisma,
    ExpenseCheck,
    PaymentMode,
    PaymentStatus,
    ClientName,
    ExpenseStatus
} from "@prisma/client";
import sanitizeHtml from "sanitize-html";
import PDFDocument from "pdfkit";
import {PassThrough} from "node:stream";
import ExcelJS from "exceljs";
import multer from "multer";

const prisma = new PrismaClient();

type UserRole = "admin" | "accounts" | "staff";

interface AuthUser {
    id: string;
    role: UserRole;
}

process.on("SIGTERM", async () => {
    console.log("SIGTERM received — shutting down gracefully");
    await prisma.$disconnect();
    process.exit(0);
});
process.on("SIGINT", async () => {
    console.log("SIGINT received — shutting down gracefully");
    await prisma.$disconnect();
    process.exit(0);
});

const logAudit = async (
    role: UserRole,
    cognitoId: string,
    action: string,
    entityId: string,
    meta?: any
) => {
    switch (role) {
        case "admin":
            await prisma.auditLog.create({
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
            await prisma.auditLog.create({
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
            await prisma.auditLog.create({
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
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Only JPG, PNG, and PDF allowed"));
    },
});

const actorFieldMap: Record<UserRole, string> = {
    admin: "actorAdminCognitoId",
    accounts: "actorAccountsCognitoId",
    staff: "actorStaffCognitoId",
};

export const validateAccount = async (
    bankAccountId: number | undefined,
    cashAccountId: number | undefined,
    mobileAccountId: number | undefined,
    otherAccountId: number | undefined,
    currency: string
): Promise<void> => {
    const accountIds = [bankAccountId, cashAccountId, mobileAccountId, otherAccountId].filter(id => id !== undefined);
    if (accountIds.length > 1) {
        throw new Error(`Only one account ID can be provided: ${JSON.stringify(accountIds)}`);
    }
    if (accountIds.length === 0) return;

    const accountId = accountIds[0]!;
    let account;

    if (bankAccountId) {
        account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!account) throw new Error(`Bank account not found: ${bankAccountId}`);
        if (account.currency !== currency) throw new Error(`Bank account currency ${account.currency} must match expense currency ${currency}`);
    } else if (cashAccountId) {
        account = await prisma.cashAccount.findUnique({ where: { id: cashAccountId } });
        if (!account) throw new Error(`Cash account not found: ${cashAccountId}`);
        if (account.currency !== currency) throw new Error(`Cash account currency ${account.currency} must match expense currency ${currency}`);
    } else if (mobileAccountId) {
        account = await prisma.mobileAccount.findUnique({ where: { id: mobileAccountId } });
        if (!account) throw new Error(`Mobile account not found: ${mobileAccountId}`);
        if (account.currency !== currency) throw new Error(`Mobile account currency ${account.currency} must match expense currency ${currency}`);
    } else if (otherAccountId) {
        account = await prisma.otherAccount.findUnique({ where: { id: otherAccountId } });
        if (!account) throw new Error(`Other account not found: ${otherAccountId}`);
        if (account.currency !== currency) throw new Error(`Other account currency ${account.currency} must match expense currency ${currency}`);
    }
};

export const createClientExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return; // This stops execution and satisfies Promise<void>
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        const {
            agentName,
            candidateName,
            clientListId,
            date,
            expenseCheck,
            institutionName,
            paymentMode,
            paymentModeDescription,
            amount,
            currency = "KES",
            totalAmountPaid = 0,
            bankAccountId,
            cashAccountId,
            mobileAccountId,
            otherAccountId,
        } = req.body as {
            agentName: string;
            candidateName: string;
            clientListId: number;
            date: string;
            expenseCheck: ExpenseCheck;
            institutionName: string;
            paymentMode: PaymentMode;
            paymentModeDescription: string;
            amount: number;
            currency?: string;
            totalAmountPaid?: number;
            bankAccountId?: number;
            cashAccountId?: number;
            mobileAccountId?: number;
            otherAccountId?: number;
        };

        // === VALIDATION (Now TypeScript-safe) ===
        if (!agentName?.trim()) {
            res.status(400).json({ message: "Agent name required" });
            return;
        }
        if (!candidateName?.trim()) {
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
        if (!Object.values(ExpenseCheck).includes(expenseCheck)) {
            res.status(400).json({ message: "Invalid expense check" });
            return;
        }
        if (!institutionName?.trim()) {
            res.status(400).json({ message: "Institution required" });
            return;
        }
        if (!Object.values(PaymentMode).includes(paymentMode)) {
            res.status(400).json({ message: "Invalid payment mode" });
            return;
        }
        if (!paymentModeDescription?.trim()) {
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
        await validateAccount(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);

        const client = await prisma.clientList.findUnique({
            where: { id: clientListId, isActive: true, deletedAt: null },
        });
        if (!client) {
            res.status(404).json({ message: "Client not found or inactive" });
            return;
        }

        const expense = await prisma.$transaction(async (tx) => {
            const created = await tx.clientExpense.create({
                data: {
                    agentName: sanitizeHtml(agentName.trim()),
                    candidateName: sanitizeHtml(candidateName.trim()),
                    clientName: client.clientName ?? client.customClientName ?? "Unknown Client",
                    clientList: { connect: { id: clientListId } },
                    date: new Date(date),
                    expenseCheck,
                    institutionName: sanitizeHtml(institutionName.trim()),
                    paymentMode,
                    paymentModeDescription: sanitizeHtml(paymentModeDescription.trim()),
                    amount: new Prisma.Decimal(amount),
                    currency: effectiveCurrency,
                    totalAmountPaid: new Prisma.Decimal(totalAmountPaid),
                    paymentStatus: PaymentStatus.PENDING,
                    expenseStatus: ExpenseStatus.PENDING,

                    // Account connections
                    bankAccount: bankAccountId ? { connect: { id: bankAccountId } } : undefined,
                    cashAccount: cashAccountId ? { connect: { id: cashAccountId } } : undefined,
                    mobileAccount: mobileAccountId ? { connect: { id: mobileAccountId } } : undefined,
                    otherAccount: otherAccountId ? { connect: { id: otherAccountId } } : undefined,

                    // Creator
                    ...(role === "admin" && { createdByAdmin: { connect: { cognitoId } } }),
                    ...(role === "accounts" && { createdByAccounts: { connect: { cognitoId } } }),
                    ...(role === "staff" && { createdByStaff: { connect: { cognitoId } } }),
                },
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

            return await tx.clientExpense.update({
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
        });

        // Audit log
        await logAudit(role, cognitoId, "CREATE", expense.id.toString(), {
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
    } catch (error: any) {
        console.error("createClientExpense error:", error);

        if (error.message?.includes?.("Only one account ID")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message?.includes?.("not found")) {
            res.status(404).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: error.message || "Failed to create client expense" });
    } finally {
        await prisma.$disconnect();
    }
};

export const getClientExpenses = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        const {
            page = "1",
            limit = "10",
            tab,
            period,
            agentName,
            clientName,
            candidateName,
            expenseCheck,
            paymentMode,
            search,
        } = req.query;

        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.min(100, Number(limit) || 10);

        const whereConditions: Prisma.ClientExpenseWhereInput[] = [];

        const tabValue = String(tab || "").toLowerCase().trim();
        if (tabValue === "drafts") {
            whereConditions.push({ expenseStatus: ExpenseStatus.DRAFT });
        } else if (tabValue === "approved") {
            whereConditions.push({
                expenseStatus: ExpenseStatus.APPROVED,
                paymentStatus: PaymentStatus.PAID,
            });
        } else if (tabValue === "cancelled") {
            whereConditions.push({ expenseStatus: ExpenseStatus.CANCELLED });
        } else if (tabValue === "rejected") {
            whereConditions.push({ expenseStatus: ExpenseStatus.REJECTED });
        } else {
            whereConditions.push({ expenseStatus: ExpenseStatus.PENDING });
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
                const orConditions: Prisma.ClientExpenseWhereInput[] = [
                    { candidateName: { contains: term, mode: "insensitive" } },
                    { institutionName: { contains: term, mode: "insensitive" } },
                    { agentName: { contains: term, mode: "insensitive" } },
                    { clientList: { customClientName: { contains: term, mode: "insensitive" } } },
                ];

                const matchingEnums = Object.values(ClientName).filter((name) =>
                    name.toLowerCase().includes(term.toLowerCase())
                );
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
            whereConditions.push({ expenseCheck: String(expenseCheck) as ExpenseCheck });
        if (paymentMode)
            whereConditions.push({ paymentMode: String(paymentMode) as PaymentMode });

        if (role === "staff") {
            whereConditions.push({ createdByStaffCognitoId: cognitoId });
        }

        const where: Prisma.ClientExpenseWhereInput = { AND: whereConditions };

        const [expenses, total] = await Promise.all([
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
        const expensesWithUploader = expenses.map((expense) => ({
            ...expense,
            proofFiles: expense.proofFiles.map((pf) => ({
                ...pf,
                uploadedBy:
                    pf.uploadedByAdmin?.name ||
                    pf.uploadedByAccounts?.name ||
                    pf.uploadedByStaff?.name ||
                    "Unknown",
            })),
        }));

        await logAudit(role, cognitoId, "READ", "multiple", {
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
    } catch (error: any) {
        console.error("getClientExpenses ERROR:", error.message || error);
        console.error("Stack:", error.stack);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getClientExpense = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const idNumber = Number(req.params.id);

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const expense = await prisma.clientExpense.findUnique({
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
        const expenseWithUploader = {
            ...expense,
            proofFiles: expense.proofFiles.map((pf) => ({
                ...pf,
                uploadedBy:
                    pf.uploadedByAdmin?.name ||
                    pf.uploadedByAccounts?.name ||
                    pf.uploadedByStaff?.name ||
                    "Unknown",
            })),
        };

        await logAudit(role, cognitoId, "READ", idNumber.toString(), {
            expenseId: idNumber,
            clientListId: expense.clientListId,
            hasProof: expense.proofFiles.length > 0,
        });

        res.json(expenseWithUploader);
    } catch (error: any) {
        console.error("getClientExpense error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const cancelClientExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const idNumber = Number(req.params.id);

        if (isNaN(idNumber)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expense = await prisma.clientExpense.findUnique({
            where: { id: idNumber },
        });

        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (expense.paymentStatus === PaymentStatus.PAID) {
            res.status(400).json({ message: "Cannot cancel a paid expense" });
            return;
        }

        if (role === "staff" && expense.createdByStaffCognitoId !== cognitoId) {
            res.status(403).json({ message: "You can only cancel your own expenses" });
            return;
        }

        const cancelledExpense = await prisma.clientExpense.update({
            where: { id: idNumber },
            data: {
                expenseStatus: ExpenseStatus.CANCELLED,
                paymentStatus: PaymentStatus.FAILED,
            },
            include: {
                proofFiles: true,
                clientList: true,
            },
        });

        await logAudit(role, cognitoId, "CANCEL", idNumber.toString(), {
            previousStatus: expense.expenseStatus,
        });

        res.json(cancelledExpense);
    } catch (error) {
        console.error("cancelClientExpense error:", error);
        res.status(500).json({ message: "Failed to cancel expense" });
    }
};

export const updateClientExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const idNumber = Number(req.params.id);

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const existingExpense = await prisma.clientExpense.findUnique({
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

        const {
            agentName,
            candidateName,
            clientListId,
            date,
            expenseCheck,
            institutionName,
            paymentMode,
            paymentModeDescription,
            amount,
            currency,
            totalAmountPaid,
            bankAccountId,
            cashAccountId,
            mobileAccountId,
            otherAccountId,
        } = req.body as Partial<{
            agentName: string;
            candidateName: string;
            clientListId: number;
            date: string;
            expenseCheck: ExpenseCheck;
            institutionName: string;
            paymentMode: PaymentMode;
            paymentModeDescription: string;
            amount: number;
            currency: string;
            totalAmountPaid: number;
            bankAccountId?: number;
            cashAccountId?: number;
            mobileAccountId?: number;
            otherAccountId?: number;
        }>;

        if (agentName !== undefined) {
            if (typeof agentName !== "string" || agentName.trim().length === 0 || agentName.length > 100) {
                res.status(400).json({ message: "Agent name must be 1–100 characters" });
                return;
            }

            console.warn(
                `[SECURITY] Attempt to change immutable agentName from "${existingExpense.agentName}" to "${agentName}" by ${role} (${cognitoId})`
            );
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

        if (expenseCheck !== undefined && !Object.values(ExpenseCheck).includes(expenseCheck)) {
            res.status(400).json({ message: "Invalid expense check" });
            return;
        }

        if (institutionName !== undefined && (typeof institutionName !== "string" || institutionName.trim().length === 0 || institutionName.length > 100)) {
            res.status(400).json({ message: "Institution name must be 1–100 characters" });
            return;
        }

        if (paymentMode !== undefined && !Object.values(PaymentMode).includes(paymentMode)) {
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
            await validateAccount(bankAccountId, cashAccountId, mobileAccountId, otherAccountId, effectiveCurrency);
        }

        let clientNameUpdate: string | undefined;
        if (clientListId !== undefined) {
            const client = await prisma.clientList.findUnique({
                where: { id: clientListId, isActive: true, deletedAt: null },
            });
            if (!client) {
                res.status(404).json({ message: "Client not found or inactive" });
                return;
            }
            clientNameUpdate = client.clientName ?? client.customClientName ?? "Unknown Client";
        }

        const data: Prisma.ClientExpenseUpdateInput = {};

        if (candidateName !== undefined) data.candidateName = sanitizeHtml(candidateName.trim());
        if (institutionName !== undefined) data.institutionName = sanitizeHtml(institutionName.trim());
        if (paymentModeDescription !== undefined) data.paymentModeDescription = sanitizeHtml(paymentModeDescription.trim());
        if (date !== undefined) data.date = new Date(date);
        if (expenseCheck !== undefined) data.expenseCheck = expenseCheck;
        if (paymentMode !== undefined) data.paymentMode = paymentMode;
        if (amount !== undefined) data.amount = new Prisma.Decimal(amount);
        if (totalAmountPaid !== undefined) data.totalAmountPaid = new Prisma.Decimal(totalAmountPaid);
        if (currency !== undefined) data.currency = currency.toUpperCase();

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

        const updatedExpense = await prisma.clientExpense.update({
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

        const updatedFields = Object.keys(data).filter(key => data[key as keyof typeof data] !== undefined);

        await logAudit(role, cognitoId, "UPDATE", idNumber.toString(), {
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
    } catch (error: any) {
        console.error("Error updating client expense:", error);

        if (error.message?.includes?.("Only one account ID")) {
            res.status(400).json({ message: error.message });
            return;
        }
        if (error.message?.includes?.("not found")) {
            res.status(404).json({ message: error.message });
            return;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            res.status(404).json({ message: "Record or related entity not found" });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const rejectClientExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const idNumber = Number(req.params.id);
        if (isNaN(idNumber)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expense = await prisma.clientExpense.findUnique({
            where: { id: idNumber },
        });

        if (!expense) {
            res.status(404).json({ message: "Expense not found" });
            return;
        }

        if (expense.paymentStatus === PaymentStatus.PAID) {
            res.status(400).json({ message: "Cannot reject a paid expense" });
            return;
        }

        const updated = await prisma.clientExpense.update({
            where: { id: idNumber },
            data: {
                expenseStatus: ExpenseStatus.REJECTED,
                paymentStatus: PaymentStatus.FAILED,

                ...(role === "admin" && {
                    approvedByAdmin: { connect: { cognitoId } },
                }),
                ...(role === "accounts" && {
                    approvedByAccounts: { connect: { cognitoId } },
                }),
            },
            include: { proofFiles: true, clientList: true },
        });

        await logAudit(role, cognitoId, "REJECT", idNumber.toString());

        res.json(updated);
    } catch (error) {
        console.error("rejectClientExpense error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteClientExpense = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const idNumber = Number(req.params.id);
        if (isNaN(idNumber)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expense = await prisma.clientExpense.findUnique({ where: { id: idNumber } });
        if (!expense) {
            res.status(404).json({ message: "Not found" });
            return;
        }

        await prisma.clientExpense.delete({ where: { id: idNumber } });
        await logAudit(role, cognitoId, "DELETE", idNumber.toString());

        res.json({ message: "Expense deleted" });
    } catch (error) {
        console.error("deleteClientExpense error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const approveClientExpense = async (
    req: Request,
    res: Response
): Promise<void> => {
    const startTime = Date.now();
    console.log(`\n[APPROVE] START → Expense ID: ${req.params.id} | User: ${req.user?.id} (${(req.user as AuthUser)?.role})`);

    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        if (!["admin", "accounts"].includes(role)) {
            res.status(403).json({ message: "Forbidden: Only admin/accounts can approve" });
            return;
        }

        const idNumber = Number(req.params.id);
        const { accountId, accountType } = req.body as {
            accountId: number;
            accountType: "bank" | "cash" | "mobile" | "other";
        };

        if (!accountId || !["bank", "cash", "mobile", "other"].includes(accountType)) {
            res.status(400).json({ message: "accountId and valid accountType (bank/cash/mobile/other) are required" });
            return;
        }

        const result = await prisma.$transaction(async (tx) => {
            console.log(`[APPROVE] Fetching expense ${idNumber}...`);
            const expense = await tx.clientExpense.findUnique({
                where: { id: idNumber },
                include: {
                    bankAccount: true,
                    cashAccount: true,
                    mobileAccount: true,
                    otherAccount: true,
                },
            });

            if (!expense) throw new Error("Expense not found");
            if (expense.paymentStatus === PaymentStatus.PAID) throw new Error("Expense already paid");

            const amountToDeduct = Number(expense.totalAmountPaid);
            console.log(`[APPROVE] Amount to deduct: ${amountToDeduct} ${expense.currency}`);

            // === UNIVERSAL ACCOUNT LOOKUP ===
            let account: any = null;
            let accountModel = "";

            switch (accountType) {
                case "bank":
                    account = await tx.bankAccount.findUnique({ where: { id: accountId } });
                    accountModel = "BankAccount";
                    break;
                case "cash":
                    account = await tx.cashAccount.findUnique({ where: { id: accountId } });
                    accountModel = "CashAccount";
                    break;
                case "mobile":
                    account = await tx.mobileAccount.findUnique({ where: { id: accountId } });
                    accountModel = "MobileAccount";
                    break;
                case "other":
                    account = await tx.otherAccount.findUnique({ where: { id: accountId } });
                    accountModel = "OtherAccount";
                    break;
            }

            if (!account) throw new Error(`${accountModel} not found`);
            if (account.currency !== expense.currency) throw new Error("Currency mismatch");

            const currentBalance = new Prisma.Decimal(account.balance);
            if (currentBalance.lessThan(amountToDeduct)) {
                throw new Error(`Insufficient funds in ${accountModel}: ${currentBalance} < ${amountToDeduct}`);
            }

            // === DEDUCT BALANCE ===
            console.log(`[APPROVE] Deducting ${amountToDeduct} from ${accountModel} #${accountId}`);
            switch (accountType) {
                case "bank":
                    await tx.bankAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
                case "cash":
                    await tx.cashAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
                case "mobile":
                    await tx.mobileAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
                case "other":
                    await tx.otherAccount.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amountToDeduct } },
                    });
                    break;
            }

            // === FINAL UPDATE: Approve + Pay + Link Account ===
            const approvedExpense = await tx.clientExpense.update({
                where: { id: idNumber },
                data: {
                    expenseStatus: ExpenseStatus.APPROVED,
                    paymentStatus: PaymentStatus.PAID,

                    // Disconnect all payment accounts first
                    bankAccount: { disconnect: true },
                    cashAccount: { disconnect: true },
                    mobileAccount: { disconnect: true },
                    otherAccount: { disconnect: true },

                    // Connect the correct one
                    ...(accountType === "bank" && { bankAccount: { connect: { id: accountId } } }),
                    ...(accountType === "cash" && { cashAccount: { connect: { id: accountId } } }),
                    ...(accountType === "mobile" && { mobileAccount: { connect: { id: accountId } } }),
                    ...(accountType === "other" && { otherAccount: { connect: { id: accountId } } }),

                    // Record who approved
                    ...(role === "admin" && { approvedByAdmin: { connect: { cognitoId } } }),
                    ...(role === "accounts" && { approvedByAccounts: { connect: { cognitoId } } }),
                },
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
            await logAudit(role, cognitoId, "APPROVE_AND_PAY", idNumber.toString(), {
                amount: amountToDeduct,
                currency: expense.currency,
                accountType,
                accountId,
                accountName: account.accountName,
            });

            console.log(`[APPROVE] SUCCESS → Expense ${idNumber} is now APPROVED & PAID via ${accountType.toUpperCase()} account`);
            console.log(`[APPROVE] Took ${Date.now() - startTime}ms\n`);

            return approvedExpense;
        });

        // SUCCESS RESPONSE — NO "return" IS FORBIDDEN HERE
        res.json(result);

    } catch (error: any) {
        console.error(`[APPROVE] FAILED → ${error.message}`);
        res.status(400).json({ message: error.message || "Failed to approve expense" });
    }
};

export const downloadClientExpensePdf = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idNumber = Number(id);

        if (!req.user) {
            res.status(401).json({ message: "Unauthorized: No authenticated user" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;
        const allowedRoles: UserRole[] = ["admin", "accounts", "staff"];

        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied: Role ${role} not authorized` });
            return;
        }

        if (isNaN(idNumber) || idNumber <= 0) {
            res.status(400).json({ message: "Invalid expense ID" });
            return;
        }

        const expense = await prisma.clientExpense.findUnique({
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
        if (
            role === "staff" &&
            expense.createdByStaffCognitoId !== cognitoId &&
            expense.expenseStatus === ExpenseStatus.DRAFT
        ) {
            res.status(403).json({
                message: "Access denied: Cannot download draft expense created by another user",
            });
            return;
        }

        const doc = new PDFDocument({
            size: "A4",
            bufferPages: true,
            margins: { top: 50, bottom: 70, left: 50, right: 50 },
        });

        const stream = new PassThrough();
        const buffers: Buffer[] = [];

        stream.on("data", (chunk) => buffers.push(chunk));
        stream.on("end", () => {
            const pdfBuffer = Buffer.concat(buffers);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=client-expense-${id}.pdf`
            );
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
        const addDataRow = (label: string, value: string, isBold = false, isHighlighted = false) => {
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
        addDataRow("Client", expense.clientList?.clientName || expense.clientList?.customClientName || "N/A", true);
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
        } else if (expense.cashAccount) {
            paymentAccountType = "Cash";
            paymentAccountName = expense.cashAccount.accountName;
        } else if (expense.mobileAccount) {
            paymentAccountType = "Mobile Money";
            paymentAccountName = expense.mobileAccount.accountName;
        } else if (expense.otherAccount) {
            paymentAccountType = "Other";
            paymentAccountName = expense.otherAccount.accountName;
        }

        addDataRow("Payment Mode", expense.paymentMode);
        addDataRow("Account Type", paymentAccountType, true);
        addDataRow("Account Name", paymentAccountName);

        // Amount - emphasized with more space before
        contentY += 8;
        addDataRow("Amount",
            `${expense.currency} ${Number(expense.totalAmountPaid).toLocaleString()}`,
            true,
            true
        );

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
        const createdBy = expense.createdByAdmin?.name ||
            expense.createdByAccounts?.name ||
            expense.createdByStaff?.name ||
            "Unknown";

        const approvedBy = expense.approvedByAdmin?.name ||
            expense.approvedByAccounts?.name ||
            expense.approvedByStaff?.name ||
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
            .text(
                `Darubini Client Expense • ${new Date().getFullYear()}`,
                50,
                footerY + 15,
                { width: 495, align: "center" }
            );

        doc.end();

        // === AUDIT LOG ===
        const actorField =
            role === "admin" ? "actorAdminCognitoId" :
                role === "accounts" ? "actorAccountsCognitoId" :
                    "actorStaffCognitoId";

        await prisma.auditLog.create({
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

    } catch (error) {
        console.error("Error downloading client expense PDF:", error);
        res.status(500).json({ message: "Failed to generate PDF" });
    } finally {
        await prisma.$disconnect();
    }
};

export const downloadClientExpensesXlsx = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { id: cognitoId, role } = req.user as AuthUser;

        const {
            tab,
            period,
            agentName,
            candidateName,
            expenseCheck,
            paymentMode,
            search,
        } = req.query;

        const whereConditions: Prisma.ClientExpenseWhereInput[] = [];

        const tabValue = String(tab || "").toLowerCase().trim();
        if (tabValue === "drafts") {
            whereConditions.push({ expenseStatus: ExpenseStatus.DRAFT });
        } else if (tabValue === "approved") {
            whereConditions.push({
                expenseStatus: ExpenseStatus.APPROVED,
                paymentStatus: PaymentStatus.PAID,
            });
        } else if (tabValue === "cancelled") {
            whereConditions.push({ expenseStatus: ExpenseStatus.CANCELLED });
        } else if (tabValue === "rejected") {
            whereConditions.push({ expenseStatus: ExpenseStatus.REJECTED });
        } else {
            whereConditions.push({ expenseStatus: ExpenseStatus.PENDING });
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
                const orConditions: Prisma.ClientExpenseWhereInput[] = [
                    { candidateName: { contains: term, mode: "insensitive" } },
                    { institutionName: { contains: term, mode: "insensitive" } },
                    { agentName: { contains: term, mode: "insensitive" } },
                    { clientList: { customClientName: { contains: term, mode: "insensitive" } } },
                ];
                const matchingEnums = Object.values(ClientName).filter((name) =>
                    name.toLowerCase().includes(term.toLowerCase())
                );
                if (matchingEnums.length > 0) {
                    orConditions.push({ clientList: { clientName: { in: matchingEnums } } });
                }
                whereConditions.push({ OR: orConditions });
            }
        }

        if (agentName) whereConditions.push({ agentName: { contains: String(agentName), mode: "insensitive" } });
        if (candidateName) whereConditions.push({ candidateName: { contains: String(candidateName), mode: "insensitive" } });
        if (expenseCheck) whereConditions.push({ expenseCheck: String(expenseCheck) as ExpenseCheck });
        if (paymentMode) whereConditions.push({ paymentMode: String(paymentMode) as PaymentMode });

        if (role === "staff") {
            whereConditions.push({ createdByStaffCognitoId: cognitoId });
        }

        const where: Prisma.ClientExpenseWhereInput = { AND: whereConditions };

        const expenses = await prisma.clientExpense.findMany({
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

        const workbook = new ExcelJS.Workbook();
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
            const client = exp.clientList?.clientName || exp.clientList?.customClientName || "Unknown";
            const createdBy = exp.createdByAdmin?.name || exp.createdByAccounts?.name || exp.createdByStaff?.name || "Unknown";
            const approvedBy = exp.approvedByAdmin?.name || exp.approvedByAccounts?.name || "Not Approved";

            let account = "Pending";
            if (exp.bankAccount) account = exp.bankAccount.accountName || "Bank";
            else if (exp.cashAccount) account = exp.cashAccount.accountName || "Cash";
            else if (exp.mobileAccount) account = exp.mobileAccount.accountName || "Mobile";
            else if (exp.otherAccount) account = exp.otherAccount.accountName || "Other";

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

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=client-expenses-${new Date().toISOString().slice(0, 10)}.xlsx`
        );
        res.send(buffer);

        await logAudit(role, cognitoId, "DOWNLOAD_XLSX", "multiple", {
            count: expenses.length,
            filters: { tab, period, search },
        });
    } catch (error: any) {
        console.error("downloadClientExpensesXlsx error:", error);
        res.status(500).json({ message: "Failed to generate Excel file" });
    } finally {
        await prisma.$disconnect();
    }
};
